module.exports = (req, res) => {
  // Riceve la configurazione dal config.html
  console.log('Save payload:', req.body);
  return res.status(200).json({ success: true });
};
