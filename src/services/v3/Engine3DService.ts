// V3 Engine3D Service - Clean Three.js abstraction
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CellRecord } from './CoordinateService';

export interface RenderSettings {
  backgroundColor: string;
  brightness: number;
  metalness: number;
  roughness: number;
  shadowIntensity: number;
}

export interface CameraSettings {
  fov: number;
  isPerspective: boolean;
}

export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
}

export interface IEngine3DService {
  createScene(container: HTMLElement): SceneSetup;
  setupLighting(scene: THREE.Scene, settings: RenderSettings): void;
  createShapeMeshes(records: CellRecord[], settings: RenderSettings, sphereRadius: number): THREE.Mesh[];
  createNeighborMeshes(neighbors: THREE.Vector3[]): THREE.Mesh[];
  updateMaterial(meshes: THREE.Mesh[], settings: RenderSettings): void;
  dispose(setup: SceneSetup): void;
}

export class Engine3DService implements IEngine3DService {
  
  createScene(container: HTMLElement): SceneSetup {
    // Scene
    const scene = new THREE.Scene();
    
    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(5, 5, 5);
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    
    container.appendChild(renderer.domElement);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    return { scene, camera, renderer, controls };
  }

  setupLighting(scene: THREE.Scene, settings: RenderSettings): void {
    // Clear existing lights
    const lights = scene.children.filter(child => child instanceof THREE.Light);
    lights.forEach(light => scene.remove(light));
    
    // Use the same lighting setup as V1 Shape Editor (proven to work well)
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6 * settings.brightness);
    scene.add(ambientLight);
    
    // Main directional light (top-front)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8 * settings.brightness);
    (mainLight as any).position.set(10, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    (mainLight.shadow.camera as any).near = 0.5;
    (mainLight.shadow.camera as any).far = 50;
    scene.add(mainLight);
    
    // Fill light (back-left)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4 * settings.brightness);
    (fillLight as any).position.set(-8, 5, -8);
    scene.add(fillLight);
    
    // Rim light (right side)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3 * settings.brightness);
    (rimLight as any).position.set(8, 2, -5);
    scene.add(rimLight);
    
    // Bottom light (subtle upward illumination)
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.2 * settings.brightness);
    (bottomLight as any).position.set(0, -10, 0);
    scene.add(bottomLight);
    
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0; // Move ground plane to Y=0 where shapes rest
    ground.receiveShadow = true;
    scene.add(ground);
  }

  createShapeMeshes(records: CellRecord[], settings: RenderSettings, sphereRadius: number): THREE.Mesh[] {
    const geometry = new THREE.SphereGeometry(sphereRadius, 32, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      metalness: settings.metalness,
      roughness: settings.roughness,
    });
    
    return records.map(record => {
      const mesh = new THREE.Mesh(geometry, material.clone());
      mesh.position.copy(record.worldCoord);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { engineCoord: record.engineCoord };
      return mesh;
    });
  }

  createNeighborMeshes(neighbors: THREE.Vector3[]): THREE.Mesh[] {
    const geometry = new THREE.SphereGeometry(0.2, 16, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.7
    });
    
    return neighbors.map(pos => {
      const mesh = new THREE.Mesh(geometry, material.clone());
      mesh.position.copy(pos);
      return mesh;
    });
  }


  updateMaterial(meshes: THREE.Mesh[], settings: RenderSettings): void {
    meshes.forEach(mesh => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.metalness = settings.metalness;
        mesh.material.roughness = settings.roughness;
        mesh.material.needsUpdate = true;
      }
    });
  }

  dispose(setup: SceneSetup): void {
    // Dispose geometries and materials
    setup.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
    
    // Dispose renderer
    setup.renderer.dispose();
    
    // Remove DOM element
    if (setup.renderer.domElement.parentNode) {
      setup.renderer.domElement.parentNode.removeChild(setup.renderer.domElement);
    }
    
    // Dispose controls
    setup.controls.dispose();
  }
}

export const engine3DService = new Engine3DService();
