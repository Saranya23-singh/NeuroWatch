import { useState } from 'react';
import { Save, Coffee, Salad, Apple, Utensils, Moon, TrendingUp } from 'lucide-react';

const FIREBASE_LIFESTYLE_URL =
  "https://neurowatch-b3b08-default-rtdb.firebaseio.com/lifestyle";

export function Lifestyle() {
  const [breakfast, setBreakfast] = useState('Oatmeal with berries');
  const [lunch, setLunch] = useState('Grilled chicken salad');
  const [snack, setSnack] = useState('Apple');
  const [dinner, setDinner] = useState('Salmon with vegetables');
  const [sleepHours, setSleepHours] = useState(7.5);
  const [activity, setActivity] = useState('Walking');

  const handleSave = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user?.username) {
        alert("User not found. Please login again.");
        return;
      }

      const lifestyleData = {
        breakfast,
        lunch,
        snack,
        dinner,
        sleepHours,
        activity,
        date: new Date().toISOString().split("T")[0],
      };

      await fetch(
        `${FIREBASE_LIFESTYLE_URL}/${user.username}.json`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lifestyleData),
        }
      );

      alert("Lifestyle data saved successfully!");
    } catch (error) {
      console.error("Error saving lifestyle:", error);
      alert("Failed to save lifestyle data");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Lifestyle Tracking</h1>
        <p className="page-subtitle">Log your daily meals, sleep, and activities</p>
      </div>

      {/* Meals Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="chart-header" style={{ marginBottom: '20px' }}>
          <Utensils size={22} className="text-[#2563EB]" />
          <h2 className="chart-title">Meals</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="flex items-center gap-2" style={{ marginBottom: '8px', fontWeight: 500 }}>
              <Coffee size={16} style={{ color: '#F59E0B' }} />
              Breakfast
            </label>
            <input
              type="text"
              value={breakfast}
              onChange={(e) => setBreakfast(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="flex items-center gap-2" style={{ marginBottom: '8px', fontWeight: 500 }}>
              <Salad size={16} style={{ color: '#22C55E' }} />
              Lunch
            </label>
            <input
              type="text"
              value={lunch}
              onChange={(e) => setLunch(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="flex items-center gap-2" style={{ marginBottom: '8px', fontWeight: 500 }}>
              <Apple size={16} style={{ color: '#EF4444' }} />
              Snack
            </label>
            <input
              type="text"
              value={snack}
              onChange={(e) => setSnack(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="flex items-center gap-2" style={{ marginBottom: '8px', fontWeight: 500 }}>
              <Utensils size={16} style={{ color: '#8B5CF6' }} />
              Dinner
            </label>
            <input
              type="text"
              value={dinner}
              onChange={(e) => setDinner(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Sleep Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="chart-header" style={{ marginBottom: '20px' }}>
          <Moon size={22} className="text-[#2563EB]" />
          <h2 className="chart-title">Sleep</h2>
        </div>

        <label className="block" style={{ marginBottom: '12px', fontWeight: 500 }}>
          Sleep Hours: <span style={{ fontWeight: 700, color: '#2563EB' }}>{sleepHours} hours</span>
        </label>

        <input
          type="range"
          min="0"
          max="12"
          step="0.5"
          value={sleepHours}
          onChange={(e) => setSleepHours(parseFloat(e.target.value))}
          className="form-input"
          style={{ padding: 0, height: '8px' }}
        />
        
        <div className="flex justify-between" style={{ marginTop: '8px' }}>
          <span style={{ color: '#64748B', fontSize: '12px' }}>0h</span>
          <span style={{ color: '#64748B', fontSize: '12px' }}>12h</span>
        </div>
      </div>

      {/* Activity Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="chart-header" style={{ marginBottom: '20px' }}>
          <TrendingUp size={22} className="text-[#2563EB]" />
          <h2 className="chart-title">Activity</h2>
        </div>

        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className="form-input form-select"
        >
          <option value="Walking">Walking</option>
          <option value="Running">Running</option>
          <option value="Swimming">Swimming</option>
          <option value="Cycling">Cycling</option>
          <option value="Yoga">Yoga</option>
          <option value="Gym">Gym</option>
          <option value="None">None</option>
        </select>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="btn btn-primary btn-lg"
        style={{ width: '100%', gap: '8px' }}
      >
        <Save size={20} />
        Save Lifestyle Data
      </button>
    </div>
  );
}

