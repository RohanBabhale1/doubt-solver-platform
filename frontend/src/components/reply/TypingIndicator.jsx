const TypingIndicator = ({ userName }) => {
  if (!userName) return null;

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span />
        <span />
        <span />
      </div>
      <span>{userName} is typing...</span>
    </div>
  );
};

export default TypingIndicator;