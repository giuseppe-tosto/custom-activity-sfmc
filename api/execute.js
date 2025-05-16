module.exports = (req, res) => {
  // --- LOG INGRESSO ---
  console.log('--- EXECUTE CALLED ---');
  console.log('Raw body:', JSON.stringify(req.body));

  try {
    // 1) Recupero gli inArguments in entrambi i formati possibili
    const rawArgs =
      req.body.inArguments ||
      (req.body.arguments &&
        req.body.arguments.execute &&
        req.body.arguments.execute.inArguments) ||
      [];

    // 2) Appiattisco
    const inArgs = Array.isArray(rawArgs)
      ? Object.assign({}, ...rawArgs)
      : rawArgs;

    console.log('Parsed inArguments:', inArgs);

    // 3) Estrazione valori
    const email      = (inArgs.EmailAddress || '').toLowerCase();
    const singleList = (inArgs.SingleEmails || '').toLowerCase();
    const domainList = (inArgs.DomainList   || '').toLowerCase();

    // 4) Regole di blocco hard-coded
    const BLOCKED_EMAIL  = 'giuseppe.tosto@skylabs.it';
    const BLOCKED_DOMAIN = 'yahoo.it';

    let passes = true;
    if (singleList) {
      const singles = singleList.split(',').map(s => s.trim());
      if (singles.includes(email)) passes = false;
    }
    if (passes && domainList) {
      const domains = domainList.split(',').map(d => d.trim());
      const emailDomain = email.split('@')[1] || '';
      if (domains.includes(emailDomain)) passes = false;
    }

    const branchResult = passes ? 'allowed' : 'blocked';
    console.log('Computed branchResult =', branchResult);

    // 5) Risposta a Journey Builder
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ branchResult });
  } catch (err) {
    console.error('EXECUTE ERROR:', err);
    return res.status(500).json({ error: err.message });
  }
};
