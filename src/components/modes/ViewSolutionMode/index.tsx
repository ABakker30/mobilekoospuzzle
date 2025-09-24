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
    // Count unique pieces actually placed in the solution
    const uniquePiecesPlaced = new Set(solutionFile.placements.map(placement => placement.piece));
    const uniquePieceCount = uniquePiecesPlaced.size;
    
    try {
      const savedSettings = localStorage.getItem('viewSolutionModeSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const piecesUsedBool = Object.keys(solutionFile.piecesUsed).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>);
        const defaultSettings = createDefaultSolutionSettings(piecesUsedBool);
        
        // Override visiblePieceCount to match this solution's piece count
        return {
          ...defaultSettings,
          ...parsed,
          visiblePieceCount: uniquePieceCount, // Always show all pieces by default for each solution
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
    const defaultSettings = createDefaultSolutionSettings(piecesUsedBool);
    
    // Set visiblePieceCount to match the actual number of pieces in this solution
    return {
      ...defaultSettings,
      visiblePieceCount: uniquePieceCount
    };
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
        
        // Store solution info in workspace state for header controls
        // Count unique pieces actually placed in the solution
        const uniquePiecesPlaced = new Set(solutionData.placements.map(placement => placement.piece));
        const uniquePieceTypes = uniquePiecesPlaced.size;
        
        console.log('✅ Pieces placed in solution:', Array.from(uniquePiecesPlaced));
        console.log('✅ Total unique pieces placed:', uniquePieceTypes);
        console.log('✅ Total placements:', solutionData.placements.length);
        console.log('🚀 ABOUT TO UPDATE WORKSPACE STATE...');
        
        const newModeState = { 
          ...modeState, 
          selectedFile: null,
          solutionLoaded: true,
          solutionData: solutionData,
          solutionName: file.name,
          totalPieces: uniquePieceTypes,
          visiblePieces: Math.min(settings.visiblePieceCount, uniquePieceTypes) // Ensure it doesn't exceed available pieces
        };
        
        console.log('🔥 CALLING onModeStateChange with:', newModeState);
        onModeStateChange(newModeState);
        console.log('✅ onModeStateChange CALLED!');
        
        console.log('🎯 ViewSolutionMode: Solution state updated:', {
          solution: solutionData,
          settings: settings,
          name: file.name
        });
        
        console.log('✅ FINAL COUNT:', uniquePieceTypes, 'pieces for', file.name);
        
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

  // Watch for changes in visible pieces from header slider
  useEffect(() => {
    if (modeState.visiblePieces !== undefined && solutionSettings && modeState.visiblePieces !== solutionSettings.visiblePieceCount) {
      console.log(`🎯 ViewSolutionMode: Updating visible pieces from header slider: ${modeState.visiblePieces}`);
      handleSettingsChange({ visiblePieceCount: modeState.visiblePieces });
    }
  }, [modeState.visiblePieces]); // Remove solutionSettings dependency to prevent infinite loop

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
      {/* 3D Solution Viewer - Clean view without overlays */}
      <SolutionEditor3D
        ref={solutionEditorRef}
        solution={solution}
        settings={solutionSettings}
      />
    </div>
  );
};
