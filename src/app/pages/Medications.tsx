import { useState, useEffect } from 'react';
import { 
  Pill, 
  Clock, 
  Plus, 
  Check, 
  X, 
  AlertTriangle, 
  Bell, 
  Calendar,
  Trash2,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  CheckSquare,
  Square
} from 'lucide-react';

// Common Parkinson's medications database
const PARKINSONS_MEDICATIONS = [
  {
    id: '1',
    name: 'Levodopa/Carbidopa',
    purpose: 'Primary treatment for motor symptoms',
    notes: 'Most effective for tremor and bradykinesia. Take on empty stomach.',
    category: 'Dopamine Precursor'
  },
  {
    id: '2',
    name: 'Pramipexole',
    purpose: 'Dopamine agonist',
    notes: 'May cause drowsiness. Start with low dose and titrate gradually.',
    category: 'Dopamine Agonist'
  },
  {
    id: '3',
    name: 'Ropinirole',
    purpose: 'Dopamine agonist',
    notes: 'Can cause sudden sleep attacks. Use caution when driving.',
    category: 'Dopamine Agonist'
  },
  {
    id: '4',
    name: 'Selegiline',
    purpose: 'MAO-B inhibitor',
    notes: 'May interact with certain antidepressants. Take in the morning.',
    category: 'MAO-B Inhibitor'
  },
  {
    id: '5',
    name: 'Entacapone',
    purpose: 'COMT inhibitor',
    notes: 'Extends effect of Levodopa. Take with each dose of Levodopa.',
    category: 'COMT Inhibitor'
  },
  {
    id: '6',
    name: 'Amantadine',
    purpose: 'Reduces dyskinesia',
    notes: 'Can cause livedo reticularis. Take in the morning to avoid insomnia.',
    category: 'Other'
  }
];

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  notes?: string;
  enabled: boolean; // Enable/disable reminders for this medication
}

interface MedicationLog {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  takenTime?: string;
  status: 'pending' | 'taken' | 'missed';
  date: string;
}

export function Medications() {
  const [activeTab, setActiveTab] = useState<'info' | 'setup' | 'logs' | 'reports'>('setup');
  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const stored = localStorage.getItem('neurowatch_medications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [logs, setLogs] = useState<MedicationLog[]>(() => {
    try {
      const stored = localStorage.getItem('neurowatch_medication_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderMedication, setReminderMedication] = useState<MedicationLog | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      return localStorage.getItem('neurowatch_notifications') === 'true';
    } catch {
      return false;
    }
  });
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    times: [''],
    notes: '',
    enabled: true
  });

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return;
    }
    
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      localStorage.setItem('neurowatch_notifications', 'true');
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('neurowatch_notifications', 'true');
      }
    }
  };

  // Test reminder - manually trigger a notification
  const testReminder = () => {
    const testMed: Medication = {
      id: 'test',
      name: 'Test Medication',
      dosage: '100mg',
      frequency: 'daily',
      times: ['now'],
      enabled: true
    };
    
    const message = `Time to take ${testMed.name} (${testMed.dosage})`;
    setReminderMessage(message);
    setShowReminder(true);
    playAlarmSound();
    showBrowserNotification('Medication Reminder', message);
    
    const newLog: MedicationLog = {
      id: Date.now().toString(),
      medicationId: testMed.id,
      medicationName: testMed.name,
      dosage: testMed.dosage,
      scheduledTime: new Date().toTimeString().slice(0, 5),
      status: 'pending',
      date: getTodayDate()
    };
    setReminderMedication(newLog);
  };

  // Show browser notification
  const showBrowserNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'medication-reminder',
        requireInteraction: true,
        vibrate: [200, 100, 200]
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  // Play alarm sound - using HTML5 Audio for better browser support
  const playAlarmSound = () => {
    try {
      // Method 1: Try using Web Audio API
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        
        // Play multiple beeps
        const playBeep = (startTime: number, frequency: number, duration: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'square';
          
          gainNode.gain.setValueAtTime(0.15, startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };
        
        const now = audioContext.currentTime;
        // Play 3 beeps with increasing frequency
        playBeep(now, 600, 0.2);
        playBeep(now + 0.3, 800, 0.2);
        playBeep(now + 0.6, 1000, 0.3);
        
        console.log('Alarm sound played via Web Audio API');
        return;
      }
      
      // Method 2: Fallback - try playing a beep using audio element
      const audio = new Audio();
      // Generate a simple beep using data URL
      const sampleRate = 44100;
      const duration = 0.5;
      const numSamples = sampleRate * duration;
      const samples = new Uint8Array(numSamples);
      
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Generate a beep tone
        samples[i] = Math.floor(128 + 127 * Math.sin(2 * Math.PI * 800 * t) * Math.exp(-3 * t));
      }
      
      // This is a workaround - browsers may block auto-play audio
      console.log('Audio context not available, sound may not play without user interaction');
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // Get today's date string
  const getTodayDate = () => new Date().toISOString().slice(0, 10);

  // Save medications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('neurowatch_medications', JSON.stringify(medications));
    } catch (e) {
      console.error('Error saving medications:', e);
    }
  }, [medications]);

  // Save logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('neurowatch_medication_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving logs:', e);
    }
  }, [logs]);

  // Check for missed doses - run every minute
  useEffect(() => {
    const checkMissedDoses = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const today = getTodayDate();

      setLogs(prevLogs => {
        const updatedLogs = prevLogs.map(log => {
          // Only check pending logs for today
          if (log.date === today && log.status === 'pending') {
            // If scheduled time has passed by more than 30 minutes, mark as missed
            if (log.scheduledTime < currentTime) {
              const [schedHour, schedMin] = log.scheduledTime.split(':').map(Number);
              const [currHour, currMin] = currentTime.split(':').map(Number);
              const schedMinutes = schedHour * 60 + schedMin;
              const currMinutes = currHour * 60 + currMin;
              
              if (currMinutes - schedMinutes >= 30) {
                return { ...log, status: 'missed' as const };
              }
            }
          }
          return log;
        });
        return updatedLogs;
      });
    };

    // Check immediately and then every minute
    checkMissedDoses();
    const interval = setInterval(checkMissedDoses, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check for reminders every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const today = getTodayDate();

      medications.forEach(med => {
        // Skip if reminders are disabled for this medication
        if (!med.enabled) return;
        
        med.times.forEach(time => {
          const [hour, minute] = time.split(':').map(Number);
          const reminderTime = new Date(now);
          reminderTime.setHours(hour, minute, 0, 0);
          
          const diffMinutes = Math.abs(now.getTime() - reminderTime.getTime()) / 60000;
          
          if (diffMinutes < 2) {
            // Check if already logged
            const existingLog = logs.find(l => 
              l.medicationId === med.id && 
              l.date === today && 
              l.scheduledTime === time
            );
            
            if (!existingLog) {
              const message = `Time to take ${med.name} (${med.dosage})`;
              setReminderMessage(message);
              setShowReminder(true);
              playAlarmSound();
              
              // Show browser notification
              showBrowserNotification('Medication Reminder', message);
              
              // Auto-create pending log
              const newLog: MedicationLog = {
                id: Date.now().toString(),
                medicationId: med.id,
                medicationName: med.name,
                dosage: med.dosage,
                scheduledTime: time,
                status: 'pending',
                date: today
              };
              setReminderMedication(newLog);
              setLogs(prev => [...prev, newLog]);
            }
          }
        });
      });
    };

    const interval = setInterval(checkReminders, 60000);
    checkReminders();
    
    return () => clearInterval(interval);
  }, [medications, logs]);

  // Handle taking medication from reminder
  const handleTakeFromReminder = () => {
    if (reminderMedication) {
      markAsTaken(reminderMedication.id);
      setShowReminder(false);
      setReminderMedication(null);
    }
  };

  // Handle snoozing reminder (5 minutes)
  const handleSnoozeReminder = () => {
    if (reminderMedication) {
      setShowReminder(false);
      setReminderMedication(null);
      // Snooze for 5 minutes
      setTimeout(() => {
        const message = `REMINDER: Time to take ${reminderMedication.medicationName} (${reminderMedication.dosage})`;
        setReminderMessage(message);
        setShowReminder(true);
        playAlarmSound();
        showBrowserNotification('Medication Reminder (Snoozed)', message);
        
        // Re-add the log if it was removed
        const today = getTodayDate();
        const existingLog = logs.find(l => 
          l.medicationId === reminderMedication.medicationId && 
          l.date === today && 
          l.scheduledTime === reminderMedication.scheduledTime
        );
        if (!existingLog) {
          const newLog: MedicationLog = {
            ...reminderMedication,
            id: Date.now().toString()
          };
          setReminderMedication(newLog);
          setLogs(prev => [...prev, newLog]);
        }
      }, 5 * 60 * 1000);
    }
  };

  // Handle dismissing reminder
  const handleDismissReminder = () => {
    setShowReminder(false);
    setReminderMedication(null);
  };

  // Generate today's logs from medications
  const generateTodayLogs = () => {
    const today = getTodayDate();
    const todayLogs: MedicationLog[] = [];
    
    medications.forEach(med => {
      med.times.forEach(time => {
        // Check if log already exists
        const existingLog = logs.find(l => 
          l.medicationId === med.id && 
          l.date === today && 
          l.scheduledTime === time
        );
        
        if (existingLog) {
          todayLogs.push(existingLog);
        } else {
          // Create new pending log
          const newLog: MedicationLog = {
            id: `${med.id}-${time}-${today}`,
            medicationId: med.id,
            medicationName: med.name,
            dosage: med.dosage,
            scheduledTime: time,
            status: 'pending',
            date: today
          };
          todayLogs.push(newLog);
        }
      });
    });
    
    // Update logs with any new ones
    const newLogs = todayLogs.filter(tl => 
      !logs.some(l => l.id === tl.id)
    );
    
    if (newLogs.length > 0) {
      setLogs(prev => [...prev, ...newLogs]);
    }
    
    return todayLogs;
  };

  // Mark dose as taken
  const markAsTaken = (logId: string) => {
    const now = new Date().toTimeString().slice(0, 5);
    setLogs(prev => prev.map(log => 
      log.id === logId 
        ? { ...log, status: 'taken' as const, takenTime: now }
        : log
    ));
  };

  // Mark dose as missed
  const markAsMissed = (logId: string) => {
    setLogs(prev => prev.map(log => 
      log.id === logId 
        ? { ...log, status: 'missed' as const }
        : log
    ));
  };

  // Mark dose as pending (undo)
  const markAsPending = (logId: string) => {
    setLogs(prev => prev.map(log => 
      log.id === logId 
        ? { ...log, status: 'pending' as const, takenTime: undefined }
        : log
    ));
  };

  // Add new medication
  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.times[0]) return;
    
    const medication: Medication = {
      id: Date.now().toString(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency,
      times: newMedication.times.filter(t => t),
      notes: newMedication.notes,
      enabled: newMedication.enabled
    };
    
    setMedications(prev => [...prev, medication]);
    setShowAddModal(false);
    setNewMedication({
      name: '',
      dosage: '',
      frequency: 'daily',
      times: [''],
      notes: '',
      enabled: true
    });
  };

  // Delete medication
  const deleteMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  // Toggle reminder for a medication
  const toggleMedicationReminder = (id: string) => {
    setMedications(prev => prev.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  // Add time slot
  const addTimeSlot = () => {
    setNewMedication(prev => ({
      ...prev,
      times: [...prev.times, '']
    }));
  };

  // Calculate adherence stats
  const getAdherenceStats = () => {
    const today = getTodayDate();
    const todayLogs = logs.filter(l => l.date === today);
    const taken = todayLogs.filter(l => l.status === 'taken').length;
    const pending = todayLogs.filter(l => l.status === 'pending').length;
    const missed = todayLogs.filter(l => l.status === 'missed').length;
    const total = todayLogs.length || 1;
    const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekLogs = logs.filter(l => l.date >= weekAgo.toISOString().slice(0, 10));
    const weekTaken = weekLogs.filter(l => l.status === 'taken').length;
    const weekTotal = weekLogs.length || 1;
    const weekPercentage = Math.round((weekTaken / weekTotal) * 100);
    
    const missedThisWeek = weekLogs.filter(l => l.status === 'missed').length;
    
    return { 
      todayPercentage: percentage, 
      weekPercentage,
      missedThisWeek,
      todayTaken: taken,
      todayPending: pending,
      todayMissed: missed,
      todayTotal: todayLogs.length
    };
  };

  const stats = getAdherenceStats();
  const todayLogs = generateTodayLogs();

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'taken':
        return { bg: '#DCFCE7', text: '#16A34A', icon: <CheckCircle size={14} /> };
      case 'missed':
        return { bg: '#FEE2E2', text: '#DC2626', icon: <AlertTriangle size={14} /> };
      default:
        return { bg: '#FEF3C7', text: '#D97706', icon: <Clock size={14} /> };
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      {/* Reminder Modal - Enhanced Popup */}
      {showReminder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            animation: 'scaleIn 0.3s ease'
          }}>
            {/* Animated Bell Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
              animation: 'pulse 2s infinite'
            }}>
              <Bell size={40} color="white" />
            </div>
            
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: '8px'
            }}>
              Time for Your Medication!
            </h2>
            
            <p style={{
              fontSize: '18px',
              color: '#3B82F6',
              fontWeight: 600,
              marginBottom: '8px'
            }}>
              {reminderMessage}
            </p>
            
            <p style={{
              fontSize: '14px',
              color: '#64748B',
              marginBottom: '32px'
            }}>
              Don't forget to take your medication on schedule for best results.
            </p>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleTakeFromReminder}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '16px',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Check size={22} />
                Mark as Taken
              </button>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSnoozeReminder}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    border: '2px solid #F59E0B',
                    background: 'white',
                    color: '#F59E0B',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Clock size={18} />
                  Snooze 5 min
                </button>
                
                <button
                  onClick={handleDismissReminder}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    border: '2px solid #E2E8F0',
                    background: 'white',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <X size={18} />
                  Dismiss
                </button>
              </div>
            </div>
            
            {/* Enable Notifications Link */}
            {!notificationsEnabled && (
              <button
                onClick={requestNotificationPermission}
                style={{
                  marginTop: '20px',
                  background: 'none',
                  border: 'none',
                  color: '#3B82F6',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textDecoration: 'underline'
                }}
              >
                Enable browser notifications for reminders
              </button>
            )}
          </div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Medications</h1>
        <p className="page-subtitle">Track your Parkinson's medications and maintain adherence</p>
        
        {/* Test Reminder Button */}
        <button
          onClick={testReminder}
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
          }}
        >
          <Bell size={18} />
          Test Reminder Notification
        </button>
      </div>

      {/* Today's Summary Card */}
      <div 
        className="card" 
        style={{ 
          marginBottom: '24px',
          background: stats.todayPercentage >= 80 
            ? 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)' 
            : stats.todayPercentage >= 50 
              ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
              : 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
          border: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Today's Progress</h3>
            <p style={{ color: '#64748B', fontSize: '14px' }}>
              {stats.todayTaken} taken • {stats.todayPending} pending • {stats.todayMissed} missed
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ 
                fontSize: '36px', 
                fontWeight: 700, 
                color: stats.todayPercentage >= 80 ? '#16A34A' : stats.todayPercentage >= 50 ? '#D97706' : '#DC2626',
                lineHeight: 1
              }}>
                {stats.todayPercentage}%
              </p>
              <p style={{ color: '#64748B', fontSize: '12px' }}>Adherence</p>
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ 
              height: '100%', 
              width: `${(stats.todayTaken / stats.todayTotal) * 100 || 0}%`,
              background: '#22C55E',
              transition: 'width 0.3s ease'
            }} />
            <div style={{ 
              height: '100%', 
              width: `${(stats.todayPending / stats.todayTotal) * 100 || 0}%`,
              background: '#F59E0B',
              transition: 'width 0.3s ease'
            }} />
            <div style={{ 
              height: '100%', 
              width: `${(stats.todayMissed / stats.todayTotal) * 100 || 0}%`,
              background: '#EF4444',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#64748B' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#22C55E' }} /> Taken
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#F59E0B' }} /> Pending
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EF4444' }} /> Missed
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '2px solid #E2E8F0',
        paddingBottom: '8px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'setup', label: 'My Medications', icon: <PlusCircle size={18} /> },
          { id: 'logs', label: 'Today\'s Logs', icon: <Calendar size={18} /> },
          { id: 'info', label: 'Medicine Info', icon: <Pill size={18} /> },
          { id: 'reports', label: 'Reports', icon: <TrendingUp size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? '#3B82F6' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748B',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      
      {/* 1. Medication Setup */}
      {activeTab === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Add Medication Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}
          >
            <Plus size={18} />
            Add Medication
          </button>

          {/* User's Medications */}
          {medications.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <Pill size={48} color="#94A3B8" style={{ marginBottom: '16px' }} />
              <h3 style={{ color: '#64748B', marginBottom: '8px' }}>No medications added yet</h3>
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>Add your medications to start tracking and get reminders</p>
            </div>
          ) : (
            medications.map(med => (
              <div key={med.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{med.name}</h3>
                    <p style={{ color: '#3B82F6', fontSize: '14px', marginBottom: '8px' }}>{med.dosage} - {med.frequency}</p>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {med.times.map((time, idx) => (
                        <span key={idx} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          background: '#F1F5F9',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#64748B'
                        }}>
                          <Clock size={14} />
                          {time}
                        </span>
                      ))}
                    </div>
                    {med.notes && (
                      <p style={{ color: '#94A3B8', fontSize: '13px' }}>{med.notes}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Reminder Toggle */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px 12px',
                      background: med.enabled ? '#DCFCE7' : '#F1F5F9',
                      borderRadius: '8px'
                    }}>
                      <Bell size={16} color={med.enabled ? '#16A34A' : '#94A3B8'} />
                      <button
                        onClick={() => toggleMedicationReminder(med.id)}
                        style={{
                          width: '40px',
                          height: '22px',
                          borderRadius: '11px',
                          border: 'none',
                          background: med.enabled ? '#22C55E' : '#E2E8F0',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: 'white',
                          position: 'absolute',
                          top: '2px',
                          left: med.enabled ? '20px' : '2px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          transition: 'left 0.2s ease'
                        }} />
                      </button>
                    </div>
                    <button
                      onClick={() => deleteMedication(med.id)}
                      style={{
                        background: '#FEE2E2',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        color: '#DC2626'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. Today's Logs */}
      {activeTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontWeight: 600, color: '#0F172A' }}>Today's Medication Schedule</h3>
            <span style={{ color: '#64748B', fontSize: '14px' }}>{getTodayDate()}</span>
          </div>

          {todayLogs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <Calendar size={48} color="#94A3B8" style={{ marginBottom: '16px' }} />
              <h3 style={{ color: '#64748B', marginBottom: '8px' }}>No medications scheduled</h3>
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>Add medications in the "My Medications" tab to see your schedule</p>
            </div>
          ) : (
            todayLogs
              .sort((a, b) => {
                // Sort by status: pending first, then by time
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (a.status !== 'pending' && b.status === 'pending') return 1;
                return a.scheduledTime.localeCompare(b.scheduledTime);
              })
              .map(log => {
                const statusStyle = getStatusBadge(log.status);
                return (
                  <div 
                    key={log.id} 
                    className="card" 
                    style={{ 
                      padding: '16px',
                      borderLeft: `4px solid ${
                        log.status === 'taken' ? '#22C55E' : 
                        log.status === 'missed' ? '#EF4444' : '#F59E0B'
                      }`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h4 style={{ fontWeight: 600, color: '#0F172A' }}>{log.medicationName}</h4>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 500,
                            background: statusStyle.bg,
                            color: statusStyle.text,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {statusStyle.icon}
                            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                          </span>
                        </div>
                        <p style={{ color: '#64748B', fontSize: '14px' }}>{log.dosage}</p>
                        <p style={{ color: '#94A3B8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Clock size={14} />
                          Scheduled: {log.scheduledTime}
                          {log.status === 'taken' && log.takenTime && ` • Taken at ${log.takenTime}`}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {log.status === 'pending' && (
                          <>
                            <button
                              onClick={() => markAsTaken(log.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#22C55E',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '14px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Check size={16} />
                              Mark Taken
                            </button>
                            <button
                              onClick={() => markAsMissed(log.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '14px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <X size={16} />
                              Missed
                            </button>
                          </>
                        )}
                        
                        {log.status === 'taken' && (
                          <button
                            onClick={() => markAsPending(log.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '10px 16px',
                              borderRadius: '8px',
                              border: '1px solid #E2E8F0',
                              background: 'white',
                              color: '#64748B',
                              cursor: 'pointer',
                              fontWeight: 500,
                              fontSize: '14px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Undo
                          </button>
                        )}
                        
                        {log.status === 'missed' && (
                          <button
                            onClick={() => markAsTaken(log.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '10px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#22C55E',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: 500,
                              fontSize: '14px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Check size={16} />
                            Mark Taken
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}

          {/* Missed Alerts */}
          {stats.todayMissed > 0 && (
            <div className="card" style={{ background: '#FEE2E2', border: '1px solid #FECACA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={20} color="#DC2626" />
                <div>
                  <h4 style={{ fontWeight: 600, color: '#DC2626' }}>Missed Doses</h4>
                  <p style={{ color: '#991B1B', fontSize: '14px' }}>
                    {stats.todayMissed} dose(s) marked as missed today
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Medicines Information */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Activity size={24} />
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>Parkinson's Medication Guide</h3>
                <p style={{ opacity: 0.9, fontSize: '14px' }}>Commonly prescribed medications for Parkinson's disease management</p>
              </div>
            </div>
          </div>

          {PARKINSONS_MEDICATIONS.map(med => (
            <div key={med.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{med.name}</h3>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: '#DBEAFE',
                    color: '#1D4ED8'
                  }}>
                    {med.category}
                  </span>
                </div>
                <Pill size={20} color="#3B82F6" />
              </div>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '8px' }}>
                <strong>Purpose:</strong> {med.purpose}
              </p>
              <div style={{ 
                background: '#FEF3C7', 
                padding: '12px', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <AlertCircle size={16} color="#D97706" style={{ marginTop: '2px' }} />
                <p style={{ color: '#92400E', fontSize: '13px' }}>{med.notes}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Reports */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Weekly Overview */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '20px' }}>Weekly Adherence</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', padding: '20px', background: '#F8FAFC', borderRadius: '12px' }}>
                <p style={{ fontSize: '36px', fontWeight: 700, color: '#3B82F6' }}>{stats.weekPercentage}%</p>
                <p style={{ color: '#64748B', fontSize: '14px' }}>Weekly Adherence</p>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: '#F8FAFC', borderRadius: '12px' }}>
                <p style={{ fontSize: '36px', fontWeight: 700, color: stats.missedThisWeek > 0 ? '#DC2626' : '#22C55E' }}>{stats.missedThisWeek}</p>
                <p style={{ color: '#64748B', fontSize: '14px' }}>Missed Doses</p>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: '#F8FAFC', borderRadius: '12px' }}>
                <p style={{ fontSize: '36px', fontWeight: 700, color: '#8B5CF6' }}>{medications.length}</p>
                <p style={{ color: '#64748B', fontSize: '14px' }}>Active Medications</p>
              </div>
            </div>

            {/* Adherence Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 500, color: '#0F172A' }}>Adherence Progress</span>
                <span style={{ color: '#64748B' }}>{stats.weekPercentage}%</span>
              </div>
              <div style={{ height: '12px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${stats.weekPercentage}%`,
                  background: stats.weekPercentage >= 80 ? '#22C55E' : stats.weekPercentage >= 50 ? '#F59E0B' : '#DC2626',
                  borderRadius: '6px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Recent History */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>Recent History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.slice(-10).reverse().map(log => {
                const statusStyle = getStatusBadge(log.status);
                return (
                  <div key={log.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: '#F8FAFC',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <p style={{ fontWeight: 500, color: '#0F172A' }}>{log.medicationName}</p>
                      <p style={{ color: '#64748B', fontSize: '13px' }}>{log.date} at {log.scheduledTime}</p>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {statusStyle.icon}
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                  </div>
                );
              })}
              {logs.length === 0 && (
                <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>No medication history yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontWeight: 600, fontSize: '20px', marginBottom: '20px', color: '#0F172A' }}>Add Medication</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', color: '#0F172A' }}>Medication Name *</label>
                <input
                  type="text"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Levodopa/Carbidopa"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', color: '#0F172A' }}>Dosage *</label>
                <input
                  type="text"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="e.g., 100mg"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', color: '#0F172A' }}>Frequency</label>
                <select
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="twice daily">Twice Daily</option>
                  <option value="three times daily">Three Times Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as needed">As Needed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', color: '#0F172A' }}>Times *</label>
                {newMedication.times.map((time, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const newTimes = [...newMedication.times];
                        newTimes[idx] = e.target.value;
                        setNewMedication(prev => ({ ...prev, times: newTimes }));
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    {newMedication.times.length > 1 && (
                      <button
                        onClick={() => {
                          const newTimes = newMedication.times.filter((_, i) => i !== idx);
                          setNewMedication(prev => ({ ...prev, times: newTimes }));
                        }}
                        style={{
                          padding: '12px',
                          border: 'none',
                          borderRadius: '8px',
                          background: '#FEE2E2',
                          color: '#DC2626',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addTimeSlot}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    border: '1px dashed #CBD5E1',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <Plus size={16} />
                  Add another time
                </button>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '16px',
                background: '#F8FAFC',
                borderRadius: '8px',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Bell size={20} color="#3B82F6" />
                  <div>
                    <p style={{ fontWeight: 500, color: '#0F172A', fontSize: '14px' }}>Enable Reminders</p>
                    <p style={{ color: '#64748B', fontSize: '12px' }}>Get notified when it's time to take this medication</p>
                  </div>
                </div>
                <button
                  onClick={() => setNewMedication(prev => ({ ...prev, enabled: !prev.enabled }))}
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '13px',
                    border: 'none',
                    background: newMedication.enabled ? '#22C55E' : '#E2E8F0',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: newMedication.enabled ? '24px' : '2px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s ease'
                  }} />
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', color: '#0F172A' }}>Notes (optional)</label>
                <textarea
                  value={newMedication.notes}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g., Take with food"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMedication}
                  disabled={!newMedication.name || !newMedication.dosage || !newMedication.times[0]}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    background: newMedication.name && newMedication.dosage && newMedication.times[0] ? '#3B82F6' : '#94A3B8',
                    color: 'white',
                    cursor: newMedication.name && newMedication.dosage && newMedication.times[0] ? 'pointer' : 'not-allowed',
                    fontWeight: 500
                  }}
                >
                  Add Medication
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

