import { useState } from 'react';
import { Search, Star, Calendar, Clock, MapPin, Video, Phone, User as UserIcon } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  reviews: number;
  availability: string;
  location: string;
  experience: string;
  consultationType: ('in-person' | 'video' | 'phone')[];
  imageColor: string;
}

const doctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Mitchell',
    specialization: 'Movement Disorders Specialist',
    rating: 4.9,
    reviews: 247,
    availability: 'Available Today',
    location: 'Boston Medical Center',
    experience: '15 years',
    consultationType: ['in-person', 'video', 'phone'],
    imageColor: '#2563EB',
  },
  {
    id: '2',
    name: 'Dr. James Chen',
    specialization: 'Neurologist (Parkinson\'s Disease)',
    rating: 4.8,
    reviews: 189,
    availability: 'Available Tomorrow',
    location: 'Stanford Neuroscience Clinic',
    experience: '12 years',
    consultationType: ['video', 'phone'],
    imageColor: '#8B5CF6',
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    specialization: 'Neurologist (Gait & Balance)',
    rating: 4.9,
    reviews: 312,
    availability: 'Next Week',
    location: 'Mayo Clinic',
    experience: '18 years',
    consultationType: ['in-person', 'video'],
    imageColor: '#22C55E',
  },
  {
    id: '4',
    name: 'Dr. Michael Thompson',
    specialization: 'Neurodegenerative Disease Specialist',
    rating: 4.7,
    reviews: 156,
    availability: 'Available Today',
    location: 'Cleveland Clinic',
    experience: '10 years',
    consultationType: ['in-person', 'video', 'phone'],
    imageColor: '#F59E0B',
  },
];

interface Appointment {
  id: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  type: 'in-person' | 'video' | 'phone';
  status: 'upcoming' | 'completed' | 'cancelled';
}

const upcomingAppointments: Appointment[] = [
  {
    id: '1',
    doctorName: 'Dr. Sarah Mitchell',
    specialization: 'Movement Disorders',
    date: 'Feb 5, 2026',
    time: '10:00 AM',
    type: 'video',
    status: 'upcoming',
  },
  {
    id: '2',
    doctorName: 'Dr. Emily Rodriguez',
    specialization: 'Gait & Balance',
    date: 'Feb 12, 2026',
    time: '2:30 PM',
    type: 'in-person',
    status: 'upcoming',
  },
];

export function Appointments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState<'in-person' | 'video' | 'phone'>('video');
  const [showBookingModal, setShowBookingModal] = useState(false);

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    alert(`Appointment booked with ${selectedDoctor?.name} on ${selectedDate} at ${selectedTime}`);
    setShowBookingModal(false);
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedTime('');
  };

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Book Appointment</h1>
        <p className="page-subtitle">Find and schedule appointments with neurologists</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '24px' }}>
        {/* Search and Doctor List */}
        <div style={{ gridColumn: 'span 2' }}>
          {/* Search Bar */}
          <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for neurologists or specializations..."
                className="form-input"
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          {/* Doctor List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="card">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Doctor Avatar */}
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: doctor.imageColor, borderRadius: '50%' }}
                  >
                    <UserIcon className="w-10 h-10 text-white" />
                  </div>

                  {/* Doctor Info */}
                  <div style={{ flex: 1 }}>
                    <div className="flex items-start justify-between" style={{ marginBottom: '8px' }}>
                      <div>
                        <h3 style={{ fontWeight: 600, marginBottom: '4px', color: '#0F172A' }}>{doctor.name}</h3>
                        <p style={{ color: '#64748B' }}>{doctor.specialization}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={16} fill="#F59E0B" color="#F59E0B" />
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{doctor.rating}</span>
                        <span style={{ color: '#64748B', fontSize: '14px' }}>({doctor.reviews})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2" style={{ marginBottom: '16px' }}>
                      <div className="flex items-center gap-2" style={{ fontSize: '14px' }}>
                        <MapPin size={16} color="#64748B" />
                        <span style={{ color: '#64748B' }}>{doctor.location}</span>
                      </div>
                      <div className="flex items-center gap-2" style={{ fontSize: '14px' }}>
                        <Clock size={16} color="#64748B" />
                        <span style={{ color: '#64748B' }}>{doctor.experience} experience</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: doctor.availability === 'Available Today' ? '#DCFCE7' : '#EFF6FF',
                            color: doctor.availability === 'Available Today' ? '#22C55E' : '#2563EB'
                          }}
                        >
                          {doctor.availability}
                        </span>
                        <div className="flex gap-1">
                          {doctor.consultationType.includes('video') && (
                            <Video size={16} color="#64748B" />
                          )}
                          {doctor.consultationType.includes('phone') && (
                            <Phone size={16} color="#64748B" />
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleBookAppointment(doctor)}
                        className="btn btn-primary"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Appointments Sidebar */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '24px' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '16px', color: '#0F172A' }}>Upcoming Appointments</h2>
            
            {upcomingAppointments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} style={{ padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '4px', color: '#0F172A' }}>{appointment.doctorName}</h3>
                    <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '12px' }}>{appointment.specialization}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="flex items-center gap-2" style={{ fontSize: '14px' }}>
                        <Calendar size={16} color="#64748B" />
                        <span style={{ color: '#64748B' }}>{appointment.date}</span>
                      </div>
                      <div className="flex items-center gap-2" style={{ fontSize: '14px' }}>
                        <Clock size={16} color="#64748B" />
                        <span style={{ color: '#64748B' }}>{appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-2" style={{ fontSize: '14px' }}>
                        {appointment.type === 'video' ? (
                          <Video size={16} color="#2563EB" />
                        ) : appointment.type === 'phone' ? (
                          <Phone size={16} color="#2563EB" />
                        ) : (
                          <MapPin size={16} color="#2563EB" />
                        )}
                        <span style={{ color: '#2563EB', textTransform: 'capitalize' }}>{appointment.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748B', textAlign: 'center', padding: '32px 0' }}>No upcoming appointments</p>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px'
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '480px', width: '100%', padding: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px', color: '#0F172A' }}>Book Appointment</h2>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '4px', color: '#0F172A' }}>{selectedDoctor.name}</h3>
              <p style={{ color: '#64748B' }}>{selectedDoctor.specialization}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Consultation Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#0F172A' }}>Consultation Type</label>
                <div className="flex gap-2">
                  {selectedDoctor.consultationType.includes('video') && (
                    <button
                      onClick={() => setConsultationType('video')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `1px solid ${consultationType === 'video' ? '#2563EB' : '#E2E8F0'}`,
                        backgroundColor: consultationType === 'video' ? '#2563EB' : 'white',
                        color: consultationType === 'video' ? 'white' : '#64748B',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Video size={16} />
                      Video
                    </button>
                  )}
                  {selectedDoctor.consultationType.includes('phone') && (
                    <button
                      onClick={() => setConsultationType('phone')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `1px solid ${consultationType === 'phone' ? '#2563EB' : '#E2E8F0'}`,
                        backgroundColor: consultationType === 'phone' ? '#2563EB' : 'white',
                        color: consultationType === 'phone' ? 'white' : '#64748B',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Phone size={16} />
                      Phone
                    </button>
                  )}
                  {selectedDoctor.consultationType.includes('in-person') && (
                    <button
                      onClick={() => setConsultationType('in-person')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `1px solid ${consultationType === 'in-person' ? '#2563EB' : '#E2E8F0'}`,
                        backgroundColor: consultationType === 'in-person' ? '#2563EB' : 'white',
                        color: consultationType === 'in-person' ? 'white' : '#64748B',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <MapPin size={16} />
                      In-Person
                    </button>
                  )}
                </div>
              </div>

              {/* Date Selection */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="date" className="form-label">Select Date</label>
                <input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                  required
                />
              </div>

              {/* Time Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#0F172A' }}>Select Time</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxHeight: '192px', overflowY: 'auto' }}>
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${selectedTime === time ? '#2563EB' : '#E2E8F0'}`,
                        backgroundColor: selectedTime === time ? '#2563EB' : 'white',
                        color: selectedTime === time ? 'white' : '#64748B',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3" style={{ marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedDoctor(null);
                }}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={!selectedDate || !selectedTime}
                className="btn btn-primary"
                style={{ flex: 1, opacity: (!selectedDate || !selectedTime) ? 0.5 : 1, cursor: (!selectedDate || !selectedTime) ? 'not-allowed' : 'pointer' }}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

