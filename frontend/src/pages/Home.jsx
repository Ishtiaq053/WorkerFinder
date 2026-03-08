/**
 * Home Page - Redesigned Landing for WorkerFinder
 * Hero, Services, How It Works, Why Choose Us, Testimonials, CTA
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import ChatFAB from '../components/ChatFAB';

const services = [
  { icon: 'bi-wrench-adjustable', title: 'Plumbing', desc: 'Pipe fitting, repair & maintenance' },
  { icon: 'bi-lightning-charge', title: 'Electrical', desc: 'Wiring, installations & fixes' },
  { icon: 'bi-hammer', title: 'Carpentry', desc: 'Furniture, doors & wood work' },
  { icon: 'bi-paint-bucket', title: 'Painting', desc: 'Interior & exterior painting' },
  { icon: 'bi-bricks', title: 'Construction', desc: 'Building, masonry & renovation' },
  { icon: 'bi-car-front', title: 'Driving', desc: 'Delivery, transport & logistics' },
  { icon: 'bi-flower1', title: 'Gardening', desc: 'Landscaping & garden care' },
  { icon: 'bi-gear-wide-connected', title: 'Mechanic', desc: 'Vehicle & machinery repair' },
];

const testimonials = [
  {
    name: 'Ahmed Khan',
    role: 'Home Owner',
    initials: 'AK',
    text: 'Found an excellent plumber within hours. The quality of work was outstanding and the price was fair. Highly recommend WorkerFinder!',
    stars: 5,
  },
  {
    name: 'Fatima Ali',
    role: 'Electrician',
    initials: 'FA',
    text: 'As a skilled worker, this platform has been a game-changer. I get consistent job opportunities and can showcase my expertise.',
    stars: 5,
  },
  {
    name: 'Usman Raza',
    role: 'Business Owner',
    initials: 'UR',
    text: 'We use WorkerFinder for all our office maintenance needs. The verification process ensures we always get reliable workers.',
    stars: 4,
  },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div>
      {/* HERO */}
      <section className="hero-section-v2">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 hero-content">
              <h1 className="animate-fade-in-up">
                Find Trusted Labour.<br />
                <span className="highlight">Get Quality Work Done.</span>
              </h1>
              <p className="hero-subtitle animate-fade-in-up animation-delay-1">
                WorkerFinder connects customers with verified skilled workers
                for every job. Post work, hire reliable labour, and get things
                done - fast and hassle-free.
              </p>
              <div className="d-flex gap-3 flex-wrap animate-fade-in-up animation-delay-2">
                {isAuthenticated ? (
                  <Link to={`/dashboard/${user.role}`} className="btn btn-secondary-wf btn-lg-wf">
                    <i className="bi bi-speedometer2 me-2"></i>Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/signup" className="btn btn-secondary-wf btn-lg-wf">
                      <i className="bi bi-person-plus me-2"></i>Get Started Free
                    </Link>
                    <Link to="/login" className="btn btn-outline-hero btn-lg-wf">
                      <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
                    </Link>
                  </>
                )}
              </div>
              <div className="hero-stats animate-fade-in-up animation-delay-3">
                <div className="hero-stat-item">
                  <h3>500+</h3>
                  <p>Verified Workers</p>
                </div>
                <div className="hero-stat-item">
                  <h3>1,200+</h3>
                  <p>Jobs Completed</p>
                </div>
                <div className="hero-stat-item">
                  <h3>4.8</h3>
                  <p>Avg. Rating</p>
                </div>
              </div>
            </div>

            <div className="col-lg-6 hero-image-side d-none d-lg-block">
              <div className="hero-image-card animate-fade-in-up animation-delay-2">
                <h6 className="mb-3" style={{ color: 'var(--primary-dark)', fontWeight: 700, letterSpacing: '0.5px' }}>
                  <i className="bi bi-grid-3x3-gap me-2"></i>Popular Services
                </h6>
                <div className="icon-grid">
                  {services.slice(0, 6).map((s) => (
                    <div className="icon-item" key={s.title}>
                      <i className={`bi ${s.icon}`}></i>
                      <span>{s.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="landing-section">
        <div className="container">
          <div className="text-center">
            <span className="section-badge">Our Services</span>
            <h2 className="section-heading">What We Offer</h2>
            <p className="section-subtext">
              Browse through our wide range of professional labour services
            </p>
          </div>
        </div>
        <div className="services-marquee-wrapper">
          <div className="services-marquee">
            {[...services, ...services].map((s, idx) => (
              <div className="service-card" key={`${s.title}-${idx}`}>
                <div className="service-icon">
                  <i className={`bi ${s.icon}`}></i>
                </div>
                <h6>{s.title}</h6>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="landing-section section-bg-warm">
        <div className="container">
          <div className="text-center">
            <span className="section-badge">Simple Process</span>
            <h2 className="section-heading">How It Works</h2>
            <p className="section-subtext">
              Three simple steps to connect with the right people
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-4 step-connector">
              <div className="step-card">
                <div className="step-number">1</div>
                <div className="step-icon"><i className="bi bi-clipboard-plus"></i></div>
                <h5>Post a Job</h5>
                <p>Describe your work requirements, set a budget, and post your job in minutes.</p>
              </div>
            </div>
            <div className="col-md-4 step-connector">
              <div className="step-card">
                <div className="step-number">2</div>
                <div className="step-icon"><i className="bi bi-people"></i></div>
                <h5>Get Applications</h5>
                <p>Verified workers apply to your job. Review profiles, skills, and experience.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="step-card">
                <div className="step-number">3</div>
                <div className="step-icon"><i className="bi bi-check2-circle"></i></div>
                <h5>Hire & Complete</h5>
                <p>Accept the best worker, track progress, and mark jobs as completed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="section-why-choose">
        <div className="container">
          <div className="text-center">
            <span className="section-badge">Our Promise</span>
            <h2 className="section-heading">Why Choose WorkerFinder</h2>
            <p className="section-subtext">
              We are committed to quality, safety, and reliability
            </p>
          </div>
          <div className="row g-3">
            {[
              { icon: 'bi-shield-check', bg: 'var(--success-bg)', color: 'var(--success)', title: 'Verified Workers', desc: 'Every worker goes through an approval process to ensure quality and safety.' },
              { icon: 'bi-lightning-charge', bg: 'var(--warning-bg)', color: 'var(--warning)', title: 'Fast Matching', desc: 'Post a job and receive applications from skilled workers within hours.' },
              { icon: 'bi-cash-stack', bg: 'var(--info-bg)', color: 'var(--info)', title: 'Fair Pricing', desc: 'Set your own budget. No hidden fees or middleman charges.' },
              { icon: 'bi-headset', bg: 'rgba(245,203,167,0.3)', color: 'var(--primary-dark)', title: '24/7 Support', desc: 'Our support team is always available to help resolve any issues.' },
            ].map((item) => (
              <div className="col-md-6 col-lg-3" key={item.title}>
                <div className="trust-card">
                  <div className="trust-icon" style={{ background: item.bg, color: item.color }}>
                    <i className={`bi ${item.icon}`}></i>
                  </div>
                  <div>
                    <h6>{item.title}</h6>
                    <p>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="landing-section section-bg-warm">
        <div className="container">
          <div className="text-center">
            <span className="section-badge">Testimonials</span>
            <h2 className="section-heading">What People Say</h2>
            <p className="section-subtext">
              Real feedback from our community of customers and workers
            </p>
          </div>
          <div className="row g-4">
            {testimonials.map((t) => (
              <div className="col-md-4" key={t.name}>
                <div className="testimonial-card">
                  <div className="stars">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <i className="bi bi-star-fill me-1" key={i}></i>
                    ))}
                    {Array.from({ length: 5 - t.stars }).map((_, i) => (
                      <i className="bi bi-star me-1" key={i}></i>
                    ))}
                  </div>
                  <p className="quote">"{t.text}"</p>
                  <div className="author">
                    <div className="author-avatar">{t.initials}</div>
                    <div className="author-info">
                      <strong>{t.name}</strong>
                      <small>{t.role}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container position-relative">
          <h2>Ready to Get Started?</h2>
          <p>
            Join thousands of customers and workers already using WorkerFinder
            to get things done.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            {!isAuthenticated ? (
              <>
                <Link to="/signup" className="btn btn-secondary-wf btn-lg-wf">
                  <i className="bi bi-person-plus me-2"></i>Create Free Account
                </Link>
                <Link to="/login" className="btn btn-outline-wf btn-lg-wf" style={{ borderColor: 'var(--primary-dark)', color: 'var(--primary-dark)' }}>
                  <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
                </Link>
              </>
            ) : (
              <Link to={`/dashboard/${user.role}`} className="btn btn-secondary-wf btn-lg-wf">
                <i className="bi bi-speedometer2 me-2"></i>Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer variant="public" />

      {/* Floating Chat Button */}
      <ChatFAB />
    </div>
  );
}
