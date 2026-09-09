import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ShareView from './pages/ShareView';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/s/:shortUrl" element={<ShareView />} />
        {/* Динамический роут для админки - путь проверяется внутри компонента */}
        <Route path="/:secretPath" element={<AdminPanel />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
