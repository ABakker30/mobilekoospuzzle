// UI-only port; engines remain upstream.
// File System Access API helpers with fallback to download

/**
 * Load JSON file using File System Access API or file input fallback
 */
export async function loadJSONFile(): Promise<any> {
  // Try File System Access API first (modern browsers)
  if ('showOpenFilePicker' in window) {
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [{
          description: 'FCC Container files',
          accept: {
            'application/json': ['.json', '.fcc.json']
          }
        }],
        multiple: false
      });
      
      const file = await fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('File selection cancelled');
      }
      throw error;
    }
  }
  
  // Fallback to traditional file input
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.fcc.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        resolve(data);
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${(error as Error).message}`));
      }
    };
    
    input.oncancel = () => {
      reject(new Error('File selection cancelled'));
    };
    
    input.click();
  });
}

/**
 * Save JSON data using File System Access API or download fallback
 */
export async function saveJSONFile(data: any, suggestedName: string = 'container.fcc.json'): Promise<void> {
  const jsonString = JSON.stringify(data, null, 2);
  
  // Try File System Access API first (modern browsers)
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [{
          description: 'FCC Container files',
          accept: {
            'application/json': ['.json', '.fcc.json']
          }
        }]
      });
      
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      return;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Save cancelled');
      }
      // Fall through to download fallback
    }
  }
  
  // Fallback to download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
}
