import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LegalPage from './pages/LegalPage';
import HomePage from './pages/HomePage';
import MapDetailPage from './pages/MapDetailPage';
import PointsManagementPage from './pages/PointsManagementPage';
import NotificationsPage from './pages/NotificationsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import JoinMapPage from './pages/JoinMapPage';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/maps/:id" element={<MapDetailPage />} />
          <Route path="/maps/:id/points" element={<PointsManagementPage />} />
          <Route path="/join/:mapId" element={<JoinMapPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/legal" element={<LegalPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
