/**
 * Contact Panel Component
 * Embedded contact form for dashboards
 */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Alert from './Alert';

const queryTypes = [
  { value: 'general', label: 'General Query', icon: 'bi-question-circle' },
  { value: 'bug', label: 'Bug Report', icon: 'bi-bug' },
  { value: 'feedback', label: 'Feedback', icon: 'bi-chat-heart' },
  { value: 'support', label: 'Technical Support', icon: 'bi-headset' },
];

export default function ContactPanel() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    queryType: 'general',
    subject: '',
    message: '',
  });
  const [alert, setAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setAlert({
        type: 'success',
        message: 'Thank you for your message! We will get back to you within 24-48 hours.',
      });
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        queryType: 'general',
        subject: '',
        message: '',
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="contact-panel">
      <div className="row g-4">
        {/* Quick Contact Info */}
        <div className="col-lg-4">
          <div className="contact-panel-info">
            <h5 className="mb-4">
              <i className="bi bi-info-circle me-2"></i>
              Contact Information
            </h5>
            
            <div className="info-item">
              <i className="bi bi-envelope"></i>
              <div>
                <small>Email</small>
                <p>support@workerfinder.com</p>
              </div>
            </div>

            <div className="info-item">
              <i className="bi bi-telephone"></i>
              <div>
                <small>Phone</small>
                <p>+92 300 1234567</p>
              </div>
            </div>

            <div className="info-item">
              <i className="bi bi-clock"></i>
              <div>
                <small>Working Hours</small>
                <p>Mon - Sat: 9AM - 6PM</p>
              </div>
            </div>

            <div className="info-item">
              <i className="bi bi-geo-alt"></i>
              <div>
                <small>Location</small>
                <p>Lahore, Pakistan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="col-lg-8">
          <div className="wf-card">
            <div className="card-body p-4">
              <h5 className="mb-4">
                <i className="bi bi-send me-2"></i>
                Send Us a Message
              </h5>

              {alert && (
                <Alert
                  type={alert.type}
                  message={alert.message}
                  onClose={() => setAlert(null)}
                />
              )}

              <form onSubmit={handleSubmit}>
                {/* Query Type Selection */}
                <div className="mb-4">
                  <label className="form-label">What can we help you with?</label>
                  <div className="query-type-grid-sm">
                    {queryTypes.map((type) => (
                      <label
                        key={type.value}
                        className={`query-type-option-sm ${formData.queryType === type.value ? 'active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="queryType"
                          value={type.value}
                          checked={formData.queryType === type.value}
                          onChange={handleChange}
                        />
                        <i className={`bi ${type.icon}`}></i>
                        <span>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Your Name</label>
                    <input
                      type="text"
                      className="form-control wf-form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control wf-form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      className="form-control wf-form-control"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Brief subject of your message"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-control wf-form-control"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Describe your query or feedback in detail..."
                      required
                    ></textarea>
                  </div>

                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn btn-primary-wf"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
