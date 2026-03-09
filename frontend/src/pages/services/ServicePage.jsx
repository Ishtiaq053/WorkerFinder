/**
 * ServicePage - Reusable component for individual service pages
 * Displays service information, gallery, and approved workers
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Footer from '../../components/Footer';
import ChatFAB from '../../components/ChatFAB';
import '../../styles/service-page.css';

// Service configurations with all details
export const serviceConfigs = {
  plumbing: {
    title: 'Plumbing Services',
    subtitle: 'Expert pipe fitting, repair & maintenance solutions',
    icon: 'bi-wrench-adjustable',
    heroImage: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&q=80',
    color: '#3b82f6',
    skills: ['plumber'],
    description: 'Our certified plumbers handle everything from minor repairs to major installations. Whether you need a leaky faucet fixed, new pipes installed, or emergency plumbing services, our verified professionals are ready to help.',
    features: [
      { icon: 'bi-droplet', title: 'Leak Detection', desc: 'Advanced leak detection and repair services' },
      { icon: 'bi-house-gear', title: 'Pipe Installation', desc: 'New pipe fitting and replacement' },
      { icon: 'bi-water', title: 'Drain Cleaning', desc: 'Professional drain unclogging services' },
      { icon: 'bi-thermometer-half', title: 'Water Heater', desc: 'Installation and repair of water heaters' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', caption: 'Professional pipe installation' },
      { url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80', caption: 'Bathroom plumbing work' },
      { url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&q=80', caption: 'Kitchen sink repairs' },
      { url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80', caption: 'Water heater maintenance' },
      { url: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&q=80', caption: 'Emergency leak repairs' },
      { url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&q=80', caption: 'Commercial plumbing' },
    ],
    stats: [
      { value: '150+', label: 'Expert Plumbers' },
      { value: '2,500+', label: 'Jobs Completed' },
      { value: '4.9', label: 'Avg Rating' },
      { value: '24/7', label: 'Emergency Service' },
    ],
  },
  electrical: {
    title: 'Electrical Services',
    subtitle: 'Professional wiring, installations & electrical fixes',
    icon: 'bi-lightning-charge',
    heroImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80',
    color: '#f59e0b',
    skills: ['electrician'],
    description: 'Our licensed electricians provide safe and reliable electrical services. From simple outlet repairs to complete rewiring projects, trust our verified professionals for all your electrical needs.',
    features: [
      { icon: 'bi-plug', title: 'Wiring & Rewiring', desc: 'Complete electrical wiring solutions' },
      { icon: 'bi-lightbulb', title: 'Lighting Installation', desc: 'Indoor and outdoor lighting setup' },
      { icon: 'bi-outlet', title: 'Outlet Repairs', desc: 'Switch and outlet installation/repair' },
      { icon: 'bi-shield-check', title: 'Safety Inspection', desc: 'Electrical safety audits and compliance' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80', caption: 'Professional wiring work' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', caption: 'Panel installation' },
      { url: 'https://images.unsplash.com/photo-1565608087341-404b25492fee?w=600&q=80', caption: 'Lighting setup' },
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80', caption: 'Commercial electrical' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', caption: 'Outlet installation' },
      { url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80', caption: 'Safety inspections' },
    ],
    stats: [
      { value: '120+', label: 'Certified Electricians' },
      { value: '3,200+', label: 'Projects Done' },
      { value: '4.8', label: 'Avg Rating' },
      { value: '100%', label: 'Safety Record' },
    ],
  },
  carpentry: {
    title: 'Carpentry Services',
    subtitle: 'Quality furniture, doors & custom woodwork',
    icon: 'bi-hammer',
    heroImage: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&q=80',
    color: '#8b5cf6',
    skills: ['carpenter'],
    description: 'Our skilled carpenters bring craftsmanship and attention to detail to every project. From custom furniture to door installations, get quality woodwork that stands the test of time.',
    features: [
      { icon: 'bi-door-open', title: 'Door Installation', desc: 'Interior and exterior door fitting' },
      { icon: 'bi-box', title: 'Custom Furniture', desc: 'Bespoke furniture design and build' },
      { icon: 'bi-columns-gap', title: 'Cabinet Making', desc: 'Kitchen and wardrobe cabinets' },
      { icon: 'bi-house', title: 'Wood Flooring', desc: 'Hardwood floor installation and repair' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80', caption: 'Precision woodworking' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', caption: 'Custom cabinet making' },
      { url: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=600&q=80', caption: 'Furniture crafting' },
      { url: 'https://images.unsplash.com/photo-1597262975002-c5c3b14bbd62?w=600&q=80', caption: 'Door installation' },
      { url: 'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?w=600&q=80', caption: 'Wooden shelving' },
      { url: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&q=80', caption: 'Deck construction' },
    ],
    stats: [
      { value: '80+', label: 'Master Carpenters' },
      { value: '1,800+', label: 'Projects Completed' },
      { value: '4.9', label: 'Avg Rating' },
      { value: '15+', label: 'Years Experience' },
    ],
  },
  painting: {
    title: 'Painting Services',
    subtitle: 'Professional interior & exterior painting solutions',
    icon: 'bi-paint-bucket',
    heroImage: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=80',
    color: '#ec4899',
    skills: ['painter'],
    description: 'Transform your space with our professional painting services. Our painters deliver flawless finishes for both interior and exterior projects, using premium quality paints and materials.',
    features: [
      { icon: 'bi-house-door', title: 'Interior Painting', desc: 'Walls, ceilings, and trim painting' },
      { icon: 'bi-building', title: 'Exterior Painting', desc: 'Weather-resistant exterior finishes' },
      { icon: 'bi-palette', title: 'Color Consultation', desc: 'Expert color matching and advice' },
      { icon: 'bi-brush', title: 'Decorative Finishes', desc: 'Textures, murals, and special effects' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80', caption: 'Professional wall painting' },
      { url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80', caption: 'Interior room painting' },
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80', caption: 'Living room makeover' },
      { url: 'https://images.unsplash.com/photo-1595814433015-e6f5ce69614e?w=600&q=80', caption: 'Exterior house painting' },
      { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80', caption: 'Bedroom refresh' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', caption: 'Commercial painting' },
    ],
    stats: [
      { value: '100+', label: 'Pro Painters' },
      { value: '2,100+', label: 'Rooms Painted' },
      { value: '4.8', label: 'Avg Rating' },
      { value: '5yr', label: 'Work Guarantee' },
    ],
  },
  construction: {
    title: 'Construction Services',
    subtitle: 'Building, masonry & renovation experts',
    icon: 'bi-bricks',
    heroImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80',
    color: '#ef4444',
    skills: ['mason', 'labourer'],
    description: 'From small renovations to major construction projects, our skilled masons and construction workers deliver quality results. Trust our verified professionals for all your building needs.',
    features: [
      { icon: 'bi-bricks', title: 'Masonry Work', desc: 'Brick, stone, and concrete work' },
      { icon: 'bi-house-add', title: 'Renovations', desc: 'Home renovation and remodeling' },
      { icon: 'bi-building-add', title: 'New Construction', desc: 'Building from ground up' },
      { icon: 'bi-tools', title: 'Repairs', desc: 'Structural repairs and maintenance' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80', caption: 'Construction site work' },
      { url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&q=80', caption: 'Building construction' },
      { url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80', caption: 'Renovation project' },
      { url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80', caption: 'Masonry expertise' },
      { url: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&q=80', caption: 'Commercial construction' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', caption: 'Foundation work' },
    ],
    stats: [
      { value: '200+', label: 'Construction Workers' },
      { value: '500+', label: 'Projects Built' },
      { value: '4.7', label: 'Avg Rating' },
      { value: '10yr', label: 'Industry Experience' },
    ],
  },
  driving: {
    title: 'Driving Services',
    subtitle: 'Reliable delivery, transport & logistics solutions',
    icon: 'bi-car-front',
    heroImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80',
    color: '#06b6d4',
    skills: ['driver'],
    description: 'Our professional drivers provide reliable transportation and delivery services. Whether you need personal drivers, delivery services, or logistics support, our verified drivers are ready to serve.',
    features: [
      { icon: 'bi-truck', title: 'Delivery Services', desc: 'Package and goods delivery' },
      { icon: 'bi-person-badge', title: 'Personal Driver', desc: 'Dedicated driver services' },
      { icon: 'bi-geo-alt', title: 'Local Transport', desc: 'City-wide transportation' },
      { icon: 'bi-box-seam', title: 'Moving Services', desc: 'Relocation and moving assistance' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80', caption: 'Professional driving' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', caption: 'Delivery services' },
      { url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80', caption: 'Vehicle transport' },
      { url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&q=80', caption: 'Logistics support' },
      { url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80', caption: 'Personal driver' },
      { url: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80', caption: 'Moving services' },
    ],
    stats: [
      { value: '180+', label: 'Licensed Drivers' },
      { value: '5,000+', label: 'Deliveries Made' },
      { value: '4.9', label: 'Avg Rating' },
      { value: '24/7', label: 'Availability' },
    ],
  },
  gardening: {
    title: 'Gardening Services',
    subtitle: 'Professional landscaping & garden care',
    icon: 'bi-flower1',
    heroImage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80',
    color: '#22c55e',
    skills: ['gardener'],
    description: 'Transform your outdoor spaces with our expert gardening services. From lawn maintenance to complete landscape design, our gardeners create beautiful and sustainable gardens.',
    features: [
      { icon: 'bi-flower2', title: 'Garden Design', desc: 'Custom landscape planning' },
      { icon: 'bi-tree', title: 'Tree Services', desc: 'Planting, pruning, and removal' },
      { icon: 'bi-scissors', title: 'Lawn Care', desc: 'Mowing, trimming, and maintenance' },
      { icon: 'bi-droplet-half', title: 'Irrigation', desc: 'Sprinkler system installation' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80', caption: 'Beautiful garden design' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', caption: 'Lawn maintenance' },
      { url: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&q=80', caption: 'Flower bed creation' },
      { url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80', caption: 'Landscaping work' },
      { url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80', caption: 'Tree planting' },
      { url: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=600&q=80', caption: 'Garden makeover' },
    ],
    stats: [
      { value: '60+', label: 'Expert Gardeners' },
      { value: '800+', label: 'Gardens Designed' },
      { value: '4.8', label: 'Avg Rating' },
      { value: 'Eco', label: 'Friendly Methods' },
    ],
  },
  mechanic: {
    title: 'Mechanic Services',
    subtitle: 'Vehicle & machinery repair specialists',
    icon: 'bi-gear-wide-connected',
    heroImage: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1200&q=80',
    color: '#6366f1',
    skills: ['mechanic'],
    description: 'Keep your vehicles and machinery running smoothly with our skilled mechanics. From routine maintenance to complex repairs, trust our verified professionals for quality service.',
    features: [
      { icon: 'bi-car-front', title: 'Auto Repair', desc: 'Complete car repair services' },
      { icon: 'bi-gear', title: 'Engine Work', desc: 'Engine diagnostics and repair' },
      { icon: 'bi-speedometer2', title: 'Maintenance', desc: 'Regular service and tune-ups' },
      { icon: 'bi-tools', title: 'Machinery Repair', desc: 'Industrial equipment service' },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&q=80', caption: 'Professional mechanics' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', caption: 'Engine repair work' },
      { url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80', caption: 'Vehicle servicing' },
      { url: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=600&q=80', caption: 'Diagnostics' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', caption: 'Brake service' },
      { url: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&q=80', caption: 'Industrial machinery' },
    ],
    stats: [
      { value: '90+', label: 'Skilled Mechanics' },
      { value: '3,500+', label: 'Repairs Done' },
      { value: '4.7', label: 'Avg Rating' },
      { value: '30min', label: 'Avg Response' },
    ],
  },
};

// Mock workers data - In production, this would come from API
const getMockWorkers = (skills) => [
  {
    id: 1,
    name: 'Muhammad Ali',
    avatar: null,
    initials: 'MA',
    skills: skills,
    experience: '8 years',
    location: 'Lahore, Pakistan',
    rating: 4.9,
    completedJobs: 156,
    verified: true,
  },
  {
    id: 2,
    name: 'Hassan Raza',
    avatar: null,
    initials: 'HR',
    skills: skills,
    experience: '5 years',
    location: 'Karachi, Pakistan',
    rating: 4.8,
    completedJobs: 89,
    verified: true,
  },
  {
    id: 3,
    name: 'Usman Khan',
    avatar: null,
    initials: 'UK',
    skills: skills,
    experience: '12 years',
    location: 'Islamabad, Pakistan',
    rating: 5.0,
    completedJobs: 234,
    verified: true,
  },
  {
    id: 4,
    name: 'Ahmed Malik',
    avatar: null,
    initials: 'AM',
    skills: skills,
    experience: '6 years',
    location: 'Faisalabad, Pakistan',
    rating: 4.7,
    completedJobs: 67,
    verified: true,
  },
  {
    id: 5,
    name: 'Bilal Hussain',
    avatar: null,
    initials: 'BH',
    skills: skills,
    experience: '10 years',
    location: 'Multan, Pakistan',
    rating: 4.9,
    completedJobs: 198,
    verified: true,
  },
  {
    id: 6,
    name: 'Imran Shah',
    avatar: null,
    initials: 'IS',
    skills: skills,
    experience: '4 years',
    location: 'Peshawar, Pakistan',
    rating: 4.6,
    completedJobs: 45,
    verified: true,
  },
];

export default function ServicePage({ serviceKey }) {
  const config = serviceConfigs[serviceKey];
  const { isAuthenticated, user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    setTimeout(() => setIsVisible(true), 100);
    
    // Load mock workers for this service
    setWorkers(getMockWorkers(config.skills));
    
    // Scroll to top
    window.scrollTo(0, 0);
  }, [serviceKey]);

  if (!config) {
    return (
      <div className="service-page-not-found">
        <h2>Service not found</h2>
        <Link to="/" className="btn btn-primary-wf">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="service-page">
      {/* Hero Section */}
      <section 
        className="service-hero"
        style={{ 
          '--service-color': config.color,
          backgroundImage: `url(${config.heroImage})`
        }}
      >
        <div className="container">
          <div className={`service-hero-content ${isVisible ? 'animate-in' : ''}`}>
            <div className="service-hero-icon">
              <i className={`bi ${config.icon}`}></i>
            </div>
            <h1>{config.title}</h1>
            <p className="service-hero-subtitle">{config.subtitle}</p>
            <div className="service-hero-actions">
              {isAuthenticated ? (
                <Link to={`/dashboard/${user.role}`} className="btn btn-primary-wf btn-lg-wf">
                  <i className="bi bi-plus-circle me-2"></i>Post a Job
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary-wf btn-lg-wf">
                    <i className="bi bi-person-plus me-2"></i>Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline-light btn-lg-wf">
                    <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="service-hero-overlay"></div>
      </section>

      {/* Stats Section */}
      <section className="service-stats-section">
        <div className="container">
          <div className="service-stats-grid">
            {config.stats.map((stat, idx) => (
              <div 
                key={idx} 
                className={`service-stat-card ${isVisible ? 'animate-in' : ''}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="service-about-section">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className={`service-about-content ${isVisible ? 'animate-in' : ''}`}>
                <span className="section-badge">
                  About This Service
                </span>
                <h2>Professional {config.title}</h2>
                <p className="service-description">{config.description}</p>
                <div className="service-features-grid">
                  {config.features.map((feature, idx) => (
                    <div key={idx} className="service-feature-item">
                      <div className="service-feature-icon">
                        <i className={`bi ${feature.icon}`}></i>
                      </div>
                      <div>
                        <h6>{feature.title}</h6>
                        <p>{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className={`service-about-image ${isVisible ? 'animate-in' : ''}`}>
                <img src={config.gallery[0].url} alt={config.title} />
                <div className="service-about-badge">
                  <i className={`bi ${config.icon}`}></i>
                  <span>Verified Professionals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="service-gallery-section">
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge">
              Our Work
            </span>
            <h2 className="section-heading">Project Gallery</h2>
            <p className="section-subtext">See examples of quality work done by our verified professionals</p>
          </div>
          <div className="service-gallery-grid">
            {config.gallery.map((img, idx) => (
              <div 
                key={idx} 
                className={`service-gallery-item ${isVisible ? 'animate-in' : ''}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => setSelectedImage(img)}
              >
                <img src={img.url} alt={img.caption} loading="lazy" />
                <div className="service-gallery-overlay">
                  <i className="bi bi-zoom-in"></i>
                  <span>{img.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workers Section */}
      <section className="service-workers-section">
        <div className="container">
          <div className="text-center mb-5">
            <span className="section-badge">
              Our Professionals
            </span>
            <h2 className="section-heading">Verified {config.title.replace(' Services', '')} Experts</h2>
            <p className="section-subtext">All workers are verified and approved by our admin team</p>
          </div>
          <div className="service-workers-grid">
            {workers.map((worker, idx) => (
              <div 
                key={worker.id} 
                className={`service-worker-card ${isVisible ? 'animate-in' : ''}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="worker-card-header">
                  <div className="worker-avatar">
                    {worker.avatar ? (
                      <img src={worker.avatar} alt={worker.name} />
                    ) : (
                      <span>{worker.initials}</span>
                    )}
                  </div>
                  {worker.verified && (
                    <div className="worker-verified-badge" title="Verified Worker">
                      <i className="bi bi-patch-check-fill"></i>
                    </div>
                  )}
                </div>
                <div className="worker-card-body">
                  <h5>{worker.name}</h5>
                  <p className="worker-location">
                    <i className="bi bi-geo-alt me-1"></i>{worker.location}
                  </p>
                  <div className="worker-meta">
                    <div className="worker-rating">
                      <i className="bi bi-star-fill text-warning"></i>
                      <span>{worker.rating}</span>
                    </div>
                    <div className="worker-experience">
                      <i className="bi bi-briefcase"></i>
                      <span>{worker.experience}</span>
                    </div>
                  </div>
                  <div className="worker-stats">
                    <span><strong>{worker.completedJobs}</strong> jobs completed</span>
                  </div>
                </div>
                <div className="worker-card-footer">
                  {isAuthenticated ? (
                    <Link to={`/dashboard/${user.role}`} className="btn btn-primary-wf btn-sm w-100">
                      <i className="bi bi-chat-dots me-2"></i>Contact
                    </Link>
                  ) : (
                    <Link to="/signup" className="btn btn-outline-wf btn-sm w-100">
                      <i className="bi bi-person-plus me-2"></i>Sign Up to Hire
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-5">
            <Link to="/signup" className="btn btn-primary-wf btn-lg-wf">
              <i className="bi bi-people me-2"></i>View All {config.title.replace(' Services', '')} Workers
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="service-cta-section">
        <div className="container">
          <div className={`service-cta-content ${isVisible ? 'animate-in' : ''}`}>
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of satisfied customers who found reliable {config.title.toLowerCase().replace(' services', '')} professionals on WorkerFinder</p>
            <div className="service-cta-actions">
              {!isAuthenticated ? (
                <>
                  <Link to="/signup" className="btn btn-secondary-wf btn-lg-wf">
                    <i className="bi bi-person-plus me-2"></i>Create Free Account
                  </Link>
                  <Link to="/contact" className="btn btn-outline-light btn-lg-wf">
                    <i className="bi bi-chat-dots me-2"></i>Contact Us
                  </Link>
                </>
              ) : (
                <Link to={`/dashboard/${user.role}`} className="btn btn-secondary-wf btn-lg-wf">
                  <i className="bi bi-speedometer2 me-2"></i>Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div className="service-image-modal" onClick={() => setSelectedImage(null)}>
          <div className="service-image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedImage(null)}>
              <i className="bi bi-x-lg"></i>
            </button>
            <img src={selectedImage.url} alt={selectedImage.caption} />
            <p className="modal-caption">{selectedImage.caption}</p>
          </div>
        </div>
      )}

      <Footer variant="public" />
      <ChatFAB showAfterScroll={true} scrollThreshold={300} />
    </div>
  );
}
