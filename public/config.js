/**
 * File: public/config.js
 *
 * Gestisce la UI di configurazione della Custom Decision Split per Journey Builder (SFMC).
 * Supporta cinque modalità di sourcing:
 *   • DE           – Data Extension
 *   • CONST        – Costanti interne
 *   • EXTERNAL     – Servizio esterno (Kickbox)
 *   • VALIDATE     – Validazione SFMC Address Validation API
 *   • AI_CLASSIFY  – Classificazione AI via Cohere con soglie e cache
 *
 * La UI include:
 *   1. Radio sourceType
 *   2. Toggle checkEmail / checkDomain
 *   3. Pannello AI (threshold + cacheTTL) mostrato solo per AI_CLASSIFY
 *
 * STEP 1 -- Verifica che Postmonger sia caricato
 * STEP 2 -- Cache dei riferimenti DOM e inizializzazione Postmonger
 *   STEP 2.1 -- getSourceType()
 *   STEP 2.2 -- onSourceTypeChange(): show/hide AI panel, abilita/disabilita toggles
 * STEP 3 -- Registra listener (radio change + Postmonger init/click)
 * STEP 4 -- Trigger ready
 * STEP 5 -- onInitActivity(data): popola UI da payload
 * STEP 6 -- onClickedNext(): raccoglie valori e invia updateActivity
 * STEP 7 -- Gestione errori globali
 */
(function() {
  // STEP 1 -- Verifica Postmonger
  if (typeof Postmonger === 'undefined') {
    console.error('[config.js][STEP 1] ERRORE: Postmonger non definito');
    return;
  }
  console.log('[config.js][STEP 1] Postmonger caricato correttamente');

  // STEP 2 -- Sessione Postmonger e cache DOM
  console.log('[config.js][STEP 2] Inizio cache riferimenti DOM e init Postmonger');
  var connection    = new Postmonger.Session();
  var payload       = {};

  var srcDE         = document.getElementById('srcDE');
  var srcCONST      = document.getElementById('srcCONST');
  var srcEXT        = document.getElementById('srcEXT');
  var srcVALIDATE   = document.getElementById('srcVALIDATE');
  var srcAI         = document.getElementById('srcAI');
  var chkEmail      = document.getElementById('checkEmail');
  var chkDomain     = document.getElementById('checkDomain');
  var aiOptions     = document.getElementById('aiOptions');
  var thresholdSel  = document.getElementById('thresholdSelect');
  var ttlSel        = document.getElementById('ttlSelect');
  console.log('[config.js][STEP 2] Riferimenti DOM memorizzati');

  // STEP 2.1 -- Ritorna il sourceType selezionato
  function getSourceType() {
    var sel = document.querySelector('input[name="sourceType"]:checked');
    var value = sel ? sel.value : 'DE';
    console.log('[config.js][STEP 2.1] getSourceType →', value);
    return value;
  }

  // STEP 2.2 -- Mostra/nasconde il pannello AI e regola i toggle
  function onSourceTypeChange() {
    var st      = getSourceType();
    var isAI    = (st === 'AI_CLASSIFY');
    var isValid = (st === 'VALIDATE');

    console.log('[config.js][STEP 2.2] onSourceTypeChange → sourceType =', st);

    // mostra/nasconde il pannello AI
    aiOptions.classList.toggle('d-none', !isAI);
    console.log(
      '[config.js][STEP 2.2] AI panel ' +
      (isAI ? 'visibile' : 'nascosto')
    );

    if (isValid || isAI) {
      // forzo email selezionata e abilitata
      chkEmail.checked  = true;
      chkEmail.disabled = false;
      console.log('[config.js][STEP 2.2] checkEmail forzato a true e abilitato');

      // disabilito e deseleziono il dominio
      chkDomain.checked = false;
      chkDomain.disabled = true;
      console.log('[config.js][STEP 2.2] checkDomain disabilitato e deselezionato');
    } else {
      // in tutti gli altri casi, entrambi i toggle sono liberi
      chkEmail.disabled  = false;
      chkDomain.disabled = false;
      console.log('[config.js][STEP 2.2] checkEmail e checkDomain abilitati');
    }
  }

  // STEP 3 -- Listener radio change
  console.log('[config.js][STEP 3] Registro listener su radio sourceType');
  document
    .querySelectorAll('input[name="sourceType"]')
    .forEach(function(radio) {
      radio.addEventListener('change', onSourceTypeChange);
    });

  // STEP 3 -- Listener Postmonger
  console.log('[config.js][STEP 3] Registro listener Postmonger initActivity e clickedNext');
  connection.on('initActivity', onInitActivity);
  connection.on('clickedNext',  onClickedNext);

  // STEP 4 -- Trigger ready
  console.log('[config.js][STEP 4] Trigger ready to Journey Builder');
  connection.trigger('ready');

  /**
   * STEP 5 -- Popola la UI all’apertura modal
   */
  function onInitActivity(data) {
    console.log('[config.js][STEP 5] onInitActivity ricevuto data:', data);
    payload = data || {};
    var inArgs = payload.arguments &&
                 payload.arguments.execute &&
                 payload.arguments.execute.inArguments
      ? Object.assign({}, ...payload.arguments.execute.inArguments)
      : {};
    console.log('[config.js][STEP 5] inArgs parsati:', inArgs);

    // radio
    srcDE.checked       = (inArgs.sourceType === 'DE');
    srcCONST.checked    = (inArgs.sourceType === 'CONST');
    srcEXT.checked      = (inArgs.sourceType === 'EXTERNAL');
    srcVALIDATE.checked = (inArgs.sourceType === 'VALIDATE');
    srcAI.checked       = (inArgs.sourceType === 'AI_CLASSIFY');
    console.log(
      '[config.js][STEP 5] Radio sourceType impostate → DE:',
      srcDE.checked,
      'CONST:',
      srcCONST.checked,
      'EXTERNAL:',
      srcEXT.checked,
      'VALIDATE:',
      srcVALIDATE.checked,
      'AI_CLASSIFY:',
      srcAI.checked
    );

    // toggles
    chkEmail.checked   = (inArgs.checkEmail === true);
    chkDomain.checked  = (inArgs.checkDomain === true);
    console.log(
      '[config.js][STEP 5] Toggle impostati → checkEmail:',
      chkEmail.checked,
      'checkDomain:',
      chkDomain.checked
    );

    // AI panel values
    thresholdSel.value = inArgs.threshold || 'MEDIUM';
    ttlSel.value       = inArgs.cacheTTL  || 'NONE';
    console.log(
      '[config.js][STEP 5] AI panel valori → threshold:',
      thresholdSel.value,
      'cacheTTL:',
      ttlSel.value
    );

    // abilita Done
    connection.trigger('updateButton', { button: 'next', enabled: true });
    console.log('[config.js][STEP 5] updateButton(next, true) inviato');

    // applica regole UI
    onSourceTypeChange();
  }

  /**
   * STEP 6 -- Raccoglie i valori e invia updateActivity
   */
  function onClickedNext() {
    console.log('[config.js][STEP 6] onClickedNext triggered');
    var sourceType  = getSourceType();
    var checkEmail  = chkEmail.checked;
    var checkDomain = chkDomain.checked;
    var threshold   = thresholdSel.value;
    var cacheTTL    = ttlSel.value;
    console.log(
      '[config.js][STEP 6] Valori UI → sourceType:',
      sourceType,
      'checkEmail:',
      checkEmail,
      'checkDomain:',
      checkDomain,
      'threshold:',
      threshold,
      'cacheTTL:',
      cacheTTL
    );

    payload.arguments = payload.arguments || {};
    payload.arguments.execute = payload.arguments.execute || {};
    payload.arguments.execute.inArguments = [
      { emailAddress: "{{Event.DEAudience-7f7c5f18-627f-9642-b5e2-9fc9482e59e3.Email}}" },
      { sourceType:   sourceType },
      { checkEmail:   checkEmail },
      { checkDomain:  checkDomain },
      { threshold:    threshold },
      { cacheTTL:     cacheTTL }
    ];

    payload.metaData = payload.metaData || {};
    payload.metaData.isConfigured = true;
    console.log('[config.js][STEP 6] Payload costruito per updateActivity:', payload);

    connection.trigger('updateActivity', payload);
    console.log('[config.js][STEP 6] updateActivity inviato');
  }

  // STEP 7 -- Error handler globale
  window.addEventListener('error', function(e) {
    console.error('[config.js][STEP 7] uncaught error:', e.error);
  });
  console.log('[config.js] Script caricato e pronto');
})();
