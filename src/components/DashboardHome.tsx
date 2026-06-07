import React, { useState, useEffect } from 'react';
import { UploadCloud, ShieldAlert, Cpu, Heart, Database, Terminal, Award, Trash2, Download } from 'lucide-react';
import { NeuralNodeMap } from './NeuralNodeMap';

interface DashboardHomeProps {
  onFileSelect: (file: File) => void;
  imageScore?: number;
  audioScore?: number;
  videoScore?: number;
  metaScore?: number;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  onFileSelect,
  imageScore,
  audioScore,
  videoScore,
  metaScore
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [cpuUsage, setCpuUsage] = useState(12);
  const [logs, setLogs] = useState<string[]>([
    'System Initialized: DEFEND.AI Forensic Node active.',
    'Local Neural Network Models loaded successfully.',
    'Awaiting target media upload...'
  ]);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = () => {
    try {
      const data = localStorage.getItem('defend_ai_certificates');
      if (data) {
        setHistory(JSON.parse(data));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const deleteRecord = (scanId: string) => {
    try {
      const data = localStorage.getItem('defend_ai_certificates');
      if (data) {
        const list = JSON.parse(data);
        const updated = list.filter((item: any) => item.scanId !== scanId);
        localStorage.setItem('defend_ai_certificates', JSON.stringify(updated));
        setHistory(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearAllRecords = () => {
    if (window.confirm('Are you sure you want to clear all cryptographic audit logs from this local registry?')) {
      localStorage.removeItem('defend_ai_certificates');
      setHistory([]);
    }
  };

  const downloadHistoryJSON = (record: any) => {
    const risks = [record.scores.image, record.scores.audio, record.scores.video].filter(
      (s) => s !== undefined
    ) as number[];
    if (record.scores.metadata !== undefined) {
      risks.push(100 - record.scores.metadata);
    }
    const riskIndex = risks.length > 0 ? Math.max(...risks) : 0;
    const isDeepfake = riskIndex >= 50;

    const reportData = {
      scanId: record.scanId,
      timestamp: record.timestamp,
      fileInfo: {
        name: record.fileName,
        type: record.fileType,
        size: record.fileSize,
        hash: record.sha256
      },
      forensicMetrics: {
        ...record.scores,
        overallRiskIndex: riskIndex
      },
      warnings: record.warnings,
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
    link.download = `forensics-report-${record.scanId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Simulate cpu changes
    const interval = setInterval(() => {
      setCpuUsage(Math.round(8 + Math.random() * 14));
      // Occasionally append simulated audit logs
      const sampleLogs = [
        'Acoustic vocoder weights aligned.',
        'ELA canvas threshold adjusted to 95% JPEG scale.',
        'Listening to local video buffer active frames...',
        'Memory buffer flushed.',
        'Facial symmetry checker initialized.',
        'Spectrogram analyzer listening on WebAudio.'
      ];
      if (Math.random() > 0.6) {
        setLogs(prev => [
          ...prev.slice(-8),
          `[${new Date().toLocaleTimeString()}] ${sampleLogs[Math.floor(Math.random() * sampleLogs.length)]}`
        ]);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const renderLogLine = (log: string) => {
    // Check if timestamp exists
    const timeMatch = log.match(/^\[(.*?)\] (.*)$/);
    let timeStr = '';
    let message = log;

    if (timeMatch) {
      timeStr = `[${timeMatch[1]}] `;
      message = timeMatch[2];
    }

    // Color code based on log content
    let className = 'log-default';
    if (message.includes('Initialized') || message.includes('success') || message.includes('loaded')) {
      className = 'log-success';
    } else if (message.includes('adjusted') || message.includes('listening') || message.includes('active')) {
      className = 'log-info';
    }

    return (
      <div className="terminal-line">
        <span className="line-prefix">&gt; </span>
        {timeStr && <span className="log-time">{timeStr}</span>}
        <span className={`line-text ${className}`}>{message}</span>
      </div>
    );
  };

  return (
    <div className="dashboard-home">
      <div className="welcome-banner">
        <h2>AI Deepfake Forensic Laboratory</h2>
        <p>Upload images, audio or video to run automated forensics checks (ELA compression analysis, acoustic waveforms, and EXIF tracking).</p>
        
        <div className="non-coder-welcome-tip">
          <div className="tip-badge">💡 TIP</div>
          <p className="tip-text">
            Forensic report aur analysis scores ko aasan Hindi/Hinglish aur English me samajhne ke liye screen ke bottom-right corner me floating <strong>Forensic Assistant Chatbot</strong> 🛡️ par click karein!
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-row">
        <div className="stat-card cyber-card cyan-accent">
          <div className="stat-icon-wrapper cyan">
            <ShieldAlert size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-lbl">THREATS ISOLATED</span>
            <span className="stat-val cyan-glow-text">147</span>
          </div>
        </div>
        <div className="stat-card cyber-card purple-accent">
          <div className="stat-icon-wrapper purple">
            <Cpu size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-lbl">ENGINE LOAD</span>
            <span className="stat-val purple-glow-text">{cpuUsage}%</span>
          </div>
        </div>
        <div className="stat-card cyber-card warning-accent">
          <div className="stat-icon-wrapper warning">
            <Database size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-lbl">SIG DATABASE</span>
            <span className="stat-val warning-glow-text">v8.2.4</span>
          </div>
        </div>
        <div className="stat-card cyber-card ok-accent">
          <div className="stat-icon-wrapper ok">
            <Heart size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-lbl">SYSTEM STATUS</span>
            <span className="stat-val ok-glow-text">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Grid: Upload & Map */}
      <div className="dashboard-grid">
        <div className="grid-left-col">
          <div className="cyber-card dropzone-wrapper">
            <div className="panel-header">
              <h4>MEDIA INGESTION PORT</h4>
              <p className="panel-desc">Drag & drop files below for automated forensic routing.</p>
            </div>

            <div
              className={`dropzone-container ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-icon-container">
                <UploadCloud className="upload-icon" size={32} />
              </div>
              <div className="dropzone-text">
                <h3>Drag & Drop Forensic Target</h3>
                <p>Supports Image (PNG, JPG), Audio (MP3, WAV), or Video (MP4)</p>
              </div>
              <div className="separator">
                <span>OR</span>
              </div>
              <label className="cyan-btn upload-btn">
                <span>SELECT LOCAL FILE</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,audio/*,video/*"
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Console / Terminal logs */}
          <div className="cyber-card terminal-card">
            <div className="terminal-header-bar">
              <div className="terminal-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="terminal-title">
                <Terminal size={12} />
                <span>forensic-node@defend-ai: ~</span>
              </div>
              <div className="terminal-space"></div>
            </div>
            <div className="terminal-body">
              {logs.map((log, index) => (
                <React.Fragment key={index}>
                  {renderLogLine(log)}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="grid-right-col">
          <NeuralNodeMap
            imageScore={imageScore}
            audioScore={audioScore}
            videoScore={videoScore}
            metaScore={metaScore}
          />
        </div>
      </div>

      {/* Cryptographic Registry Table */}
      <div className="cyber-card registry-card">
        <div className="panel-header registry-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Award className="purple-glow-text" size={18} />
              VERIFIED AUDIT REGISTRY
            </h4>
            <p className="panel-desc">Cryptographic history of certificates issued on this local machine.</p>
          </div>
          {history.length > 0 && (
            <button className="clear-btn" onClick={clearAllRecords}>
              Clear All Logs
            </button>
          )}
        </div>

        <div className="registry-table-wrapper">
          {history.length === 0 ? (
            <div className="registry-empty-state">
              <p>No certificates issued yet. Upload files to run forensic checks and issue certificates.</p>
            </div>
          ) : (
            <table className="registry-table">
              <thead>
                <tr>
                  <th>Scan ID</th>
                  <th>Date & Time</th>
                  <th>Target File</th>
                  <th>Risk Level</th>
                  <th>Verdict</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => {
                  const risks = [record.scores.image, record.scores.audio, record.scores.video].filter(
                    (s) => s !== undefined
                  ) as number[];
                  if (record.scores.metadata !== undefined) {
                    risks.push(100 - record.scores.metadata);
                  }
                  const riskIndex = risks.length > 0 ? Math.max(...risks) : 0;
                  const isDeepfake = riskIndex >= 50;

                  return (
                    <tr key={record.scanId}>
                      <td className="code-font">{record.scanId}</td>
                      <td>{record.timestamp}</td>
                      <td className="truncate-cell" title={record.fileName}>{record.fileName}</td>
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
                            title="Download JSON Report"
                            onClick={() => downloadHistoryJSON(record)}
                          >
                            <Download size={12} />
                          </button>
                          <button
                            className="action-btn delete-btn icon-btn"
                            title="Delete Record"
                            onClick={() => deleteRecord(record.scanId)}
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

      <style>{`
        .dashboard-home {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .welcome-banner {
          margin-bottom: 4px;
        }

        .welcome-banner h2 {
          font-family: var(--font-primary);
          font-size: 1.65rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .welcome-banner p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-top: 6px;
        }

        .non-coder-welcome-tip {
          margin-top: 14px;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.15);
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 800px;
        }

        .tip-badge {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid rgba(59, 130, 246, 0.3);
          flex-shrink: 0;
        }

        .tip-text {
          font-size: 0.82rem;
          line-height: 1.4;
          color: var(--text-secondary);
          margin: 0 !important;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        @media (max-width: 900px) {
          .stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
        }

        .stat-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        .stat-icon-wrapper.cyan {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.18);
        }

        .stat-icon-wrapper.purple {
          color: #6366f1;
          background: rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.18);
        }

        .stat-icon-wrapper.warning {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.18);
        }

        .stat-icon-wrapper.ok {
          color: #10b981;
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.18);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-lbl {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 1.2px;
        }

        .stat-val {
          font-family: var(--font-primary);
          font-size: 1.25rem;
          font-weight: 800;
          margin-top: 2px;
        }

        .cyber-card.ok-accent {
          border-left: 3px solid var(--color-ok);
        }

        .ok-glow-text {
          color: var(--color-ok);
        }

        .grid-left-col {
          grid-column: span 7;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .grid-right-col {
          grid-column: span 5;
        }

        @media (max-width: 1024px) {
          .grid-left-col, .grid-right-col {
            grid-column: span 12;
          }
        }

        .panel-header {
          margin-bottom: 18px;
        }

        .panel-header h4 {
          font-family: var(--font-primary);
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.2px;
          color: var(--text-primary);
        }

        .panel-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 3px;
        }

        .dropzone-wrapper {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .upload-icon-container {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.06);
          border: 1px solid rgba(59, 130, 246, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .upload-icon {
          color: #3b82f6;
        }

        .dropzone-text h3 {
          font-family: var(--font-primary);
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .dropzone-text p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .separator {
          display: flex;
          align-items: center;
          width: 50%;
          color: var(--text-dark);
          font-family: var(--font-mono);
          font-size: 0.68rem;
        }

        .separator::before, .separator::after {
          content: '';
          flex-grow: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
        }

        .separator span {
          padding: 0 10px;
        }

        .terminal-card {
          padding: 0 !important;
          background: #070913 !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-radius: 12px;
          overflow: hidden;
        }

        .terminal-header-bar {
          display: flex;
          align-items: center;
          background: #0d0f1d;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 10px 16px;
          height: 36px;
        }

        .terminal-dots {
          display: flex;
          gap: 6px;
          flex: 1;
        }

        .terminal-dots .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }

        .terminal-dots .dot.red { background: #ef4444; }
        .terminal-dots .dot.yellow { background: #f59e0b; }
        .terminal-dots .dot.green { background: #10b981; }

        .terminal-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        .terminal-space {
          flex: 1;
        }

        .terminal-body {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          height: 130px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 16px;
        }

        .terminal-line {
          display: flex;
          line-height: 1.4;
        }

        .line-prefix {
          color: var(--color-cyan);
          user-select: none;
          margin-right: 6px;
        }

        .line-text {
          word-break: break-all;
        }

        .line-text.log-default {
          color: #a9b2c3;
        }

        .line-text.log-success {
          color: #34d399; /* Smooth Emerald */
        }

        .line-text.log-info {
          color: #60a5fa; /* Sky Blue */
        }

        .log-time {
          color: var(--text-muted);
          margin-right: 4px;
        }

        .registry-card {
          margin-top: 24px;
        }

        .registry-hdr {
          margin-bottom: 16px;
        }

        .clear-btn {
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--color-alert);
          padding: 6px 12px;
          border-radius: 6px;
          font-family: var(--font-primary);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-btn:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: var(--color-alert);
        }

        .registry-table-wrapper {
          overflow-x: auto;
          background: rgba(5, 6, 10, 0.2);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .registry-empty-state {
          padding: 30px;
          text-align: center;
          font-family: var(--font-primary);
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .registry-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.8rem;
        }

        .registry-table th {
          background: rgba(15, 23, 42, 0.6);
          padding: 12px 16px;
          color: var(--text-secondary);
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          font-family: var(--font-primary);
        }

        .registry-table td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          color: var(--text-primary);
        }

        .registry-table tr:hover td {
          background: rgba(255, 255, 255, 0.01);
        }

        .code-font {
          font-family: var(--font-mono);
          color: var(--color-cyan);
        }

        .truncate-cell {
          max-width: 180px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .verdict-tag {
          font-family: var(--font-primary);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .verdict-tag.safe {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-ok);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .verdict-tag.deepfake {
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-alert);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .action-row {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
          color: var(--color-cyan);
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.3);
          color: var(--color-alert);
        }
      `}</style>
    </div>
  );
};
