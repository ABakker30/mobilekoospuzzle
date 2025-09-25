import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './views/HomePage';
import V3HomePage from './views/V3HomePage';
import V3ShapeEditor from './views/V3ShapeEditor';
import PuzzleShapePage from './views/PuzzleShapePage';
import AutoSolvePage from './views/AutoSolvePage';
import ManualSolvePage from './views/ManualSolvePage';
import ViewSolutionPage from './views/ViewSolutionPage';

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
          {/* V3 Home Page - New entry point */}
          <Route path="/" element={<V3HomePage />} />
          
          {/* V3 routes - placeholder pages for now */}
          <Route path="/shapes" element={<V3ShapeEditor />} />
          <Route path="/solutions" element={<div style={{padding: '2rem', textAlign: 'center'}}><h1>V3 Solution Viewer</h1><p>Coming soon...</p></div>} />
          <Route path="/solver" element={<div style={{padding: '2rem', textAlign: 'center'}}><h1>V3 Auto Solver</h1><p>Coming soon...</p></div>} />
          <Route path="/puzzling" element={<div style={{padding: '2rem', textAlign: 'center'}}><h1>V3 Manual Puzzle</h1><p>Coming soon...</p></div>} />
          <Route path="/studio" element={<div style={{padding: '2rem', textAlign: 'center'}}><h1>V3 Content Studio</h1><p>Coming soon...</p></div>} />
          
          {/* V1 routes - keep functional until V3 is ready */}
          <Route path="/v1" element={<HomePage />} />
          <Route path="/puzzle-shape" element={<PuzzleShapePage />} />
          <Route path="/auto-solve" element={<AutoSolvePage />} />
          <Route path="/manual-solve" element={<ManualSolvePage />} />
          <Route path="/view-solution" element={<ViewSolutionPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
