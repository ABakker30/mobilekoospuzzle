// UI-only port; engines remain upstream.
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FCCCoord, fccToWorld, getFCCNeighbors, centerFCCCoords } from '../../lib/coords/fcc';
import { AppSettings, MaterialSettings } from './SettingsModal';
import { calculateOptimalCameraPosition } from '../../lib/geometry/hull';
import { PBRIntegrationService } from '../../services/pbrIntegration';

// New CellRecord structure - single source of truth
interface CellRecord {
  engineCoord: FCCCoord;    // Original i,j,k for engine/file operations
  worldCoord: THREE.Vector3; // Transformed position for display/raycasting
  id: string;               // Unique identifier
}

interface ShapeEditor3DProps {
  coordinates: FCCCoord[];
  onCoordinatesChange: (coordinates: FCCCoord[]) => void;
  editMode: 'add' | 'delete';
  editingEnabled: boolean;
  settings: AppSettings;
}

export interface ShapeEditor3DRef {
  getCellRecords: () => CellRecord[];
  applyCenterOrientTransform: (transformMatrix: THREE.Matrix4) => Promise<void>;
  resetToOriginalTransform: (engineCoords: FCCCoord[]) => CellRecord[];
  updateMaterialSettings: (materialSettings: MaterialSettings) => Promise<void>;
}

const ShapeEditor3D = forwardRef<ShapeEditor3DRef, ShapeEditor3DProps>(({
  coordinates,
  settings,
  editMode,
  editingEnabled,
  onCoordinatesChange
}, ref) => {
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  console.log(`ShapeEditor3D [${instanceId.current}]: Component render/re-render`, {
    coordinatesLength: coordinates.length,
    brightness: settings.brightness,
    editMode,
    timestamp: Date.now()
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera>();
  const controlsRef = useRef<OrbitControls>();
  const spheresRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>();
  const mouseRef = useRef<THREE.Vector2>();
  const previewSphereRef = useRef<THREE.Mesh | null>(null);
  const hoveredSphereRef = useRef<THREE.Mesh | null>(null);
  const originalMaterialRef = useRef<THREE.Material | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseMoved, setMouseMoved] = useState(false);

  // New CellRecord-based state management
  const [cellRecords, setCellRecords] = useState<CellRecord[]>([]);
  const [neighborRecords, setNeighborRecords] = useState<CellRecord[]>([]);
  const [pendingAddPosition, setPendingAddPosition] = useState<CellRecord | null>(null);
  const neighborSpheresRef = useRef<THREE.Mesh[]>([]);
  const debugNeighborSpheresRef = useRef<THREE.Mesh[]>([]);
  
  // Transformation state for center & orient functionality
  const [currentTransformation, setCurrentTransformation] = useState<THREE.Matrix4 | null>(null);
  const [isTransformed, setIsTransformed] = useState(false);

  // Helper function to convert focal length to FOV
  const focalLengthToFOV = (focalLength: number): number => {
    // Using 35mm full frame sensor height (24mm)
    const sensorHeight = 24;
    const fovRadians = 2 * Math.atan(sensorHeight / (2 * focalLength));
    return fovRadians * (180 / Math.PI);
  };

  // Helper function to create camera based on settings
  const createCamera = (width: number, height: number, orthographic: boolean, focalLength: number = 50) => {
    if (orthographic) {
      const aspect = width / height;
      const frustumSize = 10;
      return new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
      );
    } else {
      const fov = focalLengthToFOV(focalLength);
      return new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
    }
  };

  // Helper function to create preview sphere
  const createPreviewSphere = (isConfirmationStage = false) => {
    const geometry = new THREE.SphereGeometry(0.283, 32, 24);
    const material = new THREE.MeshStandardMaterial({
      color: parseInt(settings.material.color.replace('#', '0x')),
      transparent: true,
      opacity: isConfirmationStage ? 0.5 : Math.max(0.7, 1 - settings.material.transparency), // 50% for first tap, user setting for hover
      metalness: settings.material.metalness,
      roughness: 1 - settings.material.reflectiveness
    });
    return new THREE.Mesh(geometry, material);
  };

  // Helper function to clear all hover effects
  const clearHoverEffects = () => {
    // Remove preview sphere
    if (previewSphereRef.current && sceneRef.current) {
      sceneRef.current.remove(previewSphereRef.current);
      previewSphereRef.current = null;
    }
    
    // Restore original material for hovered sphere (for delete mode)
    if (hoveredSphereRef.current && originalMaterialRef.current) {
      hoveredSphereRef.current.material = originalMaterialRef.current;
      hoveredSphereRef.current = null;
      originalMaterialRef.current = null;
    }
    
    // Clear pending add position
    setPendingAddPosition(null);
  };

  // Reset all transformations and recalculate world coordinates from engine coordinates
  const resetToOriginalTransform = (engineCoords: FCCCoord[]): CellRecord[] => {
    console.log(`🔄 RESET: Clearing transformations and recalculating from engine coordinates`);
    
    // Clear transformation state
    setCurrentTransformation(null);
    setIsTransformed(false);
    
    // Recalculate fresh world coordinates using standard world-space centering
    return engineToWorldTransform(engineCoords);
  };

  // Transform engine coordinates to world coordinates with world-space centering
  const engineToWorldTransform = (engineCoords: FCCCoord[]): CellRecord[] => {
    if (engineCoords.length === 0) return [];

    console.log(`=== TRANSFORMING ENGINE TO WORLD ===`);
    console.log(`Input engine coords (integers):`, engineCoords.map(c => `(${c.x},${c.y},${c.z})`));
    
    // Step 1: Convert ALL engine coordinates to world space (no centering yet)
    const worldCoords = engineCoords.map(coord => fccToWorld(coord));
    console.log(`World coords (before centering):`, worldCoords.map(w => `(${w.x.toFixed(2)},${w.y.toFixed(2)},${w.z.toFixed(2)})`));
    
    // Step 2: Find bounding box in WORLD space
    const minX = Math.min(...worldCoords.map(w => w.x));
    const minY = Math.min(...worldCoords.map(w => w.y));
    const minZ = Math.min(...worldCoords.map(w => w.z));
    const maxX = Math.max(...worldCoords.map(w => w.x));
    const maxY = Math.max(...worldCoords.map(w => w.y));
    const maxZ = Math.max(...worldCoords.map(w => w.z));
    
    // Step 3: Calculate center point in WORLD space
    const worldCenter = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    };
    console.log(`World space center: (${worldCenter.x.toFixed(2)}, ${worldCenter.y.toFixed(2)}, ${worldCenter.z.toFixed(2)})`);
    
    // Step 4: Apply centering in WORLD space
    const records: CellRecord[] = engineCoords.map((originalCoord, index) => {
      const worldPos = worldCoords[index];
      const centeredWorldPos = {
        x: worldPos.x - worldCenter.x,
        y: worldPos.y - worldCenter.y,
        z: worldPos.z - worldCenter.z
      };
      
      return {
        engineCoord: originalCoord, // KEEP original integer coordinate
        worldCoord: new THREE.Vector3(centeredWorldPos.x, centeredWorldPos.y, centeredWorldPos.z),
        id: `cell_${originalCoord.x}_${originalCoord.y}_${originalCoord.z}_${Date.now()}_${index}`
      };
    });
    
    console.log(`Created ${records.length} cell records with world-space centering`);
    records.forEach(record => {
      console.log(`  Engine(${record.engineCoord.x},${record.engineCoord.y},${record.engineCoord.z}) -> World(${record.worldCoord.x.toFixed(2)},${record.worldCoord.y.toFixed(2)},${record.worldCoord.z.toFixed(2)})`);
    });
    
    return records;
  };

  // Calculate neighbor records from existing cell records using world-space centering
  const calculateNeighborRecords = (activeCells: CellRecord[]): CellRecord[] => {
    if (activeCells.length === 0) return [];

    console.log(`=== CALCULATING NEIGHBOR RECORDS ===`);
    const neighborMap = new Map<string, CellRecord>();
    
    // Get world center from active cells (same as used in engineToWorldTransform)
    const originalEngineCoords = activeCells.map(cell => cell.engineCoord);
    const worldCoords = originalEngineCoords.map(coord => fccToWorld(coord));
    
    const minX = Math.min(...worldCoords.map(w => w.x));
    const minY = Math.min(...worldCoords.map(w => w.y));
    const minZ = Math.min(...worldCoords.map(w => w.z));
    const maxX = Math.max(...worldCoords.map(w => w.x));
    const maxY = Math.max(...worldCoords.map(w => w.y));
    const maxZ = Math.max(...worldCoords.map(w => w.z));
    
    const worldCenter = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    };
    
    console.log(`Using world center: (${worldCenter.x.toFixed(2)}, ${worldCenter.y.toFixed(2)}, ${worldCenter.z.toFixed(2)})`);
    
    activeCells.forEach((activeCell, cellIndex) => {
      const neighbors = getFCCNeighbors(activeCell.engineCoord);
      console.log(`\n=== CELL ${cellIndex} at Engine(${activeCell.engineCoord.x},${activeCell.engineCoord.y},${activeCell.engineCoord.z}) ===`);
      console.log(`Generated ${neighbors.length} neighbors (should be 12):`);
      
      let validNeighborsForThisCell = 0;
      
      neighbors.forEach((neighborCoord, neighborIndex) => {
        const key = `${neighborCoord.x},${neighborCoord.y},${neighborCoord.z}`;
        
        // Skip if this position is already an active cell
        const isActiveCell = activeCells.some(active => 
          active.engineCoord.x === neighborCoord.x && 
          active.engineCoord.y === neighborCoord.y && 
          active.engineCoord.z === neighborCoord.z
        );
        
        const alreadyInMap = neighborMap.has(key);
        
        // DETAILED LOGGING FOR MISSING NEIGHBORS
        if (isActiveCell) {
          const matchingCell = activeCells.find(active => 
            active.engineCoord.x === neighborCoord.x && 
            active.engineCoord.y === neighborCoord.y && 
            active.engineCoord.z === neighborCoord.z
          );
          console.log(`  ${neighborIndex}: Engine(${neighborCoord.x},${neighborCoord.y},${neighborCoord.z}) SKIPPED - matches active cell at Engine(${matchingCell?.engineCoord.x},${matchingCell?.engineCoord.y},${matchingCell?.engineCoord.z})`);
        } else {
          console.log(`  ${neighborIndex}: Engine(${neighborCoord.x},${neighborCoord.y},${neighborCoord.z}) isActive=${isActiveCell} inMap=${alreadyInMap}`);
        }
        
        if (!isActiveCell && !alreadyInMap) {
          validNeighborsForThisCell++;
          // Apply world-space centering (same as active cells)
          const worldPos = fccToWorld(neighborCoord);
          const centeredWorldPos = {
            x: worldPos.x - worldCenter.x,
            y: worldPos.y - worldCenter.y,
            z: worldPos.z - worldCenter.z
          };
          
          let neighborWorldCoord = new THREE.Vector3(centeredWorldPos.x, centeredWorldPos.y, centeredWorldPos.z);
          
          // Apply current transformation if one exists
          if (currentTransformation) {
            neighborWorldCoord = neighborWorldCoord.clone().applyMatrix4(currentTransformation);
            console.log(`    Applied transformation: Engine(${neighborCoord.x},${neighborCoord.y},${neighborCoord.z}) -> Transformed World(${neighborWorldCoord.x.toFixed(2)},${neighborWorldCoord.y.toFixed(2)},${neighborWorldCoord.z.toFixed(2)})`);
          }
          
          // No distance filtering needed for rhombohedral lattice - all 6 neighbors are valid
          const neighborRecord: CellRecord = {
            engineCoord: neighborCoord, // KEEP original integer coordinate
            worldCoord: neighborWorldCoord,
            id: `neighbor_${key}_${Date.now()}`
          };
          neighborMap.set(key, neighborRecord);
          console.log(`    ADDED to neighbor map (rhombohedral neighbor)`);
        } else {
          console.log(`    SKIPPED: isActive=${isActiveCell} inMap=${alreadyInMap}`);
        }
      });
      
      console.log(`Cell ${cellIndex} contributed ${validNeighborsForThisCell} valid neighbors to the map`);
    });
    
    const neighborRecords = Array.from(neighborMap.values());
    console.log(`Found ${neighborRecords.length} neighbor positions`);
    neighborRecords.forEach(record => {
      console.log(`  Neighbor Engine(${record.engineCoord.x},${record.engineCoord.y},${record.engineCoord.z}) -> World(${record.worldCoord.x.toFixed(2)},${record.worldCoord.y.toFixed(2)},${record.worldCoord.z.toFixed(2)})`);
    });
    
    // Debug visualization removed - neighbor filtering working correctly
    
    return neighborRecords;
  };

  // Initialize Three.js scene - only once
  useEffect(() => {
    if (!containerRef.current || sceneRef.current) return; // Don't reinitialize if already exists

    const container = containerRef.current;
    
    // Wait for container to have proper dimensions
    const initializeThreeJS = () => {
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        console.log('ShapeEditor3D: Container not ready, retrying...');
        setTimeout(initializeThreeJS, 100);
        return;
      }

      console.log(`ShapeEditor3D [${instanceId.current}]: Initializing Three.js scene (should only happen once)`);
      
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff); // Default white background
      
      const camera = createCamera(container.clientWidth, container.clientHeight, settings.camera.orthographic, settings.camera.focalLength);
      camera.position.set(8, 8, 8);
      camera.lookAt(0, 0, 0);

      // Create canvas manually and attach it first
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.zIndex = '1';
      canvas.style.pointerEvents = 'auto';
      // Force canvas to stay within its container
      canvas.style.transform = 'none';
      canvas.style.margin = '0';
      canvas.style.padding = '0';
      
      // Clear container and add our canvas
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(canvas);
      
      console.log('ShapeEditor3D: Manual canvas created and attached');
      console.log('ShapeEditor3D: Canvas parent:', canvas.parentElement);
      console.log('ShapeEditor3D: Container bounds:', container.getBoundingClientRect());
      console.log('ShapeEditor3D: Container position in page:', {
        offsetTop: container.offsetTop,
        offsetLeft: container.offsetLeft,
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight
      });
      
      const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    
    console.log('ShapeEditor3D: Container dimensions:', container.clientWidth, 'x', container.clientHeight);
    console.log('ShapeEditor3D: Container element:', container);
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Canvas is already attached manually above
    console.log('ShapeEditor3D: Renderer created with manual canvas');
    
    // Verify canvas is still in the right place after renderer creation
    console.log('ShapeEditor3D: Canvas parent after renderer:', renderer.domElement.parentElement);
    console.log('ShapeEditor3D: Canvas bounds after renderer:', renderer.domElement.getBoundingClientRect());

    // Add comprehensive lighting for even illumination from all sides
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Increased ambient
    scene.add(ambientLight);
    
    // Main directional light (top-front)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    scene.add(mainLight);
    
    // Fill light (back-left)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-8, 5, -8);
    scene.add(fillLight);
    
    // Rim light (right side)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(8, 2, -5);
    scene.add(rimLight);
    
    // Bottom light (subtle upward illumination)
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.2);
    bottomLight.position.set(0, -10, 0);
    scene.add(bottomLight);

    // Setup camera controls with full freedom of movement
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth camera movements
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true; // Allow Y-axis panning
    controls.minDistance = 1;
    controls.maxDistance = 100;
    
    // Remove all rotation constraints for full Y-axis freedom
    controls.minPolarAngle = 0; // Allow looking straight down
    controls.maxPolarAngle = Math.PI; // Allow looking straight up
    controls.minAzimuthAngle = -Infinity; // No horizontal limits
    controls.maxAzimuthAngle = Infinity;
    
    // Enable all controls for mobile
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    
    // Enhanced touch settings for mobile with more sensitivity
    controls.rotateSpeed = 1.2;
    controls.zoomSpeed = 1.5;
    controls.panSpeed = 1.0;
    
    console.log('ShapeEditor3D: OrbitControls initialized');

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    controlsRef.current = controls;
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // Update controls for damping
      renderer.render(scene, camera);
    };
    animate();

      return () => {
        window.removeEventListener('resize', handleResize);
        // Clean up controls
        controls.dispose();
        // Clean up manually created canvas
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        renderer.dispose();
      };
    };

    // Start initialization
    initializeThreeJS();
  }, []);

  // Update CellRecords when coordinates change - STABLE EDITING APPROACH
  useEffect(() => {
    console.log(`=== COORDINATES CHANGED ===`);
    console.log(`Input coordinates:`, coordinates);
    console.log(`Current transformation state: isTransformed=${isTransformed}`);
    
    if (isTransformed && currentTransformation) {
      // STABLE EDITING: We're in a transformed state, maintain current coordinate space
      console.log(`🎯 STABLE EDITING: Maintaining current transformed coordinate space`);
      
      // Create fresh world coordinates using standard centering
      const freshRecords = engineToWorldTransform(coordinates);
      
      // Apply the SAME transformation to maintain spatial consistency
      const stableRecords = freshRecords.map(record => ({
        ...record,
        worldCoord: record.worldCoord.clone().applyMatrix4(currentTransformation)
      }));
      
      setCellRecords(stableRecords);
      
      // Calculate neighbors in the same transformed space
      const newNeighborRecords = calculateNeighborRecords(stableRecords);
      setNeighborRecords(newNeighborRecords);
      
      console.log(`🎯 STABLE: Applied consistent transformation to ${stableRecords.length} cells`);
    } else {
      // NOT TRANSFORMED: Use normal world-space centering
      console.log(`📍 NORMAL: Using standard world-space centering`);
      
      const newCellRecords = engineToWorldTransform(coordinates);
      setCellRecords(newCellRecords);
      
      // Calculate neighbor records
      const newNeighborRecords = calculateNeighborRecords(newCellRecords);
      setNeighborRecords(newNeighborRecords);
    }
  }, [coordinates, isTransformed, currentTransformation]);

  // Update invisible neighbor spheres for raycasting when neighborRecords change
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing neighbor spheres
    neighborSpheresRef.current.forEach(sphere => {
      sceneRef.current!.remove(sphere);
    });
    neighborSpheresRef.current = [];

    // Clear existing debug neighbor spheres
    debugNeighborSpheresRef.current.forEach(sphere => {
      sceneRef.current!.remove(sphere);
    });
    debugNeighborSpheresRef.current = [];

    // Create invisible spheres at neighbor positions for raycasting
    neighborRecords.forEach(neighborRecord => {
      const geometry = new THREE.SphereGeometry(0.4, 8, 6); // Larger radius for easier mobile tapping
      const material = new THREE.MeshBasicMaterial({ 
        transparent: true, 
        opacity: 0, // Completely invisible
        depthWrite: false // Don't interfere with depth buffer
      });
      
      const neighborSphere = new THREE.Mesh(geometry, material);
      neighborSphere.position.copy(neighborRecord.worldCoord);
      
      // Store the neighbor record for easy access
      (neighborSphere as any).neighborRecord = neighborRecord;
      
      sceneRef.current!.add(neighborSphere);
      neighborSpheresRef.current.push(neighborSphere);

      // Create small red debug sphere (10% of normal diameter = 0.0283 radius)
      const debugGeometry = new THREE.SphereGeometry(0.0283, 8, 6);
      const debugMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, // Bright red color
        transparent: false,
        depthWrite: true
      });
      
      const debugSphere = new THREE.Mesh(debugGeometry, debugMaterial);
      debugSphere.position.copy(neighborRecord.worldCoord);
      
      // Mark as debug sphere for identification
      debugSphere.userData = { isDebugNeighbor: true };
      
      // Debug spheres disabled - neighbor issue fixed
      debugSphere.visible = false;
      
      sceneRef.current!.add(debugSphere);
      debugNeighborSpheresRef.current.push(debugSphere);
      
      console.log(`Created debug sphere at Engine(${neighborRecord.engineCoord.x},${neighborRecord.engineCoord.y},${neighborRecord.engineCoord.z}) -> World(${neighborRecord.worldCoord.x.toFixed(2)},${neighborRecord.worldCoord.y.toFixed(2)},${neighborRecord.worldCoord.z.toFixed(2)})`);
    });

    console.log(`Created ${neighborSpheresRef.current.length} invisible neighbor spheres for raycasting`);
    console.log(`Created ${debugNeighborSpheresRef.current.length} red debug spheres for neighbor visualization`);
    console.log(`Debug spheres visibility set to: ${editMode === 'add'} (editMode: ${editMode})`);
  }, [neighborRecords, editMode]);

  // Debug spheres disabled + mode switch protection
  useEffect(() => {
    console.log(`Edit mode changed to: ${editMode} - clearing pending actions for safety`);
    console.log(`🎯 STABLE EDITING: Mode change should NOT trigger any transformations`);
    
    // Clear any pending actions when edit mode changes (prevents accidental actions)
    clearHoverEffects();
    
    // Always hide debug spheres
    debugNeighborSpheresRef.current.forEach((debugSphere, index) => {
      debugSphere.visible = false;
    });
  }, [editMode]);

  // Update spheres when CellRecords change
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) {
      console.log(`ShapeEditor3D [${instanceId.current}]: Spheres effect triggered but missing dependencies`, {
        hasScene: !!sceneRef.current,
        hasCamera: !!cameraRef.current,
        hasControls: !!controlsRef.current,
        cellRecordsLength: cellRecords.length
      });
      return;
    }

    console.log(`ShapeEditor3D [${instanceId.current}]: Updating spheres from CellRecords:`, cellRecords.length);

    // Clear existing spheres and debug spheres
    spheresRef.current.forEach(sphere => {
      sceneRef.current!.remove(sphere);
    });
    spheresRef.current = [];
    
    // Clear any debug neighbor spheres that might exist
    sceneRef.current.children.forEach(child => {
      if (child.userData && child.userData.isDebugNeighbor) {
        sceneRef.current!.remove(child);
      }
    });

    if (cellRecords.length === 0) return;
    
    // Add spheres using CellRecord world coordinates
    cellRecords.forEach((record) => {
      console.log(`Adding sphere: Engine(${record.engineCoord.x},${record.engineCoord.y},${record.engineCoord.z}) -> World(${record.worldCoord.x.toFixed(2)},${record.worldCoord.y.toFixed(2)},${record.worldCoord.z.toFixed(2)})`);
      
      const geometry = new THREE.SphereGeometry(0.283, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: parseInt(settings.material.color.replace('#', '0x')),
        transparent: settings.material.transparency > 0,
        opacity: 1 - settings.material.transparency,
        metalness: settings.material.metalness,
        roughness: 1 - settings.material.reflectiveness,
        envMapIntensity: 1.0
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(record.worldCoord); // Use world coordinate directly
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      
      // Store CellRecord for click detection
      (sphere as any).cellRecord = record;
      
      sceneRef.current!.add(sphere);
      spheresRef.current.push(sphere);
    });
  }, [cellRecords, settings.material]);

  // Update lighting and materials based on settings
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Update lighting brightness for all directional lights
    const lights = sceneRef.current.children.filter(child => child instanceof THREE.DirectionalLight);
    lights.forEach((light, index) => {
      const directionalLight = light as THREE.DirectionalLight;
      // Scale intensity based on light type (main, fill, rim, bottom)
      const baseIntensities = [0.8, 0.4, 0.3, 0.2]; // Main, fill, rim, bottom
      directionalLight.intensity = settings.brightness * (baseIntensities[index] || 0.3);
    });

    // Update ambient light
    const ambientLights = sceneRef.current.children.filter(child => child instanceof THREE.AmbientLight);
    ambientLights.forEach(light => {
      (light as THREE.AmbientLight).intensity = settings.brightness * 0.6;
    });

    // Update background color
    if (rendererRef.current && sceneRef.current) {
      const backgroundColor = new THREE.Color(settings.backgroundColor);
      rendererRef.current.setClearColor(backgroundColor);
      sceneRef.current.background = backgroundColor;
    }

    // Update camera type or focal length if needed
    if (cameraRef.current && controlsRef.current && containerRef.current) {
      const currentIsOrthographic = cameraRef.current instanceof THREE.OrthographicCamera;
      const needsCameraRecreation = currentIsOrthographic !== settings.camera.orthographic;
      
      // Check if focal length changed for perspective camera
      let needsFOVUpdate = false;
      if (!settings.camera.orthographic && cameraRef.current instanceof THREE.PerspectiveCamera) {
        const currentFOV = cameraRef.current.fov;
        const expectedFOV = focalLengthToFOV(settings.camera.focalLength);
        needsFOVUpdate = Math.abs(currentFOV - expectedFOV) > 0.1;
      }
      
      if (needsCameraRecreation || needsFOVUpdate) {
        // Store current camera position and target
        const oldPosition = cameraRef.current.position.clone();
        const oldTarget = controlsRef.current.target.clone();
        
        // Create new camera or update FOV
        if (needsCameraRecreation) {
          const newCamera = createCamera(
            containerRef.current.clientWidth, 
            containerRef.current.clientHeight, 
            settings.camera.orthographic,
            settings.camera.focalLength
          );
          newCamera.position.copy(oldPosition);
          newCamera.lookAt(oldTarget);
          
          // Update references
          cameraRef.current = newCamera;
          controlsRef.current.object = newCamera;
        } else if (needsFOVUpdate && cameraRef.current instanceof THREE.PerspectiveCamera) {
          // Just update FOV for existing perspective camera
          cameraRef.current.fov = focalLengthToFOV(settings.camera.focalLength);
          cameraRef.current.updateProjectionMatrix();
        }
        
        controlsRef.current.target.copy(oldTarget);
        controlsRef.current.update();
        
        // Update renderer
        if (rendererRef.current) {
          rendererRef.current.render(sceneRef.current!, cameraRef.current);
        }
      }
    }

    // Ensure controls are always enabled and properly configured with full Y-axis freedom
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.05;
      controlsRef.current.screenSpacePanning = true; // Allow Y-axis panning
      controlsRef.current.minDistance = 1;
      controlsRef.current.maxDistance = 100;
      
      // Remove all rotation constraints for full Y-axis freedom
      controlsRef.current.minPolarAngle = 0; // Allow looking straight down
      controlsRef.current.maxPolarAngle = Math.PI; // Allow looking straight up
      controlsRef.current.minAzimuthAngle = -Infinity; // No horizontal limits
      controlsRef.current.maxAzimuthAngle = Infinity;
      
      controlsRef.current.update();
      
      // Make canvas focusable but don't auto-focus to avoid camera jumps
      if (rendererRef.current && rendererRef.current.domElement) {
        const canvas = rendererRef.current.domElement;
        canvas.tabIndex = 0; // Make canvas focusable when user clicks
        canvas.style.outline = 'none'; // Remove focus outline
      }
    }

    // Update all sphere materials in real-time
    spheresRef.current.forEach(sphere => {
      if (sphere.material instanceof THREE.MeshStandardMaterial) {
        const material = sphere.material;
        
        // Update color
        material.color.setHex(parseInt(settings.material.color.replace('#', '0x')));
        
        // Update transparency
        material.transparent = settings.material.transparency > 0;
        material.opacity = 1 - settings.material.transparency;
        
        // Update metalness directly from slider
        material.metalness = settings.material.metalness;
        
        // Update roughness from reflectiveness (inverse relationship)
        material.roughness = 1 - settings.material.reflectiveness;
        
        // Mark material as needing update
        material.needsUpdate = true;
      }
    });

    // Update preview sphere material if it exists
    if (previewSphereRef.current && previewSphereRef.current.material instanceof THREE.MeshStandardMaterial) {
      const previewMaterial = previewSphereRef.current.material;
      
      // Update color
      previewMaterial.color.setHex(parseInt(settings.material.color.replace('#', '0x')));
      
      // Update transparency - check if this is a confirmation stage preview (50% opacity)
      previewMaterial.transparent = true;
      const isConfirmationStage = pendingAddPosition !== null;
      previewMaterial.opacity = isConfirmationStage ? 0.5 : Math.max(0.7, 1 - settings.material.transparency);
      
      // Update metalness
      previewMaterial.metalness = settings.material.metalness;
      
      // Update roughness
      previewMaterial.roughness = 1 - settings.material.reflectiveness;
      
      // Mark material as needing update
      previewMaterial.needsUpdate = true;
    }
  }, [settings]);

  // Mouse event handlers for add/delete functionality
  const handleMouseDown = (event: React.MouseEvent) => {
    if (!editingEnabled) return;
    
    setIsMouseDown(true);
    setMouseMoved(false);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!editingEnabled) {
      clearHoverEffects();
      return;
    }

    if (isMouseDown) {
      setMouseMoved(true);
      return;
    }

    // Get mouse position for raycasting
    const canvas = rendererRef.current?.domElement;
    if (!canvas || !sceneRef.current || !cameraRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    
    // Increase raycaster threshold for better mobile touch detection
    raycaster.params.Points.threshold = 0.1;
    raycaster.params.Line.threshold = 0.1;

    // Clear previous hover effects
    clearHoverEffects();

    if (editMode === 'delete') {
      // DELETE MODE: Make sphere 80% transparent to preview deletion
      const intersects = raycaster.intersectObjects(spheresRef.current);
      if (intersects.length > 0) {
        const hoveredSphere = intersects[0].object as THREE.Mesh;
        
        // Store original material and make sphere 80% transparent
        originalMaterialRef.current = hoveredSphere.material;
        const originalMat = hoveredSphere.material as THREE.MeshStandardMaterial;
        const deleteMaterial = new THREE.MeshStandardMaterial({
          color: originalMat.color.getHex(),
          transparent: true,
          opacity: 0.2, // 80% transparent (20% opacity)
          metalness: originalMat.metalness,
          roughness: originalMat.roughness
        });
        
        hoveredSphere.material = deleteMaterial;
        hoveredSphereRef.current = hoveredSphere;
      }
    } else if (editMode === 'add') {
      // ADD MODE - Hover shows subtle preview only, double-tap required for mobile
      // Only show hover preview if there's no pending add position (to avoid interference)
      if (!pendingAddPosition) {
        if (cellRecords.length === 0) {
          // First cell - subtle hover preview at origin
          const previewSphere = createPreviewSphere(false); // Use normal transparency for hover
          previewSphere.position.set(0, 0, 0);
          sceneRef.current.add(previewSphere);
          previewSphereRef.current = previewSphere;
          console.log(`Hover preview at origin - double-tap required to add`);
        } else {
          // Use raycasting to find intersected neighbor spheres
          const intersects = raycaster.intersectObjects(neighborSpheresRef.current);
          
          if (intersects.length > 0) {
            // Two-stage selection: 1) closest to hover point, 2) closest to camera as tiebreaker
            let bestIntersect = intersects[0];
            
            if (intersects.length > 1) {
              // Find the intersection closest to the hover point (smallest distance from ray)
              const hoverDistances = intersects.map(intersect => {
                const sphereCenter = intersect.object.position;
                return raycaster.ray.distanceToPoint(sphereCenter);
              });
              
              const minHoverDistance = Math.min(...hoverDistances);
              const hoverThreshold = 0.1; // Allow small variations in hover distance
              
              // Filter to neighbors that are close to the hover point
              const closeToHover = intersects.filter((intersect, index) => 
                hoverDistances[index] <= minHoverDistance + hoverThreshold
              );
              
              // Among those close to hover, choose the one closest to camera
              if (closeToHover.length > 1) {
                closeToHover.sort((a, b) => a.distance - b.distance);
                bestIntersect = closeToHover[0];
              } else {
                bestIntersect = closeToHover[0];
              }
            }
            
            const intersectedSphere = bestIntersect.object as THREE.Mesh;
            const neighborRecord = (intersectedSphere as any).neighborRecord as CellRecord;
            
            if (neighborRecord) {
              // Show subtle hover preview
              const previewSphere = createPreviewSphere(false); // Use normal transparency for hover
              previewSphere.position.copy(neighborRecord.worldCoord);
              sceneRef.current.add(previewSphere);
              previewSphereRef.current = previewSphere;
              
              console.log(`Hover preview at Engine(${neighborRecord.engineCoord.x},${neighborRecord.engineCoord.y},${neighborRecord.engineCoord.z}) - double-tap required to add`);
            }
          }
        }
      }
    }
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (!editingEnabled || !isMouseDown || mouseMoved) {
      setIsMouseDown(false);
      setMouseMoved(false);
      return;
    }

    // Only process click if mouse didn't move (not a drag)
    const canvas = rendererRef.current?.domElement;
    if (!canvas || !sceneRef.current || !cameraRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    
    // Increase raycaster threshold for better mobile touch detection
    raycaster.params.Points.threshold = 0.1;
    raycaster.params.Line.threshold = 0.1;

    if (editMode === 'delete') {
      // Delete mode - check for sphere intersections using CellRecord
      const intersects = raycaster.intersectObjects(spheresRef.current);
      if (intersects.length > 0) {
        const clickedSphere = intersects[0].object as THREE.Mesh;
        const cellRecord = (clickedSphere as any).cellRecord as CellRecord;
        
        if (cellRecord) {
          console.log(`Removing cell: Engine(${cellRecord.engineCoord.x},${cellRecord.engineCoord.y},${cellRecord.engineCoord.z})`);
          
          // Find and remove the corresponding coordinate from original coordinates
          const newCoordinates = coordinates.filter(coord => 
            !(coord.x === cellRecord.engineCoord.x && coord.y === cellRecord.engineCoord.y && coord.z === cellRecord.engineCoord.z)
          );
          onCoordinatesChange(newCoordinates);
        }
      }
    } else if (editMode === 'add') {
      // ADD MODE CLICK - Two-stage tap process
      if (cellRecords.length === 0) {
        // No cells available - user must load a shape first
        console.log(`No cells available - user must load a shape first`);
        return;
      } 
      // Subsequent cells - use raycasting to find neighbor positions
        const intersects = raycaster.intersectObjects(neighborSpheresRef.current);
        
        if (intersects.length > 0) {
          // Two-stage selection: 1) closest to tap point, 2) closest to camera as tiebreaker
          let bestIntersect = intersects[0];
          
          if (intersects.length > 1) {
            // Find the intersection closest to the tap point (smallest distance from ray)
            const tapDistances = intersects.map(intersect => {
              const sphereCenter = intersect.object.position;
              return raycaster.ray.distanceToPoint(sphereCenter);
            });
            
            const minTapDistance = Math.min(...tapDistances);
            const tapThreshold = 0.1; // Allow small variations in tap distance
            
            // Filter to neighbors that are close to the tap point
            const closeToTap = intersects.filter((intersect, index) => 
              tapDistances[index] <= minTapDistance + tapThreshold
            );
            
            // Among those close to tap, choose the one closest to camera
            if (closeToTap.length > 1) {
              closeToTap.sort((a, b) => a.distance - b.distance);
              bestIntersect = closeToTap[0];
              console.log(`Multiple neighbors near tap - selected closest to camera`);
            } else {
              bestIntersect = closeToTap[0];
            }
          }
          
          const intersectedSphere = bestIntersect.object as THREE.Mesh;
          const neighborRecord = (intersectedSphere as any).neighborRecord as CellRecord;
          
          if (neighborRecord) {
            if (pendingAddPosition && 
                pendingAddPosition.engineCoord.x === neighborRecord.engineCoord.x &&
                pendingAddPosition.engineCoord.y === neighborRecord.engineCoord.y &&
                pendingAddPosition.engineCoord.z === neighborRecord.engineCoord.z) {
              // Second tap on same position - confirm add
              console.log(`Confirming add: Engine(${neighborRecord.engineCoord.x},${neighborRecord.engineCoord.y},${neighborRecord.engineCoord.z})`);
              const newCoordinates = [...coordinates, neighborRecord.engineCoord];
              onCoordinatesChange(newCoordinates);
              setPendingAddPosition(null);
            } else {
              // First tap or tap on different position - show preview
              console.log(`First tap - showing preview at Engine(${neighborRecord.engineCoord.x},${neighborRecord.engineCoord.y},${neighborRecord.engineCoord.z})`);
              
              // Clear any existing preview
              clearHoverEffects();
              
              // Show new preview at 50% transparency
              const previewSphere = createPreviewSphere(true); // 50% transparent
              previewSphere.position.copy(neighborRecord.worldCoord);
              sceneRef.current.add(previewSphere);
              previewSphereRef.current = previewSphere;
              setPendingAddPosition(neighborRecord);
            }
          }
        } else {
          // Tap outside valid neighbor positions - clear preview
          console.log(`Tap outside valid positions - clearing preview`);
          clearHoverEffects();
        }
      }
    }

    setIsMouseDown(false);
    setMouseMoved(false);
  };

  const handleMouseLeave = () => {
    // Clear all hover effects when mouse leaves the canvas
    clearHoverEffects();
    setIsMouseDown(false);
    setMouseMoved(false);
  };

  // Expose methods for hull-based center & orient functionality
  useImperativeHandle(ref, () => ({
    getCellRecords: () => {
      return cellRecords;
    },
    
    resetToOriginalTransform: (engineCoords: FCCCoord[]) => {
      return resetToOriginalTransform(engineCoords);
    },
    
    applyCenterOrientTransform: async (transformMatrix: THREE.Matrix4) => {
      console.log('🎯 Applying center & orient transformation with reset-based approach...');
      
      // Step 1: Reset to original coordinates (clear any previous transformations)
      const resetRecords = resetToOriginalTransform(coordinates);
      console.log('🔄 Reset to original coordinates complete');
      
      // Step 2: Apply the new transformation to the reset coordinates
      const transformedRecords = resetRecords.map(record => ({
        ...record,
        worldCoord: record.worldCoord.clone().applyMatrix4(transformMatrix)
      }));
      
      // Step 3: Store the transformation matrix for consistent neighbor calculations
      setCurrentTransformation(transformMatrix.clone());
      setIsTransformed(true);
      console.log('🎯 TRANSFORMATION STATE: Now in transformed mode - editing will be stable');
      
      // Step 4: Update cell records state
      setCellRecords(transformedRecords);
      
      // Step 5: Recalculate neighbors with the new transformation applied
      const newNeighborRecords = calculateNeighborRecords(transformedRecords);
      setNeighborRecords(newNeighborRecords);
      
      // Step 6: Calculate optimal camera position for the transformed shape
      if (cameraRef.current && controlsRef.current) {
        const worldPoints = transformedRecords.map(record => record.worldCoord);
        const { position, target } = calculateOptimalCameraPosition(worldPoints, cameraRef.current);
        
        // Smoothly animate camera to new position
        cameraRef.current.position.copy(position);
        controlsRef.current.target.copy(target);
        controlsRef.current.update();
        
        console.log('🎯 Camera positioned for optimal viewing');
      }
      
      console.log('🎯 Reset-based center & orient transformation complete');
      console.log('🎯 Transformation matrix stored for consistent editing');
    },
    
    updateMaterialSettings: async (materialSettings: MaterialSettings) => {
      console.log('🎨 Updating material settings in ShapeEditor3D:', materialSettings);
      
      try {
        // Initialize PBR service if not already done
        const pbrService = PBRIntegrationService.getInstance();
        if (sceneRef.current && rendererRef.current) {
          pbrService.initialize(sceneRef.current, rendererRef.current);
        }
        
        // Create new material from settings
        const newMaterial = await pbrService.createMaterialFromSettings(materialSettings);
        
        // Update all sphere materials
        spheresRef.current.forEach(sphere => {
          if (sphere.material) {
            sphere.material.dispose(); // Clean up old material
          }
          sphere.material = newMaterial.clone(); // Clone to avoid sharing
        });
        
        // Update preview sphere materials if they exist
        if (previewSphereRef.current) {
          if (previewSphereRef.current.material) {
            previewSphereRef.current.material.dispose();
          }
          const previewMaterial = newMaterial.clone();
          if (previewMaterial.transparent !== undefined) {
            previewMaterial.transparent = true;
            previewMaterial.opacity = 0.7; // Preview transparency
          }
          previewSphereRef.current.material = previewMaterial;
        }
        
        console.log('🎨 Material settings updated successfully');
      } catch (error) {
        console.error('🎨 Failed to update material settings:', error);
      }
    }
  }), [cellRecords, calculateNeighborRecords, coordinates, currentTransformation, resetToOriginalTransform]);

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        cursor: editingEnabled ? (editMode === 'add' ? 'crosshair' : 'pointer') : 'default'
      }}
    />
  );
});

ShapeEditor3D.displayName = 'ShapeEditor3D';

export default ShapeEditor3D;
