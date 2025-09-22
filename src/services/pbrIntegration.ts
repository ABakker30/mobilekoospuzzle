// PBR Integration Service
// Connects PBR materials system with ShapeEditor3D rendering

import * as THREE from 'three';
import { MaterialSettings } from '../components/shape/SettingsModal';
import { PBRAssetManager } from './pbrAssets';
import { PBR_PRESETS, HDR_ENVIRONMENTS, PBRMaterialConfig } from '../lib/materials/pbrPresets';

export interface PBRIntegrationState {
  currentMaterial: THREE.Material | null;
  currentEnvironment: THREE.Texture | null;
  isLoading: boolean;
  error?: string;
}

export class PBRIntegrationService {
  private static instance: PBRIntegrationService;
  private assetManager: PBRAssetManager;
  private scene: THREE.Scene | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  
  private state: PBRIntegrationState = {
    currentMaterial: null,
    currentEnvironment: null,
    isLoading: false
  };
  
  private listeners = new Set<(state: PBRIntegrationState) => void>();
  
  private constructor() {
    this.assetManager = PBRAssetManager.getInstance();
  }
  
  static getInstance(): PBRIntegrationService {
    if (!PBRIntegrationService.instance) {
      PBRIntegrationService.instance = new PBRIntegrationService();
    }
    return PBRIntegrationService.instance;
  }
  
  // Initialize with Three.js scene and renderer
  initialize(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
    this.scene = scene;
    this.renderer = renderer;
    this.assetManager.initialize(renderer);
    
    console.log('🎨 PBR Integration Service initialized');
  }
  
  // Event system for state updates
  onStateChange(callback: (state: PBRIntegrationState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  private updateState(updates: Partial<PBRIntegrationState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(callback => callback(this.state));
  }
  
  // Create material from settings
  async createMaterialFromSettings(settings: MaterialSettings): Promise<THREE.Material> {
    console.log('🎨 Creating material from settings:', settings);
    
    this.updateState({ isLoading: true, error: undefined });
    
    try {
      // Check if this is a PBR material
      if (settings.type?.startsWith('pbr_') && settings.preset) {
        return await this.createPBRMaterial(settings);
      } else {
        return await this.createLegacyMaterial(settings);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Material creation failed';
      console.error('🎨 Material creation failed:', error);
      this.updateState({ isLoading: false, error: errorMessage });
      
      // Fallback to basic material
      return this.createFallbackMaterial(settings);
    }
  }
  
  // Create PBR material with full features
  private async createPBRMaterial(settings: MaterialSettings): Promise<THREE.Material> {
    console.log('🎨 Creating PBR material:', settings.preset);
    
    const presetConfig = PBR_PRESETS[settings.preset!];
    if (!presetConfig) {
      throw new Error(`PBR preset not found: ${settings.preset}`);
    }
    
    // Load HDR environment if needed
    let hdrEnvironment: THREE.Texture | null = null;
    if (settings.useHDR) {
      hdrEnvironment = await this.loadHDREnvironment(settings.hdrEnvironment || 'studio');
    }
    
    // Create base material parameters
    const baseParams: any = {
      color: new THREE.Color(settings.color),
      metalness: settings.metalness,
      roughness: settings.roughness || presetConfig.roughness,
    };
    
    // Add HDR environment
    if (hdrEnvironment) {
      baseParams.envMap = hdrEnvironment;
      baseParams.envMapIntensity = settings.hdrIntensity || 1.0;
      
      // Update scene environment for global reflections
      if (this.scene) {
        this.scene.environment = hdrEnvironment;
        console.log('🌟 Scene environment updated with HDR');
      }
    }
    
    // Load textures
    if (presetConfig.normalMapPath) {
      try {
        baseParams.normalMap = await this.assetManager.loadTexture(presetConfig.normalMapPath);
        baseParams.normalScale = new THREE.Vector2(0.3, 0.3);
      } catch (err) {
        console.warn('🎨 Failed to load normal map:', err);
      }
    }
    
    // Create material based on type
    let material: THREE.Material;
    
    if (presetConfig.type === 'physical') {
      material = new THREE.MeshPhysicalMaterial(baseParams);
      const physicalMaterial = material as THREE.MeshPhysicalMaterial;
      
      // Add clearcoat
      if (settings.clearcoat !== undefined) {
        physicalMaterial.clearcoat = settings.clearcoat;
        physicalMaterial.clearcoatRoughness = settings.clearcoatRoughness || 0.1;
        
        if (presetConfig.clearcoatNormalMapPath) {
          try {
            physicalMaterial.clearcoatNormalMap = await this.assetManager.loadTexture(presetConfig.clearcoatNormalMapPath);
            physicalMaterial.clearcoatNormalScale = new THREE.Vector2(0.5, 0.5);
          } catch (err) {
            console.warn('🎨 Failed to load clearcoat normal map:', err);
          }
        }
      }
      
      // Add anisotropy
      if (settings.anisotropy !== undefined) {
        physicalMaterial.anisotropy = settings.anisotropy;
        
        if (presetConfig.anisotropyMapPath) {
          try {
            physicalMaterial.anisotropyMap = await this.assetManager.loadTexture(presetConfig.anisotropyMapPath);
          } catch (err) {
            console.warn('🎨 Failed to load anisotropy map:', err);
          }
        }
      }
      
      console.log('🎨 Created MeshPhysicalMaterial with PBR features');
    } else {
      material = new THREE.MeshStandardMaterial(baseParams);
      console.log('🎨 Created MeshStandardMaterial with PBR features');
    }
    
    // Apply transparency
    if (settings.transparency > 0) {
      material.transparent = true;
      material.opacity = 1 - settings.transparency;
    }
    
    this.updateState({ 
      currentMaterial: material, 
      currentEnvironment: hdrEnvironment,
      isLoading: false 
    });
    
    return material;
  }
  
  // Create legacy material (backward compatibility)
  private async createLegacyMaterial(settings: MaterialSettings): Promise<THREE.Material> {
    console.log('🎨 Creating legacy material:', settings.type);
    
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(settings.color),
      metalness: settings.metalness,
      roughness: 1 - settings.reflectiveness, // Convert reflectiveness to roughness
      transparent: settings.transparency > 0,
      opacity: settings.transparency > 0 ? 1 - settings.transparency : 1
    });
    
    // Add basic environment mapping even for legacy materials if HDR is enabled
    let hdrEnvironment: THREE.Texture | null = null;
    if (settings.useHDR) {
      try {
        hdrEnvironment = await this.loadHDREnvironment(settings.hdrEnvironment || 'studio');
        material.envMap = hdrEnvironment;
        material.envMapIntensity = settings.hdrIntensity || 1.0;
        
        // Update scene environment
        if (this.scene) {
          this.scene.environment = hdrEnvironment;
          console.log('🌟 Scene environment updated for legacy material');
        }
      } catch (error) {
        console.warn('🎨 Failed to load HDR for legacy material:', error);
      }
    }
    
    this.updateState({ 
      currentMaterial: material,
      currentEnvironment: hdrEnvironment,
      isLoading: false 
    });
    
    return material;
  }
  
  // Fallback material for errors
  private createFallbackMaterial(settings: MaterialSettings): THREE.Material {
    console.log('🎨 Creating fallback material');
    
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(settings.color),
      transparent: settings.transparency > 0,
      opacity: settings.transparency > 0 ? 1 - settings.transparency : 1
    });
    
    this.updateState({ 
      currentMaterial: material,
      currentEnvironment: null,
      isLoading: false 
    });
    
    return material;
  }
  
  // Load HDR environment with fallback
  private async loadHDREnvironment(environmentKey: string): Promise<THREE.Texture> {
    const envConfig = HDR_ENVIRONMENTS[environmentKey];
    if (!envConfig) {
      throw new Error(`HDR environment not found: ${environmentKey}`);
    }
    
    console.log('🌟 Loading HDR environment:', envConfig.name);
    
    try {
      // Try to load real HDR files
      const { lowRes, highRes } = await this.assetManager.loadHDREnvironment(
        envConfig.lowResPath,
        envConfig.highResPath,
        envConfig.intensity
      );
      
      // Return high-res if available, otherwise low-res
      return highRes || lowRes;
    } catch (error) {
      console.warn('🌟 HDR files not found, creating procedural environment:', error);
      
      // Create procedural HDR environment as fallback
      return this.createProceduralHDREnvironment(environmentKey);
    }
  }
  
  // Create procedural HDR environment when real files aren't available
  private createProceduralHDREnvironment(environmentKey: string): THREE.Texture {
    console.log('🌟 Creating procedural HDR environment for:', environmentKey);
    
    if (!this.renderer) {
      throw new Error('Renderer not available for procedural HDR creation');
    }
    
    // Create a simple gradient environment map
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Create gradient based on environment type
    let gradient: CanvasGradient;
    
    switch (environmentKey) {
      case 'studio':
        // Neutral studio lighting - gray to white gradient
        gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.7, '#cccccc');
        gradient.addColorStop(1, '#888888');
        break;
        
      case 'outdoor':
        // Sky blue gradient
        gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#98D8E8');
        gradient.addColorStop(1, '#B0E0E6');
        break;
        
      case 'sunset':
        // Warm sunset gradient
        gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FF8C00');
        gradient.addColorStop(1, '#FF6347');
        break;
        
      default:
        // Default neutral gradient
        gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#cccccc');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    
    // Process with PMREM generator for proper PBR
    const pmremGenerator = this.assetManager.getPMREMGenerator();
    if (pmremGenerator) {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      texture.dispose(); // Clean up original
      
      console.log('🌟 Procedural HDR environment created and processed');
      return envMap;
    }
    
    console.log('🌟 Procedural HDR environment created (basic)');
    return texture;
  }
  
  // Update existing material with new settings
  async updateMaterial(material: THREE.Material, settings: MaterialSettings): Promise<void> {
    console.log('🎨 Updating existing material with new settings');
    
    // For now, create a new material (could be optimized to update in-place)
    const newMaterial = await this.createMaterialFromSettings(settings);
    
    // Copy properties from new material to existing material
    if (material instanceof THREE.MeshStandardMaterial && newMaterial instanceof THREE.MeshStandardMaterial) {
      material.color.copy(newMaterial.color);
      material.metalness = newMaterial.metalness;
      material.roughness = newMaterial.roughness;
      material.transparent = newMaterial.transparent;
      material.opacity = newMaterial.opacity;
      material.envMap = newMaterial.envMap;
      material.envMapIntensity = newMaterial.envMapIntensity;
      material.normalMap = newMaterial.normalMap;
      material.normalScale = newMaterial.normalScale;
      
      // Handle MeshPhysicalMaterial properties
      if (material instanceof THREE.MeshPhysicalMaterial && newMaterial instanceof THREE.MeshPhysicalMaterial) {
        material.clearcoat = newMaterial.clearcoat;
        material.clearcoatRoughness = newMaterial.clearcoatRoughness;
        material.clearcoatNormalMap = newMaterial.clearcoatNormalMap;
        material.clearcoatNormalScale = newMaterial.clearcoatNormalScale;
        material.anisotropy = newMaterial.anisotropy;
        material.anisotropyMap = newMaterial.anisotropyMap;
      }
      
      material.needsUpdate = true;
      console.log('🎨 Material updated in-place');
    }
    
    // Dispose of the temporary new material
    newMaterial.dispose();
  }
  
  // Get current state
  getState(): PBRIntegrationState {
    return { ...this.state };
  }
  
  // Dispose resources
  dispose(): void {
    if (this.state.currentMaterial) {
      this.state.currentMaterial.dispose();
    }
    
    if (this.state.currentEnvironment) {
      this.state.currentEnvironment.dispose();
    }
    
    this.assetManager.dispose();
    this.listeners.clear();
    
    console.log('🎨 PBR Integration Service disposed');
  }
}
