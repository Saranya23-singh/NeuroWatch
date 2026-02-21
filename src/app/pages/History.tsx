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
  Printer,
  Upload,
  X,
  File,
  Eye,
  Trash2,
  Plus
} from "lucide-react";
import { jsPDF } from "jspdf";
import { storage, firestore } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";

const FIREBASE_WATCH_URL =
  "https://neurowatch-b3b08-default-rtdb.firebaseio.com/watch_data";

const FIREBASE_LIFESTYLE_URL =
  "https://neurowatch-b3b08-default-rtdb.firebaseio.com/lifestyle";

// Report categories
const REPORT_CATEGORIES = [
  { id: 'blood_sugar', label: 'Blood Sugar', color: '#EF4444' },
  { id: 'blood_pressure', label: 'Blood Pressure', color: '#8B5CF6' },
  { id: 'lab_tests', label: 'Lab Tests', color: '#3B82F6' },
  { id: 'prescription', label: 'Prescription', color: '#22C55E' },
  { id: 'other', label: 'Other', color: '#64748B' },
];

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

interface MedicalReport {
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
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
  
  // Medical Reports Upload State
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [reportName, setReportName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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

  // Fetch medical reports from Firestore
  useEffect(() => {
    const fetchReports = async () => {
      const username = getUsername();
      if (!username || !firestore) return;
      
      try {
        const q = query(
          collection(firestore, 'medical_reports'),
          where('username', '==', username)
        );
        const querySnapshot = await getDocs(q);
        const fetchedReports: MedicalReport[] = [];
        querySnapshot.forEach((doc) => {
          fetchedReports.push({ id: doc.id, ...doc.data() } as MedicalReport);
        });
        // Sort by upload date descending
        fetchedReports.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
        setReports(fetchedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };
    
    fetchReports();
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a PDF or image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      if (!reportName) {
        setReportName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // Upload report to Firebase Storage and Firestore
  const handleUploadReport = async () => {
    if (!selectedFile || !reportName || !storage || !firestore) {
      alert('Please select a file and enter a name');
      return;
    }
    
    const username = getUsername();
    if (!username) {
      alert('Please log in to upload reports');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `medical_reports/${username}/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Save metadata to Firestore
      const reportData = {
        username,
        name: reportName,
        category: selectedCategory,
        uploadDate: new Date().toISOString(),
        fileUrl: downloadURL,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
      };
      
      const docRef = await addDoc(collection(firestore, 'medical_reports'), reportData);
      
      // Update local state
      const newReport: MedicalReport = {
        id: docRef.id,
        ...reportData
      };
      setReports([newReport, ...reports]);
      
      // Reset form
      setShowUploadModal(false);
      setSelectedFile(null);
      setReportName('');
      setSelectedCategory('other');
      alert('Report uploaded successfully!');
      
    } catch (error) {
      console.error('Error uploading report:', error);
      alert('Failed to upload report. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete report
  const handleDeleteReport = async (reportId: string) => {
    if (!firestore) return;
    
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await deleteDoc(doc(firestore, 'medical_reports', reportId));
      setReports(reports.filter(r => r.id !== reportId));
      alert('Report deleted successfully!');
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatUploadDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get category color
  const getCategoryColor = (categoryId: string) => {
    const category = REPORT_CATEGORIES.find(c => c.id === categoryId);
    return category?.color || '#64748B';
  };

  // Get category label
  const getCategoryLabel = (categoryId: string) => {
    const category = REPORT_CATEGORIES.find(c => c.id === categoryId);
    return category?.label || 'Other';
  };

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
      {/* Upload Medical Reports Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={() => setShowUploadModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A' }}>Upload Medical Report</h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={24} color="#64748B" />
              </button>
            </div>
            
            {/* File Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px', color: '#0F172A' }}>
                Select File *
              </label>
              <div style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedFile ? '#F0F9FF' : 'white'
              }}
              onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {selectedFile ? (
                  <div>
                    <File size={40} color="#2563EB" style={{ marginBottom: '8px' }} />
                    <p style={{ fontWeight: 500, color: '#0F172A' }}>{selectedFile.name}</p>
                    <p style={{ fontSize: '12px', color: '#64748B' }}>{formatFileSize(selectedFile.size)}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                      style={{ marginTop: '8px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={40} color="#94A3B8" style={{ marginBottom: '8px' }} />
                    <p style={{ color: '#64748B' }}>Click to select PDF or image</p>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>Max file size: 10MB</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Report Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px', color: '#0F172A' }}>
                Report Name *
              </label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g., Blood Test Results"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            {/* Category Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '8px', color: '#0F172A' }}>
                Category *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {REPORT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '12px',
                      border: selectedCategory === cat.id ? `2px solid ${cat.color}` : '2px solid #E2E8F0',
                      borderRadius: '8px',
                      background: selectedCategory === cat.id ? `${cat.color}15` : 'white',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '13px',
                      color: selectedCategory === cat.id ? cat.color : '#64748B',
                      transition: 'all 0.2s'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Upload Button */}
            <button
              onClick={handleUploadReport}
              disabled={!selectedFile || !reportName || isUploading}
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                background: selectedFile && reportName && !isUploading ? '#2563EB' : '#94A3B8',
                color: 'white',
                fontWeight: 600,
                cursor: selectedFile && reportName && !isUploading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              {isUploading ? 'Uploading...' : 'Upload Report'}
            </button>
          </div>
        </div>
      )}

<div className="flex justify-between items-start" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Health Report</h1>
          <p className="page-subtitle">View your health metrics, trends, and generate reports</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
            style={{ gap: '8px', background: '#8B5CF6' }}
          >
            <Upload size={18} />
            Upload Report
          </button>

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

      {/* Uploaded Medical Reports Section */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="chart-header">
          <FileText size={22} style={{ color: '#8B5CF6' }} />
          <h2 className="chart-title">Uploaded Medical Reports</h2>
        </div>

        {reports.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            background: '#F8FAFC',
            borderRadius: '12px',
            marginTop: '16px'
          }}>
            <FileText size={48} color="#94A3B8" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: '#64748B', marginBottom: '8px' }}>No medical reports uploaded yet</h3>
            <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '16px' }}>
              Click "Upload Report" to add your medical documents
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary"
              style={{ gap: '8px', background: '#8B5CF6' }}
            >
              <Upload size={18} />
              Upload Report
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {reports.map((report) => (
                <div 
                  key={report.id} 
                  style={{ 
                    padding: '20px', 
                    background: '#F8FAFC', 
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: `${getCategoryColor(report.category)}20`,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <File size={20} style={{ color: getCategoryColor(report.category) }} />
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                          {report.name}
                        </h4>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 500,
                          background: `${getCategoryColor(report.category)}20`,
                          color: getCategoryColor(report.category)
                        }}>
                          {getCategoryLabel(report.category)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ color: '#64748B', fontSize: '12px' }}>
                      Uploaded: {formatUploadDate(report.uploadDate)}
                    </p>
                    <p style={{ color: '#64748B', fontSize: '12px' }}>
                      Size: {formatFileSize(report.fileSize)}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => window.open(report.fileUrl, '_blank')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#2563EB',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: '13px'
                      }}
                    >
                      <Eye size={16} />
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '16px',
                border: '2px dashed #CBD5E1',
                borderRadius: '12px',
                background: 'transparent',
                color: '#64748B',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              <Plus size={20} />
              Add Another Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

