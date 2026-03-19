import { useNavigate } from 'react-router-dom';
const NotificationBell = () => {
  const navigate = useNavigate();
  return (
    <button className="notification-bell" onClick={() => navigate('/notifications')} title="Notifications">
      🔔
    </button>
  );
};
export default NotificationBell;