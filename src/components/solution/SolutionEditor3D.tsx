// Solution Editor 3D Component
// 3D rendering for puzzle solutions with piece-based materials and visibility

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SolutionFile, SolutionSettings, PieceRenderData } from '../../types/solution';
import { fccToWorld, centerFCCCoords } from '../../lib/coords/fcc';
import { calculateOptimalCameraPosition } from '../../lib/geometry/hull';

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
  const pieceGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  
  console.log('🧩 SolutionEditor3D render:', {
    pieces: Object.keys(solution.piecesUsed).length,
    placements: solution.placements.length,
    visibleCount: settings.visiblePieceCount
  });
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    console.log('🧩 Initializing Solution 3D scene...');
    
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
    
    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4 * settings.brightness);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8 * settings.brightness);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
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
    
    console.log('✅ Solution 3D scene initialized');
    
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
  
  // Update lighting brightness
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.traverse((child) => {
        if (child instanceof THREE.AmbientLight) {
          child.intensity = 0.4 * settings.brightness;
        } else if (child instanceof THREE.DirectionalLight) {
          child.intensity = 0.8 * settings.brightness;
        }
      });
    }
  }, [settings.brightness]);

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
    console.log('📏 Calculated sphere radius:', {
      minWorldDistance: minDistance,
      sphereRadius: radius
    });
    
    return radius;
  };

  // Create piece render data
  const createPieceRenderData = (): PieceRenderData[] => {
    const pieceOrder = Object.keys(solution.piecesUsed).sort();
    
    return solution.placements.map((placement, index) => ({
      id: placement.piece,
      color: settings.pieceColors[placement.piece] || '#888888',
      visible: index < settings.visiblePieceCount,
      cells: placement.cells_ijk
    }));
  };
  
  // Render solution pieces
  useEffect(() => {
    if (!sceneRef.current) return;
    
    console.log('🧩 Rendering solution pieces...');
    
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
    
    // Render each piece
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
        
        // Convert array [i,j,k] to FCCCoord object {x,y,z}
        const fccCoord = { x: cell[0], y: cell[1], z: cell[2] };
        const worldPos = fccToWorld(fccCoord);
        
        sphere.position.set(worldPos.x, worldPos.y, worldPos.z);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        pieceGroup.add(sphere);
      });
      
      sceneRef.current!.add(pieceGroup);
      pieceGroupsRef.current.set(piece.id, pieceGroup);
    });
    
    console.log('✅ Solution pieces rendered:', {
      totalPieces: pieceData.length,
      visiblePieces: pieceData.filter(p => p.visible).length
    });
    
  }, [solution, settings.pieceColors, settings.visiblePieceCount]);
  
  // Center and orient solution
  const centerAndOrientSolution = () => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    
    console.log('🎯 Centering and orienting solution...');
    
    // Get all cell positions
    const allCells = solution.placements.flatMap(p => p.cells_ijk);
    
    if (allCells.length === 0) return;
    
    // Convert arrays to FCCCoord objects and center
    const fccCoords = allCells.map(cell => ({ x: cell[0], y: cell[1], z: cell[2] }));
    const centeredCells = centerFCCCoords(fccCoords);
    const worldPoints = centeredCells.map(cell => fccToWorld(cell));
    
    // Update piece positions with centered coordinates
    let cellIndex = 0;
    solution.placements.forEach((placement) => {
      const pieceGroup = pieceGroupsRef.current.get(placement.piece);
      if (pieceGroup) {
        placement.cells_ijk.forEach((_, i) => {
          const sphere = pieceGroup.children[i] as THREE.Mesh;
          if (sphere) {
            const worldPos = worldPoints[cellIndex];
            sphere.position.set(worldPos.x, worldPos.y, worldPos.z);
          }
          cellIndex++;
        });
      }
    });
    
    // Calculate optimal camera position
    const { position, target } = calculateOptimalCameraPosition(worldPoints, cameraRef.current);
    
    // Animate camera to new position
    cameraRef.current.position.copy(position);
    controlsRef.current.target.copy(target);
    controlsRef.current.update();
    
    console.log('✅ Solution centered and oriented');
  };
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    centerAndOrientSolution
  }), [solution]);
  
  return (
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
  );
});

SolutionEditor3D.displayName = 'SolutionEditor3D';

export default SolutionEditor3D;
