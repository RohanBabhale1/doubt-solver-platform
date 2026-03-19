const prisma = require('../config/db');
const redis = require('../config/redis');
const { publishEvent } = require('../kafka/producer');
const { getIO } = require('../config/socket');

const REPLY_INCLUDE = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  votes: { select: { userId: true } }
};

exports.getReplies = async (req, res, next) => {
  try {
    const { id: doubtId } = req.params;
    const replies = await prisma.reply.findMany({
      where: { doubtId },
      include: REPLY_INCLUDE,
      orderBy: [{ isAccepted: 'desc' }, { voteCount: 'desc' }, { createdAt: 'asc' }]
    });
    res.json(replies);
  } catch (err) {
    next(err);
  }
};

exports.createReply = async (req, res, next) => {
  try {
    const { id: doubtId } = req.params;
    const { body } = req.body;

    if (!body || body.trim().length === 0) {
      return res.status(400).json({ message: 'Reply body is required' });
    }

    const doubt = await prisma.doubt.findUnique({
      where: { id: doubtId },
      include: { author: { select: { id: true, name: true } } }
    });
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    const reply = await prisma.reply.create({
      data: { body: body.trim(), doubtId, authorId: req.user.userId },
      include: REPLY_INCLUDE
    });

    await redis.del(`doubt:${doubtId}`);

    try {
      const io = getIO();
      io.to(`doubt:${doubtId}`).emit('new_reply', reply);
    } catch (_) {}

    const author = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true }
    });

    await publishEvent('reply-events', {
      event: 'reply-added',
      timestamp: new Date().toISOString(),
      data: {
        replyId: reply.id,
        doubtId,
        doubtAuthorId: doubt.authorId,
        replyAuthorId: req.user.userId,
        replyAuthorName: author?.name || 'Someone'
      }
    });

    res.status(201).json(reply);
  } catch (err) {
    next(err);
  }
};

exports.updateReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    if (!body) return res.status(400).json({ message: 'Body is required' });

    const reply = await prisma.reply.findUnique({ where: { id } });
    if (!reply) return res.status(404).json({ message: 'Reply not found' });
    if (reply.authorId !== req.user.userId) return res.status(403).json({ message: 'Forbidden' });

    const updated = await prisma.reply.update({
      where: { id },
      data: { body: body.trim() },
      include: REPLY_INCLUDE
    });

    await redis.del(`doubt:${reply.doubtId}`);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reply = await prisma.reply.findUnique({ where: { id } });
    if (!reply) return res.status(404).json({ message: 'Reply not found' });
    if (reply.authorId !== req.user.userId) return res.status(403).json({ message: 'Forbidden' });

    await prisma.reply.delete({ where: { id } });
    await redis.del(`doubt:${reply.doubtId}`);

    await publishEvent('reply-events', {
      event: 'reply-deleted',
      timestamp: new Date().toISOString(),
      data: { replyId: id, doubtId: reply.doubtId, authorId: reply.authorId }
    });

    res.json({ message: 'Reply deleted' });
  } catch (err) {
    next(err);
  }
};

exports.acceptReply = async (req, res, next) => {
  try {
    const { id: replyId } = req.params;

    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
      include: { doubt: true, author: { select: { id: true, name: true } } }
    });
    if (!reply) return res.status(404).json({ message: 'Reply not found' });
    if (reply.doubt.authorId !== req.user.userId) {
      return res.status(403).json({ message: 'Only the doubt author can accept an answer' });
    }

    await prisma.$transaction([
      prisma.reply.updateMany({
        where: { doubtId: reply.doubtId, isAccepted: true },
        data: { isAccepted: false }
      }),
      prisma.reply.update({
        where: { id: replyId },
        data: { isAccepted: true }
      }),
      prisma.doubt.update({
        where: { id: reply.doubtId },
        data: { isSolved: true }
      })
    ]);

    const updated = await prisma.reply.findUnique({ where: { id: replyId }, include: REPLY_INCLUDE });

    await redis.del(`doubt:${reply.doubtId}`);

    try {
      const io = getIO();
      io.to(`doubt:${reply.doubtId}`).emit('answer_accepted', { replyId, doubtId: reply.doubtId });
      io.to(`doubt:${reply.doubtId}`).emit('doubt_solved', { doubtId: reply.doubtId });
    } catch (_) {}

    await publishEvent('reply-events', {
      event: 'answer-accepted',
      timestamp: new Date().toISOString(),
      data: {
        replyId,
        doubtId: reply.doubtId,
        replyAuthorId: reply.authorId,
        replyAuthorName: reply.author.name
      }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.getReplyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reply = await prisma.reply.findUnique({ where: { id }, include: REPLY_INCLUDE });
    if (!reply) return res.status(404).json({ message: 'Reply not found' });
    res.json(reply);
  } catch (err) {
    next(err);
  }
};