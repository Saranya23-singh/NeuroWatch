import { useState, useEffect } from "react";
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";

const FIREBASE_WATCH_URL =
  "https://neurowatch-b3b08-default-rtdb.firebaseio.com/watch_data";

const FIREBASE_LIFESTYLE_URL =
  "https://neurowatch-b3b08-default-rtdb.firebaseio.com/lifestyle";

interface MedicalRecord {
  date: string;
  heartRate?: number;
  gait?: number;
  tremor?: string;
  voice?: number;
  muscleMovement?: string;
  sleepHours?: number;
  activity?: string;
  breakfast?: string;
  lunch?: string;
  snack?: string;
  dinner?: string;
}

export function History() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user?.username) return;

        const watchRes = await fetch(
          `${FIREBASE_WATCH_URL}/${user.username}.json`
        );
        const watchData = await watchRes.json();

        const lifeRes = await fetch(
          `${FIREBASE_LIFESTYLE_URL}/${user.username}.json`
        );
        const lifestyleData = await lifeRes.json();

        const today = new Date().toISOString().split("T")[0];

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
        };

        setRecords([combined]);
      } catch (error) {
        console.error("Error fetching medical history:", error);
      }
    };

    fetchAllData();
  }, []);

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

  const handleExportReport = () => {
    alert("Downloading full medical report...");
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-start" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Complete Medical History</h1>
          <p className="page-subtitle">Combined smartwatch + lifestyle health report</p>
        </div>

        <button
          onClick={handleExportReport}
          className="btn btn-primary"
          style={{ gap: '8px' }}
        >
          <Download size={18} />
          Export Report
        </button>
      </div>

      {records.map((record) => {
        const isExpanded = expandedRecords.has(record.date);

        return (
          <div
            key={record.date}
            className="card"
            style={{ marginBottom: '16px', padding: 0, overflow: 'hidden' }}
          >
            <div
              onClick={() => toggleRecord(record.date)}
              style={{ 
                padding: '24px', 
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              className="hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-[#2563EB]" />
                <h3 style={{ fontWeight: 600, color: '#0F172A' }}>
                  {formatDate(record.date)}
                </h3>
              </div>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {isExpanded && (
              <div style={{ borderTop: '1px solid #E2E8F0', padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>Heart Rate</p>
                    <p style={{ fontWeight: 600, color: '#0F172A' }}>{record.heartRate ?? "--"} bpm</p>
                  </div>
                  <div>
                    <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>Gait Score</p>
                    <p style={{ fontWeight: 600, color: '#0F172A' }}>{record.gait ?? "--"}</p>
                  </div>
                  <div>
                    <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>Tremor</p>
                    <p style={{ fontWeight: 600, color: '#0F172A' }}>{record.tremor ?? "--"}</p>
                  </div>
                  <div>
                    <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>Voice Stability</p>
                    <p style={{ fontWeight: 600, color: '#0F172A' }}>{record.voice ?? "--"}</p>
                  </div>
                  <div>
                    <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>Muscle Movement</p>
                    <p style={{ fontWeight: 600, color: '#0F172A' }}>{record.muscleMovement ?? "--"}</p>
                  </div>
                  <div>
                    <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>Sleep Hours</p>
                    <p style={{ fontWeight: 600, color: '#0F172A' }}>{record.sleepHours ?? "--"} hrs</p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', margin: '20px 0', paddingTop: '20px' }}>
                  <h4 style={{ fontWeight: 600, marginBottom: '12px', color: '#0F172A' }}>Lifestyle</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div>
                      <p style={{ color: '#64748B', fontSize: '13px' }}>Activity</p>
                      <p style={{ fontWeight: 500 }}>{record.activity ?? "--"}</p>
                    </div>
                    <div>
                      <p style={{ color: '#64748B', fontSize: '13px' }}>Breakfast</p>
                      <p style={{ fontWeight: 500 }}>{record.breakfast ?? "--"}</p>
                    </div>
                    <div>
                      <p style={{ color: '#64748B', fontSize: '13px' }}>Lunch</p>
                      <p style={{ fontWeight: 500 }}>{record.lunch ?? "--"}</p>
                    </div>
                    <div>
                      <p style={{ color: '#64748B', fontSize: '13px' }}>Snack</p>
                      <p style={{ fontWeight: 500 }}>{record.snack ?? "--"}</p>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <p style={{ color: '#64748B', fontSize: '13px' }}>Dinner</p>
                      <p style={{ fontWeight: 500 }}>{record.dinner ?? "--"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

