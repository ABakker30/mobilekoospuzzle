// Solution Editor 3D Component
// 3D rendering for puzzle solutions with piece-based materials and visibility

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SolutionFile, SolutionSettings, PieceRenderData } from '../../types/solution';
import { fccToWorld, centerFCCCoords } from '../../lib/coords/fcc';
import { calculateOptimalCameraPosition, analyzeConvexHull } from '../../lib/geometry/hull';
import { PBRIntegrationService } from '../../services/pbrIntegration';
import DebugModal from './DebugModal';

interface SolutionEditor3DProps {
  solution: SolutionFile;
  settings: SolutionSettings;
}

export interface SolutionEditor3DRef {
  centerAndOrientSolution: () => void;
}

const SolutionEditor3D = forwardRef<SolutionEditor3DRef, SolutionEditor3DProps>(({
  solution,
  settings
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera>();
  const controlsRef = useRef<OrbitControls>();

  // Debug modal state
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const pieceGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  
  // PBR integration service
  const pbrServiceRef = useRef<PBRIntegrationService | null>(null);
  
  // Solution transformation state (follows the 8-step process)
  const originalWorldPositionsRef = useRef<THREE.Vector3[]>([]);  // Step 2: Engine -> World
  const orientedWorldPositionsRef = useRef<THREE.Vector3[]>([]);  // Step 7: Oriented coordinates
  const cameraPivotRef = useRef<THREE.Vector3>(new THREE.Vector3()); // Step 8: Transformed pivot
  const isOrientedRef = useRef<boolean>(false);
  

  // ALT+D keyboard handler for debug modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setShowDebugModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(settings.backgroundColor);
    sceneRef.current = scene;
    
    // Camera setup
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    
    // Convert focal length to FOV (Field of View)
    // FOV = 2 * arctan(sensor_height / (2 * focal_length)) * (180/π)
    // Using 35mm sensor height (24mm) as standard
    const fovFromFocalLength = (focalLength: number) => {
      return 2 * Math.atan(24 / (2 * focalLength)) * (180 / Math.PI);
    };
    
    const camera = settings.camera.orthographic
      ? new THREE.OrthographicCamera(-10 * aspect, 10 * aspect, 10, -10, 0.1, 1000)
      : new THREE.PerspectiveCamera(fovFromFocalLength(settings.camera.focalLength), aspect, 0.1, 1000);
    
    camera.position.set(15, 15, 15); // Move camera further back
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    
    containerRef.current.appendChild(renderer.domElement);
    
    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controlsRef.current = controls;
    
    // Add comprehensive lighting for even illumination from all sides (same as Puzzle Shape page)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6 * settings.brightness); // Increased ambient
    scene.add(ambientLight);
    
    // Main directional light (top-front)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8 * settings.brightness);
    mainLight.position.set(10, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    scene.add(mainLight);
    
    // Fill light (back-left)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4 * settings.brightness);
    fillLight.position.set(-8, 5, -8);
    scene.add(fillLight);
    
    // Rim light (right side)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3 * settings.brightness);
    rimLight.position.set(8, 2, -5);
    scene.add(rimLight);
    
    // Bottom light (subtle upward illumination)
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.2 * settings.brightness);
    bottomLight.position.set(0, -10, 0);
    scene.add(bottomLight);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const aspect = width / height;
      
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = aspect;
      } else {
        camera.left = -10 * aspect;
        camera.right = 10 * aspect;
      }
      
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);
  
  // Update scene background
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(settings.backgroundColor);
    }
  }, [settings.backgroundColor]);
  
  // Update lighting brightness (same as Puzzle Shape page)
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
  }, [settings.brightness]);

  // Update scene background color only
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(settings.backgroundColor);
    }
  }, [settings.backgroundColor]);

  // Update material properties (metalness, reflectiveness, transparency)
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
          // Convert MeshLambertMaterial to MeshStandardMaterial for PBR properties
          const oldMaterial = child.material;
          const newMaterial = new THREE.MeshStandardMaterial({
            color: oldMaterial.color,
            transparent: oldMaterial.transparent,
            opacity: Math.max(0.1, 1.0 - settings.transparency), // Invert transparency (0 = opaque, 1 = transparent)
            metalness: settings.metalness,
            roughness: 1.0 - settings.reflectiveness // Invert reflectiveness (0 = rough, 1 = smooth)
          });
          
          child.material = newMaterial;
          oldMaterial.dispose();
        } else if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          // Update existing MeshStandardMaterial
          child.material.opacity = Math.max(0.1, 1.0 - settings.transparency);
          child.material.metalness = settings.metalness;
          child.material.roughness = 1.0 - settings.reflectiveness;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [settings.metalness, settings.reflectiveness, settings.transparency]);

  // Update camera properties (focal length only - orthographic switching requires full recreation)
  useEffect(() => {
    if (!cameraRef.current || !containerRef.current) return;

    // Convert focal length to FOV
    const fovFromFocalLength = (focalLength: number) => {
      return 2 * Math.atan(24 / (2 * focalLength)) * (180 / Math.PI);
    };

    // Only update FOV for perspective cameras (don't recreate camera)
    if (cameraRef.current instanceof THREE.PerspectiveCamera && !settings.camera.orthographic) {
      const newFov = fovFromFocalLength(settings.camera.focalLength);
      cameraRef.current.fov = newFov;
      cameraRef.current.updateProjectionMatrix();
      
      // Trigger a render
      if (rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  }, [settings.camera.focalLength]);

  // Handle orthographic mode switching (requires camera recreation)
  useEffect(() => {
    if (!cameraRef.current || !containerRef.current || !controlsRef.current) return;

    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    
    // Convert focal length to FOV
    const fovFromFocalLength = (focalLength: number) => {
      return 2 * Math.atan(24 / (2 * focalLength)) * (180 / Math.PI);
    };

    // Check if we need to switch camera types
    const isCurrentlyOrthographic = cameraRef.current instanceof THREE.OrthographicCamera;
    const shouldBeOrthographic = settings.camera.orthographic;

    if (isCurrentlyOrthographic !== shouldBeOrthographic) {
      // Store current camera state
      const currentPosition = cameraRef.current.position.clone();
      const currentTarget = controlsRef.current.target.clone();

      // Create new camera of the correct type
      const newCamera = shouldBeOrthographic
        ? new THREE.OrthographicCamera(-10 * aspect, 10 * aspect, 10, -10, 0.1, 1000)
        : new THREE.PerspectiveCamera(fovFromFocalLength(settings.camera.focalLength), aspect, 0.1, 1000);

      // Restore position and target
      newCamera.position.copy(currentPosition);
      newCamera.lookAt(currentTarget);
      
      // Update camera reference
      cameraRef.current = newCamera;
      
      // Update controls to use new camera
      controlsRef.current.object = newCamera;
      controlsRef.current.target.copy(currentTarget);
      controlsRef.current.update();

      // Trigger a render
      if (rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, newCamera);
      }
    }
  }, [settings.camera.orthographic]);
  
  // Calculate optimal sphere radius based on shortest distance between spheres in world coordinates
  const calculateOptimalSphereRadius = (): number => {
    let minDistance = Infinity;
    
    // Check distances within each piece (4 spheres per piece)
    solution.placements.forEach((placement) => {
      const worldPositions = placement.cells_ijk.map(cell => {
        const fccCoord = { x: cell[0], y: cell[1], z: cell[2] };
        return fccToWorld(fccCoord);
      });
      
      // Calculate all pairwise distances within this piece
      for (let i = 0; i < worldPositions.length; i++) {
        for (let j = i + 1; j < worldPositions.length; j++) {
          const pos1 = worldPositions[i];
          const pos2 = worldPositions[j];
          const distance = Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2) +
            Math.pow(pos1.z - pos2.z, 2)
          );
          minDistance = Math.min(minDistance, distance);
        }
      }
    });
    
    // Return 0.5x the shortest distance, with fallback
    const radius = minDistance === Infinity ? 0.4 : minDistance * 0.5;
    return radius;
  };

  // Initialize PBR service once
  const initializePBR = () => {
    if (!pbrServiceRef.current && sceneRef.current && rendererRef.current) {
      pbrServiceRef.current = PBRIntegrationService.getInstance();
      pbrServiceRef.current.initialize(sceneRef.current, rendererRef.current);
    }
  };

  // Convert SolutionSettings to MaterialSettings format for PBRIntegrationService
  const createMaterialSettings = (baseColor: string) => {
    // Map solution material preset to shape material type
    const materialTypeMap: Record<string, string> = {
      'basic': 'plastic',
      'gold': 'pbr_gold',
      'stainlessSteel': 'pbr_steel',
      'brushedSteel': 'pbr_brushed'
    };

    const materialType = materialTypeMap[settings.material?.preset || 'basic'] || 'plastic';

    return {
      type: materialType as any,
      color: baseColor,
      metalness: settings.metalness || 0,
      transparency: settings.transparency || 0,
      reflectiveness: settings.reflectiveness || 0.5,
      roughness: settings.material?.roughness || 0.5,
      clearcoat: settings.material?.clearcoat || 0,
      clearcoatRoughness: 0.1,
      useHDR: settings.hdr?.enabled || false,
      hdrEnvironment: settings.hdr?.environment || 'studio',
      hdrIntensity: settings.hdr?.intensity || 1.0,
      sheen: settings.material?.sheen || 0.3
    };
  };

  // Create basic material (avoiding PBR conflicts)
  const createMaterial = (baseColor: string): THREE.Material => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColor),
      transparent: true,
      opacity: Math.max(0.1, 1.0 - (settings.transparency || 0)),
      metalness: settings.metalness || 0,
      roughness: 1.0 - (settings.reflectiveness || 0),
      // Add subtle sheen based on settings
      ...(settings.material?.sheen && {
        sheen: settings.material.sheen,
        sheenColor: new THREE.Color(baseColor).multiplyScalar(0.5)
      })
    });
  };

  // Create piece render data with coordinate-based ordering
  const createPieceRenderData = (): PieceRenderData[] => {
    // Calculate center position for each piece and sort by -y, -x, -z
    const placementsWithCenters = solution.placements.map(placement => {
      // Calculate center of piece in world coordinates
      const worldPositions = placement.cells_ijk.map(cell => {
        const fccCoord = { x: cell[0], y: cell[1], z: cell[2] };
        return fccToWorld(fccCoord);
      });
      
      const center = {
        x: worldPositions.reduce((sum, pos) => sum + pos.x, 0) / worldPositions.length,
        y: worldPositions.reduce((sum, pos) => sum + pos.y, 0) / worldPositions.length,
        z: worldPositions.reduce((sum, pos) => sum + pos.z, 0) / worldPositions.length
      };
      
      return { placement, center };
    });
    
    // Sort by -y, -x, -z (negative values for descending order)
    placementsWithCenters.sort((a, b) => {
      // Primary sort: -y (higher y values first)
      if (Math.abs(a.center.y - b.center.y) > 0.001) {
        return b.center.y - a.center.y;
      }
      // Secondary sort: -x (higher x values first)  
      if (Math.abs(a.center.x - b.center.x) > 0.001) {
        return b.center.x - a.center.x;
      }
      // Tertiary sort: -z (higher z values first)
      return b.center.z - a.center.z;
    });
    
    // Create render data with sorted order
    return placementsWithCenters.map(({ placement }, index) => ({
      id: placement.piece,
      color: settings.pieceColors[placement.piece] || '#888888',
      visible: index < settings.visiblePieceCount,
      cells: placement.cells_ijk
    }));
  };
  
  // Clear orientation state only when solution changes (not settings)
  useEffect(() => {
    console.log('🔄 Solution changed - clearing orientation state');
    originalWorldPositionsRef.current = [];
    orientedWorldPositionsRef.current = [];
    cameraPivotRef.current = new THREE.Vector3();
    isOrientedRef.current = false;
  }, [solution]);

  // Render solution pieces with PBR materials
  useEffect(() => {
    if (!sceneRef.current) return;
    
    
    // Initialize PBR system
    initializePBR();
    
    // Clear existing pieces
    pieceGroupsRef.current.forEach((group) => {
      sceneRef.current!.remove(group);
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    pieceGroupsRef.current.clear();
    
    // Create piece render data
    const pieceData = createPieceRenderData();
    
    // Calculate optimal sphere radius based on world coordinates
    const sphereRadius = calculateOptimalSphereRadius();
    
    // Render each piece with basic materials
    pieceData.forEach((piece) => {
      const pieceGroup = new THREE.Group();
      pieceGroup.name = `piece_${piece.id}`;
      pieceGroup.visible = piece.visible;
      
      // Create material for this piece
      const material = createMaterial(piece.color);
      
      // Create high-quality spheres for each cell in the piece
      const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 24); // High quality mesh
      
      piece.cells.forEach((cell, cellIndex) => {
        const sphere = new THREE.Mesh(sphereGeometry, material.clone());
        
        // Calculate global cell index to find the oriented position
        const allCells = solution.placements.flatMap(p => p.cells_ijk);
        const globalCellIndex = allCells.findIndex(c => c[0] === cell[0] && c[1] === cell[1] && c[2] === cell[2]);
        
        // Use oriented position if available, otherwise convert from engine coordinates
        if (isOrientedRef.current && orientedWorldPositionsRef.current.length > 0 && globalCellIndex >= 0 && globalCellIndex < orientedWorldPositionsRef.current.length) {
          // Use pre-computed oriented world position (Step 7 coordinates)
          sphere.position.copy(orientedWorldPositionsRef.current[globalCellIndex]);
        } else {
          // Fallback: convert from engine coordinates (Steps 1-2)
          const fccCoord = { x: cell[0], y: cell[1], z: cell[2] };
          const worldPos = fccToWorld(fccCoord);
          sphere.position.set(worldPos.x, worldPos.y, worldPos.z);
        }
        
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        pieceGroup.add(sphere);
      });
      
      sceneRef.current!.add(pieceGroup);
      pieceGroupsRef.current.set(piece.id, pieceGroup);
    });
    
    // Auto-orient solution after initial render (only if not already oriented)
    if (!isOrientedRef.current) {
      setTimeout(() => {
        centerAndOrientSolution();
      }, 100);
    }
    
  }, [solution, settings.pieceColors, settings.visiblePieceCount]);

  // Disable PBR service to prevent conflicts
  // useEffect(() => {
  //   if (sceneRef.current && rendererRef.current && !pbrServiceRef.current) {
  //     initializePBR();
  //   }
  // }, [sceneRef.current, rendererRef.current]);
  
  // Center and orient solution following the 8-step process
  const centerAndOrientSolution = () => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    
    
    // Step 1: Load solution - Get engine rhombohedral coordinates
    const allCells = solution.placements.flatMap(p => p.cells_ijk);
    
    if (allCells.length < 4) {
      centerAndOrientBasic();
      return;
    }
    
    
    try {
        
      // Step 2: Convert to world coordinates (using same approach as Puzzle Shape page)
      const fccCoords = allCells.map(cell => ({ x: cell[0], y: cell[1], z: cell[2] }));
      
      // Convert ALL engine coordinates to world space (no centering yet)
      const worldCoords = fccCoords.map(coord => fccToWorld(coord));
        
      // Find bounding box in WORLD space (same as Puzzle Shape page)
      const minX = Math.min(...worldCoords.map(w => w.x));
      const minY = Math.min(...worldCoords.map(w => w.y));
      const minZ = Math.min(...worldCoords.map(w => w.z));
      const maxX = Math.max(...worldCoords.map(w => w.x));
      const maxY = Math.max(...worldCoords.map(w => w.y));
      const maxZ = Math.max(...worldCoords.map(w => w.z));
      
      // Calculate center point in WORLD space
      const worldCenter = {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        z: (minZ + maxZ) / 2
      };
        
      // Apply centering in WORLD space (same as Puzzle Shape page)
      const worldPoints = worldCoords.map(worldPos => {
        // Round to 3 decimal places to avoid floating-point precision issues
        const centeredX = Math.round((worldPos.x - worldCenter.x) * 1000) / 1000;
        const centeredY = Math.round((worldPos.y - worldCenter.y) * 1000) / 1000;
        const centeredZ = Math.round((worldPos.z - worldCenter.z) * 1000) / 1000;
        
        return new THREE.Vector3(centeredX, centeredY, centeredZ);
      });
      
      // Store original world positions
      originalWorldPositionsRef.current = worldPoints;
        
      // Skip duplicate checking for performance - use all coordinates
        
      
      // Step 3: Use all world coordinates for hull (should produce ~10 faces)
        const hullAnalysis = analyzeConvexHull(worldPoints);
  
      // Collect debug data only if debug modal is open
      if (showDebugModal) {
        setDebugData({
          cellCount: allCells.length,
          engineCoords: allCells,
          worldCoords: worldPoints,
          hullInputCoords: worldPoints,
          hullFaces: hullAnalysis.faces
        });
      }
      
      // Step 4: Determine largest face
      const largestFace = hullAnalysis.largestFace;
      
      // Step 5: Determine center of largest face area (before transformation)
      const faceCenterBeforeTransform = largestFace.centroid.clone();
      
      // Step 6: Figure out orientation transformation (largest face -> XZ plane)
      const orientationMatrix = hullAnalysis.orientationMatrix;
      
      // Step 7: Orient world coordinates with transformation
      const orientedPositions = worldPoints.map(point => 
        point.clone().applyMatrix4(orientationMatrix)
      );
      
      // Store oriented positions as the new source of truth
      orientedWorldPositionsRef.current = orientedPositions;
      isOrientedRef.current = true;
      
      // Step 8: Apply same transformation to face center for camera pivot
      const transformedPivot = faceCenterBeforeTransform.clone().applyMatrix4(orientationMatrix);
      cameraPivotRef.current = transformedPivot;
      
      // Force re-render with oriented coordinates
      forceRerenderWithOrientedCoordinates();
      
      // Position camera using transformed pivot and oriented geometry
      const { position, target } = calculateOptimalCameraPosition(orientedPositions, cameraRef.current);
      
      // Set camera target to the transformed pivot point
      cameraRef.current.position.copy(position);
      controlsRef.current.target.copy(transformedPivot); // Use transformed pivot as target
      controlsRef.current.update();
      
        
    } catch (error) {
      console.error('🎯 Hull analysis failed, falling back to basic centering:', error);
      console.error('🎯 Error details:', error);
      centerAndOrientBasic();
    }
  };

  // Force re-render with oriented coordinates
  const forceRerenderWithOrientedCoordinates = () => {
    if (!sceneRef.current) return;
    
    
    // Clear existing pieces
    pieceGroupsRef.current.forEach((group) => {
      sceneRef.current!.remove(group);
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    pieceGroupsRef.current.clear();
    
    // Re-create pieces with oriented positions
    const pieceData = createPieceRenderData();
    const sphereRadius = calculateOptimalSphereRadius();
    
    pieceData.forEach((piece) => {
    const pieceGroup = new THREE.Group();
    pieceGroup.name = `piece_${piece.id}`;
    pieceGroup.visible = piece.visible;
    
    // Create material for this piece
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(piece.color),
      transparent: true,
      opacity: Math.max(0.1, 1.0 - settings.transparency),
      metalness: settings.metalness,
      roughness: 1.0 - settings.reflectiveness
    });
    
    // Create high-quality spheres for each cell in the piece
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 24); // High quality mesh
    
    piece.cells.forEach((cell, cellIndex) => {
      const sphere = new THREE.Mesh(sphereGeometry, material.clone());
      
      // Calculate global cell index to find the oriented position
      const allCells = solution.placements.flatMap(p => p.cells_ijk);
      const globalCellIndex = allCells.findIndex(c => c[0] === cell[0] && c[1] === cell[1] && c[2] === cell[2]);
      
      // Use oriented position if available, otherwise convert from engine coordinates
      if (isOrientedRef.current && orientedWorldPositionsRef.current.length > 0 && globalCellIndex >= 0 && globalCellIndex < orientedWorldPositionsRef.current.length) {
        // Use pre-computed oriented world position (Step 7 coordinates)
        sphere.position.copy(orientedWorldPositionsRef.current[globalCellIndex]);
      } else {
        // Fallback: convert from engine coordinates (Steps 1-2)
        const fccCoord = { x: cell[0], y: cell[1], z: cell[2] };
        const worldPos = fccToWorld(fccCoord);
        sphere.position.set(worldPos.x, worldPos.y, worldPos.z);
      }
      
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      pieceGroup.add(sphere);
    });
    
    sceneRef.current!.add(pieceGroup);
    pieceGroupsRef.current.set(piece.id, pieceGroup);
  });
  
  };

  // Basic centering fallback (original implementation)
  const centerAndOrientBasic = () => {
    console.log('🎯 Using basic centering approach...');
    
    // Get all cell positions
    const allCells = solution.placements.flatMap(p => p.cells_ijk);
    if (allCells.length === 0) return;
    
    // Convert arrays to FCCCoord objects and center
    const fccCoords = allCells.map(cell => ({ x: cell[0], y: cell[1], z: cell[2] }));
    const centeredCells = centerFCCCoords(fccCoords);
    const worldPoints = centeredCells.map(cell => {
      const worldPos = fccToWorld(cell);
      return new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
    });
    
    // Update piece positions with centered coordinates
    let cellIndex = 0;
    solution.placements.forEach((placement) => {
      const pieceGroup = pieceGroupsRef.current.get(placement.piece);
      if (pieceGroup) {
        placement.cells_ijk.forEach((_, i) => {
          const sphere = pieceGroup.children[i] as THREE.Mesh;
          if (sphere && cellIndex < worldPoints.length) {
            const worldPos = worldPoints[cellIndex];
            sphere.position.copy(worldPos);
            
          }
          cellIndex++;
        });
      }
    });
    
    // Calculate the actual center of the world points
    const actualCenter = new THREE.Vector3();
    worldPoints.forEach(point => actualCenter.add(point));
    actualCenter.divideScalar(worldPoints.length);
    
    // Calculate optimal camera position
    const { position, target } = calculateOptimalCameraPosition(worldPoints, cameraRef.current);
    
    console.log('📷 Camera positioning:', {
      cameraPosition: `(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`,
      cameraTarget: `(${target.x.toFixed(2)}, ${target.y.toFixed(2)}, ${target.z.toFixed(2)})`,
      actualCenter: `(${actualCenter.x.toFixed(2)}, ${actualCenter.y.toFixed(2)}, ${actualCenter.z.toFixed(2)})`,
      worldPointsCount: worldPoints.length,
      firstWorldPoint: worldPoints[0] ? `(${worldPoints[0].x.toFixed(2)}, ${worldPoints[0].y.toFixed(2)}, ${worldPoints[0].z.toFixed(2)})` : 'none'
    });
    
    // Animate camera to new position
    cameraRef.current.position.copy(position);
    controlsRef.current.target.copy(target);
    controlsRef.current.update();
    
    console.log('✅ Basic solution centering complete');
  };

  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    centerAndOrientSolution
  }), [solution]);
  
  return (
    <>
      <div 
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden'
        }}
      />
      <DebugModal
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        debugData={debugData}
      />
    </>
  );
});

SolutionEditor3D.displayName = 'SolutionEditor3D';

export default SolutionEditor3D;
