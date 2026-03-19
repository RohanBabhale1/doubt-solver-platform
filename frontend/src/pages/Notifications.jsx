import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} from "../services/api";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/common/Spinner";
import { formatRelativeTime } from "../utils/helpers";

const TYPE_ICONS = {
  REPLY_RECEIVED: "💬",
  VOTE_RECEIVED: "👍",
  ANSWER_ACCEPTED: "🏆",
  NEW_DOUBT_IN_SUBJECT: "📢",
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const fetch = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications || []);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!socket) return;
    const handle = (notif) => setNotifications((prev) => [notif, ...prev]);
    socket.on("notification", handle);
    return () => socket.off("notification", handle);
  }, [socket]);

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (_) {}
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (_) {}
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (_) {}
  };

  const handleClick = (notif) => {
    if (!notif.isRead) handleMarkRead(notif.id);
    if (notif.referenceType === "doubt" && notif.referenceId) {
      navigate(`/doubts/${notif.referenceId}`);
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="notifications-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1>🔔 Notifications</h1>
          {unread > 0 && (
            <p
              style={{ color: "var(--text-light)", fontSize: 14, marginTop: 4 }}
            >
              {unread} unread notification{unread !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={handleMarkAll}>
            ✓ Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <Spinner text="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔕</div>
          <h3>No notifications</h3>
          <p>
            When someone replies to your doubts or upvotes your answers, you'll
            see it here.
          </p>
        </div>
      ) : (
        notifications.map((notif) => (
          <div
            key={notif.id}
            className={`notification-item ${!notif.isRead ? "unread" : ""}`}
            onClick={() => handleClick(notif)}
          >
            <div className="notification-icon">
              {TYPE_ICONS[notif.type] || "🔔"}
            </div>
            <div className="notification-content">
              <div className="notification-message">{notif.message}</div>
              <div className="notification-time">
                {formatRelativeTime(notif.createdAt)}
              </div>
            </div>
            {!notif.isRead && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  flexShrink: 0,
                  marginTop: 6,
                }}
              />
            )}
            <button
              className="notification-delete"
              onClick={(e) => handleDelete(notif.id, e)}
              title="Delete"
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default Notifications;