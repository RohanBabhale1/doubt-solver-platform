import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { logout as apiLogout } from "../../services/api";
import Avatar from "../common/Avatar";
import NotificationBell from "../notification/NotificationBell";
import { useState } from "react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (_) {}
    logout();
    navigate("/");
  };

  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <>
      {!user && (
        <div className="announcement-bar">
          Welcome to DoubtSolve! Get your academic questions answered in real
          time. <span onClick={() => navigate("/register")}>Join Now →</span>
        </div>
      )}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">🎓</span>
            <span>Doubt<span style={{ color: 'var(--primary)' }}>Solve</span></span>
          </Link>

          <ul className="navbar-nav">
            <li>
              <Link to="/" className={isActive("/")}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/doubts" className={isActive("/doubts")}>
                Doubts
              </Link>
            </li>
            {user && (
              <li>
                <Link to="/create" className={isActive("/create")}>
                  Ask a Doubt
                </Link>
              </li>
            )}
            {user && (
              <li>
                <Link
                  to={`/profile/${user.id}`}
                  className={isActive(`/profile/${user.id}`)}
                >
                  Profile
                </Link>
              </li>
            )}
          </ul>

          <div className="navbar-actions">
            {user ? (
              <>
                <NotificationBell />
                <Link to={`/profile/${user.id}`} className="navbar-user">
                  <Avatar
                    name={user.name}
                    avatarUrl={user.avatarUrl}
                    size="sm"
                  />
                  <span className="navbar-user-name">
                    {user.name.split(" ")[0]}
                  </span>
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
