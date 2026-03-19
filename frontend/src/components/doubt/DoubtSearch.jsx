import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DoubtSearch = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search doubts...",
}) => {
  const navigate = useNavigate();
  const [internal, setInternal] = useState(value || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(internal);
    else navigate(`/doubts?q=${encodeURIComponent(internal)}`);
  };

  const val = onChange ? value : internal;
  const setter = onChange || setInternal;

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <span className="search-icon">🔍</span>
      <input
        type="text"
        value={val}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
      />
    </form>
  );
};

export default DoubtSearch;