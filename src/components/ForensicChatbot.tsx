import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, HelpCircle } from 'lucide-react';

interface ForensicChatbotProps {
  imageScore?: number;
  audioScore?: number;
  videoScore?: number;
  metaScore?: number;
  warnings: string[];
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export const ForensicChatbot: React.FC<ForensicChatbotProps> = ({
  imageScore,
  audioScore,
  videoScore,
  metaScore,
  warnings
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Hello! Main DEFEND.AI Forensic Assistant hoon. 🛡️\n\nAapko digital forensics ke high-tech terms (jaise ELA, Spectrogram, pHash) se confuse hone ki zaroorat nahi hai. Main yahan aapko aasan Hindi/Hinglish aur English me saare scan reports samjhane ke liye ready hoon!'
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const quickQuestions = [
    { label: '📊 Scan Report', q: 'explain_report' },
    { label: '🎨 ELA (Image)', q: 'explain_ela' },
    { label: '🎵 Spectrogram (Audio)', q: 'explain_audio' },
    { label: '🕸️ Perceptual Hash', q: 'explain_phash' },
    { label: '📝 EXIF Metadata', q: 'explain_exif' },
    { label: '📹 Video Coherence', q: 'explain_video' },
    { label: '👁️ Live Webcam Check', q: 'explain_live' },
    { label: '🔒 Data Privacy', q: 'explain_privacy' }
  ];

  const handleSend = (text: string, isQuickQ: boolean = false) => {
    if (!text.trim() || isSearching) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user', text: isQuickQ ? getQuestionLabel(text) : text } as ChatMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsSearching(true);

    // Generate response after small delay
    setTimeout(() => {
      const responseText = getBotResponse(text);
      setMessages(prev => [...prev, { sender: 'bot', text: responseText }]);
      setIsSearching(false);
    }, 800);
  };

  const getQuestionLabel = (qKey: string): string => {
    const found = quickQuestions.find(qq => qq.q === qKey);
    return found ? found.label : qKey;
  };

  const getBotResponse = (query: string): string => {
    const q = query.toLowerCase();

    // Greetings
    if (q === 'hi' || q === 'hello' || q === 'hey' || q === 'namaste' || q.includes('kaise ho') || q === 'yo') {
      return "Hello bro! 👋 Main DEFEND.AI Forensic Assistant hoon.\n\nAapke digital forensics ke reports aur options ko aasan shabdo me samjhana mera kaam hai. Niche diye gaye chips scroll karke koi topic select karein ya direct mujhse sawal poochein!";
    }

    if (q === 'explain_report') {
      const activeReports = [];
      if (imageScore !== undefined) activeReports.push(`Image Risk: ${imageScore}%`);
      if (metaScore !== undefined) activeReports.push(`Metadata Integrity: ${metaScore}%`);
      if (audioScore !== undefined) activeReports.push(`Audio Synthetic Risk: ${audioScore}%`);
      if (videoScore !== undefined) activeReports.push(`Video Risk: ${videoScore}%`);

      if (activeReports.length === 0) {
        return "Abhi aapne koi file scan nahi ki hai, bro! Dashboard par jaakar ek Image, Audio ya Video file upload karo, fir main uski details aasan bhasha me samjhaunga.";
      }

      let analysis = "Aapke current scan ki analysis ye hai:\n\n";

      if (imageScore !== undefined) {
        analysis += `🔸 **Image ELA Check (${imageScore}% Anomaly)**: `;
        if (imageScore > 50) {
          analysis += `Is image me AI patterns ya editing pixels paye gaye hain. Skin textures aur edges natural photos se match nahi kar rahe.\n`;
        } else {
          analysis += `Pixels natural lag rahe hain. Compression rate flat hai.\n`;
        }
      }

      if (metaScore !== undefined) {
        analysis += `🔸 **EXIF Metadata (${metaScore}% Integrity)**: `;
        if (metaScore < 50) {
          analysis += `File me camera hardware aur details completely missing hain. ChatGPT/DALL-E ya web downloads me metadata clear ho jata hai. Bahut suspicious hai!\n`;
        } else {
          analysis += `File metadata normal camera profiles se match kar raha hai.\n`;
        }
      }

      if (audioScore !== undefined) {
        analysis += `🔸 **Audio Voice Check (${audioScore}% Synthetic Risk)**: `;
        if (audioScore > 50) {
          analysis += `Awaaz me synthetic vocoder pauses aur digital zero (absolute silence) mila hai. AI voice clone hone ki sambhavna bahut high hai.\n`;
        } else {
          analysis += `Awaaz ki frequency aur pauses natural lag rahe hain.\n`;
        }
      }

      if (videoScore !== undefined) {
        analysis += `🔸 **Video Coherence Check (${videoScore}% Risk)**: `;
        if (videoScore > 50) {
          analysis += `Video ke frames me face boundary transitions smoothly integrated nahi hain aur lighting mismatch hai. Deepfake indicators present hain.\n`;
        } else {
          analysis += `Video me motion aur border gradient stable hai.\n`;
        }
      }

      if (warnings.length > 0) {
        analysis += `\n⚠️ **Forensic Warnings**: \n`;
        warnings.slice(0, 3).forEach(w => {
          analysis += `- ${w}\n`;
        });
      }

      const maxRisk = Math.max(
        imageScore || 0,
        audioScore || 0,
        videoScore || 0,
        metaScore !== undefined ? 100 - metaScore : 0
      );

      analysis += `\n🎯 **Final Conclusion**: `;
      if (maxRisk >= 50) {
        analysis += `🚨 **DEEPFAKE/SUSPICIOUS!** Is image/audio/video me AI generation ya tampering ke solid traces hain. Is par trust na karein.`;
      } else {
        analysis += `✅ **SAFE!** Abhi tak is file me koi AI modification signature nahi mila hai.`;
      }

      return analysis;
    }

    if (q === 'explain_ela' || q.includes('ela') || q.includes('error level')) {
      return "🎨 **Error Level Analysis (ELA) kya hai? (Simple terms)**\n\nJab hum kisi image ko JPEG format me save karte hain, to poori photo me ek jaisa compression hota hai. Lekin agar hum photo me photoshop karein (jaise kisi ka chehra badlein), to vo modified part dobara save hone par alag compression rate chhodta hai.\n\nELA wahi compression difference filter karta hai. Hamara tool image ko re-save karke original pixels se ghata deta hai. Jo hissa altered hai, vo screen par **glow** karega. Agar poori photo dark/uniform hai, to photo authentic hai!";
    }

    if (q === 'explain_audio' || q.includes('audio') || q.includes('spectrogram') || q.includes('voice')) {
      return "🎵 **Acoustic Spectrogram kya hai? (Simple terms)**\n\nJaise hamari body ka fingerprint hota hai, waise hi human voice ka ek graphic representation hota hai jise 'Spectrogram' bolte hain. \n\n* **Real voice** me bolte waqt background noise aur organic breathing sound humesha chalti rehti hai.\n* **AI Voice clones** me pauses ke dauran voice pitch mathematically exact zero (sannata) ho jati hai aur high-pitch robot anomalies aati hain.\n\nHamara tool isi waveform aur frequency changes ko visual graph (waterfall) me trace karke robot vocoders ko pakad leta hai!";
    }

    if (q === 'explain_phash' || q.includes('hash') || q.includes('phash')) {
      return "🕸️ **Perceptual Hash aur Footprint Scanner kya hai? (Simple terms)**\n\nPerceptual Hashing (pHash) kisi photo ke facial geometry aur colors ko compress karke ek 64-bit Hex code (jaise unique ID) banata hai. \n\nFootprint Tracer is code ka use karke internet par similarity check chalata hai. Kyunki local app me Google Lens background me access nahi ho sakta, maine upar **TinEye** aur **Google Lens** ke live redirect button diye hain. \n\n💡 **Tip**: Aap hamare scanner ke preview photo ko drag karke direct us Google Lens tab me drop kar sakte hain, aur poora internet automatic scan ho jayega!";
    }

    if (q === 'explain_exif' || q.includes('exif') || q.includes('metadata') || q.includes('gps')) {
      return "📝 **EXIF Metadata kya hota hai? (Simple terms)**\n\nEXIF data ek digital photo ka 'birth certificate' hota hai. Isme camera brand, model, lens details aur photo kheenchne ka time save hota hai.\n\nAI se banayi gayi photos (jaise Midjourney) me yeh camera tags missing hote hain aur metadata completely clear ho jata hai. Hamara tool isko trace karke warning deta hai taaki aapko pata chale ki photo natural camera se nahi, balki internet download ya AI generated ho sakti hai!";
    }

    if (q === 'explain_video' || q.includes('video') || q.includes('coherence') || q.includes('jitter')) {
      return "📹 **Video Forensics kaise kaam karta hai? (Simple terms)**\n\nVideo actually bahut saari photos (frames) ko fast speed me chalana hota hai. AI deepfake video banate waqt chehra replace kar deta hai.\n\nLekin jab face hilta hai, toh face ke border margins me lightning badal jati hai ya structural anomalies aati hain. Hamara tool frame-by-frame boundaries scale karta hai aur dynamic jitter (kampan) ko graph me map karta hai!";
    }

    if (q === 'explain_live' || q.includes('live') || q.includes('webcam') || q.includes('biometric')) {
      return "👁️ **Live Webcam Scanner kya hai? (Simple terms)**\n\nWebcam feed ko capture karke biometrics aur landmark mesh nodes (jaise eye alignment, head yaw/pitch) track karta hai.\n\nBypass checks ko detect karne ke liye biological signals monitor hote hain—jaise aapka blink rate (aankhein jhapkana) ya head rotations. Agar structural details boundary edges se match nahi karti, toh security flag high ho jayega!";
    }

    if (q === 'explain_privacy' || q.includes('privacy') || q.includes('safe') || q.includes('local') || q.includes('upload')) {
      return "🔒 **Kya mera data safe hai? (100% Privacy Guard)**\n\nHanji bro! Yeh suite 100% **Client-Side** (locally aapke browser me) hi chalta hai. \n\nAap jo bhi image, audio ya video load karte hain, vo kisi bhi server par transmit nahi hoti. Saari processing aapke machine par execute ho rahi hai, isliye aap bina kisi darr ke upload kar sakte hain!";
    }

    if (q.includes('help') || q.includes('use') || q.includes('how')) {
      return "Aap is tool ko simply use kar sakte hain:\n1. Dashboard par koi bhi image/audio/video file drop karke load karein.\n2. Lab tabs (Image, Audio, Video) automatically open ho jayenge aur scan start ho jayega.\n3. Analysis scores aur Certificate check karein.\n4. Kuch na samajh aaye, to chat par mujhse 'Explain my Scan Report' puchh lein! 😊";
    }

    return "Samajh gaya bro! Agar aapko ELA, EXIF metadata, voice analysis, ya data privacy ke baare me kuch aur samajhna ho, to batao. Ya direct niche scrollable chips me se koi ek select karo!";
  };

  return (
    <div className="forensic-chatbot-wrapper">
      {/* Floating Chat Icon */}
      {!isOpen && (
        <button className="chat-trigger-btn" onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
          <span className="btn-tooltip">Forensic Chatbot</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window-card cyber-card">
          <div className="chat-header">
            <div className="bot-info-block">
              <div className="bot-icon-wrapper">
                <Bot className="bot-icon" size={18} />
              </div>
              <div>
                <h5>Forensic Assistant</h5>
                <p>Offline Forensic Guide Node</p>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chat-messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`msg-bubble-wrap ${msg.sender}`}>
                <div className={`msg-bubble ${msg.sender}`}>
                  {msg.text.split('\n').map((line, k) => (
                    <p key={k} style={{ marginBottom: line.trim() === '' ? '8px' : '2px' }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {isSearching && (
              <div className="msg-bubble-wrap bot">
                <div className="msg-bubble bot typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Click Question Chips */}
          <div className="quick-chips-row">
            {quickQuestions.map((qq, i) => (
              <button
                key={i}
                className="quick-chip-btn"
                onClick={() => handleSend(qq.q, true)}
                disabled={isSearching}
              >
                <HelpCircle size={10} /> {qq.label}
              </button>
            ))}
          </div>

          {/* User Input bar */}
          <form
            className="chat-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue, false);
            }}
          >
            <input
              type="text"
              placeholder="Poochho (e.g., What is ELA?)..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="chat-send-btn">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        .forensic-chatbot-wrapper {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 10000;
          font-family: var(--font-primary);
        }

        .chat-trigger-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-cyan) 0%, var(--color-blue) 100%);
          border: none;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .chat-trigger-btn:hover {
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
        }

        .btn-tooltip {
          position: absolute;
          right: 70px;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          font-size: 0.72rem;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 6px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
          box-shadow: var(--shadow-md);
        }

        .chat-trigger-btn:hover .btn-tooltip {
          opacity: 1;
        }

        .chat-window-card {
          width: 380px;
          height: 500px;
          display: flex;
          flex-direction: column;
          padding: 0 !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          box-shadow: var(--shadow-xl), 0 0 30px rgba(0, 0, 0, 0.3) !important;
          border-radius: 16px;
        }

        @media (max-width: 440px) {
          .chat-window-card {
            width: calc(100vw - 40px);
            height: calc(100vh - 100px);
            bottom: 10px;
            right: 10px;
          }
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0f172a;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 14px 20px;
          border-top-left-radius: 15px;
          border-top-right-radius: 15px;
        }

        .bot-info-block {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bot-icon-wrapper {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bot-icon {
          color: #3b82f6;
        }

        .chat-header h5 {
          font-family: var(--font-primary);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .chat-header p {
          font-size: 0.65rem;
          color: var(--text-secondary);
          margin-top: 1px;
        }

        .chat-close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: color 0.2s;
        }

        .chat-close-btn:hover {
          color: var(--color-alert);
        }

        .chat-messages-container {
          flex-grow: 1;
          padding: 18px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: rgba(10, 12, 22, 0.25);
        }

        .msg-bubble-wrap {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          max-width: 80%;
        }

        .msg-bubble-wrap.user {
          align-self: flex-end;
        }

        .msg-bubble-wrap.bot {
          align-self: flex-start;
        }

        .msg-bubble {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.82rem;
          line-height: 1.4;
          word-break: break-word;
        }

        .msg-bubble.user {
          background: linear-gradient(135deg, var(--color-cyan) 0%, var(--color-blue) 100%);
          color: #ffffff;
          border-bottom-right-radius: 2px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }

        .msg-bubble.bot {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #f1f5f9;
          border-bottom-left-radius: 2px;
        }

        .msg-bubble.bot strong {
          color: #60a5fa;
        }

        .quick-chips-row {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          gap: 6px;
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          background: #0d1222;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .quick-chips-row::-webkit-scrollbar {
          display: none;
        }

        .quick-chip-btn {
          flex-shrink: 0;
          background: rgba(59, 130, 246, 0.04);
          border: 1px solid rgba(59, 130, 246, 0.18);
          color: #60a5fa;
          font-size: 0.7rem;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .quick-chip-btn:hover {
          background: var(--color-cyan);
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
          border-color: var(--color-cyan);
        }

        .chat-input-bar {
          display: flex;
          padding: 12px;
          background: #0f172a;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom-left-radius: 15px;
          border-bottom-right-radius: 15px;
          gap: 8px;
        }

        .chat-input-bar input {
          flex-grow: 1;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          color: var(--text-primary);
          padding: 8px 12px;
          font-size: 0.8rem;
          outline: none;
          transition: all 0.2s;
        }

        .chat-input-bar input:focus {
          border-color: var(--color-cyan);
          background: rgba(255, 255, 255, 0.06);
        }

        .chat-send-btn {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, var(--color-cyan) 0%, var(--color-blue) 100%);
          border: none;
          color: #ffffff;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }

        .chat-send-btn:hover {
          transform: scale(1.08);
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: var(--color-cyan);
          border-radius: 50%;
          display: inline-block;
          animation: dot-bounce 1.4s infinite ease-in-out both;
        }

        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes dot-bounce {
          0%, 80%, 100% { 
            transform: scale(0.3);
            opacity: 0.3;
          } 40% { 
            transform: scale(1.0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
