// Solution Viewer Page
// Main page for viewing puzzle solutions with piece-based rendering

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SolutionEditor3D, { SolutionEditor3DRef } from '../components/solution/SolutionEditor3D';
import SolutionToolbar from '../components/solution/SolutionToolbar';
import SolutionSettingsModal from '../components/solution/SolutionSettingsModal';
import { SolutionFile, SolutionSettings, createDefaultSolutionSettings } from '../types/solution';

export default function SolutionViewerPage() {
  // Solution data state
  const [solution, setSolution] = useState<SolutionFile | null>(null);
  const [solutionName, setSolutionName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  
  // Ref to access SolutionEditor3D
  const solutionEditorRef = useRef<SolutionEditor3DRef>(null);
  
  // Load settings from localStorage or use defaults
  const loadSettings = (): SolutionSettings => {
    try {
      const savedSettings = localStorage.getItem('solutionViewerSettings');
      if (savedSettings && solution) {
        const parsed = JSON.parse(savedSettings);
        // Merge with current solution's pieces
        const defaultSettings = createDefaultSolutionSettings(solution.piecesUsed);
        return {
          ...defaultSettings,
          ...parsed,
          pieceColors: { ...defaultSettings.pieceColors, ...parsed.pieceColors }
        };
      }
    } catch (error) {
      console.warn('Failed to load solution settings from localStorage:', error);
    }
    
    // Return default settings based on current solution
    return solution ? createDefaultSolutionSettings(solution.piecesUsed) : {
      pieceColors: {},
      visiblePieceCount: 0,
      brightness: 1.0,
      backgroundColor: '#f0f0f0',
      camera: {
        orthographic: false,
        focalLength: 50
      }
    };
  };
  
  const [settings, setSettings] = useState<SolutionSettings>(loadSettings);
  
  // Update settings when solution changes
  useEffect(() => {
    if (solution) {
      setSettings(loadSettings());
    }
  }, [solution]);
  
  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (solution) {
      try {
        localStorage.setItem('solutionViewerSettings', JSON.stringify(settings));
        console.log('Solution settings saved to localStorage');
      } catch (error) {
        console.warn('Failed to save solution settings to localStorage:', error);
      }
    }
  }, [settings, solution]);
  
  // Handle solution file loading
  const handleSolutionLoad = async (file: File) => {
    setLoading(true);
    setError('');
    
    try {
      const text = await file.text();
      const solutionData: SolutionFile = JSON.parse(text);
      
      // Validate solution format
      if (!solutionData.version || !solutionData.placements || !solutionData.piecesUsed) {
        throw new Error('Invalid solution file format');
      }
      
      setSolution(solutionData);
      setSolutionName(file.name.replace('.json', ''));
      
      console.log('✅ Solution loaded:', {
        name: file.name,
        pieces: Object.keys(solutionData.piecesUsed).length,
        placements: solutionData.placements.length
      });
      
      // Auto-center and orient the solution
      setTimeout(() => {
        if (solutionEditorRef.current) {
          solutionEditorRef.current.centerAndOrientSolution();
        }
      }, 100);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load solution file';
      setError(errorMessage);
      console.error('❌ Solution loading failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle solution loading from URL (GitHub content)
  const handleSolutionLoadFromUrl = async (filename: string) => {
    setLoading(true);
    setError('');
    
    try {
      const url = `/content/solutions/${filename}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch solution: ${response.statusText}`);
      }
      
      const solutionData: SolutionFile = await response.json();
      
      // Validate solution format
      if (!solutionData.version || !solutionData.placements || !solutionData.piecesUsed) {
        throw new Error('Invalid solution file format');
      }
      
      setSolution(solutionData);
      setSolutionName(filename.replace('.json', ''));
      
      console.log('✅ Solution loaded from URL:', {
        filename,
        pieces: Object.keys(solutionData.piecesUsed).length,
        placements: solutionData.placements.length
      });
      
      // Auto-center and orient the solution
      setTimeout(() => {
        if (solutionEditorRef.current) {
          solutionEditorRef.current.centerAndOrientSolution();
        }
      }, 100);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load solution from URL';
      setError(errorMessage);
      console.error('❌ Solution URL loading failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle settings changes
  const handleSettingsChange = (newSettings: SolutionSettings) => {
    setSettings(newSettings);
  };
  
  // Handle settings modal
  const handleSettings = () => {
    setShowSettings(true);
  };
  
  const handleSettingsClose = () => {
    setShowSettings(false);
  };
  
  return (
    <div style={{ 
      height: '100dvh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: settings.backgroundColor 
    }}>
      {/* Navigation Header */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e9ecef',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexShrink: 0
      }}>
        <Link 
          to="/" 
          style={{ 
            textDecoration: 'none', 
            color: '#007bff',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ← Home
        </Link>
        <h1 style={{ 
          margin: 0, 
          fontSize: '18px', 
          fontWeight: '600',
          color: '#333'
        }}>
          🧩 Solution Viewer
        </h1>
        {solutionName && (
          <span style={{
            fontSize: '14px',
            color: '#666',
            backgroundColor: '#f8f9fa',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            {solutionName}
          </span>
        )}
      </div>
      
      {/* Main Content Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Toolbar */}
        <SolutionToolbar
          onLoadFile={handleSolutionLoad}
          onLoadFromUrl={handleSolutionLoadFromUrl}
          onSettings={handleSettings}
          loading={loading}
          hasSolution={!!solution}
        />
        
        {/* 3D Viewer */}
        {solution ? (
          <SolutionEditor3D
            ref={solutionEditorRef}
            solution={solution}
            settings={settings}
          />
        ) : (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧩</div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>No Solution Loaded</h2>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Click "Load Solution" to view a puzzle solution
            </p>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div style={{
            position: 'absolute',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px 16px',
            borderRadius: '6px',
            border: '1px solid #f5c6cb',
            maxWidth: '400px',
            textAlign: 'center',
            zIndex: 1000
          }}>
            ❌ {error}
          </div>
        )}
      </div>
      
      {/* Settings Modal */}
      {showSettings && solution && (
        <SolutionSettingsModal
          settings={settings}
          solution={solution}
          onSettingsChange={handleSettingsChange}
          onClose={handleSettingsClose}
        />
      )}
    </div>
  );
}
