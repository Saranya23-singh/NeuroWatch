import { useState, useEffect } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "../../firebase";

import {
  Activity,
  Heart,
  AlertCircle,
  Brain,
  Footprints,
  TrendingUp,
  Watch,
  Lightbulb,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
}

function MetricCard({ title, value, icon, iconBg }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className={`metric-card-icon ${iconBg}`}>
        {icon}
      </div>
      <div className="metric-card-title">{title}</div>
      <div className="metric-card-value">{value}</div>
    </div>
  );
}

export function Dashboard() {
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [muscleMovement, setMuscleMovement] = useState<string>("--");
  const [gait, setGait] = useState<number | null>(null);
  const [voice, setVoice] = useState<number | null>(null);
  const [tremor, setTremor] = useState<string>("--");

  useEffect(() => {
    const watchRef = ref(database, "watch_data");

    const unsubscribe = onValue(watchRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGait(data.gait ?? null);
        setHeartRate(data.heartRate ?? null);
        setMuscleMovement(data.muscleMovement ?? "--");
        setTremor(data.tremor ?? "--");
        setVoice(data.voice ?? null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Chart Data (Live)
  const progressData = [
    {
      date: "Now",
      gait: gait ?? 0,
      tremor: tremor === "Low" ? 90 : tremor === "High" ? 40 : 70,
      voice: voice ?? 0,
      muscle: muscleMovement === "Normal" ? 85 : 60,
    },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Live Health Dashboard</h1>
        <p className="page-subtitle">Real-time monitoring of your neurological health metrics</p>
      </div>

      {/* Metric Cards */}
      <div className="dashboard-metrics">
        <MetricCard
          title="Gait Score"
          value={gait !== null ? gait.toString() : "--"}
          icon={<Footprints size={22} />}
          iconBg="primary"
        />

        <MetricCard
          title="Muscle Movement"
          value={muscleMovement}
          icon={<Activity size={22} />}
          iconBg="success"
        />

        <MetricCard
          title="Heart Rate"
          value={heartRate ? `${heartRate} bpm` : "--"}
          icon={<Heart size={22} />}
          iconBg="error"
        />

        <MetricCard
          title="Voice Score"
          value={voice !== null ? voice.toString() : "--"}
          icon={<Brain size={22} />}
          iconBg="primary"
        />

        <MetricCard
          title="Tremor Level"
          value={tremor}
          icon={<Watch size={22} />}
          iconBg="warning"
        />
      </div>

      {/* Progress Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <Brain size={22} className="chart-icon" />
          <h2 className="chart-title">Progress Charts</h2>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
            <YAxis stroke="#64748B" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="gait" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB', r: 4 }} />
            <Line type="monotone" dataKey="tremor" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 4 }} />
            <Line type="monotone" dataKey="voice" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 4 }} />
            <Line type="monotone" dataKey="muscle" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Suggestions */}
      <div className="card suggestions-card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <Lightbulb size={22} className="suggestions-icon" />
            <h2 className="card-title">AI Suggestions</h2>
          </div>
        </div>

        <div className="suggestions-list">
          <div className="suggestion-item">
            <div className="suggestion-icon success">
              <TrendingUp size={18} />
            </div>
            <div className="suggestion-content">
              <p className="suggestion-title">Gait Score Updates</p>
              <p className="suggestion-description">Your gait score updates in real time from the smartwatch.</p>
            </div>
          </div>

          <div className="suggestion-item">
            <div className="suggestion-icon primary">
              <Watch size={18} />
            </div>
            <div className="suggestion-content">
              <p className="suggestion-title">Tremor & Muscle Data</p>
              <p className="suggestion-description">Tremor and muscle data are synced directly from Firebase.</p>
            </div>
          </div>

          <div className="suggestion-item">
            <div className="suggestion-icon error">
              <Heart size={18} />
            </div>
            <div className="suggestion-content">
              <p className="suggestion-title">Heart Rate Monitoring</p>
              <p className="suggestion-description">Heart rate monitoring is active and live.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

