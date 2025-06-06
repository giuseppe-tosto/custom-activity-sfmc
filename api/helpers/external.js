/**
 * File: api/helpers/external.js
 *
 * Controllo di email e domini temporanei usando Kickbox Open API.
 * Questo helper fornisce due funzioni:
 *   • checkDisposable(email) – Restituisce true se l’email è di tipo disposable
 *   • checkDisposableDomain(domain) – Restituisce true se il dominio è di tipo disposable
 *
 * Logica:
 *   STEP 1 – checkDisposable(email):
 *       • Effettua GET su https://open.kickbox.com/v1/disposable/{email}
 *       • Se la risposta è OK, legge il campo disposable dal JSON
 *       • Restituisce true/false
 *   STEP 2 – checkDisposableDomain(domain):
 *       • Costruisce un indirizzo dummy test@{domain}
 *       • Richiama checkDisposable(dummy) e propaga il risultato
 *
 * Non richiede variabili d’ambiente. Nessuna API key necessaria.
 */

export async function checkDisposable(email) {
  console.log('[external.js][STEP 1] Verifica email disposable:', email);
  const url = `https://open.kickbox.com/v1/disposable/${encodeURIComponent(email)}`;
  console.log('[external.js][STEP 1] Chiamata GET -', url);

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.warn(`[external.js][STEP 1] Response non OK, status = ${resp.status} per ${email}`);
      return false;
    }

    const json = await resp.json();
    const isDisposable = json.disposable === true;
    console.log(`[external.js][STEP 1] Risultato disposable=${isDisposable} per ${email}`);
    return isDisposable;
  } catch (err) {
    console.warn('[external.js][STEP 1] Errore durante checkDisposable:', err);
    return false;
  }
}

export async function checkDisposableDomain(domain) {
  console.log('[external.js][STEP 2] Verifica dominio disposable:', domain);
  if (!domain) {
    console.warn('[external.js][STEP 2] Domain vuoto, restituisco false');
    return false;
  }

  // Costruisco un indirizzo fittizio per testare il dominio
  const dummyEmail = `test@${domain.toLowerCase()}`;
  console.log('[external.js][STEP 2] Uso indirizzo dummy per test:', dummyEmail);

  const result = await checkDisposable(dummyEmail);
  console.log(`[external.js][STEP 2] Risultato disposableDomain=${result} per dominio ${domain}`);
  return result;
}
