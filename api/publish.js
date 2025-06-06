/**
 * File: api/publish.js
 *
 * Endpoint "publish" per la Custom Decision Split in Journey Builder (SFMC).
 *
 * STEP 1 -- Log di debug per verificare che l'endpoint sia invocato
 * STEP 2 -- Risposta con status 200 e success: true
 */

export default function handler(req, res) {
  // STEP 1 -- Debug log della richiesta
  console.log('[publish.js][STEP 1] Called', { method: req.method, url: req.url });

  // STEP 2 -- Risposta positiva a Journey Builder
  console.log('[publish.js][STEP 2] Responding success: true');
  res.status(200).json({ success: true });
}
