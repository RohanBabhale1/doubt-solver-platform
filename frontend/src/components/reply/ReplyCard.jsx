import { useState } from "react";
import Avatar from "../common/Avatar";
import { formatRelativeTime } from "../../utils/helpers";
import { toggleVote, acceptReply, deleteReply } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

const ReplyCard = ({
  reply,
  doubtAuthorId,
  onAccepted,
  onDeleted,
  onVoted,
}) => {
  const { user } = useAuth();
  const [voteCount, setVoteCount] = useState(reply.voteCount);
  const [voted, setVoted] = useState(
    reply.votes?.some((v) => v.userId === user?.id),
  );
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const res = await toggleVote(reply.id);
      setVoteCount(res.data.voteCount);
      setVoted(res.data.voted);
      if (onVoted) onVoted(reply.id, res.data.voteCount);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to vote");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      await acceptReply(reply.id);
      if (onAccepted) onAccepted(reply.id);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to accept");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      await deleteReply(reply.id);
      if (onDeleted) onDeleted(reply.id);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className={`reply-card ${reply.isAccepted ? "accepted" : ""}`}>
      <div className="reply-header">
        <div className="reply-author">
          <Avatar
            name={reply.author?.name}
            avatarUrl={reply.author?.avatarUrl}
            size="sm"
          />
          <div>
            <div className="reply-author-name">{reply.author?.name}</div>
            <div className="reply-time">
              {formatRelativeTime(reply.createdAt)}
            </div>
          </div>
        </div>
        {reply.isAccepted && (
          <span className="accepted-badge">✅ Accepted Answer</span>
        )}
      </div>

      <div className="reply-body">{reply.body}</div>

      <div className="reply-actions">
        <button
          className={`vote-btn ${voted ? "voted" : ""}`}
          onClick={handleVote}
          disabled={!user || loading || reply.authorId === user?.id}
          title={
            reply.authorId === user?.id
              ? "Can't vote on your own reply"
              : "Upvote"
          }
        >
          👍 {voteCount}
        </button>

        {user && doubtAuthorId === user.id && !reply.isAccepted && (
          <button
            className="accept-btn"
            onClick={handleAccept}
            disabled={loading}
          >
            ⭐ Accept Answer
          </button>
        )}

        {user && reply.authorId === user.id && (
          <button className="delete-reply-btn" onClick={handleDelete}>
            🗑 Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default ReplyCard;