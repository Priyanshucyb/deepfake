import React, { useState, useEffect } from 'react';
import { UploadCloud, ShieldAlert, Cpu, Heart, Database, Terminal } from 'lucide-react';
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
      `}</style>
    </div>
  );
};
