# Engineering Notes

Memoria concisa per problemi tecnici, proposte e decisioni trasversali emerse durante il lavoro sul progetto.

## Scopo e confini

- `TODO.md` resta il backlog operativo e le note sui dati di gioco.
- `AGENTS.md` resta la guida operativa per gli agenti e i riferimenti canonici ai file.
- Questo documento conserva solo contesto utile a riprendere un argomento senza rileggere intere conversazioni.
- Le decisioni concluse e ancora rilevanti vanno in `docs/decisions/` e qui vengono solo collegate.

## Regole di manutenzione

- Aggiungere una voce solo se contiene un problema non banale, una proposta o una decisione riutilizzabile.
- Scrivere il minimo necessario: stato, evidenza, proposta e prossimo passo.
- Non copiare codice, elenchi completi di file o dettagli già documentati altrove.
- Rimuovere una voce quando è risolta, oppure convertirla in una decisione e lasciare un breve link.
- Riesaminare le voci `Proposta` prima di ogni refactoring collegato.

## Formato delle voci

```md
### Titolo breve

- **Stato:** Proposta | In analisi | Accettata | Superata
- **Ambito:** area o percorso principale
- **Problema:** una frase verificabile
- **Proposta:** soluzione preferita e principio guida
- **Da verificare:** massimo 2–3 domande o controlli
- **Prossimo passo:** primo cambiamento concreto
```

## Aree aperte

### Standardizzare CSS e gestione dello stile

- **Stato:** In analisi
- **Ambito:** `src/styles/` e componenti React con stile locale
- **Problema:** il progetto usa approcci diversi per token, temi, layout e stili dei componenti; questo rende più difficile prevedere override, responsive behavior e manutenzione.
- **Proposta:** definire una gerarchia unica: token globali in `src/styles/tokens.css`, temi in `src/styles/theme/themes.css`, stili strutturali condivisi in `src/styles/`, e stile locale solo per regole realmente specifiche del componente. Evitare nuovi valori arbitrari quando esiste un token equivalente.
- **Da verificare:** quali componenti usano ancora valori duplicati o override ad alta specificità; se servono convenzioni di naming e breakpoint esplicite.
- **Prossimo passo:** inventariare i pattern CSS esistenti e proporre una piccola convenzione prima di effettuare migrazioni.
