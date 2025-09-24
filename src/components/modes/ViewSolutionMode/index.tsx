import React, { useState, useRef, useEffect } from 'react';
import { ModeToolbarProps, ModeViewerProps } from '../../../types/workspace';
import SolutionEditor3D, { SolutionEditor3DRef } from '../../solution/SolutionEditor3D';
import { SolutionFile, SolutionSettings, createDefaultSolutionSettings } from '../../../types/solution';
import { FileType, UnifiedFile } from '../../../types/fileSystem';

export const ViewSolutionToolbar: React.FC<ModeToolbarProps> = ({
  settings,
  onSettingsChange,
  modeState,
  onModeStateChange
}) => {
  return (
    <div style={{ padding: '1rem', background: '#f8f9fa' }}>
      <h3 style={{ margin: 0, color: '#28a745' }}>👁️ View Solution Mode</h3>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
        Browse and analyze puzzle solutions • Enhanced V1 solution viewer
      </p>
    </div>
  );
};

export const ViewSolutionViewer: React.FC<ModeViewerProps> = ({
  coordinates,
  settings,
  modeState,
  onCoordinatesChange,
  onModeStateChange
}) => {
  const [solution, setSolution] = useState<SolutionFile | null>(null);
  const [solutionSettings, setSolutionSettings] = useState<SolutionSettings | null>(null);
  const [solutionName, setSolutionName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const solutionEditorRef = useRef<SolutionEditor3DRef>(null);

  // Load solution settings from localStorage or create defaults
  const loadSolutionSettings = (solutionFile: SolutionFile): SolutionSettings => {
    try {
      const savedSettings = localStorage.getItem('viewSolutionModeSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const piecesUsedBool = Object.keys(solutionFile.piecesUsed).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>);
        const defaultSettings = createDefaultSolutionSettings(piecesUsedBool);
        return {
          ...defaultSettings,
          ...parsed,
          pieceColors: { ...defaultSettings.pieceColors, ...parsed.pieceColors }
        };
      }
    } catch (error) {
      console.warn('Failed to load solution settings:', error);
    }
    
    const piecesUsedBool = Object.keys(solutionFile.piecesUsed).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    return createDefaultSolutionSettings(piecesUsedBool);
  };

  // Handle file selection from unified file browser
  useEffect(() => {
    console.log('🔍 ViewSolutionMode useEffect triggered:', { 
      selectedFile: modeState.selectedFile,
      hasSelectedFile: !!modeState.selectedFile,
      fileType: modeState.selectedFile?.type 
    });
    
    if (modeState.selectedFile && modeState.selectedFile.type === FileType.SOLUTION) {
      const file = modeState.selectedFile as UnifiedFile;
      setLoading(true);
      setError('');
      
      try {
        const solutionData = file.content as unknown as SolutionFile;
        
        // Validate solution format
        if (!solutionData.version || !solutionData.placements || !solutionData.piecesUsed) {
          throw new Error('Invalid solution file format');
        }
        
        setSolution(solutionData);
        setSolutionName(file.name.replace('.json', ''));
        const settings = loadSolutionSettings(solutionData);
        setSolutionSettings(settings);
        
        console.log('🎯 ViewSolutionMode: Solution state updated:', {
          solution: solutionData,
          settings: settings,
          name: file.name
        });
        
        console.log('✅ Solution loaded in ViewSolutionMode:', {
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
        
        // Clear the selected file from mode state
        onModeStateChange({ ...modeState, selectedFile: null });
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load solution file';
        setError(errorMessage);
        console.error('❌ Solution loading failed:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [modeState.selectedFile]);

  // Handle settings changes
  const handleSettingsChange = (updates: Partial<SolutionSettings>) => {
    if (solutionSettings) {
      const newSettings = { ...solutionSettings, ...updates };
      setSolutionSettings(newSettings);
      
      // Save to localStorage
      try {
        localStorage.setItem('viewSolutionModeSettings', JSON.stringify(newSettings));
      } catch (error) {
        console.warn('Failed to save solution settings:', error);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #28a74520, #28a74510)',
        color: '#28a745'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <h2>Loading Solution...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #dc354520, #dc354510)',
        color: '#dc3545'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <h2>Error Loading Solution</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  console.log('🎯 ViewSolutionMode render state:', { 
    solution: !!solution, 
    solutionSettings: !!solutionSettings,
    loading,
    error,
    solutionName 
  });

  if (!solution || !solutionSettings) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #28a74520, #28a74510)',
        color: '#28a745'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👁️</div>
          <h2>View Solution Mode</h2>
          <p>Browse and analyze puzzle solutions</p>
          <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Use the Browse button to load a solution file
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      {/* Solution Info Header */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontSize: '12px',
        color: '#333'
      }}>
        <div style={{ fontWeight: 'bold' }}>{solutionName}</div>
        <div>{Object.keys(solution.piecesUsed).length} pieces • {solution.placements.length} placements</div>
      </div>

      {/* Solution Viewer Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 100,
        display: 'flex',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Piece Visibility Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            Pieces: {solutionSettings.visiblePieceCount}/{Object.keys(solution.piecesUsed).length}
          </span>
          <input
            type="range"
            min="0"
            max={Object.keys(solution.piecesUsed).length}
            value={solutionSettings.visiblePieceCount}
            onChange={(e) => handleSettingsChange({ visiblePieceCount: parseInt(e.target.value) })}
            style={{ width: '100px' }}
          />
        </div>
        
        {/* Center & Orient Button */}
        <button
          onClick={() => {
            if (solutionEditorRef.current) {
              solutionEditorRef.current.centerAndOrientSolution();
            }
          }}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          Center
        </button>
      </div>

      {/* 3D Solution Viewer */}
      <SolutionEditor3D
        ref={solutionEditorRef}
        solution={solution}
        settings={solutionSettings}
      />
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '10px',
          zIndex: 1000
        }}>
          <div>Solution: {solution ? '✅' : '❌'}</div>
          <div>Settings: {solutionSettings ? '✅' : '❌'}</div>
          <div>Pieces: {solution ? Object.keys(solution.piecesUsed).length : 0}</div>
          <div>Placements: {solution ? solution.placements.length : 0}</div>
        </div>
      )}
    </div>
  );
};
