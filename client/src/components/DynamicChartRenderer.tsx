import React, { useState } from 'react';

export interface ChartPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  category?: string;
}

interface DynamicChartRendererProps {
  data: ChartPoint[];
  title?: string;
  subtitle?: string;
  defaultChartType?: 'bar' | 'pie' | 'line' | 'table' | 'kpi';
  height?: number;
  formatValue?: (val: number) => string;
}

export const DynamicChartRenderer: React.FC<DynamicChartRendererProps> = ({
  data = [],
  title = 'Data Visualization',
  subtitle = 'Interactive Metric Analysis',
  defaultChartType = 'bar',
  height = 260,
  formatValue = (v) => (v > 1000 ? `$${v.toLocaleString()}` : String(v))
}) => {
  const initialType = defaultChartType === 'kpi' ? 'bar' : defaultChartType;
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line' | 'table'>(initialType);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        No chart visualization data available.
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value)) || 1;

  // Donut Arc calculation helper
  const renderDonutChart = () => {
    const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0) || 1;
    let accumulatedAngle = 0;
    const colors = ['#0170B9', '#fcb615', '#10b981', '#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'];

    const arcs = data.map((item, idx) => {
      const percentage = (Math.max(0, item.value) / total);
      const angle = percentage * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;

      const x1 = 100 + 70 * Math.cos((Math.PI * (startAngle - 90)) / 180);
      const y1 = 100 + 70 * Math.sin((Math.PI * (startAngle - 90)) / 180);
      const x2 = 100 + 70 * Math.cos((Math.PI * (startAngle + angle - 90)) / 180);
      const y2 = 100 + 70 * Math.sin((Math.PI * (startAngle + angle - 90)) / 180);

      const largeArc = angle > 180 ? 1 : 0;
      const color = colors[idx % colors.length];

      return {
        path: `M ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2}`,
        color,
        item,
        pct: Math.round(percentage * 100)
      };
    });

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', minHeight: `${height}px` }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          {arcs.map((arc, idx) => (
            <path
              key={idx}
              d={arc.path}
              fill="none"
              stroke={arc.color}
              strokeWidth="28"
              style={{
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                opacity: hoveredIdx === null || hoveredIdx === idx ? 1 : 0.4
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '280px' }}>
          {data.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                padding: '4px 8px',
                borderRadius: '6px',
                background: hoveredIdx === idx ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                cursor: 'pointer'
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors[idx % colors.length] }}></span>
                <span>{item.label}</span>
              </div>
              <strong style={{ color: 'var(--accent-indigo)' }}>{formatValue(item.value)}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Line Chart Helper
  const renderLineChart = () => {
    const pointsCount = data.length;
    const padding = 40;
    const width = 600;
    const chartHeight = height - 40;

    const coords = data.map((item, idx) => {
      const x = padding + (idx / Math.max(1, pointsCount - 1)) * (width - padding * 2);
      const y = chartHeight - (item.value / maxValue) * (chartHeight - padding) + 20;
      return { x, y, item, idx };
    });

    const polylinePoints = coords.map(c => `${c.x},${c.y}`).join(' ');

    return (
      <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <polygon
            points={`${coords[0].x},${height - 20} ${polylinePoints} ${coords[coords.length - 1].x},${height - 20}`}
            fill="url(#lineGrad)"
          />

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, i) => (
            <line
              key={i}
              x1={padding}
              y1={20 + (chartHeight - padding) * pct}
              x2={width - padding}
              y2={20 + (chartHeight - padding) * pct}
              stroke="var(--border-color)"
              strokeDasharray="4 4"
            />
          ))}

          {/* Connected Line */}
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            points={polylinePoints}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {coords.map((pt) => (
            <g key={pt.idx} onMouseEnter={() => setHoveredIdx(pt.idx)} onMouseLeave={() => setHoveredIdx(null)} style={{ cursor: 'pointer' }}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === pt.idx ? 7 : 5}
                fill={hoveredIdx === pt.idx ? '#fcb615' : '#6366f1'}
                stroke="#ffffff"
                strokeWidth="2"
                style={{ transition: 'all 0.2s ease' }}
              />
              <text
                x={pt.x}
                y={pt.y - 12}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="var(--text-primary)"
              >
                {formatValue(pt.item.value)}
              </text>
              <text
                x={pt.x}
                y={height - 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="var(--text-muted)"
              >
                {pt.item.label.length > 12 ? pt.item.label.slice(0, 10) + '..' : pt.item.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Bar Chart Helper
  const renderBarChart = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: `${height}px`, justifyContent: 'center' }}>
      {data.map((pt, idx) => {
        const pct = Math.max(8, Math.round((pt.value / maxValue) * 100));
        const isHovered = hoveredIdx === idx;
        return (
          <div
            key={idx}
            style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              <span>{pt.label}</span>
              <span style={{ color: 'var(--accent-indigo)', fontWeight: 700 }}>
                {formatValue(pt.value)}
              </span>
            </div>
            <div style={{ width: '100%', background: 'rgba(0, 0, 0, 0.06)', borderRadius: '8px', height: '14px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: isHovered
                    ? 'linear-gradient(90deg, #fcb615 0%, #06b6d4 100%)'
                    : 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
                  borderRadius: '8px',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  // Table Helper
  const renderTable = () => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'rgba(99, 102, 241, 0.08)', borderBottom: '1px solid var(--border-color)' }}>
            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>Metric Item</th>
            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>Category</th>
            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>Calculated Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((pt, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{pt.label}</td>
              <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{pt.category || 'General'}</td>
              <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--accent-indigo)', textAlign: 'right' }}>{formatValue(pt.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="panel-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Mode Switcher Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {title}
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
            {subtitle}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: chartType === 'bar' ? '#6366f1' : 'transparent',
              color: chartType === 'bar' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            📊 Bar
          </button>
          <button
            type="button"
            onClick={() => setChartType('pie')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: chartType === 'pie' ? '#6366f1' : 'transparent',
              color: chartType === 'pie' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            🍩 Donut
          </button>
          <button
            type="button"
            onClick={() => setChartType('line')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: chartType === 'line' ? '#6366f1' : 'transparent',
              color: chartType === 'line' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            📈 Line
          </button>
          <button
            type="button"
            onClick={() => setChartType('table')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: chartType === 'table' ? '#6366f1' : 'transparent',
              color: chartType === 'table' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            📋 Table
          </button>
        </div>
      </div>

      {/* Dynamic View Body */}
      {chartType === 'bar' && renderBarChart()}
      {chartType === 'pie' && renderDonutChart()}
      {chartType === 'line' && renderLineChart()}
      {chartType === 'table' && renderTable()}
    </div>
  );
};
