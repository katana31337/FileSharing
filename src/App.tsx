import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ShareView from './pages/ShareView';
import AdminPanel from './pages/AdminPanel';
import BackendStatus from './components/BackendStatus';

export default function App() {
  return (
    <BrowserRouter>
      <BackendStatus />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/s/:shortUrl" element={<ShareView />} />
        <Route path="/:secretPath" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
