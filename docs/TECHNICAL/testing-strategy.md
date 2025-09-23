# Testing Strategy for Koos Puzzle V2

## Overview

Koos Puzzle V2 implements a comprehensive testing strategy to ensure reliability, performance, and maintainability. This document outlines the testing approach, tools, and standards for the clean architecture rebuild.

## Testing Philosophy

### Core Principles
1. **Test-Driven Development**: Write tests before implementation
2. **Comprehensive Coverage**: >80% code coverage across all layers
3. **Fast Feedback**: Tests run quickly during development
4. **Reliable Tests**: Deterministic, isolated, and maintainable
5. **Real-World Scenarios**: Tests reflect actual user workflows

### Testing Pyramid

```
        E2E Tests (10%)
       ┌─────────────────┐
      │  User Workflows  │
     └─────────────────────┘
    
    Integration Tests (30%)
   ┌─────────────────────────┐
  │   Component Interactions  │
 └───────────────────────────────┘

      Unit Tests (60%)
 ┌─────────────────────────────────┐
│  Functions, Classes, Components  │
└─────────────────────────────────────┘
```

---

## Unit Testing (60% of tests)

### Scope
- Pure functions and utilities
- Individual React components
- Coordinate transformations
- Data contract validation
- Business logic functions

### Tools
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing
- **@testing-library/jest-dom**: DOM matchers
- **MSW (Mock Service Worker)**: API mocking

### Standards

#### Test Structure
```typescript
describe('Component/Function Name', () => {
  describe('specific behavior', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createTestInput();
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

#### Coordinate System Tests
```typescript
describe('FCC Coordinate Transformations', () => {
  describe('engineToWorld', () => {
    it('should transform origin correctly', () => {
      const engine: EngineFCC = { x: 0, y: 0, z: 0 };
      const world = engineToWorld(engine);
      
      expect(world.x).toBeCloseTo(0, 10);
      expect(world.y).toBeCloseTo(0, 10);
      expect(world.z).toBeCloseTo(0, 10);
    });
    
    it('should be reversible for all test cases', () => {
      const testCases: EngineFCC[] = [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 1, y: 1, z: 1 },
        { x: -1, y: -1, z: -1 },
        { x: 10, y: 15, z: 20 }
      ];
      
      testCases.forEach(original => {
        const world = engineToWorld(original);
        const restored = worldToEngine(world);
        
        expect(restored.x).toBe(original.x);
        expect(restored.y).toBe(original.y);
        expect(restored.z).toBe(original.z);
      });
    });
    
    it('should handle batch operations correctly', () => {
      const coords: EngineFCC[] = [
        { x: 1, y: 2, z: 3 },
        { x: 4, y: 5, z: 6 }
      ];
      
      const individual = coords.map(engineToWorld);
      const batch = engineToWorldBatch(coords);
      
      expect(batch).toEqual(individual);
    });
  });
});
```

#### Component Tests
```typescript
describe('ShapeViewer3D', () => {
  const mockCoordinates: EngineFCC[] = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 }
  ];
  
  it('should render spheres for each coordinate', () => {
    render(<ShapeViewer3D coordinates={mockCoordinates} />);
    
    // Test that component renders without crashing
    expect(screen.getByTestId('shape-viewer')).toBeInTheDocument();
  });
  
  it('should update when coordinates change', () => {
    const { rerender } = render(
      <ShapeViewer3D coordinates={mockCoordinates} />
    );
    
    const newCoordinates = [...mockCoordinates, { x: 0, y: 1, z: 0 }];
    rerender(<ShapeViewer3D coordinates={newCoordinates} />);
    
    // Verify component updates correctly
  });
  
  it('should maintain orientation through settings changes', () => {
    const { rerender } = render(
      <ShapeViewer3D 
        coordinates={mockCoordinates} 
        settings={{ brightness: 0.5 }} 
      />
    );
    
    // Change settings
    rerender(
      <ShapeViewer3D 
        coordinates={mockCoordinates} 
        settings={{ brightness: 0.8 }} 
      />
    );
    
    // Verify orientation is preserved (regression test)
  });
});
```

#### Data Contract Tests
```typescript
describe('Shape Contract Validation', () => {
  it('should validate correct shape contracts', () => {
    const validShape: ShapeContract = {
      version: "1.0",
      coordinates: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ]
    };
    
    const result = validateShapeContract(validShape);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should reject invalid coordinates', () => {
    const invalidShape: ShapeContract = {
      version: "1.0",
      coordinates: [
        { x: 0.5, y: 0.5, z: 0.5 } // Invalid FCC position
      ]
    };
    
    const result = validateShapeContract(invalidShape);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        type: 'INVALID_FCC_POSITION'
      })
    );
  });
  
  it('should calculate consistent CIDs', () => {
    const shape1: ShapeContract = {
      version: "1.0",
      coordinates: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }]
    };
    
    const shape2: ShapeContract = {
      version: "1.0",
      coordinates: [{ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }] // Different order
    };
    
    const cid1 = calculateShapeCID(shape1);
    const cid2 = calculateShapeCID(shape2);
    
    expect(cid1).toBe(cid2); // Should be same due to normalization
  });
});
```

---

## Integration Testing (30% of tests)

### Scope
- Component interactions
- Data flow between layers
- Mode switching in unified workspace
- Settings persistence
- File loading and saving

### Tools
- **React Testing Library**: Component integration
- **MSW**: API mocking for realistic data flow
- **Jest**: Test runner with setup/teardown

### Test Categories

#### Unified Workspace Integration
```typescript
describe('Unified Workspace Integration', () => {
  it('should switch modes without losing data', async () => {
    const user = userEvent.setup();
    
    render(<UnifiedWorkspace initialMode="puzzle-shape" />);
    
    // Load a shape in puzzle-shape mode
    const fileInput = screen.getByLabelText('Load Shape');
    const file = new File([JSON.stringify(mockShapeData)], 'test.json');
    await user.upload(fileInput, file);
    
    // Switch to auto-solve mode
    await user.click(screen.getByRole('tab', { name: 'Auto Solve' }));
    
    // Verify shape is still loaded
    expect(screen.getByTestId('loaded-shape')).toBeInTheDocument();
    expect(screen.getByText('Shape loaded: test.json')).toBeInTheDocument();
  });
  
  it('should preserve settings across mode switches', async () => {
    const user = userEvent.setup();
    
    render(<UnifiedWorkspace initialMode="puzzle-shape" />);
    
    // Change settings
    await user.click(screen.getByLabelText('Settings'));
    await user.type(screen.getByLabelText('Brightness'), '0.8');
    await user.click(screen.getByText('Apply'));
    
    // Switch modes
    await user.click(screen.getByRole('tab', { name: 'View Solution' }));
    
    // Verify settings are preserved
    await user.click(screen.getByLabelText('Settings'));
    expect(screen.getByLabelText('Brightness')).toHaveValue('0.8');
  });
});
```

#### Data Flow Integration
```typescript
describe('Shape to Solution Data Flow', () => {
  it('should create solution from loaded shape', async () => {
    const user = userEvent.setup();
    
    // Mock API responses
    server.use(
      rest.post('/api/solutions', (req, res, ctx) => {
        return res(ctx.json({ cid: 'mock-solution-cid' }));
      })
    );
    
    render(<UnifiedWorkspace initialMode="auto-solve" />);
    
    // Load shape
    await loadMockShape(user);
    
    // Start solving
    await user.click(screen.getByText('Start Solving'));
    
    // Wait for solution
    await waitFor(() => {
      expect(screen.getByText('Solution found!')).toBeInTheDocument();
    });
    
    // Verify solution is linked to shape
    expect(screen.getByTestId('solution-shape-link')).toHaveTextContent(
      'mock-shape-cid'
    );
  });
});
```

#### Settings Integration
```typescript
describe('Settings Integration', () => {
  it('should persist settings to localStorage', async () => {
    const user = userEvent.setup();
    
    render(<UnifiedWorkspace />);
    
    // Change settings
    await user.click(screen.getByLabelText('Settings'));
    await user.selectOptions(screen.getByLabelText('Theme'), 'dark');
    await user.click(screen.getByText('Save'));
    
    // Verify localStorage
    const savedSettings = JSON.parse(
      localStorage.getItem('koos-puzzle-settings') || '{}'
    );
    expect(savedSettings.theme).toBe('dark');
  });
  
  it('should load settings on startup', () => {
    // Pre-populate localStorage
    localStorage.setItem('koos-puzzle-settings', JSON.stringify({
      theme: 'dark',
      brightness: 0.7
    }));
    
    render(<UnifiedWorkspace />);
    
    // Verify settings are applied
    expect(document.body).toHaveClass('theme-dark');
  });
});
```

---

## End-to-End Testing (10% of tests)

### Scope
- Complete user workflows
- Cross-browser compatibility
- Performance benchmarks
- Accessibility compliance

### Tools
- **Playwright**: Cross-browser E2E testing
- **Lighthouse CI**: Performance and accessibility auditing

### Test Scenarios

#### Complete Puzzle Workflow
```typescript
// e2e/puzzle-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('complete puzzle creation and solving workflow', async ({ page }) => {
  await page.goto('/');
  
  // Create new shape
  await page.click('text=Puzzle Shape');
  await page.click('[data-testid="new-shape"]');
  
  // Add some spheres by clicking in 3D space
  await page.click('[data-testid="3d-canvas"]', { position: { x: 100, y: 100 } });
  await page.click('[data-testid="3d-canvas"]', { position: { x: 150, y: 100 } });
  
  // Save shape
  await page.click('[data-testid="save-shape"]');
  await page.fill('[data-testid="shape-name"]', 'Test Shape');
  await page.click('text=Save');
  
  // Switch to auto solve
  await page.click('text=Auto Solve');
  
  // Verify shape is loaded
  await expect(page.locator('[data-testid="loaded-shape"]')).toContainText('Test Shape');
  
  // Start solving
  await page.click('text=Start Solving');
  
  // Wait for solution (with timeout)
  await expect(page.locator('text=Solution found!')).toBeVisible({ timeout: 30000 });
  
  // Switch to view solution
  await page.click('text=View Solution');
  
  // Verify solution is displayed
  await expect(page.locator('[data-testid="solution-viewer"]')).toBeVisible();
});
```

#### Performance Testing
```typescript
test('performance benchmarks', async ({ page }) => {
  await page.goto('/');
  
  // Measure initial load time
  const startTime = Date.now();
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(2000); // <2s load time
  
  // Test 3D rendering performance
  await page.click('text=Puzzle Shape');
  
  // Load large shape
  await page.setInputFiles('[data-testid="file-input"]', 'test-data/large-shape.json');
  
  // Measure rendering time
  const renderStart = Date.now();
  await page.waitForSelector('[data-testid="3d-rendered"]');
  const renderTime = Date.now() - renderStart;
  
  expect(renderTime).toBeLessThan(1000); // <1s render time
  
  // Test smooth interaction (60fps)
  const fps = await page.evaluate(() => {
    return new Promise(resolve => {
      let frameCount = 0;
      const startTime = performance.now();
      
      function countFrames() {
        frameCount++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrames);
        } else {
          resolve(frameCount);
        }
      }
      
      requestAnimationFrame(countFrames);
    });
  });
  
  expect(fps).toBeGreaterThan(55); // ~60fps
});
```

#### Accessibility Testing
```typescript
test('accessibility compliance', async ({ page }) => {
  await page.goto('/');
  
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveText('Puzzle Shape');
  
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveText('Auto Solve');
  
  // Test screen reader compatibility
  const ariaLabels = await page.locator('[aria-label]').count();
  expect(ariaLabels).toBeGreaterThan(5);
  
  // Test color contrast (via axe-core)
  const accessibilityResults = await page.evaluate(() => {
    return new Promise(resolve => {
      // @ts-ignore
      axe.run().then(resolve);
    });
  });
  
  expect(accessibilityResults.violations).toHaveLength(0);
});
```

---

## Performance Testing

### Benchmarking Strategy

```typescript
// performance/coordinate-transforms.bench.ts
describe('Coordinate Transform Performance', () => {
  const generateCoordinates = (count: number): EngineFCC[] => {
    return Array.from({ length: count }, (_, i) => ({
      x: i % 10,
      y: Math.floor(i / 10) % 10,
      z: Math.floor(i / 100)
    }));
  };
  
  it('should transform 1000 coordinates in <10ms', () => {
    const coords = generateCoordinates(1000);
    
    const start = performance.now();
    const results = engineToWorldBatch(coords);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(10);
    expect(results).toHaveLength(1000);
  });
  
  it('should handle large datasets efficiently', () => {
    const coords = generateCoordinates(10000);
    
    const start = performance.now();
    const results = engineToWorldBatch(coords);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
    expect(results).toHaveLength(10000);
  });
});
```

### Memory Usage Testing

```typescript
describe('Memory Usage', () => {
  it('should not leak memory during coordinate transformations', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Perform many transformations
    for (let i = 0; i < 1000; i++) {
      const coords = generateCoordinates(100);
      engineToWorldBatch(coords);
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Should not increase by more than 10MB
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

---

## Test Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/serviceWorker.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  }
};
```

### Test Setup

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Mock Three.js for testing
jest.mock('three', () => ({
  Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    distanceTo: jest.fn(),
    clone: jest.fn()
  })),
  Scene: jest.fn(),
  WebGLRenderer: jest.fn(),
  PerspectiveCamera: jest.fn()
}));

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;
```

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
  
  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:performance
      - run: npm run lighthouse-ci
```

---

## Test Data Management

### Mock Data Factory

```typescript
// src/test-utils/factories.ts
export const createMockShape = (overrides?: Partial<ShapeContract>): ShapeContract => ({
  version: "1.0",
  coordinates: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 }
  ],
  ...overrides
});

export const createMockSolution = (
  shapeCID: string, 
  overrides?: Partial<SolutionContract>
): SolutionContract => ({
  version: "1.0",
  shapeCID,
  pieces: [
    {
      pieceId: 'L-piece',
      position: { x: 0, y: 0, z: 0 },
      rotation: createIdentityMatrix(),
      coordinates: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }]
    }
  ],
  ...overrides
});
```

### Test Utilities

```typescript
// src/test-utils/render-helpers.ts
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: {
    initialState?: Partial<AppState>;
    route?: string;
  }
) => {
  const { initialState, route = '/' } = options || {};
  
  window.history.pushState({}, 'Test page', route);
  
  return render(
    <BrowserRouter>
      <AppStateProvider initialState={initialState}>
        {ui}
      </AppStateProvider>
    </BrowserRouter>
  );
};
```

This comprehensive testing strategy ensures that Koos Puzzle V2 maintains high quality, performance, and reliability throughout development and beyond.
