import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoubtList from './pages/DoubtList';
import DoubtDetail from './pages/DoubtDetail';
import CreateDoubt from './pages/CreateDoubt';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doubts" element={<DoubtList />} />
          <Route path="/doubts/:id" element={<DoubtDetail />} />
          <Route path="/create" element={<CreateDoubt />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;