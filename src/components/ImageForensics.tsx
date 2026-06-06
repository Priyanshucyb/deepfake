import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Info, Image as ImageIcon } from 'lucide-react';
import { performELA, parseFileMetadata, type ELAResult, type MetadataReport } from '../utils/forensics';
import { ReportExporter } from './ReportExporter';

interface ImageForensicsProps {
  initialFile: File | null;
  onAnalysisUpdate: (scores: { image?: number; metadata?: number }, warnings: string[]) => void;
}

export const ImageForensics: React.FC<ImageForensicsProps> = ({
  initialFile,
  onAnalysisUpdate
}) => {
  const [file, setFile] = useState<File | null>(initialFile);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [quality, setQuality] = useState<number>(0.95);
  const [boost, setBoost] = useState<number>(15);

  const [elaResult, setElaResult] = useState<ELAResult | null>(null);
  const [metadataReport, setMetadataReport] = useState<MetadataReport | null>(null);

  const [viewMode, setViewMode] = useState<'side-by-side' | 'ela-only' | 'overlay'>('side-by-side');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.5);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialFile) {
      handleFileLoad(initialFile);
    }
  }, [initialFile]);

  // Run ELA analysis when quality, boost, or imageSrc change
  useEffect(() => {
    if (!imageSrc) return;
    runForensics();
  }, [imageSrc, quality, boost]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileLoad(e.target.files[0]);
    }
  };

  const handleFileLoad = (selectedFile: File) => {
    setFile(selectedFile);
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const runForensics = async () => {
    if (!imageSrc || !file) return;
    setIsAnalyzing(true);

    try {
      // 1. Run Error Level Analysis
      const ela = await performELA(imageSrc, quality, boost);
      setElaResult(ela);

      // 2. Parse EXIF and Editor Tags
      const meta = await parseFileMetadata(file);
      setMetadataReport(meta);

      // 3. Callback parent to update global state for Node Map and Dashboard stats
      onAnalysisUpdate(
        { image: ela.anomalyScore, metadata: meta.integrityScore },
        [...meta.warnings, ...ela.textureWarnings]
      );
    } catch (err) {
      console.error('Forensics failure:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="image-forensics-container" ref={containerRef}>
      <div className="module-header">
        <div className="module-title-section">
          <h2>Image Forensics Lab</h2>
          <p>Double compression analysis, JPEG grid artifact identification, and metadata integrity tests.</p>
        </div>
        {!file && (
          <label className="cyan-btn">
            <ImageIcon size={16} /> Load Target Image
            <input type="file" onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
          </label>
        )}
      </div>

      {!file ? (
        <div className="empty-state-card cyber-card">
          <ImageIcon size={48} className="empty-icon" />
          <h3>No Image File Loaded</h3>
          <p>Please load a JPEG, PNG or WebP image to begin forensic inspection.</p>
          <label className="cyan-btn select-btn">
            <span>SELECT IMAGE</span>
            <input type="file" onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
          </label>
        </div>
      ) : (
        <div className="forensics-workspace">
          <div className="viewer-and-controls-row">
            {/* Visualizer card */}
            <div className="visualizer-card cyber-card">
              <div className="panel-header viewer-hdr">
                <div className="viewer-tabs">
                  <button
                    className={`v-tab ${viewMode === 'side-by-side' ? 'active' : ''}`}
                    onClick={() => setViewMode('side-by-side')}
                  >
                    Side-by-Side
                  </button>
                  <button
                    className={`v-tab ${viewMode === 'ela-only' ? 'active' : ''}`}
                    onClick={() => setViewMode('ela-only')}
                  >
                    Error Level Map (ELA)
                  </button>
                  <button
                    className={`v-tab ${viewMode === 'overlay' ? 'active' : ''}`}
                    onClick={() => setViewMode('overlay')}
                  >
                    Glow Overlay
                  </button>
                </div>
                {viewMode === 'overlay' && (
                  <div className="slider-item inline-slider">
                    <span className="slider-lbl">Opacity</span>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                    />
                  </div>
                )}
              </div>

              {isAnalyzing && (
                <div className="scanning-overlay-screen">
                  <div className="scanner-laser" />
                  <div className="loading-spinner animate-pulse">ANALYZING GRID PIXELS...</div>
                </div>
              )}

              <div className="image-display-area">
                {imageSrc && (
                  <div className={`img-views-container ${viewMode}`}>
                    {viewMode === 'side-by-side' && (
                      <>
                        <div className="single-view-pane">
                          <span className="pane-tag">ORIGINAL SOURCE</span>
                          <div className="img-wrapper">
                            <img src={imageSrc} alt="Original forensic input" />
                          </div>
                        </div>
                        <div className="single-view-pane">
                          <span className="pane-tag highlight-cyan">ERROR DISTRIBUTION MAP</span>
                          <div className="img-wrapper ELA-container">
                            {elaResult && (
                              <>
                                <img src={elaResult.elaImageDataUrl} alt="ELA output" />
                                {elaResult.coordinates.map((pt, i) => (
                                  <div
                                    key={i}
                                    className="anomaly-dot-overlay animate-pulse"
                                    style={{
                                      left: `${(pt.x / 5)}px`,
                                      top: `${(pt.y / 5)}px`,
                                    }}
                                    title={`Anomaly: ${pt.confidence}%`}
                                  />
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {viewMode === 'ela-only' && elaResult && (
                      <div className="single-view-pane full-pane ELA-container">
                        <span className="pane-tag highlight-cyan">ERROR LEVEL MAP</span>
                        <div className="img-wrapper max-wrapper">
                          <img src={elaResult.elaImageDataUrl} alt="ELA map only" />
                        </div>
                      </div>
                    )}

                    {viewMode === 'overlay' && elaResult && (
                      <div className="single-view-pane full-pane overlay-pane">
                        <span className="pane-tag highlight-purple">COMPOSITE GLOW OVERLAY</span>
                        <div className="img-wrapper max-wrapper relative-wrap">
                          <img src={imageSrc} alt="Base src" className="base-img" />
                          <img
                            src={elaResult.elaImageDataUrl}
                            alt="Overlay ELA"
                            className="overlay-img"
                            style={{ opacity: overlayOpacity }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Controls sidebar */}
            <div className="controls-sidebar">
              {/* Parameter Settings */}
              <div className="settings-card cyber-card">
                <div className="panel-header">
                  <Sliders size={14} className="cyan-glow-text" />
                  <h4>FORENSIC ARTIFACT SLIDERS</h4>
                </div>
                <div className="settings-sliders-list">
                  <div className="slider-item">
                    <div className="slider-info">
                      <span className="slider-lbl">JPEG Quality Target</span>
                      <span className="slider-val">{Math.round(quality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="0.99"
                      step="0.01"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                    />
                    <p className="slider-desc">Resaves image at target quality to calculate error differences.</p>
                  </div>
                  <div className="slider-item">
                    <div className="slider-info">
                      <span className="slider-lbl">Contrast Boost Factor</span>
                      <span className="slider-val">{boost}x</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="35"
                      step="1"
                      value={boost}
                      onChange={(e) => setBoost(parseInt(e.target.value))}
                    />
                    <p className="slider-desc">Amplifies pixel differences for high contrast anomaly rendering.</p>
                  </div>
                </div>
              </div>

              {/* Integrity status card */}
              <div className="score-summary-card cyber-card">
                <div className="panel-header">
                  <Info size={14} className="purple-glow-text" />
                  <h4>METRIC REPORT</h4>
                </div>
                <div className="scores-columns">
                  <div className="score-widget">
                    <span className="score-lbl">ELA RESIDUAL SCORE</span>
                    <span
                      className={`score-val ${
                        elaResult && elaResult.anomalyScore > 50 ? 'alert' : 'ok'
                      }`}
                    >
                      {elaResult ? elaResult.anomalyScore : '0'}%
                    </span>
                    <span className="score-subtitle">Lower is safer</span>
                  </div>
                  <div className="score-widget">
                    <span className="score-lbl">METADATA INTEGRITY</span>
                    <span
                      className={`score-val ${
                        metadataReport && metadataReport.integrityScore < 60 ? 'alert' : 'ok'
                      }`}
                    >
                      {metadataReport ? metadataReport.integrityScore : '100'}%
                    </span>
                    <span className="score-subtitle">Higher is safer</span>
                  </div>
                </div>
              </div>

              {/* Explainer card for Non-coders */}
              <div className="explainer-card cyber-card ok-accent" style={{ marginTop: '16px' }}>
                <div className="panel-header" style={{ marginBottom: '10px' }}>
                  <span className="cyber-badge ok">💡 Aasaan Bhasha Me (Non-Coder Help)</span>
                </div>
                <p className="explainer-text" style={{ fontSize: '0.78rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                  <strong>JPEG Quality Target & Contrast:</strong> Yeh test photo ke compression level ko check karta hai. Agar kisi ne chehra badla ( photoshop kiya) hai, to altered parts <strong>chamkenge (glow karenge)</strong>. Real photo dark aur bilkul flat rahegi!
                </p>
                <p className="explainer-text" style={{ fontSize: '0.78rem', lineHeight: '1.4', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  <strong>EXIF Metadata Integrity:</strong> Har camera photo me hardware brand aur details save karta hai. Agar integrity low hai (jaise 0%), toh photo AI generated ho sakti hai ya uske info ko delete kar diya gaya hai.
                </p>
              </div>
            </div>
          </div>

          <div className="metadata-and-cert-grid">
            {/* Metadata inspection list */}
            <div className="metadata-card cyber-card">
              <div className="panel-header">
                <h4>EXIF METADATA BLOCKS</h4>
                <p className="panel-desc">Structure inspection for markers, software profiles, and tags.</p>
              </div>
              <div className="metadata-table">
                {metadataReport ? (
                  metadataReport.findings.map((item, index) => (
                    <div key={index} className="meta-tr">
                      <span className="td-name">{item.name}</span>
                      <div className="td-val-block">
                        <span className={`cyber-badge ${item.status}`}>{item.val}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Awaiting upload...</p>
                )}
              </div>
            </div>

            {/* Analysis certification */}
            {elaResult && metadataReport && (
              <ReportExporter
                fileName={file.name}
                fileType={file.type}
                fileSize={metadataReport.fileSize}
                scores={{
                  image: elaResult.anomalyScore,
                  metadata: metadataReport.integrityScore,
                }}
                warnings={[...metadataReport.warnings, ...elaResult.textureWarnings]}
              />
            )}
          </div>
        </div>
      )}

      <style>{`
        .image-forensics-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .module-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .module-title-section h2 {
          font-family: var(--font-cyber);
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .module-title-section p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-top: 4px;
        }

        .empty-state-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
          gap: 16px;
        }

        .empty-icon {
          color: var(--text-dark);
        }

        .empty-state-card h3 {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .empty-state-card p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          max-width: 400px;
        }

        .forensics-workspace {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .viewer-and-controls-row {
          display: grid;
          grid-template-columns: 8fr 4fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .viewer-and-controls-row {
            display: flex;
            flex-direction: column;
          }
        }

        .visualizer-card {
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }

        .viewer-hdr {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .viewer-tabs {
          display: flex;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 6px;
          gap: 4px;
        }

        .v-tab {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-family: var(--font-primary);
          font-size: 0.75rem;
          padding: 6px 14px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .v-tab.active {
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .scanning-overlay-screen {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(5, 6, 10, 0.85);
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }

        .loading-spinner {
          font-family: var(--font-cyber);
          font-size: 0.95rem;
          color: var(--color-cyan);
          letter-spacing: 2px;
          margin-top: 16px;
        }

        .image-display-area {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-grow: 1;
          background: rgba(5, 6, 10, 0.4);
          border-radius: 8px;
          padding: 16px;
        }

        .img-views-container {
          width: 100%;
          display: flex;
          gap: 16px;
        }

        .img-views-container.side-by-side {
          flex-direction: row;
        }

        .img-views-container.ela-only, .img-views-container.overlay {
          flex-direction: column;
        }

        .single-view-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pane-tag {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--text-secondary);
          letter-spacing: 1px;
        }

        .pane-tag.highlight-cyan { color: var(--color-cyan); }
        .pane-tag.highlight-purple { color: var(--color-purple); }

        .img-wrapper {
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          overflow: hidden;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          max-height: 320px;
        }

        .img-wrapper.ELA-container {
          position: relative;
        }

        .img-wrapper img {
          max-width: 100%;
          max-height: 320px;
          object-fit: contain;
        }

        .relative-wrap {
          position: relative;
        }

        .overlay-img {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          mix-blend-mode: screen;
          pointer-events: none;
        }

        .anomaly-dot-overlay {
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid var(--color-alert);
          background: rgba(255, 85, 85, 0.35);
          box-shadow: 0 0 10px var(--color-alert);
          transform: translate(-50%, -50%);
          pointer-events: auto;
          cursor: crosshair;
        }

        .controls-sidebar {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-sliders-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .slider-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .slider-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
        }

        .slider-lbl {
          color: var(--text-secondary);
        }

        .slider-val {
          font-family: var(--font-mono);
          color: var(--color-cyan);
          font-weight: bold;
        }

        .slider-item input[type='range'] {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: var(--text-dark);
          outline: none;
        }

        .slider-item input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-cyan);
          cursor: pointer;
          box-shadow: 0 0 8px var(--color-cyan);
        }

        .slider-desc {
          font-size: 0.65rem;
          color: var(--text-dark);
        }

        .scores-columns {
          display: flex;
          gap: 20px;
          margin-top: 10px;
        }

        .score-widget {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .score-widget .score-lbl {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--text-secondary);
          text-align: center;
        }

        .score-widget .score-val {
          font-family: var(--font-cyber);
          font-size: 1.6rem;
          font-weight: 700;
          margin: 8px 0;
        }

        .score-widget .score-val.ok {
          color: var(--color-ok);
          text-shadow: 0 0 10px rgba(80, 250, 123, 0.3);
        }

        .score-widget .score-val.alert {
          color: var(--color-alert);
          text-shadow: 0 0 10px rgba(255, 85, 85, 0.3);
        }

        .score-widget .score-subtitle {
          font-size: 0.65rem;
          color: var(--text-dark);
        }

        .metadata-and-cert-grid {
          display: grid;
          grid-template-columns: 5fr 7fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .metadata-and-cert-grid {
            display: flex;
            flex-direction: column;
          }
        }

        .metadata-table {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .meta-tr {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .td-name {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};
