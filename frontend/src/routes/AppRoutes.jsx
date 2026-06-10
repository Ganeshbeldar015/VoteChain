import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import Elections from '../pages/Elections';
import Candidates from '../pages/Candidates';
import Results from '../pages/Results';
import AdminDashboard from '../pages/AdminDashboard';
import VotePage from '../pages/VotePage';
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="elections" element={<Elections />} />
        <Route path="candidates/:electionId" element={<Candidates />} />
        <Route path="results" element={<Results />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="vote/:electionId" element={<VotePage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
