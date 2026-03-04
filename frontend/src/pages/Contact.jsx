/**
 * Contact Us Page
 * Professional contact form with options for general queries, bug reports, etc.
 */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import Alert from '../components/Alert';

const queryTypes = [
  { value: 'general', label: 'General Query', icon: 'bi-question-circle' },
  { value: 'bug', label: 'Bug Report', icon: 'bi-bug' },
  { value: 'feedback', label: 'Feedback', icon: 'bi-chat-heart' },
  { value: 'support', label: 'Technical Support', icon: 'bi-headset' },
  { value: 'partnership', label: 'Partnership Inquiry', icon: 'bi-people' },
];

export default function Contact() {
  const { isAuthenticated, user } = useAuth();
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
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="container">
          <div className="text-center">
            <span className="section-badge">
              Get In Touch
            </span>
            <h1>Contact Us</h1>
            <p>Have a question or feedback? We'd love to hear from you.</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="contact-content">
        <div className="container">
          <div className="row g-4">
            {/* Contact Info Cards */}
            <div className="col-lg-4">
              <div className="contact-info-wrapper">
                <div className="contact-info-card">
                  <div className="contact-icon">
                    <i className="bi bi-envelope"></i>
                  </div>
                  <h5>Email Us</h5>
                  <p>support@workerfinder.com</p>
                </div>

                <div className="contact-info-card">
                  <div className="contact-icon">
                    <i className="bi bi-telephone"></i>
                  </div>
                  <h5>Call Us</h5>
                  <p>+92 300 1234567</p>
                </div>

                <div className="contact-info-card">
                  <div className="contact-icon">
                    <i className="bi bi-geo-alt"></i>
                  </div>
                  <h5>Visit Us</h5>
                  <p>Lahore, Pakistan</p>
                </div>

                <div className="contact-info-card">
                  <div className="contact-icon">
                    <i className="bi bi-clock"></i>
                  </div>
                  <h5>Working Hours</h5>
                  <p>Mon - Sat: 9AM - 6PM</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="col-lg-8">
              <div className="contact-form-card">
                <h3>
                  <i className="bi bi-send me-2"></i>
                  Send Us a Message
                </h3>

                {alert && (
                  <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                  />
                )}

                <form onSubmit={handleSubmit}>
                  {/* Query Type Selection */}
                  <div className="query-type-selector mb-4">
                    <label className="form-label">What can we help you with?</label>
                    <div className="query-type-grid">
                      {queryTypes.map((type) => (
                        <label
                          key={type.value}
                          className={`query-type-option ${formData.queryType === type.value ? 'active' : ''}`}
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
                      <div className="input-icon-wrapper">
                        <i className="bi bi-person"></i>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Email Address</label>
                      <div className="input-icon-wrapper">
                        <i className="bi bi-envelope"></i>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Subject</label>
                      <div className="input-icon-wrapper">
                        <i className="bi bi-tag"></i>
                        <input
                          type="text"
                          className="form-control"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="Brief subject of your message"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Message</label>
                      <textarea
                        className="form-control"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows="5"
                        placeholder="Describe your query or feedback in detail..."
                        required
                      ></textarea>
                    </div>

                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn btn-primary-wf btn-lg-wf w-100"
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
      </section>

      <Footer variant="public" />
    </div>
  );
}
