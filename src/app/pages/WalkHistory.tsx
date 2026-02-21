import { useState, useEffect } from 'react';
import { 
  Footprints, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Bell,
  CheckCircle,
  Activity
} from 'lucide-react';

const FIREBASE_WALK_URL = "https://neurowatch-b3b08-default-rtdb.firebaseio.com/walk_data";

interface WalkSession {
  id: string;
  date: string;
  time: string;
  duration: number; // minutes
  steps: number;
  distance: number; // meters
  path: { lat: number; lng: number }[];
  deviation: boolean;
}

interface PatternData {
  mostFrequentPath: string;
  usualTime: string;
  averageSteps: number;
  totalWalks: number;
}

// Sample data for demonstration
const sampleWalks: WalkSession[] = [
  {
    id: '1',
    date: '2025-01-15',
    time: '08:30',
    duration: 25,
    steps: 3200,
    distance: 2400,
    path: [
      { lat: 40.7128, lng: -74.0060 },
      { lat: 40.7130, lng: -74.0062 },
      { lat: 40.7135, lng: -74.0065 },
    ],
    deviation: false,
  },
  {
    id: '2',
    date: '2025-01-14',
    time: '18:00',
    duration: 30,
    steps: 3800,
    distance: 2850,
    path: [
      { lat: 40.7128, lng: -74.0060 },
      { lat: 40.7125, lng: -74.0065 },
      { lat: 40.7120, lng: -74.0070 },
    ],
    deviation: true,
  },
  {
    id: '3',
    date: '2025-01-13',
    time: '08:00',
    duration: 20,
    steps: 2600,
    distance: 1950,
    path: [
      { lat: 40.7128, lng: -74.0060 },
      { lat: 40.7130, lng: -74.0062 },
      { lat: 40.7132, lng: -74.0064 },
    ],
    deviation: false,
  },
];

const samplePattern: PatternData = {
  mostFrequentPath: 'Morning Park Route',
  usualTime: '08:00 - 09:00 AM',
  averageSteps: 3200,
  totalWalks: 15,
};

export function WalkHistory() {
  const [walks, setWalks] = useState<WalkSession[]>(sampleWalks);
  const [pattern, setPattern] = useState<PatternData>(samplePattern);
  const [expandedWalk, setExpandedWalk] = useState<string | null>(null);
  const [deviationAlert, setDeviationAlert] = useState<string | null>(null);

  useEffect(() => {
    // Check for deviations
    const recentDeviations = walks.filter(w => w.deviation);
    if (recentDeviations.length > 0) {
      setDeviationAlert(`Alert: ${recentDeviations.length} unusual walking pattern(s) detected recently`);
    }

    // Try to fetch from Firebase
    const fetchWalks = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user?.username) return;

        const response = await fetch(`${FIREBASE_WALK_URL}/${user.username}.json`);
        const data = await response.json();
        
        if (data) {
          const walkArray = Object.entries(data).map(([id, walk]) => ({
            id,
            ...(walk as Omit<WalkSession, 'id'>)
          }));
          setWalks([...sampleWalks, ...walkArray]);
        }
      } catch (error) {
        console.log('Using sample walk data');
      }
    };

    fetchWalks();
  }, []);

  const toggleWalk = (id: string) => {
    setExpandedWalk(expandedWalk === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (deviation: boolean) => {
    if (deviation) {
      return (
        <span style={{ 
          background: '#FEF2F2', 
          color: '#DC2626', 
          padding: '4px 10px', 
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <AlertTriangle size={12} />
          Unusual Pattern
        </span>
      );
    }
    return (
      <span style={{ 
        background: '#F0FDF4', 
        color: '#16A34A', 
        padding: '4px 10px', 
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <CheckCircle size={12} />
        Normal
      </span>
    );
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Walk History & Pattern Detection</h1>
        <p className="page-subtitle">Track your walking patterns and detect deviations from your usual routes</p>
      </div>

      {/* Deviation Alert */}
      {deviationAlert && (
        <div className="card" style={{ 
          marginBottom: '24px', 
          background: '#FEF2F2', 
          border: '1px solid #FECACA',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle size={20} style={{ color: '#DC2626' }} />
          <span style={{ color: '#991B1B', fontWeight: 500 }}>{deviationAlert}</span>
          <button 
            onClick={() => setDeviationAlert(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Pattern Summary */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <TrendingUp size={22} style={{ color: '#2563EB' }} />
          <h2 className="chart-title">Your Walking Patterns</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
          <div style={{ 
            background: '#F8FAFC', 
            padding: '20px', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <MapPin size={24} style={{ color: '#2563EB', marginBottom: '8px' }} />
            <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '4px' }}>Most Frequent Route</p>
            <p style={{ fontWeight: 600, color: '#0F172A' }}>{pattern.mostFrequentPath}</p>
          </div>

          <div style={{ 
            background: '#F8FAFC', 
            padding: '20px', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <Clock size={24} style={{ color: '#22C55E', marginBottom: '8px' }} />
            <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '4px' }}>Usual Walking Time</p>
            <p style={{ fontWeight: 600, color: '#0F172A' }}>{pattern.usualTime}</p>
          </div>

          <div style={{ 
            background: '#F8FAFC', 
            padding: '20px', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <Activity size={24} style={{ color: '#F59E0B', marginBottom: '8px' }} />
            <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '4px' }}>Average Steps</p>
            <p style={{ fontWeight: 600, color: '#0F172A' }}>{pattern.averageSteps.toLocaleString()}</p>
          </div>
        </div>

        <div style={{ 
          marginTop: '16px', 
          padding: '12px 16px', 
          background: '#EFF6FF', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Calendar size={16} style={{ color: '#2563EB' }} />
          <span style={{ color: '#1E40AF', fontSize: '14px' }}>
            Total walks tracked: <strong>{pattern.totalWalks}</strong> this month
          </span>
        </div>
      </div>

      {/* Walk History List */}
      <div className="card">
        <div className="chart-header">
          <Footprints size={22} style={{ color: '#2563EB' }} />
          <h2 className="chart-title">Walk History</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {walks.map((walk) => (
            <div 
              key={walk.id}
              style={{ 
                border: '1px solid #E2E8F0', 
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              <div 
                onClick={() => toggleWalk(walk.id)}
                style={{ 
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: expandedWalk === walk.id ? '#F8FAFC' : '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: '#EFF6FF', 
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Footprints size={24} style={{ color: '#2563EB' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>
                      {formatDate(walk.date)} • {walk.time}
                    </p>
                    <p style={{ color: '#64748B', fontSize: '13px' }}>
                      {walk.duration} min • {walk.steps.toLocaleString()} steps • {(walk.distance / 1000).toFixed(1)} km
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {getStatusBadge(walk.deviation)}
                  <ChevronRight 
                    size={20} 
                    style={{ 
                      color: '#94A3B8',
                      transform: expandedWalk === walk.id ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} 
                  />
                </div>
              </div>

              {expandedWalk === walk.id && (
                <div style={{ 
                  padding: '16px 20px', 
                  borderTop: '1px solid #E2E8F0',
                  background: '#F8FAFC'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>Duration</p>
                      <p style={{ fontWeight: 600, color: '#0F172A' }}>{walk.duration} minutes</p>
                    </div>
                    <div>
                      <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>Steps</p>
                      <p style={{ fontWeight: 600, color: '#0F172A' }}>{walk.steps.toLocaleString()}</p>
                    </div>
                    <div>
                      <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>Distance</p>
                      <p style={{ fontWeight: 600, color: '#0F172A' }}>{walk.distance.toLocaleString()} meters</p>
                    </div>
                    <div>
                      <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>Path Points</p>
                      <p style={{ fontWeight: 600, color: '#0F172A' }}>{walk.path.length} points recorded</p>
                    </div>
                  </div>
                  
                  {walk.deviation && (
                    <div style={{ 
                      marginTop: '16px',
                      padding: '12px',
                      background: '#FEF3C7',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <Bell size={16} style={{ color: '#D97706', marginTop: '2px' }} />
                      <div>
                        <p style={{ fontWeight: 600, color: '#92400E', fontSize: '13px' }}>Pattern Deviation Detected</p>
                        <p style={{ color: '#B45309', fontSize: '12px', marginTop: '4px' }}>
                          This walk deviates from your usual route or time. This could indicate fatigue, environmental changes, or early symptom changes.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

