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
    const camera = settings.camera.orthographic
      ? new THREE.OrthographicCamera(-10 * aspect, 10 * aspect, 10, -10, 0.1, 1000)
      : new THREE.PerspectiveCamera(settings.camera.focalLength, aspect, 0.1, 1000);
    
    camera.position.set(10, 10, 10);
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
    
    // Render each piece
    pieceData.forEach((piece) => {
      const pieceGroup = new THREE.Group();
      pieceGroup.name = `piece_${piece.id}`;
      pieceGroup.visible = piece.visible;
      
      // Create material for this piece
      const material = new THREE.MeshLambertMaterial({
        color: new THREE.Color(piece.color),
        transparent: true,
        opacity: 0.9
      });
      
      // Create spheres for each cell in the piece
      const sphereGeometry = new THREE.SphereGeometry(0.4, 16, 12);
      
      piece.cells.forEach((cell) => {
        const sphere = new THREE.Mesh(sphereGeometry, material.clone());
        const worldPos = fccToWorld(cell);
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
    
    // Center the coordinates
    const centeredCells = centerFCCCoords(allCells);
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
