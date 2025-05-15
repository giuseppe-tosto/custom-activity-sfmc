module.exports = (req, res) => {
  // Chiamato in fase di validazione
  console.log('Validate payload:', req.body);
  return res.status(200).json({ success: true });
};
