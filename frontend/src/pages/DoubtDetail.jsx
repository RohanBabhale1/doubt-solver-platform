import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getDoubt, createReply, deleteDoubt } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import ReplyCard from "../components/reply/ReplyCard";
import ReplyForm from "../components/reply/ReplyForm";
import TypingIndicator from "../components/reply/TypingIndicator";
import Avatar from "../components/common/Avatar";
import Spinner from "../components/common/Spinner";
import { formatDate, formatRelativeTime } from "../utils/helpers";

const DoubtDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [doubt, setDoubt] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [replyError, setReplyError] = useState("");

  const fetchDoubt = useCallback(async () => {
    try {
      const res = await getDoubt(id);
      setDoubt(res.data);
      setReplies(res.data.replies || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load doubt");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDoubt();
  }, [fetchDoubt]);

  // Socket.io events
  useEffect(() => {
    if (!socket) return;

    socket.emit("join_doubt", { doubtId: id });

    socket.on("new_reply", (reply) => {
      setReplies((prev) => {
        if (prev.find((r) => r.id === reply.id)) return prev;
        return [...prev, reply];
      });
    });

    socket.on("user_typing", ({ userName }) => {
      setTypingUser(userName);
      setTimeout(() => setTypingUser(""), 3000);
    });

    socket.on("user_stopped_typing", () => setTypingUser(""));

    socket.on("vote_updated", ({ replyId, voteCount }) => {
      setReplies((prev) =>
        prev.map((r) => (r.id === replyId ? { ...r, voteCount } : r)),
      );
    });

    socket.on("answer_accepted", ({ replyId }) => {
      setReplies((prev) =>
        prev.map((r) => ({
          ...r,
          isAccepted: r.id === replyId,
        })),
      );
      setDoubt((d) => (d ? { ...d, isSolved: true } : d));
    });

    socket.on("doubt_solved", () => {
      setDoubt((d) => (d ? { ...d, isSolved: true } : d));
    });

    return () => {
      socket.emit("leave_doubt", { doubtId: id });
      socket.off("new_reply");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
      socket.off("vote_updated");
      socket.off("answer_accepted");
      socket.off("doubt_solved");
    };
  }, [socket, id]);

  const handleReplySubmit = async (body) => {
    setReplyError("");
    if (!user) return navigate("/login");
    try {
      await createReply(id, { body });
    } catch (err) {
      setReplyError(err?.response?.data?.message || "Failed to post reply");
    }
  };

  const handleAccepted = (replyId) => {
    setReplies((prev) =>
      prev.map((r) => ({ ...r, isAccepted: r.id === replyId })),
    );
    setDoubt((d) => (d ? { ...d, isSolved: true } : d));
  };

  const handleDeleted = (replyId) => {
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
  };

  const handleVoted = (replyId, voteCount) => {
    setReplies((prev) =>
      prev.map((r) => (r.id === replyId ? { ...r, voteCount } : r)),
    );
  };

  const handleDeleteDoubt = async () => {
    if (!window.confirm("Delete this doubt? This cannot be undone.")) return;
    try {
      await deleteDoubt(id);
      navigate("/doubts");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete");
    }
  };

  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner text="Loading doubt..." />
    </div>
  );
  if (error)
    return (
      <div
        className="container"
        style={{ padding: "60px 24px", textAlign: "center" }}
      >
        <div className="alert alert-error">{error}</div>
        <Link
          to="/doubts"
          className="btn btn-outline"
          style={{ marginTop: 16 }}
        >
          ← Back to Doubts
        </Link>
      </div>
    );

  const acceptedReplies = replies.filter((r) => r.isAccepted);
  const otherReplies = replies.filter((r) => !r.isAccepted);
  const sortedReplies = [...acceptedReplies, ...otherReplies];

  return (
    <div className="doubt-detail-page">
      {/* ——— MAIN ——— */}
      <div className="doubt-detail-main">
        {/* Doubt Header */}
        <div className="doubt-detail-header">
          <div className="doubt-detail-subject-badge">
            <span className="badge badge-primary">
              {doubt.subject?.iconEmoji} {doubt.subject?.name}
            </span>
            {doubt.isSolved && (
              <span className="badge badge-green" style={{ marginLeft: 8 }}>
                ✅ Solved
              </span>
            )}
          </div>

          <h1 className="doubt-detail-title">{doubt.title}</h1>
          <p className="doubt-detail-body">{doubt.body}</p>

          {doubt.imageUrl && (
            <img
              className="doubt-detail-image"
              src={
                doubt.imageUrl.startsWith("http")
                  ? doubt.imageUrl
                  : `http://localhost:5000${doubt.imageUrl}`
              }
              alt="Doubt attachment"
            />
          )}

          <div className="doubt-detail-meta">
            <div className="doubt-meta-item">
              <Avatar
                name={doubt.author?.name}
                avatarUrl={doubt.author?.avatarUrl}
                size="sm"
              />
              <Link
                to={`/profile/${doubt.authorId}`}
                style={{ fontWeight: 600, color: "var(--navy)" }}
              >
                {doubt.author?.name}
              </Link>
            </div>
            <div className="doubt-meta-item">
              📅 {formatDate(doubt.createdAt)}
            </div>
            <div className="doubt-meta-item">👁 {doubt.viewCount} views</div>
            <div className="doubt-meta-item">💬 {replies.length} replies</div>
            {user && user.id === doubt.authorId && (
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDeleteDoubt}
              >
                🗑 Delete
              </button>
            )}
          </div>
        </div>

        {/* Replies */}
        <div className="replies-section">
          <h2 className="replies-section-title">
            💬 {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </h2>

          <TypingIndicator userName={typingUser} />

          {sortedReplies.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 0" }}>
              <div className="empty-state-icon">🤫</div>
              <h3>No replies yet</h3>
              <p>Be the first to answer this doubt!</p>
            </div>
          ) : (
            sortedReplies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                doubtAuthorId={doubt.authorId}
                onAccepted={handleAccepted}
                onDeleted={handleDeleted}
                onVoted={handleVoted}
              />
            ))
          )}
        </div>

        {/* Reply Form */}
        <div className="reply-form-section">
          <h3>✍️ Post Your Answer</h3>
          {replyError && <div className="alert alert-error">{replyError}</div>}
          {user ? (
            <ReplyForm doubtId={id} onSubmit={handleReplySubmit} />
          ) : (
            <div className="alert alert-info">
              <Link
                to="/login"
                style={{ fontWeight: 700, color: "var(--primary)" }}
              >
                Sign in
              </Link>{" "}
              to post a reply.
            </div>
          )}
        </div>
      </div>

      {/* ——— SIDEBAR ——— */}
      <div className="doubt-detail-sidebar">
        <div className="sidebar-card">
          <h4>👤 Asked By</h4>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar
              name={doubt.author?.name}
              avatarUrl={doubt.author?.avatarUrl}
              size="md"
            />
            <div>
              <Link
                to={`/profile/${doubt.authorId}`}
                style={{ fontWeight: 700, color: "var(--navy)", fontSize: 14 }}
              >
                {doubt.author?.name}
              </Link>
              {doubt.author?.bio && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-light)",
                    marginTop: 3,
                  }}
                >
                  {doubt.author.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-card">
          <h4>📊 Doubt Info</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Subject", value: doubt.subject?.name },
              { label: "Posted", value: formatRelativeTime(doubt.createdAt) },
              { label: "Views", value: doubt.viewCount },
              { label: "Replies", value: replies.length },
              {
                label: "Status",
                value: doubt.isSolved ? "✅ Solved" : "❓ Open",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--text-light)" }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: "var(--navy)" }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-card">
          <h4>💡 Tips for Answering</h4>
          <ul
            style={{
              fontSize: 13,
              color: "var(--text-mid)",
              paddingLeft: 16,
              lineHeight: 1.8,
            }}
          >
            <li>Be clear and step-by-step</li>
            <li>Provide examples when possible</li>
            <li>Use proper terminology</li>
            <li>Keep it focused on the question</li>
          </ul>
        </div>

        <Link to="/doubts" style={{ display: "block" }}>
          <button
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "center" }}
          >
            ← Back to All Doubts
          </button>
        </Link>
      </div>
    </div>
  );
};

export default DoubtDetail;