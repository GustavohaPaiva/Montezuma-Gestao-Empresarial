function healthCheck(req, res) {
  res.json({ status: "API rodando certinho 🚀" });
}

module.exports = {
  healthCheck,
};
