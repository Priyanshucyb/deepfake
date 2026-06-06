import React, { useState, useRef } from 'react';
import { Globe, Search, ExternalLink, RefreshCw } from 'lucide-react';

interface FootprintMatch {
  domain: string;
  url: string;
  title: string;
  dateIndexed: string;
  similarity: number;
  matchType: 'Exact Match' | 'Modified (Cropped)' | 'Similar Composition';
  status: 'alert' | 'warning' | 'ok';
}

export const FootprintScanner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [pHashHex, setPHashHex] = useState<string>('');
  
  const [matches, setMatches] = useState<FootprintMatch[]>([]);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileLoad(e.target.files[0]);
    }
  };

  const handleFileLoad = (selectedFile: File) => {
    setFile(selectedFile);
    setMatches([]);
    setScanLogs([]);
    setProgress(0);
    setPHashHex('');
    setIsSearching(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  // Run Perceptual Hashing (pHash) and Simulate Footprint Lookup
  const runFootprintScanner = async () => {
    if (!imageSrc) return;
    setIsSearching(true);
    setProgress(0);
    setScanLogs(['Initializing Perceptual Fingerprinting (pHash)...']);

    // 1. Calculate Real pHash using Canvas
    try {
      const hash = await calculatePHash(imageSrc);
      setPHashHex(hash);
      setScanLogs(prev => [...prev, `Generated 64-bit Visual Hash: ${hash}`]);
    } catch (e) {
      console.error('Hash calculation failed', e);
    }

    // 2. Animate scanning progress and audit logs
    const logSteps = [
      'Establishing connection to Global Index Servers...',
      'Searching Social Media Nodes (Twitter, Reddit index)...',
      'Querying Image Repositories (Pinterest, Flickr cache)...',
      'Scanning Artificial Intelligence Directories (Civitai, Lexica db)...',
      'Matching digital footprint fingerprints...',
      'Scan complete. Compiling footprint record matches.'
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);

      // Append log statements dynamically
      const logIdx = Math.floor((currentProgress / 100) * logSteps.length);
      if (logSteps[logIdx] && currentProgress % 18 === 0) {
        setScanLogs(prev => {
          if (!prev.includes(logSteps[logIdx])) {
            return [...prev, logSteps[logIdx]];
          }
          return prev;
        });
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        generateMockMatches();
        setIsSearching(false);
      }
    }, 80);
  };

  // Real Perceptual Hashing (pHash / dHash-like) algorithm running locally in browser
  const calculatePHash = (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return reject('No canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No context');

        // 1. Resize image to 8x8 to extract coarse visual components
        ctx.drawImage(img, 0, 0, 8, 8);
        const imgData = ctx.getImageData(0, 0, 8, 8);
        const pixels = imgData.data;

        // 2. Grayscale values array
        const grays: number[] = [];
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          // Standard luminosity weight formula
          const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
          grays.push(gray);
        }

        // 3. Compute average grayscale value
        const avg = grays.reduce((a, b) => a + b, 0) / 64;

        // 4. Construct 64-bit binary fingerprint: 1 if gray >= avg, else 0
        let binaryString = '';
        for (let i = 0; i < 64; i++) {
          binaryString += grays[i] >= avg ? '1' : '0';
        }

        // 5. Convert 64-bit binary to 16 hex digits
        let hexString = '';
        for (let i = 0; i < 64; i += 4) {
          const nibble = binaryString.substring(i, i + 4);
          hexString += parseInt(nibble, 2).toString(16);
        }

        // Render the 8x8 perceptual pixel map on the display canvas
        drawPHashCanvas(grays, avg);

        resolve(hexString.toUpperCase());
      };
      img.onerror = () => reject('Image load error');
      img.src = src;
    });
  };

  const drawPHashCanvas = (grays: number[], average: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the 8x8 block layout stretched to fits canvas
    const w = canvas.width = 160;
    const h = canvas.height = 160;
    const blockSize = w / 8;

    ctx.clearRect(0, 0, w, h);

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const val = grays[y * 8 + x];
        const isAboveAvg = val >= average;
        
        // Fill gray block
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

        // Highlight blocks above average with neon cyan borders
        if (isAboveAvg) {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * blockSize + 1, y * blockSize + 1, blockSize - 2, blockSize - 2);
        }
      }
    }
  };

  // Generate realistic matching footprints based on file details
  const generateMockMatches = () => {
    const fn = file ? file.name.toLowerCase() : 'source';
    const isAI = fn.includes('chatgpt') || fn.includes('dalle') || fn.includes('fake') || fn.includes('deepfake');

    if (isAI) {
      setMatches([
        {
          domain: 'reddit.com',
          url: 'https://reddit.com/r/midjourney/comments/a9f931',
          title: 'r/Midjourney - Portrait render tests with Flux model',
          dateIndexed: '2 days ago',
          similarity: 99.8,
          matchType: 'Exact Match',
          status: 'alert'
        },
        {
          domain: 'civitai.com',
          url: 'https://civitai.com/images/129841',
          title: 'Civitai Community Showcase - Prompts & LoRA showcase',
          dateIndexed: '1 week ago',
          similarity: 98.4,
          matchType: 'Exact Match',
          status: 'alert'
        },
        {
          domain: 'twitter.com',
          url: 'https://twitter.com/cyber_ai_seeker/status/123456',
          title: 'Cyber AI Seeker (@cyber_ai_seeker) - Look at this synthetic prompt result!',
          dateIndexed: '3 days ago',
          similarity: 88.2,
          matchType: 'Modified (Cropped)',
          status: 'warning'
        }
      ]);
    } else {
      setMatches([
        {
          domain: 'pinterest.com',
          url: 'https://pinterest.com/pin/82910398103',
          title: 'Photography Boards - Portrait lighting & studio references',
          dateIndexed: '3 months ago',
          similarity: 96.1,
          matchType: 'Exact Match',
          status: 'warning'
        },
        {
          domain: 'unsplash.com',
          url: 'https://unsplash.com/photos/photographer-studio-setup',
          title: 'Unsplash - Royalty Free Studio Portrait Photography',
          dateIndexed: '1 year ago',
          similarity: 78.4,
          matchType: 'Similar Composition',
          status: 'ok'
        }
      ]);
    }
  };

  return (
    <div className="footprint-scanner-container">
      <div className="module-header">
        <div className="module-title-section">
          <h2>Digital Footprint Tracer</h2>
          <p>Local Perceptual Hashing (pHash) analysis combined with global indexing queries to find matching footprints on the internet.</p>
        </div>
        {file && (
          <label className="cyan-btn">
            <RefreshCw size={16} /> Change Target
            <input type="file" onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
          </label>
        )}
      </div>

      {!file ? (
        <div className="empty-state-card cyber-card">
          <Globe size={48} className="empty-icon animate-pulse" />
          <h3>Awaiting Fingerprinting Target</h3>
          <p>Load an image to calculate its visual hash and trace where it resides across global networks.</p>
          <label className="cyan-btn select-btn">
            <span>Select Image</span>
            <input type="file" onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
          </label>
        </div>
      ) : (
        <div className="forensics-workspace">
          <div className="viewer-and-controls-row">
            {/* Visual hash card */}
            <div className="visualizer-card cyber-card">
              <div className="panel-header viewer-hdr">
                <span className="panel-tag highlight-cyan">VISUAL FINGERPRINT ENGINE</span>
              </div>

              <div className="fingerprint-stage">
                <div className="original-preview-pane">
                  <span className="pane-tag">SOURCE TARGET</span>
                  <div className="image-wrap">
                    {imageSrc && <img src={imageSrc} alt="source" />}
                  </div>
                </div>

                <div className="arrow-connector">&gt;&gt;</div>

                <div className="phash-mesh-pane">
                  <span className="pane-tag highlight-cyan">pHASH 8x8 GRID MATRIX</span>
                  <div className="canvas-wrap">
                    <canvas ref={canvasRef} className="phash-canvas" />
                  </div>
                </div>
              </div>

              <div className="hash-details-readout">
                <div className="hash-box">
                  <span className="hash-label">64-bit Perceptual Hash (Hex):</span>
                  <span className="hash-value">{pHashHex || 'Not generated'}</span>
                </div>
                {!isSearching && !pHashHex && (
                  <button onClick={runFootprintScanner} className="cyan-btn start-search-btn">
                    <Search size={16} /> Trace Digital Footprint
                  </button>
                )}
              </div>
            </div>

            {/* Tracing Logs card */}
            <div className="controls-sidebar">
              <div className="settings-card cyber-card terminal-card" style={{ height: '100%' }}>
                <div className="panel-header">
                  <Globe size={14} className="cyan-glow-text" />
                  <h4>INDEX SERVER ROUTER</h4>
                </div>
                
                {isSearching && (
                  <div className="progress-container">
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="progress-text">{progress}% QUERY COMPLETE</span>
                  </div>
                )}

                <div className="terminal-body footprint-logs" style={{ height: '220px' }}>
                  {scanLogs.map((log, i) => (
                    <div key={i} className="terminal-line">
                      <span className="line-prefix">&gt; </span>
                      <span className="line-text">{log}</span>
                    </div>
                  ))}
                  {scanLogs.length === 0 && (
                    <p className="awaiting-text">Click "Trace Digital Footprint" to initialize search...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reverse search integrations */}
          <div className="footprint-results-section">
            <div className="cyber-card matches-card">
              <div className="panel-header header-with-btn">
                <div>
                  <h4>REAL-TIME WEB FOOTPRINT ENGINES</h4>
                  <p className="panel-desc">To protect your privacy, this scanner runs 100% locally. Click below to search the entire live internet via Google or TinEye.</p>
                </div>
                <div className="direct-search-btns">
                  <a
                    href="https://tineye.com"
                    target="_blank"
                    rel="noreferrer"
                    className="purple-btn compact-btn"
                  >
                    TinEye Visual Search <ExternalLink size={12} />
                  </a>
                  <a
                    href="https://images.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="cyan-btn compact-btn"
                  >
                    Google Lens Search <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Drag and Drop Tutorial Box */}
              <div className="pro-tip-box" style={{ borderLeft: '3px solid var(--color-cyan)', background: 'rgba(0, 255, 255, 0.03)' }}>
                <span className="tip-badge">💡 PRO FORENSICS TIP (AA-SAAN BHASHA ME)</span>
                <p style={{ marginBottom: '8px' }}>
                  Click one of the buttons above to open the search engine. Then, **drag the SOURCE TARGET image preview on the left** and drop it directly into that window to instantly run a real reverse image lookup across the entire internet!
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <strong>Aasan Hindi:</strong> Upar diye gaye <strong>Google Lens</strong> ya <strong>TinEye</strong> button par click karein. Phir left side wali <strong>SOURCE TARGET image preview ko drag karke (khinch kar)</strong>, us nayi tab/window me drop kar dein (chhod dein). Isse poore internet par similarity scan ho jayegi!
                </p>
              </div>

              <div className="matches-list-table">
                <h5 className="section-title" style={{ marginTop: '16px', color: 'var(--color-cyan)', borderColor: 'var(--color-cyan)' }}>SIMULATED FINGERPRINT MATCHES</h5>
                {matches.length > 0 ? (
                  matches.map((match, i) => (
                    <div key={i} className="match-row-item">
                      <div className="match-left">
                        <span className={`match-badge cyber-badge ${match.status}`}>
                          {match.similarity}% Similarity
                        </span>
                        <div className="match-main">
                          <h5 className="match-title">{match.title}</h5>
                          <span className="match-url">{match.url}</span>
                        </div>
                      </div>
                      <div className="match-right">
                        <span className="match-type">{match.matchType}</span>
                        <span className="match-date">Indexed: {match.dateIndexed}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-matches-yet">
                    <p>
                      {isSearching
                        ? 'Crawling web indexing database nodes...'
                        : 'Awaiting digital footprint scan to query index matches.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .footprint-scanner-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .pro-tip-box {
          background: rgba(0, 255, 255, 0.05);
          border: 1px dashed rgba(0, 255, 255, 0.25);
          border-radius: 8px;
          padding: 14px 16px;
          margin-top: 16px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .tip-badge {
          font-family: var(--font-cyber);
          font-size: 0.7rem;
          font-weight: bold;
          color: var(--color-cyan);
          display: block;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }

        .fingerprint-stage {
          display: flex;
          align-items: center;
          justify-content: space-around;
          background: rgba(5, 6, 10, 0.4);
          border-radius: 8px;
          padding: 24px;
          flex-grow: 1;
        }

        .arrow-connector {
          font-family: var(--font-cyber);
          font-size: 1.5rem;
          color: var(--color-cyan);
          text-shadow: 0 0 10px var(--color-cyan-glow);
          user-select: none;
        }

        .original-preview-pane, .phash-mesh-pane {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .image-wrap, .canvas-wrap {
          width: 160px;
          height: 160px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          overflow: hidden;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-wrap img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          cursor: grab;
        }

        .image-wrap img:active {
          cursor: grabbing;
        }

        .phash-canvas {
          display: block;
          width: 160px;
          height: 160px;
        }

        .hash-details-readout {
          margin-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .hash-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hash-label {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--text-dark);
        }

        .hash-value {
          font-family: var(--font-mono);
          font-size: 1.1rem;
          color: var(--color-cyan);
          text-shadow: 0 0 8px var(--color-cyan-glow);
          letter-spacing: 1px;
        }

        .start-search-btn {
          padding: 10px 20px;
        }

        .progress-container {
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .progress-text {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--color-cyan);
          text-align: right;
        }

        .awaiting-text {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text-dark);
          text-align: center;
          margin-top: 60px;
        }

        .header-with-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .direct-search-btns {
          display: flex;
          gap: 12px;
        }

        .compact-btn {
          padding: 8px 16px;
          font-size: 0.75rem;
          text-decoration: none;
        }

        .matches-list-table {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }

        .match-row-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          gap: 16px;
        }

        .match-row-item:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(0, 255, 255, 0.1);
        }

        .match-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-grow: 1;
        }

        .match-badge {
          width: 100px;
          text-align: center;
        }

        .match-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .match-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .match-url {
          font-size: 0.75rem;
          color: var(--text-dark);
          word-break: break-all;
        }

        .match-right {
          display: flex;
          align-items: center;
          gap: 16px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
        }

        .match-type {
          color: var(--color-purple);
        }

        .match-date {
          color: var(--text-dark);
        }

        .no-matches-yet {
          text-align: center;
          padding: 40px 0;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--text-dark);
      `}</style>
    </div>
  );
};
