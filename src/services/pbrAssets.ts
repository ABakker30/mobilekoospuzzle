// PBR Asset Management System
// Handles progressive loading of HDR environments and texture maps

import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export interface AssetLoadingState {
  isLoading: boolean;
  progress: number;
  error?: string;
  loadedAssets: Set<string>;
}

export class PBRAssetManager {
  private static instance: PBRAssetManager;
  private pmremGenerator: THREE.PMREMGenerator | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  
  // Asset caches
  private hdrCache = new Map<string, THREE.Texture>();
  private textureCache = new Map<string, THREE.Texture>();
  
  // Loading state
  private loadingState: AssetLoadingState = {
    isLoading: false,
    progress: 0,
    loadedAssets: new Set()
  };
  
  // Event system for loading updates
  private listeners = new Set<(state: AssetLoadingState) => void>();
  
  private constructor() {}
  
  static getInstance(): PBRAssetManager {
    if (!PBRAssetManager.instance) {
      PBRAssetManager.instance = new PBRAssetManager();
    }
    return PBRAssetManager.instance;
  }
  
  initialize(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();
    console.log('🎨 PBR Asset Manager initialized');
  }
  
  // Event system for loading state updates
  onLoadingStateChange(callback: (state: AssetLoadingState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  private updateLoadingState(updates: Partial<AssetLoadingState>): void {
    this.loadingState = { ...this.loadingState, ...updates };
    this.listeners.forEach(callback => callback(this.loadingState));
  }
  
  // HDR Environment Loading with Progressive Enhancement
  async loadHDREnvironment(
    lowResPath: string, 
    highResPath: string, 
    intensity: number = 1.0
  ): Promise<{ lowRes: THREE.Texture; highRes?: THREE.Texture }> {
    console.log('🌟 PBR: Starting HDR environment loading...');
    
    if (!this.pmremGenerator) {
      throw new Error('PBR Asset Manager not initialized');
    }
    
    this.updateLoadingState({ isLoading: true, progress: 0, error: undefined });
    
    try {
      // Step 1: Load low-res version first (fast startup)
      console.log('🌟 PBR: Loading low-res HDR for fast startup...');
      const lowRes = await this.loadSingleHDR(lowResPath, intensity);
      this.updateLoadingState({ progress: 50 });
      
      // Step 2: Load high-res version in background
      console.log('🌟 PBR: Loading high-res HDR for quality...');
      let highRes: THREE.Texture | undefined;
      
      try {
        highRes = await this.loadSingleHDR(highResPath, intensity);
        this.updateLoadingState({ progress: 100 });
        console.log('🌟 PBR: Both HDR versions loaded successfully');
      } catch (err) {
        console.warn('🌟 PBR: High-res HDR failed, using low-res only:', err);
        this.updateLoadingState({ progress: 100 });
      }
      
      this.updateLoadingState({ isLoading: false });
      return { lowRes, highRes };
      
    } catch (error) {
      console.error('🌟 PBR: HDR loading failed:', error);
      this.updateLoadingState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'HDR loading failed' 
      });
      throw error;
    }
  }
  
  private async loadSingleHDR(path: string, intensity: number): Promise<THREE.Texture> {
    // Check cache first
    const cacheKey = `${path}_${intensity}`;
    if (this.hdrCache.has(cacheKey)) {
      console.log(`🌟 PBR: Using cached HDR: ${path}`);
      return this.hdrCache.get(cacheKey)!;
    }
    
    return new Promise((resolve, reject) => {
      const loader = new RGBELoader();
      
      loader.load(
        path,
        (texture) => {
          if (!this.pmremGenerator) {
            reject(new Error('PMREMGenerator not available'));
            return;
          }
          
          try {
            // Process HDR for PBR
            const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
            envMap.userData = { path, intensity };
            
            // Cache the processed environment map
            this.hdrCache.set(cacheKey, envMap);
            this.loadingState.loadedAssets.add(path);
            
            // Clean up original texture
            texture.dispose();
            
            console.log(`🌟 PBR: HDR processed and cached: ${path}`);
            resolve(envMap);
          } catch (err) {
            console.error(`🌟 PBR: HDR processing failed for ${path}:`, err);
            reject(err);
          }
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`🌟 PBR: HDR loading progress (${path}): ${percent.toFixed(1)}%`);
          }
        },
        (error) => {
          console.error(`🌟 PBR: HDR loading failed for ${path}:`, error);
          reject(error);
        }
      );
    });
  }
  
  // Texture Loading (normal maps, anisotropy maps, etc.)
  async loadTexture(path: string, options: {
    wrapS?: THREE.Wrapping;
    wrapT?: THREE.Wrapping;
    repeat?: [number, number];
    flipY?: boolean;
  } = {}): Promise<THREE.Texture> {
    // Check cache first
    if (this.textureCache.has(path)) {
      console.log(`🎨 PBR: Using cached texture: ${path}`);
      return this.textureCache.get(path)!;
    }
    
    console.log(`🎨 PBR: Loading texture: ${path}`);
    
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      
      loader.load(
        path,
        (texture) => {
          // Apply options
          texture.wrapS = options.wrapS || THREE.RepeatWrapping;
          texture.wrapT = options.wrapT || THREE.RepeatWrapping;
          
          if (options.repeat) {
            texture.repeat.set(options.repeat[0], options.repeat[1]);
          }
          
          if (options.flipY !== undefined) {
            texture.flipY = options.flipY;
          }
          
          // Cache the texture
          this.textureCache.set(path, texture);
          this.loadingState.loadedAssets.add(path);
          
          console.log(`🎨 PBR: Texture loaded and cached: ${path}`);
          resolve(texture);
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`🎨 PBR: Texture loading progress (${path}): ${percent.toFixed(1)}%`);
          }
        },
        (error) => {
          console.error(`🎨 PBR: Texture loading failed for ${path}:`, error);
          reject(error);
        }
      );
    });
  }
  
  // Preload critical assets for better UX
  async preloadCriticalAssets(): Promise<void> {
    console.log('🎨 PBR: Preloading critical assets...');
    
    const criticalAssets = [
      // Low-res HDR for immediate use
      '/assets/hdri/studio_1k.hdr',
      // Essential normal maps
      '/assets/textures/micro_scratches_normal.jpg',
      '/assets/textures/steel_scratches_normal.jpg'
    ];
    
    this.updateLoadingState({ isLoading: true, progress: 0 });
    
    try {
      const promises = criticalAssets.map(async (asset, index) => {
        if (asset.endsWith('.hdr')) {
          await this.loadSingleHDR(asset, 1.0);
        } else {
          await this.loadTexture(asset);
        }
        
        const progress = ((index + 1) / criticalAssets.length) * 100;
        this.updateLoadingState({ progress });
      });
      
      await Promise.all(promises);
      console.log('🎨 PBR: Critical assets preloaded successfully');
      
    } catch (error) {
      console.warn('🎨 PBR: Some critical assets failed to preload:', error);
    } finally {
      this.updateLoadingState({ isLoading: false });
    }
  }
  
  // Get current loading state
  getLoadingState(): AssetLoadingState {
    return { ...this.loadingState };
  }
  
  // Check if specific asset is loaded
  isAssetLoaded(path: string): boolean {
    return this.loadingState.loadedAssets.has(path);
  }
  
  // Get cached HDR environment
  getCachedHDR(path: string, intensity: number = 1.0): THREE.Texture | null {
    const cacheKey = `${path}_${intensity}`;
    return this.hdrCache.get(cacheKey) || null;
  }
  
  // Get cached texture
  getCachedTexture(path: string): THREE.Texture | null {
    return this.textureCache.get(path) || null;
  }
  
  // Memory management
  dispose(): void {
    console.log('🎨 PBR: Disposing asset manager resources...');
    
    // Dispose HDR environments
    this.hdrCache.forEach(texture => texture.dispose());
    this.hdrCache.clear();
    
    // Dispose textures
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
    
    // Dispose PMREM generator
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
      this.pmremGenerator = null;
    }
    
    // Clear loading state
    this.loadingState = {
      isLoading: false,
      progress: 0,
      loadedAssets: new Set()
    };
    
    // Clear listeners
    this.listeners.clear();
    
    console.log('🎨 PBR: Asset manager disposed');
  }
  
  // Get memory usage info (for debugging)
  getMemoryInfo(): {
    hdrCount: number;
    textureCount: number;
    totalAssets: number;
  } {
    return {
      hdrCount: this.hdrCache.size,
      textureCount: this.textureCache.size,
      totalAssets: this.loadingState.loadedAssets.size
    };
  }
}
