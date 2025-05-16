;(function(){
  'use strict';

  var connection = new Postmonger.Session();
  // hard-coded per semplicità
  var HARD_SINGLE = 'giuseppe.tosto@skylabs.it';
  var HARD_DOMAIN = 'yahoo.it';
  
  connection.on('initActivity', function(data) {
    var single   = false;
    var domain   = false;
    var inArgs = (data.arguments && data.arguments.execute && data.arguments.execute.inArguments) 
                 ? Object.assign({}, ...data.arguments.execute.inArguments) 
                 : {};

    if (inArgs.SingleEmails) single = true;
    if (inArgs.DomainList)   domain = true;

    var type = single && domain ? 'both'
             : domain         ? 'domain'
             :                  'single';

    Array.prototype.forEach.call(
      document.getElementsByName('filterType'),
      function(radio){
        radio.checked = radio.value === type;
      }
    );

    // dico subito a Journey Builder che la UI è pronta
    connection.trigger('ready');
  });

  // quando l'utente clicca Next/Done in JB
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

  // pulsante Salva, fa scattare clickedNext
  document.getElementById('saveBtn')
    .addEventListener('click', function(){
      connection.trigger('clickedNext');
    });
 connection.trigger('ready');

})();
