import { useState, useEffect } from "react";
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Heart,
  Footprints,
  Brain,
  Moon,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Printer
} from "lucide-react";
import { jsPDF } from "jspdf";

const FIREBASE_WATCH_URL =
  "https://neurowatch-b3b08-default-rtdb.firebaseio.com/watch_data";

const FIREBASE_LIFESTYLE_URL =
  "https://neurowatch-b3b08-default-rtdb.firebaseio.com/lifestyle";

interface MedicalRecord {
  date: string;
  heartRate?: number;
  gait?: number;
  tremor?: number;
  voice?: number;
  muscleMovement?: string;
  sleepHours?: number;
  activity?: string;
  breakfast?: string;
  lunch?: string;
  snack?: string;
  dinner?: string;
  riskLevel?: string;
}

interface ReportData {
  current: MedicalRecord | null;
  history: MedicalRecord[];
  trends: {
    gait: 'improving' | 'stable' | 'declining';
    tremor: 'improving' | 'stable' | 'declining';
    voice: 'improving' | 'stable' | 'declining';
    sleep: 'improving' | 'stable' | 'declining';
  };
  recommendations: string[];
}

// Helper to get username from any localStorage key
const getUsername = (): string | null => {
  // Try AuthContext key
  const storedUser = localStorage.getItem('neurowatch_user');
  if (storedUser) {
    const userData = JSON.parse(storedUser);
    if (userData.username) return userData.username;
  }
  
  // Try legacy key
  const legacyUser = localStorage.getItem("user");
  if (legacyUser) {
    const userData = JSON.parse(legacyUser);
    if (userData.username) return userData.username;
  }
  
  return null;
};

export function History() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      const username = getUsername();
      
      if (!username) {
        console.log('No user logged in');
        // Use sample data for demo
        const sampleData = generateSampleData();
        setRecords(sampleData);
        setReportData(generateReportData(sampleData));
        return;
      }

      try {
        const watchRes = await fetch(
          `${FIREBASE_WATCH_URL}/${username}.json`
        );
        const watchData = await watchRes.json();

        const lifeRes = await fetch(
          `${FIREBASE_LIFESTYLE_URL}/${username}.json`
        );
        const lifestyleData = await lifeRes.json();

        const today = new Date().toISOString().split("T")[0];

        // Calculate risk level
        let riskScore = 0;
        if (watchData?.tremor && watchData.tremor > 60) riskScore += 2;
        if (watchData?.gait && watchData.gait < 60) riskScore += 2;
        if (watchData?.voice && watchData.voice < 70) riskScore += 1;
        
        let riskLevel = "Low Risk";
        if (riskScore >= 4) riskLevel = "High Risk";
        else if (riskScore >= 2) riskLevel = "Moderate Risk";

        const combined: MedicalRecord = {
          date: today,
          heartRate: watchData?.heartRate,
          gait: watchData?.gait,
          tremor: watchData?.tremor,
          voice: watchData?.voice,
          muscleMovement: watchData?.muscleMovement,
          sleepHours: lifestyleData?.sleepHours,
          activity: lifestyleData?.activity,
          breakfast: lifestyleData?.breakfast,
          lunch: lifestyleData?.lunch,
          snack: lifestyleData?.snack,
          dinner: lifestyleData?.dinner,
          riskLevel,
        };

        // Generate mock history data for demonstration
        const historyData: MedicalRecord[] = [
          { ...combined, date: today },
          { date: '2025-01-14', heartRate: 72, gait: 78, tremor: 18, voice: 85, sleepHours: 7, activity: 'Walking' },
          { date: '2025-01-13', heartRate: 75, gait: 82, tremor: 15, voice: 88, sleepHours: 8, activity: 'Yoga' },
          { date: '2025-01-12', heartRate: 70, gait: 75, tremor: 22, voice: 80, sleepHours: 6.5, activity: 'Walking' },
          { date: '2025-01-11', heartRate: 68, gait: 80, tremor: 16, voice: 86, sleepHours: 7.5, activity: 'Swimming' },
        ];

        setRecords(historyData);

        // Calculate trends and generate report
        const trends = calculateTrends(historyData);
        const recommendations = generateRecommendations(combined);

        setReportData({
          current: combined,
          history: historyData,
          trends,
          recommendations,
        });

      } catch (error) {
        console.error("Error fetching medical history:", error);
        // Use sample data on error
        const sampleData = generateSampleData();
        setRecords(sampleData);
        setReportData(generateReportData(sampleData));
      }
    };

    fetchAllData();
  }, []);

  const generateSampleData = (): MedicalRecord[] => {
    const today = new Date().toISOString().split("T")[0];
    return [
      { date: today, heartRate: 72, gait: 80, tremor: 18, voice: 85, sleepHours: 7.5, activity: 'Walking', riskLevel: 'Low Risk' },
      { date: '2025-01-14', heartRate: 70, gait: 78, tremor: 20, voice: 82, sleepHours: 7, activity: 'Walking', riskLevel: 'Low Risk' },
      { date: '2025-01-13', heartRate: 68, gait: 82, tremor: 15, voice: 88, sleepHours: 8, activity: 'Yoga', riskLevel: 'Low Risk' },
      { date: '2025-01-12', heartRate: 75, gait: 75, tremor: 25, voice: 80, sleepHours: 6, activity: 'Walking', riskLevel: 'Moderate Risk' },
    ];
  };

  const generateReportData = (data: MedicalRecord[]): ReportData => {
    const current = data[0];
    const trends = calculateTrends(data);
    const recommendations = generateRecommendations(current || {});
    
    return {
      current: current || null,
      history: data,
      trends,
      recommendations,
    };
  };

  const calculateTrends = (data: MedicalRecord[]): ReportData['trends'] => {
    const getTrend = (key: keyof MedicalRecord): 'improving' | 'stable' | 'declining' => {
      const values = data.map(r => typeof r[key] === 'number' ? r[key] as number : null).filter(v => v !== null) as number[];
      if (values.length < 2) return 'stable';
      
      const recent = values.slice(-2).reduce((a, b) => a + b, 0) / Math.min(values.slice(-2).length, 2);
      const older = values.slice(0, 2).reduce((a, b) => a + b, 0) / Math.min(values.slice(0, 2).length, 2);
      
      const diff = ((recent - older) / older) * 100;
      
      if (key === 'tremor') {
        return diff < -10 ? 'improving' : diff > 10 ? 'declining' : 'stable';
      }
      return diff > 10 ? 'improving' : diff < -10 ? 'declining' : 'stable';
    };

    return {
      gait: getTrend('gait'),
      tremor: getTrend('tremor'),
      voice: getTrend('voice'),
      sleep: getTrend('sleepHours'),
    };
  };

  const generateRecommendations = (data: MedicalRecord): string[] => {
    const recommendations: string[] = [];
    
    if (data.tremor && data.tremor > 30) {
      recommendations.push('Consider hand exercises to reduce tremor severity');
    }
    if (data.gait && data.gait < 70) {
      recommendations.push('Include balance training exercises in your daily routine');
    }
    if (data.sleepHours && data.sleepHours < 7) {
      recommendations.push('Aim for 7-8 hours of sleep for better symptom management');
    }
    if (data.voice && data.voice < 75) {
      recommendations.push('Practice voice projection exercises to maintain speech clarity');
    }
    if (recommendations.length === 0) {
      recommendations.push('Keep up the good work! Your metrics are within healthy ranges.');
      recommendations.push('Continue regular exercise and healthy lifestyle habits');
    }
    
    return recommendations;
  };

  const toggleRecord = (date: string) => {
    const newExpanded = new Set(expandedRecords);
    newExpanded.has(date)
      ? newExpanded.delete(date)
      : newExpanded.add(date);
    setExpandedRecords(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp size={16} style={{ color: '#22C55E' }} />;
    if (trend === 'declining') return <AlertTriangle size={16} style={{ color: '#EF4444' }} />;
    return <Activity size={16} style={{ color: '#64748B' }} />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return '#22C55E';
    if (trend === 'declining') return '#EF4444';
    return '#64748B';
  };

  const getRiskBadge = (risk: string | undefined) => {
    if (!risk) return null;
    const colors: Record<string, { bg: string; text: string }> = {
      'Low Risk': { bg: '#DCFCE7', text: '#16A34A' },
      'Moderate Risk': { bg: '#FEF3C7', text: '#D97706' },
      'High Risk': { bg: '#FEE2E2', text: '#DC2626' },
    };
    const color = colors[risk] || colors['Low Risk'];
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
        background: color.bg,
        color: color.text
      }}>
        {risk}
      </span>
    );
  };

  const generatePDF = async () => {
    if (!reportData?.current) return;
    
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const name = user?.username || 'Patient';

      // Header
      doc.setFontSize(24);
      doc.setTextColor(37, 99, 235);
      doc.text('NeuroWatch Health Report', 20, 25);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Patient: ${name}`, 20, 35);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 42);
      
      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 50, 190, 50);
      
      // Current Metrics
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('Current Health Metrics', 20, 65);
      
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      const metrics = [
        `Heart Rate: ${reportData.current.heartRate || '--'} bpm`,
        `Gait Score: ${reportData.current.gait || '--'}`,
        `Tremor Score: ${reportData.current.tremor || '--'}`,
        `Voice Score: ${reportData.current.voice || '--'}`,
        `Sleep Hours: ${reportData.current.sleepHours || '--'} hrs`,
        `Risk Level: ${reportData.current.riskLevel || 'N/A'}`,
      ];
      
      let y = 75;
      metrics.forEach(metric => {
        doc.text(metric, 25, y);
        y += 8;
      });
      
      // Lifestyle
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('Lifestyle', 20, y + 10);
      
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      const lifestyle = [
        `Activity: ${reportData.current.activity || '--'}`,
        `Breakfast: ${reportData.current.breakfast || '--'}`,
        `Lunch: ${reportData.current.lunch || '--'}`,
        `Dinner: ${reportData.current.dinner || '--'}`,
      ];
      
      y += 20;
      lifestyle.forEach(item => {
        doc.text(item, 25, y);
        y += 8;
      });
      
      // Recommendations
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('AI Recommendations', 20, y + 10);
      
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      y += 20;
      reportData.recommendations.forEach((rec, idx) => {
        const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, 170);
        doc.text(lines, 25, y);
        y += lines.length * 6 + 2;
      });
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('Generated by NeuroWatch - Parkinson\'s Monitoring System', 20, 280);
      
      // Save
      doc.save(`NeuroWatch_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-start" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Health Report</h1>
          <p className="page-subtitle">View your health metrics, trends, and generate reports</p>
        </div>

        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="btn btn-primary"
          style={{ gap: '8px' }}
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⟳</span>
              Generating...
            </>
          ) : (
            <>
              <Download size={18} />
              Download Report
            </>
          )}
        </button>
      </div>

      {/* Report Summary Cards */}
      {reportData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* Gait Card */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#EFF6FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Footprints size={20} style={{ color: '#2563EB' }} />
              </div>
              <span style={{ color: '#64748B', fontSize: '13px' }}>Gait Score</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
              {reportData.current?.gait ?? '--'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: getTrendColor(reportData.trends.gait) }}>
              {getTrendIcon(reportData.trends.gait)}
              <span style={{ textTransform: 'capitalize' }}>{reportData.trends.gait}</span>
            </div>
          </div>

          {/* Tremor Card */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#FEF3C7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} style={{ color: '#F59E0B' }} />
              </div>
              <span style={{ color: '#64748B', fontSize: '13px' }}>Tremor Score</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
              {reportData.current?.tremor ?? '--'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: getTrendColor(reportData.trends.tremor) }}>
              {getTrendIcon(reportData.trends.tremor)}
              <span style={{ textTransform: 'capitalize' }}>{reportData.trends.tremor}</span>
            </div>
          </div>

          {/* Voice Card */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#F3E8FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={20} style={{ color: '#8B5CF6' }} />
              </div>
              <span style={{ color: '#64748B', fontSize: '13px' }}>Voice Score</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
              {reportData.current?.voice ?? '--'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: getTrendColor(reportData.trends.voice) }}>
              {getTrendIcon(reportData.trends.voice)}
              <span style={{ textTransform: 'capitalize' }}>{reportData.trends.voice}</span>
            </div>
          </div>

          {/* Sleep Card */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#DCFCE7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Moon size={20} style={{ color: '#22C55E' }} />
              </div>
              <span style={{ color: '#64748B', fontSize: '13px' }}>Sleep Hours</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
              {reportData.current?.sleepHours ?? '--'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: getTrendColor(reportData.trends.sleep) }}>
              {getTrendIcon(reportData.trends.sleep)}
              <span style={{ textTransform: 'capitalize' }}>{reportData.trends.sleep}</span>
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {reportData && (
        <div className="card" style={{ marginBottom: '24px', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Current Risk Assessment</h3>
              <p style={{ color: '#64748B', fontSize: '14px' }}>Based on your latest metrics</p>
            </div>
            {getRiskBadge(reportData.current?.riskLevel)}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {reportData && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="chart-header">
            <FileText size={22} style={{ color: '#2563EB' }} />
            <h2 className="chart-title">AI Recommendations</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {reportData.recommendations.map((rec, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px',
                padding: '16px',
                background: '#F8FAFC',
                borderRadius: '12px'
              }}>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  background: '#2563EB',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CheckCircle size={14} color="white" />
                </div>
                <span style={{ color: '#0F172A', lineHeight: '1.5' }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Records */}
      <div className="card">
        <div className="chart-header">
          <Calendar size={22} style={{ color: '#2563EB' }} />
          <h2 className="chart-title">Historical Data</h2>
        </div>

        {/* Disclaimer */}
        <div style={{ 
          marginTop: '16px',
          padding: '16px', 
          background: '#FEF3C7', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <AlertTriangle size={20} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontWeight: 600, color: '#92400E', marginBottom: '4px', fontSize: '14px' }}>Accuracy Notice</h4>
            <p style={{ color: '#B45309', fontSize: '12px', lineHeight: '1.5' }}>
              Health metrics are for monitoring purposes only. Please consult healthcare professionals for medical decisions.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {records.map((record) => {
            const isExpanded = expandedRecords.has(record.date);

            return (
              <div
                key={record.date}
                className="card"
                style={{ marginBottom: 0, padding: 0, overflow: 'hidden' }}
              >
                <div
                  onClick={() => toggleRecord(record.date)}
                  style={{ 
                    padding: '20px', 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isExpanded ? '#F8FAFC' : '#fff'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-[#2563EB]" />
                    <div>
                      <h3 style={{ fontWeight: 600, color: '#0F172A' }}>
                        {formatDate(record.date)}
                      </h3>
                      {record.riskLevel && (
                        <div style={{ marginTop: '4px' }}>
                          {getRiskBadge(record.riskLevel)}
                        </div>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid #E2E8F0', padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                        <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>Heart Rate</p>
                        <p style={{ fontWeight: 600, color: '#0F172A', fontSize: '18px' }}>{record.heartRate ?? "--"} <span style={{ fontSize: '12px', color: '#64748B' }}>bpm</span></p>
                      </div>
                      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                        <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>Gait Score</p>
                        <p style={{ fontWeight: 600, color: '#0F172A', fontSize: '18px' }}>{record.gait ?? "--"}</p>
                      </div>
                      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                        <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>Tremor</p>
                        <p style={{ fontWeight: 600, color: '#0F172A', fontSize: '18px' }}>{record.tremor ?? "--"}</p>
                      </div>
                      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                        <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>Voice Stability</p>
                        <p style={{ fontWeight: 600, color: '#0F172A', fontSize: '18px' }}>{record.voice ?? "--"}</p>
                      </div>
                      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                        <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>Sleep Hours</p>
                        <p style={{ fontWeight: 600, color: '#0F172A', fontSize: '18px' }}>{record.sleepHours ?? "--"} <span style={{ fontSize: '12px', color: '#64748B' }}>hrs</span></p>
                      </div>
                      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                        <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>Activity</p>
                        <p style={{ fontWeight: 600, color: '#0F172A', fontSize: '18px' }}>{record.activity ?? "--"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

