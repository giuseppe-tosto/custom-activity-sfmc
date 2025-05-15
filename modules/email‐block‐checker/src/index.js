;(function() {
  'use strict';
  var connection = new Postmonger.Session();
  var emailField = '';

  connection.on('initActivity', function(data) {
    if (data && data.arguments && data.arguments.execute && data.arguments.execute.inArguments) {
      var inArgs = data.arguments.execute.inArguments;
      emailField = inArgs[0].EmailAddress || '';
      document.getElementById('emailField').value = emailField;
    }
    connection.trigger('ready');
  });

  document.getElementById('config-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var field = document.getElementById('emailField').value;
    var payload = {
      arguments: {
        execute: { inArguments: [ { EmailAddress: field } ] }
      },
      metaData: { isConfigured: true }
    };
    connection.trigger('updateActivity', payload);
  });

  connection.on('requestedTokens', function(tokens) {
    // gestisci eventuali token
  });

  connection.on('requestedEndpoints', function(endpoints) {
    // gestisci eventuali endpoint
  });
})();
