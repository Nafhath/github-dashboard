
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Repositories } from './pages/Repositories';
import { RepoDetails } from './pages/RepoDetails';
import { Groups } from './pages/Groups';
import { Analytics } from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="repos" element={<Repositories />} />
          <Route path="repo/:owner/:repoName" element={<RepoDetails />} />
          <Route path="groups" element={<Groups />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
