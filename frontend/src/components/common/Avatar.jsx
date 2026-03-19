import { getInitials, getAvatarColor } from '../../utils/helpers';

const Avatar = ({ name = '', avatarUrl = null, size = 'md', className = '' }) => {
  const initials = getInitials(name);
  const bg = getAvatarColor(name);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:5000${avatarUrl}`}
        alt={name}
        className={`avatar avatar-${size} ${className}`}
      />
    );
  }

  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{ background: bg }}
    >
      {initials}
    </div>
  );
};

export default Avatar;