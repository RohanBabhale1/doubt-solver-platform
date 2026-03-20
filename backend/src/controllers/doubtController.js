const prisma = require('../config/db');
const redis = require('../config/redis');
const { publishEvent } = require('../kafka/producer');
const { getIO } = require('../config/socket');

const DOUBT_INCLUDE = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  subject: true,
  _count: { select: { replies: true } }
};

exports.createDoubt = async (req, res, next) => {
  try {
    const { title, body, subjectId } = req.body;

    if (!title || !body || !subjectId) {
      return res.status(400).json({ message: 'Title, body, and subject are required' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(400).json({ message: 'Invalid subject' });

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const doubt = await prisma.doubt.create({
      data: { title: title.trim(), body: body.trim(), imageUrl, subjectId, authorId: req.user.userId },
      include: DOUBT_INCLUDE
    });

    await redis.del('doubts:popular');

    await publishEvent('doubt-events', {
      event: 'doubt-created',
      timestamp: new Date().toISOString(),
      data: {
        doubtId: doubt.id,
        title: doubt.title,
        subjectId,
        authorId: doubt.authorId,
        authorName: doubt.author.name
      }
    });

    try {
      const io = getIO();
      io.emit('new_doubt', {
        id: doubt.id,
        title: doubt.title,
        subject: doubt.subject.name,
        authorName: doubt.author.name,
        createdAt: doubt.createdAt
      });
    } catch (_) {}

    res.status(201).json(doubt);
  } catch (err) {
    next(err);
  }
};

exports.getDoubts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, subjectId, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    if (sort === 'popular' && !subjectId && page === '1') {
      const cached = await redis.get('doubts:popular');
      if (cached) return res.json(JSON.parse(cached));
    }

    const where = {};
    if (subjectId) where.subjectId = subjectId;
    if (sort === 'unsolved') where.isSolved = false;

    let orderBy;
    if (sort === 'popular') orderBy = { replies: { _count: 'desc' } };
    else orderBy = { createdAt: 'desc' };

    const [doubts, total] = await Promise.all([
      prisma.doubt.findMany({ where, include: DOUBT_INCLUDE, orderBy, skip, take }),
      prisma.doubt.count({ where })
    ]);

    const result = { doubts, total, page: parseInt(page), limit: take, pages: Math.ceil(total / take) };

    if (sort === 'popular' && !subjectId && page === '1') {
      await redis.set('doubts:popular', JSON.stringify(result), 'EX', 300);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getDoubtById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `doubt:${id}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      await prisma.doubt.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
      return res.json(JSON.parse(cached));
    }

    const doubt = await prisma.doubt.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, bio: true } },
        subject: true,
        replies: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            votes: { select: { userId: true } }
          },
          orderBy: [{ isAccepted: 'desc' }, { voteCount: 'desc' }, { createdAt: 'asc' }]
        }
      }
    });

    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    await prisma.doubt.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    await redis.set(cacheKey, JSON.stringify(doubt), 'EX', 120);

    res.json(doubt);
  } catch (err) {
    next(err);
  }
};

exports.updateDoubt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, body, subjectId } = req.body;

    const doubt = await prisma.doubt.findUnique({ where: { id } });
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });
    if (doubt.authorId !== req.user.userId) return res.status(403).json({ message: 'Forbidden' });

    const updated = await prisma.doubt.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(body && { body: body.trim() }),
        ...(subjectId && { subjectId })
      },
      include: DOUBT_INCLUDE
    });

    await redis.del(`doubt:${id}`);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteDoubt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doubt = await prisma.doubt.findUnique({ where: { id } });
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });
    if (doubt.authorId !== req.user.userId) return res.status(403).json({ message: 'Forbidden' });

    await prisma.doubt.delete({ where: { id } });
    await redis.del(`doubt:${id}`);
    await redis.del('doubts:popular');

    await publishEvent('doubt-events', {
      event: 'doubt-deleted',
      timestamp: new Date().toISOString(),
      data: { doubtId: id, authorId: doubt.authorId }
    });

    res.json({ message: 'Doubt deleted' });
  } catch (err) {
    next(err);
  }
};

exports.solveDoubt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doubt = await prisma.doubt.findUnique({ where: { id } });
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });
    if (doubt.authorId !== req.user.userId) return res.status(403).json({ message: 'Forbidden' });

    const updated = await prisma.doubt.update({
      where: { id },
      data: { isSolved: true },
      include: DOUBT_INCLUDE
    });

    await redis.del(`doubt:${id}`);

    try {
      const io = getIO();
      io.to(`doubt:${id}`).emit('doubt_solved', { doubtId: id });
    } catch (_) {}

    await publishEvent('doubt-events', {
      event: 'doubt-solved',
      timestamp: new Date().toISOString(),
      data: { doubtId: id, authorId: doubt.authorId }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.getPopularDoubts = async (req, res, next) => {
  try {
    const cached = await redis.get('doubts:popular');
    if (cached) return res.json(JSON.parse(cached));

    const doubts = await prisma.doubt.findMany({
      include: DOUBT_INCLUDE,
      orderBy: { replies: { _count: 'desc' } },
      take: 10
    });

    await redis.set('doubts:popular', JSON.stringify(doubts), 'EX', 300);
    res.json(doubts);
  } catch (err) {
    next(err);
  }
};

exports.getRecentDoubts = async (req, res, next) => {
  try {
    const doubts = await prisma.doubt.findMany({
      include: DOUBT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    res.json(doubts);
  } catch (err) {
    next(err);
  }
};

exports.getUnsolvedDoubts = async (req, res, next) => {
  try {
    const doubts = await prisma.doubt.findMany({
      where: { isSolved: false },
      include: DOUBT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(doubts);
  } catch (err) {
    next(err);
  }
};

exports.getMyDoubts = async (req, res, next) => {
  try {
    const doubts = await prisma.doubt.findMany({
      where: { authorId: req.user.userId },
      include: DOUBT_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });
    res.json(doubts);
  } catch (err) {
    next(err);
  }
};

exports.incrementView = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.doubt.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    res.json({ message: 'View counted' });
  } catch (err) {
    next(err);
  }
};