const prisma = require('../config/db');

exports.getProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, bio: true, avatarUrl: true, createdAt: true,
        _count: { select: { doubts: true, replies: true } }
      }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(name && { name: name.trim() }),
        ...(bio !== undefined && { bio: bio.trim() })
      },
      select: { id: true, name: true, email: true, bio: true, avatarUrl: true }
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const avatarUrl = `/uploads/${req.file.filename}`;
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatarUrl },
      select: { id: true, name: true, avatarUrl: true }
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.getUserDoubts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [doubts, total] = await Promise.all([
      prisma.doubt.findMany({
        where: { authorId: userId },
        include: {
          subject: true,
          _count: { select: { replies: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.doubt.count({ where: { authorId: userId } })
    ]);

    res.json({ doubts, total });
  } catch (err) {
    next(err);
  }
};

exports.getUserReplies = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const replies = await prisma.reply.findMany({
      where: { authorId: userId },
      include: {
        doubt: {
          select: { id: true, title: true, subject: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(replies);
  } catch (err) {
    next(err);
  }
};

exports.getMyStats = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [doubtsCount, repliesCount, votesReceived, acceptedAnswers] = await Promise.all([
      prisma.doubt.count({ where: { authorId: userId } }),
      prisma.reply.count({ where: { authorId: userId } }),
      prisma.vote.count({ where: { reply: { authorId: userId } } }),
      prisma.reply.count({ where: { authorId: userId, isAccepted: true } })
    ]);

    res.json({ doubtsCount, repliesCount, votesReceived, acceptedAnswers });
  } catch (err) {
    next(err);
  }
};