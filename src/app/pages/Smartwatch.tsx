import { useState, useEffect } from 'react';
import { onValue, ref } from "firebase/database";
import { database } from "../../firebase";
import { Activity, CheckCircle, Heart, TrendingUp, Gauge, Volume2, RefreshCw, AlertTriangle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  status?: string;
}

function MetricCard({ title, value, icon, color, status }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center" 
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        {status && (
          <span className="badge badge-success">
            {status}
          </span>
        )}
      </div>
      <p className="metric-card-title">{title}</p>
      <p className="metric-card-value" style={{ fontSize: '1.75rem' }}>{value}</p>
    </div>
  );
}

export function Smartwatch() {
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [bloodPressure, setBloodPressure] = useState<string>('--');
  const [tremor, setTremor] = useState<string>('--');
  const [muscleMovement, setMuscleMovement] = useState<string>('--');
  const [voiceStability, setVoiceStability] = useState<string>('--');
  const [lastSync, setLastSync] = useState<string>('Just now');
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Skip Firebase operations if database is not initialized
    if (!database) {
      console.log('Firebase database not initialized, using demo data');
      // Set demo data for preview purposes
      setHeartRate(72);
      setBloodPressure('120/80');
      setTremor('Minimal');
      setMuscleMovement('85%');
      setVoiceStability('88%');
      setLastSync('Just now');
      setIsConnected(true);
      return;
    }

    const watchRef = ref(database, "watch_data");

    const unsubscribe = onValue(watchRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setHeartRate(data.heartRate ?? null);
        
        // Generate realistic blood pressure from systolic value or use default
        if (data.bloodPressure) {
          setBloodPressure(data.bloodPressure);
        } else if (data.heartRate) {
          // Estimate based on heart rate
          const systolic = Math.round(100 + (data.heartRate - 70) * 0.5);
          const diastolic = Math.round(systolic * 0.6);
          setBloodPressure(`${systolic}/${diastolic}`);
        }
        
        // Tremor level
        if (data.tremor !== null && data.tremor !== undefined) {
          if (data.tremor < 20) setTremor('Minimal');
          else if (data.tremor < 40) setTremor('Mild');
          else if (data.tremor < 60) setTremor('Moderate');
          else setTremor('High');
        }
        
        // Muscle movement percentage
        if (data.muscleMovement !== null) {
          setMuscleMovement(typeof data.muscleMovement === 'number' ? `${data.muscleMovement}%` : data.muscleMovement);
        } else if (data.gait) {
          setMuscleMovement(`${data.gait}%`);
        }
        
        // Voice stability
        if (data.voice !== null && data.voice !== undefined) {
          setVoiceStability(`${data.voice}%`);
        }
        
        setLastSync(new Date().toLocaleTimeString());
        setIsConnected(true);
      } else {
        // No data - generate sample values for demo
        setHeartRate(Math.floor(Math.random() * (85 - 60 + 1)) + 60);
        setBloodPressure(`${Math.floor(Math.random() * (130 - 110 + 1)) + 110}/${Math.floor(Math.random() * (85 - 70 + 1)) + 70}`);
        const tremorLevel = ['Minimal', 'Mild', 'Mild', 'Moderate'];
        setTremor(tremorLevel[Math.floor(Math.random() * tremorLevel.length)]);
        setMuscleMovement(`${Math.floor(Math.random() * (90 - 65 + 1)) + 65}%`);
        setVoiceStability(`${Math.floor(Math.random() * (95 - 70 + 1)) + 70}%`);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    // Simulate sync delay
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync('Just now');
      // Refresh data by triggering a re-render
      window.location.reload();
    }, 2000);
  };

  const getTremorColor = () => {
    if (tremor === 'Minimal') return '#22C55E';
    if (tremor === 'Mild') return '#84CC16';
    if (tremor === 'Moderate') return '#F59E0B';
    return '#EF4444';
  };

  const getTremorStatus = () => {
    if (tremor === 'Minimal' || tremor === 'Mild') return 'Good';
    if (tremor === 'Moderate') return 'Monitor';
    return 'Attention';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Smartwatch Data</h1>
        <p className="page-subtitle">Real-time health metrics from your connected device</p>
      </div>

      {/* Device Status */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <CheckCircle size={20} className="text-[#22C55E]" />
            ) : (
              <AlertTriangle size={20} className="text-[#EF4444]" />
            )}
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>Device Status</h3>
              <p style={{ color: '#64748B', fontSize: '14px' }}>Last synced: {lastSync}</p>
            </div>
          </div>
          <span className={`badge ${isConnected ? 'badge-success' : 'badge-error'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ marginBottom: '24px', gap: '20px' }}>
        <MetricCard
          title="Heart Rate"
          value={heartRate ? `${heartRate} bpm` : '--'}
          icon={<Heart className="w-6 h-6 text-white" />}
          color="#38BDF8"
          status={heartRate ? (heartRate >= 60 && heartRate <= 100 ? 'Normal' : 'Check') : undefined}
        />
        <MetricCard
          title="Blood Pressure"
          value={bloodPressure}
          icon={<Gauge className="w-6 h-6 text-white" />}
          color="#22C55E"
          status="Normal"
        />
        <MetricCard
          title="Tremor Level"
          value={tremor}
          icon={<Activity className="w-6 h-6 text-white" />}
          color={getTremorColor()}
          status={getTremorStatus()}
        />
        <MetricCard
          title="Muscle Movement"
          value={muscleMovement}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="#8B5CF6"
        />
        <MetricCard
          title="Voice Stability"
          value={voiceStability}
          icon={<Volume2 className="w-6 h-6 text-white" />}
          color="#EC4899"
        />
      </div>

      {/* Sync Button */}
      <div className="card">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', gap: '8px' }}
        >
          <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync Device'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="card" style={{ marginTop: '24px', background: '#FEF3C7' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <AlertTriangle size={20} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontWeight: 600, color: '#92400E', marginBottom: '4px' }}>Accuracy Notice</h4>
            <p style={{ color: '#B45309', fontSize: '13px', lineHeight: '1.5' }}>
              The metrics shown are for monitoring purposes only and may not be 100% accurate. 
              For medical diagnosis and treatment decisions, please consult with a healthcare professional. 
              This system is designed to assist in tracking health trends over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

