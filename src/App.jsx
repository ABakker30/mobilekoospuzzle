import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './views/HomePage';
import PuzzleShapePage from './views/PuzzleShapePage';
import ViewSolutionPage from './views/ViewSolutionPage';

export default function App() {
  return (
    <HashRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/puzzle-shape" element={<PuzzleShapePage />} />
          <Route path="/view-solution" element={<ViewSolutionPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
