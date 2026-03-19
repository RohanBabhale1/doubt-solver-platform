const prisma = require('../config/db');

exports.getSubjects = async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: { _count: { select: { doubts: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(subjects);
  } catch (err) {
    next(err);
  }
};

exports.createSubject = async (req, res, next) => {
  try {
    const { name, iconEmoji, colorHex } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const subject = await prisma.subject.create({
      data: { name: name.trim(), iconEmoji: iconEmoji || '📚', colorHex: colorHex || '#1DBF73' }
    });
    res.status(201).json(subject);
  } catch (err) {
    next(err);
  }
};

exports.getDoubtsBySubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const [doubts, total] = await Promise.all([
      prisma.doubt.findMany({
        where: { subjectId: id },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          subject: true,
          _count: { select: { replies: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.doubt.count({ where: { subjectId: id } })
    ]);

    res.json({ subject, doubts, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

exports.getSubjectStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const [total, solved, unsolved] = await Promise.all([
      prisma.doubt.count({ where: { subjectId: id } }),
      prisma.doubt.count({ where: { subjectId: id, isSolved: true } }),
      prisma.doubt.count({ where: { subjectId: id, isSolved: false } })
    ]);

    res.json({ subject, stats: { total, solved, unsolved } });
  } catch (err) {
    next(err);
  }
};