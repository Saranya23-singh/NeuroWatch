import { useState, useEffect } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "../../firebase";
import { useAuth } from "../context/AuthContext";

import {
  Activity,
  Heart,
  Brain,
  Footprints,
  Watch,
  Wind,
  Moon,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Utensils,
  TrendingDown,
  Minus
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

const FIREBASE_LIFESTYLE_URL = "https://neurowatch-b3b08-default-rtdb.firebaseio.com/lifestyle";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: 'up' | 'down' | 'stable';
}

function MetricCard({ title, value, icon, iconBg, trend }: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={14} style={{ color: '#22C55E' }} />;
    if (trend === 'down') return <TrendingDown size={14} style={{ color: '#EF4444' }} />;
    return <Minus size={14} style={{ color: '#64748B' }} />;
  };

  return (
    <div className="metric-card">
      <div className={`metric-card-icon ${iconBg}`}>
        {icon}
      </div>
      <div className="metric-card-title">{title}</div>
      <div className="metric-card-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {value}
        {trend && getTrendIcon()}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [muscleMovement, setMuscleMovement] = useState<string>("--");
  const [gait, setGait] = useState<number | null>(null);
  const [voice, setVoice] = useState<number | null>(null);
  const [tremor, setTremor] = useState<number | null>(null);
  const [breathing, setBreathing] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [fallDetected, setFallDetected] = useState<boolean>(false);
  
  // Lifestyle data
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [activity, setActivity] = useState<string>("--");
  const [breakfast, setBreakfast] = useState<string>("--");
  const [lunch, setLunch] = useState<string>("--");
  const [dinner, setDinner] = useState<string>("--");

  useEffect(() => {
    // Skip Firebase operations if database is not initialized
    if (!database) {
      console.log('Firebase database not initialized, using demo data');
      // Set demo data for preview purposes
      setGait(85);
      setHeartRate(72);
      setTremor(12);
      setVoice(88);
      setBreathing(16);
      setSleepQuality(78);
      setFallDetected(false);
      return;
    }

    const watchRef = ref(database, "watch_data");

    const unsubscribe = onValue(watchRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGait(data.gait ?? null);
        setHeartRate(data.heartRate ?? null);
        setMuscleMovement(data.muscleMovement ?? "--");
        setTremor(data.tremor ?? null);
        setVoice(data.voice ?? null);
        setBreathing(data.breathing ?? null);
        setSleepQuality(data.sleepQuality ?? null);
        setFallDetected(data.fallDetected ?? false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch lifestyle data
  useEffect(() => {
    const fetchLifestyleData = async () => {
      // Try to get username from AuthContext or localStorage
      let username = user?.username;
      
      if (!username) {
        const storedUser = localStorage.getItem('neurowatch_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          username = userData.username;
        }
      }
      
      // Also try legacy localStorage key
      if (!username) {
        const legacyUser = localStorage.getItem("user");
        if (legacyUser) {
          const userData = JSON.parse(legacyUser);
          username = userData.username;
        }
      }
      
      if (!username) {
        console.log('No user logged in');
        return;
      }

      try {
        const response = await fetch(`${FIREBASE_LIFESTYLE_URL}/${username}.json`);
        const data = await response.json();
        
        console.log('Lifestyle data fetched:', data);
        
        if (data) {
          setSleepHours(data.sleepHours ?? null);
          setActivity(data.activity ?? "--");
          setBreakfast(data.breakfast ?? "--");
          setLunch(data.lunch ?? "--");
          setDinner(data.dinner ?? "--");
        }
      } catch (error) {
        console.error("Error fetching lifestyle data:", error);
      }
    };

    fetchLifestyleData();
  }, [user]);

  // 🔥 Dynamic Risk Calculation
  const calculateRisk = () => {
    let score = 0;

    if (tremor && tremor > 60) score += 2;
    if (gait && gait < 60) score += 2;
    if (voice && voice < 70) score += 1;
    if (heartRate && (heartRate > 110 || heartRate < 55)) score += 1;
    if (fallDetected) score += 3;
    if (sleepHours && sleepHours < 6) score += 1;

    if (score >= 6) return "High Risk";
    if (score >= 3) return "Moderate Risk";
    return "Low Risk";
  };

  const riskLevel = calculateRisk();

  // Chart Data (Live)
  const progressData = [
    {
      date: "Now",
      gait: gait ?? 0,
      tremor: tremor ?? 0,
      voice: voice ?? 0,
      muscle: muscleMovement === "Stable" ? 90 : 60,
    },
  ];

  // Get risk level color class
  const getRiskColorClass = () => {
    if (riskLevel === "High Risk") return "error";
    if (riskLevel === "Moderate Risk") return "warning";
    return "success";
  };

  // Determine trends
  const getGaitTrend = () => {
    if (!gait) return undefined;
    if (gait >= 80) return 'up';
    if (gait < 60) return 'down';
    return 'stable';
  };

  const getTremorTrend = () => {
    if (!tremor) return undefined;
    if (tremor < 20) return 'up';
    if (tremor > 40) return 'down';
    return 'stable';
  };

  const getSleepTrend = () => {
    if (!sleepHours) return undefined;
    if (sleepHours >= 7) return 'up';
    if (sleepHours < 6) return 'down';
    return 'stable';
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Live Health Dashboard</h1>
        <p className="page-subtitle">Real-time monitoring of your neurological health metrics</p>
      </div>

      {/* Smartwatch Metrics */}
      <h3 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '16px', marginTop: '8px' }}>
        Smartwatch Metrics
      </h3>
      
      <div className="dashboard-metrics">
        <MetricCard
          title="Heart Rate"
          value={heartRate ? `${heartRate} bpm` : "--"}
          icon={<Heart size={22} />}
          iconBg="error"
        />

        <MetricCard
          title="Gait Score"
          value={gait !== null ? gait.toString() : "--"}
          icon={<Footprints size={22} />}
          iconBg="primary"
          trend={getGaitTrend()}
        />

        <MetricCard
          title="Tremor Score"
          value={tremor !== null ? tremor.toString() : "--"}
          icon={<Watch size={22} />}
          iconBg="warning"
          trend={getTremorTrend()}
        />

        <MetricCard
          title="Voice Score"
          value={voice !== null ? voice.toString() : "--"}
          icon={<Brain size={22} />}
          iconBg="primary"
        />

        <MetricCard
          title="Breathing Rate"
          value={breathing ? `${breathing} rpm` : "--"}
          icon={<Wind size={22} />}
          iconBg="primary"
        />

        <MetricCard
          title="Sleep Quality"
          value={sleepQuality ? `${sleepQuality}%` : "--"}
          icon={<Moon size={22} />}
          iconBg="success"
        />

        <MetricCard
          title="Fall Detected"
          value={fallDetected ? "Yes ⚠️" : "No"}
          icon={<AlertTriangle size={22} />}
          iconBg={fallDetected ? "error" : "success"}
        />

        <MetricCard
          title="Risk Level"
          value={riskLevel}
          icon={<Activity size={22} />}
          iconBg={getRiskColorClass()}
        />
      </div>

      {/* Lifestyle Section */}
      <h3 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '16px', marginTop: '24px' }}>
        Lifestyle Data
      </h3>
      
      <div className="dashboard-metrics">
        <MetricCard
          title="Sleep Hours"
          value={sleepHours ? `${sleepHours} hrs` : "--"}
          icon={<Moon size={22} />}
          iconBg="success"
          trend={getSleepTrend()}
        />

        <MetricCard
          title="Activity"
          value={activity}
          icon={<Activity size={22} />}
          iconBg="primary"
        />

        <MetricCard
          title="Breakfast"
          value={breakfast.length > 15 ? breakfast.substring(0, 15) + '...' : breakfast}
          icon={<Utensils size={22} />}
          iconBg="warning"
        />

        <MetricCard
          title="Lunch"
          value={lunch.length > 15 ? lunch.substring(0, 15) + '...' : lunch}
          icon={<Utensils size={22} />}
          iconBg="success"
        />
      </div>

      {/* Progress Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <Brain size={22} className="chart-icon" />
          <h2 className="chart-title">Live Progress</h2>
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

      {/* AI Insights */}
      <div className="card suggestions-card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <Lightbulb size={22} className="suggestions-icon" />
            <h2 className="card-title">AI Insights</h2>
          </div>
        </div>

        <div className="suggestions-list">
          <div className="suggestion-item">
            <div className="suggestion-icon success">
              <TrendingUp size={18} />
            </div>
            <div className="suggestion-content">
              <p className="suggestion-title">Real-time Data Updates</p>
              <p className="suggestion-description">Data updates every 3 seconds from smartwatch.</p>
            </div>
          </div>

          <div className="suggestion-item">
            <div className="suggestion-icon primary">
              <Activity size={18} />
            </div>
            <div className="suggestion-content">
              <p className="suggestion-title">Dynamic Risk Calculation</p>
              <p className="suggestion-description">Risk level is calculated dynamically from live metrics including tremor, gait, voice, heart rate, sleep, and fall detection.</p>
            </div>
          </div>

          <div className="suggestion-item">
            <div className="suggestion-icon error">
              <AlertTriangle size={18} />
            </div>
            <div className="suggestion-content">
              <p className="suggestion-title">Fall Detection Alert</p>
              <p className="suggestion-description">Fall detection instantly increases risk priority when triggered.</p>
            </div>
          </div>

          <div className="suggestion-item">
            <div className="suggestion-icon warning">
              <Watch size={18} />
            </div>
            <div className="suggestion-content">
              <p className="suggestion-title">Tremor & Gait Analysis</p>
              <p className="suggestion-description">Tremor and gait directly influence neurological stability score.</p>
            </div>
          </div>

          <div className="suggestion-item">
            <div className="suggestion-icon primary">
              <Utensils size={18} />
            </div>
            <div className="suggestion-content">
              <p className="suggestion-title">Lifestyle Integration</p>
              <p className="suggestion-description">Your lifestyle data (sleep, meals, activity) is now integrated with health metrics for comprehensive insights.</p>
            </div>
          </div>

          <div className="suggestion-item" style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
            <div className="suggestion-icon" style={{ background: '#D97706' }}>
              <AlertTriangle size={18} />
            </div>
            <div className="suggestion-content">
              <p className="suggestion-title" style={{ color: '#92400E' }}>Accuracy Notice</p>
              <p className="suggestion-description" style={{ color: '#B45309' }}>The metrics shown are for monitoring purposes only and may not be 100% accurate. For medical diagnosis and treatment decisions, please consult with a healthcare professional.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

