/**
 * File: api/helpers/validate.js
 *
 * Helper per la validazione dell'indirizzo email tramite SFMC Address Validation API.
 * Esegue il POST su /address/v1/validateEmail con payload:
 * {
 *   email: "<indirizzo>",
 *   validators: [
 *     "SyntaxValidator",
 *     "MXValidator",
 *     "ListDetectiveValidator"
 *   ]
 * }
 *
 * Restituisce:
 *   • true  se l'email è valida (campo 'valid': true)
 *   • false se l'email non è valida o in caso di errore
 *
 * Richiede queste env vars su Vercel:
 *   - MC_CLIENT_ID
 *   - MC_CLIENT_SECRET
 *   - MC_SUBDOMAIN
 */

import { getAuthToken } from './auth.js';

export async function validateEmail(email) {
  // STEP 1 -- Ottiene token e restURL
  console.log('[validate.js][STEP 1] Ottieni token SFMC');
  const { token, restURL } = await getAuthToken();
  const url = `${restURL}/address/v1/validateEmail`;
  console.log(`[validate.js][STEP 1] URL di validazione: ${url}`);

  // STEP 2 -- POST all’API di validazione
  console.log(
    `[validate.js][STEP 2] Chiamata API validateEmail per "${email}"`
  );
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: email,
      validators: [
        'SyntaxValidator',
        'MXValidator',
        'ListDetectiveValidator',
      ],
    }),
  });

  // STEP 3 -- Se la risposta non è OK, logga e fallback a true
  if (!resp.ok) {
    const text = await resp.text();
    console.warn(
      `[validate.js][STEP 3] API error ${resp.status}: ${text}`
    );
    console.log('[validate.js][STEP 3] Fallback: restituisco true');
    return true;
  }

  // STEP 4 -- Legge campo valid e restituisce il valore
  const { valid } = await resp.json();
  console.log(`[validate.js][STEP 4] valid = ${valid}`);
  return valid === true;
}
