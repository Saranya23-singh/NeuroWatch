import { useState } from 'react';
import { 
  Clock, 
  Dumbbell,
  Brain,
  Mic,
  Moon
} from 'lucide-react';

interface ExerciseVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: 'gait' | 'tremor' | 'voice' | 'relaxation';
  youtubeId: string;
}

// User-provided YouTube video IDs
const exerciseVideos: ExerciseVideo[] = [
  // Gait & Balance
  {
    id: '1',
    title: "Parkinson's Gait & Balance Training",
    description: 'Essential exercises to improve walking pattern, balance, and reduce freezing of gait in Parkinson\'s disease.',
    duration: '15 min',
    category: 'gait',
    youtubeId: 'F4PxppoQmHs'
  },
  {
    id: '2',
    title: 'Balance Exercises for Parkinson\'s',
    description: 'Safe and effective balance training exercises specifically designed for people with Parkinson\'s.',
    duration: '12 min',
    category: 'gait',
    youtubeId: 'knFu175wjP4'
  },
  
  // Tremor & Movement
  {
    id: '3',
    title: 'Hand & Finger Exercises for Parkinson\'s',
    description: 'Exercises to reduce hand tremors, improve dexterity, and maintain fine motor skills.',
    duration: '10 min',
    category: 'tremor',
    youtubeId: 'Ez2GeaMa4c8'
  },
  {
    id: '4',
    title: 'Tremor Management Exercises',
    description: 'Learn techniques to manage and reduce tremor symptoms through targeted movements.',
    duration: '8 min',
    category: 'tremor',
    youtubeId: '-rc7IQxmm-w'
  },
  {
    id: '5',
    title: 'Facial Exercises for Parkinson\'s',
    description: 'Improve facial expression and reduce mask-like face with these targeted exercises.',
    duration: '10 min',
    category: 'tremor',
    youtubeId: '9H3WExYf_70'
  },
  
  // Voice & Speech
  {
    id: '6',
    title: 'LSVT LOUD Voice Therapy Exercises',
    description: 'The gold standard in speech therapy for Parkinson\'s - learn to speak louder and more clearly.',
    duration: '15 min',
    category: 'voice',
    youtubeId: 'L8bkqvf6TRs'
  },
  {
    id: '7',
    title: 'Breathing Exercises for Parkinson\'s',
    description: 'Diaphragmatic breathing to support speech and reduce shortness of breath.',
    duration: '8 min',
    category: 'voice',
    youtubeId: 'ktuckyhxNW4'
  },
  {
    id: '8',
    title: 'Speech & Swallowing Exercises',
    description: 'Exercises to improve speech clarity and safe swallowing techniques.',
    duration: '12 min',
    category: 'voice',
    youtubeId: '4SNO61r4Nz8'
  },
  
  // Relaxation - 3 videos
  {
    id: '9',
    title: 'Progressive Muscle Relaxation',
    description: 'Full body progressive relaxation technique to reduce stress, anxiety, and muscle tension.',
    duration: '20 min',
    category: 'relaxation',
    youtubeId: 'SNqYG95j_UQ'
  },
  {
    id: '10',
    title: 'Gentle Morning Stretches',
    description: 'Start your day with gentle stretches to reduce morning stiffness and improve flexibility.',
    duration: '15 min',
    category: 'relaxation',
    youtubeId: 'rwdbg4W2Rbs'
  },
  {
    id: '11',
    title: 'Evening Wind Down Routine',
    description: 'Calming routine to prepare for restful sleep, reducing stress and promoting relaxation.',
    duration: '12 min',
    category: 'relaxation',
    youtubeId: 'p3EJuBxEjt0'
  },
];

const categories = [
  { id: 'all', label: 'All Videos', icon: <Dumbbell size={18} />, color: '#2563EB' },
  { id: 'gait', label: 'Gait & Balance', icon: <Dumbbell size={18} />, color: '#22C55E' },
  { id: 'tremor', label: 'Tremor Control', icon: <Brain size={18} />, color: '#F59E0B' },
  { id: 'voice', label: 'Voice & Speech', icon: <Mic size={18} />, color: '#8B5CF6' },
  { id: 'relaxation', label: 'Relaxation', icon: <Moon size={18} />, color: '#EC4899' },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'gait': return '#22C55E';
    case 'tremor': return '#F59E0B';
    case 'voice': return '#8B5CF6';
    case 'relaxation': return '#EC4899';
    default: return '#2563EB';
  }
};

export function ExerciseVideos() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredVideos = selectedCategory === 'all' 
    ? exerciseVideos 
    : exerciseVideos.filter(v => v.category === selectedCategory);

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      <div className="page-header">
        <h1 className="page-title">Parkinson's Exercise Videos</h1>
        <p className="page-subtitle">Watch curated exercise videos specifically designed for Parkinson\'s patients</p>
      </div>

      {/* Category Filter */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '32px',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '24px',
              border: 'none',
              background: selectedCategory === cat.id ? cat.color : '#F1F5F9',
              color: selectedCategory === cat.id ? 'white' : '#64748B',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: 500,
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
        gap: '24px' 
      }}>
        {filteredVideos.map((video) => (
          <div 
            key={video.id}
            style={{ 
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #E2E8F0',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Video Embed */}
            <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </div>
            
            {/* Content */}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: getCategoryColor(video.category),
                  color: 'white',
                  textTransform: 'uppercase'
                }}>
                  {video.category}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '13px' }}>
                  <Clock size={14} />
                  {video.duration}
                </span>
              </div>
              <h3 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '8px', fontSize: '16px' }}>
                {video.title}
              </h3>
              <p style={{ color: '#64748B', fontSize: '13px', lineHeight: '1.5' }}>
                {video.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredVideos.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #E2E8F0'
        }}>
          <Dumbbell size={48} color="#94A3B8" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#64748B', marginBottom: '8px' }}>No videos in this category</h3>
          <p style={{ color: '#94A3B8', fontSize: '14px' }}>Check back later for more exercise videos</p>
        </div>
      )}
    </div>
  );
}

