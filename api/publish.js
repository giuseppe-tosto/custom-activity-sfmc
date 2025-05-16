module.exports = (req, res) => {
  // Viene chiamato subito dopo validate, sempre in Publish
  console.log('--- PUBLISH CALLED ---', JSON.stringify(req.body));
  return res.status(200).json({});
};
