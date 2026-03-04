/**
 * Sidebar Component
 * Dashboard side navigation with role-specific menu items.
 *
 * Props:
 *   items       — Array of { key, label, icon } objects
 *   activeTab   — Currently selected tab key
 *   onTabChange — Callback when a tab is clicked
 *   user        — Current user object (for header display)
 */
export default function Sidebar({ items, activeTab, onTabChange, user }) {
  return (
    <aside className="wf-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <h5>
          <i className="bi bi-speedometer2 me-2"></i>Dashboard
        </h5>
        <small>
          {user?.name} • {user?.role?.toUpperCase()}
        </small>
      </div>

      {/* Navigation Items */}
      <ul className="nav flex-column sidebar-nav">
        {items.map((item) => (
          <li className="nav-item" key={item.key}>
            <button
              className={`nav-link w-100 text-start ${
                activeTab === item.key ? 'active' : ''
              }`}
              onClick={() => onTabChange(item.key)}
            >
              <i className={`bi bi-${item.icon}`}></i>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
