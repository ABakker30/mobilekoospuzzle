import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './views/HomePage';
import PuzzleShapePage from './views/PuzzleShapePage';
import AutoSolvePage from './views/AutoSolvePage';
import ManualSolvePage from './views/ManualSolvePage';
import ViewSolutionPage from './views/ViewSolutionPage';
import { UnifiedWorkspace } from './components/workspace/UnifiedWorkspace';

export default function App() {
  return (
    <HashRouter>
      <div style={{ 
        width: '100vw',
        minHeight: '100vh', 
        margin: 0,
        padding: 0,
        backgroundColor: '#f8f9fa',
        boxSizing: 'border-box'
      }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workspace" element={<UnifiedWorkspace />} />
          {/* Keep existing V1 routes for compatibility */}
          <Route path="/puzzle-shape" element={<PuzzleShapePage />} />
          <Route path="/auto-solve" element={<AutoSolvePage />} />
          <Route path="/manual-solve" element={<ManualSolvePage />} />
          <Route path="/view-solution" element={<ViewSolutionPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
