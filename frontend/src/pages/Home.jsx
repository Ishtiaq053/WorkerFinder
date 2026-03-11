/**
 * Home Page - Redesigned Landing for WorkerFinder
 * Hero, Services, How It Works, Why Choose Us, Testimonials, CTA
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import ChatFAB from '../components/ChatFAB';

const services = [
  { icon: 'bi-wrench-adjustable', title: 'Plumbing', desc: 'Pipe fitting, repair & maintenance', path: '/services/plumbing' },
  { icon: 'bi-lightning-charge', title: 'Electrical', desc: 'Wiring, installations & fixes', path: '/services/electrical' },
  { icon: 'bi-hammer', title: 'Carpentry', desc: 'Furniture, doors & wood work', path: '/services/carpentry' },
  { icon: 'bi-paint-bucket', title: 'Painting', desc: 'Interior & exterior painting', path: '/services/painting' },
  { icon: 'bi-bricks', title: 'Construction', desc: 'Building, masonry & renovation', path: '/services/construction' },
  { icon: 'bi-car-front', title: 'Driving', desc: 'Delivery, transport & logistics', path: '/services/driving' },
  { icon: 'bi-flower1', title: 'Gardening', desc: 'Landscaping & garden care', path: '/services/gardening' },
  { icon: 'bi-gear-wide-connected', title: 'Mechanic', desc: 'Vehicle & machinery repair', path: '/services/mechanic' },
];

// Testimonials data organized in columns for scroll animation
const testimonialColumns = [
  // Column 1 - scrolls up
  [
    { name: 'Ahmed Khan', role: 'Home Owner', initials: 'AK', text: 'Found an excellent plumber within hours. The quality of work was outstanding and the price was fair.', stars: 5 },
    { name: 'Hassan Ali', role: 'Restaurant Owner', initials: 'HA', text: 'WorkerFinder helped us find reliable kitchen staff quickly. The verification process gives us peace of mind.', stars: 5 },
    { name: 'Zainab Malik', role: 'Property Manager', initials: 'ZM', text: 'Managing multiple properties is easier now. I can find electricians, plumbers, and painters all in one place.', stars: 4 },
    { name: 'Bilal Ahmed', role: 'Factory Owner', initials: 'BA', text: 'The platform connects us with skilled mechanics and technicians. Response time is incredibly fast.', stars: 5 },
  ],
  // Column 2 - scrolls down
  [
    { name: 'Fatima Ali', role: 'Electrician', initials: 'FA', text: 'As a skilled worker, this platform has been a game-changer. I get consistent job opportunities daily.', stars: 5 },
    { name: 'Omar Farooq', role: 'Carpenter', initials: 'OF', text: 'Finally a platform that values skilled labor. I have built a strong client base through WorkerFinder.', stars: 5 },
    { name: 'Ayesha Khan', role: 'Painter', initials: 'AK', text: 'The job matching is excellent. I only see relevant opportunities that match my skills and location.', stars: 4 },
    { name: 'Tariq Mahmood', role: 'Plumber', initials: 'TM', text: 'Customer reviews help build trust. My rating has helped me get more premium projects.', stars: 5 },
  ],
  // Column 3 - scrolls up
  [
    { name: 'Usman Raza', role: 'Business Owner', initials: 'UR', text: 'We use WorkerFinder for all our office maintenance needs. Always reliable and professional workers.', stars: 4 },
    { name: 'Sara Jabeen', role: 'Homemaker', initials: 'SJ', text: 'Found a trustworthy domestic helper through the platform. The background verification is reassuring.', stars: 5 },
    { name: 'Imran Shah', role: 'Contractor', initials: 'IS', text: 'Great for finding specialized workers for construction projects. Saves so much time and effort.', stars: 5 },
    { name: 'Nadia Akram', role: 'Event Planner', initials: 'NA', text: 'Perfect for last-minute staffing needs. The workers are professional and arrive on time.', stars: 4 },
  ],
];

// FAQ data
const faqs = [
  {
    question: 'How do I post a job on WorkerFinder?',
    answer: 'Simply create a free account, click on "Post a Job", fill in the details including job description, budget, and location. Your job will be visible to verified workers within minutes.'
  },
  {
    question: 'How are workers verified on the platform?',
    answer: 'All workers go through a multi-step verification process including ID verification, skill assessment, and background checks. We also collect references and maintain performance ratings.'
  },
  {
    question: 'What types of services can I find on WorkerFinder?',
    answer: 'We offer a wide range of services including plumbing, electrical work, carpentry, painting, construction, driving, gardening, mechanics, and many more skilled labor services.'
  },
  {
    question: 'Is there a fee to use WorkerFinder?',
    answer: 'Creating an account and posting jobs is completely free. We only charge a small service fee when you successfully hire a worker through our platform.'
  },
  {
    question: 'How do I pay the workers?',
    answer: 'You can pay workers directly through cash or bank transfer. We recommend using our secure payment system for added protection and dispute resolution.'
  },
  {
    question: 'What if I am not satisfied with the work?',
    answer: 'We have a satisfaction guarantee policy. If the work does not meet agreed standards, our support team will help mediate and find a resolution, including refunds when applicable.'
  },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? -1 : index);
  };

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
                <h6 className="mb-3">
                  <i className="bi bi-grid-3x3-gap me-2"></i>Popular Services
                </h6>
                <div className="icon-grid">
                  {services.slice(0, 6).map((s) => (
                    <Link to={s.path} className="icon-item" key={s.title}>
                      <i className={`bi ${s.icon}`}></i>
                      <span>{s.title}</span>
                    </Link>
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
              <Link to={s.path} className="service-card" key={`${s.title}-${idx}`}>
                <div className="service-icon">
                  <i className={`bi ${s.icon}`}></i>
                </div>
                <h6>{s.title}</h6>
                <p>{s.desc}</p>
              </Link>
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

      {/* TESTIMONIALS - Animated Scroll Columns */}
      <section className="testimonials-section">
        <div className="container">
          <div className="text-center mb-4">
            <span className="section-badge">Testimonials</span>
            <h2 className="section-heading">What People Say About Us</h2>
            <p className="section-subtext">
              Real feedback from our community of customers and workers
            </p>
          </div>
        </div>
        
        {/* Animated Testimonial Grid */}
        <div className="testimonials-scroll-container">
          {/* Gradient overlays */}
          <div className="testimonials-gradient-top"></div>
          <div className="testimonials-gradient-bottom"></div>
          
          <div className="testimonials-scroll-grid">
            {/* Column 1 - Scrolls Up */}
            <div className="testimonial-column animate-scroll-up">
              <div className="testimonial-column-inner">
                {[...testimonialColumns[0], ...testimonialColumns[0]].map((t, idx) => (
                  <div className="testimonial-scroll-card" key={`col1-${idx}`}>
                    <div className="stars">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <i className="bi bi-star-fill" key={i}></i>
                      ))}
                      {Array.from({ length: 5 - t.stars }).map((_, i) => (
                        <i className="bi bi-star" key={i}></i>
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
                ))}
              </div>
            </div>
            
            {/* Column 2 - Scrolls Down */}
            <div className="testimonial-column animate-scroll-down">
              <div className="testimonial-column-inner">
                {[...testimonialColumns[1], ...testimonialColumns[1]].map((t, idx) => (
                  <div className="testimonial-scroll-card" key={`col2-${idx}`}>
                    <div className="stars">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <i className="bi bi-star-fill" key={i}></i>
                      ))}
                      {Array.from({ length: 5 - t.stars }).map((_, i) => (
                        <i className="bi bi-star" key={i}></i>
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
                ))}
              </div>
            </div>
            
            {/* Column 3 - Scrolls Up */}
            <div className="testimonial-column animate-scroll-up d-none d-md-flex">
              <div className="testimonial-column-inner">
                {[...testimonialColumns[2], ...testimonialColumns[2]].map((t, idx) => (
                  <div className="testimonial-scroll-card" key={`col3-${idx}`}>
                    <div className="stars">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <i className="bi bi-star-fill" key={i}></i>
                      ))}
                      {Array.from({ length: 5 - t.stars }).map((_, i) => (
                        <i className="bi bi-star" key={i}></i>
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="faq-section">
        <div className="container">
          <div className="text-center mb-4">
            <span className="section-badge">FAQ</span>
            <h2 className="section-heading">Frequently Asked Questions</h2>
            <p className="section-subtext">
              Find answers to common questions about WorkerFinder
            </p>
          </div>
          
          <div className="faq-container">
            <div className="row">
              <div className="col-lg-10 mx-auto">
                <div className="faq-accordion">
                  {faqs.map((faq, index) => (
                    <div className={`faq-item ${openFaq === index ? 'active' : ''}`} key={index}>
                      <button
                        className={`faq-button ${openFaq === index ? '' : 'collapsed'}`}
                        onClick={() => toggleFaq(index)}
                        type="button"
                      >
                        <span className="faq-icon">
                          <i className="bi bi-question-circle"></i>
                        </span>
                        {faq.question}
                      </button>
                      <div className={`faq-content ${openFaq === index ? 'show' : ''}`}>
                        <div className="faq-answer">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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

      {/* Floating Chat Button - Shows after scrolling past hero section */}
      <ChatFAB showAfterScroll={true} scrollThreshold={450} />
    </div>
  );
}
