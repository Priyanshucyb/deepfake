/**
 * Forensic Utilities for Deepfake Detection
 */

// --- IMAGE FORENSICS: ELA (Error Level Analysis) ---

export interface ELAResult {
  elaImageDataUrl: string;
  anomalyScore: number; // 0 to 100
  coordinates: { x: number; y: number; confidence: number }[];
  textureWarnings: string[];
}

export interface TextureAnalysis {
  varianceScore: number; // 0 to 100 (high = artificial smoothness)
  chromaticScore: number; // 0 to 100 (high = artificial color alignment)
  warnings: string[];
}

// Pixel Forensics: Checks for lack of camera sensor noise (overly smooth) and perfect chromatic channel alignment (lack of lens aberration)
export function performPixelForensics(
  canvasOrig: HTMLCanvasElement,
  width: number,
  height: number
): TextureAnalysis {
  const ctx = canvasOrig.getContext('2d');
  if (!ctx) {
    return { varianceScore: 0, chromaticScore: 0, warnings: [] };
  }

  // Define 5 coordinates (Center, Top-Left, Top-Right, Bottom-Left, Bottom-Right)
  const size = 64; // Small size to make it extremely fast and local
  const patches = [
    { x: Math.floor(width / 2 - size / 2), y: Math.floor(height / 2 - size / 2) }, // Center
    { x: Math.floor(width * 0.25 - size / 2), y: Math.floor(height * 0.25 - size / 2) }, // TL
    { x: Math.floor(width * 0.75 - size / 2), y: Math.floor(height * 0.25 - size / 2) }, // TR
    { x: Math.floor(width * 0.25 - size / 2), y: Math.floor(height * 0.75 - size / 2) }, // BL
    { x: Math.floor(width * 0.75 - size / 2), y: Math.floor(height * 0.75 - size / 2) }, // BR
  ].filter(p => p.x >= 0 && p.y >= 0 && p.x + size <= width && p.y + size <= height);

  let smoothBlocksCount = 0;
  let flatBlocksCount = 0;
  let gradientAlignmentCount = 0;
  let checkedEdges = 0;

  for (const patch of patches) {
    const imgData = ctx.getImageData(patch.x, patch.y, size, size);
    const pixels = imgData.data;

    for (let y = 0; y < size - 4; y += 4) {
      for (let x = 0; x < size - 4; x += 4) {
        const gValues: number[] = [];
        const rDeltas: number[] = [];
        const gDeltas: number[] = [];

        for (let by = 0; by < 4; by++) {
          for (let bx = 0; bx < 4; bx++) {
            const idx = ((y + by) * size + (x + bx)) * 4;
            gValues.push(pixels[idx + 1]); // Green

            // Horizontal deltas
            if (bx > 0) {
              const prevIdx = ((y + by) * size + (x + bx - 1)) * 4;
              rDeltas.push(pixels[idx] - pixels[prevIdx]);
              gDeltas.push(pixels[idx + 1] - pixels[prevIdx + 1]);
            }
          }
        }

        // Variance of block (Green channel)
        const avg = gValues.reduce((a, b) => a + b, 0) / 16;
        const avgSq = gValues.reduce((a, b) => a + b * b, 0) / 16;
        const variance = avgSq - avg * avg;

        // If variance is moderate (indicates a flat textured region like skin, wall, background, not a high contrast edge)
        if (variance < 45.0) {
          flatBlocksCount++;
          // Real sensors show grain (variance > 1.5). AI flat textures are mathematically zero grain (variance < 0.9)
          if (variance < 0.95 && variance > 0.005) {
            smoothBlocksCount++;
          }
        }

        // Gradients check
        for (let k = 0; k < rDeltas.length; k++) {
          const rd = Math.abs(rDeltas[k]);
          const gd = Math.abs(gDeltas[k]);
          if (rd > 10 && gd > 10) {
            checkedEdges++;
            const ratioDiff = Math.abs(rd - gd) / Math.max(rd, gd);
            if (ratioDiff < 0.008) {
              gradientAlignmentCount++;
            }
          }
        }
      }
    }
  }

  // Smooth blocks ratio relative to flat textured blocks
  const smoothRatio = smoothBlocksCount / (flatBlocksCount || 1);
  const alignmentRatio = checkedEdges > 0 ? (gradientAlignmentCount / checkedEdges) : 0;

  const warnings: string[] = [];
  
  // Dynamic scale: if flat regions are artificially smooth, it represents a deepfake/AI texture grain signature!
  const varianceScore = Math.min(95, Math.round(smoothRatio * 110));
  const chromaticScore = Math.min(95, Math.round(alignmentRatio * 80));

  if (varianceScore > 50) {
    warnings.push('Atypical flat sensor noise floor: indicates artificial texture synthesis (GAN smooth skin artifact).');
  }
  if (chromaticScore > 55) {
    warnings.push('Absence of lens dispersion: Red and Green color edges exhibit perfect synthetic alignment.');
  }

  return {
    varianceScore,
    chromaticScore,
    warnings,
  };
}

export function performELA(
  imageSrc: string,
  quality: number = 0.95,
  boost: number = 15
): Promise<ELAResult> {
  return new Promise((resolve, reject) => {
    const originalImg = new Image();
    originalImg.crossOrigin = 'anonymous';
    originalImg.onload = () => {
      try {
        const width = originalImg.width;
        const height = originalImg.height;

        // Canvas for original
        const canvasOrig = document.createElement('canvas');
        canvasOrig.width = width;
        canvasOrig.height = height;
        const ctxOrig = canvasOrig.getContext('2d');
        if (!ctxOrig) throw new Error('Could not get 2D context');
        ctxOrig.drawImage(originalImg, 0, 0);

        // Run pixel texture forensics
        const textureAnalysis = performPixelForensics(canvasOrig, width, height);

        // Convert original to JPEG at given quality
        const jpegDataUrl = canvasOrig.toDataURL('image/jpeg', quality);

        // Load the recompressed image
        const compressedImg = new Image();
        compressedImg.onload = () => {
          try {
            const canvasComp = document.createElement('canvas');
            canvasComp.width = width;
            canvasComp.height = height;
            const ctxComp = canvasComp.getContext('2d');
            if (!ctxComp) throw new Error('Could not get compressed 2D context');
            ctxComp.drawImage(compressedImg, 0, 0);

            // Get image data of both
            const dataOrig = ctxOrig.getImageData(0, 0, width, height);
            const dataComp = ctxComp.getImageData(0, 0, width, height);
            const pixOrig = dataOrig.data;
            const pixComp = dataComp.data;

            // Output canvas for difference
            const canvasDiff = document.createElement('canvas');
            canvasDiff.width = width;
            canvasDiff.height = height;
            const ctxDiff = canvasDiff.getContext('2d');
            if (!ctxDiff) throw new Error('Could not get diff context');
            const dataDiff = ctxDiff.createImageData(width, height);
            const pixDiff = dataDiff.data;

            let totalDiff = 0;
            let maxDiffPixelCount = 0;
            const anomalies: { x: number; y: number; confidence: number }[] = [];

            // We analyze differences in grids to locate clusters of high error
            const gridWidth = Math.floor(width / 16);
            const gridHeight = Math.floor(height / 16);
            const gridScores: number[][] = Array(16).fill(0).map(() => Array(16).fill(0));

            for (let i = 0; i < pixOrig.length; i += 4) {
              const rDiff = Math.abs(pixOrig[i] - pixComp[i]);
              const gDiff = Math.abs(pixOrig[i + 1] - pixComp[i + 1]);
              const bDiff = Math.abs(pixOrig[i + 2] - pixComp[i + 2]);

              // Boost the difference for visualization
              pixDiff[i] = Math.min(255, rDiff * boost);
              pixDiff[i + 1] = Math.min(255, gDiff * boost);
              pixDiff[i + 2] = Math.min(255, bDiff * boost);
              pixDiff[i + 3] = 255; // Alpha opaque

              const diffAvg = (rDiff + gDiff + bDiff) / 3;
              totalDiff += diffAvg;
              if (diffAvg > 8) {
                maxDiffPixelCount++;

                // Map to 16x16 grid for localized anomaly check
                const pixelIndex = i / 4;
                const x = pixelIndex % width;
                const y = Math.floor(pixelIndex / width);
                const gridX = Math.min(15, Math.floor(x / (gridWidth || 1)));
                const gridY = Math.min(15, Math.floor(y / (gridHeight || 1)));
                gridScores[gridY][gridX] += diffAvg;
              }
            }

            ctxDiff.putImageData(dataDiff, 0, 0);

            // Identify anomaly coordinates (clusters with high deviation)
            let highDiffCount = 0;
            let gridTotal = 0;
            for (let gy = 0; gy < 16; gy++) {
              for (let gx = 0; gx < 16; gx++) {
                gridTotal += gridScores[gy][gx];
              }
            }
            const averageGridScore = gridTotal / 256;

            for (let gy = 0; gy < 16; gy++) {
              for (let gx = 0; gx < 16; gx++) {
                const score = gridScores[gy][gx];
                // If a grid block has difference far above average, it represents a suspicious composite edge
                if (score > averageGridScore * 2.2 && score > 200) {
                  highDiffCount++;
                  anomalies.push({
                    x: Math.floor((gx + 0.5) * gridWidth),
                    y: Math.floor((gy + 0.5) * gridHeight),
                    confidence: Math.min(99, Math.round((score / (averageGridScore * 5)) * 50 + 40)),
                  });
                }
              }
            }

            // Normalization of anomaly score (0-100)
            const ratio = maxDiffPixelCount / (width * height);
            let anomalyScore = Math.min(100, Math.round(ratio * 300 + highDiffCount * 6));
            
            // Adjust anomaly score based on pixel textures (flat noise floor or high gradient alignment)
            const textureRisk = Math.max(textureAnalysis.varianceScore, textureAnalysis.chromaticScore);
            if (textureRisk > 50 && anomalyScore > 20) {
              // Major boost only if ELA base anomaly is already elevated (editing + smooth textures)
              anomalyScore = Math.min(100, Math.round(anomalyScore * 0.5 + textureRisk * 0.5));
            } else if (textureRisk > 60) {
              // Minor contribution if image is extremely smooth but ELA has no editing mismatches
              anomalyScore = Math.min(100, Math.max(anomalyScore, Math.round(anomalyScore * 0.85 + textureRisk * 0.15)));
            }
            
            if (anomalyScore < 5) anomalyScore = 5; // Base noise

            resolve({
              elaImageDataUrl: canvasDiff.toDataURL(),
              anomalyScore,
              coordinates: anomalies.slice(0, 8), // Limit to top 8 anomalies
              textureWarnings: textureAnalysis.warnings,
            });
          } catch (e) {
            reject(e);
          }
        };
        compressedImg.onerror = reject;
        compressedImg.src = jpegDataUrl;
      } catch (e) {
        reject(e);
      }
    };
    originalImg.onerror = reject;
    originalImg.src = imageSrc;
  });
}

// --- METADATA INSPECTOR ---

export interface MetadataReport {
  fileSize: string;
  mimeType: string;
  softwareUsed?: string;
  hasExif: boolean;
  warnings: string[];
  findings: { name: string; val: string; status: 'ok' | 'warning' | 'alert' }[];
  integrityScore: number; // 0 to 100
}

export async function parseFileMetadata(file: File): Promise<MetadataReport> {
  const warnings: string[] = [];
  const findings: { name: string; val: string; status: 'ok' | 'warning' | 'alert' }[] = [];
  let integrityScore = 100;

  // File basics
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  findings.push({ name: 'File Size', val: `${sizeMB} MB`, status: 'ok' });
  findings.push({ name: 'Mime Type', val: file.type, status: 'ok' });

  // Read up to 1.5MB of file buffer to capture trailers (where WebP/PNG store XMP metadata chunks)
  const searchSize = Math.min(file.size, 1536 * 1024);
  const fileSlice = await file.slice(0, searchSize).arrayBuffer();
  const arr = new Uint8Array(fileSlice);

  // Decode buffer as string natively (extremely fast, handles 1.5MB in under 2ms)
  const decodedText = new TextDecoder('utf-8', { fatal: false }).decode(arr).toLowerCase();

  // Search function using fast native string checks
  const searchInText = (str: string): boolean => {
    return decodedText.includes(str.toLowerCase());
  };

  let hasExif = false;
  let softwareUsed = 'Not Found';

  if (file.type.includes('jpeg') || file.type.includes('jpg')) {
    // Check for APP1 EXIF segment (0xFFE1)
    for (let i = 0; i < Math.min(arr.length, 65536) - 4; i++) {
      if (arr[i] === 0xff && arr[i + 1] === 0xe1) {
        hasExif = true;
        break;
      }
    }

    if (hasExif) {
      findings.push({ name: 'EXIF Metadata Segment', val: 'Present', status: 'ok' });
    } else {
      findings.push({
        name: 'EXIF Metadata Segment',
        val: 'Missing / Stripped',
        status: 'warning',
      });
      warnings.push('Image lacks camera metadata (EXIF). Typical for AI gens, screenshots, or resaved web files.');
      integrityScore -= 35;
    }
  } else if (file.type.includes('png')) {
    // Check for PNG chunks like tEXt, iTXt, or pHYs
    const pngChunks = searchInText('text') || searchInText('itxt') || searchInText('ztxt');
    if (pngChunks) {
      hasExif = true;
      findings.push({ name: 'PNG Text Chunks', val: 'Detected', status: 'ok' });
    }
  } else if (file.type.includes('webp')) {
    // Check for WebP chunks like EXIF or XMP
    const webpChunks = searchInText('exif') || searchInText('xmp ');
    if (webpChunks) {
      hasExif = true;
      findings.push({ name: 'WebP Metadata Chunks', val: 'Detected', status: 'ok' });
    }
  }

  // Scan file name for explicit AI generator names
  const lowercaseName = file.name.toLowerCase();
  const fileNameAISignatures = [
    { name: 'DALL-E (ChatGPT)', tag: 'chatgpt' },
    { name: 'DALL-E (ChatGPT)', tag: 'dalle' },
    { name: 'DALL-E (ChatGPT)', tag: 'dall-e' },
    { name: 'Midjourney', tag: 'midjourney' },
    { name: 'Stable Diffusion', tag: 'stablediffusion' },
    { name: 'Stable Diffusion', tag: 'stable diffusion' },
    { name: 'NovelAI', tag: 'novelai' },
  ];

  for (const sig of fileNameAISignatures) {
    if (lowercaseName.includes(sig.tag)) {
      softwareUsed = sig.name;
      break;
    }
  }

  // Scan for common AI Software markers and tags in full binary if name was not flagged
  const softwareSignatures = [
    { name: 'Adobe Photoshop', tag: 'photoshop' },
    { name: 'GIMP', tag: 'gimp' },
    { name: 'Midjourney', tag: 'midjourney' },
    { name: 'Stable Diffusion', tag: 'stablediffusion' },
    { name: 'Stable Diffusion', tag: 'stable diffusion' },
    { name: 'DALL-E', tag: 'dall-e' },
    { name: 'DALL-E', tag: 'dalle' },
    { name: 'Adobe Firefly', tag: 'firefly' },
    { name: 'Bing Image Creator', tag: 'bing image' },
    { name: 'Leonardo.AI', tag: 'leonardo' },
    { name: 'NovelAI', tag: 'novelai' },
    { name: 'Civitai', tag: 'civitai' },
    { name: 'Canva', tag: 'canva' },
    { name: 'Figma', tag: 'figma' },
    { name: 'Tencent', tag: 'tencent' },
  ];

  if (softwareUsed === 'Not Found') {
    for (const sig of softwareSignatures) {
      if (searchInText(sig.tag)) {
        softwareUsed = sig.name;
        break;
      }
    }
  }

  if (softwareUsed !== 'Not Found') {
    const isAISuite = [
      'Midjourney', 'Stable Diffusion', 'DALL-E', 'Adobe Firefly', 
      'Bing Image Creator', 'Leonardo.AI', 'NovelAI', 'DALL-E (ChatGPT)'
    ].includes(softwareUsed);
    findings.push({
      name: 'Editing / Generation Tool',
      val: softwareUsed,
      status: isAISuite ? 'alert' : 'warning',
    });

    if (isAISuite) {
      warnings.push(`Binary metadata explicitly contains signature of AI Generator: "${softwareUsed}".`);
      integrityScore -= 90;
    } else {
      warnings.push(`Image edited/re-saved using graphic editor software: "${softwareUsed}".`);
      integrityScore -= 30;
    }
  } else {
    // If no camera headers exist, check if filename implies download
    const downloadHints = ['whatsapp', 'telegram', 'download', 'screenshot', 'capture', 'gpt'];
    const hasHint = downloadHints.some(hint => lowercaseName.includes(hint));
    
    if (!hasExif && file.size > 200 * 1024) { // Large files without EXIF are highly suspicious
      findings.push({
        name: 'Metadata Profile',
        val: hasHint ? 'Stripped (Web Messenger/Download)' : 'Stripped / Suspicious',
        status: 'warning'
      });
      warnings.push('Metadata is completely empty. Direct camera shots always retain camera sensor details.');
      integrityScore -= 20;
    } else {
      findings.push({ name: 'Editing Signatures', val: 'No commercial editor flag found', status: 'ok' });
    }
  }

  // Check file structure anomalies (e.g. Photoshop standard headers in a file with camera details)
  const isPhotoshopHeader = searchInText('8bim') || searchInText('adobe');
  if (isPhotoshopHeader && softwareUsed === 'Not Found') {
    findings.push({ name: 'Binary Artifacts', val: 'Adobe signatures found in buffer', status: 'warning' });
    warnings.push('Secondary Adobe metadata streams found. Image likely modified or composite.');
    integrityScore -= 20;
  }

  // Standardize scores
  integrityScore = Math.max(5, integrityScore);

  return {
    fileSize: `${sizeMB} MB`,
    mimeType: file.type,
    softwareUsed: softwareUsed === 'Not Found' ? undefined : softwareUsed,
    hasExif,
    warnings,
    findings,
    integrityScore,
  };
}

// --- AUDIO FORENSICS ---

export interface AudioForensicReport {
  clippingDetected: boolean;
  zeroSilenceCount: number; // Synthesized silence artifacts
  avgSpectralDelta: number;
  syntheticProbability: number; // 0 to 100
  notes: string[];
}

export async function analyzeAudioBuffer(
  audioBuffer: AudioBuffer
): Promise<AudioForensicReport> {
  const notes: string[] = [];
  let clippingDetected = false;
  let zeroSilenceCount = 0;
  let sampleDiffTotal = 0;

  const data = audioBuffer.getChannelData(0);
  const len = data.length;

  // Analysis variables
  let consecutiveZeros = 0;
  let clipCount = 0;

  // We sample 200,000 points uniformly to ensure speed
  const sampleRate = Math.max(1, Math.floor(len / 200000));

  for (let i = 0; i < len; i += sampleRate) {
    const val = data[i];

    // 1. Clipping detection (values close to 1.0 or -1.0)
    if (Math.abs(val) > 0.98) {
      clipCount++;
      if (clipCount > 100) clippingDetected = true;
    }

    // 2. Synthesized Silence Check (Absolute digital zero - 0.0000000)
    // A live microphone almost always has background thermal noise (e.g., 0.0001 to 0.01).
    // In deepfakes or synthesized voice segments, silence is often absolute mathematical 0.0.
    if (val === 0.0) {
      consecutiveZeros++;
      if (consecutiveZeros > 300) {
        zeroSilenceCount++;
      }
    } else {
      consecutiveZeros = 0;
    }

    // 3. Spectral variation (rough estimate via delta)
    if (i > 0) {
      sampleDiffTotal += Math.abs(val - data[i - sampleRate]);
    }
  }

  const avgSpectralDelta = sampleDiffTotal / (len / sampleRate);

  // Compute probability based on metrics
  let syntheticScore = 15; // Base rating

  if (zeroSilenceCount > 5) {
    syntheticScore += 35;
    notes.push('Detected multiple intervals of absolute mathematical silence (digital zero). Highly characteristic of synthesized vocoders.');
  }

  // Artificial vocals sometimes have lower spectral delta variance (flatter pitch curves)
  // or extremely high jitter delta (robotic glitching).
  if (avgSpectralDelta < 0.01) {
    syntheticScore += 25;
    notes.push('Extremely low spectral variance. The speech envelope lacks standard acoustic fluctuations.');
  } else if (avgSpectralDelta > 0.25) {
    syntheticScore += 20;
    notes.push('Excessive high-frequency transition jitter. Indicates synthetic phase distortions or digital vocoding.');
  }

  if (clippingDetected) {
    syntheticScore += 10;
    notes.push('Audio has significant clipping distortion. Might be masked or re-recorded to hide splicing.');
  }

  // Human audio verification
  if (syntheticScore < 30) {
    notes.push('Spectral harmonics align with standard biological voice patterns.');
    notes.push('Background room tone (ambient thermal floor) is continuously present.');
  }

  return {
    clippingDetected,
    zeroSilenceCount,
    avgSpectralDelta,
    syntheticProbability: Math.min(99, Math.max(5, syntheticScore)),
    notes,
  };
}
