import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ShareView from './pages/ShareView';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/s/:shortUrl" element={<ShareView />} />
        <Route path="/:secretPath" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
