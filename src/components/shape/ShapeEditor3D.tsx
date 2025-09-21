// UI-only port; engines remain upstream.
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FCCCoord, fccToWorld, getFCCNeighbors, centerFCCCoords } from '../../lib/coords/fcc';
import { AppSettings } from './SettingsModal';

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

export default function ShapeEditor3D({
  coordinates,
  settings,
  editMode,
  editingEnabled,
  onCoordinatesChange
}: ShapeEditor3DProps) {
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
  const createPreviewSphere = () => {
    const geometry = new THREE.SphereGeometry(0.283, 32, 24);
    const material = new THREE.MeshStandardMaterial({
      color: parseInt(settings.material.color.replace('#', '0x')),
      transparent: true,
      opacity: Math.max(0.7, 1 - settings.material.transparency), // Use user transparency but ensure it's visible as preview
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

  // Transform engine coordinates to world coordinates with all viewing transformations
  const engineToWorldTransform = (engineCoords: FCCCoord[]): CellRecord[] => {
    if (engineCoords.length === 0) return [];

    console.log(`=== TRANSFORMING ENGINE TO WORLD ===`);
    console.log(`Input engine coords (integers):`, engineCoords.map(c => `(${c.x},${c.y},${c.z})`));
    
    // Apply centering transformation ONLY for world coordinate calculation
    const centeredCoords = centerFCCCoords(engineCoords);
    console.log(`Centered coords (for display only):`, centeredCoords.map(c => `(${c.x},${c.y},${c.z})`));
    
    // Convert to CellRecords - PRESERVE original integer engine coordinates
    const records: CellRecord[] = engineCoords.map((originalCoord, index) => {
      const centeredCoord = centeredCoords[index];
      const worldPos = fccToWorld(centeredCoord); // Use centered coord for world position
      return {
        engineCoord: originalCoord, // KEEP original integer coordinate
        worldCoord: new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z),
        id: `cell_${originalCoord.x}_${originalCoord.y}_${originalCoord.z}_${Date.now()}_${index}`
      };
    });
    
    console.log(`Created ${records.length} cell records`);
    records.forEach(record => {
      console.log(`  Engine(${record.engineCoord.x},${record.engineCoord.y},${record.engineCoord.z}) -> World(${record.worldCoord.x.toFixed(2)},${record.worldCoord.y.toFixed(2)},${record.worldCoord.z.toFixed(2)})`);
    });
    
    return records;
  };

  // Calculate neighbor records from existing cell records
  const calculateNeighborRecords = (activeCells: CellRecord[]): CellRecord[] => {
    if (activeCells.length === 0) return [];

    console.log(`=== CALCULATING NEIGHBOR RECORDS ===`);
    const neighborMap = new Map<string, CellRecord>();
    
    // Get the SAME centering transformation that was applied to active cells
    const originalEngineCoords = activeCells.map(cell => cell.engineCoord);
    const centeredActiveCoords = centerFCCCoords(originalEngineCoords);
    
    // Calculate the centering offset (same for all cells)
    const centeringOffset = {
      x: centeredActiveCoords[0].x - originalEngineCoords[0].x,
      y: centeredActiveCoords[0].y - originalEngineCoords[0].y,
      z: centeredActiveCoords[0].z - originalEngineCoords[0].z
    };
    
    console.log(`Using centering offset: (${centeringOffset.x}, ${centeringOffset.y}, ${centeringOffset.z})`);
    
    activeCells.forEach(activeCell => {
      const neighbors = getFCCNeighbors(activeCell.engineCoord);
      
      neighbors.forEach(neighborCoord => {
        const key = `${neighborCoord.x},${neighborCoord.y},${neighborCoord.z}`;
        
        // Skip if this position is already an active cell
        const isActiveCell = activeCells.some(active => 
          active.engineCoord.x === neighborCoord.x && 
          active.engineCoord.y === neighborCoord.y && 
          active.engineCoord.z === neighborCoord.z
        );
        
        if (!isActiveCell && !neighborMap.has(key)) {
          // Apply the SAME centering offset as active cells
          const centeredNeighbor = {
            x: neighborCoord.x + centeringOffset.x,
            y: neighborCoord.y + centeringOffset.y,
            z: neighborCoord.z + centeringOffset.z
          };
          
          const worldPos = fccToWorld(centeredNeighbor);
          const neighborWorldCoord = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
          
          // DISTANCE FILTER: Only keep neighbors that are close enough to at least one active cell
          const isCloseToActiveCell = activeCells.some(activeCell => {
            const distance = neighborWorldCoord.distanceTo(activeCell.worldCoord);
            const maxDistance = 0.57; // Adjusted for proper FCC neighbor distance (~0.566)
            console.log(`  Distance check: neighbor at (${neighborWorldCoord.x.toFixed(2)},${neighborWorldCoord.y.toFixed(2)},${neighborWorldCoord.z.toFixed(2)}) to active at (${activeCell.worldCoord.x.toFixed(2)},${activeCell.worldCoord.y.toFixed(2)},${activeCell.worldCoord.z.toFixed(2)}) = ${distance.toFixed(3)}, max=${maxDistance}`);
            return distance <= maxDistance;
          });
          
          if (isCloseToActiveCell) {
            const neighborRecord: CellRecord = {
              engineCoord: neighborCoord, // KEEP original integer coordinate
              worldCoord: neighborWorldCoord,
              id: `neighbor_${key}_${Date.now()}`
            };
            neighborMap.set(key, neighborRecord);
          }
        }
      });
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

    // Setup camera controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth camera movements
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI; // Allow full rotation
    
    // Enable touch controls for mobile
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    
    // Touch settings for mobile
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    
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

  // Update CellRecords when coordinates change
  useEffect(() => {
    console.log(`=== COORDINATES CHANGED ===`);
    console.log(`Input coordinates:`, coordinates);
    
    // Transform coordinates to CellRecords
    const newCellRecords = engineToWorldTransform(coordinates);
    setCellRecords(newCellRecords);
    
    // Calculate neighbor records
    const newNeighborRecords = calculateNeighborRecords(newCellRecords);
    setNeighborRecords(newNeighborRecords);
  }, [coordinates]);

  // Update invisible neighbor spheres for raycasting when neighborRecords change
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing neighbor spheres
    neighborSpheresRef.current.forEach(sphere => {
      sceneRef.current!.remove(sphere);
    });
    neighborSpheresRef.current = [];

    // Create invisible spheres at neighbor positions for raycasting
    neighborRecords.forEach(neighborRecord => {
      const geometry = new THREE.SphereGeometry(0.283, 8, 6); // Lower detail for invisible spheres
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
    });

    console.log(`Created ${neighborSpheresRef.current.length} invisible neighbor spheres for raycasting`);
  }, [neighborRecords]);

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

    // Ensure controls are always enabled and properly configured
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.05;
      controlsRef.current.screenSpacePanning = false;
      controlsRef.current.minDistance = 2;
      controlsRef.current.maxDistance = 50;
      controlsRef.current.maxPolarAngle = Math.PI;
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
      
      // Update transparency (ensure it's visible as preview)
      previewMaterial.transparent = true;
      previewMaterial.opacity = Math.max(0.7, 1 - settings.material.transparency);
      
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
      // ADD MODE - Two-stage process: hover shows preview, click confirms
      if (cellRecords.length === 0) {
        // First cell - show preview at origin
        const previewSphere = createPreviewSphere();
        previewSphere.position.set(0, 0, 0);
        sceneRef.current.add(previewSphere);
        previewSphereRef.current = previewSphere;
        setPendingAddPosition({ 
          engineCoord: { x: 0, y: 0, z: 0 }, 
          worldCoord: new THREE.Vector3(0, 0, 0), 
          id: 'pending_origin' 
        });
        console.log(`First cell preview at origin`);
      } else {
        // Use raycasting to find intersected neighbor spheres
        const intersects = raycaster.intersectObjects(neighborSpheresRef.current);
        
        if (intersects.length > 0) {
          // Get the closest intersected neighbor sphere
          const intersectedSphere = intersects[0].object as THREE.Mesh;
          const neighborRecord = (intersectedSphere as any).neighborRecord as CellRecord;
          
          if (neighborRecord) {
            // Show preview sphere at exact neighbor position
            const previewSphere = createPreviewSphere();
            previewSphere.position.copy(neighborRecord.worldCoord);
            sceneRef.current.add(previewSphere);
            previewSphereRef.current = previewSphere;
            setPendingAddPosition(neighborRecord);
            
            console.log(`Preview at exact neighbor Engine(${neighborRecord.engineCoord.x},${neighborRecord.engineCoord.y},${neighborRecord.engineCoord.z}) -> World(${neighborRecord.worldCoord.x.toFixed(2)},${neighborRecord.worldCoord.y.toFixed(2)},${neighborRecord.worldCoord.z.toFixed(2)})`);
          }
        } else {
          // No neighbor intersection - clear any pending add
          setPendingAddPosition(null);
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
      // ADD MODE CLICK - Two-stage: only add if there's a pending position
      if (pendingAddPosition) {
        console.log(`Confirming add: Engine(${pendingAddPosition.engineCoord.x},${pendingAddPosition.engineCoord.y},${pendingAddPosition.engineCoord.z})`);
        
        // Add the engine coordinate to the original coordinates array
        const newCoordinates = [...coordinates, pendingAddPosition.engineCoord];
        onCoordinatesChange(newCoordinates);
        
        // Clear the pending position
        setPendingAddPosition(null);
      } else {
        console.log(`No pending add position - click ignored`);
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
}
