import React from 'react';
import { History, Copy, Trash2, ArrowUpRight, Check } from 'lucide-react';

export default function AuditHistory({ history, onSelectAudit, onClearHistory, onCopySummary, copied }) {
  return (
    <div className="challenges-card fade-in">
      <div className="challenges-hero">
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={22} color="#06b6d4" /> Carbon Audit History
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Historical calculations persisted securely in your local environment.
          </p>
        </div>

        {history.length > 0 && (
          <div className="history-header-actions">
            <button
              type="button"
              onClick={onCopySummary}
              className="history-btn"
            >
              {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              {copied ? 'Copied Summary!' : 'Copy Summary'}
            </button>

            <button
              type="button"
              onClick={onClearHistory}
              className="history-btn"
              style={{ color: '#fb7185' }}
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
          <History size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h4 style={{ margin: 0, color: '#f8fafc' }}>No Audit Records Found</h4>
          <p style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>
            Run an emissions analysis in the Audit & Analytics tab to automatically record your carbon scores.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((record, index) => (
            <div key={index} className="history-item">
              <div className="history-meta">
                <span className="history-date">{record.date}</span>
                <span className="history-score-tag">
                  {record.score.toFixed(1)} <small style={{ fontSize: '0.8rem', color: '#94a3b8' }}>kg CO₂e</small>
                </span>
              </div>

              <div className="history-pills">
                <span className="history-pill">🚗 {record.transport} km</span>
                <span className="history-pill">⚡ {record.electricity} kWh</span>
                <span className="history-pill">🗑️ {record.waste} kg</span>
                <span className="history-pill" style={{ color: record.ai_powered ? '#67e8f9' : '#fbbf24' }}>
                  {record.ai_powered ? '⚡ Gemini AI' : '🌱 Heuristic'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSelectAudit(record)}
                className="history-btn"
                style={{ marginLeft: 'auto' }}
              >
                Inspect <ArrowUpRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
