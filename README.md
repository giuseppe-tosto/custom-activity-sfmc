# 🚦Custom Decision Split per Salesforce Marketing Cloud

Questo progetto implementa una **Custom Activity** di tipo Decision Split per Journey Builder in Salesforce Marketing Cloud (SFMC). Permette di:

- Verificare se l'email di un contatto è presente in una lista di blocco  
- Controllare se appartiene a un dominio bloccato  
- Rilevare email temporanee tramite servizio esterno (Kickbox)  
- Validare l’indirizzo tramite SFMC Address Validation API  
- Classificare e valutare l’affidabilità dell’email tramite AI con caching in Data Extension 
- Instradare il contatto sui rami **“Bloccato”** o **“Consentito”**  


## 📂 Struttura del repository

- **`public/`**  
  - `config.json`       – Manifest della Custom Activity  
  - `config.html`       – UI di configurazione (modal)  
  - `config.js`         – Script Postmonger per la UI  
  - `icon.svg`          – Icona per Journey Builder  

- **`api/`**  
  - `execute.js`        – Endpoint REST per la decision split  
  - **`helpers/`**  
    - `auth.js`         – OAuth2 SFMC + caching  
    - `de.js`           – Lettura blacklist da Data Extension  
    - `const.js`        – Lettura blacklist da file JSON  
    - `external.js`     – Controllo email temporanee (Kickbox)  
    - `validate.js`     – Chiamata SFMC Address Validation API 
    - `cohere.js`       – Integrazione con l’API AI (Cohere) per classificazione email  
    - `cache.js`        – Lettura/scrittura della cache (EmailClassification DE)
  - `blacklist.json`    – File di costanti (CONST)  
  - `save.js`           – Endpoint “save”  
  - `publish.js`        – Endpoint “publish”  
  - `validate.js`       – Endpoint “validate”  
 

## 🔧 Prerequisiti

- Account **Salesforce Marketing Cloud** con permessi di **Journey Builder**  
- **Node.js** e **Git** installati  
- Repository collegato a **Vercel**  
- Data Extension di ingresso (Sendable) con:  
  - **External Key**  
  - Campo `Id` (Subscriber Key)  
  - Campo `Email` (Sendable Email Address)  
  - (opzionali) altri campi, es. Nome, Cognome 

- Data Extension **EmailClassification** (per la cache AI) con attributi:  
  - `Email` (Primary Key)  
  - `ClassificationType` (es. “TEMPORARY” / “NORMAL” / ecc.)  
  - `ClassificationLevel` (es. “LOW” / “MEDIUM” / “HIGH”)  
  - `Confidence` (decimale)  
  - `LastEvaluated` (DateTime) 
 
---

  ## ⚙️ Configurazione

### 1. Manifest (`public/config.json`)

- 🔑 **Unique Key**: inserire l’`applicationExtensionKey` ottenuto in Marketing Cloud  
- 🗂 **category**: `flow`  
- 🖼 **icon**: URL pubblico di `public/icon.svg`  
- ⚙️ **type**: `RESTDECISION`
- 🌐 **url**: `https://<tuo-dominio-vercel>/api/execute`  
- 📥 **inArguments.execute.inArguments**:
  ```json
  [
  { "emailAddress": "{{Event.DEAudience-<GUID>.Email}}" },
  { "sourceType":   "{{Event.Config.sourceType}}" },
  { "checkEmail":   "{{Event.Config.checkEmail}}" },
  { "checkDomain":  "{{Event.Config.checkDomain}}" },
  { "threshold":    "{{Event.Config.threshold}}" },
  { "cacheTTL":     "{{Event.Config.cacheTTL}}" }
  ]
  ```

 
### 2. UI di configurazione

- **`config.html`**  
  - 🎛️ **Sorgente Blacklist** (radio inline):  
    - ◉ Data Extension  
    - ◉ Costanti interne  
    - ◉ Servizio esterno (Kickbox)
    - ◉ Validazione SFMC (Address Validation API)    
    - ◉ AI Classification (Cohere + cache)    
  - ⚙️ **Controlli** (toggle switch Bootstrap):  
    - 🔍 Controlla email intera ℹ️  
    - 🌐 Controlla solo dominio ℹ️  
  - ⚙️ **AI Classification** (quando selezionato): 
    - 🔝 Soglia di blocco (dropdown):  
       - LOW 
       - MEDIUM
       - HIGH
    - ⏱️ Cache TTL (dropdown): 
       - NONE (sempre usa AI)
       - < 1 giorno
       - < 7 giorni
       - < 1 mese
       - < 6 mesi
       - < 1 anno
  - 🏷️ Header con icona e titolo, layout a **card** responsivo  
  - 🛠️ **Tooltip** di contesto (`data-bs-toggle="tooltip"`) per ogni opzione  

- **`config.js`**  
  - 🤝 **Handshake** con Postmonger:  
    - `connection.trigger('ready')`  
    - `connection.on('initActivity', onInitActivity)`  
    - `connection.on('clickedNext', onClickedNext)`  
  - 📥 **`onInitActivity(data)`**:  
    - Popola radio (`srcDE`, `srcCONST`, `srcEXT`, `srcVALIDATE`) da `inArgs.sourceType`  
    - Popola toggle (`checkEmail`, `checkDomain`) da `inArgs.checkEmail` / `inArgs.checkDomain`  
    - Disabilita il toggle email/domino se è selezionato “Validazione SFMC”  
    - Abilita il pulsante **Done** (`updateButton('next', true)`)  
  - 📤 **`onClickedNext()`**:  
    - Raccoglie i valori selezionati  
    - Costruisce `payload.arguments.execute.inArguments` con:  
      ```js
      [
        { emailAddress: "{{Event.DEAudience-<GUID>.Email}}" },
        { sourceType:   selectedSourceType },
        { checkEmail:   isEmailChecked },
        { checkDomain:  isDomainChecked },
        { threshold:    selectedThreshold },
        { cacheTTL:     selectedCacheTTL }
      ]
      ```  
    - Triggera `connection.trigger('updateActivity', payload)`  
  - ⚠️ **Gestione errori globali** con `window.addEventListener('error', …)`  
   

    ## 🚀 Deploy su Vercel

1. Collega il repository a **Vercel**, selezionando il tuo progetto GitHub.  
2. Verifica che le cartelle `public/` e `api/` contengano tutti i file aggiornati.  
3. In Vercel → **Settings** → **Environment Variables**, aggiungi:
   - MC_CLIENT_ID 
   - MC_CLIENT_SECRET
   - MC_SUBDOMAIN
   - BLACKLIST_DE_KEY
   - COHERE_API_KEY
   - CLASSIFICATION_DE_KEY
4. Esegui un **push** sul branch principale (`main`): Vercel avvierà automaticamente il deploy.  
5. Controlla in Vercel → **Deployments** che l’ultimo deploy sia andato a buon fine (verde).  
6. Verifica che i seguenti URL restituiscano **HTTP 200**:
   - `https://<tuo-dominio-vercel>/config.json`  
   - `https://<tuo-dominio-vercel>/config.html`  
   - `https://<tuo-dominio-vercel>/api/execute`  (invia un POST di prova)  
  
   ## 🧪 Testing & Debug

### 🖥️ Modalità configurazione
- Apri il modal di configurazione in Journey Builder  
- Seleziona la **sorgente** e i **controlli** 
- Clicca **Done**  
- Apri la console del browser (F12) e verifica i log:
```bash
[config.js][STEP 5] initActivity received: …
[config.js][STEP 5] Sent → updateButton(next, true)
[config.js][STEP 6] Sending → updateActivity { …payload… }
```

### ⚙️ Esecuzione reale
1. **Publish** e **Activate** il Journey  
2. Inserisci un record di test nella Data Extension
3. Controlla i **Vercel Function Logs**:
   - **Data Extension (DE)**
```bash
[execute][STEP 2] Raw inArguments: [{ "emailAddress": "...", "sourceType": "DE", "checkEmail": true, "checkDomain": true }]
[execute][STEP 7] DE → emails=2, domains=1
[execute][STEP 7] DE → email match → blocked
```
  - **Costanti interne (CONST)**
```bash
[execute][STEP 2] Raw inArguments: [{ "emailAddress": "...", "sourceType": "CONST", "checkEmail": true, "checkDomain": true }]
[execute][STEP 8] CONST → emails=2, domains=1
[execute][STEP 8] CONST → domain match → blocked
```
  - **Servizio esterno (EXTERNAL)**
```bash
[execute][STEP 2] Raw inArguments: [{ "emailAddress": "...", "sourceType": "EXTERNAL", "checkEmail": true, "checkDomain": false }]
[execute][STEP 8] EXTERNAL → checkDisposable
[execute][STEP 8] EXTERNAL → disposable(email)=true
[execute][STEP 8] EXTERNAL → blocked
```
  - **Validazione SFMC (VALIDATE)**
```bash
[execute][STEP 2] Raw inArguments: [{ "emailAddress": "...", "sourceType": "VALIDATE", "checkEmail": true, "checkDomain": false }]
[execute][STEP 9] VALIDATE → invoking validateEmail()
[validate][STEP 4] valid=false
[execute][STEP 9] VALIDATE → blocked
```

  - **AI Classification (AI_CLASSIFY)**
```bash
[execute][STEP 2] Raw inArguments: [{ "emailAddress": "...", "sourceType": "AI_CLASSIFY", "checkEmail": true, "checkDomain": false, "threshold": "MEDIUM", "cacheTTL": "NONE" }]
[execute][STEP 10] AI_CLASSIFY → cache lookup (TTL=NONE)
[cache][STEP 2] Nessun record in cache
[execute][STEP 10] AI_CLASSIFY → cache miss, calling AI
[AI][STEP 3] Cohere raw response JSON: { … }
[AI][STEP 5] parsed → { classificationType: "TEMPORARY", confidence: 0.95 }
[cache][STEP 3] POST dataevents rowset → { …payload… }
[cache][STEP 3] Upsert successful via dataevents
[execute][STEP 10] AI_CLASSIFY → level=LOW, threshold=MEDIUM
[execute][STEP 10] AI_CLASSIFY → allowed
```

## 🔄 Personalizzazione

- 🛡️ **Liste di blocco**  
  Modifica `api/blacklist.json` o la Data Extension `Blacklist` per aggiornare email/domìni.

- ⚙️ **Logica di split**  
  Aggiorna `api/helpers/*.js` o `api/execute.js` per cambiare le condizioni di verifica o aggiungere nuovi criteri.

- 🖥️ **UI di configurazione**  
  Estendi `public/config.html` e `public/config.js` per inserire campi aggiuntivi (radio, checkbox, descrizioni, tooltip).

- 📝 **Placeholder dinamici**  
  Usa `connection.trigger('requestSchema')` in `config.js` per ottenere lo schema dell’Entry Event e generare automaticamente gli `inArguments`.


## 🖋️ Autore

**Tosto Giuseppe**  
