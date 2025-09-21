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
  // Add cache-busting for mobile to ensure fresh data
  const cacheBuster = Date.now();
  const url = `${LIBRARY_BASE_URL}/content/index.json?v=${cacheBuster}`;
  console.log('Library Service: Hostname:', window.location.hostname);
  console.log('Library Service: Base URL:', LIBRARY_BASE_URL);
  console.log('Library Service: Full URL:', url);
  
  try {
    const response = await fetch(url, {
      cache: 'no-cache', // Force fresh fetch
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    console.log('Library manifest response:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      if (response.status === 404) {
        throw new Error('Library manifest not found. Check if content/index.json exists.');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log('Raw response text length:', text.length);
    console.log('Raw response preview:', text.substring(0, 300) + '...');
    
    const items: LibraryItem[] = JSON.parse(text);
    console.log('Library manifest loaded:', items.length, 'items');
    console.log('First 3 items:', items.slice(0, 3).map(item => ({ name: item.name, cid: item.cid, size: item.size })));
    return items;
  } catch (error) {
    console.error('Failed to fetch library manifest:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', (error as Error).message);
    
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON response from library. Please try again.');
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    throw new Error(`Library error: ${(error as Error).message}`);
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
