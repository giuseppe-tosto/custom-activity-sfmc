module.exports = function (req, res) {
  const email = req.body.inArguments?.[0]?.Email || '';
  const blockedList = ["prova@prova.it"];

  const passed = !blockedList.includes(email.toLowerCase());

  return res.status(200).json({
    branchResult: passed
  });
};
