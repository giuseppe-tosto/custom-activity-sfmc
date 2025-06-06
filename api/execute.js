/**
 * File: api/execute.js
 *
 * Handler principale per la Custom Decision Split.
 * Verifica e instrada i contatti su “blocked” o “allowed” in base a cinque modalità:
 *   • DE           – Data Extension SFMC
 *   • CONST        – File di costanti locale
 *   • EXTERNAL     – Kickbox Open API per email temporanee
 *   • VALIDATE     – SFMC Address Validation API
 *   • AI_CLASSIFY  – AI-driven classification via Cohere con cache in DE
 *
 * Mantiene log di debug completi per ogni STEP.
 *
 * Variabili d’ambiente richieste (su Vercel):
 *   • MC_CLIENT_ID
 *   • MC_CLIENT_SECRET
 *   • MC_SUBDOMAIN
 *   • BLACKLIST_DE_KEY
 *   • COHERE_API_KEY
 *   • CLASSIFICATION_DE_KEY
 */

import { fetchBlacklistFromDE }    from './helpers/de.js';
import { loadBlacklistFromConst }   from './helpers/const.js';
import { checkDisposable, checkDisposableDomain } from './helpers/external.js';
import { validateEmail }            from './helpers/validate.js';
import { classifyEmailSimple }      from './helpers/cohere.js';
import { fetchClassificationFromDE, upsertClassificationToDE } from './helpers/cache.js';

export default async function handler(req, res) {
  // STEP 0 -- DEBUG: log completo della richiesta
  console.log('[execute.js][STEP 0] Request METHOD:', req.method);
  console.log('[execute.js][STEP 0] Request URL:', req.url);
  console.log(
    '[execute.js][STEP 0] Request body:',
    JSON.stringify(req.body, null, 2)
  );

  // STEP 1 -- Accetta solo richieste POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    console.warn('[execute.js][STEP 1] Metodo non consentito (solo POST)');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // STEP 2 -- Estrai e logga gli inArguments grezzi
    const { inArguments } = req.body;
    console.log(
      '[execute.js][STEP 2] Raw inArguments:',
      JSON.stringify(inArguments, null, 2)
    );

    // STEP 3 -- Unisci gli inArguments in un unico oggetto e logga
    const args = Object.assign({}, ...inArguments);
    console.log(
      '[execute.js][STEP 3] Parsed args:',
      JSON.stringify(args, null, 2)
    );

    // STEP 4 -- Estrai email e dominio
    const email = (args.emailAddress || '').toLowerCase();
    console.log('[execute.js][STEP 4] emailAddress:', email);
    const [, domain = ''] = email.split('@');
    console.log('[execute.js][STEP 4] domain:', domain);

    // STEP 5 -- Estrai i flag di controllo
    const checkEmail  = args.checkEmail  === true || args.checkEmail  === 'true';
    const checkDomain = args.checkDomain === true || args.checkDomain === 'true';
    console.log(
      '[execute.js][STEP 5] checkEmail:',
      checkEmail,
      'checkDomain:',
      checkDomain
    );

    // STEP 6 -- Estrai il tipo di sorgente e soglia AI
    const sourceType = args.sourceType;
    const threshold  = args.threshold || 'MEDIUM';
    console.log(
      '[execute.js][STEP 6] sourceType:',
      sourceType,
      'threshold:',
      threshold
    );

    // STEP 7 -- Branch: DE o CONST (unificato)
    if (sourceType === 'DE' || sourceType === 'CONST') {
      console.log(
        `[execute.js][STEP 7] Mode=${sourceType} → fetch/load blacklist`
      );
      const lists =
        sourceType === 'DE'
          ? await fetchBlacklistFromDE()
          : loadBlacklistFromConst();
      console.log(
        `[execute.js][STEP 7] ${sourceType} loaded: emails=${
          lists.emails.length
        }, domains=${lists.domains.length}`
      );

      if (checkEmail && lists.emails.includes(email)) {
        console.log(`[execute.js][STEP 7] ${sourceType} → email match → blocked`);
        return res.status(200).json({ branchResult: 'blocked' });
      }
      if (checkDomain && lists.domains.includes(domain)) {
        console.log(
          `[execute.js][STEP 7] ${sourceType} → domain match → blocked`
        );
        return res.status(200).json({ branchResult: 'blocked' });
      }
    }
    // STEP 8 -- Branch: Servizio esterno Kickbox (EXTERNAL)
    else if (sourceType === 'EXTERNAL') {
      console.log('[execute.js][STEP 8] Mode=EXTERNAL → checkDisposable');
      let isBlocked = false;

      if (checkEmail) {
        isBlocked = await checkDisposable(email);
        console.log(
          `[execute.js][STEP 8] EXTERNAL → disposable(email)=${isBlocked}`
        );
      } else if (checkDomain) {
        isBlocked = await checkDisposableDomain(domain);
        console.log(
          `[execute.js][STEP 8] EXTERNAL → disposable(domain)=${isBlocked}`
        );
      }

      if (isBlocked) {
        console.log('[execute.js][STEP 8] EXTERNAL → blocked');
        return res.status(200).json({ branchResult: 'blocked' });
      }
    }
    // STEP 9 -- Branch: SFMC Address Validation API (VALIDATE)
    else if (sourceType === 'VALIDATE') {
      console.log('[execute.js][STEP 9] Mode=VALIDATE → invoking validateEmail()');
      const isValid = await validateEmail(email);
      console.log('[execute.js][STEP 9] VALIDATE → isValid =', isValid);

      if (!isValid) {
        console.log('[execute.js][STEP 9] VALIDATE → blocked');
        return res.status(200).json({ branchResult: 'blocked' });
      }
      console.log('[execute.js][STEP 9] VALIDATE → allowed');
    }
    // STEP 10 -- Branch: AI Classification con cache (AI_CLASSIFY)
    else if (sourceType === 'AI_CLASSIFY') {
      const cacheTTL = args.cacheTTL || 'NONE';
      console.log(
        `[execute.js][STEP 10] Mode=AI_CLASSIFY → cache lookup (TTL=${cacheTTL})`
      );
      const cacheRec = await fetchClassificationFromDE(email, cacheTTL);
      let record;
      const now = new Date().toISOString();

      if (cacheRec) {
        console.log('[execute.js][STEP 10] AI_CLASSIFY → cache hit:', cacheRec);
        record = cacheRec;
      } else {
        console.log('[execute.js][STEP 10] AI_CLASSIFY → cache miss, calling AI');
        record = await classifyEmailSimple(email);
        record.Email = email;
        record.LastEvaluated = now;
        await upsertClassificationToDE(record);
        console.log(
          '[execute.js][STEP 10] AI_CLASSIFY → cache upserted:',
          record
        );
      }

      // STEP 10.1 -- Decidi in base al livello e soglia
      const order = ['LOW', 'MEDIUM', 'HIGH'];
      const level = record.classificationLevel;
      console.log(
        `[execute.js][STEP 10.1] AI_CLASSIFY → level=${level}, threshold=${threshold}`
      );

      if (order.indexOf(level) >= order.indexOf(threshold)) {
        console.log('[execute.js][STEP 10.1] AI_CLASSIFY → blocked');
        return res.status(200).json({ branchResult: 'blocked' });
      }
      console.log('[execute.js][STEP 10.1] AI_CLASSIFY → allowed');
    }

    // STEP 11 -- Se nessuna condizione ha bloccato, instrada come "allowed"
    console.log('[execute.js][STEP 11] final → allowed');
    return res.status(200).json({ branchResult: 'allowed' });
  } catch (err) {
    // STEP 12 -- Gestione errori generica
    console.error('[execute.js][STEP 12] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
