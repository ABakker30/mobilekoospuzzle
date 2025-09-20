// UI-only port; engines remain upstream.
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FCCCoord, fccToWorld, worldToFCC, snapToFCCLattice, isValidFCCCoord, getFCCNeighbors, centerFCCCoords } from '../../lib/coords/fcc';
import { AppSettings } from './SettingsModal';

interface ShapeEditor3DProps {
  coordinates: FCCCoord[];
  settings: AppSettings;
  editMode: 'add' | 'delete';
  onCoordinatesChange: (coords: FCCCoord[]) => void;
}

export default function ShapeEditor3D({
  coordinates,
  settings,
  editMode,
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
  // isDragging state removed - using OrbitControls now

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

  // Update spheres when coordinates change
  useEffect(() => {
    console.log(`ShapeEditor3D [${instanceId.current}]: Spheres effect triggered`, {
      hasScene: !!sceneRef.current,
      hasCamera: !!cameraRef.current,
      hasControls: !!controlsRef.current,
      coordinatesLength: coordinates.length
    });
    
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) {
      console.log(`ShapeEditor3D [${instanceId.current}]: Missing refs, skipping sphere update`);
      return;
    }

    console.log(`ShapeEditor3D [${instanceId.current}]: Updating spheres, coordinates:`, coordinates.length);

    // Remove existing spheres
    spheresRef.current.forEach(sphere => {
      sceneRef.current!.remove(sphere);
      sphere.geometry.dispose();
      (sphere.material as THREE.Material).dispose();
    });
    spheresRef.current = [];

    if (coordinates.length === 0) return;

    // Center coordinates for better viewing
    const centeredCoords = centerFCCCoords(coordinates);
    console.log('ShapeEditor3D: Centered coordinates:', centeredCoords);
    
    // Add new spheres - higher quality with reflective material
    const geometry = new THREE.SphereGeometry(0.28, 32, 24); // Radius adjusted so spheres just touch
    
    centeredCoords.forEach((coord, index) => {
      const worldPos = fccToWorld(coord);
      console.log(`ShapeEditor3D: FCC ${coord.x},${coord.y},${coord.z} -> World ${worldPos.x.toFixed(2)},${worldPos.y.toFixed(2)},${worldPos.z.toFixed(2)}`);
      
      // Create material based on current settings using StandardMaterial for proper PBR
      const material = new THREE.MeshStandardMaterial({ 
        color: parseInt(settings.material.color.replace('#', '0x')),
        transparent: settings.material.transparency > 0,
        opacity: 1 - settings.material.transparency,
        metalness: settings.material.metalness,
        roughness: 1 - settings.material.reflectiveness // Inverse relationship
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(worldPos.x, worldPos.y, worldPos.z);
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      
      // Store original FCC coordinates for click detection
      (sphere as any).fccCoord = coordinates[index];
      
      sceneRef.current!.add(sphere);
      spheresRef.current.push(sphere);
    });

    // Auto-fit camera to view all spheres
    if (centeredCoords.length > 0) {
      const worldPositions = centeredCoords.map(fccToWorld);
      const box = new THREE.Box3();
      worldPositions.forEach(pos => {
        box.expandByPoint(new THREE.Vector3(pos.x, pos.y, pos.z));
      });
      
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // Position camera to view all spheres using OrbitControls
      const distance = Math.max(maxDim * 3.0, 5.0); // Ensure minimum distance
      const cameraPos = {
        x: center.x + distance * 0.7,
        y: center.y + distance * 0.7,
        z: center.z + distance * 0.7
      };
      
      console.log('ShapeEditor3D: Camera positioned at:', 
        `(${cameraPos.x.toFixed(2)}, ${cameraPos.y.toFixed(2)}, ${cameraPos.z.toFixed(2)})`,
        'looking at:', 
        `(${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`,
        'distance:', distance.toFixed(2));
      
      // Update camera and controls target
      cameraRef.current.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
      controlsRef.current!.target.copy(center);
      controlsRef.current!.update();
    } else {
      // Fallback camera position if no coordinates
      console.log('ShapeEditor3D: Using fallback camera position');
      cameraRef.current.position.set(8, 8, 8);
      controlsRef.current!.target.set(0, 0, 0);
      controlsRef.current!.update();
    }
  }, [coordinates]);

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
  }, [settings]);

  // Pointer event handlers removed - using OrbitControls for camera interaction
  // Add/delete functionality will be implemented later with proper click detection

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f0f0f0'
      }}
    />
  );
}
