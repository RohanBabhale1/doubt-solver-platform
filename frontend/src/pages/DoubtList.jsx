import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDoubts, search as searchDoubts } from "../services/api";
import DoubtCard from "../components/doubt/DoubtCard";
import DoubtFilter from "../components/doubt/DoubtFilter";
import DoubtSearch from "../components/doubt/DoubtSearch";
import Spinner from "../components/common/Spinner";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";

const SORT_TABS = [
  { key: "newest", label: "🕒 Newest" },
  { key: "popular", label: "🔥 Popular" },
  { key: "unsolved", label: "❓ Unsolved" },
];

const DoubtList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doubts, setDoubts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [fetchError, setFetchError] = useState('');
  const [sort, setSort] = useState("newest");
  const [activeSubjectId, setActiveSubjectId] = useState(
    searchParams.get("subjectId") || null,
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [showFilter, setShowFilter] = useState(false);
  const socket = useSocket();
  const { user } = useAuth();
  const limit = 9;

  const fetchDoubts = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      let res;
      if (searchQuery) {
        res = await searchDoubts({ q: searchQuery, page, limit });
        setDoubts(res.data.doubts);
        setTotal(res.data.total);
      } else {
        res = await getDoubts({
          page,
          limit,
          sort,
          subjectId: activeSubjectId || undefined,
        });
        setDoubts(res.data.doubts);
        setTotal(res.data.total);
      }
    } catch (err) {
      setDoubts([]);
      setFetchError('Failed to load doubts. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [page, sort, activeSubjectId, searchQuery]);

  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]);

  useEffect(() => {
    if (!socket) return;
    const handle = (doubt) => {
      setDoubts((prev) => [{ ...doubt, _count: { replies: 0 } }, ...prev]);
      setTotal((t) => t + 1);
    };
    socket.on("new_doubt", handle);
    return () => socket.off("new_doubt", handle);
  }, [socket]);

  const handleSearch = (q) => {
    setSearchQuery(q);
    setPage(1);
  };

  const handleSubject = (id) => {
    setActiveSubjectId(id);
    setPage(1);
    setSearchQuery("");
  };

  const handleSort = (s) => {
    setSort(s);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="doubt-list-page container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-head)",
              fontSize: 28,
              fontWeight: 800,
              color: "var(--navy)",
            }}
          >
            All Doubts
          </h1>
          <p style={{ color: "var(--text-light)", fontSize: 14, marginTop: 4 }}>
            {total} doubt{total !== 1 ? "s" : ""} found
          </p>
        </div>
        {user && (
          <Link to="/create" className="btn btn-primary">
            ✏️ Ask a Doubt
          </Link>
        )}
      </div>

      {/* Filter toggle */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setShowFilter((v) => !v)}
        style={{ marginBottom: 16 }}
      >
        {showFilter ? "⬆ Hide Categories" : "⬇ Show Categories"}
      </button>

      {showFilter && (
        <div style={{ marginBottom: 24 }}>
          <DoubtFilter
            activeSubjectId={activeSubjectId}
            onSelect={handleSubject}
          />
        </div>
      )}

      <div className="doubt-list-toolbar">
        <div className="sort-tabs">
          {SORT_TABS.map((t) => (
            <button
              key={t.key}
              className={`sort-tab ${sort === t.key ? "active" : ""}`}
              onClick={() => handleSort(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <DoubtSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
        />
      </div>

      {/* ── Error state ── */}
      {fetchError && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {fetchError}
        </div>
      )}

      {loading ? (
        <Spinner text="Loading doubts..." />
      ) : doubts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No doubts found</h3>
          <p>
            {searchQuery
              ? `No results for "${searchQuery}"`
              : "Be the first to ask a doubt!"}
          </p>
          {user && (
            <Link to="/create" className="btn btn-primary">
              Post a Doubt
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="doubt-list-grid">
            {doubts.map((d) => (
              <DoubtCard key={d.id} doubt={d} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                ‹
              </button>

              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={`page-btn ${page === p ? "active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                className="page-btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoubtList;