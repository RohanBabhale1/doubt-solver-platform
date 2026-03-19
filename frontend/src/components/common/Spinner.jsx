const Spinner = ({ small = false, text = '' }) => (
  <div className="spinner-wrap">
    <div className={`spinner ${small ? 'sm' : ''}`} />
    {text && <span style={{ marginLeft: 10, fontSize: 14, color: 'var(--text-light)' }}>{text}</span>}
  </div>
);

export default Spinner;