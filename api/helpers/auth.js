/**
 * File: api/helpers/auth.js
 *
 * OAuth2 SFMC (Client Credentials Grant) con caching
 *
 * Fornisce getAuthToken() che restituisce un oggetto:
 *   • token    – Bearer token per chiamate REST SFMC
 *   • restURL  – URL base per le REST API (da rest_instance_url)
 *   • expiry   – timestamp (ms) in cui il token scade
 *
 * Logica:
 *   STEP 1 -- Controlla se in cache c’è un token non scaduto e restituisce
 *   STEP 2 -- Altrimenti, richiedi un nuovo token a SFMC
 *   STEP 3 -- Estrai access_token, rest_instance_url, expires_in
 *   STEP 4 -- Salva nel cache con margine di 10 secondi prima della scadenza
 *
 * Variabili d’ambiente richieste:
 *   • MC_CLIENT_ID
 *   • MC_CLIENT_SECRET
 *   • MC_SUBDOMAIN
 */

let authCache = {
  token:   null,
  restURL: null,
  expiry:  0
};

export async function getAuthToken() {
  const now = Date.now();

  // STEP 1 -- Ritorna token da cache se non scaduto
  if (authCache.token && authCache.expiry > now) {
    console.log(
      '[auth.js][STEP 1] Token in cache valido fino a',
      new Date(authCache.expiry).toISOString()
    );
    return authCache;
  }

  // STEP 2 -- Richiedi nuovo token a SFMC
  const url = `https://${process.env.MC_SUBDOMAIN}/v2/token`;
  console.log('[auth.js][STEP 2] Richiedo token da:', url);

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type:    'client_credentials',
      client_id:     process.env.MC_CLIENT_ID,
      client_secret: process.env.MC_CLIENT_SECRET
    })
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(
      `[auth.js][STEP 2] Errore token ${resp.status}: ${text}`
    );
    throw new Error(`[AuthError] ${resp.status} ${text}`);
  }

  // STEP 3 -- Estrai access_token, rest_instance_url, expires_in
  const { access_token, expires_in, rest_instance_url } =
    await resp.json();
  console.log(
    '[auth.js][STEP 3] Ricevuto token, expires_in:',
    expires_in
  );

  // STEP 4 -- Salva nel cache con margine di 10 secondi
  authCache = {
    token:   access_token,
    restURL: rest_instance_url.replace(/\/$/, ''),
    expiry:  now + (expires_in - 10) * 1000
  };
  console.log(
    '[auth.js][STEP 4] Token memorizzato, scade il:',
    new Date(authCache.expiry).toISOString()
  );

  return authCache;
}
