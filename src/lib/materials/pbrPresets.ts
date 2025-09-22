// PBR Material Presets System
// Professional physically-based rendering materials for mobile 3D editing

import * as THREE from 'three';

export interface PBRMaterialConfig {
  name: string;
  description: string;
  type: 'standard' | 'physical';
  
  // Base PBR properties
  color: number;
  metalness: number;
  roughness: number;
  
  // Advanced properties (MeshPhysicalMaterial)
  clearcoat?: number;
  clearcoatRoughness?: number;
  anisotropy?: number;
  
  // Asset requirements
  requiresHDR: boolean;
  normalMapPath?: string;
  clearcoatNormalMapPath?: string;
  anisotropyMapPath?: string;
  
  // UI properties
  thumbnail?: string;
  category: 'metal' | 'custom';
}

export interface HDREnvironment {
  name: string;
  lowResPath: string;   // ~500KB for fast startup
  highResPath: string;  // ~4MB for quality
  intensity: number;
}

// Studio HDR environment for realistic metal reflections
export const STUDIO_HDR: HDREnvironment = {
  name: 'Studio Lighting',
  lowResPath: '/assets/hdri/studio_1k.hdr',
  highResPath: '/assets/hdri/studio_4k.hdr',
  intensity: 1.0
};

// Professional PBR material presets
export const PBR_PRESETS: Record<string, PBRMaterialConfig> = {
  gold: {
    name: 'Gold',
    description: 'Polished gold with subtle micro-scratches',
    type: 'physical',
    color: 0xD4AF37, // Classic gold color
    metalness: 1.0,
    roughness: 0.22,
    clearcoat: 0.6,
    clearcoatRoughness: 0.18,
    requiresHDR: true,
    clearcoatNormalMapPath: '/assets/textures/micro_scratches_normal.jpg',
    thumbnail: '/assets/thumbnails/gold.jpg',
    category: 'metal'
  },
  
  stainlessSteel: {
    name: 'Stainless Steel',
    description: 'Mirror-polished stainless steel with fine scratches',
    type: 'standard',
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.03,
    requiresHDR: true,
    normalMapPath: '/assets/textures/steel_scratches_normal.jpg',
    thumbnail: '/assets/thumbnails/steel.jpg',
    category: 'metal'
  },
  
  brushedSteel: {
    name: 'Brushed Steel',
    description: 'Directionally brushed stainless steel',
    type: 'physical',
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.25,
    anisotropy: 0.9,
    requiresHDR: true,
    anisotropyMapPath: '/assets/textures/brushed_anisotropy.jpg',
    thumbnail: '/assets/thumbnails/brushed_steel.jpg',
    category: 'metal'
  }
};

// Current material settings extended for PBR
export interface ExtendedMaterialSettings {
  // Existing properties (backward compatibility)
  type: 'basic' | 'standard' | 'physical';
  color: number;
  metalness: number;
  transparency: number;
  reflectiveness: number;
  
  // New PBR properties
  preset?: string; // Key from PBR_PRESETS
  roughness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  anisotropy?: number;
  
  // Environment settings
  useHDR: boolean;
  hdrIntensity: number;
}

// Default settings with PBR support
export const DEFAULT_PBR_SETTINGS: ExtendedMaterialSettings = {
  type: 'standard',
  color: 0x4a90e2,
  metalness: 0.0,
  transparency: 0.0,
  reflectiveness: 0.5,
  roughness: 0.5,
  useHDR: false,
  hdrIntensity: 1.0
};

// Utility functions for material creation
export class PBRMaterialFactory {
  private static hdrEnvironment: THREE.Texture | null = null;
  private static pmremGenerator: THREE.PMREMGenerator | null = null;
  private static textureCache = new Map<string, THREE.Texture>();
  
  static async initializeHDR(renderer: THREE.WebGLRenderer): Promise<void> {
    if (!this.pmremGenerator) {
      this.pmremGenerator = new THREE.PMREMGenerator(renderer);
      this.pmremGenerator.compileEquirectangularShader();
    }
  }
  
  static async loadHDREnvironment(hdrConfig: HDREnvironment, highQuality = false): Promise<THREE.Texture> {
    const path = highQuality ? hdrConfig.highResPath : hdrConfig.lowResPath;
    
    if (this.hdrEnvironment && this.hdrEnvironment.userData.path === path) {
      return this.hdrEnvironment;
    }
    
    console.log(`🌟 PBR: Loading HDR environment (${highQuality ? 'high' : 'low'} quality)...`);
    
    return new Promise((resolve, reject) => {
      const loader = new THREE.RGBELoader();
      loader.load(
        path,
        (texture) => {
          if (this.pmremGenerator) {
            const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
            envMap.userData.path = path;
            this.hdrEnvironment = envMap;
            texture.dispose(); // Clean up original
            console.log(`🌟 PBR: HDR environment loaded successfully`);
            resolve(envMap);
          } else {
            reject(new Error('PMREMGenerator not initialized'));
          }
        },
        (progress) => {
          console.log(`🌟 PBR: HDR loading progress: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
        },
        (error) => {
          console.error('🌟 PBR: Failed to load HDR environment:', error);
          reject(error);
        }
      );
    });
  }
  
  static async loadTexture(path: string): Promise<THREE.Texture> {
    if (this.textureCache.has(path)) {
      return this.textureCache.get(path)!;
    }
    
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        path,
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          this.textureCache.set(path, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }
  
  static async createMaterial(
    config: PBRMaterialConfig, 
    settings: ExtendedMaterialSettings,
    hdrEnvironment?: THREE.Texture
  ): Promise<THREE.Material> {
    console.log(`🎨 PBR: Creating ${config.name} material...`);
    
    const baseParams: any = {
      color: new THREE.Color(config.color),
      metalness: config.metalness,
      roughness: config.roughness,
    };
    
    // Add HDR environment if available
    if (hdrEnvironment && config.requiresHDR) {
      baseParams.envMap = hdrEnvironment;
      baseParams.envMapIntensity = settings.hdrIntensity;
    }
    
    // Load and apply textures
    if (config.normalMapPath) {
      try {
        baseParams.normalMap = await this.loadTexture(config.normalMapPath);
        baseParams.normalScale = new THREE.Vector2(0.3, 0.3);
      } catch (err) {
        console.warn(`🎨 PBR: Failed to load normal map for ${config.name}:`, err);
      }
    }
    
    // Create material based on type
    if (config.type === 'physical') {
      const material = new THREE.MeshPhysicalMaterial(baseParams);
      
      // Add clearcoat properties
      if (config.clearcoat !== undefined) {
        material.clearcoat = config.clearcoat;
        material.clearcoatRoughness = config.clearcoatRoughness || 0.1;
        
        if (config.clearcoatNormalMapPath) {
          try {
            material.clearcoatNormalMap = await this.loadTexture(config.clearcoatNormalMapPath);
            material.clearcoatNormalScale = new THREE.Vector2(0.5, 0.5);
          } catch (err) {
            console.warn(`🎨 PBR: Failed to load clearcoat normal map for ${config.name}:`, err);
          }
        }
      }
      
      // Add anisotropy properties
      if (config.anisotropy !== undefined) {
        material.anisotropy = config.anisotropy;
        
        if (config.anisotropyMapPath) {
          try {
            material.anisotropyMap = await this.loadTexture(config.anisotropyMapPath);
          } catch (err) {
            console.warn(`🎨 PBR: Failed to load anisotropy map for ${config.name}:`, err);
          }
        }
      }
      
      console.log(`🎨 PBR: Created MeshPhysicalMaterial for ${config.name}`);
      return material;
    } else {
      const material = new THREE.MeshStandardMaterial(baseParams);
      console.log(`🎨 PBR: Created MeshStandardMaterial for ${config.name}`);
      return material;
    }
  }
  
  static dispose(): void {
    // Clean up resources
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
      this.pmremGenerator = null;
    }
    
    if (this.hdrEnvironment) {
      this.hdrEnvironment.dispose();
      this.hdrEnvironment = null;
    }
    
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
    
    console.log('🎨 PBR: Resources disposed');
  }
}
