/**
 * File: api/helpers/cohere.js
 *
 * Classifica un’email come TEMPORARY o NORMAL chiamando il REST endpoint di Cohere.
 * Utilizza fetch globale (Node 18+).
 *
 * Logica:
 *   STEP 1 -- Verifica presenza di COHERE_API_KEY
 *   STEP 2 -- Costruisce prompt ottimizzato per confidence su fattori di sicurezza
 *   STEP 3 -- Invia richiesta a Cohere e ottiene risposta JSON
 *   STEP 4 -- Estrae il testo generato dal JSON di risposta
 *   STEP 5 -- Parsing del JSON e normalizzazione dei valori
 *   STEP 6 -- Calcola classificationLevel in base a confidence
 *
 * Variabile d’ambiente obbligatoria:
 *   • COHERE_API_KEY
 */

const API_URL = 'https://api.cohere.ai/generate';
const API_KEY = process.env.COHERE_API_KEY;

if (!API_KEY) {
  throw new Error(
    '[cohere.js][STEP 1] Missing environment variable COHERE_API_KEY. ' +
    'Set COHERE_API_KEY in Vercel Environment Variables.'
  );
}

export async function classifyEmailSimple(email) {
  console.log('[cohere.js][STEP 2] classifyEmailSimple → email =', email);

  // STEP 2 -- Prompt ottimizzato per confidence sui fattori di sicurezza
  const prompt = `
You are an email security expert. Given only the email address, evaluate its overall trustworthiness by considering factors such as:
- Disposable/temporary providers (e.g. mailinator, 10minmail)
- Invalid or malformed formats
- Fake or generated-looking usernames
- Known malicious or risky domains
- Unusual patterns or suspicious keywords

Respond with a JSON object **only** in this format (no extra fields):

{
  "classificationType": "TEMPORARY" or "NORMAL",
  "confidence": number between 0.0 and 1.0
}

- A lower confidence (closer to 0.0) means higher risk (disposable/fake/invalid).
- A higher confidence (closer to 1.0) means more trustworthy.

Email to check: "${email}"
`.trim();

  // STEP 3 -- Invia richiesta HTTP a Cohere
  console.log('[cohere.js][STEP 3] Inoltro richiesta a Cohere API:', API_URL);
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model:          'command-light',
      version:        '2022-12-06',
      prompt,
      max_tokens:     80,
      temperature:    0.2,
      stop_sequences: ['}']
    })
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.error('[cohere.js][STEP 3] Cohere API error', resp.status, txt);
    throw new Error(`[CohereError] ${resp.status}`);
  }

  const json = await resp.json();
  console.log(
    '[cohere.js][STEP 3] Cohere raw response JSON:',
    JSON.stringify(json, null, 2)
  );

  // STEP 4 -- Estrae il testo generato dal JSON di risposta
  let genText = null;
  if (Array.isArray(json.generations) && json.generations[0]?.text) {
    genText = json.generations[0].text;
  } else if (Array.isArray(json.choices) && json.choices[0]?.text) {
    genText = json.choices[0].text;
  } else if (typeof json.text === 'string') {
    genText = json.text;
  }

  if (!genText) {
    console.error(
      '[cohere.js][STEP 4] Impossibile trovare il testo generato in risposta Cohere'
    );
    throw new Error(
      'AI non ha restituito testo. Controllare il log [cohere.js][STEP 3] per il formato.'
    );
  }

  // STEP 5 -- Parsing JSON (aggiunge '}' se manca)
  const raw = genText.trim().endsWith('}')
    ? genText.trim()
    : genText.trim() + '}';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('[cohere.js][STEP 5] Errore parsing JSON:', raw);
    throw new Error('[CohereError] AI JSON parse error: ' + e.message);
  }

  // Estrazione e normalizzazione dei valori
  let { classificationType, confidence } = parsed;
  classificationType = classificationType === 'TEMPORARY' ? 'TEMPORARY' : 'NORMAL';
  confidence = Math.max(0, Math.min(1, parseFloat(confidence)));

  console.log(
    '[cohere.js][STEP 5] parsed -',
    { classificationType, confidence }
  );

  // STEP 6 -- Calcolo classificationLevel in base a confidence
  let classificationLevel;
  if (confidence < 0.2) {
    classificationLevel = 'HIGH';
  } else if (confidence < 0.8) {
    classificationLevel = 'MEDIUM';
  } else {
    classificationLevel = 'LOW';
  }

  console.log(
    `[cohere.js][STEP 6] classificationType=${classificationType}, ` +
    `confidence=${confidence.toFixed(2)}, ` +
    `classificationLevel=${classificationLevel}`
  );

  return { classificationType, confidence, classificationLevel };
}
