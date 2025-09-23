# V2 Backend Architecture Plan

## 🎯 Strategic Overview

**Approach**: Firebase-first with progressive enhancement to support 100k+ users, UGC galleries, and real-time community features.

**Alignment**: Designed for mobile-first V2 framework with CID-based content system and unified workspace architecture.

## 🏗️ Architecture Components

### **1. Authentication & User Management**
**Service**: Firebase Authentication
**Features**:
- Email/password, Google, Apple sign-in
- Anonymous users (for trying before signing up)
- User profiles with puzzle creation history
- Role-based permissions (creator, moderator, admin)

```typescript
interface UserProfile {
  uid: string;
  email?: string;
  displayName: string;
  avatar?: string;
  createdAt: number; // timestamp
  stats: {
    shapesCreated: number;
    solutionsFound: number;
    puzzlesSolved: number;
    communityRank: number;
  };
  preferences: {
    defaultMaterial: string;
    defaultCamera: {
      orthographic: boolean;
      focalLength: number;
    };
    notifications: {
      newSolutions: boolean;
      communityUpdates: boolean;
      achievements: boolean;
    };
  };
}
```

### **2. Content Storage Architecture**

#### **2.1 Shape & Solution Data**
**Service**: Firebase Cloud Storage + Firestore
**Structure**:
```
/shapes/{cid}.json          # Shape data (FCC coordinates)
/solutions/{cid}.json       # Solution data (piece arrangements)
/metadata/shapes/{cid}      # Shape metadata (Firestore)
/metadata/solutions/{cid}   # Solution metadata (Firestore)
```

**Metadata Schema**:
```typescript
interface ShapeMetadata {
  cid: string;                    // Content-addressable ID
  creator: string;                // User UID
  createdAt: number;              // timestamp
  title?: string;
  description?: string;
  tags: string[];
  difficulty: number;             // 1-10 scale
  popularity: number;             // View/usage count
  symmetry: SymmetryAnalysis;     // Geometric properties
  isPublic: boolean;
  featured: boolean;              // Curated content
}

interface SolutionMetadata {
  cid: string;
  shapeCid: string;               // References shape
  solver: string;                 // User UID or 'auto'
  solvedAt: number;               // timestamp
  method: 'manual' | 'auto-dfs' | 'auto-dlx';
  timeToSolve?: number;           // Milliseconds
  moves?: number;                 // For manual solutions
  isOptimal: boolean;
  verified: boolean;
}
```

#### **2.2 User-Generated Content (UGC)**
**Service**: Firebase Cloud Storage + Firestore
**Structure**:
```
/ugc/images/{userId}/{imageId}.jpg    # User screenshots
/ugc/videos/{userId}/{videoId}.mp4    # Solution videos
/ugc/thumbnails/{contentId}.jpg       # Generated thumbnails
```

**UGC Metadata**:
```typescript
interface UGCContent {
  id: string;
  creator: string;                // User UID
  type: 'image' | 'video' | 'gif';
  relatedShape?: string;          // Shape CID
  relatedSolution?: string;       // Solution CID
  title: string;
  description?: string;
  tags: string[];
  createdAt: number;              // timestamp
  likes: number;
  views: number;
  isPublic: boolean;
  moderated: boolean;
}
```

### **3. Real-time Features**
**Service**: Firestore Real-time Listeners
**Use Cases**:
- Live leaderboards
- Community activity feeds
- Real-time collaboration (future)
- Notification system

### **4. API Layer**
**Service**: Firebase Cloud Functions (Node.js)
**Endpoints**:
```typescript
// Content Management
POST /api/shapes              # Create new shape
GET  /api/shapes/{cid}        # Get shape data
GET  /api/shapes/search       # Search shapes
PUT  /api/shapes/{cid}/like   # Like/unlike shape

// Solution Management  
POST /api/solutions           # Submit solution
GET  /api/solutions/{cid}     # Get solution data
GET  /api/shapes/{cid}/solutions  # Get all solutions for shape

// UGC Management
POST /api/ugc/upload          # Upload image/video
GET  /api/ugc/gallery         # Browse UGC gallery
POST /api/ugc/{id}/moderate   # Moderation actions

// User Management
GET  /api/users/{uid}/profile # Get user profile
PUT  /api/users/{uid}/profile # Update profile
GET  /api/users/{uid}/content # Get user's content
```

## 📱 Mobile-First Integration

### **Offline Support**
- Firestore offline persistence
- Local shape/solution caching
- Progressive sync when online
- Optimistic UI updates

### **Performance Optimization**
- CDN for static assets (Firebase Hosting)
- Image optimization and compression
- Lazy loading for UGC galleries
- Efficient pagination

## 🔒 Security & Permissions

### **Firestore Security Rules**
```javascript
// Shapes collection
match /shapes/{cid} {
  allow read: if resource.data.isPublic == true || 
                 resource.data.creator == request.auth.uid;
  allow write: if request.auth != null && 
                  request.auth.uid == resource.data.creator;
}

// UGC collection
match /ugc/{contentId} {
  allow read: if resource.data.isPublic == true && 
                 resource.data.moderated == true;
  allow write: if request.auth != null && 
                  request.auth.uid == resource.data.creator;
}
```

### **Content Moderation**
- Automated image/text analysis
- Community reporting system
- Moderator review queue
- DMCA compliance

## 📊 Scalability Strategy

### **Phase 1: MVP (0-1k users)**
- Basic Firebase setup
- Simple authentication
- Shape/solution storage
- Basic UGC upload

### **Phase 2: Growth (1k-10k users)**
- Advanced search and filtering
- Real-time leaderboards
- Community galleries
- Basic moderation tools

### **Phase 3: Scale (10k-100k users)**
- CDN optimization
- Advanced caching strategies
- Microservices for heavy operations
- Professional moderation tools

### **Phase 4: Enterprise (100k+ users)**
- Multi-region deployment
- Advanced analytics
- AI-powered recommendations
- Enterprise partnerships

## 💰 Cost Estimation

### **Firebase Pricing (Monthly)**
- **Firestore**: ~$25-100 (100k users, moderate usage)
- **Cloud Storage**: ~$10-50 (JSON + UGC files)
- **Cloud Functions**: ~$5-25 (API calls)
- **Authentication**: Free (up to 50k MAU)
- **Hosting**: ~$1-5 (static assets)

**Total**: ~$40-180/month for 100k users

## 🚀 Implementation Timeline

### **Week 3-4: Backend Foundation**
- Firebase project setup
- Authentication integration
- Basic Firestore schema
- User profile system

### **Week 5-6: Content System**
- Shape/solution storage
- CID integration
- Basic search functionality
- File upload system

### **Week 7-8: Community Features**
- UGC galleries
- Like/comment system
- Basic moderation
- Real-time updates

## 🔧 V2 Framework Integration

### **Workspace Context Enhancement**
```typescript
interface WorkspaceState {
  // Existing state...
  user: UserProfile | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus;
}
```

### **New Services**
```typescript
// src/services/auth/
├── AuthService.ts           # Firebase Auth integration
├── UserProfileService.ts    # User profile management
└── PermissionService.ts     # Role-based permissions

// src/services/content/
├── ShapeService.ts          # Shape CRUD operations
├── SolutionService.ts       # Solution management
├── UGCService.ts           # User-generated content
└── SearchService.ts        # Content discovery

// src/services/sync/
├── OfflineService.ts       # Offline data management
├── SyncService.ts          # Data synchronization
└── CacheService.ts         # Local caching
```

## 🎯 Next Steps

1. **Add user context to workspace** ✅ COMPLETED
2. **Set up Firebase project** (next week)
3. **Integrate authentication** (Week 3)
4. **Implement content storage** (Week 4)
5. **Build UGC galleries** (Week 5-6)

This architecture provides a solid foundation for the community-driven "Minecraft of 3D Puzzles" vision while maintaining the mobile-first, framework-first approach of V2.
