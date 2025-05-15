;(function() {
  'use strict';

  var connection = new Postmonger.Session();
  var emailField = '';

  // 1) Al caricamento della modal, recupera i dati salvati
  connection.on('initActivity', function(data) {
    if (data.arguments && data.arguments.execute && data.arguments.execute.inArguments) {
      var args = data.arguments.execute.inArguments[0];
      emailField = args.EmailAddress || '';
      document.getElementById('emailField').value = emailField;
    }
    // segnala che la UI è pronta
    connection.trigger('ready');
  });

  // 2) Quando l’utente clicca “Next” (o Done) nella UI di JB
  connection.on('clickedNext', function() {
    // Prepara il payload come già fai nel submit del form
    var field = document.getElementById('emailField').value;
    var payload = {
      arguments: {
        execute: {
          inArguments: [
            { EmailAddress: field }
          ]
        }
      },
      metaData: {
        isConfigured: true
      }
    };

    // Invio i dati al parent (JB)
    connection.trigger('updateActivity', payload);
  });

  // 3) Se invece gestisci un form con un bottone, puoi anche intercettarlo:
  document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();
    // faccio scattare lo stesso evento clickedNext
    connection.trigger('clickedNext');
  });

})();
