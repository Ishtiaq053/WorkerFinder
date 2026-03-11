/**
 * ──────────────────────────────────────────────────────────────
 *  DashboardCharts Component
 *  Reusable chart components for dashboard analytics.
 *  Uses simple SVG-based charts (no external library).
 * ──────────────────────────────────────────────────────────────
 */
import './DashboardCharts.css';

/**
 * LineChart - Simple line/area chart for trends
 */
export function LineChart({
  data = [],
  height = 200,
  color = '#0d6efd',
  fill = true,
  showLabels = true,
  showDots = true,
  title = ''
}) {
  if (!data.length) return <ChartEmpty title={title} />;

  const values = data.map((d) => d.count || d.value || 0);
  const maxValue = Math.max(...values, 1);
  const width = 100;
  const chartHeight = height - 40;
  const padding = 5;

  // Calculate points
  const points = values.map((val, i) => ({
    x: padding + (i / (values.length - 1 || 1)) * (width - padding * 2),
    y: chartHeight - (val / maxValue) * (chartHeight - padding * 2) + padding
  }));

  // Create SVG path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <div className="chart-container">
      {title && <h6 className="chart-title">{title}</h6>}
      <svg viewBox={`0 0 ${width} ${height}`} className="line-chart">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + (i / 4) * (chartHeight - padding * 2)}
            x2={width - padding}
            y2={padding + (i / 4) * (chartHeight - padding * 2)}
            stroke="#eee"
            strokeWidth="0.3"
          />
        ))}

        {/* Area fill */}
        {fill && (
          <path d={areaPath} fill={`${color}20`} />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {showDots &&
          points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.5"
              fill={color}
            />
          ))}
      </svg>

      {/* X-axis labels */}
      {showLabels && (
        <div className="chart-labels">
          {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1).map((d, i) => (
            <span key={i} className="chart-label">
              {d.date?.slice(5) || d.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * BarChart - Horizontal or vertical bar chart
 */
export function BarChart({
  data = [],
  height = 200,
  color = '#0d6efd',
  horizontal = false,
  showValues = true,
  title = ''
}) {
  if (!data.length) return <ChartEmpty title={title} />;

  const maxValue = Math.max(...data.map((d) => d.count || d.value || 0), 1);

  return (
    <div className="chart-container">
      {title && <h6 className="chart-title">{title}</h6>}
      <div className={`bar-chart ${horizontal ? 'horizontal' : 'vertical'}`} style={{ height }}>
        {data.map((item, i) => {
          const value = item.count || item.value || 0;
          const percentage = (value / maxValue) * 100;

          return (
            <div key={i} className="bar-item">
              <span className="bar-label">{item.label || item.category || item.name}</span>
              <div className="bar-wrapper">
                <div
                  className="bar-fill"
                  style={{
                    [horizontal ? 'width' : 'height']: `${percentage}%`,
                    backgroundColor: item.color || color
                  }}
                />
              </div>
              {showValues && <span className="bar-value">{value}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * DonutChart - Simple donut/pie chart
 */
export function DonutChart({
  data = [],
  size = 160,
  thickness = 20,
  showLegend = true,
  title = ''
}) {
  if (!data.length) return <ChartEmpty title={title} />;

  const total = data.reduce((sum, d) => sum + (d.count || d.value || 0), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercentage = 0;

  const colors = ['#0d6efd', '#28a745', '#ffc107', '#dc3545', '#6c757d', '#17a2b8'];

  const segments = data.map((item, i) => {
    const value = item.count || item.value || 0;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const offset = circumference * (1 - cumulativePercentage / 100);
    const length = circumference * (percentage / 100);

    cumulativePercentage += percentage;

    return {
      ...item,
      color: item.color || colors[i % colors.length],
      percentage,
      offset,
      length
    };
  });

  return (
    <div className="chart-container donut-container">
      {title && <h6 className="chart-title">{title}</h6>}
      <div className="donut-wrapper">
        <svg width={size} height={size} className="donut-chart">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#eee"
            strokeWidth={thickness}
          />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${seg.length} ${circumference}`}
              strokeDashoffset={seg.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="donut-segment"
            />
          ))}
          <text
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="donut-total"
          >
            {total}
          </text>
        </svg>

        {showLegend && (
          <div className="donut-legend">
            {segments.map((seg, i) => (
              <div key={i} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: seg.color }} />
                <span className="legend-label">{seg.label || seg.category || seg.name}</span>
                <span className="legend-value">{seg.count || seg.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StatCard - Single stat display card
 */
export function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  trend = null,
  trendLabel = '',
  subtitle = ''
}) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-title">{title}</span>
        {subtitle && <small className="stat-subtitle">{subtitle}</small>}
      </div>
      {trend !== null && (
        <div className={`stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          <i className={`bi bi-arrow-${trend >= 0 ? 'up' : 'down'}`}></i>
          {Math.abs(trend)}%
          {trendLabel && <small>{trendLabel}</small>}
        </div>
      )}
    </div>
  );
}

/**
 * Empty chart placeholder
 */
function ChartEmpty({ title }) {
  return (
    <div className="chart-container">
      {title && <h6 className="chart-title">{title}</h6>}
      <div className="chart-empty">
        <i className="bi bi-bar-chart-line"></i>
        <p>No data available</p>
      </div>
    </div>
  );
}

export default { LineChart, BarChart, DonutChart, StatCard };
