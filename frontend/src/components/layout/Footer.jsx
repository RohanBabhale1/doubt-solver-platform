const Footer = () => (
  <footer className="footer">
    <div className="footer-brand">Doubt<span>Solve</span></div>
    <p>Real-Time Academic Doubt Solving Platform — University Capstone Project</p>
    <div className="footer-stack">
      {['Node.js', 'Express', 'Socket.io', 'PostgreSQL', 'Prisma', 'Redis', 'Kafka', 'Docker', 'React'].map(t => (
        <span key={t} className="footer-stack-tag">{t}</span>
      ))}
    </div>
  </footer>
);

export default Footer;