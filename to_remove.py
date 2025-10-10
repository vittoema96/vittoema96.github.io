"""
Systematic literature harvesting -> ASReview-ready CSV
- Web/API aggregation (Crossref, Scopus, PubMed, arXiv, OpenAlex, Europe PMC, Zenodo, BASE,
  CEDEFOP, World Bank OKR, CORDIS, EU Pubs, UN iLibrary, ERIC)
- Robust cleaning and normalization
- Dedup: DOI -> normalized title -> fuzzy (95)
- Exports full CSV + ASReview-friendly CSV (title/abstract/authors/year/doi/url)

Requirements:
    pip install requests pandas rapidfuzz feedparser

Optional (but recommended):
    export ELSEVIER_API_KEY="..."
"""

import os
import re
import time
import json
import math
import unicodedata
import logging
from html import unescape
from xml.etree import ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

import requests
import pandas as pd
import feedparser
from rapidfuzz import fuzz
import csv  # for quoting


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)

# ---------------------------------------------------------------------
# API Keys are important to access certain API
# ---------------------------------------------------------------------
ELSEVIER_API_KEY = os.getenv("ELSEVIER_API_KEY", "ABC")
CORE_API_KEY = os.getenv("CORE_API_KEY", "XYZ")


# ---------------------------------------------------------------------
# Queries (these are set for my current literature)
# ---------------------------------------------------------------------
keywords_a = [
    "discrepancy",
    "mismatch",
    "drop-out",
    "NEET",
    "early school leaving",
]

keywords_b = [
    "general education",
    "professional education",
    "vocational education",
    "vocational training",
    "technical training",
]

standalone_terms = [
    "employment",
    "unemployment",
    "mismatch",
    "NEET",
]

paired_queries = [f"({a}) AND ({b})" for a in keywords_a for b in keywords_b]
standalone_queries = [f"({term})" for term in standalone_terms]
queries = sorted(set(paired_queries + standalone_queries))

peer_reviewed_publishers = [
    "Elsevier", "Springer", "Wiley", "SAGE", "Taylor & Francis", "Oxford University Press",
    "Cambridge University Press", "Routledge", "Emerald", "De Gruyter"
]

# Cleaned & deduped list; includes EU synonyms
european_countries = sorted(set([
    "Austria", "Belgium", "Croatia", "Czech Republic", "Denmark", "Estonia", "Finland", "France",
    "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Latvia", "Lithuania",
    "Luxembourg", "Netherlands", "Norway", "Poland", "Portugal", "Slovakia", "Slovenia", "Spain",
    "Sweden", "Switzerland", "United Kingdom", "UK", "England", "Scotland", "Wales", "Northern Ireland",
    "Albania", "Bosnia", "Serbia", "Montenegro", "North Macedonia", "Kosovo", "Moldova", "Ukraine", "Georgia",
    "Turkey",
    "European Union", "EU", "EEA", "Eurozone"
]))




def fix_encoding(text):
    if not isinstance(text, str):
        return ""
    text = unicodedata.normalize("NFKC", text)
    return text.strip()

def clean_abstract(text):
    if not isinstance(text, str):
        return ""
    text = unescape(text)
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("Â", " ")
    return fix_encoding(text)

def mentions_europe(text):
    if not isinstance(text, str):
        return False
    low = text.lower()
    return any(country.lower() in low for country in european_countries)

def is_peer_reviewed(publisher):
    if not isinstance(publisher, str):
        return False
    low = publisher.lower()
    return any(pub.lower() in low for pub in peer_reviewed_publishers)

def normalize_title_for_exact(s):
    s = fix_encoding(s).lower()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"[^\w\s]", "", s)
    return s.strip()

def normalize_doi(s):
    if not isinstance(s, str):
        return ""
    s = s.strip()
    s = re.sub(r"^https?://(dx\.)?doi\.org/", "", s, flags=re.I)
    return s.lower()

def is_http_url(s):
    if not isinstance(s, str):
        return False
    return s.startswith("http://") or s.startswith("https://")

def deduplicate_fuzzy(df, title_column="title", threshold=95):
    df = df.copy().reset_index(drop=True)
    to_drop = set()

    for i in range(len(df)):
        if i in to_drop:
            continue
        ti = df.at[i, title_column]
        if not isinstance(ti, str) or not ti.strip():
            continue
        for j in range(i + 1, len(df)):
            if j in to_drop:
                continue
            tj = df.at[j, title_column]
            if not isinstance(tj, str) or not tj.strip():
                continue
            if fuzz.ratio(ti.lower(), tj.lower()) >= threshold:
                to_drop.add(j)

    return df.drop(index=to_drop).reset_index(drop=True)




SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "litrev-harvester/1.0 (+https://example.org; contact: you@example.org)"
})

def http_get(url, **kwargs):
    # very lightweight retry
    retries = kwargs.pop("retries", 2)
    backoff = kwargs.pop("backoff", 1.5)
    for attempt in range(retries + 1):
        try:
            r = SESSION.get(url, timeout=kwargs.pop("timeout", 15), **kwargs)
            if r.status_code in (429, 500, 502, 503, 504):
                raise requests.HTTPError(f"{r.status_code} server/backoff")
            r.raise_for_status()
            return r
        except Exception:
            if attempt == retries:
                raise
            time.sleep(backoff * (attempt + 1))




def fetch_crossref(query, max_results=200):
    results = []
    print(f"\n🔍 Querying CrossRef: {query}")
    for offset in range(0, max_results, 100):
        url = "https://api.crossref.org/works"
        params = {
            "query.bibliographic": query,
            "filter": "from-pub-date:2010-01-01,until-pub-date:2025-04-30,type:journal-article",
            "rows": 100,
            "offset": offset
        }
        try:
            response = http_get(url, params=params)
            items = response.json().get("message", {}).get("items", [])
        except Exception as e:
            print(f"❌ CrossRef error: {e}")
            break

        for item in items:
            title = fix_encoding((item.get("title") or [""])[0])
            raw_abstract = item.get("abstract", "")
            cleaned_abstract = clean_abstract(raw_abstract)
            authors_list = []
            for a in item.get("author", []) or []:
                given = a.get("given", "") or ""
                family = a.get("family", "") or ""
                nm = f"{given} {family}".strip()
                if nm:
                    authors_list.append(nm)
            results.append({
                "source": "CrossRef",
                "title": title,
                "authors": fix_encoding(", ".join(authors_list)),
                "year": (item.get("issued", {}).get("date-parts", [[None]])[0][0]),
                "DOI": normalize_doi(item.get("DOI", "")),
                "publisher": fix_encoding(item.get("publisher", "")),
                "journal": fix_encoding((item.get("container-title") or [""])[0]),
                "url": item.get("URL", ""),
                "abstract": cleaned_abstract,
                "likely_peer_reviewed": is_peer_reviewed(item.get("publisher", "")),
                "mentions_europe": mentions_europe(title + " " + cleaned_abstract),
            })
        time.sleep(0.5)
    return results

def fetch_elsevier(query, api_key, max_results=200):
    results = []
    print(f"\n🔍 Querying Elsevier Scopus: {query}")
    headers = {"X-ELS-APIKey": api_key, "Accept": "application/json"}
    base_url = "https://api.elsevier.com/content/search/scopus"

    for start in range(0, max_results, 25):
        params = {"query": query, "count": 25, "start": start}
        try:
            response = http_get(base_url, headers=headers, params=params)
            items = response.json().get("search-results", {}).get("entry", [])
        except Exception as e:
            print(f"❌ Elsevier error: {e}")
            break

        for item in items:
            title = fix_encoding(item.get("dc:title", ""))
            abstract = clean_abstract("")  # search API rarely provides abstracts
            results.append({
                "source": "Elsevier (Scopus)",
                "title": title,
                "authors": fix_encoding(item.get("dc:creator", "")),
                "year": (item.get("prism:coverDate", "")[:4] or None),
                "DOI": normalize_doi(item.get("prism:doi", "")),
                "publisher": "Elsevier",
                "journal": fix_encoding(item.get("prism:publicationName", "")),
                "url": item.get("prism:url", ""),
                "abstract": abstract,
                "likely_peer_reviewed": True,
                "mentions_europe": mentions_europe(title),
            })
        time.sleep(0.5)
    return results

def fetch_pubmed(query, max_results=200):
    results = []
    print(f"\n🔍 Querying PubMed: {query}")
    base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
    try:
        search_resp = http_get(base + "esearch.fcgi",
                               params={"db": "pubmed", "term": query, "retmax": max_results, "retmode": "json"})
        ids = search_resp.json().get("esearchresult", {}).get("idlist", [])
        if not ids:
            return results
        fetch_resp = http_get(base + "efetch.fcgi",
                              params={"db": "pubmed", "id": ",".join(ids), "retmode": "xml"})
        root = ET.fromstring(fetch_resp.content)
        for article in root.findall(".//PubmedArticle"):
            title_elem = article.find(".//ArticleTitle")
            abstract_elem = article.find(".//Abstract/AbstractText")
            title = fix_encoding(title_elem.text if title_elem is not None else "")
            abstract = clean_abstract(abstract_elem.text if abstract_elem is not None else "")
            # Authors
            authors = []
            for author in article.findall(".//Author"):
                last = author.find("LastName")
                first = author.find("ForeName")
                if (last is not None and last.text) or (first is not None and first.text):
                    authors.append(f"{(first.text or '').strip()} {(last.text or '').strip()}".strip())
            # Year
            year = None
            y1 = article.find(".//PubDate/Year")
            if y1 is not None and y1.text and y1.text.isdigit():
                year = int(y1.text)
            else:
                md = article.find(".//PubDate/MedlineDate")
                if md is not None and md.text:
                    m = re.search(r"\b(19|20)\d{2}\b", md.text)
                    if m:
                        year = int(m.group(0))
            # DOI extraction
            doi = ""
            for aid in article.findall(".//ArticleIdList/ArticleId"):
                if aid.get("IdType") == "doi" and aid.text:
                    doi = normalize_doi(aid.text)
                    break
            results.append({
                "source": "PubMed",
                "title": title,
                "authors": fix_encoding(", ".join(authors)),
                "year": year,
                "DOI": doi,
                "publisher": "PubMed",
                "journal": "",
                "url": "",
                "abstract": abstract,
                "likely_peer_reviewed": True,
                "mentions_europe": mentions_europe(title + " " + abstract),
            })
    except Exception as e:
        print(f"❌ PubMed error: {e}")
    return results

def fetch_arxiv(query, max_results=200):
    results = []
    print(f"\n🔍 Querying arXiv: {query}")
    base_url = "http://export.arxiv.org/api/query"
    params = {"search_query": query, "start": 0, "max_results": max_results}
    try:
        response = http_get(base_url, params=params)
        feed = feedparser.parse(response.content)
        for entry in feed.entries:
            title = fix_encoding(entry.title)
            abstract = clean_abstract(entry.summary)
            authors = fix_encoding(", ".join(a.name for a in entry.authors))
            year = int(entry.published[:4]) if entry.published and entry.published[:4].isdigit() else None
            results.append({
                "source": "arXiv",
                "title": title,
                "authors": authors,
                "year": year,
                "DOI": "",
                "publisher": "arXiv",
                "journal": "",
                "url": entry.link,
                "abstract": abstract,
                "likely_peer_reviewed": False,
                "mentions_europe": mentions_europe(title + " " + abstract),
            })
    except Exception as e:
        print(f"❌ arXiv error: {e}")
    return results

# OpenAlex abstract helper (inverted index -> text)
def _openalex_abstract(inv_idx):
    if not isinstance(inv_idx, dict) or not inv_idx:
        return ""
    max_pos = 0
    for positions in inv_idx.values():
        max_pos = max(max_pos, max(positions))
    words = [""] * (max_pos + 1)
    for w, positions in inv_idx.items():
        for p in positions:
            if 0 <= p < len(words):
                words[p] = w
    return " ".join(words).strip()

def fetch_openalex(query, max_results=200):
    results = []
    print(f"\n🔍 Querying OpenAlex: {query}")
    base_url = "https://api.openalex.org/works"
    params = {"search": query, "per-page": max_results}
    try:
        r = http_get(base_url, params=params)
        for item in r.json().get("results", []):
            title = fix_encoding(item.get("title", ""))
            abstract = clean_abstract(_openalex_abstract(item.get("abstract_inverted_index")))
            authors = fix_encoding(", ".join(
                (a.get("author", {}) or {}).get("display_name", "")
                for a in (item.get("authorships") or [])
            ))
            year = item.get("publication_year", None)
            results.append({
                "source": "OpenAlex",
                "title": title,
                "authors": authors,
                "year": year,
                "DOI": normalize_doi(item.get("doi", "")),
                "publisher": (item.get("host_venue", {}) or {}).get("publisher", ""),
                "journal": (item.get("host_venue", {}) or {}).get("display_name", ""),
                "url": item.get("id", ""),
                "abstract": abstract,
                "likely_peer_reviewed": True,
                "mentions_europe": mentions_europe(title + " " + abstract),
            })
    except Exception as e:
        print(f"❌ OpenAlex error: {e}")
    return results

def fetch_europe_pmc(query, max_results=200):
    results = []
    print(f"\n🔍 Querying Europe PMC: {query}")
    base_url = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
    params = {"query": query, "format": "json", "pageSize": max_results}
    try:
        response = http_get(base_url, params=params)
        items = response.json().get("resultList", {}).get("result", [])
        for item in items:
            title = fix_encoding(item.get("title", ""))
            abstract = clean_abstract(item.get("abstractText", ""))
            authors = fix_encoding(item.get("authorString", ""))
            year = item.get("pubYear", None)
            # Full text URL extraction (list nested in dict)
            url = ""
            ft = item.get("fullTextUrlList", {})
            if isinstance(ft, dict):
                arr = ft.get("fullTextUrl", [])
                if arr and isinstance(arr, list):
                    url = arr[0].get("url", "") or ""
            results.append({
                "source": "Europe PMC",
                "title": title,
                "authors": authors,
                "year": year,
                "DOI": normalize_doi(item.get("doi", "")),
                "publisher": item.get("publisher", ""),
                "journal": item.get("journalTitle", ""),
                "url": url,
                "abstract": abstract,
                "likely_peer_reviewed": True,
                "mentions_europe": mentions_europe(title + " " + abstract),
            })
    except Exception as e:
        print(f"❌ Europe PMC error: {e}")
    return results

def fetch_zenodo(query, max_results=200):
    results = []
    logging.info(f"\n🔍 Querying Zenodo: {query}")
    base_url = "https://zenodo.org/api/records"
    params = {"q": query, "size": max_results, "sort": "bestmatch"}
    try:
        response = http_get(base_url, params=params)
        items = response.json().get("hits", {}).get("hits", [])
        for item in items:
            metadata = item.get("metadata", {}) or {}
            title = fix_encoding(metadata.get("title", ""))
            abstract = clean_abstract(metadata.get("description", ""))
            authors = fix_encoding(", ".join([c.get("name", "") for c in (metadata.get("creators") or [])]))
            year = metadata.get("publication_date", "")[:4] if metadata.get("publication_date") else None
            results.append({
                "source": "Zenodo",
                "title": title,
                "authors": authors,
                "year": year,
                "DOI": normalize_doi(metadata.get("doi", "")),
                "publisher": metadata.get("publisher", ""),
                "journal": "",
                "url": (item.get("links", {}) or {}).get("html", ""),
                "abstract": abstract,
                "likely_peer_reviewed": False,
                "mentions_europe": mentions_europe(title + " " + abstract),
            })
    except Exception as e:
        logging.info(f"❌ Zenodo error: {e}")
    return results

def fetch_base(query, max_results=200):
    results = []
    logging.info(f"\n🔍 Querying BASE: {query}")
    base_url = "https://api.base-search.net/cgi-bin/BaseHttpSearchInterface.fcgi"
    params = {"func": "PerformSearch", "query": query, "hits": max_results, "format": "json"}
    try:
        response = http_get(base_url, params=params)
        items = response.json().get("response", {}).get("docs", [])
        for item in items:
            title = fix_encoding(item.get("title", ""))
            authors = fix_encoding(", ".join(item.get("creator", []) or []))
            year = item.get("year", None)
            url = ""
            link = item.get("link", [])
            if isinstance(link, list) and link:
                url = link[0]
            elif isinstance(link, str):
                url = link
            results.append({
                "source": "BASE",
                "title": title,
                "authors": authors,
                "year": year,
                "DOI": "",
                "publisher": item.get("publisher", ""),
                "journal": "",
                "url": url,
                "abstract": "",
                "likely_peer_reviewed": False,
                "mentions_europe": mentions_europe(title),
            })
    except Exception as e:
        logging.info(f"❌ BASE error: {e}")
    return results

def fetch_cedefop(query, max_results=200):
    logging.info(f"\n🔍 Scraping CEDEFOP for: {query}")
    base_url = "https://www.cedefop.europa.eu/en/publications-and-resources/publications"
    params = {"search": query}
    results = []
    try:
        response = http_get(base_url, params=params)
        matches = re.findall(r'<a href="(/en/publications-and-resources/publications[^"]+)"[^>]*>([^<]+)</a>', response.text)
        for path, title in matches[:max_results]:
            full_url = f"https://www.cedefop.europa.eu{path}"
            title_clean = fix_encoding(title)
            results.append({
                "source": "CEDEFOP",
                "title": title_clean,
                "authors": "",
                "year": "",
                "DOI": "",
                "publisher": "CEDEFOP",
                "journal": "",
                "url": full_url,
                "abstract": "",
                "likely_peer_reviewed": False,
                "mentions_europe": mentions_europe(title_clean),
            })
    except Exception as e:
        logging.info(f"❌ CEDEFOP scraping error: {e}")
    return results

def fetch_worldbank_docs(query, max_results=200):
    logging.info(f"\n🔍 Scraping World Bank OKR: {query}")
    base_url = "https://openknowledge.worldbank.org/discover"
    params = {"scope": ":", "query": query}
    results = []
    try:
        response = http_get(base_url, params=params)
        matches = re.findall(r'<a href="(/handle/[\d/]+)">([^<]+)</a>', response.text)
        for path, title in matches[:max_results]:
            full_url = f"https://openknowledge.worldbank.org{path}"
            title_clean = fix_encoding(title)
            results.append({
                "source": "World Bank",
                "title": title_clean,
                "authors": "",
                "year": "",
                "DOI": "",
                "publisher": "World Bank",
                "journal": "",
                "url": full_url,
                "abstract": "",
                "likely_peer_reviewed": False,
                "mentions_europe": mentions_europe(title_clean),
            })
    except Exception as e:
        logging.info(f"❌ World Bank scraping error: {e}")
    return results

def fetch_cordis_projects(query, max_results=200):
    logging.info(f"\n🔍 Scraping CORDIS: {query}")
    search_url = "https://cordis.europa.eu/projects/en"
    results = []
    try:
        response = http_get(search_url, headers={"User-Agent": "Mozilla/5.0"})
        matches = re.findall(r'<a href="(/project/id/[^"]+)"[^>]*>([^<]+)</a>', response.text)
        for path, title in matches[:max_results]:
            full_url = f"https://cordis.europa.eu{path}"
            title_clean = fix_encoding(title)
            results.append({
                "source": "CORDIS",
                "title": title_clean,
                "authors": "",
                "year": "",
                "DOI": "",
                "publisher": "European Commission",
                "journal": "",
                "url": full_url,
                "abstract": "",
                "likely_peer_reviewed": False,
                "mentions_europe": True,
            })
    except Exception as e:
        logging.info(f"❌ CORDIS scraping error: {e}")
    return results

def fetch_eu_policies(query, max_results=200):
    logging.info(f"\n🔍 Scraping EU Publications for: {query}")
    search_url = ("https://op.europa.eu/en/search-results"
                  "?p_p_id=eu_publications_portlet_search_results"
                  "&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view"
                  f"&_eu_publications_portlet_search_results_keywords={query.replace(' ', '+')}")
    results = []
    try:
        response = http_get(search_url)
        matches = re.findall(r'<a href="(/en/publication-detail/[^"]+)"[^>]*>([^<]+)</a>', response.text)
        for path, title in matches[:max_results]:
            full_url = f"https://op.europa.eu{path}"
            title_clean = fix_encoding(title)
            results.append({
                "source": "EU Publications",
                "title": title_clean,
                "authors": "",
                "year": "",
                "DOI": "",
                "publisher": "EU Publications Office",
                "journal": "",
                "url": full_url,
                "abstract": "",
                "likely_peer_reviewed": False,
                "mentions_europe": True,
            })
    except Exception as e:
        logging.info(f"❌ EU Publications scraping error: {e}")
    return results

def fetch_un_ilibrary(query, max_results=200):
    logging.info(f"\n🔍 Scraping UN iLibrary for: {query}")
    base_url = "https://www.un-ilibrary.org/search"
    params = {"q": query.replace(" ", "+"), "pageSize": max_results}
    results = []
    try:
        response = http_get(base_url, params=params)
        matches = re.findall(r'<a href="(/[^"]+)"[^>]*class="title">([^<]+)</a>', response.text)
        for path, title in matches[:max_results]:
            full_url = f"https://www.un-ilibrary.org{path}"
            title_clean = fix_encoding(title)
            results.append({
                "source": "UN iLibrary",
                "title": title_clean,
                "authors": "",
                "year": "",
                "DOI": "",
                "publisher": "United Nations",
                "journal": "",
                "url": full_url,
                "abstract": "",
                "likely_peer_reviewed": False,
                "mentions_europe": mentions_europe(title_clean),
            })
    except Exception as e:
        logging.info(f"❌ UN iLibrary error: {e}")
    return results

def fetch_eric(query, max_results=200):
    logging.info(f"\n🔍 Scraping ERIC: {query}")
    base_url = "https://eric.ed.gov/?q=" + query.replace(" ", "+")
    results = []
    try:
        response = http_get(base_url)
        matches = re.findall(r'<a href="(/?id=ED\d+)"[^>]*>([^<]+)</a>', response.text)
        for path, title in matches[:max_results]:
            full_url = f"https://eric.ed.gov/{path.lstrip('/')}"
            title_clean = fix_encoding(title)
            results.append({
                "source": "ERIC",
                "title": title_clean,
                "authors": "",
                "year": "",
                "DOI": "",
                "publisher": "ERIC",
                "journal": "",
                "url": full_url,
                "abstract": "",
                "likely_peer_reviewed": False,
                "mentions_europe": mentions_europe(title_clean),
            })
    except Exception as e:
        logging.info(f"❌ ERIC scraping error: {e}")
    return results




FETCHERS = [
    lambda q: fetch_crossref(q),
    lambda q: fetch_elsevier(q, ELSEVIER_API_KEY),
    lambda q: fetch_pubmed(q),
    lambda q: fetch_arxiv(q),
    lambda q: fetch_openalex(q),
    # lambda q: fetch_core(q, CORE_API_KEY),
    lambda q: fetch_europe_pmc(q),
    lambda q: fetch_zenodo(q),
    lambda q: fetch_base(q),
    lambda q: fetch_cedefop(q),
    lambda q: fetch_worldbank_docs(q),
    lambda q: fetch_cordis_projects(q),
    lambda q: fetch_eu_policies(q),
    lambda q: fetch_un_ilibrary(q),
    lambda q: fetch_eric(q),
    # lambda q: fetch_semantic_scholar(q, SEMANTIC_SCHOLAR_API_KEY),
]

def fetch_all_sources_for_query(query):
    all_results = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(fn, query) for fn in FETCHERS]
        for f in futures:
            try:
                all_results.extend(f.result())
            except Exception as e:
                logging.error(f"❌ Thread error: {e}")
    return all_results

# ---------------------------------------------------------------------
# Validator / fixer (embedded)
# ---------------------------------------------------------------------

# settings
MAX_ABSTRACT_FOR_CSV = 120_000   # keep well below the 128k parser limit
MAX_TITLE_FOR_CSV    = 8_000
WRITE_XLSX_TOO       = True      # Excel-friendly copy

def _read_any(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    for enc in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return pd.read_csv(path, encoding=enc)
        except Exception:
            continue
    return pd.read_csv(path, engine="python")

HEADER_MAP = {
    "title": ["title", "primary_title", "document_title", "item_title"],
    "abstract": ["abstract", "abstract_note", "summary", "description"],
    "authors": ["authors", "author", "author_names", "creators"],
    "year": ["year", "pub_year", "publication_year", "date"],
    "doi": ["doi", "DOI", "identifier_doi"],
    "url": ["url", "link", "fulltext", "source_url"],
}

def _find_column(df, options):
    for cand in options:
        if cand in df.columns:
            return cand
        for c in df.columns:
            if c.strip().lower() == cand.strip().lower():
                return c
    return None

def _normalize_doi(s):
    if not isinstance(s, str):
        return ""
    s = s.strip()
    s = re.sub(r"^https?://(dx\.)?doi\.org/", "", s, flags=re.I)
    return s.lower()

def _is_http(s):
    return isinstance(s, str) and (s.startswith("http://") or s.startswith("https://"))

def _norm_title(s):
    if not isinstance(s, str):
        return ""
    s = s.lower()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"[^\w\s]", "", s)
    return s.strip()

def validate_and_fix(path):
    df = _read_any(path)
    orig_len = len(df)

    # map/rename headers to the ASReview set
    rename = {}
    for std, opts in HEADER_MAP.items():
        col = _find_column(df, opts)
        if col and col != std:
            rename[col] = std
    if rename:
        df = df.rename(columns=rename)

    # ensure all expected columns exist
    for c in ["title", "abstract", "authors", "year", "doi", "url"]:
        if c not in df.columns:
            df[c] = ""

    # cast to string and strip (except year)
    for c in ["title", "abstract", "authors", "doi", "url"]:
        df[c] = df[c].fillna("").astype(str).str.strip()

    # year → Int64 (nullable)
    df["year"] = pd.to_numeric(df["year"], errors="coerce").astype("Int64")

    # drop rows missing both title and abstract
    before = len(df)
    df = df[(df["title"] != "") | (df["abstract"] != "")]
    dropped_both_empty = before - len(df)

    # normalize doi
    df["doi"] = df["doi"].apply(_normalize_doi)

    # check giant cells (CSV parsers choke >128k)
    max_abs = df["abstract"].map(lambda x: len(x) if isinstance(x, str) else 0).max()
    max_ttl = df["title"].map(lambda x: len(x) if isinstance(x, str) else 0).max()
    warn_big = (max_abs and max_abs > MAX_ABSTRACT_FOR_CSV) or (max_ttl and max_ttl > MAX_TITLE_FOR_CSV)

    # diagnostics: duplicates
    by_doi_dups = df[df["doi"].ne("")].duplicated(subset=["doi"]).sum()
    df["__nt__"] = df["title"].map(_norm_title)
    by_title_dups = df[df["__nt__"].ne("")].duplicated(subset=["__nt__"]).sum()

    # keep at least a DOI or a URL or some text
    has_doi = df["doi"].str.startswith("10.")
    has_url = df["url"].map(_is_http)
    keep_mask = has_doi.fillna(False) | has_url.fillna(False) | (df["title"] != "") | (df["abstract"] != "")
    df = df[keep_mask].drop(columns=["__nt__"]).copy()

    # trim extreme cells for CSV safety
    df["abstract"] = df["abstract"].str.slice(0, MAX_ABSTRACT_FOR_CSV)
    df["title"]    = df["title"].str.slice(0, MAX_TITLE_FOR_CSV)

    # build the exact ASReview view
    asr = df.rename(columns={"doi": "doi"})[["title", "abstract", "authors", "year", "doi", "url"]]

    # write cleaned outputs
    base, _ = os.path.splitext(path)
    csv_out  = f"{base}_CLEAN.csv"
    asr.to_csv(csv_out, index=False, encoding="utf-8-sig", quoting=csv.QUOTE_MINIMAL)

    xlsx_out = None
    if WRITE_XLSX_TOO:
        xlsx_out = f"{base}_CLEAN.xlsx"
        asr.to_excel(xlsx_out, index=False)

    # summary
    print("\n=== ASReview dataset check ===")
    print(f"Input rows: {orig_len}")
    print(f"Dropped missing (title AND abstract): {dropped_both_empty}")
    print(f"Remaining rows: {len(asr)}")
    print(f"Max title length: {max_ttl}  |  Max abstract length: {max_abs}")
    print(f"Duplicate DOIs (would be merged if you dedup later): {by_doi_dups}")
    print(f"Duplicate titles (normalized): {by_title_dups}")
    print(f"\nWrote CSV (UTF-8 BOM): {csv_out}")
    if xlsx_out:
        print(f"Wrote XLSX (Excel-friendly): {xlsx_out}")
    if warn_big:
        print("\n⚠️  Note: You had very long cells. We trimmed for CSV safety. "
              "Use the XLSX file if you prefer no trimming for viewing in Excel.")
    print("\nColumns for ASReview:", list(asr.columns))
    print("✅ Ready to import into ASReview LAB (map Title=title, Abstract=abstract, etc.)")




def main():
    # ===== PRISMA counters =====
    prisma = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M"),
        "by_source": {},
        "n_collected": 0,         # raw items from all sources (pre-DataFrame)
        "n_after_df": 0,          # after building df
        "n_after_nonempty": 0,    # after dropping rows with empty title & abstract
        "n_after_doi": 0,         # after DOI dedup
        "n_after_title_norm": 0,  # after exact title-norm dedup
        "n_after_fuzzy": 0,       # after fuzzy dedup
        "n_after_eu_filter": None,# after optional EU filter
        "n_final": 0              # final usable set before export
    }

    # Toggle this if you want to keep only records that clearly mention Europe/EU
    EU_ONLY = False  # set True to enforce Europe scope using mentions_europe()

    # ===== 1) Harvest =====
    all_rows = []
    for query in queries:
        all_rows.extend(fetch_all_sources_for_query(query))
    prisma["n_collected"] = len(all_rows)

    # ===== 2) Build DataFrame =====
    df = pd.DataFrame(all_rows)
    if "source" in df.columns:
        prisma["by_source"] = df["source"].value_counts(dropna=False).to_dict()
    prisma["n_after_df"] = int(len(df))

    # ===== 3) Ensure expected columns exist =====
    expected = [
        "source", "title", "authors", "year", "DOI", "publisher",
        "journal", "url", "abstract", "likely_peer_reviewed", "mentions_europe"
    ]
    for col in expected:
        if col not in df.columns:
            df[col] = ""

    # ===== 4) Normalize key fields =====
    for col in ["title", "abstract", "authors", "DOI", "url", "publisher", "journal"]:
        df[col] = df[col].fillna("").astype(str).str.strip()

    # normalize DOI and year
    df["DOI"] = df["DOI"].apply(normalize_doi)
    df["year"] = pd.to_numeric(df["year"], errors="coerce").astype("Int64")

    # keep rows that have at least a title OR an abstract
    df = df[(df["title"] != "") | (df["abstract"] != "")].copy()
    prisma["n_after_nonempty"] = int(len(df))

    # ===== 5) De-duplicate =====
    # 5a) by DOI (only where DOI is non-empty)
    mask_doi = df["DOI"] != ""
    df = pd.concat(
        [df[mask_doi].drop_duplicates(subset=["DOI"]), df[~mask_doi]],
        ignore_index=True
    )
    prisma["n_after_doi"] = int(len(df))

    # 5b) by normalized title (exact)
    df["__norm_title__"] = df["title"].apply(normalize_title_for_exact)
    df = df.drop_duplicates(subset=["__norm_title__"]).reset_index(drop=True)
    prisma["n_after_title_norm"] = int(len(df))
    df = df.drop(columns=["__norm_title__"])

    # 5c) fuzzy title (95)
    df = deduplicate_fuzzy(df, title_column="title", threshold=95)
    prisma["n_after_fuzzy"] = int(len(df))

    # ===== (Optional) EU-only filter =====
    if EU_ONLY:
        # rely on your mentions_europe() flag computed from title+abstract
        if "mentions_europe" not in df.columns:
            df["mentions_europe"] = df.apply(
                lambda r: mentions_europe((r.get("title","") or "") + " " + (r.get("abstract","") or "")),
                axis=1
            )
        df = df[df["mentions_europe"] == True].copy()  # noqa: E712
        prisma["n_after_eu_filter"] = int(len(df))

    # ===== 6) Keep records that are usable =====
    # Preferably DOI or URL; but allow title/abstract-only too (your current policy)
    has_doi = df["DOI"].str.startswith("10.")
    has_url = df["url"].str.startswith(("http://", "https://"))
    df = df[has_doi.fillna(False) | has_url.fillna(False) | (df["title"] != "") | (df["abstract"] != "")].copy()
    prisma["n_final"] = int(len(df))

    # ===== 7) Save full harvest =====
    output_file = f"Final_articles_litrev{time.strftime('%Y%m%d')}.csv"
    df.to_csv(output_file, index=False, encoding="utf-8-sig", quoting=csv.QUOTE_MINIMAL)
    logging.info(f"✅ Saved {len(df)} records to {output_file}")

    # ===== 8) Build ASReview view =====
    asreview_df = df.rename(columns={"DOI": "doi"})[
        ["title", "abstract", "authors", "year", "doi", "url"]
    ]

    # ===== 9) Write raw ASReview CSV (for later screening) =====
    output_asreview_file = f"asreview_input_{time.strftime('%Y%m%d')}.csv"
    asreview_df.to_csv(output_asreview_file, index=False, encoding="utf-8-sig", quoting=csv.QUOTE_MINIMAL)
    validate_and_fix(output_asreview_file)

    # ===== 11) Save PRISMA counters (main framework for systematic literature review) =====
    with open("prisma_counts.json", "w", encoding="utf-8") as f:
        json.dump(prisma, f, ensure_ascii=False, indent=2)
    print("\n📈 PRISMA counters written to prisma_counts.json")

    print(f"\n✅ Wrote raw ASReview file: {output_asreview_file}")
    print(f"👉 Import into ASReview: {output_asreview_file.replace('.csv', '_CLEAN.csv')} "
          f"(or the _CLEAN.xlsx sitting next to it))")

    # (optional) quick summary
    if "source" in df.columns:
        print("\n📊 Source breakdown:\n", df["source"].value_counts(dropna=False))


if __name__ == "__main__":
    main()