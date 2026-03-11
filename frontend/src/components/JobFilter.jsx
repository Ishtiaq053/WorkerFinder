/**
 * ──────────────────────────────────────────────────────────────
 *  JobFilter Component
 *  Advanced filtering and search for job listings.
 * ──────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import './JobFilter.css';

const CATEGORIES = [
  'All Categories',
  'Construction',
  'Electrical',
  'Plumbing',
  'Carpentry',
  'Painting',
  'Cleaning',
  'Moving',
  'Landscaping',
  'General Labor',
  'Other'
];

const BUDGET_RANGES = [
  { label: 'Any Budget', min: 0, max: Infinity },
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $250', min: 100, max: 250 },
  { label: '$250 - $500', min: 250, max: 500 },
  { label: '$500+', min: 500, max: Infinity }
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'budget-high', label: 'Budget: High to Low' },
  { value: 'budget-low', label: 'Budget: Low to High' },
  { value: 'title-asc', label: 'Title: A-Z' },
  { value: 'title-desc', label: 'Title: Z-A' }
];

export default function JobFilter({
  jobs = [],
  onFilter = () => {},
  showResultCount = true,
  compact = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedBudget, setSelectedBudget] = useState(0);
  const [selectedSort, setSelectedSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(!compact);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategory, selectedBudget, selectedSort, jobs]);

  const applyFilters = () => {
    let filtered = [...jobs];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(term) ||
          job.description?.toLowerCase().includes(term) ||
          job.location?.toLowerCase().includes(term) ||
          job.category?.toLowerCase().includes(term) ||
          job.skills?.some((skill) => skill.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(
        (job) => job.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Budget filter
    const budgetRange = BUDGET_RANGES[selectedBudget];
    if (budgetRange.max !== Infinity || budgetRange.min > 0) {
      filtered = filtered.filter((job) => {
        const budget = job.budget || 0;
        return budget >= budgetRange.min && budget <= budgetRange.max;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'budget-high':
          return (b.budget || 0) - (a.budget || 0);
        case 'budget-low':
          return (a.budget || 0) - (b.budget || 0);
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        default:
          return 0;
      }
    });

    onFilter(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setSelectedBudget(0);
    setSelectedSort('newest');
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCategory !== 'All Categories' ||
    selectedBudget !== 0 ||
    selectedSort !== 'newest';

  return (
    <div className={`job-filter ${compact ? 'compact' : ''}`}>
      {/* Search Bar */}
      <div className="filter-search">
        <div className="search-input-wrapper">
          <i className="bi bi-search"></i>
          <input
            type="text"
            className="form-control"
            placeholder="Search jobs by title, description, location, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="search-clear"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
        {compact && (
          <button
            className="btn btn-outline-secondary filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className={`bi bi-funnel${showFilters ? '-fill' : ''}`}></i>
            <span className="d-none d-sm-inline ms-1">Filters</span>
            {hasActiveFilters && <span className="filter-badge"></span>}
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="filter-options">
          {/* Category Filter */}
          <div className="filter-group">
            <label className="filter-label">
              <i className="bi bi-tag me-1"></i>Category
            </label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Filter */}
          <div className="filter-group">
            <label className="filter-label">
              <i className="bi bi-cash me-1"></i>Budget
            </label>
            <select
              className="form-select"
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(parseInt(e.target.value))}
            >
              {BUDGET_RANGES.map((range, i) => (
                <option key={i} value={i}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label className="filter-label">
              <i className="bi bi-sort-down me-1"></i>Sort By
            </label>
            <select
              className="form-select"
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              className="btn btn-outline-danger clear-filters"
              onClick={clearFilters}
            >
              <i className="bi bi-x-circle me-1"></i>
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Result Count */}
      {showResultCount && (
        <div className="filter-results">
          <span className="results-count">
            Showing <strong>{jobs.length}</strong> {jobs.length === 1 ? 'job' : 'jobs'}
          </span>
          {hasActiveFilters && (
            <span className="filter-active-badge">
              <i className="bi bi-funnel-fill me-1"></i>
              Filters active
            </span>
          )}
        </div>
      )}
    </div>
  );
}
