export const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now - date) / 1000;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

export const truncate = (str, length = 80) => {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
};

export const getInitials = (name = '') => {
  return name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
};

export const getAvatarColor = (name = '') => {
  const colors = [
    '#1DBF73', '#4A90D9', '#FF6B6B', '#f6c90e',
    '#7B68EE', '#FF8C42', '#E91E8C', '#00BCD4'
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};

export const getSubjectEmoji = (subjectName = '') => {
  const map = {
    Mathematics: '📐', Chemistry: '🧪', Physics: '⚡',
    'Computer Science': '💻', Biology: '🧬', History: '📜',
    Literature: '📖', Economics: '📊'
  };
  return map[subjectName] || '📚';
};