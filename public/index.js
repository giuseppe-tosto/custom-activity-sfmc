;(function(){
  'use strict';

  var connection = new Postmonger.Session();
  var inArgsValues = { SingleEmails: '', DomainList: '' };

  connection.on('initActivity', function(data) {
    if (
      data.arguments &&
      data.arguments.execute &&
      data.arguments.execute.inArguments
    ) {
      var incoming = data.arguments.execute.inArguments.reduce(function(acc, cur){
        return Object.assign(acc, cur);
      }, {});
      inArgsValues.SingleEmails = incoming.SingleEmails || '';
      inArgsValues.DomainList   = incoming.DomainList   || '';
    }

    // Setto la UI in base ai valori salvati
    var btns = document.getElementsByName('filterType');
    var type = (inArgsValues.DomainList && inArgsValues.SingleEmails)
             ? 'both'
             : (inArgsValues.DomainList ? 'domain' : 'single');
    Array.prototype.forEach.call(btns, function(radio){
      radio.checked = (radio.value === type);
    });
    document.getElementById('singleEmails').value = inArgsValues.SingleEmails;
    document.getElementById('domainList').value   = inArgsValues.DomainList;

    // Mostro/nascondo i gruppi
    toggleGroups(type);

    // Segnalo a JB che sono pronto
    connection.trigger('ready');
  });

  // Permette di mostrare/nascondere i campi quando l’utente cambia radio
  Array.prototype.forEach.call(
    document.getElementsByName('filterType'),
    function(radio){
      radio.addEventListener('change', function(){
        toggleGroups(this.value);
      });
    }
  );

  function toggleGroups(type){
    document.getElementById('single-group').style.display =
      (type === 'single' || type === 'both') ? 'block' : 'none';
    document.getElementById('domain-group').style.display =
      (type === 'domain' || type === 'both') ? 'block' : 'none';
  }

  // Quando JB invia clickedNext (bottone Done/Next)
  connection.on('clickedNext', function(){
    var selected = document.querySelector('input[name=filterType]:checked').value;
    var singles = document.getElementById('singleEmails').value.trim();
    var domains = document.getElementById('domainList').value.trim();

    var payload = {
      arguments: {
        execute: {
          inArguments: [
            { SingleEmails: selected === 'domain' ? '' : singles },
            { DomainList:   selected === 'single' ? '' : domains }
          ]
        }
      },
      metaData: { isConfigured: true }
    };
    connection.trigger('updateActivity', payload);
  });

  // Submit manuale del bottone “Salva”
  document.getElementById('saveBtn').addEventListener('click', function(){
    connection.trigger('clickedNext');
  });

})();
