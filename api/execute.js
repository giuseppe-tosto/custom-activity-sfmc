module.exports = (req, res) => {
  const payload = req.body;
  const inArgs = payload.inArguments && payload.inArguments[0] || {};
  const email = inArgs.EmailAddress || '';
  const blocked = ['giuseppe.tosto@skylabs.it'];
  const passed = !blocked.includes(email);
  return res.status(200).json({ branchResult: passed ? 'yes' : 'no' });
};
