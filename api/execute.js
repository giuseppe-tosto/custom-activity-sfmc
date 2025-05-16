module.exports = (req, res) => {
  const payload = req.body;

  // Step 1 -- Recupero gli inArguments sia che arrivino in payload.inArguments
  const rawArgs =
    payload.inArguments ||
    (payload.arguments &&
      payload.arguments.execute &&
      payload.arguments.execute.inArguments) ||
    [];

  // Step 2 -- mettoo in un unico oggetto { EmailAddress, SingleEmails, DomainList }
  const inArgs = Array.isArray(rawArgs)
    ? Object.assign({}, ...rawArgs)
    : rawArgs;

  const contactEmail = (inArgs.EmailAddress || '').toLowerCase();
  const singleList   = (inArgs.SingleEmails || '').toLowerCase();
  const domainList   = (inArgs.DomainList   || '').toLowerCase();

  // Step 3 -- Logica di filtro (hard-coded per semplicità)
  //    Se l’email del contatto è esattamente quella singola, oppure
  //    il suo dominio è in domainList, lo blocco
  let passes = true;

  // filtro singole
  if (singleList) {
    const singles = singleList.split(',').map(s => s.trim());
    if (singles.includes(contactEmail)) {
      passes = false;
    }
  }

  // filtro domini
  if (passes && domainList) {
    const domains = domainList.split(',').map(d => d.trim());
    const emailDomain = contactEmail.split('@')[1] || '';
    if (domains.includes(emailDomain)) {
      passes = false;
    }
  }

  // Step 4 -- Mappo su “allowed” / “blocked” 
  const branchResult = passes ? 'allowed' : 'blocked';

  return res.status(200).json({ branchResult });
};
