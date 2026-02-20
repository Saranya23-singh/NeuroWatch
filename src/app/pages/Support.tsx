import { useState } from 'react';
import { Phone, Mail, MessageCircle, Send, HelpCircle, Clock, FileText } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How accurate is the gait analysis?',
    answer: 'Our AI-powered gait analysis uses advanced computer vision algorithms with 95% accuracy in detecting movement patterns associated with neurodegenerative conditions. However, it should be used as a screening tool and not replace professional medical diagnosis.',
  },
  {
    question: 'How often should I upload voice recordings?',
    answer: 'We recommend recording voice samples 2-3 times per week for optimal tracking. Consistency helps our AI detect subtle changes in voice stability over time.',
  },
  {
    question: 'Can I share my health data with my doctor?',
    answer: 'Yes! You can export comprehensive health reports from the History page and share them directly with your healthcare provider during appointments.',
  },
  {
    question: 'What devices are compatible with NeuroWatch?',
    answer: 'NeuroWatch is compatible with most modern smartphones and smartwatches including Apple Watch, Samsung Galaxy Watch, and Fitbit devices.',
  },
  {
    question: 'How secure is my health data?',
    answer: 'Your health data is encrypted end-to-end and stored securely following HIPAA compliance standards. We never share your personal health information without your explicit consent.',
  },
];

export function Support() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Customer Support</h1>
        <p className="page-subtitle">We're here to help you with any questions or concerns</p>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ marginBottom: '32px', gap: '24px' }}>
        {/* Call Us */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="metric-card-icon primary">
              <Phone size={24} />
            </div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>Call Us</h3>
              <p style={{ color: '#64748B', fontSize: '14px' }}>24/7 Support</p>
            </div>
          </div>
          <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#2563EB' }}>1-800-NEURO-WATCH</p>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '8px' }}>Available 24 hours a day, 7 days a week</p>
        </div>

        {/* Email Us */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="metric-card-icon" style={{ backgroundColor: '#F0FDF4' }}>
              <Mail size={24} color="#22C55E" />
            </div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>Email Us</h3>
              <p style={{ color: '#64748B', fontSize: '14px' }}>Response within 24h</p>
            </div>
          </div>
          <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#22C55E' }}>support@neurowatch.com</p>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '8px' }}>We'll respond within 24 hours</p>
        </div>

        {/* Live Chat */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="metric-card-icon" style={{ backgroundColor: '#F5F3FF' }}>
              <MessageCircle size={24} color="#8B5CF6" />
            </div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>Live Chat</h3>
              <p style={{ color: '#64748B', fontSize: '14px' }}>Instant support</p>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            Start Chat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '24px' }}>
        {/* Contact Form */}
        <div className="card">
          <div className="chart-header" style={{ marginBottom: '24px' }}>
            <Send size={22} className="text-[#2563EB]" />
            <h2 className="chart-title">Send Us a Message</h2>
          </div>

          {submitted ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div className="metric-card-icon success" style={{ margin: '0 auto 16px' }}>
                <Send size={32} />
              </div>
              <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Message Sent!</h3>
              <p style={{ color: '#64748B' }}>We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="name" className="form-label">Name</label>
                <input
                  id="name"
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="form-input"
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="form-input"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="subject" className="form-label">Subject</label>
                <select
                  id="subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="form-input form-select"
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="technical">Technical Support</option>
                  <option value="account">Account Questions</option>
                  <option value="billing">Billing Inquiry</option>
                  <option value="feature">Feature Request</option>
                  <option value="medical">Medical Data Concerns</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="message" className="form-label">Message</label>
                <textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  rows={5}
                  className="form-input"
                  style={{ resize: 'vertical', minHeight: '100px' }}
                  placeholder="How can we help you?"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ gap: '8px' }}>
                <Send size={18} />
                Send Message
              </button>
            </form>
          )}
        </div>

        {/* FAQ Section */}
        <div className="card">
          <div className="chart-header" style={{ marginBottom: '24px' }}>
            <HelpCircle size={22} className="text-[#2563EB]" />
            <h2 className="chart-title">Frequently Asked Questions</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.map((faq, index) => (
              <div key={index} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    backgroundColor: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{faq.question}</span>
                  <HelpCircle size={20} color="#64748B" style={{ flexShrink: 0 }} />
                </button>
                {expandedFAQ === index && (
                  <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                    <p style={{ color: '#64748B' }}>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Support Hours */}
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Clock size={20} className="text-[#2563EB]" />
              <h3 style={{ fontWeight: 600 }}>Support Hours</h3>
            </div>
            <p style={{ color: '#64748B', fontSize: '14px' }}>Monday - Friday: 8:00 AM - 8:00 PM EST</p>
            <p style={{ color: '#64748B', fontSize: '14px' }}>Saturday - Sunday: 9:00 AM - 5:00 PM EST</p>
            <p style={{ color: '#22C55E', fontSize: '14px', marginTop: '8px', fontWeight: 500 }}>Emergency support available 24/7</p>
          </div>

          {/* Documentation */}
          <div style={{ marginTop: '16px' }}>
            <button className="btn btn-outline" style={{ width: '100%', gap: '8px' }}>
              <FileText size={18} />
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

