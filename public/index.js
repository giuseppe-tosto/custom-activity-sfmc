;(function() {
  'use strict';

  var connection = new Postmonger.Session();
  var emailField = '';

  // 1) Quando ci infila i dati (o al primo load)
  connection.on('initActivity', function(data) {
    if (
      data.arguments &&
      data.arguments.execute &&
      data.arguments.execute.inArguments
    ) {
      var args = data.arguments.execute.inArguments[0];
      emailField = args.EmailAddress || '';
      document.getElementById('emailField').value = emailField;
    }
    // Segnalo a Journey Builder che la UI è pronta
    connection.trigger('ready');
  });

  // 2) Se Journey Builder mi chiede i token o gli endpoints
  connection.on('requestedTokens', function() {});
  connection.on('requestedEndpoints', function() {});

  // 3) Quando l’utente clicca “Next” / “Done” in JB
  connection.on('clickedNext', function() {
    var field = document.getElementById('emailField').value;
    var payload = {
      arguments: {
        execute: {
          inArguments: [{ EmailAddress: field }]
        }
      },
      metaData: {
        isConfigured: true
      }
    };
    // Invio i dati a JB
    connection.trigger('updateActivity', payload);
  });

  // 4) appena carico la pagina, dico subito che sono pronto
  //    così il pulsante Next appare e non rimane lo spinner
  connection.trigger('ready');

  // 5) opzionale: se gestisci anche il form submit
  document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();
    // faccio partire lo stesso flusso di clickedNext
    connection.trigger('clickedNext');
  });
})();
