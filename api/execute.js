module.exports = (req, res) => {
  try {
    // Ottengo gli inArguments da dove vengono inviati
    const rawArgs =
      req.body.inArguments ||
      (req.body.arguments &&
        req.body.arguments.execute &&
        req.body.arguments.execute.inArguments) ||
      [];

    // semplifico l’array di oggetti in un unico oggetto
    const inArgs = Array.isArray(rawArgs)
      ? Object.assign({}, ...rawArgs)
      : rawArgs;

    const email      = (inArgs.EmailAddress || '').toLowerCase();
    const singleList = (inArgs.SingleEmails || '').toLowerCase();
    const domainList = (inArgs.DomainList   || '').toLowerCase();

    // Hard-coded filter 
    const BLOCKED_EMAIL  = 'giuseppe.tosto@skylabs.it';
    const BLOCKED_DOMAIN = 'yahoo.it';

    // Verifica su singole email
    let passes = true;
    if (singleList) {
      const singles = singleList.split(',').map(s => s.trim());
      if (singles.includes(email)) {
        passes = false;
      }
    }

    // Verifica su dominio
    if (passes && domainList) {
      const domains = domainList.split(',').map(d => d.trim());
      const emailDomain = email.split('@')[1] || '';
      if (domains.includes(emailDomain)) {
        passes = false;
      }
    }

    // Determino il risultato del branch
    const branchResult = passes ? 'allowed' : 'blocked';

    // Rispondo a Journey Builder
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ branchResult });
  } catch (err) {
    console.error('Execute error:', err);
    return res.status(500).json({ error: err.message });
  }
};
