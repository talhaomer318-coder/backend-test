function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.status || 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message,
  });
}

export default errorHandler;