/**
 * File: api/save.js
 *
 * Endpoint "save" per la Custom Decision Split in Journey Builder (SFMC).
 *
 * STEP 1 -- Log di debug per verificare che l'endpoint sia chiamato
 * STEP 2 -- Risposta con status 200 e success: true
 */

export default function handler(req, res) {
  // STEP 1 -- Debug log della richiesta
  console.log('[save.js][STEP 1] Called', { method: req.method, url: req.url });

  // STEP 2 -- Risposta positiva a Journey Builder
  console.log('[save.js][STEP 2] Responding success: true');
  res.status(200).json({ success: true });
}
