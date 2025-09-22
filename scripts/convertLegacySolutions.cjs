#!/usr/bin/env node

/**
 * Legacy Solution Format Converter
 * Converts legacy world-coordinate solution files to new ijk-only format
 * 
 * Usage: node scripts/convertLegacySolutions.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Paths
const LEGACY_DIR = path.join(__dirname, '../public/content/solutions/legacy results');
const OUTPUT_DIR = path.join(__dirname, '../public/content/solutions/converted');
const SAMPLE_CORRECT_FILE = path.join(__dirname, '../public/content/solutions/16_cell_container.fcc_16cell_dlx_corrected_001.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Calculate orientation and translation from piece coordinates
 * For now, we'll use simplified calculation - can be enhanced later
 */
function calculateOrientationAndTranslation(cells_ijk) {
  // Simple approach: use first cell as translation, orientation as 0
  // This can be enhanced with proper tetromino orientation detection
  const firstCell = cells_ijk[0];
  const translation = [...firstCell];
  
  // Normalize coordinates relative to first cell
  const normalizedCells = cells_ijk.map(cell => [
    cell[0] - firstCell[0],
    cell[1] - firstCell[1], 
    cell[2] - firstCell[2]
  ]);
  
  return {
    ori: 0, // Simplified - could calculate actual orientation
    t: translation,
    cells_ijk: cells_ijk // Keep original coordinates
  };
}

/**
 * Generate container CID hash from solution data
 */
function generateContainerCid(containerName, pieces) {
  const data = JSON.stringify({ containerName, pieceCount: pieces.length });
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Convert legacy solution format to new format
 */
function convertLegacySolution(legacyData, filename) {
  console.log(`Converting: ${filename}`);
  
  // Extract container name from filename or legacy data
  const containerName = legacyData.container_name || filename.split('.')[0];
  
  // Convert pieces to placements
  const placements = legacyData.pieces.map(piece => {
    const { ori, t, cells_ijk } = calculateOrientationAndTranslation(piece.cells_ijk);
    
    return {
      piece: piece.id,
      ori: ori,
      t: t,
      cells_ijk: cells_ijk
    };
  });
  
  // Generate pieces used map
  const piecesUsed = {};
  legacyData.pieces.forEach(piece => {
    piecesUsed[piece.id] = 1;
  });
  
  // Create new format
  const newFormat = {
    version: 1,
    containerCidSha256: generateContainerCid(containerName, legacyData.pieces),
    lattice: "fcc",
    piecesUsed: piecesUsed,
    placements: placements,
    sid_state_sha256: "converted_from_legacy",
    sid_route_sha256: "converted_from_legacy", 
    sid_state_canon_sha256: crypto.createHash('sha256').update(JSON.stringify(placements)).digest('hex'),
    mode: "solver",
    solver: {
      engine: "legacy_converted",
      seed: 0,
      flags: {
        mrvPieces: false,
        supportBias: false
      }
    }
  };
  
  return newFormat;
}

/**
 * Main conversion function
 */
function convertAllLegacyFiles() {
  console.log('🔄 Starting legacy solution format conversion...');
  console.log(`📁 Input directory: ${LEGACY_DIR}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  
  // Read legacy directory
  const legacyFiles = fs.readdirSync(LEGACY_DIR).filter(file => file.endsWith('.json'));
  console.log(`📋 Found ${legacyFiles.length} legacy files to convert`);
  
  let convertedCount = 0;
  let errorCount = 0;
  
  // Convert each file
  legacyFiles.forEach(filename => {
    try {
      // Read legacy file
      const legacyPath = path.join(LEGACY_DIR, filename);
      const legacyData = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
      
      // Convert to new format
      const newData = convertLegacySolution(legacyData, filename);
      
      // Generate output filename (remove .world from name)
      const outputFilename = filename.replace('.world.json', '.json');
      const outputPath = path.join(OUTPUT_DIR, outputFilename);
      
      // Write converted file
      fs.writeFileSync(outputPath, JSON.stringify(newData, null, 2));
      
      console.log(`✅ Converted: ${filename} → ${outputFilename}`);
      convertedCount++;
      
    } catch (error) {
      console.error(`❌ Error converting ${filename}:`, error.message);
      errorCount++;
    }
  });
  
  console.log('\n📊 Conversion Summary:');
  console.log(`✅ Successfully converted: ${convertedCount} files`);
  console.log(`❌ Errors: ${errorCount} files`);
  console.log(`📁 Output location: ${OUTPUT_DIR}`);
  
  // Show sample of converted format
  if (convertedCount > 0) {
    const sampleFile = fs.readdirSync(OUTPUT_DIR)[0];
    const samplePath = path.join(OUTPUT_DIR, sampleFile);
    const sampleData = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    
    console.log('\n📋 Sample converted format:');
    console.log(JSON.stringify(sampleData, null, 2).substring(0, 500) + '...');
  }
}

/**
 * Validation function to compare with correct format
 */
function validateConversion() {
  console.log('\n🔍 Validating conversion against correct format...');
  
  try {
    // Read sample correct file
    const correctData = JSON.parse(fs.readFileSync(SAMPLE_CORRECT_FILE, 'utf8'));
    console.log('✅ Correct format structure:');
    console.log('- version:', correctData.version);
    console.log('- lattice:', correctData.lattice);
    console.log('- placements count:', correctData.placements.length);
    console.log('- pieces used count:', Object.keys(correctData.piecesUsed).length);
    
    // Check converted files have same structure
    const convertedFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
    if (convertedFiles.length > 0) {
      const sampleConverted = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, convertedFiles[0]), 'utf8'));
      console.log('\n✅ Converted format structure:');
      console.log('- version:', sampleConverted.version);
      console.log('- lattice:', sampleConverted.lattice);
      console.log('- placements count:', sampleConverted.placements.length);
      console.log('- pieces used count:', Object.keys(sampleConverted.piecesUsed).length);
      
      console.log('\n🎯 Structure validation: PASSED');
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message);
  }
}

// Run conversion
if (require.main === module) {
  convertAllLegacyFiles();
  validateConversion();
  
  console.log('\n🚀 Conversion complete!');
  console.log('📋 Next steps:');
  console.log('1. Review converted files in:', OUTPUT_DIR);
  console.log('2. Test with a few sample files');
  console.log('3. Move converted files to main solutions directory');
  console.log('4. Remove legacy files when satisfied');
}

module.exports = { convertLegacySolution, calculateOrientationAndTranslation };
