import { useState, useRef, useCallback } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";

const ReplyForm = ({ doubtId, onSubmit }) => {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const socket = useSocket();
  const { user } = useAuth();
  const typingTimer = useRef(null);
  const isTyping = useRef(false);

  const handleTyping = useCallback(
    (value) => {
      setBody(value);

      if (!socket || !user || !doubtId) return;

      if (!isTyping.current) {
        isTyping.current = true;
        socket.emit("typing_start", {
          doubtId,
          userId: user.id,
          userName: user.name.split(" ")[0],
        });
      }

      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        isTyping.current = false;
        socket.emit("typing_stop", { doubtId, userId: user.id });
      }, 2000);
    },
    [socket, user, doubtId],
  );

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return;

    if (socket && user) {
      socket.emit("typing_stop", { doubtId, userId: user.id });
      isTyping.current = false;
      clearTimeout(typingTimer.current);
    }

    setSubmitting(true);
    try {
      await onSubmit(body.trim());
      setBody("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reply-form">
      <textarea
        className="form-input"
        placeholder="Write your answer here... Be clear, concise, and helpful."
        value={body}
        onChange={(e) => handleTyping(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey) handleSubmit();
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-light)" }}>
          Press Ctrl+Enter to submit
        </span>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!body.trim() || submitting}
        >
          {submitting ? "⏳ Posting..." : "📤 Post Reply"}
        </button>
      </div>
    </div>
  );
};

export default ReplyForm;