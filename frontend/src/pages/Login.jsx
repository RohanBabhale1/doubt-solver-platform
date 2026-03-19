import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password)
      return setError("All fields are required");
    setLoading(true);
    try {
      const res = await apiLogin(form);
      loginUser(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email) => setForm({ email, password: "password123" });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-card-icon">🎓</div>
          <h1 className="auth-card-title">Welcome Back</h1>
          <p className="auth-card-subtitle">
            Sign in to your DoubtSolve account
          </p>
        </div>

        <div className="demo-creds">
          <p>🧪 Demo accounts:</p>
          <p>
            <strong
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => fillDemo("alice@demo.com")}
            >
              alice@demo.com
            </strong>{" "}
            or{" "}
            <strong
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => fillDemo("bob@demo.com")}
            >
              bob@demo.com
            </strong>{" "}
            / password123
          </p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            placeholder="you@university.edu"
            value={form.email}
            onChange={set("email")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Your password"
            value={form.password}
            onChange={set("password")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "13px" }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "⏳ Signing in..." : "→ Sign In"}
        </button>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one →</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
