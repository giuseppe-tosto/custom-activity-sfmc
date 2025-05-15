(function(){
  var connection = new Postmonger.Session();
  var emailField = '';

  connection.on('initActivity', function(data) {
    if(data.arguments && data.arguments.execute && data.arguments.execute.inArguments) {
      var args = data.arguments.execute.inArguments[0];
      emailField = args.EmailAddress || '';
      document.getElementById('emailField').value = emailField;
    }
    connection.trigger('ready');
  });

  document.getElementById('form')
    .addEventListener('submit', function(e){
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
})();
