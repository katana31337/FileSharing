import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ShareView from './pages/ShareView';
import AdminPanel from './pages/AdminPanel';
import { getAdminSecretPath } from './services/adminService';

function App() {
  const secretPath = getAdminSecretPath();

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/s/:shortUrl" element={<ShareView />} />
        <Route path={`/${secretPath}`} element={<AdminPanel />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
