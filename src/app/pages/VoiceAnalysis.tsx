import { useState, useRef } from "react";
import { Upload, Mic, TrendingUp } from "lucide-react";

const FIREBASE_VOICE_URL =
  "https://neurowatch-b3b08-default-rtdb.firebaseio.com/watch_data";

export function VoiceAnalysis() {
  const [fileName, setFileName] = useState("");
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [voiceScore, setVoiceScore] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Upload file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setAudioURL(URL.createObjectURL(file));
      setAnalyzed(false);
    }
  };

  // Start recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
      setFileName("Recorded Audio");
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  // Analyze
  const handleAnalyze = async () => {
    if (!audioURL) return;

    const randomScore = Math.floor(Math.random() * 20) + 80;
    setVoiceScore(randomScore);
    setAnalyzed(true);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.username) return;

    await fetch(`${FIREBASE_VOICE_URL}/${user.username}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voice: randomScore,
      }),
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Voice Analysis</h1>
        <p className="page-subtitle">Record or upload voice samples to analyze stability</p>
      </div>

      <div className="card">
        {/* RECORD + UPLOAD SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ gap: '24px' }}>

          {/* Record */}
          <div style={{ 
            border: '1px solid #E2E8F0', 
            borderRadius: '12px', 
            padding: '24px', 
            textAlign: 'center' 
          }}>
            <Mic size={40} style={{ margin: '0 auto 16px', color: '#2563EB' }} />
            <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Record Voice</h3>

            {!recording ? (
              <button
                onClick={startRecording}
                className="btn btn-primary"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="btn"
                style={{ backgroundColor: '#EF4444', color: 'white' }}
              >
                Stop Recording
              </button>
            )}
          </div>

          {/* Upload */}
          <div style={{ 
            border: '1px solid #E2E8F0', 
            borderRadius: '12px', 
            padding: '24px', 
            textAlign: 'center' 
          }}>
            <Upload size={40} style={{ margin: '0 auto 16px', color: '#64748B' }} />
            <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Upload Audio</h3>

            <input
              type="file"
              accept="audio/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
            >
              Choose File
            </button>

            {fileName && (
              <p style={{ marginTop: '12px', color: '#22C55E', fontSize: '14px' }}>
                Selected: {fileName}
              </p>
            )}
          </div>
        </div>

        {/* Audio Preview */}
        {audioURL && (
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <audio 
              controls 
              src={audioURL} 
              style={{ width: '100%', maxWidth: '400px' }} 
            />
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!audioURL}
          className="btn btn-primary btn-lg"
          style={{ 
            width: '100%', 
            marginTop: '24px',
            opacity: audioURL ? 1 : 0.5,
            cursor: audioURL ? 'pointer' : 'not-allowed'
          }}
        >
          Analyze Voice
        </button>

        {/* Result */}
        {analyzed && (
          <div style={{ marginTop: '32px', textAlign: 'center' }} className="animate-fadeIn">
            <TrendingUp size={32} style={{ margin: '0 auto 8px', color: '#22C55E' }} />
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0F172A' }}>
              {voiceScore}
            </h2>
            <p style={{ color: '#64748B', marginTop: '4px' }}>Voice Stability Score</p>
          </div>
        )}
      </div>
    </div>
  );
}

