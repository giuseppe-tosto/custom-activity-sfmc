;(function(){
  'use strict';

  var connection = new Postmonger.Session();
  // qui conserviamo la stringa di personalizzazione per EmailAddress
  var emailToken = '';
  // hard-coded per semplicità
  var HARD_SINGLE = 'giuseppe.tosto@skylabs.it';
  var HARD_DOMAIN = 'yahoo.it';
  
  // 1) initActivity: leggo gli inArguments e popolo emailToken + radio
  connection.on('initActivity', function(data) {
    var inArgs = (data.arguments &&
                  data.arguments.execute &&
                  data.arguments.execute.inArguments)
                 ? Object.assign({}, ...data.arguments.execute.inArguments)
                 : {};

    // salvo la stringa mustache o il valore passato dal manifest
    emailToken = inArgs.EmailAddress || '';

    var single = Boolean(inArgs.SingleEmails);
    var domain = Boolean(inArgs.DomainList);
    var type = single && domain ? 'both'
             : domain         ? 'domain'
             :                  'single';

    Array.prototype.forEach.call(
      document.getElementsByName('filterType'),
      function(radio){
        radio.checked = (radio.value === type);
      }
    );

    // dico a Journey Builder che la UI è pronta e abilito “Done”
    connection.trigger('ready');
  });

  // 2) clickedNext: ricreo TUTTI gli inArguments, includendo EmailAddress
  connection.on('clickedNext', function() {
    var selected = document.querySelector('input[name=filterType]:checked').value;

    var payload = {
      arguments: {
        execute: {
          inArguments: [
            // 1) EmailAddress (placeholder mustache prelevato da emailToken)
            { EmailAddress: emailToken },
            // 2) SingleEmails / DomainList in base alla scelta
            { SingleEmails: (selected === 'domain' ? '' : HARD_SINGLE) },
            { DomainList:   (selected === 'single' ? '' : HARD_DOMAIN) }
          ]
        }
      },
      metaData: { isConfigured: true }
    };

    // invio la configurazione aggiornata a JB
    connection.trigger('updateActivity', payload);
  });

})();
