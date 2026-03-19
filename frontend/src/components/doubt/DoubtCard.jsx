import { useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";
import { formatRelativeTime } from "../../utils/helpers";

const bannerColors = {
  Mathematics: "linear-gradient(135deg,#fff9e0,#fef3c7)",
  Chemistry: "linear-gradient(135deg,#e8faf2,#d0f5e3)",
  Physics: "linear-gradient(135deg,#ebf8ff,#bee3f8)",
  "Computer Science": "linear-gradient(135deg,#f0ebff,#e0d0ff)",
  Biology: "linear-gradient(135deg,#fff5f5,#fed7d7)",
  History: "linear-gradient(135deg,#fff7ed,#fed7aa)",
  Literature: "linear-gradient(135deg,#fdf2f8,#fce7f3)",
  Economics: "linear-gradient(135deg,#ecfeff,#cffafe)",
};

const DoubtCard = ({ doubt }) => {
  const navigate = useNavigate();
  const subjectName = doubt.subject?.name || "";
  const bg =
    bannerColors[subjectName] || "linear-gradient(135deg,#f0f4ff,#e0e8ff)";

  return (
    <div className="doubt-card" onClick={() => navigate(`/doubts/${doubt.id}`)}>
      <div
        className="doubt-card-banner"
        style={{ background: doubt.imageUrl ? undefined : bg }}
      >
        {doubt.imageUrl ? (
          <img
            src={
              doubt.imageUrl.startsWith("http")
                ? doubt.imageUrl
                : `http://localhost:5000${doubt.imageUrl}`
            }
            alt={doubt.title}
          />
        ) : (
          <span style={{ fontSize: 52, opacity: 0.5 }}>
            {doubt.subject?.iconEmoji || "📚"}
          </span>
        )}
        <span className="doubt-card-subject-badge">{subjectName}</span>
        <button
          className="doubt-card-bookmark"
          onClick={(e) => e.stopPropagation()}
          title="Bookmark"
        >
          🔖
        </button>
        {doubt.isSolved && (
          <div className="solved-overlay">
            <span className="solved-label">✅ Solved</span>
          </div>
        )}
      </div>

      <div className="doubt-card-body">
        <div className="doubt-card-author">
          <Avatar
            name={doubt.author?.name}
            avatarUrl={doubt.author?.avatarUrl}
            size="sm"
          />
          <span className="doubt-card-author-name">{doubt.author?.name}</span>
        </div>

        <h3 className="doubt-card-title">{doubt.title}</h3>

        <div className="doubt-card-footer">
          <div className="doubt-card-stat">
            <span>💬</span>
            <span>{doubt._count?.replies || 0} replies</span>
          </div>
          <div className="doubt-card-stat">
            <span>👁</span>
            <span>{doubt.viewCount || 0}</span>
          </div>
          <div className="doubt-card-stat">
            <span style={{ color: "var(--text-light)" }}>
              {formatRelativeTime(doubt.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoubtCard;