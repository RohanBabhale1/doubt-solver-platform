const prisma = require('../config/db');
const redis = require('../config/redis');
const { publishEvent } = require('../kafka/producer');
const { getIO } = require('../config/socket');

exports.toggleVote = async (req, res, next) => {
  try {
    const { id: replyId } = req.params;
    const userId = req.user.userId;

    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
      include: { author: { select: { id: true, name: true } } }
    });
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    if (reply.authorId === userId) {
      return res.status(400).json({ message: 'You cannot vote on your own reply' });
    }

    const existing = await prisma.vote.findUnique({
      where: { replyId_userId: { replyId, userId } }
    });

    let newCount;
    let action;

    if (existing) {
      await prisma.$transaction([
        prisma.vote.delete({ where: { id: existing.id } }),
        prisma.reply.update({ where: { id: replyId }, data: { voteCount: { decrement: 1 } } })
      ]);
      const updated = await prisma.reply.findUnique({ where: { id: replyId } });
      newCount = updated.voteCount;
      action = 'removed';
    } else {
      await prisma.$transaction([
        prisma.vote.create({ data: { replyId, userId } }),
        prisma.reply.update({ where: { id: replyId }, data: { voteCount: { increment: 1 } } })
      ]);
      const updated = await prisma.reply.findUnique({ where: { id: replyId } });
      newCount = updated.voteCount;
      action = 'added';
    }

    await redis.del(`doubt:${reply.doubtId}`);

    try {
      const io = getIO();
      io.to(`doubt:${reply.doubtId}`).emit('vote_updated', { replyId, voteCount: newCount });
    } catch (_) {}

    if (action === 'added') {
      const voter = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await publishEvent('vote-events', {
        event: 'reply-upvoted',
        timestamp: new Date().toISOString(),
        data: {
          replyId,
          replyAuthorId: reply.authorId,
          voterId: userId,
          voterName: voter?.name || 'Someone'
        }
      });
    } else {
      await publishEvent('vote-events', {
        event: 'vote-removed',
        timestamp: new Date().toISOString(),
        data: { replyId, userId }
      });
    }

    res.json({ action, voteCount: newCount, voted: action === 'added' });
  } catch (err) {
    next(err);
  }
};

exports.getVotes = async (req, res, next) => {
  try {
    const { id: replyId } = req.params;
    const reply = await prisma.reply.findUnique({ where: { id: replyId }, select: { voteCount: true } });
    if (!reply) return res.status(404).json({ message: 'Reply not found' });
    res.json({ replyId, voteCount: reply.voteCount });
  } catch (err) {
    next(err);
  }
};

exports.getMyVotes = async (req, res, next) => {
  try {
    const votes = await prisma.vote.findMany({
      where: { userId: req.user.userId },
      include: { reply: { select: { id: true, body: true, doubtId: true, voteCount: true } } }
    });
    res.json(votes);
  } catch (err) {
    next(err);
  }
};