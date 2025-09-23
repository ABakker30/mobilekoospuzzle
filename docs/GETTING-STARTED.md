# Getting Started: V2 Implementation

## 🎯 Ready to Begin Implementation

You now have a complete foundation for implementing Koos Puzzle V2. Here's your immediate action plan to start the component extraction and unified workspace development.

## 📋 Prerequisites Completed ✅

- **✅ Comprehensive Documentation**: Vision, architecture, and feature specifications complete
- **✅ Implementation Strategy**: Progressive enhancement approach defined
- **✅ Component Analysis**: ShapeEditor3D.tsx thoroughly analyzed (1158 lines)
- **✅ Extraction Plan**: Detailed plan for ShapeViewer3D extraction created
- **✅ Risk Mitigation**: V1 stability preserved, clear rollback strategy

## 🚀 Immediate Next Steps (This Week)

### **Day 1: Setup V2 Development Environment**

#### 1. Create Development Branch
```bash
# Create and switch to v2 development branch
git checkout -b v2-development

# Verify you're on the new branch
git branch
```

#### 2. Set Up Testing Framework
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev jest-environment-jsdom

# Create test configuration
```

#### 3. Create Directory Structure
```bash
# Create the new shared components directory
mkdir -p src/components/shared/ShapeViewer3D/{hooks,utils,types}

# Create test directories
mkdir -p src/components/shared/ShapeViewer3D/__tests__
```

### **Day 2-3: Extract Core Coordinate System**

#### 1. Extract Coordinate Transformation Functions
**Target**: Lines 132-294 from `ShapeEditor3D.tsx`

Create `src/components/shared/ShapeViewer3D/utils/coordinateTransforms.ts`:
- `engineToWorldTransform()` - Core transformation with world-space centering
- `calculateNeighborRecords()` - Rhombohedral lattice neighbor calculation
- `CellRecord` interface and related types

#### 2. Create Coordinate System Hook
Create `src/components/shared/ShapeViewer3D/hooks/useCoordinateSystem.ts`:
- Manage CellRecord state
- Handle coordinate transformations
- Provide neighbor calculations
- Support transformation matrices

### **Day 4-5: Extract Three.js Scene Management**

#### 1. Extract Scene Setup Functions
**Target**: Lines 296-463 from `ShapeEditor3D.tsx`

Create `src/components/shared/ShapeViewer3D/utils/sceneSetup.ts`:
- `initializeThreeJS()` - Scene, camera, renderer setup
- `createCamera()` - Camera creation with orthographic/perspective support
- `setupLighting()` - Comprehensive lighting system
- `setupControls()` - OrbitControls with mobile optimization

#### 2. Create Three.js Scene Hook
Create `src/components/shared/ShapeViewer3D/hooks/useThreeScene.ts`:
- Scene lifecycle management
- Camera and controls setup
- Responsive canvas handling
- Cleanup and disposal

### **Day 6-7: Create Core ShapeViewer3D Component**

#### 1. Implement Base ShapeViewer3D
**Target**: Combine extracted functionality into reusable component

Create `src/components/shared/ShapeViewer3D/ShapeViewer3D.tsx`:
- Use extracted hooks and utilities
- Implement mode-aware interaction
- Support all current features (materials, settings, transformations)
- Maintain mobile optimization

#### 2. Test and Validate
- Create unit tests for coordinate transformations
- Test Three.js scene initialization
- Verify mobile compatibility
- Ensure performance matches current implementation

## 🔧 Implementation Guidelines

### **Code Quality Standards**
- **TypeScript**: Strict typing for all new components
- **Testing**: >80% test coverage for core functionality
- **Documentation**: JSDoc comments for all public interfaces
- **Performance**: Maintain or improve current mobile performance

### **Compatibility Requirements**
- **V1 Preservation**: Keep existing ShapeEditor3D working during transition
- **Mobile First**: Maintain excellent mobile editing experience
- **Settings Integration**: Preserve all current settings and persistence
- **Feature Parity**: All current functionality must work in new architecture

### **Development Workflow**
```bash
# Daily workflow
git checkout v2-development
git pull origin v2-development

# Make changes, test locally
npm test
npm run build

# Commit with descriptive messages
git add .
git commit -m "feat: extract coordinate transformation utilities"
git push origin v2-development
```

## 📊 Success Metrics for Week 1

### **Technical Milestones**
- [ ] `coordinateTransforms.ts` extracted and tested
- [ ] `useCoordinateSystem` hook implemented and working
- [ ] `sceneSetup.ts` extracted with all lighting and camera functions
- [ ] `useThreeScene` hook managing Three.js lifecycle
- [ ] Core `ShapeViewer3D` component rendering shapes correctly

### **Quality Gates**
- [ ] All extracted code has TypeScript interfaces
- [ ] Unit tests cover coordinate transformation functions
- [ ] Mobile performance maintained (test on actual devices)
- [ ] No regressions in existing V1 functionality
- [ ] Memory leaks prevented (proper Three.js cleanup)

### **Integration Validation**
- [ ] ShapeViewer3D renders shapes identically to current ShapeEditor3D
- [ ] Material settings work correctly
- [ ] Camera controls and mobile optimization preserved
- [ ] Settings persistence functions properly
- [ ] PBR materials and HDR environments work

## 🎯 Week 2 Preview: Editor Integration

Once the core `ShapeViewer3D` is working, Week 2 will focus on:

1. **Refactor ShapeEditor3D** to use the new ShapeViewer3D base
2. **Extract editing-specific functionality** (lines 782-1033)
3. **Implement mode-aware interaction system**
4. **Test complete editing workflow** with two-stage tap process
5. **Validate mobile editing experience** matches current quality

## 🚨 Risk Management

### **If Issues Arise**
- **Rollback Strategy**: V1 remains untouched on main branch
- **Incremental Approach**: Each extracted component tested independently
- **Performance Monitoring**: Continuous mobile performance validation
- **Feature Validation**: Comprehensive testing of all current capabilities

### **Getting Help**
- **Documentation Reference**: All architectural decisions documented in ADRs
- **Component Analysis**: Detailed extraction plan provides line-by-line guidance
- **Implementation Strategy**: Progressive enhancement minimizes risk

## 🎉 Ready to Start!

You have everything needed to begin the V2 implementation:

1. **Clear Vision**: Comprehensive documentation of the ultimate goal
2. **Solid Strategy**: Progressive enhancement preserving V1 stability  
3. **Detailed Plan**: Line-by-line extraction guidance
4. **Strong Foundation**: Excellent V1 codebase with mobile optimization
5. **Risk Mitigation**: Multiple fallback options and validation steps

**Start with Day 1: Create the v2-development branch and begin extracting the coordinate transformation functions. The foundation you've built with V1 is excellent - now we're going to make it the basis for something truly revolutionary! 🚀**
