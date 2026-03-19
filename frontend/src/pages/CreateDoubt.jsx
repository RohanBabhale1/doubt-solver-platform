import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createDoubt, getSubjects } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const CreateDoubt = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ title: "", body: "", subjectId: "" });
  const [subjects, setSubjects] = useState([]);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    getSubjects()
      .then((res) => setSubjects(res.data))
      .catch(() => {});
  }, [user, navigate]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFile = (f) => {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(f.type)) {
      return setError("Only JPEG and PNG images are allowed");
    }
    if (f.size > 5 * 1024 * 1024) return setError("Image must be under 5MB");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.title.trim()) return setError("Title is required");
    if (!form.body.trim()) return setError("Description is required");
    if (!form.subjectId) return setError("Please select a subject");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("body", form.body.trim());
      fd.append("subjectId", form.subjectId);
      if (file) fd.append("image", file);

      const res = await createDoubt(fd);
      navigate(`/doubts/${res.data.id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create doubt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-doubt-page">
      <h1>✏️ Ask a Doubt</h1>
      <p className="subtitle">Get real-time answers from your peers</p>

      <div className="create-doubt-form">
        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <div className="form-group">
          <label className="form-label">Subject *</label>
          <select
            className="form-input"
            value={form.subjectId}
            onChange={set("subjectId")}
          >
            <option value="">— Select a subject —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.iconEmoji} {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Question Title *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. What is the difference between BFS and DFS?"
            value={form.title}
            onChange={set("title")}
            maxLength={200}
          />
          <div
            className="form-error"
            style={{
              color: "var(--text-light)",
              textAlign: "right",
              marginTop: 4,
            }}
          >
            {form.title.length}/200
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Detailed Description *</label>
          <textarea
            className="form-input"
            placeholder="Explain your doubt in detail. Include what you've tried and where you're stuck."
            value={form.body}
            onChange={set("body")}
            style={{ minHeight: 160 }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Attach Image (optional)</label>
          {preview ? (
            <div className="upload-preview">
              <img src={preview} alt="Preview" />
              <button
                className="upload-preview-remove"
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              className={`upload-zone ${dragOver ? "drag-over" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files[0]);
              }}
            >
              <div className="upload-icon">📷</div>
              <p>Click to upload or drag & drop</p>
              <span>JPEG, PNG — max 5MB</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Link to="/doubts" className="btn btn-ghost">
            Cancel
          </Link>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "⏳ Posting..." : "🚀 Post Doubt"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDoubt;