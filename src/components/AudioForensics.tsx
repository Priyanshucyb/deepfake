import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music, Sliders, Volume2, Info } from 'lucide-react';
import { analyzeAudioBuffer, type AudioForensicReport } from '../utils/forensics';
import { ReportExporter } from './ReportExporter';

interface AudioForensicsProps {
  initialFile: File | null;
  onAnalysisUpdate: (scores: { audio?: number }, warnings: string[]) => void;
}

export const AudioForensics: React.FC<AudioForensicsProps> = ({
  initialFile,
  onAnalysisUpdate
}) => {
  const [file, setFile] = useState<File | null>(initialFile);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [report, setReport] = useState<AudioForensicReport | null>(null);

  // Web Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // UI preferences
  const [fftSize, setFftSize] = useState<number>(512);
  const [colorTheme, setColorTheme] = useState<'cyan' | 'purple' | 'rainbow'>('cyan');

  // Track playback time
  const playbackStartRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);

  useEffect(() => {
    if (initialFile) {
      handleFileLoad(initialFile);
    }
    return () => {
      stopAudio();
    };
  }, [initialFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileLoad(e.target.files[0]);
    }
  };

  const handleFileLoad = async (selectedFile: File) => {
    stopAudio();
    setFile(selectedFile);
    setIsAnalyzing(true);
    setReport(null);

    // Generate buffer info

    try {
      // Decode audio data for forensic buffer analysis
      const buffer = await selectedFile.arrayBuffer();
      // Lazy init AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      const decodedBuffer = await ctx.decodeAudioData(buffer);
      audioBufferRef.current = decodedBuffer;
      setDuration(decodedBuffer.duration);

      // Perform forensic math check
      const findings = await analyzeAudioBuffer(decodedBuffer);
      setReport(findings);

      // Send findings back to parent
      onAnalysisUpdate({ audio: findings.syntheticProbability }, findings.notes);
    } catch (err) {
      console.error('Audio decode failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playAudio = () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    
    // Resume context if suspended (browser security)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Stop current source if active
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }

    // Create source node
    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;

    // Create analyser node
    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    
    // Connect source -> analyser -> destination (speakers)
    source.connect(analyser);
    analyser.connect(ctx.destination);

    analyserRef.current = analyser;
    sourceRef.current = source;

    // Start playing at current offset
    const offset = pauseOffsetRef.current;
    source.start(0, offset);
    playbackStartRef.current = ctx.currentTime - offset;
    setIsPlaying(true);

    // Start visual loops
    drawSpectrograph();

    // Setup end handler
    source.onended = () => {
      if (ctx.currentTime - playbackStartRef.current >= decodedDuration()) {
        setIsPlaying(false);
        pauseOffsetRef.current = 0;
        setCurrentTime(0);
      }
    };
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
  };

  const pauseAudio = () => {
    if (!isPlaying || !audioContextRef.current) return;
    stopAudio();
    const elapsed = audioContextRef.current.currentTime - playbackStartRef.current;
    pauseOffsetRef.current = elapsed % decodedDuration();
    setCurrentTime(pauseOffsetRef.current);
  };

  const decodedDuration = () => {
    return audioBufferRef.current ? audioBufferRef.current.duration : 0;
  };

  // Real-time loop updating current time and spectrograph
  useEffect(() => {
    let timer: number;
    if (isPlaying && audioContextRef.current) {
      timer = window.setInterval(() => {
        if (audioContextRef.current) {
          const elapsed = audioContextRef.current.currentTime - playbackStartRef.current;
          setCurrentTime(Math.min(duration, elapsed));
        }
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, duration]);

  // Canvas drawing loop
  const drawSpectrograph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const width = canvas.width;
    const height = canvas.height;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);

      analyser.getByteFrequencyData(dataArray);

      // We shift the canvas content up to create a waterfall scrolling effect!
      // This is a super neat trick that makes a real spectrogram!
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
        
        ctx.fillStyle = 'rgba(5, 6, 10, 1)';
        ctx.fillRect(0, 0, width, height);
        
        // Draw the old spectrogram shifted upwards
        ctx.drawImage(tempCanvas, 0, -2);
      }

      // Draw the new spectrum data at the bottom row
      const barWidth = width / bufferLength;
      
      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i]; // 0 to 255
        const intensity = val / 255;
        
        let color = '';
        if (colorTheme === 'cyan') {
          color = `rgba(0, 255, 255, ${intensity})`;
        } else if (colorTheme === 'purple') {
          color = `rgba(189, 147, 249, ${intensity})`;
        } else {
          // Rainbow scale
          const hue = (i / bufferLength) * 360;
          color = `hsla(${hue}, 100%, 50%, ${intensity})`;
        }

        ctx.fillStyle = color;
        // Paint bottom 2 pixels
        ctx.fillRect(i * barWidth, height - 3, barWidth, 3);
      }
    };

    render();
  };

  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="audio-forensics-container">
      <div className="module-header">
        <div className="module-title-section">
          <h2>Audio Spectrum Laboratory</h2>
          <p>WebAudio FFT spectrograph waterfall rendering, vocoder harmonic tests, and noise floor checks.</p>
        </div>
        {!file && (
          <label className="cyan-btn">
            <Music size={16} /> Load Audio File
            <input type="file" onChange={handleFileChange} accept="audio/*" style={{ display: 'none' }} />
          </label>
        )}
      </div>

      {!file ? (
        <div className="empty-state-card cyber-card">
          <Music size={48} className="empty-icon" />
          <h3>No Audio File Loaded</h3>
          <p>Please load an MP3, WAV or OGG file to run vocal synthesizer forensics.</p>
          <label className="cyan-btn select-btn">
            <span>SELECT AUDIO</span>
            <input type="file" onChange={handleFileChange} accept="audio/*" style={{ display: 'none' }} />
          </label>
        </div>
      ) : (
        <div className="forensics-workspace">
          <div className="viewer-and-controls-row">
            {/* Visualizer card */}
            <div className="visualizer-card cyber-card">
              <div className="panel-header viewer-hdr">
                <span className="panel-tag highlight-cyan">LIVE HARMONIC SPECTROGRAM (FFT WATERFALL)</span>
                <div className="controls-options">
                  <select
                    value={colorTheme}
                    onChange={(e) => setColorTheme(e.target.value as any)}
                    className="cyber-select"
                  >
                    <option value="cyan">Cyan Glow</option>
                    <option value="purple">Purple Haze</option>
                    <option value="rainbow">Multispectrum</option>
                  </select>
                </div>
              </div>

              {isAnalyzing && (
                <div className="scanning-overlay-screen">
                  <div className="loading-spinner animate-pulse">DECODING VOLTS AND FREQUENCIES...</div>
                </div>
              )}

              <div className="canvas-wrapper">
                <canvas ref={canvasRef} width={600} height={220} className="spectrogram-canvas" />
                {!isPlaying && (
                  <div className="canvas-info-overlay">
                    <p>Click Play to begin real-time FFT spectral parsing</p>
                  </div>
                )}
              </div>

              {/* Custom Audio Player Panel */}
              <div className="audio-player-controls">
                <button onClick={isPlaying ? pauseAudio : playAudio} className="play-pause-btn">
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <div className="player-track-info">
                  <div className="track-durations">
                    <span className="current-time">{formatTime(currentTime)}</span>
                    <span className="total-time">{formatTime(duration)}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <Volume2 size={16} className="volume-icon" />
              </div>
            </div>

            {/* Controls sidebar */}
            <div className="controls-sidebar">
              <div className="settings-card cyber-card">
                <div className="panel-header">
                  <Sliders size={14} className="cyan-glow-text" />
                  <h4>FFT RESOLUTION</h4>
                </div>
                <div className="settings-sliders-list">
                  <div className="slider-item">
                    <span className="slider-lbl">Frequency Bars (FFT Size)</span>
                    <div className="resolution-options">
                      {[256, 512, 1024].map((size) => (
                        <button
                          key={size}
                          className={`res-btn ${fftSize === size ? 'active' : ''}`}
                          onClick={() => {
                            setFftSize(size);
                            if (analyserRef.current) analyserRef.current.fftSize = size;
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <p className="slider-desc">Higher values offer finer pitch resolution, lower values offer faster temporal mapping.</p>
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
                  <div className="score-widget full-widget">
                    <span className="score-lbl">SYNTHETIC PROBABILITY</span>
                    <span
                      className={`score-val ${
                        report && report.syntheticProbability > 50 ? 'alert' : 'ok'
                      }`}
                    >
                      {report ? report.syntheticProbability : '0'}%
                    </span>
                    <span className="score-subtitle">
                      {report && report.syntheticProbability > 50
                        ? 'High Synthesizer Signature Risk'
                        : 'Biologically Coherent Signature'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explainer card for Non-coders */}
              <div className="explainer-card cyber-card ok-accent" style={{ marginTop: '16px' }}>
                <div className="panel-header" style={{ marginBottom: '10px' }}>
                  <span className="cyber-badge ok">💡 Aasaan Bhasha Me (Non-Coder Help)</span>
                </div>
                <p className="explainer-text" style={{ fontSize: '0.78rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                  <strong>Synthetic Probability (AI Voice Risk):</strong> Yeh graph check karta hai ki awaaz robot/AI ki hai ya asli insaan ki. AI awaaz me frequencies mechanically exact block ho jati hain aur natural sans lene ka background noise missing hota hai.
                </p>
                <p className="explainer-text" style={{ fontSize: '0.78rem', lineHeight: '1.4', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  <strong>Acoustic Spectrogram:</strong> Awaaz ki picture banata hai. Agar awaaz natural hai, toh continuous colorful layout dikhega. Agar robot hai, toh gaps me bilkul black spots (sannata) milenge.
                </p>
              </div>
            </div>
          </div>

          <div className="metadata-and-cert-grid">
            {/* Acoustic check findings */}
            <div className="metadata-card cyber-card">
              <div className="panel-header">
                <h4>ACOUSTIC FORENSIC METRICS</h4>
                <p className="panel-desc">Acoustic fingerprint checks for splicing, absolute silence, and frequency clipping.</p>
              </div>
              <div className="metadata-table">
                {report ? (
                  <>
                    <div className="meta-tr">
                      <span className="td-name">Zero-Silence Anomalies</span>
                      <div className="td-val-block">
                        <span className={`cyber-badge ${report.zeroSilenceCount > 3 ? 'alert' : 'ok'}`}>
                          {report.zeroSilenceCount > 0 ? `${report.zeroSilenceCount} gaps detected` : 'No anomalies'}
                        </span>
                      </div>
                    </div>
                    <div className="meta-tr">
                      <span className="td-name">Audio Wave Clipping</span>
                      <div className="td-val-block">
                        <span className={`cyber-badge ${report.clippingDetected ? 'warning' : 'ok'}`}>
                          {report.clippingDetected ? 'Clipping Detected' : 'No distortion'}
                        </span>
                      </div>
                    </div>
                    <div className="meta-tr">
                      <span className="td-name">Average Amplitude Delta</span>
                      <div className="td-val-block">
                        <span className="cyber-badge cyan">{(report.avgSpectralDelta * 100).toFixed(3)}%</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>Awaiting upload...</p>
                )}
              </div>
            </div>

            {/* Analysis certificate */}
            {report && (
              <ReportExporter
                fileName={file.name}
                fileType={file.type}
                fileSize={`${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                scores={{
                  audio: report.syntheticProbability,
                }}
                warnings={report.notes}
              />
            )}
          </div>
        </div>
      )}

      <style>{`
        .audio-forensics-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .canvas-wrapper {
          position: relative;
          background: rgba(5, 6, 10, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .spectrogram-canvas {
          display: block;
          width: 100%;
          height: 220px;
        }

        .canvas-info-overlay {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(5, 6, 10, 0.7);
          pointer-events: none;
        }

        .canvas-info-overlay p {
          font-family: var(--font-mono);
          color: var(--text-dark);
          font-size: 0.85rem;
          letter-spacing: 1px;
        }

        .audio-player-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(16, 20, 38, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 12px 16px;
        }

        .play-pause-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(0, 255, 255, 0.1);
          border: var(--border-cyan);
          color: var(--color-cyan);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .play-pause-btn:hover {
          background: var(--color-cyan);
          color: var(--bg-darker);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
        }

        .player-track-info {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .track-durations {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .progress-bar-container {
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--color-cyan);
          box-shadow: 0 0 8px var(--color-cyan);
          border-radius: 2px;
          transition: width 0.1s linear;
        }

        .volume-icon {
          color: var(--text-dark);
        }

        .cyber-select {
          background: rgba(16, 20, 38, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          padding: 6px 12px;
          border-radius: 4px;
          font-family: var(--font-primary);
          font-size: 0.75rem;
          outline: none;
          cursor: pointer;
        }

        .cyber-select option {
          background: var(--bg-dark);
          color: var(--text-primary);
        }

        .resolution-options {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .res-btn {
          flex: 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          padding: 6px 0;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .res-btn:hover {
          border-color: rgba(0, 255, 255, 0.2);
          color: var(--text-primary);
        }

        .res-btn.active {
          background: rgba(0, 255, 255, 0.1);
          border-color: var(--color-cyan);
          color: var(--color-cyan);
        }

        .score-widget.full-widget {
          align-items: center;
          text-align: center;
        }
      `}</style>
    </div>
  );
};
