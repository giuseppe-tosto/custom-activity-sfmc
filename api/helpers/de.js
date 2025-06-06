/**
 * File: api/helpers/de.js
 *
 * Lettura della blacklist da Data Extension SFMC con caching (TTL 5 minuti).
 * Questo helper esegue:
 *   STEP 1 – Verifica se la cache locale è ancora valida, se sì, restituisce i dati memorizzati.
 *   STEP 2 – Ottiene un token OAuth2 e l’URL base per le REST API SFMC tramite getAuthToken().
 *   STEP 3 – Effettua una chiamata GET a /data/v1/customobjectdata/key/{BLACKLIST_DE_KEY}/rowset?pagesize=2500
 *   STEP 4 – Filtra le righe per blocktype email e domain e normalizza a lowercase
 *   STEP 5 – Aggiorna la cache interna con nuovi valori e timestamp
 * 
 * Variabili d’ambiente richieste:
 *   • BLACKLIST_DE_KEY – External Key della Data Extension contenente la blacklist
 *
 * Dipendenze:
 *   • getAuthToken() da api/helpers/auth.js
 */

import { getAuthToken } from './auth.js';

let deCache = {
  timestamp: 0,
  data: { emails: [], domains: [] }
};

export async function fetchBlacklistFromDE() {
  const TTL = 5 * 60 * 1000; // 5 minuti in millisecondi

  // STEP 1 – Controllo cache: se i dati sono più recenti di TTL, restituisco la cache
  if (Date.now() - deCache.timestamp < TTL) {
    console.log('[de.js][STEP 1] Cache valida, restituisco dati memorizzati');
    return deCache.data;
  }
  console.log('[de.js][STEP 1] Cache scaduta o inesistente; procedo a fetch da SFMC');

  // STEP 2 – Ottengo token e URL REST da auth.js
  const { token, restURL } = await getAuthToken();
  console.log(`[de.js][STEP 2] Token ottenuto, restURL = ${restURL}`);

  // STEP 3 – Costruisco l’URL per la chiamata alla Data Extension
  const url = `${restURL}/data/v1/customobjectdata/key/${process.env.BLACKLIST_DE_KEY}/rowset?pagesize=2500`;
  console.log('[de.js][STEP 3] Effettuo GET →', url);

  let resp;
  try {
    resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch (err) {
    console.error('[de.js][STEP 3] Errore fetch:', err);
    return deCache.data;
  }

  if (!resp.ok) {
    console.warn(`[de.js][STEP 3] Risposta non OK, status = ${resp.status}`);
    return deCache.data;
  }

  // STEP 4 – Parsing del JSON e estrazione delle righe
  let json;
  try {
    json = await resp.json();
  } catch (err) {
    console.error('[de.js][STEP 4] Errore parsing JSON:', err);
    return deCache.data;
  }

  const rows = Array.isArray(json.items) ? json.items : [];
  console.log(`[de.js][STEP 4] Totale righe ricevute: ${rows.length}`);

  // STEP 5 – Filtraggio e normalizzazione: blocktype email
  const emails = rows
    .filter(r => String(r.values.blocktype).toLowerCase() === 'email')
    .map(r => (r.keys.value || '').toLowerCase())
    .filter(Boolean);
  console.log(`[de.js][STEP 5] Email estratte: ${emails.length}`);

  // STEP 5 – Filtraggio e normalizzazione: blocktype domain
  const domains = rows
    .filter(r => String(r.values.blocktype).toLowerCase() === 'domain')
    .map(r => {
      const raw = (r.keys.value || '').toLowerCase();
      return raw.includes('@') ? raw.split('@')[1] : raw;
    })
    .filter(Boolean);
  console.log(`[de.js][STEP 5] Domains estratti: ${domains.length}`);

  // STEP 6 – Aggiorno la cache e restituisco i dati
  deCache = {
    timestamp: Date.now(),
    data: { emails, domains }
  };
  console.log('[de.js][STEP 6] Cache aggiornata con nuovi dati');

  return deCache.data;
}
