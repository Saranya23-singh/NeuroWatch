import { Lightbulb, TrendingUp, AlertCircle, Heart, Brain, CheckCircle } from 'lucide-react';

interface SuggestionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  priority: 'high' | 'medium' | 'low';
}

function SuggestionCard({ title, description, icon, iconBg, priority }: SuggestionCardProps) {
  const priorityColors = {
    high: { bg: '#FEF2F2', text: '#EF4444' },
    medium: { bg: '#FFFBEB', text: '#F59E0B' },
    low: { bg: '#F0FDF4', text: '#22C55E' },
  };

  const priorityLabels = {
    high: 'High Priority',
    medium: 'Medium Priority',
    low: 'Low Priority',
  };

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" 
          style={{ backgroundColor: priorityColors[priority].bg }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
            <h3 style={{ fontWeight: 600, color: '#0F172A' }}>{title}</h3>
            <span 
              style={{ 
                padding: '4px 12px', 
                borderRadius: '9999px', 
                fontSize: '12px', 
                fontWeight: 600,
                backgroundColor: priorityColors[priority].bg,
                color: priorityColors[priority].text
              }}
            >
              {priorityLabels[priority]}
            </span>
          </div>
          <p style={{ color: '#64748B', lineHeight: 1.6 }}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export function Suggestions() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">AI-Powered Suggestions</h1>
        <p className="page-subtitle">Personalized recommendations based on your health data</p>
      </div>

      {/* Summary Card */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)', 
        borderRadius: '16px', 
        padding: '32px', 
        marginBottom: '32px',
        color: 'white'
      }}>
        <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
          <Lightbulb size={32} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Today's Insights</h2>
        </div>
        <p style={{ opacity: 0.9, marginBottom: '16px', lineHeight: 1.6 }}>
          You're making great progress! Your gait score has improved by 5% this week, and your overall health metrics are trending positively.
        </p>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <div className="flex items-center gap-2">
            <CheckCircle size={20} />
            <span>3 Goals Achieved</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={20} />
            <span>Overall Score: 85/100</span>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SuggestionCard
          title="Improve Sleep Schedule"
          description="Your sleep duration was below 7 hours for 3 consecutive days. Try to maintain a consistent bedtime and aim for 7-9 hours of sleep for optimal neurological health."
          icon={<AlertCircle size={24} color="#F59E0B" />}
          iconBg="bg-[#F59E0B]/10"
          priority="high"
        />

        <SuggestionCard
          title="Increase Gait Analysis Frequency"
          description="Your last gait analysis was 5 days ago. Weekly analysis helps track subtle changes in walking patterns. Consider uploading a new video for analysis."
          icon={<TrendingUp size={24} color="#F59E0B" />}
          iconBg="bg-[#F59E0B]/10"
          priority="medium"
        />

        <SuggestionCard
          title="Sync Smartwatch More Often"
          description="Regular device synchronization ensures real-time monitoring of tremor levels and heart rate variability. Try syncing at least twice daily for best results."
          icon={<Heart size={24} color="#2563EB" />}
          iconBg="bg-[#2563EB]/10"
          priority="medium"
        />

        <SuggestionCard
          title="Maintain Current Exercise Routine"
          description="Your 30-minute daily walks are contributing to improved gait scores and overall mobility. Keep up the excellent work!"
          icon={<CheckCircle size={24} color="#22C55E" />}
          iconBg="bg-[#22C55E]/10"
          priority="low"
        />

        <SuggestionCard
          title="Dietary Improvements Noticed"
          description="Your consistent breakfast routine with berries and oatmeal is providing good antioxidants. Consider adding omega-3 rich foods to your dinner for additional brain health benefits."
          icon={<Brain size={24} color="#22C55E" />}
          iconBg="bg-[#22C55E]/10"
          priority="low"
        />

        <SuggestionCard
          title="Voice Stability Monitoring"
          description="Your voice stability score is good at 85%. Continue with regular speech exercises and consider tracking this metric weekly."
          icon={<TrendingUp size={24} color="#22C55E" />}
          iconBg="bg-[#22C55E]/10"
          priority="low"
        />
      </div>
    </div>
  );
}

