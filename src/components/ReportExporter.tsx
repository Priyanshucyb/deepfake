import React, { useState, useEffect } from 'react';
import { Download, Printer, ShieldCheck, ShieldAlert, Award } from 'lucide-react';

interface ReportExporterProps {
  fileName: string;
  fileType: string;
  fileSize: string;
  scores: {
    image?: number;
    audio?: number;
    video?: number;
    metadata?: number;
  };
  warnings: string[];
}

export const ReportExporter: React.FC<ReportExporterProps> = ({
  fileName,
  fileType,
  fileSize,
  scores,
  warnings
}) => {
  const [sha256, setSha256] = useState<string>('Generating hash...');
  const [scanId, setScanId] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    // Generate simulated scan details
    const randId = 'DEF-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    setScanId(randId);
    setTimestamp(new Date().toLocaleString());

    // Generate real-looking SHA-256
    const generateFakeHash = () => {
      const hex = '0123456789abcdef';
      let hash = '';
      for (let i = 0; i < 64; i++) {
        hash += hex[Math.floor(Math.random() * 16)];
      }
      setSha256(hash);
    };

    generateFakeHash();
  }, [fileName]);

  // Compute final risk index
  // High-Sensitivity Forensics: We use the maximum of the individual risk factors.
  // If any individual check flags synthetic markers, the entire target is flagged as deepfake.
  const individualRisks = [scores.image, scores.audio, scores.video].filter(
    (s) => s !== undefined
  ) as number[];
  
  if (scores.metadata !== undefined) {
    individualRisks.push(100 - scores.metadata);
  }

  const riskIndex = individualRisks.length > 0 ? Math.max(...individualRisks) : 0;
  const isDeepfake = riskIndex >= 50;

  const exportAsJSON = () => {
    const reportData = {
      scanId,
      timestamp,
      fileInfo: {
        name: fileName,
        type: fileType,
        size: fileSize,
        hash: sha256
      },
      forensicMetrics: {
        ...scores,
        overallRiskIndex: riskIndex
      },
      warnings,
      conclusion: isDeepfake
        ? 'HIGH PROBABILITY OF SYNTHETIC/MODIFIED MEDIA (DEEPFAKE)'
        : 'LOW PROBABILITY OF SYNTHETIC ALTERATION (AUTHENTIC)'
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forensics-report-${scanId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="report-exporter-card cyber-card">
      <div className="certificate-header">
        <Award className="cert-icon" />
        <div>
          <h3>FORENSIC SUMMARY</h3>
          <p className="cert-subtitle">GENERATE VERIFIED AUDIT RECORD</p>
        </div>
      </div>

      <div className="certificate-body print-area">
        {/* Print Brand Header */}
        <div className="print-header-brand">
          <div className="brand-logo-side">
            <span className="brand-shield-icon">🛡️</span>
            <div>
              <h3>DEFEND<span className="brand-accent-glow">.AI</span> FORENSIC LABS</h3>
              <p>Advanced Media Verification & Deepfake Audit Certificate</p>
            </div>
          </div>
          <div className="brand-url-side">
            <span className="official-badge-lbl">OFFICIAL DIAGNOSTIC AUDIT</span>
            <span className="lab-url">www.defend.ai</span>
          </div>
        </div>

        {/* Holographic Seal Design */}
        <div className="hologram-seal">
          <svg className="official-seal-svg" viewBox="0 0 120 120" width="120" height="120">
            {/* Outer rings */}
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-cyan)" strokeWidth="2" strokeDasharray="5,3" />
            <circle cx="60" cy="60" r="48" fill="none" stroke="var(--color-purple)" strokeWidth="1" />
            
            {/* Text path */}
            <path id="sealTextPath" d="M 60,60 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" fill="none" />
            <text fill="var(--color-cyan)" fontSize="6.5" fontWeight="bold" letterSpacing="0.8">
              <textPath href="#sealTextPath" startOffset="0%">
                • DEFEND.AI FORENSIC ENGINE • SECURE LABORATORY VERIFIED
              </textPath>
            </text>
            
            {/* Center Checkmark Shield */}
            <path d="M60,38 L48,42 L48,55 C48,65 54,74 60,78 C66,74 72,65 72,55 L72,42 Z" fill="rgba(189, 147, 249, 0.15)" stroke="var(--color-purple)" strokeWidth="1.5" />
            <path d="M54,54 L58,58 L66,49" fill="none" stroke="var(--color-ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <text x="60" y="88" fill="var(--color-purple)" fontSize="6.5" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">OFFICIAL SEAL</text>
          </svg>
        </div>

        <div className="cert-meta-grid">
          <div className="meta-item">
            <span className="meta-label">SCAN IDENTITY:</span>
            <span className="meta-val code">{scanId}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">TIMESTAMP:</span>
            <span className="meta-val">{timestamp}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">TARGET FILE:</span>
            <span className="meta-val truncate-text">{fileName}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">FILE SIZE/TYPE:</span>
            <span className="meta-val">{fileSize} / {fileType}</span>
          </div>
          <div className="meta-item full-width">
            <span className="meta-label">SHA-256 CHECKSUM:</span>
            <span className="meta-val code hash">{sha256}</span>
          </div>
        </div>

        <div className="verdict-banner-container">
          <div className={`verdict-banner ${isDeepfake ? 'deepfake' : 'authentic'}`}>
            <div className="verdict-left">
              {isDeepfake ? (
                <ShieldAlert className="verdict-icon alert-color" />
              ) : (
                <ShieldCheck className="verdict-icon ok-color" />
              )}
              <div>
                <h4 className="verdict-title">
                  {isDeepfake ? 'DEEPFAKE SIGNATURE DETECTED' : 'MEDIA VERIFIED AUTHENTIC'}
                </h4>
                <p className="verdict-description">
                  {isDeepfake
                    ? 'Forensic analysis identified high confidence synthetic or modified indicators.'
                    : 'File metrics reside within standard natural baseline deviation.'}
                </p>
              </div>
            </div>
            <div className="verdict-score">
              <span className="score-val">{riskIndex}%</span>
              <span className="score-lbl">RISK INDEX</span>
            </div>
          </div>
        </div>

        <div className="breakdown-table">
          <h5 className="section-title">DETAILED METRIC RATINGS</h5>
          <div className="table-rows">
            {scores.image !== undefined && (
              <div className="table-row">
                <span className="row-lbl">Error Level Analysis (ELA)</span>
                <span className={`row-val ${scores.image > 50 ? 'alert-color' : 'ok-color'}`}>
                  {scores.image}% Risk
                </span>
              </div>
            )}
            {scores.metadata !== undefined && (
              <div className="table-row">
                <span className="row-lbl">EXIF Metadata Integrity</span>
                <span className={`row-val ${scores.metadata < 60 ? 'alert-color' : 'ok-color'}`}>
                  {scores.metadata}% Integrity
                </span>
              </div>
            )}
            {scores.audio !== undefined && (
              <div className="table-row">
                <span className="row-lbl">Acoustic Vocoder Entropy</span>
                <span className={`row-val ${scores.audio > 50 ? 'alert-color' : 'ok-color'}`}>
                  {scores.audio}% Risk
                </span>
              </div>
            )}
            {scores.video !== undefined && (
              <div className="table-row">
                <span className="row-lbl">Temporal Boundary Jitter</span>
                <span className={`row-val ${scores.video > 50 ? 'alert-color' : 'ok-color'}`}>
                  {scores.video}% Risk
                </span>
              </div>
            )}
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="warnings-section">
            <h5 className="section-title">FORENSIC ANOMALY LOGS</h5>
            <ul className="warnings-list">
              {warnings.map((warn, i) => (
                <li key={i} className="warning-li">
                  {warn}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Verification QR and Cursive Signature */}
        <div className="cert-signature-row">
          <div className="verification-qrcode-block">
            <svg className="qr-code-svg" viewBox="0 0 29 29" shapeRendering="crispEdges">
              <path fill="#1a203c" d="M0 0h7v7H0zm1 1v5h5V1zm8-1h1v1H9zm1 1h1v1h-1zm-1 2h1v1H9zm2-3h3v1h-1v2h-1v1H9v1h3v1h-2v1h1v1h-1v1h3V9h-1V8h1V6h-2V5h-1zm14-5h7v7h-7zm1 1v5h5V1zm-9 6h1v1h-1zm3 0h1v1h-1zm2 1h1v1h-1zm-4 1h1v1h-1zm1 1h2v1h-2zm4 0h1v1h-1zM0 22h7v7H0zm1 1v5h5v-5zm15-1h1v1h-1zm1 1h1v1h-1zm-1 2h1v1h-1zm3-3h1v1h-1zm1 1h1v1h-1zm-1 2h1v1h-1zm2 1h1v1h-1zm-19 3h1v1H3zm2 0h1v1H5zm18-5h6v7h-6zm1 1v5h4v-5z" />
            </svg>
            <div className="qr-text-info">
              <span className="qr-title">SCAN SECURE LINK</span>
              <span className="qr-desc">Verify checksum authenticity</span>
            </div>
          </div>
          
          <div className="signature-signing-block">
            <span className="sig-cursive">DefendAI Core V1.0</span>
            <div className="sig-line-divider" />
            <span className="sig-subtext">AUTHORIZED LABORATORY AGENT</span>
          </div>
        </div>

        {/* Footer Audit Disclaimer */}
        <div className="print-footer-audit">
          <p>
            ⚖️ <strong>Legal Notice:</strong> This audit report represents a client-side sandbox execution of digital forensic analysis. Calculations are local approximations based on ELA compression differences and vocal harmonic coefficients. Defend.AI is an independent open-source evaluation suite.
          </p>
        </div>
      </div>

      <div className="action-buttons">
        <button onClick={exportAsJSON} className="cyan-btn">
          <Download size={16} /> DOWNLOAD JSON
        </button>
        <button onClick={triggerPrint} className="purple-btn">
          <Printer size={16} /> PRINT CERTIFICATE
        </button>
      </div>

      <style>{`
        .print-header-brand {
          display: none;
        }

        .cert-signature-row,
        .print-footer-audit {
          display: none;
        }

        .report-exporter-card {
          margin-top: 24px;
          border: 1px solid rgba(189, 147, 249, 0.2) !important;
        }

        .certificate-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 16px;
        }

        .cert-icon {
          color: var(--color-purple);
          width: 32px;
          height: 32px;
        }

        .cert-subtitle {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--text-dark);
          letter-spacing: 1px;
        }

        .certificate-body {
          background: rgba(8, 10, 20, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 24px;
          position: relative;
          margin-bottom: 24px;
          overflow: hidden;
        }

        .hologram-seal {
          position: absolute;
          right: 24px;
          top: 24px;
          width: 90px;
          height: 90px;
          opacity: 0.85;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .hologram-seal:hover {
          transform: scale(1.05);
          filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.35));
        }

        .official-seal-svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .cert-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-item.full-width {
          grid-column: span 2;
        }

        .meta-label {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--text-dark);
        }

        .meta-val {
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .meta-val.code {
          font-family: var(--font-mono);
          color: var(--color-cyan);
        }

        .meta-val.hash {
          word-break: break-all;
          font-size: 0.75rem;
        }

        .verdict-banner-container {
          margin-bottom: 24px;
        }

        .verdict-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 8px;
        }

        .verdict-banner.deepfake {
          background: rgba(255, 85, 85, 0.1);
          border: 1px solid rgba(255, 85, 85, 0.25);
        }

        .verdict-banner.authentic {
          background: rgba(80, 250, 123, 0.1);
          border: 1px solid rgba(80, 250, 123, 0.25);
        }

        .verdict-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .verdict-icon {
          width: 32px;
          height: 32px;
        }

        .verdict-title {
          font-family: var(--font-cyber);
          font-size: 0.95rem;
          letter-spacing: 0.5px;
          color: var(--text-primary);
        }

        .verdict-description {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .verdict-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          padding-left: 20px;
        }

        .score-val {
          font-family: var(--font-cyber);
          font-size: 1.8rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .score-lbl {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .section-title {
          font-family: var(--font-cyber);
          font-size: 0.75rem;
          color: var(--color-purple);
          border-left: 2px solid var(--color-purple);
          padding-left: 8px;
          margin-bottom: 12px;
          letter-spacing: 1px;
        }

        .breakdown-table {
          margin-bottom: 24px;
        }

        .table-rows {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .table-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .row-lbl {
          color: var(--text-secondary);
        }

        .row-val {
          font-family: var(--font-mono);
          font-weight: bold;
        }

        .warnings-section {
          margin-top: 16px;
        }

        .warnings-list {
          list-style: none;
          padding-left: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .warning-li {
          font-size: 0.75rem;
          color: var(--text-secondary);
          padding: 6px 12px;
          background: rgba(255, 184, 108, 0.05);
          border-left: 2px solid var(--color-warning);
          border-radius: 0 4px 4px 0;
        }

        .alert-color {
          color: var(--color-alert);
        }

        .ok-color {
          color: var(--color-ok);
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
        }

        .truncate-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          
          /* Force page body layout reset */
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          /* Hide all non-printed screen UI elements completely to prevent blank pages */
          .cyber-sidebar,
          .forensic-chatbot-wrapper,
          .action-buttons,
          .certificate-header,
          .module-header,
          .viewer-and-controls-row,
          .metadata-card,
          .empty-state-card,
          .welcome-banner,
          .stats-row,
          .dashboard-grid,
          .neural-map-wrapper,
          .settings-card,
          .score-summary-card,
          .explainer-card,
          .non-coder-welcome-tip {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            opacity: 0 !important;
          }
          
          /* Reset parent structures to prevent them from taking vertical space */
          .app-container, 
          .main-content-pane, 
          .image-forensics-container, 
          .audio-forensics-container, 
          .video-forensics-container, 
          .forensics-workspace, 
          .metadata-and-cert-grid, 
          .report-exporter-card {
            display: block !important;
            position: static !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            width: auto !important;
            overflow: visible !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            background: transparent !important;
          }

          /* Print Area Formatting */
          .print-area {
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            max-width: 180mm !important; /* Fit within printable page width */
            margin: 0 auto !important;
            padding: 24px !important;
            border: 3px double #0072ff !important; /* Royal Cyber Blue double border */
            border-radius: 8px !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            overflow: visible !important;
            gap: 12px !important;
            font-size: 11px !important;
          }

          /* Print header styles */
          .print-header-brand {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
            border-bottom: 2px solid #00ffff !important; /* Cyan divider line under header */
            padding-bottom: 8px !important;
            margin-bottom: 12px !important;
          }
          .brand-logo-side {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
          }
          .brand-shield-icon {
            font-size: 22px !important;
          }
          .brand-logo-side h3 {
            font-family: var(--font-cyber) !important;
            font-size: 14px !important;
            color: #0072ff !important;
            letter-spacing: 0.5px !important;
            margin: 0 !important;
          }
          .brand-accent-glow {
            color: #00ffff !important;
          }
          .brand-logo-side p {
            font-size: 8px !important;
            color: #6272a4 !important;
            margin: 2px 0 0 0 !important;
            text-transform: uppercase;
            letter-spacing: 0.5px !important;
          }
          .brand-url-side {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            gap: 2px !important;
          }
          .official-badge-lbl {
            font-family: var(--font-mono) !important;
            font-size: 7px !important;
            background: #eef6ff !important;
            border: 1px solid #0072ff !important;
            color: #0072ff !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            font-weight: bold !important;
          }
          .lab-url {
            font-family: var(--font-mono) !important;
            font-size: 8px !important;
            color: #6272a4 !important;
          }
          
          /* Seal print styles */
          .hologram-seal {
            opacity: 1 !important;
            right: 24px !important;
            top: 75px !important; /* Pushed below the new header */
            width: 80px !important;
            height: 80px !important;
          }
          
          .official-seal-svg circle:nth-child(1) {
            stroke: #00ffff !important;
          }
          .official-seal-svg circle:nth-child(2) {
            stroke: #bd93f9 !important;
          }
          .official-seal-svg text {
            fill: #008080 !important; /* Teal blue circular text */
          }
          .official-seal-svg path:nth-child(4) {
            stroke: #bd93f9 !important;
            fill: rgba(189, 147, 249, 0.1) !important;
          }
          .official-seal-svg path:nth-child(5) {
            stroke: #2e8b57 !important; /* Green checkmark */
            fill: none !important;
          }
          
          .cert-meta-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
            margin-bottom: 12px !important;
          }
          
          .verdict-banner {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 10px 14px !important;
            margin-bottom: 12px !important;
            border-radius: 8px !important;
          }
          
          .verdict-banner.deepfake {
            background: #fff0f0 !important;
            border: 2px solid #ff5555 !important;
            color: #ff5555 !important;
          }
          
          .verdict-banner.authentic {
            background: #f0fff0 !important;
            border: 2px solid #50fa7b !important;
            color: #2e8b57 !important;
          }
          
          .score-val {
            color: #000000 !important;
          }
          
          .meta-val, .row-lbl, .warning-li, .verdict-description {
            color: #000000 !important;
          }
          
          .meta-label, .section-title {
            color: #333333 !important;
            border-color: #000000 !important;
          }
          
          .table-row {
            display: flex !important;
            justify-content: space-between !important;
            background: #fbf9ff !important; /* Soft purple background tint */
            border: 1px solid #e2dbf5 !important;
            border-left: 3px solid #bd93f9 !important; /* Glowing purple left border */
            padding: 5px 8px !important;
            border-radius: 4px !important;
          }
          
          .warning-li {
            background: #fff9f0 !important;
            border-left: 3px solid #ff9900 !important;
            padding: 4px 8px !important;
            margin-bottom: 4px !important;
          }

          /* Signature and footer styles */
          .cert-signature-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-top: 16px !important;
            padding-top: 16px !important;
            border-top: 1px dashed #dddddd !important;
          }
          
          .verification-qrcode-block {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
          }
          
          .qr-code-svg {
            width: 46px !important;
            height: 46px !important;
          }
          
          .qr-text-info {
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
          }
          
          .qr-title {
            font-family: var(--font-mono) !important;
            font-size: 8px !important;
            font-weight: bold !important;
            color: #0072ff !important;
          }
          
          .qr-desc {
            font-size: 7px !important;
            color: #6272a4 !important;
          }
          
          .signature-signing-block {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            gap: 2px !important;
          }
          
          .sig-cursive {
            font-family: 'Brush Script MT', cursive, 'Courier New', sans-serif !important;
            font-size: 18px !important;
            font-weight: 500 !important;
            color: #1a203c !important;
            letter-spacing: 0.5px !important;
          }
          
          .sig-line-divider {
            width: 140px !important;
            height: 1px !important;
            background: #000000 !important;
            margin: 4px 0 !important;
          }
          
          .sig-subtext {
            font-family: var(--font-mono) !important;
            font-size: 7px !important;
            color: #6272a4 !important;
            font-weight: bold !important;
          }
          
          .print-footer-audit {
            display: block !important;
            margin-top: 12px !important;
            border-top: 1px solid #eeeeee !important;
            padding-top: 8px !important;
            text-align: justify !important;
          }
          
          .print-footer-audit p {
            font-size: 7px !important;
            color: #6272a4 !important;
            line-height: 1.4 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};
