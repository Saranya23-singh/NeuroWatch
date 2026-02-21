import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Moon, 
  Utensils, 
  Activity, 
  Brain, 
  Pill, 
  Heart,
  Coffee,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Leaf,
  Timer,
  Smile,
  Frown
} from 'lucide-react';

interface TipCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  tips: Tip[];
}

interface Tip {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const categories: TipCategory[] = [
  {
    id: 'sleep',
    title: 'Sleep',
    icon: <Moon size={22} />,
    color: '#8B5CF6',
    tips: [
      { 
        id: 'sleep-1', 
        title: 'Maintain a Consistent Sleep Schedule', 
        description: 'Go to bed and wake up at the same time every day, even on weekends. This helps regulate your body\'s internal clock.'
      },
      { 
        id: 'sleep-2', 
        title: 'Create a Relaxing Bedtime Routine', 
        description: 'Develop a calming pre-sleep routine like reading, gentle stretching, or meditation to signal your body it\'s time to rest.'
      },
      { 
        id: 'sleep-3', 
        title: 'Keep Your Bedroom Cool and Dark', 
        description: 'Optimal sleep temperature is 65-68°F (18-20°C). Use blackout curtains and white noise if needed.'
      },
      { 
        id: 'sleep-4', 
        title: 'Limit Fluids Before Bed', 
        description: 'Reduce fluid intake 2 hours before bedtime to minimize nighttime bathroom trips that can disrupt sleep.'
      },
    ]
  },
  {
    id: 'diet',
    title: 'Diet & Nutrition',
    icon: <Utensils size={22} />,
    color: '#22C55E',
    tips: [
      { 
        id: 'diet-1', 
        title: 'Eat High-Fiber Foods', 
        description: 'Include plenty of fruits, vegetables, whole grains, and legumes to prevent constipation, a common Parkinson\'s issue.'
      },
      { 
        id: 'diet-2', 
        title: 'Stay Hydrated', 
        description: 'Drink at least 8 glasses of water daily. Dehydration can worsen symptoms and cause confusion.'
      },
      { 
        id: 'diet-3', 
        title: 'Space Meals Throughout the Day', 
        description: 'Eat smaller, more frequent meals to maintain energy levels and prevent blood sugar fluctuations.'
      },
      { 
        id: 'diet-4', 
        title: 'Include Omega-3 Fatty Acids', 
        description: 'Eat fish like salmon, walnuts, and flaxseeds to support brain health and reduce inflammation.'
      },
      { 
        id: 'diet-5', 
        title: 'Limit Protein Timing', 
        description: 'Avoid eating large amounts of protein close to medication times as it can affect absorption.'
      },
    ]
  },
  {
    id: 'exercise',
    title: 'Exercise & Physical Activity',
    icon: <Activity size={22} />,
    color: '#2563EB',
    tips: [
      { 
        id: 'ex-1', 
        title: 'Exercise Daily', 
        description: 'Aim for at least 30 minutes of moderate exercise most days. Consistency is more important than intensity.'
      },
      { 
        id: 'ex-2', 
        title: 'Include Balance Training', 
        description: 'Practice standing on one foot, tandem stance, or tai chi to improve balance and reduce fall risk.'
      },
      { 
        id: 'ex-3', 
        title: 'Do Stretching Exercises', 
        description: 'Regular stretching helps maintain flexibility and reduces muscle stiffness common in Parkinson\'s.'
      },
      { 
        id: 'ex-4', 
        title: 'Try Aerobic Activities', 
        description: 'Walking, cycling, or swimming improves cardiovascular health and may help with mood and energy.'
      },
      { 
        id: 'ex-5', 
        title: 'Practice Voice Exercises', 
        description: 'Sing, read aloud, or do vocal exercises to maintain speech volume and clarity.'
      },
    ]
  },
  {
    id: 'stress',
    title: 'Stress Management',
    icon: <Brain size={22} />,
    color: '#F59E0B',
    tips: [
      { 
        id: 'stress-1', 
        title: 'Practice Deep Breathing', 
        description: 'Deep breathing exercises can reduce anxiety and help manage stress-induced symptom flare-ups.'
      },
      { 
        id: 'stress-2', 
        title: 'Try Meditation and Mindfulness', 
        description: 'Regular meditation can reduce stress, improve mood, and enhance overall well-being.'
      },
      { 
        id: 'stress-3', 
        title: 'Stay Socially Connected', 
        description: 'Maintain relationships with friends and family. Social isolation can worsen symptoms and mood.'
      },
      { 
        id: 'stress-4', 
        title: 'Engage in Hobbies', 
        description: 'Continue doing activities you enjoy to maintain mental stimulation and emotional health.'
      },
    ]
  },
  {
    id: 'medication',
    title: 'Medication Management',
    icon: <Pill size={22} />,
    color: '#EF4444',
    tips: [
      { 
        id: 'med-1', 
        title: 'Take Medications on Schedule', 
        description: 'Consistency is crucial. Take medications at the same times every day for optimal effectiveness.'
      },
      { 
        id: 'med-2', 
        title: 'Use a Pill Organizer', 
        description: 'Organize medications by day and time to ensure nothing is missed and doses are accurate.'
      },
      { 
        id: 'med-3', 
        title: 'Track Side Effects', 
        description: 'Keep a journal of how medications make you feel to discuss with your healthcare provider.'
      },
      { 
        id: 'med-4', 
        title: 'Never Stop Suddenly', 
        description: 'Consult your doctor before making any changes to your medication regimen.'
      },
    ]
  },
  {
    id: 'safety',
    title: 'Safety & Fall Prevention',
    icon: <Heart size={22} />,
    color: '#EC4899',
    tips: [
      { 
        id: 'safety-1', 
        title: 'Remove Home Hazards', 
        description: 'Clear walkways of rugs, cords, and clutter. Install grab bars in bathrooms and railings on stairs.'
      },
      { 
        id: 'safety-2', 
        title: 'Wear Supportive Footwear', 
        description: 'Choose shoes with good traction and avoid flip-flops or loose slippers that can cause trips.'
      },
      { 
        id: 'safety-3', 
        title: 'Improve Home Lighting', 
        description: 'Ensure all areas are well-lit, especially hallways, bathrooms, and staircases.'
      },
      { 
        id: 'safety-4', 
        title: 'Use Assistive Devices When Needed', 
        description: 'Canes, walkers, or walking sticks can provide extra stability when symptoms are flaring.'
      },
    ]
  },
];

export function ParkinsonsGuide() {
  const [expandedCategory, setExpandedCategory] = useState<string>('exercise');

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? '' : id);
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1 className="page-title">Parkinson's Lifestyle Guide</h1>
        <p className="page-subtitle">Evidence-based recommendations for managing Parkinson's disease through lifestyle choices</p>
      </div>

      {/* Quick Summary */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            background: '#2563EB', 
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Brain size={28} color="white" />
          </div>
          <div>
            <h3 style={{ fontWeight: 600, color: '#1E40AF', marginBottom: '4px' }}>Key Takeaways</h3>
            <p style={{ color: '#1E3A8A', fontSize: '14px' }}>
              Regular exercise, proper nutrition, adequate sleep, and stress management are the pillars of living well with Parkinson's.
            </p>
          </div>
        </div>
      </div>

      {/* Category Cards */}
      {categories.map((category) => (
        <div 
          key={category.id}
          className="card"
          style={{ marginBottom: '16px', overflow: 'hidden', padding: 0 }}
        >
          {/* Category Header */}
          <div 
            onClick={() => toggleCategory(category.id)}
            style={{ 
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              background: expandedCategory === category.id ? '#F8FAFC' : '#fff',
              borderBottom: expandedCategory === category.id ? `1px solid ${category.color}20` : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                background: `${category.color}15`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: category.color
              }}>
                {category.icon}
              </div>
              <div>
                <h3 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{category.title}</h3>
                <p style={{ color: '#64748B', fontSize: '13px' }}>{category.tips.length} recommendations</p>
              </div>
            </div>
            {expandedCategory === category.id ? (
              <ChevronUp size={20} style={{ color: '#64748B' }} />
            ) : (
              <ChevronDown size={20} style={{ color: '#64748B' }} />
            )}
          </div>

          {/* Tips List */}
          {expandedCategory === category.id && (
            <div style={{ padding: '8px 24px 24px' }}>
              {category.tips.map((tip, index) => (
                <div 
                  key={tip.id}
                  style={{ 
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    marginTop: index === 0 ? '12px' : '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      background: category.color,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <CheckCircle size={14} color="white" />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{tip.title}</h4>
                      <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.5' }}>{tip.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Important Notice */}
      <div className="card" style={{ 
        marginTop: '24px', 
        background: '#FEF3C7', 
        border: '1px solid #FDE68A' 
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <AlertTriangle size={20} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontWeight: 600, color: '#92400E', marginBottom: '4px' }}>Important Notice</h4>
            <p style={{ color: '#B45309', fontSize: '14px', lineHeight: '1.5' }}>
              These recommendations are general guidelines and should not replace professional medical advice. 
              Always consult with your healthcare provider before making significant changes to your treatment or lifestyle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

