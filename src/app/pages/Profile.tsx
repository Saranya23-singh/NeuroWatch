import { useState, useEffect } from "react";
import { User, Mail, Calendar, Heart } from "lucide-react";

export function Profile() {
  const [profile, setProfile] = useState({
    fullName: "",
    age: "",
    gender: ""
  });

  // Load saved profile on page load
  useEffect(() => {
    const savedProfile = localStorage.getItem("neuro_profile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const updatedProfile = {
      ...profile,
      [e.target.name]: e.target.value
    };

    setProfile(updatedProfile);

    // Save instantly to localStorage
    localStorage.setItem("neuro_profile", JSON.stringify(updatedProfile));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your personal information</p>
      </div>

      <div className="card" style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">
              <User size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={profile.fullName}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="age" className="form-label">
              <Calendar size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Age
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={profile.age}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your age"
              min="1"
              max="150"
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender" className="form-label">
              <Heart size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={profile.gender}
              onChange={handleChange}
              className="form-input form-select"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

        </div>

        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '8px' }}>
          <p style={{ color: '#2563EB', fontSize: '14px' }}>
            Your profile information is saved automatically as you type.
          </p>
        </div>
      </div>
    </div>
  );
}

