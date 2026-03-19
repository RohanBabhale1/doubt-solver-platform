import { useState, useEffect } from "react";
import { getSubjects } from "../../services/api";

const DoubtFilter = ({ activeSubjectId, onSelect }) => {
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    getSubjects()
      .then((res) => setSubjects(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="category-grid">
      <div
        className={`category-card ${!activeSubjectId ? "active" : ""}`}
        onClick={() => onSelect(null)}
      >
        <div className="category-icon-wrap">📋</div>
        <div className="category-info">
          <div className="category-name">All Subjects</div>
          <div className="category-count">Show everything</div>
        </div>
      </div>

      {subjects.map((sub) => (
        <div
          key={sub.id}
          className={`category-card ${activeSubjectId === sub.id ? "active" : ""}`}
          onClick={() => onSelect(sub.id)}
        >
          <div className="category-icon-wrap">{sub.iconEmoji}</div>
          <div className="category-info">
            <div className="category-name">{sub.name}</div>
            <div className="category-count">
              {sub._count?.doubts || 0} doubts
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DoubtFilter;