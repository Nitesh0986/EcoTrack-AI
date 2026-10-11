import React from 'react';
import { Award, AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

export default function CarbonGauge({ score }) {
  // Benchmark reference: Global personal carbon budget per day is ~5.0 kg CO2e
  const maxScale = 25; // 0 to 25 kg scale
  const normalized = Math.min(Math.max(score, 0), maxScale);
  const percentage = (normalized / maxScale) * 100;

  // Arc calculation for SVG half-circle (180 degrees)
  const radius = 80;
  const circumference = Math.PI * radius; // Half-circle perimeter
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let rating = {
    title: 'Eco Champion',
    className: 'excellent',
    color: '#10b981',
    icon: <ShieldCheck size={16} />,
    description: 'Outstanding footprint! Below the sustainable 5.0 kg climate target.'
  };

  if (score >= 5 && score <= 14.9) {
    rating = {
      title: 'Moderate Impact',
      className: 'moderate',
      color: '#f59e0b',
      icon: <AlertTriangle size={16} />,
      description: 'Typical urban baseline. Key optimization opportunities exist.'
    };
  } else if (score >= 15) {
    rating = {
      title: 'High Carbon Load',
      className: 'high',
      color: '#f43f5e',
      icon: <AlertCircle size={16} />,
      description: 'Significantly exceeds sustainable benchmarks. Immediate intervention advised.'
    };
  }

  return (
    <div className="gauge-container">
      <div className="gauge-svg-wrap">
        <svg width="200" height="115" viewBox="0 0 200 115">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Active Progress Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={rating.color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease'
            }}
          />
        </svg>

        <div className="gauge-center-stat">
          <span className="gauge-score-value">{score.toFixed(1)}</span>
          <span className="gauge-score-unit">kg CO₂e / day</span>
        </div>
      </div>

      <div className={`rating-badge ${rating.className}`}>
        {rating.icon}
        <span>{rating.title}</span>
      </div>

      <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginTop: '8px', maxWidth: '300px' }}>
        {rating.description}
      </p>
    </div>
  );
}
