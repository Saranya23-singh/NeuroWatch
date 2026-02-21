import { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, AlertCircle, Heart, Brain, CheckCircle, Moon, Activity, Utensils, Footprints } from 'lucide-react';

const FIREBASE_WATCH_URL = "https://neurowatch-b3b08-default-rtdb.firebaseio.com/watch_data";
const FIREBASE_LIFESTYLE_URL = "https://neurowatch-b3b08-default-rtdb.firebaseio.com/lifestyle";

// Helper to get username from any localStorage key
const getUsername = (): string | null => {
  const storedUser = localStorage.getItem('neurowatch_user');
  if (storedUser) {
    const userData = JSON.parse(storedUser);
    if (userData.username) return userData.username;
  }
  
  const legacyUser = localStorage.getItem("user");
  if (legacyUser) {
    const userData = JSON.parse(legacyUser);
    if (userData.username) return userData.username;
  }
  
  return null;
};

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

interface HealthData {
  gait?: number;
  tremor?: number;
  voice?: number;
  heartRate?: number;
  sleepHours?: number;
  activity?: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
}

export function Suggestions() {
  const [healthData, setHealthData] = useState<HealthData>({});
  const [suggestions, setSuggestions] = useState<Omit<SuggestionCardProps, 'icon' | 'iconBg'>[]>([]);
  const [summary, setSummary] = useState({ goalsAchieved: 0, overallScore: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const username = getUsername();
      
      if (!username) {
        // Use demo suggestions when not logged in
        setSuggestions([
          {
            title: "Welcome to NeuroWatch",
            description: "Login to get personalized health recommendations based on your data.",
            priority: 'high'
          },
          {
            title: "Complete Your Profile",
            description: "Log your lifestyle data (sleep, meals, activity) to receive personalized insights.",
            priority: 'medium'
          },
          {
            title: "Stay Consistent",
            description: "Regular monitoring helps track your progress. Perform gait and voice analyses regularly.",
            priority: 'low'
          }
        ]);
        setSummary({ goalsAchieved: 0, overallScore: 50 });
        return;
      }

      try {
        // Fetch watch data
        const watchRes = await fetch(`${FIREBASE_WATCH_URL}/${username}.json`);
        const watchData = await watchRes.json();

        // Fetch lifestyle data
        const lifeRes = await fetch(`${FIREBASE_LIFESTYLE_URL}/${username}.json`);
        const lifestyleData = await lifeRes.json();

        const data = { ...watchData, ...lifestyleData };
        setHealthData(data);

        // Generate dynamic suggestions based on data
        const newSuggestions: Omit<SuggestionCardProps, 'icon' | 'iconBg'>[] = [];
        let goals = 0;
        let score = 70;

        // Sleep analysis
        if (data.sleepHours) {
          if (data.sleepHours < 6) {
            newSuggestions.push({
              title: "Improve Sleep Duration",
              description: `Your sleep duration is only ${data.sleepHours} hours. Aim for 7-9 hours of sleep for optimal neurological health and better symptom management.`,
              priority: 'high'
            });
          } else if (data.sleepHours >= 7 && data.sleepHours <= 9) {
            newSuggestions.push({
              title: "Great Sleep Habits!",
              description: `You're getting ${data.sleepHours} hours of sleep - that's optimal for Parkinson's management.`,
              priority: 'low'
            });
            goals++;
            score += 10;
          }
        } else {
          newSuggestions.push({
            title: "Log Your Sleep",
            description: "Track your sleep hours in the Lifestyle section to get personalized recommendations.",
            priority: 'medium'
          });
        }

        // Gait analysis
        if (data.gait) {
          if (data.gait < 60) {
            newSuggestions.push({
              title: "Focus on Balance Exercises",
              description: `Your gait score is ${data.gait}. Consider including more balance training exercises and daily walks to improve mobility.`,
              priority: 'high'
            });
          } else if (data.gait >= 80) {
            newSuggestions.push({
              title: "Excellent Gait Score!",
              description: `Your gait score of ${data.gait} shows great mobility. Keep up your current exercise routine!`,
              priority: 'low'
            });
            goals++;
            score += 10;
          } else {
            newSuggestions.push({
              title: "Moderate Gait Score",
              description: `Your gait score is ${data.gait}. Regular walking and balance exercises can help improve this.`,
              priority: 'medium'
            });
            score += 5;
          }
        }

        // Tremor analysis
        if (data.tremor) {
          if (data.tremor > 40) {
            newSuggestions.push({
              title: "High Tremor Levels Detected",
              description: `Your tremor score is ${data.tremor}. Try hand exercises and relaxation techniques. Consider consulting your doctor if this persists.`,
              priority: 'high'
            });
          } else if (data.tremor <= 20) {
            newSuggestions.push({
              title: "Tremor Levels Well Controlled",
              description: `Your tremor score of ${data.tremor} shows good symptom control.`,
              priority: 'low'
            });
            goals++;
            score += 10;
          } else {
            newSuggestions.push({
              title: "Moderate Tremor Levels",
              description: `Your tremor score is ${data.tremor}. Regular hand exercises may help reduce this further.`,
              priority: 'medium'
            });
            score += 5;
          }
        }

        // Voice analysis
        if (data.voice) {
          if (data.voice < 70) {
            newSuggestions.push({
              title: "Voice Training Recommended",
              description: `Your voice stability score is ${data.voice}. Regular speech exercises can help maintain vocal strength.`,
              priority: 'medium'
            });
          } else {
            goals++;
            score += 5;
          }
        }

        // Activity/Lifestyle analysis
        if (data.activity) {
          if (data.activity === 'None' || data.activity === 'Sedentary') {
            newSuggestions.push({
              title: "Increase Physical Activity",
              description: "Regular exercise is crucial for Parkinson's management. Aim for at least 30 minutes of activity daily.",
              priority: 'high'
            });
          } else {
            newSuggestions.push({
              title: "Great Activity Level!",
              description: `You're staying active with ${data.activity}. This is excellent for managing Parkinson's symptoms.`,
              priority: 'low'
            });
            goals++;
            score += 10;
          }
        }

        // Dietary analysis
        if (data.breakfast || data.lunch || data.dinner) {
          const hasBreakfast = data.breakfast && data.breakfast.length > 0;
          const hasHealthyOptions = data.lunch && data.dinner;
          
          if (hasBreakfast && hasHealthyOptions) {
            newSuggestions.push({
              title: "Excellent Dietary Habits",
              description: "You're maintaining regular meals - this helps with medication timing and energy levels.",
              priority: 'low'
            });
            goals++;
            score += 5;
          }
        }

        // Heart rate analysis
        if (data.heartRate) {
          if (data.heartRate > 100 || data.heartRate < 50) {
            newSuggestions.push({
              title: "Irregular Heart Rate",
              description: `Your heart rate (${data.heartRate} bpm) is outside the normal range. Please consult your healthcare provider.`,
              priority: 'high'
            });
          } else {
            score += 5;
          }
        }

        // Default suggestions if not enough data
        if (newSuggestions.length < 2) {
          newSuggestions.push({
            title: "Complete Your Health Profile",
            description: "Log your lifestyle data (sleep, meals, activity) in the Lifestyle section to get personalized recommendations.",
            priority: 'medium'
          });
          newSuggestions.push({
            title: "Regular Check-ups Important",
            description: "Remember to perform gait and voice analyses regularly to track your progress.",
            priority: 'low'
          });
        }

        setSuggestions(newSuggestions);
        setSummary({ goalsAchieved: goals, overallScore: Math.min(score, 100) });

      } catch (error) {
        console.error("Error fetching data:", error);
        // Set default suggestions
        setSuggestions([
          {
            title: "Welcome to NeuroWatch",
            description: "Start by logging your lifestyle data and completing a gait analysis to get personalized recommendations.",
            priority: 'medium'
          },
          {
            title: "Stay Consistent",
            description: "Regular monitoring helps track your progress. Try to sync your smartwatch and log daily activities.",
            priority: 'low'
          }
        ]);
        setSummary({ goalsAchieved: 0, overallScore: 70 });
      }
    };

    fetchData();
  }, []);

  const getSummaryMessage = () => {
    const { overallScore } = summary;
    if (overallScore >= 85) {
      return "You're making excellent progress! Your health metrics are showing strong improvement.";
    } else if (overallScore >= 70) {
      return "You're doing well! Keep tracking your metrics and following the recommendations.";
    } else {
      return "There's room for improvement. Focus on the high-priority suggestions to see better results.";
    }
  };

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
          {getSummaryMessage()}
        </p>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <div className="flex items-center gap-2">
            <CheckCircle size={20} />
            <span>{summary.goalsAchieved} Goals Achieved</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={20} />
            <span>Overall Score: {summary.overallScore}/100</span>
          </div>
        </div>
      </div>

      {/* Dynamic Suggestions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {suggestions.map((suggestion, index) => {
          const icons = [
            <Moon size={24} color="#8B5CF6" />,
            <Footprints size={24} color="#2563EB" />,
            <Activity size={24} color="#F59E0B" />,
            <Heart size={24} color="#EF4444" />,
            <Brain size={24} color="#22C55E" />,
            <Utensils size={24} color="#F59E0B" />,
            <TrendingUp size={24} color="#2563EB" />,
            <CheckCircle size={24} color="#22C55E" />,
          ];
          
          return (
            <SuggestionCard
              key={index}
              title={suggestion.title}
              description={suggestion.description}
              icon={icons[index % icons.length]}
              iconBg="bg-blue-100"
              priority={suggestion.priority}
            />
          );
        })}
      </div>
    </div>
  );
}

