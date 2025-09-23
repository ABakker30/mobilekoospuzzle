# Component Extraction Plan: ShapeViewer3D

## 🎯 Objective

Extract a reusable `ShapeViewer3D` component from the current `ShapeEditor3D.tsx` that can serve as the foundation for all four modes in the unified workspace architecture.

## 📊 Current ShapeEditor3D Analysis

### **Core Responsibilities (1158 lines)**
1. **3D Scene Management** (Lines 296-463) - ✅ **REUSABLE**
2. **Coordinate Transformation** (Lines 132-294) - ✅ **REUSABLE** 
3. **Material & Lighting System** (Lines 636-779) - ✅ **REUSABLE**
4. **Camera & Controls** (Lines 80-97, 663-733) - ✅ **REUSABLE**
5. **Interactive Editing** (Lines 782-1033) - ❌ **EDITING-SPECIFIC**
6. **PBR Integration** (Lines 1094-1132) - ✅ **REUSABLE**

### **Key Reusable Assets**
- **CellRecord System**: Engine/World coordinate architecture
- **FCC Transformation Pipeline**: `engineToWorldTransform()`, `calculateNeighborRecords()`
- **Three.js Scene Setup**: Lighting, camera, controls, renderer
- **Material System Integration**: PBR materials, HDR environments
- **Settings Integration**: Real-time material/camera updates
- **Mobile Optimization**: Touch controls, responsive design

## 🏗️ Extraction Strategy

### **Phase 1: Create ShapeViewer3D Base Component**

#### **1.1 Core Viewer Interface**
```typescript
interface ShapeViewer3DProps {
  coordinates: FCCCoord[];
  settings: AppSettings;
  mode?: 'view' | 'edit' | 'solve' | 'manual';
  onCellClick?: (cellRecord: CellRecord) => void;
  onNeighborClick?: (neighborRecord: CellRecord) => void;
  showNeighbors?: boolean;
  interactionEnabled?: boolean;
}

interface ShapeViewer3DRef {
  getCellRecords: () => CellRecord[];
  applyCenterOrientTransform: (transformMatrix: THREE.Matrix4) => Promise<void>;
  resetToOriginalTransform: (engineCoords: FCCCoord[]) => CellRecord[];
  updateMaterialSettings: (materialSettings: MaterialSettings) => Promise<void>;
  focusOnShape: () => void;
  getSceneSnapshot: () => string; // For thumbnails
}
```

#### **1.2 Extracted Core Functions (REUSABLE)**
- `engineToWorldTransform()` - Coordinate transformation with world-space centering
- `calculateNeighborRecords()` - Neighbor calculation with rhombohedral lattice
- `createCamera()` - Camera creation with orthographic/perspective support
- `initializeThreeJS()` - Scene, lighting, renderer setup
- `updateMaterialSettings()` - Real-time material updates
- `applyCenterOrientTransform()` - Hull-based transformations

#### **1.3 Scene Management (REUSABLE)**
- Three.js scene initialization and cleanup
- Comprehensive lighting system (ambient + 4 directional lights)
- OrbitControls with mobile optimization
- Responsive canvas handling
- Material and lighting updates based on settings

### **Phase 2: Create ShapeEditor3D Wrapper**

#### **2.1 Editor-Specific Layer**
```typescript
interface ShapeEditor3DProps extends ShapeViewer3DProps {
  editMode: 'add' | 'delete';
  editingEnabled: boolean;
  onCoordinatesChange: (coordinates: FCCCoord[]) => void;
}
```

#### **2.2 Editing-Specific Functions (EDITOR-ONLY)**
- `handleMouseDown/Move/Up()` - Interactive editing events
- `createPreviewSphere()` - Add mode preview spheres
- `clearHoverEffects()` - Hover state management
- Two-stage tap workflow for mobile
- Delete mode transparency effects
- Neighbor intersection and selection logic

#### **2.3 Editor Enhancement Layer**
- Invisible neighbor spheres for raycasting
- Preview sphere management
- Pending add position state
- Mobile-optimized touch interaction
- Debug visualization (disabled)

## 🔧 Technical Implementation Plan

### **Step 1: Extract ShapeViewer3D Core (Week 1, Days 1-3)**

#### **File Structure**
```
src/components/shared/
├── ShapeViewer3D/
│   ├── ShapeViewer3D.tsx          # Main viewer component
│   ├── hooks/
│   │   ├── useThreeScene.ts       # Scene initialization
│   │   ├── useCoordinateSystem.ts # FCC transformations
│   │   └── useMaterialSystem.ts   # Material updates
│   ├── utils/
│   │   ├── sceneSetup.ts          # Lighting, camera setup
│   │   ├── coordinateTransforms.ts # FCC transformation functions
│   │   └── materialHelpers.ts     # Material creation utilities
│   └── types/
│       └── ShapeViewer.types.ts   # Shared interfaces
```

#### **Core ShapeViewer3D Component**
```typescript
const ShapeViewer3D = forwardRef<ShapeViewer3DRef, ShapeViewer3DProps>(({
  coordinates,
  settings,
  mode = 'view',
  onCellClick,
  onNeighborClick,
  showNeighbors = false,
  interactionEnabled = true
}, ref) => {
  // Core Three.js scene management
  const { scene, camera, renderer, controls } = useThreeScene(settings);
  
  // Coordinate system management
  const { cellRecords, neighborRecords, transformCoordinates } = useCoordinateSystem(coordinates);
  
  // Material system integration
  const { updateMaterials } = useMaterialSystem(settings);
  
  // Render spheres and handle interactions
  // Expose imperative methods via ref
  
  return <div ref={containerRef} style={containerStyles} />;
});
```

### **Step 2: Refactor ShapeEditor3D (Week 1, Days 4-5)**

#### **New ShapeEditor3D Implementation**
```typescript
const ShapeEditor3D = forwardRef<ShapeEditor3DRef, ShapeEditor3DProps>(({
  coordinates,
  settings,
  editMode,
  editingEnabled,
  onCoordinatesChange
}, ref) => {
  const viewerRef = useRef<ShapeViewer3DRef>(null);
  
  // Editor-specific state
  const [pendingAddPosition, setPendingAddPosition] = useState<CellRecord | null>(null);
  
  // Editor-specific event handlers
  const handleCellClick = (cellRecord: CellRecord) => {
    if (editMode === 'delete') {
      // Remove cell logic
    }
  };
  
  const handleNeighborClick = (neighborRecord: CellRecord) => {
    if (editMode === 'add') {
      // Add cell logic with two-stage confirmation
    }
  };
  
  return (
    <ShapeViewer3D
      ref={viewerRef}
      coordinates={coordinates}
      settings={settings}
      mode="edit"
      onCellClick={handleCellClick}
      onNeighborClick={handleNeighborClick}
      showNeighbors={editMode === 'add'}
      interactionEnabled={editingEnabled}
    />
  );
});
```

### **Step 3: Create Mode-Specific Viewers (Week 1, Days 6-7)**

#### **AutoSolveViewer Component**
```typescript
const AutoSolveViewer = ({ shape, solution, progress }) => {
  return (
    <ShapeViewer3D
      coordinates={shape.coordinates}
      settings={settings}
      mode="solve"
      showNeighbors={false}
      interactionEnabled={false}
    />
  );
};
```

#### **ManualSolveViewer Component**
```typescript
const ManualSolveViewer = ({ shape, pieces, onPiecePlacement }) => {
  return (
    <ShapeViewer3D
      coordinates={shape.coordinates}
      settings={settings}
      mode="manual"
      onNeighborClick={handlePiecePlacement}
      showNeighbors={true}
      interactionEnabled={true}
    />
  );
};
```

#### **SolutionViewer Component**
```typescript
const SolutionViewer = ({ solution }) => {
  return (
    <ShapeViewer3D
      coordinates={solution.coordinates}
      settings={settings}
      mode="view"
      showNeighbors={false}
      interactionEnabled={false}
    />
  );
};
```

## 📋 Extraction Checklist

### **Phase 1: Core Extraction**
- [ ] Create `src/components/shared/ShapeViewer3D/` directory structure
- [ ] Extract coordinate transformation functions to `coordinateTransforms.ts`
- [ ] Extract scene setup functions to `sceneSetup.ts`
- [ ] Create `useThreeScene` hook for scene management
- [ ] Create `useCoordinateSystem` hook for FCC transformations
- [ ] Create `useMaterialSystem` hook for material updates
- [ ] Implement core `ShapeViewer3D` component
- [ ] Create comprehensive TypeScript interfaces

### **Phase 2: Editor Refactoring**
- [ ] Refactor `ShapeEditor3D` to use `ShapeViewer3D`
- [ ] Extract editing-specific event handlers
- [ ] Implement two-stage tap workflow as editor layer
- [ ] Test mobile editing functionality
- [ ] Ensure all existing features work correctly
- [ ] Update `PuzzleShapePage` to use new architecture

### **Phase 3: Mode Integration**
- [ ] Create `AutoSolveViewer` component
- [ ] Create `ManualSolveViewer` component  
- [ ] Update existing `SolutionViewer` to use `ShapeViewer3D`
- [ ] Test all mode-specific viewers
- [ ] Ensure consistent behavior across modes

## 🎯 Benefits of This Architecture

### **Reusability**
- **Single 3D Engine**: All modes use the same proven 3D rendering system
- **Consistent UX**: Same camera controls, materials, and interactions across modes
- **Shared Optimizations**: Mobile optimizations benefit all modes
- **Unified Settings**: Material and camera settings work everywhere

### **Maintainability**
- **Separation of Concerns**: Viewing logic separate from editing logic
- **Modular Design**: Each hook handles a specific responsibility
- **Type Safety**: Comprehensive TypeScript interfaces
- **Testing**: Core viewer can be tested independently

### **Scalability**
- **Mode Extensibility**: Easy to add new modes (piece editor, AI analysis)
- **Feature Addition**: New 3D features automatically available to all modes
- **Performance**: Shared Three.js context and optimizations
- **Consistency**: Uniform behavior and appearance

## 🚨 Risk Mitigation

### **Compatibility Risks**
- **Gradual Migration**: Keep existing `ShapeEditor3D` working during transition
- **Feature Parity**: Ensure all current functionality is preserved
- **Mobile Testing**: Verify mobile editing continues to work perfectly
- **Settings Integration**: Maintain all current settings and persistence

### **Performance Risks**
- **Memory Management**: Proper Three.js cleanup in shared component
- **Render Optimization**: Maintain current performance characteristics
- **Mobile Performance**: Ensure no regression in mobile responsiveness
- **Bundle Size**: Monitor for any significant size increases

## 📈 Success Metrics

### **Technical Success**
- [ ] All existing functionality works without regression
- [ ] Mobile editing performance maintained or improved
- [ ] Code reduction: 40%+ reduction in duplicated 3D code
- [ ] Test coverage: >80% for core `ShapeViewer3D` component

### **User Experience Success**
- [ ] Consistent 3D behavior across all modes
- [ ] Smooth transitions between modes
- [ ] No loss of mobile editing capabilities
- [ ] Settings persist correctly across mode switches

---

**Next Step**: Begin Phase 1 by creating the directory structure and extracting the coordinate transformation functions. This extraction will provide the foundation for the unified workspace architecture while maintaining all current V1 capabilities.
