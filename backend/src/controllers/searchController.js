const prisma = require('../config/db');

exports.searchDoubts = async (req, res, next) => {
  try {
    const { q, subject, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (subject) {
      const subjectRecord = await prisma.subject.findFirst({
        where: { name: { contains: subject, mode: 'insensitive' } }
      });
      if (subjectRecord) where.subjectId = subjectRecord.id;
    }

    const [doubts, total] = await Promise.all([
      prisma.doubt.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          subject: true,
          _count: { select: { replies: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.doubt.count({ where })
    ]);

    res.json({ doubts, total, page: parseInt(page), limit: parseInt(limit), query: q || '', subject: subject || '' });
  } catch (err) {
    next(err);
  }
};

exports.searchSubjects = async (req, res, next) => {
  try {
    const { q } = req.query;
    const subjects = await prisma.subject.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
      include: { _count: { select: { doubts: true } } }
    });
    res.json(subjects);
  } catch (err) {
    next(err);
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await prisma.user.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: {
        id: true, name: true, avatarUrl: true, bio: true,
        _count: { select: { doubts: true, replies: true } }
      },
      take: 10
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};