/**
 * File: api/helpers/cache.js
 *
 * Helper per lookup e upsert nella Data Extension di cache EmailClassification
 * utilizzando esclusivamente i Data Events REST API di SFMC.
 *
 * Funzionalità:
 *   • fetchClassificationFromDE(email, cacheTTL):
 *       - Invia GET a /hub/v1/dataevents/key:{DE_KEY}/rowset?$filter=Email
 *       - Se trova un record, controlla che non sia più vecchio del TTL
 *       - Restituisce il record (con campi Email, classificationType, classificationLevel, confidence, LastEvaluated) o null
 *
 *   • upsertClassificationToDE(record):
 *       - Invia POST a /hub/v1/dataevents/key:{DE_KEY}/rowset
 *       - Inserisce o aggiorna il record di cache nella Data Extension
 *
 * Variabili d’ambiente richieste:
 *   • CLASSIFICATION_DE_KEY = External Key della DE EmailClassification
 */

import { getAuthToken } from './auth.js';

const DE_KEY = process.env.CLASSIFICATION_DE_KEY || '';

/**
 * Fetch del primo record di cache per una data email,
 * applicando un controllo di scadenza basato su cacheTTL.
 *
 * @param {string} email
 * @param {string} cacheTTL uno di: 'NONE', '1_DAY', '7_DAYS', '1_MONTH', '6_MONTHS', '1_YEAR'
 * @returns {Promise<{
 *   Email: string,
 *   classificationType: string,
 *   classificationLevel: string,
 *   confidence: number,
 *   LastEvaluated: string
 * }|null>}
 */
export async function fetchClassificationFromDE(email, cacheTTL = 'NONE') {
  // STEP 1 -- Autenticazione e costruzione URL
  console.log('[cache.js][STEP 1] Ottengo token SFMC');
  const { token, restURL } = await getAuthToken();
  const filter = `$filter=Email%20eq%20'${encodeURIComponent(email)}'`;
  const url    = `${restURL}/hub/v1/dataevents/key:${DE_KEY}/rowset?${filter}`;
  console.log('[cache.js][STEP 1] GET dataevents rowset →', url);

  const resp = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resp.ok) {
    console.warn(
      `[cache.js][STEP 1] fetchClassificationFromDE errore ${resp.status}`
    );
    return null;
  }

  // STEP 2 -- Parsing della risposta
  const data  = await resp.json();
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) {
    console.log('[cache.js][STEP 2] Nessun record in cache');
    return null;
  }

  // STEP 3 -- Estrazione del record
  const row    = items[0];
  const keys   = row.keys   || {};
  const vals   = row.values || {};
  const record = {
    Email:               keys.Email,
    classificationType:  vals.ClassificationType,
    classificationLevel: vals.ClassificationLevel,
    confidence:          parseFloat(vals.Confidence),
    LastEvaluated:       vals.LastEvaluated
  };
  console.log('[cache.js][STEP 3] Cache hit raw:', record);

  // STEP 4 -- Controllo cacheTTL
  if (cacheTTL !== 'NONE') {
    console.log(`[cache.js][STEP 4] Verifico TTL (${cacheTTL})`);
    const now    = Date.now();
    const then   = new Date(record.LastEvaluated).getTime();
    const age    = now - then;
    const mapping = {
      '1_DAY':    1 * 24 * 60 * 60 * 1000,
      '7_DAYS':   7 * 24 * 60 * 60 * 1000,
      '1_MONTH':  30 * 24 * 60 * 60 * 1000,
      '6_MONTHS': 6 * 30 * 24 * 60 * 60 * 1000,
      '1_YEAR':   365 * 24 * 60 * 60 * 1000
    };
    const maxAge = mapping[cacheTTL] || 0;

    if (age > maxAge) {
      console.log(
        `[cache.js][STEP 4] Record scaduto: age=${Math.round(age / 1000)}s > TTL=${cacheTTL}`
      );
      return null;
    }
  }

  // STEP 5 -- Record valido
  console.log('[cache.js][STEP 5] Cache hit valid:', record);
  return record;
}

/**
 * Inserisce o aggiorna upsert un record di cache nella DE EmailClassification
 * tramite il Data Events REST API.
 *
 * @param {Object} record – { Email, classificationType, classificationLevel, confidence, LastEvaluated }
 * @returns {Promise<boolean>}
 */
export async function upsertClassificationToDE(record) {
  // STEP 1 -- Prepara i dati e arrotonda confidence a 2 decimali
  console.log('[cache.js][STEP 1] Preparo record per upsert', record);
  const {
    Email,
    classificationType,
    classificationLevel,
    confidence,
    LastEvaluated
  } = record;
  const confNum = confidence != null
    ? Math.round(confidence * 100) / 100
    : 0;

  // STEP 2 -- Autenticazione e costruzione URL
  console.log('[cache.js][STEP 2] Ottengo token SFMC');
  const { token, restURL } = await getAuthToken();
  const url = `${restURL}/hub/v1/dataevents/key:${DE_KEY}/rowset`;
  console.log('[cache.js][STEP 2] POST dataevents rowset →', url);

  // STEP 3 -- Costruisce il payload (array di { keys, values })
  const payload = [
    {
      keys: { Email },
      values: {
        ClassificationType:  classificationType,
        ClassificationLevel: classificationLevel,
        Confidence:          confNum,
        LastEvaluated
      }
    }
  ];
  console.log('[cache.js][STEP 3] Payload upsert -', JSON.stringify(payload));

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.error(
      `[cache.js][STEP 3] upsertClassificationToDE error ${resp.status}: ${txt}`
    );
    throw new Error('Cache upsert failed via dataevents');
  }

  // STEP 4 -- Conferma di successo
  console.log('[cache.js][STEP 4] Upsert successful via dataevents');
  return true;
}
