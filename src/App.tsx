import { useState } from 'react';
import { TabNavigation } from './components/TabNavigation';
import { DashboardHome } from './components/DashboardHome';
import { ImageForensics } from './components/ImageForensics';
import { AudioForensics } from './components/AudioForensics';
import { VideoForensics } from './components/VideoForensics';
import { LiveScanner } from './components/LiveScanner';
import { FootprintScanner } from './components/FootprintScanner';
import { ForensicChatbot } from './components/ForensicChatbot';
import { Menu, X, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // File targets loaded across tabs
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Global forensic scores to feedback to Decision Node Map
  const [imageScore, setImageScore] = useState<number | undefined>(undefined);
  const [metadataScore, setMetadataScore] = useState<number | undefined>(undefined);
  const [audioScore, setAudioScore] = useState<number | undefined>(undefined);
  const [videoScore, setVideoScore] = useState<number | undefined>(undefined);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Automatic file router when user uploads file on home dashboard
  const handleFileRouting = (file: File) => {
    const type = file.type;

    if (type.startsWith('image/')) {
      setImageFile(file);
      setActiveTab('image');
    } else if (type.startsWith('audio/')) {
      setAudioFile(file);
      setActiveTab('audio');
    } else if (type.startsWith('video/')) {
      setVideoFile(file);
      setActiveTab('video');
    } else {
      alert('Unsupported file type. Please upload a valid Image, Audio or Video file.');
    }
  };

  const handleImageAnalysis = (
    scores: { image?: number; metadata?: number },
    imageWarnings: string[]
  ) => {
    if (scores.image !== undefined) setImageScore(scores.image);
    if (scores.metadata !== undefined) setMetadataScore(scores.metadata);
    if (imageWarnings) setWarnings(imageWarnings);
  };

  const handleAudioAnalysis = (
    scores: { audio?: number },
    audioWarnings: string[]
  ) => {
    if (scores.audio !== undefined) setAudioScore(scores.audio);
    if (audioWarnings) setWarnings(audioWarnings);
  };

  const handleVideoAnalysis = (
    scores: { video?: number },
    videoWarnings: string[]
  ) => {
    if (scores.video !== undefined) setVideoScore(scores.video);
    if (videoWarnings) setWarnings(videoWarnings);
  };

  return (
    <div className="app-container">
      {/* Mobile Top Header */}
      <header className="mobile-top-bar">
        <div className="mobile-brand">
          <div className="mobile-brand-logo">
            <Shield size={16} />
          </div>
          <span className="mobile-brand-title">DEFEND<span className="brand-gradient-text">.AI</span></span>
        </div>
        <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div className="sidebar-backdrop-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <TabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <main className="main-content-pane">
        {activeTab === 'dashboard' && (
          <DashboardHome
            onFileSelect={handleFileRouting}
            imageScore={imageScore}
            audioScore={audioScore}
            videoScore={videoScore}
            metaScore={metadataScore}
          />
        )}

        {activeTab === 'image' && (
          <ImageForensics
            initialFile={imageFile}
            onAnalysisUpdate={handleImageAnalysis}
          />
        )}

        {activeTab === 'audio' && (
          <AudioForensics
            initialFile={audioFile}
            onAnalysisUpdate={handleAudioAnalysis}
          />
        )}

        {activeTab === 'video' && (
          <VideoForensics
            initialFile={videoFile}
            onAnalysisUpdate={handleVideoAnalysis}
          />
        )}

        {activeTab === 'live' && <LiveScanner />}

        {activeTab === 'footprint' && <FootprintScanner />}
      </main>

      <ForensicChatbot
        imageScore={imageScore}
        audioScore={audioScore}
        videoScore={videoScore}
        metaScore={metadataScore}
        warnings={warnings}
      />

      <style>{`
        .app-container {
          display: flex;
          min-height: 100vh;
        }

        .mobile-top-bar {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: #090d16;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 1000;
        }

        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mobile-brand-logo {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
        }

        .mobile-brand-title {
          font-family: var(--font-primary);
          font-size: 1.05rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .brand-gradient-text {
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .mobile-menu-toggle {
          background: transparent;
          border: none;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .mobile-menu-toggle:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .sidebar-backdrop-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 999;
        }

        .main-content-pane {
          flex-grow: 1;
          margin-left: 280px; /* Offset sidebar width */
          padding: 40px;
          min-height: 100vh;
          position: relative;
        }

        @media (max-width: 1024px) {
          .mobile-top-bar {
            display: flex;
          }

          .sidebar-backdrop-overlay {
            display: block;
          }

          .main-content-pane {
            margin-left: 0;
            padding: 20px;
            padding-top: 80px; /* Offset for toggle overlay on small screens */
          }
        }
      `}</style>
    </div>
  );
}
