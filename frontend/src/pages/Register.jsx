import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.name || !form.email || !form.password)
      return setError("All fields are required");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters");
    setLoading(true);
    try {
      const res = await apiRegister(form);
      loginUser(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-card-icon">✨</div>
          <h1 className="auth-card-title">Create Account</h1>
          <p className="auth-card-subtitle">
            Join thousands of students on DoubtSolve
          </p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="Your full name"
            value={form.name}
            onChange={set("name")}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            placeholder="you@university.edu"
            value={form.email}
            onChange={set("email")}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Minimum 8 characters"
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
          {loading ? "⏳ Creating account..." : "✨ Create Account"}
        </button>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in →</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
