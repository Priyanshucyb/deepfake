import { useState } from 'react';
import { TabNavigation } from './components/TabNavigation';
import { DashboardHome } from './components/DashboardHome';
import { ImageForensics } from './components/ImageForensics';
import { AudioForensics } from './components/AudioForensics';
import { VideoForensics } from './components/VideoForensics';
import { LiveScanner } from './components/LiveScanner';
import { FootprintScanner } from './components/FootprintScanner';
import { ForensicChatbot } from './components/ForensicChatbot';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

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
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

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

        .main-content-pane {
          flex-grow: 1;
          margin-left: 280px; /* Offset sidebar width */
          padding: 40px;
          min-height: 100vh;
          position: relative;
        }

        @media (max-width: 1024px) {
          .main-content-pane {
            margin-left: 0;
            padding: 24px;
            padding-top: 80px; /* Offset for toggle overlay on small screens */
          }
        }
      `}</style>
    </div>
  );
}
