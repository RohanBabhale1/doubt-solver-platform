import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getProfile,
  getUserDoubts,
  getUserReplies,
  getMyStats,
  updateProfile,
} from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/common/Avatar";
import DoubtCard from "../components/doubt/DoubtCard";
import Spinner from "../components/common/Spinner";
import { formatDate, formatRelativeTime } from "../utils/helpers";

const Profile = () => {
  const { userId } = useParams();
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [replies, setReplies] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("doubts");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const isOwn = user?.id === userId;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, doubtsRes, repliesRes] = await Promise.all([
        getProfile(userId),
        getUserDoubts(userId),
        getUserReplies(userId),
      ]);
      setProfile(profileRes.data);
      setDoubts(doubtsRes.data.doubts || []);
      setReplies(repliesRes.data || []);
      setEditForm({
        name: profileRes.data.name,
        bio: profileRes.data.bio || "",
      });

      if (isOwn) {
        const statsRes = await getMyStats();
        setStats(statsRes.data);
      }
    } catch (err) {
      if (err?.response?.status === 404) navigate("/");
    } finally {
      setLoading(false);
    }
  }, [userId, isOwn, navigate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSaveProfile = async () => {
    setEditError("");
    if (!editForm.name.trim()) return setEditError("Name is required");
    setEditLoading(true);
    try {
      const res = await updateProfile(editForm);
      setProfile((prev) => ({ ...prev, ...res.data }));
      const token = localStorage.getItem("token");
      if (token) loginUser(token, { ...user, ...res.data });
      setEditing(false);
    } catch (err) {
      setEditError(err?.response?.data?.message || "Update failed");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading)
    return (
      <div className="page-loading">
        <Spinner />
      </div>
    );
  if (!profile) return null;

  const displayStats = stats || {
    doubtsCount: doubts.length,
    repliesCount: replies.length,
    votesReceived: 0,
    acceptedAnswers: replies.filter((r) => r.isAccepted).length,
  };

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          <Avatar name={profile.name} avatarUrl={profile.avatarUrl} size="xl" />
        </div>

        <div style={{ flex: 1 }}>
          {editing ? (
            <>
              {editError && (
                <div className="alert alert-error">{editError}</div>
              )}
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-input"
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  style={{ minHeight: 80 }}
                  placeholder="Tell others about yourself..."
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveProfile}
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "💾 Save"}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <h1 className="profile-info-name">{profile.name}</h1>
                {isOwn && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditing(true)}
                  >
                    ✏️ Edit Profile
                  </button>
                )}
              </div>
              {profile.bio && <p className="profile-info-bio">{profile.bio}</p>}
              <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                📅 Joined {formatDate(profile.createdAt)}
              </p>

              <div className="profile-stats" style={{ marginTop: 16 }}>
                {[
                  { val: displayStats.doubtsCount, label: "Doubts" },
                  { val: displayStats.repliesCount, label: "Replies" },
                  { val: displayStats.votesReceived, label: "Votes Received" },
                  { val: displayStats.acceptedAnswers, label: "Accepted" },
                ].map((s) => (
                  <div key={s.label} className="profile-stat">
                    <div className="profile-stat-val">{s.val}</div>
                    <div className="profile-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "doubts" ? "active" : ""}`}
          onClick={() => setActiveTab("doubts")}
        >
          📋 Doubts ({doubts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "replies" ? "active" : ""}`}
          onClick={() => setActiveTab("replies")}
        >
          💬 Replies ({replies.length})
        </button>
      </div>

      {/* Doubts Tab */}
      {activeTab === "doubts" &&
        (doubts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No doubts yet</h3>
            <p>
              {isOwn
                ? "You haven't posted any doubts yet."
                : "This user hasn't posted any doubts."}
            </p>
            {isOwn && (
              <Link to="/create" className="btn btn-primary">
                Post a Doubt
              </Link>
            )}
          </div>
        ) : (
          <div
            className="doubts-grid"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            {doubts.map((d) => (
              <DoubtCard key={d.id} doubt={{ ...d, author: profile }} />
            ))}
          </div>
        ))}

      {/* Replies Tab */}
      {activeTab === "replies" &&
        (replies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3>No replies yet</h3>
            <p>
              {isOwn
                ? "You haven't replied to any doubts yet."
                : "This user hasn't replied to any doubts."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {replies.map((r) => (
              <Link
                key={r.id}
                to={`/doubts/${r.doubtId}`}
                style={{ display: "block" }}
              >
                <div className="card" style={{ padding: "18px 22px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "var(--text-light)" }}>
                      Replied to:{" "}
                      <strong style={{ color: "var(--navy)" }}>
                        {r.doubt?.title}
                      </strong>
                    </span>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      {r.isAccepted && (
                        <span className="badge badge-green">✅ Accepted</span>
                      )}
                      <span
                        style={{ fontSize: 12, color: "var(--text-light)" }}
                      >
                        👍 {r.voteCount} · {formatRelativeTime(r.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--text-mid)",
                      lineHeight: 1.6,
                    }}
                  >
                    {r.body.length > 200
                      ? r.body.slice(0, 200) + "..."
                      : r.body}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ))}
    </div>
  );
};

export default Profile;