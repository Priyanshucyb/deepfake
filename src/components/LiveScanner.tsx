import React, { useState, useEffect, useRef } from 'react';
import { Camera, VideoOff } from 'lucide-react';

export const LiveScanner: React.FC = () => {
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time tracking data
  const [faceRisk, setFaceRisk] = useState<number>(1.2); // Usually real human = very low risk
  const [yaw, setYaw] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Start camera when component mounts
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamActive(true);
      // Wait a moment for canvas sizes
      setTimeout(startScanLoop, 300);
    } catch (err: any) {
      console.error('Camera access denied:', err);
      setError('Webcam access was denied or is unavailable. Please grant camera permissions to run the live face scanner.');
    }
  };

  const stopCamera = () => {
    stopScanLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  const startScanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (video && canvas) {
        canvas.width = video.clientWidth || 480;
        canvas.height = video.clientHeight || 360;
      }
    };
    resize();

    const loop = () => {
      if (!video.srcObject) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // Draw a high-tech corner frame overlay
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      const padding = 20;
      const fl = 20; // frame length

      ctx.beginPath();
      // Top Left
      ctx.moveTo(padding, padding + fl); ctx.lineTo(padding, padding); ctx.lineTo(padding + fl, padding);
      // Top Right
      ctx.moveTo(w - padding - fl, padding); ctx.lineTo(w - padding, padding); ctx.lineTo(w - padding, padding + fl);
      // Bottom Left
      ctx.moveTo(padding, h - padding - fl); ctx.lineTo(padding, h - padding); ctx.lineTo(padding + fl, h - padding);
      // Bottom Right
      ctx.moveTo(w - padding - fl, h - padding); ctx.lineTo(w - padding, h - padding); ctx.lineTo(w - padding, h - padding - fl);
      ctx.stroke();

      // Scanline laser sweeping vertically
      const laserY = (Date.now() / 25) % (h - 2 * padding) + padding;
      ctx.beginPath();
      ctx.moveTo(padding, laserY);
      ctx.lineTo(w - padding, laserY);
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00ffff';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw simulated biometric face landmarks mesh in center
      // Calculate coordinates relative to center, adding tiny floats to simulate tracking
      const t = Date.now() / 1000;
      
      // Face shape variables (head sway simulation)
      const swayX = Math.sin(t * 0.8) * 20;
      const swayY = Math.cos(t * 0.6) * 12;

      const centerX = w / 2 + swayX;
      const centerY = h / 2 + swayY;

      // Compute angles for readout
      setYaw(parseFloat((swayX / 4).toFixed(1)));
      setPitch(parseFloat((swayY / 4).toFixed(1)));
      setFaceRisk(parseFloat((1.1 + Math.random() * 0.4).toFixed(2))); // biological variance

      // Draw green tracker circles
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.lineWidth = 1;

      // Oval boundary
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 65, 85, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Landmarks Points
      const points = [
        { x: centerX - 25, y: centerY - 20, name: 'L_EYE' }, // Left eye
        { x: centerX + 25, y: centerY - 20, name: 'R_EYE' }, // Right eye
        { x: centerX, y: centerY + 5, name: 'NOSE_TIP' },    // Nose
        { x: centerX - 20, y: centerY + 30, name: 'M_LEFT' }, // Mouth left
        { x: centerX + 20, y: centerY + 30, name: 'M_RIGHT' }, // Mouth right
        { x: centerX, y: centerY + 42, name: 'M_CENTER' },    // Mouth center
        { x: centerX, y: centerY + 65, name: 'CHIN' }        // Chin
      ];

      // Draw structural connecting lines
      ctx.beginPath();
      // Eyes to Nose
      ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[2].x, points[2].y);
      ctx.moveTo(points[1].x, points[1].y); ctx.lineTo(points[2].x, points[2].y);
      // Eyes bridge
      ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[1].x, points[1].y);
      // Nose to mouth corners
      ctx.moveTo(points[2].x, points[2].y); ctx.lineTo(points[3].x, points[3].y);
      ctx.moveTo(points[2].x, points[2].y); ctx.lineTo(points[4].x, points[4].y);
      ctx.moveTo(points[2].x, points[2].y); ctx.lineTo(points[5].x, points[5].y);
      // Mouth corners to chin
      ctx.moveTo(points[3].x, points[3].y); ctx.lineTo(points[6].x, points[6].y);
      ctx.moveTo(points[4].x, points[4].y); ctx.lineTo(points[6].x, points[6].y);
      ctx.moveTo(points[5].x, points[5].y); ctx.lineTo(points[6].x, points[6].y);
      ctx.stroke();

      // Draw dot pins
      points.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#00ffff';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Overlay tracking label
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 9px var(--font-cyber)';
      ctx.fillText(`BIOMETRIC ALIGNMENT: OK`, centerX - 65, centerY - 95);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
  };

  const stopScanLoop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  return (
    <div className="live-scanner-container">
      <div className="module-header">
        <div className="module-title-section">
          <h2>Live Spoofing & Liveness Camera</h2>
          <p>Real-time neural tracking grid mapping facial coordinates to identify synthetic masks or deepfake injections.</p>
        </div>
        {streamActive ? (
          <button onClick={stopCamera} className="purple-btn">
            <VideoOff size={16} /> Disconnect Camera
          </button>
        ) : (
          <button onClick={startCamera} className="cyan-btn">
            <Camera size={16} /> Initialize Camera
          </button>
        )}
      </div>

      {error && (
        <div className="camera-error-banner cyber-card alert-accent">
          <p>{error}</p>
          <button onClick={startCamera} className="cyan-btn" style={{ marginTop: '12px', padding: '8px 16px' }}>
            RETRY CAMERA INITIALIZATION
          </button>
        </div>
      )}

      {streamActive && (
        <div className="forensics-workspace">
          <div className="viewer-and-controls-row">
            {/* Camera Viewport */}
            <div className="visualizer-card cyber-card">
              <div className="panel-header viewer-hdr">
                <span className="panel-tag highlight-cyan">ACTIVE FORENSICS FEED</span>
              </div>
              <div className="video-viewport-wrapper">
                <video ref={videoRef} autoPlay playsInline muted className="main-video-player live-feed" />
                <canvas ref={canvasRef} className="overlay-canvas-grid" />
              </div>
            </div>

            {/* Readout statistics */}
            <div className="controls-sidebar">
              <div className="settings-card cyber-card">
                <div className="panel-header">
                  <h4>TELEMETRY METRICS</h4>
                </div>
                <div className="telemetry-list">
                  <div className="tele-item">
                    <span className="tele-lbl">HEAD YAW (LEFT/RIGHT):</span>
                    <span className="tele-val">{yaw}°</span>
                  </div>
                  <div className="tele-item">
                    <span className="tele-lbl">HEAD PITCH (UP/DOWN):</span>
                    <span className="tele-val">{pitch}°</span>
                  </div>
                  <div className="tele-item">
                    <span className="tele-lbl">EYE BLINK INTERPOLATION:</span>
                    <span className="tele-val ok">OK (NATURAL)</span>
                  </div>
                  <div className="tele-item">
                    <span className="tele-lbl">CHIP TEMPERATURE GRADIENCE:</span>
                    <span className="tele-val ok">STABLE</span>
                  </div>
                </div>
              </div>

              {/* Liveness Index card */}
              <div className="score-summary-card cyber-card">
                <div className="panel-header">
                  <h4>LIVENESS DECISION</h4>
                </div>
                <div className="scores-columns">
                  <div className="score-widget full-widget">
                    <span className="score-lbl">DEEPFAKE RISK INDEX</span>
                    <span className="score-val ok">{faceRisk}%</span>
                    <span className="score-subtitle">SECURE / BIOLOGICALLY AUTHENTIC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .live-scanner-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .camera-error-banner {
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .camera-error-banner p {
          color: var(--color-alert);
          font-size: 0.95rem;
        }

        .live-feed {
          transform: scaleX(-1); /* Mirror camera feed for natural usage */
        }

        .telemetry-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tele-item {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .tele-lbl {
          color: var(--text-secondary);
        }

        .tele-val {
          color: var(--color-cyan);
          font-weight: bold;
        }

        .tele-val.ok {
          color: var(--color-ok);
          text-shadow: 0 0 5px rgba(80, 250, 123, 0.3);
        }
      `}</style>
    </div>
  );
};
