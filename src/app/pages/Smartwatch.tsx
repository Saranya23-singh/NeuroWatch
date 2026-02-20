import { Activity, CheckCircle, Heart, TrendingUp, Gauge, Volume2, RefreshCw } from 'lucide-react';

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
            <CheckCircle size={20} className="text-[#22C55E]" />
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>Device Status</h3>
              <p style={{ color: '#64748B', fontSize: '14px' }}>Last synced: 5 minutes ago</p>
            </div>
          </div>
          <span className="badge badge-success">
            Connected
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ marginBottom: '24px', gap: '20px' }}>
        <MetricCard
          title="Heart Rate"
          value="72 bpm"
          icon={<Heart className="w-6 h-6 text-white" />}
          color="#38BDF8"
          status="Normal"
        />
        <MetricCard
          title="Blood Pressure"
          value="120/80"
          icon={<Gauge className="w-6 h-6 text-white" />}
          color="#22C55E"
          status="Normal"
        />
        <MetricCard
          title="Tremor"
          value="Low"
          icon={<Activity className="w-6 h-6 text-white" />}
          color="#2563EB"
          status="Good"
        />
        <MetricCard
          title="Muscle Movement"
          value="78%"
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="#8B5CF6"
        />
        <MetricCard
          title="Voice Stability"
          value="85%"
          icon={<Volume2 className="w-6 h-6 text-white" />}
          color="#EC4899"
        />
      </div>

      {/* Sync Button */}
      <div className="card">
        <button
          onClick={() => alert('Syncing device...')}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', gap: '8px' }}
        >
          <RefreshCw size={20} />
          Sync Device
        </button>
      </div>
    </div>
  );
}

