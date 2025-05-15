module.exports = (req, res) => {
  // Chiamato quando l'attività viene pubblicata
  console.log('Publish payload:', req.body);
  return res.status(200).json({ success: true });
};
