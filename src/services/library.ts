// Service for loading containers from GitHub Pages hosted library
export interface LibraryItem {
  type: 'container' | 'solution' | 'partial' | 'events' | 'status';
  name: string;
  cid: string;
  size: number | null;
  url: string;
  updated: string;
}

export interface LibraryManifest {
  items: LibraryItem[];
}

// Use GitHub Pages URL for production, local dev server for development
const LIBRARY_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.'))
  ? window.location.origin // Local development server (localhost or local IP)
  : window.location.origin; // Production GitHub Pages (koospuzzle.com)

/**
 * Fetch the library manifest from GitHub Pages
 */
export async function fetchLibraryManifest(): Promise<LibraryItem[]> {
  const url = `${LIBRARY_BASE_URL}/content/index.json`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch library: ${response.status}`);
    }
    
    const items: LibraryItem[] = await response.json();
    
    // Simple fix: ensure all items have proper names
    return items.map(item => {
      if (!item.name || item.name === 'Unknown' || item.name.trim() === '') {
        // Extract filename from URL as fallback
        if (item.url) {
          const filename = item.url.split('/').pop() || '';
          if (filename.endsWith('.fcc.json')) {
            return { ...item, name: filename };
          }
        }
        // If no URL, use size or CID as name
        if (item.size && typeof item.size === 'number') {
          return { ...item, name: `${item.size} cells.fcc.json` };
        }
        if (item.cid) {
          return { ...item, name: `Shape_${item.cid.substring(7, 15)}.fcc.json` };
        }
        return { ...item, name: 'Unknown_Shape.fcc.json' };
      }
      return item;
    });
  } catch (error) {
    console.error('Library fetch error:', error);
    throw new Error('Failed to load shape library');
  }
}

/**
 * Fetch a specific container from the library
 */
export async function fetchLibraryContainer(item: LibraryItem): Promise<any> {
  try {
    const response = await fetch(`${LIBRARY_BASE_URL}${item.url}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch container: ${response.status} ${response.statusText}`);
    }
    
    const container = await response.json();
    return container;
  } catch (error) {
    console.error('Failed to fetch container:', error);
    throw new Error(`Failed to load container: ${(error as Error).message}`);
  }
}

/**
 * Get containers only from the library manifest
 */
export function getContainersFromManifest(items: LibraryItem[]): LibraryItem[] {
  return items.filter(item => item.type === 'container');
}

/**
 * Search containers by name
 */
export function searchContainers(containers: LibraryItem[], query: string): LibraryItem[] {
  if (!query.trim()) return containers;
  
  const lowerQuery = query.toLowerCase();
  return containers.filter(container => 
    container.name.toLowerCase().includes(lowerQuery) ||
    container.cid.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sort containers by various criteria
 */
export function sortContainers(containers: LibraryItem[], sortBy: 'name' | 'size' | 'updated'): LibraryItem[] {
  return [...containers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'size':
        if (a.size === null && b.size === null) return 0;
        if (a.size === null) return 1;
        if (b.size === null) return -1;
        return a.size - b.size;
      case 'updated':
        return new Date(b.updated).getTime() - new Date(a.updated).getTime();
      default:
        return 0;
    }
  });
}
