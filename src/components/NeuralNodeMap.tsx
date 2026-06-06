import React, { useEffect, useRef } from 'react';

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  status: 'safe' | 'warning' | 'alert' | 'idle';
  val: string;
}

interface NeuralNodeMapProps {
  imageScore?: number;
  audioScore?: number;
  videoScore?: number;
  metaScore?: number;
}

export const NeuralNodeMap: React.FC<NeuralNodeMapProps> = ({
  imageScore,
  audioScore,
  videoScore,
  metaScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = 300);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 300;
      }
    };

    window.addEventListener('resize', handleResize);

    // Get status based on scores
    const getStatus = (score: number | undefined): 'safe' | 'warning' | 'alert' | 'idle' => {
      if (score === undefined) return 'idle';
      if (score < 25) return 'safe';
      if (score < 60) return 'warning';
      return 'alert';
    };

    const getValText = (score: number | undefined, name: string): string => {
      if (score === undefined) return 'Awaiting scan';
      if (name.includes('Meta')) return `Integrity: ${score}%`;
      return `Risk: ${score}%`;
    };

    // Define nodes
    const nodes: Node[] = [
      {
        id: 'center',
        name: 'DECISION ENGINE',
        x: width / 2,
        y: height / 2,
        vx: 0,
        vy: 0,
        radius: 20,
        status: 'idle',
        val: 'DEFEND.AI Core'
      },
      {
        id: 'image',
        name: 'Image ELA',
        x: width / 2 - 120,
        y: height / 2 - 60,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 12,
        status: getStatus(imageScore),
        val: getValText(imageScore, 'Image')
      },
      {
        id: 'metadata',
        name: 'Metadata EXIF',
        x: width / 2 - 130,
        y: height / 2 + 60,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 12,
        status: getStatus(metaScore === undefined ? undefined : 100 - metaScore), // Lower integrity = higher danger
        val: getValText(metaScore, 'Metadata')
      },
      {
        id: 'audio',
        name: 'Audio Spectral',
        x: width / 2 + 120,
        y: height / 2 - 60,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 12,
        status: getStatus(audioScore),
        val: getValText(audioScore, 'Audio')
      },
      {
        id: 'video',
        name: 'Temporal Coherence',
        x: width / 2 + 130,
        y: height / 2 + 60,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 12,
        status: getStatus(videoScore),
        val: getValText(videoScore, 'Video')
      }
    ];

    // Determine center status based on child statuses
    const activeScores = [imageScore, audioScore, videoScore].filter(s => s !== undefined) as number[];
    if (metaScore !== undefined) {
      activeScores.push(100 - metaScore);
    }

    if (activeScores.length > 0) {
      const maxScore = Math.max(...activeScores);
      nodes[0].status = getStatus(maxScore);
      nodes[0].val = `Risk Index: ${Math.round(maxScore)}%`;
    }

    const drawNode = (n: Node) => {
      // Glow settings
      ctx.shadowBlur = 15;
      let nodeColor = '#6272a4'; // Idle / Grey
      
      if (n.status === 'safe') nodeColor = '#50fa7b';
      else if (n.status === 'warning') nodeColor = '#ffb86c';
      else if (n.status === 'alert') nodeColor = '#ff5555';
      else if (n.id === 'center' && n.status === 'idle') nodeColor = '#00ffff';

      ctx.shadowColor = nodeColor;

      // Draw pulse ring for center
      if (n.id === 'center') {
        const pulse = 24 + Math.sin(Date.now() / 200) * 3;
        ctx.beginPath();
        ctx.arc(n.x, n.y, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `${nodeColor}33`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Main Node Circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0c16';
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      // Node center glow dot
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.fill();

      // Text Labels
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f8f8f2';
      ctx.font = `bold 11px var(--font-cyber)`;
      ctx.textAlign = 'center';
      ctx.fillText(n.name, n.x, n.y - n.radius - 8);

      ctx.fillStyle = n.id === 'center' ? nodeColor : '#a9b2c3';
      ctx.font = `9px var(--font-mono)`;
      ctx.fillText(n.val, n.x, n.y + n.radius + 14);
    };

    const updatePhysics = (n: Node) => {
      if (n.id === 'center') {
        n.x = width / 2;
        n.y = height / 2;
        return;
      }

      // Add velocity
      n.x += n.vx;
      n.y += n.vy;

      // Restraining boundary checks (orbit center)
      const dx = n.x - width / 2;
      const dy = n.y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const minDist = 100;
      const maxDist = 180;

      if (dist < minDist) {
        n.vx += (dx / dist) * 0.05;
        n.vy += (dy / dist) * 0.05;
      } else if (dist > maxDist) {
        n.vx -= (dx / dist) * 0.05;
        n.vy -= (dy / dist) * 0.05;
      }

      // Frictional dampening
      n.vx = Math.max(-1.5, Math.min(1.5, n.vx * 0.98));
      n.vy = Math.max(-1.5, Math.min(1.5, n.vy * 0.98));
    };

    const drawConnections = () => {
      const center = nodes[0];
      
      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        
        // Setup connection color based on destination status
        let connColor = 'rgba(98, 114, 164, 0.25)'; // Idle connection
        if (n.status === 'safe') connColor = 'rgba(80, 250, 123, 0.35)';
        else if (n.status === 'warning') connColor = 'rgba(255, 184, 108, 0.4)';
        else if (n.status === 'alert') connColor = 'rgba(255, 85, 85, 0.45)';

        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(n.x, n.y);
        ctx.strokeStyle = connColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw animated data packets travelling along lines
        const packetProgress = (Date.now() / 2500 + i * 0.25) % 1.0;
        const px = center.x + (n.x - center.x) * packetProgress;
        const py = center.y + (n.y - center.y) * packetProgress;

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = n.status === 'idle' ? '#00ffff' : 
                       n.status === 'safe' ? '#50fa7b' :
                       n.status === 'warning' ? '#ffb86c' : '#ff5555';
        ctx.shadowBlur = 8;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Connections
      drawConnections();

      // Update and Draw Nodes
      nodes.forEach(n => {
        updatePhysics(n);
        drawNode(n);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [imageScore, audioScore, videoScore, metaScore]);

  return (
    <div className="neural-map-wrapper">
      <div className="neural-map-header">
        <span className="panel-tag">FORENSICS NETWORK</span>
        <h4>DECISION GRAPH</h4>
      </div>
      <canvas ref={canvasRef} className="neural-canvas" />
      <style>{`
        .neural-map-wrapper {
          width: 100%;
          background: rgba(16, 20, 38, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }

        .neural-map-header {
          display: flex;
          flex-direction: column;
          margin-bottom: 8px;
        }

        .panel-tag {
          font-family: var(--font-mono);
          color: var(--color-cyan);
          font-size: 0.65rem;
          letter-spacing: 1.5px;
        }

        .neural-map-header h4 {
          font-family: var(--font-cyber);
          font-size: 0.9rem;
          color: var(--text-primary);
          margin-top: 2px;
        }

        .neural-canvas {
          display: block;
          width: 100%;
          background: transparent;
        }
      `}</style>
    </div>
  );
};
