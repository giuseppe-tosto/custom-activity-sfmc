/**
 * File: api/helpers/const.js
 *
 * Lettura della blacklist da file JSON locale (api/blacklist.json).
 * Questo modulo fornisce una funzione che restituisce due array:
 *   • emails  – elenco di indirizzi email bloccati, normalizzati a lowercase
 *   • domains – elenco di domini bloccati, normalizzati a lowercase
 *
 * Logica:
 *   STEP 1 – Costruisce il percorso assoluto al file blacklist.json
 *   STEP 2 – Legge il contenuto del file e ne verifica il parsing in JSON
 *   STEP 3 – Estrae gli array “blockedEmails” e “blockedDomains”
 *   STEP 4 – Converte ogni elemento in lowercase e filtra eventuali stringhe vuote
 *   STEP 5 – Logga il numero di voci caricate e restituisce l’oggetto { emails, domains }
 *
 * Esempio di blacklist.json:
 * {
 *   "blockedEmails": ["test@example.com", "spam@domain.com"],
 *   "blockedDomains": ["yahoo.com", "mailinator.com"]
 * }
 */

import fs from 'fs';
import path from 'path';

export function loadBlacklistFromConst() {
  // STEP 1 – Percorso al file JSON
  const filePath = path.resolve('./api/blacklist.json');
  console.log('[const.js][STEP 1] filePath =', filePath);

  // STEP 2 – Lettura e parsing del file JSON
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
    console.log('[const.js][STEP 2] File letto correttamente');
  } catch (err) {
    console.error('[const.js][STEP 2] Errore lettura file:', err);
    throw err;
  }

  let data;
  try {
    data = JSON.parse(raw);
    console.log('[const.js][STEP 2] JSON parse riuscito');
  } catch (err) {
    console.error('[const.js][STEP 2] Errore parsing JSON:', err);
    throw err;
  }

  const { blockedEmails, blockedDomains } = data;

  // STEP 3 – Normalizzazione a lowercase e filtro di stringhe vuote
  const emails = Array.isArray(blockedEmails)
    ? blockedEmails.map(e => (e || '').toLowerCase()).filter(Boolean)
    : [];
  const domains = Array.isArray(blockedDomains)
    ? blockedDomains.map(d => (d || '').toLowerCase()).filter(Boolean)
    : [];

  // STEP 4 – Log del conteggio degli elementi
  console.log(
    `[const.js][STEP 4] Caricati ${emails.length} email e ${domains.length} domini`
  );

  return { emails, domains };
}
