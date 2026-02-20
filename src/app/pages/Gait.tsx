import { useState, useEffect } from 'react';
import { Upload, TrendingUp } from 'lucide-react';

const FIREBASE_URL =
  "https://neurowatch-b3b08-default-rtdb.firebaseio.com/watch_data.json";

export function Gait() {
  const [analyzed, setAnalyzed] = useState(false);
  const [fileName, setFileName] = useState('');
  const [firebaseGait, setFirebaseGait] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(FIREBASE_URL);
        const data = await res.json();

        if (data) {
          setFirebaseGait(data.gait ?? null);
        }
      } catch (error) {
        console.error("Firebase error:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setAnalyzed(false);
    }
  };

  const handleAnalyze = () => {
    if (fileName) {
      setAnalyzed(true);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Gait Analysis</h1>
        <p className="page-subtitle">Upload a video to analyze your walking pattern</p>
      </div>

      {/* Upload Area */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ 
          border: '2px dashed #E2E8F0', 
          borderRadius: '12px', 
          padding: '48px', 
          textAlign: 'center' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="metric-card-icon primary" style={{ marginBottom: '16px' }}>
              <Upload size={28} />
            </div>

            <h3 style={{ marginBottom: '8px', fontWeight: 600 }}>Upload Video</h3>

            <p style={{ color: '#64748B', marginBottom: '16px' }}>
              Drag and drop a video file or click to browse
            </p>

            <input
              type="file"
              id="video-upload"
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <label
              htmlFor="video-upload"
              className="btn btn-primary"
              style={{ cursor: 'pointer' }}
            >
              Choose File
            </label>

            {fileName && (
              <p style={{ marginTop: '16px', color: '#22C55E', fontWeight: 500 }}>
                Selected: {fileName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Analyze Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={handleAnalyze}
          disabled={!fileName}
          className="btn btn-lg"
          style={{ 
            width: '100%',
            backgroundColor: fileName ? '#2563EB' : '#E2E8F0',
            color: fileName ? '#fff' : '#64748B',
            cursor: fileName ? 'pointer' : 'not-allowed',
            border: 'none'
          }}
        >
          Analyze Gait
        </button>
      </div>

      {/* Result Card */}
      {analyzed && (
        <div className="card animate-fadeIn">
          <div className="chart-header">
            <TrendingUp size={22} style={{ color: '#22C55E' }} />
            <h2 className="chart-title">Analysis Results</h2>
          </div>

          <div style={{ 
            background: '#F8FAFC', 
            borderRadius: '12px', 
            padding: '32px', 
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>Gait Score</span>
            </div>

            <div style={{ fontSize: '4rem', fontWeight: 700, color: '#22C55E', marginBottom: '16px' }}>
              {firebaseGait ?? 87}
            </div>

            <span className="badge badge-success">Good</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px', 
              background: '#F8FAFC', 
              borderRadius: '8px' 
            }}>
              <span style={{ fontWeight: 500, color: '#0F172A' }}>Step Length</span>
              <span className="badge badge-success">Normal</span>
            </div>

            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px', 
              background: '#F8FAFC', 
              borderRadius: '8px' 
            }}>
              <span style={{ fontWeight: 500, color: '#0F172A' }}>Stride Width</span>
              <span className="badge badge-success">Normal</span>
            </div>

            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px', 
              background: '#F8FAFC', 
              borderRadius: '8px' 
            }}>
              <span style={{ fontWeight: 500, color: '#0F172A' }}>Walking Speed</span>
              <span className="badge badge-warning">Slightly Slow</span>
            </div>

            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px', 
              background: '#F8FAFC', 
              borderRadius: '8px' 
            }}>
              <span style={{ fontWeight: 500, color: '#0F172A' }}>Balance</span>
              <span className="badge badge-success">Good</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

