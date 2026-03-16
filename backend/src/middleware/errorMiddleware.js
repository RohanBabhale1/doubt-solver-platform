const errorMiddleware = (err, req, res, next) => {
  console.error('[Error]', err.message);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
  }
  if (err.message === 'Only JPEG and PNG images are allowed') {
    return res.status(400).json({ message: err.message });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field';
    return res.status(409).json({ message: `${field} already exists` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ message: 'Invalid reference — related record not found' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
};

module.exports = errorMiddleware;