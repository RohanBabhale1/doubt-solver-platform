import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getSubjects,
  getRecentDoubts,
  getPlatformStats,
} from "../services/api";
import DoubtCard from "../components/doubt/DoubtCard";
import Spinner from "../components/common/Spinner";
import { useSocket } from "../hooks/useSocket";

const Home = () => {
  const [subjects, setSubjects] = useState([]);
  const [recentDoubts, setRecentDoubts] = useState([]);
  const [stats, setStats] = useState({ doubts: 0, replies: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    Promise.all([
      getSubjects().catch(() => ({ data: [] })),
      getRecentDoubts().catch(() => ({ data: [] })),
      getPlatformStats().catch(() => ({
        data: { doubts: 0, replies: 0, users: 0 },
      })),
    ])
      .then(([s, d, p]) => {
        setSubjects(s.data);
        setRecentDoubts(d.data.slice(0, 8));
        setStats(p.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewDoubt = (doubt) => {
      setRecentDoubts((prev) => [
        { ...doubt, _count: { replies: 0 } },
        ...prev.slice(0, 7),
      ]);
      setStats((prev) => ({ ...prev, doubts: prev.doubts + 1 }));
    };

    socket.on("new_doubt", handleNewDoubt);
    return () => socket.off("new_doubt", handleNewDoubt);
  }, [socket]);

  return (
    <main>
      {/* ——— HERO ——— */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-tag">🎓 Learn Together, Grow Together</div>
            <h1>
              Real-Time
              <br />
              <em>Academic</em> Doubt
              <br />
              Solving Platform
            </h1>
            <p className="hero-desc">
              Post your academic questions and get answers from peers in real
              time. Built for university students, by university students.
            </p>
            <div className="hero-actions">
              <Link to="/doubts" className="btn btn-primary btn-lg">
                Browse Doubts
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg">
                Join Free
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-val">
                  {stats.doubts.toLocaleString()}+
                </span>
                <span className="hero-stat-label">Doubts Posted</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-val">
                  {stats.replies.toLocaleString()}+
                </span>
                <span className="hero-stat-label">Answers Given</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-val">
                  {stats.users.toLocaleString()}+
                </span>
                <span className="hero-stat-label">Students</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-img-wrap">📚</div>
            <div className="hero-card-float bottom-left">
              <div className="label">Active Students</div>
              <div className="value">🟢 {stats.users}+</div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— TOP CATEGORIES ——— */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Top Categories</h2>
            <p className="section-subtitle">
              Browse doubts by academic subject
            </p>
          </div>
          {loading ? (
            <Spinner />
          ) : (
            <div className="category-grid">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="category-card"
                  onClick={() => navigate(`/doubts?subjectId=${sub.id}`)}
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
          )}
        </div>
      </section>

      {/* ——— PROMO CARDS ——— */}
      <section className="promo-section">
        <div className="container">
          <div className="promo-grid">
            <div className="promo-card green">
              <span className="promo-card-tag">For Learners</span>
              <h3 className="promo-card-title">
                Learn Together
                <br />
                with Peers
              </h3>
              <p className="promo-card-desc">
                Post any academic doubt and get real-time answers from fellow
                students who've solved the same problems.
              </p>
              <Link to="/doubts" className="btn btn-primary">
                View All Doubts
              </Link>
              <span className="promo-card-img">🧑‍🎓</span>
            </div>
            <div className="promo-card blue">
              <span className="promo-card-tag" style={{ color: "#2b6cb0" }}>
                For Contributors
              </span>
              <h3 className="promo-card-title">
                Help Others,
                <br />
                Build Reputation
              </h3>
              <p className="promo-card-desc">
                Answer doubts in your strong subjects, get upvotes, and earn
                accepted answers to grow your academic reputation.
              </p>
              <Link to="/create" className="btn btn-primary">
                Ask a Doubt
              </Link>
              <span className="promo-card-img">👨‍🏫</span>
            </div>
          </div>
        </div>
      </section>

      {/* ——— RECENT DOUBTS ——— */}
      <section className="doubts-section">
        <div className="container">
          <div className="doubts-section-header">
            <div>
              <h2 className="section-title" style={{ textAlign: "left" }}>
                Recent Doubts
              </h2>
              <p
                className="section-subtitle"
                style={{ textAlign: "left", marginTop: 12 }}
              >
                Latest questions posted by students
              </p>
            </div>
            <Link to="/doubts" className="btn btn-outline">
              View All Doubts →
            </Link>
          </div>

          {loading ? (
            <Spinner />
          ) : recentDoubts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🤔</div>
              <h3>No doubts yet</h3>
              <p>Be the first to post a doubt!</p>
              <Link to="/create" className="btn btn-primary">
                Post a Doubt
              </Link>
            </div>
          ) : (
            <div className="doubts-grid">
              {recentDoubts.map((d) => (
                <DoubtCard key={d.id} doubt={d} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;