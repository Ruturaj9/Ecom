module.exports = (err, req, res, next) => {
  console.error("Error:", err);
  if (res.headersSent) return next(err);

  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
};
