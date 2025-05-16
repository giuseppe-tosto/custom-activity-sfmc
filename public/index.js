;(function(){
  'use strict';

  var connection = new Postmonger.Session();
  // hard-coded per semplicità
  var HARD_SINGLE = 'giuseppe.tosto@skylabs.it';
  var HARD_DOMAIN = 'yahoo.it';
  
  // initActivity: prepopola le radio e abilita Done
  connection.on('initActivity', function(data) {
    var inArgs = (data.arguments && data.arguments.execute && data.arguments.execute.inArguments)
                 ? Object.assign({}, ...data.arguments.execute.inArguments)
                 : {};

    var single = Boolean(inArgs.SingleEmails);
    var domain = Boolean(inArgs.DomainList);
    var type = single && domain ? 'both'
             : domain         ? 'domain'
             :                  'single';

    Array.prototype.forEach.call(
      document.getElementsByName('filterType'),
      function(radio){
        radio.checked = radio.value === type;
      }
    );

    // Segnalo a JB che la UI è pronta e abilita “Done”
    connection.trigger('ready');
  });

  // Quando l’utente clicca Done/Next in Journey Builder
  connection.on('clickedNext', function() {
    var selected = document.querySelector('input[name=filterType]:checked').value;

    var payload = {
      arguments: {
        execute: {
          inArguments: [
            { SingleEmails: selected === 'domain' ? '' : HARD_SINGLE },
            { DomainList:   selected === 'single' ? '' : HARD_DOMAIN }
          ]
        }
      },
      metaData: { isConfigured: true }
    };

    connection.trigger('updateActivity', payload);
  });

})();
