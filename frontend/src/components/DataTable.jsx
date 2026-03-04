/**
 * DataTable Component
 * Reusable table with column definitions and custom renderers.
 *
 * Props:
 *   columns      — Array of { key, label, render? } objects
 *   data         — Array of row objects
 *   emptyMessage — Text shown when data is empty
 */
export default function DataTable({
  columns,
  data,
  emptyMessage = 'No data available'
}) {
  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <i className="bi bi-inbox"></i>
        <h5>{emptyMessage}</h5>
        <p className="text-muted">Data will appear here once available.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="wf-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id || idx}>
              {columns.map((col) => (
                <td key={col.key}>
                  {/* Use custom render function if provided, else show raw value */}
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
