import { useState, useRef, useEffect } from "react";
import { Upload, Mic, TrendingUp, Activity, AlertCircle, CheckCircle, Loader2, AudioLines } from "lucide-react";

// Firebase URL
const FIREBASE_URL = "https://neurowatch-b3b08-default-rtdb.firebaseio.com/watch_data";

interface VoiceAnalysisResult {
  voiceScore: number;
  pitchStability: string;
  volumeStability: string;
  speechClarity: string;
  jitter: number;
  shimmer: number;
  overallAssessment: string;
}

export function VoiceAnalysis() {
  const [fileName, setFileName] = useState("");
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VoiceAnalysisResult | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Upload file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setAudioURL(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setFileName("Recorded Audio");
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setError(null);
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Analyze audio using Web Audio API
  const analyzeAudio = async () => {
    if (!audioURL) return;

    setAnalyzing(true);
    setError(null);

    try {
      // Create audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Load audio file
      const response = await fetch(audioURL);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Get audio data
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const duration = audioBuffer.duration;

      // Perform voice analysis
      const analysis = performVoiceAnalysis(channelData, sampleRate, duration);
      setResult(analysis);

      // Save to Firebase
      await saveToFirebase(analysis);

    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze audio. Please try with a clearer recording.');
    } finally {
      setAnalyzing(false);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  // Perform voice analysis algorithms
  const performVoiceAnalysis = (
    channelData: Float32Array, 
    sampleRate: number, 
    duration: number
  ): VoiceAnalysisResult => {
    
    // Calculate various voice metrics
    
    // 1. Energy/RMS (volume)
    let sumSquares = 0;
    for (let i = 0; i < channelData.length; i++) {
      sumSquares += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sumSquares / channelData.length);
    
    // 2. Zero Crossing Rate (speech clarity indicator)
    let zeroCrossings = 0;
    for (let i = 1; i < channelData.length; i++) {
      if ((channelData[i] >= 0 && channelData[i-1] < 0) || 
          (channelData[i] < 0 && channelData[i-1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zcr = zeroCrossings / channelData.length;

    // 3. Pitch estimation using autocorrelation
    const pitch = detectPitch(channelData, sampleRate);
    
    // 4. Jitter (pitch variation) - measure of fundamental frequency variation
    const jitter = calculateJitter(channelData, sampleRate);
    
    // 5. Shimmer (amplitude variation)
    const shimmer = calculateShimmer(channelData);

    // Calculate scores (0-100)
    // Jitter: lower is better (0-0.1 is normal)
    const jitterScore = Math.max(0, Math.min(100, 100 - (jitter * 1000)));
    
    // Shimmer: lower is better (0-0.5 is normal)
    const shimmerScore = Math.max(0, Math.min(100, 100 - (shimmer * 200)));
    
    // Volume stability
    const volumeScore = rms > 0.01 ? Math.min(100, rms * 5000) : 50;
    
    // Overall voice score
    const voiceScore = Math.round((jitterScore + shimmerScore + volumeScore) / 3);

    // Determine status strings
    const getStatus = (score: number) => {
      if (score >= 70) return 'Good';
      if (score >= 50) return 'Fair';
      return 'Needs Improvement';
    };

    return {
      voiceScore,
      pitchStability: jitterScore >= 60 ? 'Stable' : jitterScore >= 40 ? 'Slightly Unstable' : 'Unstable',
      volumeStability: volumeScore >= 60 ? 'Stable' : volumeScore >= 40 ? 'Slightly Variable' : 'Variable',
      speechClarity: zcr > 0.05 && zcr < 0.5 ? 'Clear' : zcr >= 0.5 ? 'Rapid' : 'Slow',
      jitter: Math.round(jitter * 10000) / 10000,
      shimmer: Math.round(shimmer * 10000) / 10000,
      overallAssessment: voiceScore >= 70 ? 'Healthy' : voiceScore >= 50 ? 'Monitor' : 'Consult Doctor'
    };
  };

  // Pitch detection using autocorrelation
  const detectPitch = (channelData: Float32Array, sampleRate: number): number => {
    const bufferSize = 2048;
    const correlation = new Float32Array(bufferSize);
    
    for (let lag = 0; lag < bufferSize; lag++) {
      let sum = 0;
      for (let i = 0; i < bufferSize - lag; i++) {
        sum += channelData[i] * channelData[i + lag];
      }
      correlation[lag] = sum;
    }

    // Find the first peak after the initial drop
    let maxCorrelation = 0;
    let bestLag = 0;
    for (let lag = 20; lag < bufferSize / 2; lag++) {
      if (correlation[lag] > maxCorrelation) {
        maxCorrelation = correlation[lag];
        bestLag = lag;
      }
    }

    if (bestLag > 0) {
      return sampleRate / bestLag;
    }
    return 0;
  };

  // Calculate Jitter (pitch variation)
  const calculateJitter = (channelData: Float32Array, sampleRate: number): number => {
    const frameSize = Math.floor(sampleRate * 0.01); // 10ms frames
    const periods: number[] = [];
    
    for (let i = 0; i < channelData.length - frameSize; i += frameSize) {
      const frame = channelData.slice(i, i + frameSize);
      const pitch = detectPitch(frame, sampleRate);
      if (pitch > 50 && pitch < 500) {
        periods.push(1000 / pitch); // Convert to ms
      }
    }

    if (periods.length < 2) return 0;

    // Calculate average period-to-period variation
    let sumDiff = 0;
    for (let i = 1; i < periods.length; i++) {
      sumDiff += Math.abs(periods[i] - periods[i-1]);
    }

    const avgPeriod = periods.reduce((a, b) => a + b, 0) / periods.length;
    return avgPeriod > 0 ? sumDiff / ((periods.length - 1) * avgPeriod) : 0;
  };

  // Calculate Shimmer (amplitude variation)
  const calculateShimmer = (channelData: Float32Array): number => {
    const frameSize = 1024;
    const amplitudes: number[] = [];
    
    for (let i = 0; i < channelData.length - frameSize; i += frameSize) {
      let sum = 0;
      for (let j = i; j < i + frameSize; j++) {
        sum += Math.abs(channelData[j]);
      }
      amplitudes.push(sum / frameSize);
    }

    if (amplitudes.length < 2) return 0;

    let sumDiff = 0;
    for (let i = 1; i < amplitudes.length; i++) {
      sumDiff += Math.abs(amplitudes[i] - amplitudes[i-1]);
    }

    const avgAmplitude = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
    return avgAmplitude > 0 ? sumDiff / ((amplitudes.length - 1) * avgAmplitude) : 0;
  };

  // Save to Firebase
  const saveToFirebase = async (analysis: VoiceAnalysisResult) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user?.username) return;

      await fetch(`${FIREBASE_URL}/${user.username}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice: analysis.voiceScore,
          jitter: analysis.jitter,
          shimmer: analysis.shimmer,
          updatedAt: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Firebase save error:', err);
    }
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'Good':
      case 'Stable':
      case 'Clear':
      case 'Healthy':
        return 'badge-success';
      case 'Fair':
      case 'Slightly Unstable':
      case 'Slightly Variable':
      case 'Rapid':
      case 'Monitor':
        return 'badge-warning';
      case 'Needs Improvement':
      case 'Unstable':
      case 'Variable':
      case 'Slow':
      case 'Consult Doctor':
        return 'badge-error';
      default:
        return 'badge-info';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Voice Analysis</h1>
        <p className="page-subtitle">Record or upload voice samples to analyze voice stability and detect potential neurological issues</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card" style={{ marginBottom: '24px', background: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={20} style={{ color: '#DC2626' }} />
            <span style={{ color: '#991B1B' }}>{error}</span>
          </div>
        </div>
      )}

      <div className="card">
        {/* RECORD + UPLOAD SECTION */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>

          {/* Record */}
          <div style={{ 
            border: '1px solid #E2E8F0', 
            borderRadius: '12px', 
            padding: '24px', 
            textAlign: 'center' 
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: recording ? '#FEE2E2' : '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Mic size={32} style={{ color: recording ? '#EF4444' : '#2563EB' }} />
            </div>
            <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Record Voice</h3>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
              {recording ? 'Recording in progress...' : 'Click to start recording'}
            </p>

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
            
            {recording && (
              <div style={{ marginTop: '12px' }}>
                <span style={{ color: '#EF4444', fontSize: '12px' }}>
                  ● Recording
                </span>
              </div>
            )}
          </div>

          {/* Upload */}
          <div style={{ 
            border: '1px solid #E2E8F0', 
            borderRadius: '12px', 
            padding: '24px', 
            textAlign: 'center' 
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Upload size={32} style={{ color: '#64748B' }} />
            </div>
            <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Upload Audio</h3>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
              Select an audio file (MP3, WAV, WebM)
            </p>

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
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontWeight: 600 }}>Audio Preview</h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '16px',
              background: '#F8FAFC',
              borderRadius: '12px'
            }}>
              <AudioLines size={24} style={{ color: '#2563EB' }} />
              <audio 
                controls 
                src={audioURL} 
                style={{ width: '100%' }} 
              />
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={analyzeAudio}
          disabled={!audioURL || analyzing}
          className="btn btn-primary btn-lg"
          style={{ 
            width: '100%', 
            marginTop: '24px',
            opacity: audioURL && !analyzing ? 1 : 0.5,
            cursor: audioURL && !analyzing ? 'pointer' : 'not-allowed'
          }}
        >
          {analyzing ? (
            <>
              <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} />
              Analyzing Voice with AI...
            </>
          ) : (
            'Analyze Voice'
          )}
        </button>

        {/* Results */}
        {result && (
          <div style={{ marginTop: '32px' }} className="animate-fadeIn">
            {/* Main Score */}
            <div style={{ 
              background: '#F8FAFC', 
              borderRadius: '12px', 
              padding: '32px', 
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <TrendingUp size={32} style={{ margin: '0 auto 8px', color: '#22C55E' }} />
              <h2 style={{ fontSize: '4rem', fontWeight: 700, color: '#0F172A' }}>
                {result.voiceScore}
              </h2>
              <p style={{ color: '#64748B', marginTop: '4px' }}>Voice Stability Score</p>
              <span 
                className={`badge ${getBadgeClass(result.overallAssessment)}`}
                style={{ marginTop: '12px' }}
              >
                {result.overallAssessment === 'Healthy' ? 'Healthy Voice' : 
                 result.overallAssessment === 'Monitor' ? 'Monitor Voice Health' : 
                 'Consult Healthcare Provider'}
              </span>
            </div>

            {/* Metrics Grid */}
            <h3 style={{ fontWeight: 600, marginBottom: '12px' }}>Voice Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div style={{ 
                padding: '16px', 
                background: '#F8FAFC', 
                borderRadius: '8px' 
              }}>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>Pitch Stability</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{result.pitchStability}</span>
                  <span className={`badge ${getBadgeClass(result.pitchStability)}`}>{result.pitchStability}</span>
                </div>
              </div>

              <div style={{ 
                padding: '16px', 
                background: '#F8FAFC', 
                borderRadius: '8px' 
              }}>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>Volume Stability</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{result.volumeStability}</span>
                  <span className={`badge ${getBadgeClass(result.volumeStability)}`}>{result.volumeStability}</span>
                </div>
              </div>

              <div style={{ 
                padding: '16px', 
                background: '#F8FAFC', 
                borderRadius: '8px' 
              }}>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>Speech Clarity</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{result.speechClarity}</span>
                  <span className={`badge ${getBadgeClass(result.speechClarity)}`}>{result.speechClarity}</span>
                </div>
              </div>
            </div>

            {/* Technical Metrics */}
            <h3 style={{ fontWeight: 600, marginBottom: '12px' }}>Technical Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ 
                padding: '16px', 
                background: '#F0FDF4', 
                borderRadius: '8px',
                border: '1px solid #BBF7D0'
              }}>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>Jitter (Pitch Variation)</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22C55E' }}>
                  {result.jitter.toFixed(4)}
                </p>
                <p style={{ color: '#64748B', fontSize: '12px' }}>Lower is better {"<"}0.01)</p>
              </div>

              <div style={{ 
                padding: '16px', 
                background: '#F0FDF4', 
                borderRadius: '8px',
                border: '1px solid #BBF7D0'
              }}>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>Shimmer (Volume Variation)</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22C55E' }}>
                  {result.shimmer.toFixed(4)}
                </p>
                <p style={{ color: '#64748B', fontSize: '12px' }}>Lower is better {"<"}0.05)</p>
              </div>
            </div>

            {/* AI Insights */}
            <div style={{ 
              padding: '20px', 
              background: '#EFF6FF', 
              borderRadius: '12px',
              border: '1px solid #BFDBFE'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Activity size={20} style={{ color: '#2563EB' }} />
                <h3 style={{ fontWeight: 600, color: '#1E40AF' }}>AI Insights</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.jitter < 0.01 && result.shimmer < 0.05 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22C55E' }}>
                    <CheckCircle size={16} />
                    <span>Your voice shows excellent stability with minimal pitch and volume variations.</span>
                  </div>
                ) : (
                  <>
                    {result.jitter >= 0.01 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B' }}>
                        <AlertCircle size={16} />
                        <span>Elevated pitch variation detected. This could indicate vocal cord tension or neurological factors.</span>
                      </div>
                    )}
                    {result.shimmer >= 0.05 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B' }}>
                        <AlertCircle size={16} />
                        <span>Volume instability detected. This may be due to breath control issues or tremor.</span>
                      </div>
                    )}
                  </>
                )}
                {result.voiceScore < 50 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444' }}>
                    <AlertCircle size={16} />
                    <span>Voice analysis shows significant abnormalities. Consider consulting a healthcare professional.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

