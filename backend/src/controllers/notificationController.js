const prisma = require('../config/db');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.notification.count({ where: { userId: req.user.userId } })
    ]);

    res.json({ notifications, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

exports.getUnread = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId, isRead: false },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.userId, isRead: false }
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (notification.userId !== req.user.userId) return res.status(403).json({ message: 'Forbidden' });

    const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (notification.userId !== req.user.userId) return res.status(403).json({ message: 'Forbidden' });

    await prisma.notification.delete({ where: { id } });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};