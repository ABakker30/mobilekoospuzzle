import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { fileService, ContainerFile } from '../services/v3/FileService';
import { coordinateService, CellRecord, OrientationInfo } from '../services/v3/CoordinateService';
import { engine3DService, SceneSetup, RenderSettings } from '../services/v3/Engine3DService';
import { FCCCoord } from '../lib/coords/fcc';
import './V3ShapeEditor.css';

interface ShapeEditorState {
  currentShape: ContainerFile | null;
  cellRecords: CellRecord[];
  orientation: OrientationInfo | null;
  isEditMode: boolean;
  editAction: 'add' | 'remove';
  autoOrient: boolean;
  isLoading: boolean;
}

export default function V3ShapeEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneSetup | null>(null);
  const shapeMeshesRef = useRef<THREE.Mesh[]>([]);
  const neighborMeshesRef = useRef<THREE.Mesh[]>([]);
  const animationFrameRef = useRef<number>();

  const [state, setState] = useState<ShapeEditorState>({
    currentShape: null,
    cellRecords: [],
    orientation: null,
    isEditMode: false,
    editAction: 'add',
    autoOrient: true,
    isLoading: false
  });

  const [renderSettings, setRenderSettings] = useState<RenderSettings>({
    backgroundColor: '#f0f0f0',
    brightness: 1.0,
    metalness: 0.3,
    roughness: 0.25, // 75% reflectiveness = 25% roughness
    shadowIntensity: 0.5
  });

  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Initialize 3D scene
  useEffect(() => {
    if (!containerRef.current) return;

    const setup = engine3DService.createScene(containerRef.current);
    sceneRef.current = setup;
    
    engine3DService.setupLighting(setup.scene, renderSettings);
    
    // Start render loop
    const animate = () => {
      setup.controls.update();
      setup.renderer.render(setup.scene, setup.camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      
      const { clientWidth, clientHeight } = containerRef.current;
      sceneRef.current.camera.aspect = clientWidth / clientHeight;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(clientWidth, clientHeight);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        engine3DService.dispose(sceneRef.current);
      }
    };
  }, []);

  // Update scene when shape changes (only render when orientation is complete)
  useEffect(() => {
    if (!sceneRef.current || state.isLoading) return;

    // Clear existing meshes
    shapeMeshesRef.current.forEach(mesh => sceneRef.current!.scene.remove(mesh as unknown as THREE.Object3D));
    neighborMeshesRef.current.forEach(mesh => sceneRef.current!.scene.remove(mesh as unknown as THREE.Object3D));
    
    if (state.cellRecords.length > 0 && state.orientation) {
      // Calculate sphere radius based on world coordinates
      const sphereRadius = coordinateService.calculateSphereRadius(state.cellRecords);
      
      // Create shape meshes
      const shapeMeshes = engine3DService.createShapeMeshes(state.cellRecords, renderSettings, sphereRadius);
      shapeMeshes.forEach(mesh => sceneRef.current!.scene.add(mesh));
      shapeMeshesRef.current = shapeMeshes;


      // Initialize camera position once per shape load
      if (sceneRef.current.camera) {
        const camera = sceneRef.current.camera as THREE.PerspectiveCamera;
        const controls = sceneRef.current.controls;
        
        // Calculate bounding box to determine appropriate camera distance
        const boundingBox = new THREE.Box3();
        state.cellRecords.forEach(record => {
          boundingBox.expandByPoint(record.worldCoord);
        });
        
        // Calculate shape size and appropriate camera distance based on bounding box
        const shapeSize = boundingBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(shapeSize.x, shapeSize.y, shapeSize.z);
        
        // Calculate optimal distance based on camera FOV and desired screen coverage
        // We want the shape to fill ~75% of the screen height
        const fov = (camera as any).fov * (Math.PI / 180); // Convert to radians
        const targetScreenCoverage = 0.75; // 75% of screen height
        const distance = (maxDimension / targetScreenCoverage) / (2 * Math.tan(fov / 2));
        
        // Position camera at calculated distance from pivot point
        (camera as any).position.set(
          state.orientation.pivotPoint.x + distance,
          state.orientation.pivotPoint.y + distance,
          state.orientation.pivotPoint.z + distance
        );
        controls.target.copy(state.orientation.pivotPoint);
        controls.update();
      }

      // Show neighbors in edit mode
      if (state.isEditMode && state.editAction === 'add') {
        const allNeighbors = new Set<string>();
        state.cellRecords.forEach(record => {
          const neighbors = coordinateService.getNeighbors(record.engineCoord);
          neighbors.forEach(neighbor => {
            const key = `${neighbor.x},${neighbor.y},${neighbor.z}`;
            const exists = state.cellRecords.some(r => 
              r.engineCoord.x === neighbor.x && 
              r.engineCoord.y === neighbor.y && 
              r.engineCoord.z === neighbor.z
            );
            if (!exists) {
              allNeighbors.add(key);
            }
          });
        });

        // Create neighbor positions using the same orientation
        const neighborPositions: THREE.Vector3[] = [];
        allNeighbors.forEach(key => {
          const [x, y, z] = key.split(',').map(Number);
          const { records } = coordinateService.createOrientedCellRecords([{ x, y, z }]);
          if (records.length > 0) {
            neighborPositions.push(records[0].worldCoord);
          }
        });

        const neighborMeshes = engine3DService.createNeighborMeshes(neighborPositions);
        neighborMeshes.forEach(mesh => sceneRef.current!.scene.add(mesh));
        neighborMeshesRef.current = neighborMeshes;
      }
    }
  }, [state.cellRecords, state.orientation, state.isEditMode, state.editAction, state.isLoading, renderSettings]);

  const handleBrowseShapes = async () => {
    try {
      const files = await fileService.listContainers();
      setAvailableFiles(files);
      setSelectedFile(null);
      setShowFileBrowser(true);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleSelectFile = (filename: string) => {
    setSelectedFile(filename);
  };

  const handleLoadSelectedShape = async () => {
    if (!selectedFile) return;
    
    try {
      // Set loading state to prevent rendering
      setState(prev => ({ ...prev, isLoading: true }));
      
      const shape = await fileService.loadContainer(selectedFile);
      
      if (state.autoOrient) {
        // Create oriented cell records with hull analysis
        const { records, orientation } = coordinateService.createOrientedCellRecords(shape.coordinates);
        
        setState(prev => ({
          ...prev,
          currentShape: shape,
          cellRecords: records,
          orientation: orientation,
          isLoading: false
        }));
      } else {
        // Create records without orientation (identity transformation)
        const { records, orientation } = coordinateService.createOrientedCellRecords(shape.coordinates);
        
        setState(prev => ({
          ...prev,
          currentShape: shape,
          cellRecords: records,
          orientation: orientation,
          isLoading: false
        }));
      }
      
      setShowFileBrowser(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to load shape:', error);
      alert('Failed to load shape: ' + error.message);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };


  const handleSaveShape = async () => {
    if (!state.currentShape) return;
    
    try {
      const coordinates = state.cellRecords.map(record => record.engineCoord);
      const shapeToSave: ContainerFile = {
        ...state.currentShape,
        coordinates
      };
      
      await fileService.saveContainer(shapeToSave);
      alert('Shape saved successfully!');
    } catch (error) {
      console.error('Failed to save shape:', error);
      alert('Failed to save shape');
    }
  };

  const toggleEditMode = () => {
    setState(prev => ({ ...prev, isEditMode: !prev.isEditMode }));
  };

  const toggleEditAction = () => {
    setState(prev => ({ 
      ...prev, 
      editAction: prev.editAction === 'add' ? 'remove' : 'add' 
    }));
  };

  return (
    <div className="v3-shape-editor">
      {/* Header */}
      <header className="editor-header">
        <div className="header-left">
          <Link to="/" className="home-link">← Home</Link>
          <h1>{state.currentShape?.name?.replace(/\d+\s*cell[s]?/gi, '').trim() || 'Shape Editor'}</h1>
        </div>
        <div className="header-right">
          {state.cellRecords.length > 0 && (
            <span className="cell-count">{state.cellRecords.length} cells</span>
          )}
          <button className="btn btn-settings">⚙️</button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="editor-toolbar">
        <button className="btn btn-primary" onClick={handleBrowseShapes}>
          Browse Shapes
        </button>
        {state.currentShape && (
          <button className="btn btn-success" onClick={handleSaveShape}>
            Save
          </button>
        )}
        
        <div className="toolbar-divider" />
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={state.isEditMode}
            onChange={toggleEditMode}
          />
          Edit Mode
        </label>
        
        {state.isEditMode && (
          <button 
            className={`btn ${state.editAction === 'add' ? 'btn-add' : 'btn-remove'}`}
            onClick={toggleEditAction}
          >
            {state.editAction === 'add' ? 'Add Cells' : 'Remove Cells'}
          </button>
        )}
      </div>

      {/* 3D Viewport */}
      <div className="viewport-container">
        <div ref={containerRef} className="viewport" />
        
        {!state.currentShape && (
          <div className="viewport-overlay">
            <div className="empty-state">
              <h2>No Shape Loaded</h2>
              <p>Use the "Browse Shapes" button above to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* File Browser Modal */}
      {showFileBrowser && (
        <div className="modal-overlay" onClick={() => setShowFileBrowser(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Browse Shapes</h2>
              <button 
                className="modal-close"
                onClick={() => setShowFileBrowser(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {availableFiles.length === 0 ? (
                <p>No shapes found</p>
              ) : (
                <div className="file-list">
                  {availableFiles.map(file => (
                    <div 
                      key={file.name}
                      className={`file-item ${selectedFile === file.name ? 'file-item--selected' : ''}`}
                      onClick={() => handleSelectFile(file.name)}
                    >
                      <div className="file-name">{file.name}</div>
                      <div className="file-meta">
                        {file.source} • {file.modified}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowFileBrowser(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleLoadSelectedShape}
                disabled={!selectedFile}
              >
                Select Shape
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
