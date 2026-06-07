import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Upload, Award, Trash2, Eye, ShieldAlert, ShieldCheck, Printer } from 'lucide-react';

interface AdminCertificate {
  scanId: string;
  timestamp: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  sha256: string;
  scores: {
    image?: number;
    audio?: number;
    video?: number;
    metadata?: number;
  };
  warnings: string[];
}

export const AdminPortal: React.FC = () => {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [securityKey, setSecurityKey] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  
  const [records, setRecords] = useState<AdminCertificate[]>([]);
  const [inspectingRecord, setInspectingRecord] = useState<AdminCertificate | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Load admin history from localStorage (merges manually imported and local user certificates)
  const loadAdminRecords = () => {
    try {
      // 1. Get manually imported certificates
      const adminData = localStorage.getItem('defend_ai_admin_certificates');
      const importedRecords: AdminCertificate[] = adminData ? JSON.parse(adminData) : [];

      // 2. Get locally generated user certificates
      const userData = localStorage.getItem('defend_ai_certificates');
      const userRecords: AdminCertificate[] = userData ? JSON.parse(userData) : [];

      // 3. Merge them, keeping unique scanId
      const mergedMap = new Map<string, AdminCertificate>();
      
      // Load user generated certificates first
      userRecords.forEach((r) => {
        if (r && r.scanId) {
          mergedMap.set(r.scanId, r);
        }
      });

      // Load imported ones (overwrite/update in case of overlaps)
      importedRecords.forEach((r) => {
        if (r && r.scanId) {
          mergedMap.set(r.scanId, r);
        }
      });

      const mergedList = Array.from(mergedMap.values());

      // Sort by timestamp (newest first)
      mergedList.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime() || 0;
        const timeB = new Date(b.timestamp).getTime() || 0;
        return timeB - timeA;
      });

      setRecords(mergedList);
    } catch (e) {
      console.error('Failed to load admin records:', e);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadAdminRecords();
    }
  }, [authorized]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin password gate
    if (securityKey === 'admin123' || securityKey === 'DEFEND-ADMIN') {
      setAuthorized(true);
      setLoginError('');
    } else {
      setLoginError('Invalid Security Key. Please try again.');
    }
  };

  // Drag and drop events for JSON upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  // Process and validate uploaded JSON certificates
  const processFiles = async (files: FileList) => {
    setImportStatus(null);
    let successCount = 0;
    let errorMsg = '';

    try {
      const adminData = localStorage.getItem('defend_ai_admin_certificates');
      const currentImported: AdminCertificate[] = adminData ? JSON.parse(adminData) : [];
      const newImported: AdminCertificate[] = [...currentImported];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
          errorMsg = `File "${file.name}" is not a valid JSON.`;
          continue;
        }

        try {
          const text = await file.text();
          const parsed = JSON.parse(text);

          // Validate basic report schema structure
          if (
            parsed.scanId &&
            parsed.timestamp &&
            parsed.fileInfo &&
            parsed.forensicMetrics &&
            parsed.warnings
          ) {
            const recordToImport: AdminCertificate = {
              scanId: parsed.scanId,
              timestamp: parsed.timestamp,
              fileName: parsed.fileInfo.name,
              fileType: parsed.fileInfo.type,
              fileSize: parsed.fileInfo.size,
              sha256: parsed.fileInfo.hash,
              scores: {
                image: parsed.forensicMetrics.image,
                audio: parsed.forensicMetrics.audio,
                video: parsed.forensicMetrics.video,
                metadata: parsed.forensicMetrics.metadata
              },
              warnings: parsed.warnings
            };

            // Avoid duplicates in imported list
            if (!newImported.some(r => r.scanId === recordToImport.scanId)) {
              newImported.unshift(recordToImport);
              successCount++;
            }
          } else {
            errorMsg = `File "${file.name}" has an invalid schema format.`;
          }
        } catch (e) {
          errorMsg = `Failed to parse file "${file.name}".`;
        }
      }

      if (successCount > 0) {
        localStorage.setItem('defend_ai_admin_certificates', JSON.stringify(newImported));
        loadAdminRecords();
        setImportStatus({
          type: 'success',
          message: `Successfully verified and imported ${successCount} certificate report(s).`
        });
      } else if (errorMsg) {
        setImportStatus({ type: 'error', message: errorMsg });
      }
    } catch (e) {
      console.error(e);
      setImportStatus({ type: 'error', message: 'Failed to process files.' });
    }
  };

  const deleteRecord = (scanId: string) => {
    // 1. Delete from defend_ai_admin_certificates
    try {
      const adminData = localStorage.getItem('defend_ai_admin_certificates');
      if (adminData) {
        const list = JSON.parse(adminData);
        const updated = list.filter((r: any) => r.scanId !== scanId);
        localStorage.setItem('defend_ai_admin_certificates', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Delete from defend_ai_certificates (local user ones)
    try {
      const userData = localStorage.getItem('defend_ai_certificates');
      if (userData) {
        const list = JSON.parse(userData);
        const updated = list.filter((r: any) => r.scanId !== scanId);
        localStorage.setItem('defend_ai_certificates', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    }

    // 3. Reload merged database
    loadAdminRecords();

    if (inspectingRecord?.scanId === scanId) {
      setInspectingRecord(null);
    }
  };

  const clearAllRecords = () => {
    if (window.confirm('Clear all certificates (including local user records and imported ones) from the Admin Master Console?')) {
      localStorage.removeItem('defend_ai_admin_certificates');
      localStorage.removeItem('defend_ai_certificates');
      setRecords([]);
      setInspectingRecord(null);
    }
  };

  // Calculations for Admin Registry Stats
  const deepfakeCount = records.filter(r => {
    const risks = [r.scores.image, r.scores.audio, r.scores.video].filter(s => s !== undefined) as number[];
    if (r.scores.metadata !== undefined) {
      risks.push(100 - r.scores.metadata);
    }
    const overallRisk = risks.length > 0 ? Math.max(...risks) : 0;
    return overallRisk >= 50;
  }).length;

  const totalMetadataIntegrity = records.reduce((acc, curr) => {
    return acc + (curr.scores.metadata !== undefined ? curr.scores.metadata : 100);
  }, 0);
  const avgIntegrity = records.length > 0 ? Math.round(totalMetadataIntegrity / records.length) : 100;

  // Render modal inspector certificate risk details
  const getOverallRisk = (record: AdminCertificate) => {
    const risks = [record.scores.image, record.scores.audio, record.scores.video].filter(
      (s) => s !== undefined
    ) as number[];
    if (record.scores.metadata !== undefined) {
      risks.push(100 - record.scores.metadata);
    }
    return risks.length > 0 ? Math.max(...risks) : 0;
  };

  if (!authorized) {
    return (
      <div className="admin-login-stage">
        <div className="cyber-card login-card">
          <div className="login-header">
            <div className="lock-icon-wrapper">
              <Lock size={24} className="purple-glow-text" />
            </div>
            <h3>ADMIN PORTAL GATE</h3>
            <p>Access cryptographic registry tools and inspect audit reports.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>Enter Admin Security Key</label>
              <input
                type="password"
                placeholder="Enter security password (e.g. admin123)..."
                value={securityKey}
                onChange={(e) => setSecurityKey(e.target.value)}
                autoFocus
              />
            </div>
            {loginError && <p className="error-text">{loginError}</p>}
            
            <button type="submit" className="cyan-btn login-btn">
              <Unlock size={14} /> AUTHORIZE ACCESS
            </button>
          </form>
        </div>

        <style>{`
          .admin-login-stage {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 120px);
            font-family: var(--font-primary);
          }
          
          .login-card {
            width: 400px;
            padding: 30px !important;
            border-color: rgba(99, 102, 241, 0.25) !important;
          }

          .login-header {
            text-align: center;
            margin-bottom: 24px;
          }

          .lock-icon-wrapper {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            background: rgba(99, 102, 241, 0.08);
            border: 1px solid rgba(99, 102, 241, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px auto;
          }

          .login-header h3 {
            font-size: 1.15rem;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #ffffff;
          }

          .login-header p {
            font-size: 0.78rem;
            color: var(--text-secondary);
            margin-top: 6px;
            line-height: 1.4;
          }

          .login-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .input-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .input-group label {
            font-family: var(--font-mono);
            font-size: 0.68rem;
            color: var(--text-secondary);
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .input-group input {
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            color: #ffffff;
            padding: 10px 14px;
            font-size: 0.85rem;
            outline: none;
            transition: all 0.2s;
          }

          .input-group input:focus {
            border-color: var(--color-purple);
            box-shadow: 0 0 8px rgba(99, 102, 241, 0.2);
          }

          .error-text {
            color: var(--color-alert);
            font-size: 0.75rem;
            font-weight: 500;
            text-align: center;
          }

          .login-btn {
            padding: 12px 0;
            font-weight: 700;
            background: linear-gradient(135deg, var(--color-purple) 0%, #4f46e5 100%) !important;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25) !important;
          }

          .login-btn:hover {
            box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4) !important;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-portal-dashboard">
      <div className="module-header">
        <div className="module-title-section">
          <h2>Admin Forensic Console</h2>
          <p>Import and aggregate digital forensic reports to build a verified audit database.</p>
        </div>
        <button onClick={() => setAuthorized(false)} className="clear-btn" style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>
          Lock Panel
        </button>
      </div>

      {/* Stats Row */}
      <div className="stats-row" style={{ marginTop: '20px' }}>
        <div className="stat-card cyber-card purple-accent">
          <div className="stat-icon-wrapper purple">
            <Award size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-lbl">IMPORTED REPORTS</span>
            <span className="stat-val purple-glow-text">{records.length}</span>
          </div>
        </div>
        <div className="stat-card cyber-card alert-accent">
          <div className="stat-icon-wrapper alert">
            <ShieldAlert size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-lbl">DEEPFAKES FLAGGED</span>
            <span className="stat-val alert-color">{deepfakeCount}</span>
          </div>
        </div>
        <div className="stat-card cyber-card ok-accent">
          <div className="stat-icon-wrapper ok">
            <ShieldCheck size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-lbl">AVG METADATA PASS</span>
            <span className="stat-val ok-glow-text">{avgIntegrity}%</span>
          </div>
        </div>
      </div>

      {/* Import Panel */}
      <div className="cyber-card import-card" style={{ marginTop: '24px' }}>
        <div className="panel-header">
          <h4>IMPORT DIAGNOSTIC RECORDS</h4>
          <p className="panel-desc">Drag and drop exported JSON certificate reports to verify and catalog them.</p>
        </div>

        <div
          className={`dropzone-container ${dragActive ? 'dragging' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          style={{ padding: '30px 20px', background: 'rgba(99, 102, 241, 0.02)', borderColor: 'rgba(99, 102, 241, 0.2)' }}
        >
          <div className="upload-icon-container" style={{ background: 'rgba(99, 102, 241, 0.06)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
            <Upload className="upload-icon" size={24} style={{ color: 'var(--color-purple)' }} />
          </div>
          <div className="dropzone-text">
            <h3>Drag & Drop JSON Audit Reports</h3>
            <p>Upload files exported by forensic investigators</p>
          </div>
          <div className="separator">
            <span>OR</span>
          </div>
          <label className="purple-btn upload-btn" style={{ padding: '8px 18px', fontSize: '0.8rem' }}>
            <span>SELECT JSON FILES</span>
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".json,application/json"
              multiple
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {importStatus && (
          <div className={`import-status-banner ${importStatus.type}`} style={{ marginTop: '12px' }}>
            <p>{importStatus.message}</p>
          </div>
        )}
      </div>

      {/* Master Registry Table */}
      <div className="cyber-card registry-card" style={{ marginTop: '24px' }}>
        <div className="panel-header registry-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0 }}>ADMIN MASTER REGISTRY</h4>
            <p className="panel-desc">Cryptographic audit record vault. Click Inspect to load the printable certificate seal.</p>
          </div>
          {records.length > 0 && (
            <button className="clear-btn" onClick={clearAllRecords}>
              Purge Database
            </button>
          )}
        </div>

        <div className="registry-table-wrapper">
          {records.length === 0 ? (
            <div className="registry-empty-state">
              <p>No audit records imported yet. Upload user JSON certificates to catalog them in this master registry.</p>
            </div>
          ) : (
            <table className="registry-table">
              <thead>
                <tr>
                  <th>Scan ID</th>
                  <th>Scanned At</th>
                  <th>Target File</th>
                  <th>File Size</th>
                  <th>Risk Index</th>
                  <th>Verdict</th>
                  <th style={{ textAlign: 'right' }}>Inspection</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const riskIndex = getOverallRisk(r);
                  const isDeepfake = riskIndex >= 50;
                  return (
                    <tr key={r.scanId}>
                      <td className="code-font">{r.scanId}</td>
                      <td>{r.timestamp}</td>
                      <td className="truncate-cell" title={r.fileName}>{r.fileName}</td>
                      <td>{r.fileSize}</td>
                      <td className="code-font">{riskIndex}%</td>
                      <td>
                        <span className={`verdict-tag ${isDeepfake ? 'deepfake' : 'safe'}`}>
                          {isDeepfake ? 'DEEPFAKE' : 'SAFE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-row">
                          <button
                            className="action-btn icon-btn"
                            title="Inspect Certificate"
                            onClick={() => setInspectingRecord(r)}
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            className="action-btn delete-btn icon-btn"
                            title="Delete Record"
                            onClick={() => deleteRecord(r.scanId)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* INSPECTOR MODAL */}
      {inspectingRecord && (
        <div className="inspector-modal-backdrop" onClick={() => setInspectingRecord(null)}>
          <div className="inspector-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-actions no-print">
              <span className="modal-title">CRYPTO CERTIFICATE INSPECTOR</span>
              <div className="action-btns-wrap">
                <button onClick={() => window.print()} className="purple-btn compact-btn">
                  <Printer size={12} /> Print Certificate
                </button>
                <button onClick={() => setInspectingRecord(null)} className="clear-btn compact-btn" style={{ background: 'rgba(255,255,255,0.03)', color: '#ffffff' }}>
                  Close Inspector
                </button>
              </div>
            </div>

            {/* Read-Only printable certificate layout */}
            <div className="certificate-body print-area inspector-cert-box">
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

              {/* Concentric SVG seal */}
              <div className="hologram-seal">
                <svg className="official-seal-svg" viewBox="0 0 120 120" width="120" height="120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-cyan)" strokeWidth="2" strokeDasharray="5,3" />
                  <circle cx="60" cy="60" r="48" fill="none" stroke="var(--color-purple)" strokeWidth="1" />
                  
                  <path id="modalTextPath" d="M 60,60 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" fill="none" />
                  <text fill="var(--color-cyan)" fontSize="6.5" fontWeight="bold" letterSpacing="0.8">
                    <textPath href="#modalTextPath" startOffset="0%">
                      • DEFEND.AI FORENSIC ENGINE • SECURE LABORATORY VERIFIED
                    </textPath>
                  </text>
                  
                  <path d="M60,38 L48,42 L48,55 C48,65 54,74 60,78 C66,74 72,65 72,55 L72,42 Z" fill="rgba(189, 147, 249, 0.15)" stroke="var(--color-purple)" strokeWidth="1.5" />
                  <path d="M54,54 L58,58 L66,49" fill="none" stroke="var(--color-ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="60" y="88" fill="var(--color-purple)" fontSize="6.5" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">OFFICIAL SEAL</text>
                </svg>
              </div>

              <div className="cert-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">SCAN IDENTITY:</span>
                  <span className="meta-val code">{inspectingRecord.scanId}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">TIMESTAMP:</span>
                  <span className="meta-val">{inspectingRecord.timestamp}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">TARGET FILE:</span>
                  <span className="meta-val truncate-text">{inspectingRecord.fileName}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">FILE SIZE/TYPE:</span>
                  <span className="meta-val">{inspectingRecord.fileSize} / {inspectingRecord.fileType}</span>
                </div>
                <div className="meta-item full-width">
                  <span className="meta-label">SHA-256 CHECKSUM:</span>
                  <span className="meta-val code hash">{inspectingRecord.sha256}</span>
                </div>
              </div>

              <div className="verdict-banner-container">
                <div className={`verdict-banner ${getOverallRisk(inspectingRecord) >= 50 ? 'deepfake' : 'authentic'}`}>
                  <div className="verdict-left">
                    {getOverallRisk(inspectingRecord) >= 50 ? (
                      <ShieldAlert className="verdict-icon alert-color" />
                    ) : (
                      <ShieldCheck className="verdict-icon ok-color" />
                    )}
                    <div>
                      <h4 className="verdict-title">
                        {getOverallRisk(inspectingRecord) >= 50 ? 'DEEPFAKE SIGNATURE DETECTED' : 'MEDIA VERIFIED AUTHENTIC'}
                      </h4>
                      <p className="verdict-description">
                        {getOverallRisk(inspectingRecord) >= 50
                          ? 'Forensic analysis identified high confidence synthetic or modified indicators.'
                          : 'File metrics reside within standard natural baseline deviation.'}
                      </p>
                    </div>
                  </div>
                  <div className="verdict-score">
                    <span className="score-val">{getOverallRisk(inspectingRecord)}%</span>
                    <span className="score-lbl">RISK INDEX</span>
                  </div>
                </div>
              </div>

              <div className="breakdown-table">
                <h5 className="section-title">DETAILED METRIC RATINGS</h5>
                <div className="table-rows">
                  {inspectingRecord.scores.image !== undefined && (
                    <div className="table-row">
                      <span className="row-lbl">Error Level Analysis (ELA)</span>
                      <span className={`row-val ${inspectingRecord.scores.image > 50 ? 'alert-color' : 'ok-color'}`}>
                        {inspectingRecord.scores.image}% Risk
                      </span>
                    </div>
                  )}
                  {inspectingRecord.scores.metadata !== undefined && (
                    <div className="table-row">
                      <span className="row-lbl">EXIF Metadata Integrity</span>
                      <span className={`row-val ${inspectingRecord.scores.metadata < 60 ? 'alert-color' : 'ok-color'}`}>
                        {inspectingRecord.scores.metadata}% Integrity
                      </span>
                    </div>
                  )}
                  {inspectingRecord.scores.audio !== undefined && (
                    <div className="table-row">
                      <span className="row-lbl">Acoustic Vocoder Entropy</span>
                      <span className={`row-val ${inspectingRecord.scores.audio > 50 ? 'alert-color' : 'ok-color'}`}>
                        {inspectingRecord.scores.audio}% Risk
                      </span>
                    </div>
                  )}
                  {inspectingRecord.scores.video !== undefined && (
                    <div className="table-row">
                      <span className="row-lbl">Temporal Boundary Jitter</span>
                      <span className={`row-val ${inspectingRecord.scores.video > 50 ? 'alert-color' : 'ok-color'}`}>
                        {inspectingRecord.scores.video}% Risk
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {inspectingRecord.warnings.length > 0 && (
                <div className="warnings-section">
                  <h5 className="section-title">FORENSIC ANOMALY LOGS</h5>
                  <ul className="warnings-list">
                    {inspectingRecord.warnings.map((warn, i) => (
                      <li key={i} className="warning-li">
                        {warn}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Signature and verification check blocks */}
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
          </div>
        </div>
      )}

      <style>{`
        .admin-portal-dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .import-status-banner {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.78rem;
          line-height: 1.4;
          font-weight: 500;
        }

        .import-status-banner.success {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: var(--color-ok);
        }

        .import-status-banner.error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--color-alert);
        }

        .inspector-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(5, 6, 10, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .inspector-modal-content {
          background: #0f1524;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          width: 100%;
          max-width: 800px;
          max-height: 100%;
          overflow-y: auto;
          box-shadow: var(--shadow-xl), 0 0 40px rgba(0, 0, 0, 0.5);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-top-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 12px;
        }

        .modal-title {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--color-purple);
          font-weight: 700;
          letter-spacing: 1.2px;
        }

        .action-btns-wrap {
          display: flex;
          gap: 10px;
        }

        .compact-btn {
          padding: 6px 14px;
          font-size: 0.72rem;
          border-radius: 6px;
        }

        .inspector-cert-box {
          background: rgba(8, 10, 20, 0.5) !important;
          border: 1px solid rgba(255, 255, 255, 0.04) !important;
          border-radius: 8px !important;
          padding: 24px !important;
          position: relative !important;
          margin: 0 !important;
          overflow: visible !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 14px !important;
        }

        @media print {
          .inspector-modal-backdrop {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            background: transparent !important;
            backdrop-filter: none !important;
            display: block !important;
          }

          .inspector-modal-content {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
