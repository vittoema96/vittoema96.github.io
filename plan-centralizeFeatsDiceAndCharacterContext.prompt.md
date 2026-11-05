# Piano di refactoring: centralizzazione feat, motore dadi e CharacterContext

## Obiettivo

Migliorare l’architettura delle regole di gioco e dei popup senza fare una riscrittura globale, mantenendo separati i domini D20 e D6 ma centralizzando ciò che è realmente comune.

Le aree da affrontare sono:

1. centralizzazione e verifica della copertura di perk e trait;
2. semplificazione di `D6Popup.tsx` in relazione a `D20Popup.tsx`, `Nd20Popup.tsx`, `Nd6Popup.tsx` e `NdXPopup.tsx`;
3. riduzione delle responsabilità di `CharacterContext.tsx`.

## Principio architetturale

Non rendere D20 e D6 lo stesso popup.

Rendere invece i due popup consumatori di:

- uno stesso motore di sessione dei dadi;
- capability tipizzate per perk e trait;
- calcolatori puri specifici per skill check e damage roll;
- componenti UI comuni solo dove il comportamento è realmente uguale.

## Fase 0 — Inventario e contratti, senza grande refactoring

Prima di spostare codice costruire una fotografia verificabile dello stato attuale.

### Matrice perk/trait

Per ogni perk e trait presenti nei source data, rilevare:

- presenza nel dataset;
- presenza di una implementation;
- caricamento nel registry;
- capability implementate;
- uso diretto in componenti UI o calcolatori;
- stato: implementato, parziale, non implementato.

Esempi già individuati:

- `traitGrunt` è centralizzato per il danno, ma parte della sua logica sulle complicazioni è ancora in `D20Popup.tsx`;
- `traitHeavyHanded` è gestito direttamente da `D20Popup.tsx` e `meleeDamage.ts`, ma non ha una implementation file equivalente;
- `perkMysteriousStranger` è importato direttamente dalla UI;
- i file con prefisso `_`, come `_perkMysteriousStranger.ts` e `_perkIronFist.ts`, non corrispondono al glob `perk*.ts` del registry;
- il dataset contiene molti più perk dei file di implementation presenti.

### Contratto delle roll action

Verificare e uniformare il contratto di `FeatRollAction`:

- costi AP;
- costi Luck;
- costi munizioni;
- numero massimo di usi;
- condizioni di applicabilità;
- contenuto visualizzato;
- azioni che aprono un modal secondario.

Il contratto attuale dichiara costi `ammo` e `luck`, mentre `perkGunFu.ts` usa anche `ap`. Inoltre il consumo delle risorse viene interpretato direttamente da `D6Popup.tsx`.

### Hook dichiarati ma non eseguiti

Verificare i metodi dichiarati da `FeatImplementation` ma non ancora integrati in una pipeline effettiva:

- `applyPassiveModifiers`;
- `onExecuteAction`;
- `onBeforeRoll`.

Decidere se implementarli, rimuoverli oppure sostituirli con capability più precise.

## Fase 1 — Stabilizzare la centralizzazione di perk e trait

### Obiettivo

Fare in modo che ogni regola relativa a un perk o trait sia dichiarata una volta sola e consumata dai diversi sistemi interessati.

### Capability suggerite

Definire capability tipizzate, senza obbligare ogni feat a implementarle tutte:

```text
FeatDefinition
├── passiveModifiers
├── itemModifiers
├── skillRollModifiers
├── damageRollModifiers
├── rollActions
├── resourceCosts
└── availabilityRules
```

Le capability devono poter essere usate da:

- calcoli del personaggio;
- skill check;
- damage roll;
- lista delle azioni disponibili;
- popup secondari.

### Prima estrazione concreta

Rimuovere progressivamente da `D20Popup.tsx` i controlli diretti come:

```typescript
rollerTraits.includes('traitHeavyHanded')
rollerTraits.includes('traitGrunt')
```

e sostituirli con una funzione centralizzata che restituisca i modificatori di complicazione del tiro.

### Registry

Rendere il registry una fonte unica e verificabile:

- correggere il pattern di caricamento oppure adottare un registry esplicito;
- evitare import diretti delle implementation dalla UI;
- distinguere chiaramente feat implementati e feat solo presenti nei dati;
- aggiungere una validazione che segnali implementation duplicate, ID sconosciuti e feat con comportamento non registrato.

## Fase 2 — Motore comune per le sessioni di tiro

## Strato A — Motore puro dei dadi

Creare un modulo indipendente da React e dal personaggio:

```text
src/features/dice/
  rollDice.ts
  diceSessionReducer.ts
  diceSessionTypes.ts
  diceResultUtils.ts
```

Responsabilità:

- generazione dei risultati;
- attivazione/disattivazione dei dadi;
- gestione dei reroll;
- conteggio dei dadi attivi;
- blocco dei dadi già rilanciati;
- transizioni `hasRolled`.

Nessuna dipendenza da traduzioni, popup o `CharacterContext`.

## Strato B — Hook React

Introdurre o evolvere un hook comune:

```text
src/hooks/useDiceSession.ts
```

Responsabilità:

- collegare il reducer a React;
- esporre `roll`, `reroll`, `toggleDie`, `reset`;
- mantenere un adapter compatibile con l’attuale `useDice` durante la migrazione.

## Strato C — Regole specifiche

Separare le regole di dominio:

```text
src/features/rolls/
  skillCheckRules.ts
  damageRollRules.ts
  genericD20Rules.ts
  genericD6Rules.ts
```

### Skill check

Estrarre da `D20Popup.tsx`:

- costruzione di `rollerStats`;
- calcolo dello SPECIAL effettivo;
- target number;
- valore critico;
- valore di complicazione;
- costo Luck;
- conteggio dei successi;
- transizione di tiro e reroll.

La discriminated union `player | companion | stranger` è valida e va mantenuta, ma la sua costruzione dovrebbe stare in un adapter o hook separato.

### Damage roll

Estrarre da `D6Popup.tsx`:

- `calculateDamageResult()`;
- calcolo del costo Luck;
- calcolo del costo munizioni;
- consumo delle risorse;
- gestione degli effetti arma;
- azioni dei perk;
- transizioni della sessione di tiro.

Scomporre inoltre la UI in componenti con responsabilità limitate:

```text
src/app/components/popup/dice/
  D6Popup.tsx
  D6DiceSection.tsx
  D6WeaponSummary.tsx
  D6RollActions.tsx
  HitLocationSelector.tsx
  MeltdownDialog.tsx
```

`D6Popup.tsx` deve diventare un coordinatore UI, non il luogo in cui vivono tutte le regole.

## `NdXPopup`, `Nd20Popup` e `Nd6Popup`

Mantenere la struttura:

```text
Nd20Popup / Nd6Popup
          ↓
       NdXPopup
```

Evolvere `NdXPopup` affinché utilizzi lo stesso motore di sessione dei dadi.

Spostare in funzioni pure i calcoli oggi presenti negli adapter:

- totale D20;
- critici D20;
- fallimenti/complicazioni D20;
- danno D6;
- effetti D6.

`NdXPopup` deve centralizzare lifecycle e rendering comune, ma non le regole di skill check o damage roll.

## Fase 3 — Semplificazione di `CharacterContext`

### Responsabilità da estrarre

`CharacterContext.tsx` oggi gestisce contemporaneamente:

- adapter React dello store Zustand;
- validazione Zod;
- merge parziale dei dati;
- correzione HP;
- riconciliazione dell’equipaggiamento;
- aggiunta automatica delle parti robot;
- accesso ai dataset item;
- valori calcolati del personaggio.

### Mutazioni di dominio

Spostare `updateItems()` in una funzione pura, ad esempio:

```text
src/features/character/mutations/
  updateCharacter.ts
  reconcileCharacterItems.ts
  adjustCurrentHp.ts
```

Contratto suggerito:

```text
reconcileCharacterItems(previousCharacter, nextCharacter) → nextCharacter
```

La funzione deve restituire un nuovo oggetto invece di mutare `updatedCharacter` internamente.

### Pipeline di aggiornamento esplicita

Estrarre una funzione di dominio che renda esplicita la pipeline:

```text
partial update
  → merge strutturato
  → validazione/normalizzazione
  → correzione HP
  → riconciliazione item/equipaggiamento
  → persistenza
```

`CharacterContext` dovrebbe limitarsi a:

- leggere il personaggio attivo;
- esporre le azioni;
- delegare la mutazione alla funzione di dominio;
- fornire i valori calcolati.

### Store Zustand

Valutare selettori più granulari al posto di `useSaveStore()` senza selettori, per evitare che il provider sia sottoscritto a tutto lo store.

Separare in seguito, solo se necessario:

```text
ActiveCharacterContext
SaveSlotsContext
```

Non cambiare subito l’API pubblica di `useCharacter` finché le mutazioni di dominio non sono state estratte.

### Migrazioni storage

Spostare l’accesso diretto a `localStorage` durante l’import del modulo fuori da `useSaveStore.ts`.

La migrazione delle chiavi legacy dovrebbe essere una funzione di bootstrap o di storage isolata, più facile da testare e sicura in ambienti non-browser.

## Strategia di test

Prima di scomporre i componenti React, aggiungere test alle funzioni pure più sensibili:

1. registry e copertura perk/trait;
2. migrazioni di `RawCharacterSchema`;
3. calcolo item modificato;
4. parsing e applicazione degli effetti mod;
5. calcolo danno, Luck e munizioni;
6. calcolo skill check, critici e complicazioni;
7. selettori dell’inventario;
8. solo dopo test di rendering dei popup principali.

## Ordine di esecuzione

### Step 1 — Contratti e copertura

- costruire la matrice perk/trait;
- correggere il contratto delle roll action;
- decidere il trattamento dei perk non implementati;
- decidere il caricamento del registry;
- aggiungere test di copertura del registry.

### Step 2 — Regole centralizzate

- spostare le eccezioni di `D20Popup.tsx` nel sistema feat;
- definire modificatori di complicazione, critici e costi come capability;
- eliminare progressivamente gli import diretti delle implementation dalla UI.

### Step 3 — Sessione dadi comune

- estrarre il motore puro;
- introdurre `useDiceSession`;
- migrare prima `NdXPopup`;
- migrare `Nd20Popup` e `Nd6Popup`;
- migrare `D20Popup`;
- migrare `D6Popup`.

### Step 4 — CharacterContext

- estrarre `reconcileCharacterItems()`;
- estrarre la pipeline di aggiornamento;
- migliorare selettori Zustand;
- isolare le migrazioni storage;
- valutare la separazione tra personaggio attivo e slot.

## Vincoli

- non creare un `UniversalDicePopup` che mescoli D20 e D6;
- non riscrivere subito lo store Zustand;
- non spostare tutte le cartelle senza prima definire i contratti;
- non cambiare il formato dei dati degli effetti senza test e compatibilità con CSV/JSON;
- mantenere inizialmente l’API pubblica di `useCharacter`;
- fare ogni estrazione in piccoli passi con build, lint, type-check e test di dominio.

## Risultato atteso

Alla fine del refactoring:

- perk e trait hanno una fonte di comportamento centralizzata e verificabile;
- D20 e D6 condividono sessione e infrastruttura, ma mantengono regole specifiche;
- `D6Popup.tsx` e `D20Popup.tsx` coordinano la UI invece di contenere l’intero dominio;
- `CharacterContext.tsx` è un adapter React dello stato del personaggio;
- le migrazioni e le normalizzazioni sono isolate;
- le regole principali sono testabili senza montare componenti React complessi.

