module.exports = (req, res) => {
  // Viene chiamato in fase di Publish del Journey
  console.log('--- VALIDATE CALLED ---', JSON.stringify(req.body));
  return res.status(200).json({});
};
