import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { getUnreadCount } from "../../services/api";

const NotificationBell = () => {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth();

  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadCount();
      setCount(res.data.count);
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = () => {
      setCount((prev) => prev + 1);
    };

    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, [socket]);

  return (
    <button
      className="notification-bell"
      onClick={() => navigate("/notifications")}
      title="Notifications"
    >
      🔔
      {count > 0 && (
        <span className="notification-badge">{count > 9 ? "9+" : count}</span>
      )}
    </button>
  );
};

export default NotificationBell;