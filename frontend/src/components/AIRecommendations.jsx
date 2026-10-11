import React, { useState } from 'react';
import { Sparkles, Check, CheckCircle2, Cpu, Info, Zap } from 'lucide-react';

export default function AIRecommendations({ recommendations, isAiPowered, notice }) {
  const [committedIndices, setCommittedIndices] = useState({});

  const toggleCommit = (index) => {
    setCommittedIndices((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getImpactData = (index) => {
    if (index === 0) return { label: 'High Impact', className: 'impact-high' };
    if (index === 1) return { label: 'Quick Win', className: 'impact-quick' };
    return { label: 'Medium Impact', className: 'impact-medium' };
  };

  return (
    <div className="interventions-section">
      <h3 className="interventions-heading">
        <Sparkles size={18} color="#34d399" />
        Decarbonization Interventions
      </h3>

      {/* Model Intelligence Source Banner */}
      <div className="source-banner">
        {isAiPowered ? (
          <span className="source-ai">
            <Cpu size={14} /> Powered by Google Gemini 1.5 Flash (Live Generative AI)
          </span>
        ) : (
          <span className="source-demo">
            <Zap size={14} /> Deterministic Environmental Baseline Engine
          </span>
        )}
        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
          {committedIndices ? Object.values(committedIndices).filter(Boolean).length : 0} of {recommendations.length} Committed
        </span>
      </div>

      {notice && (
        <div style={{
          marginTop: '10px',
          padding: '10px 14px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          color: '#93c5fd',
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>{notice}</span>
        </div>
      )}

      <div className="interventions-list" style={{ marginTop: '14px' }}>
        {recommendations.map((tip, idx) => {
          const impact = getImpactData(idx);
          const isCommitted = !!committedIndices[idx];

          return (
            <div
              key={idx}
              className={`intervention-card ${isCommitted ? 'committed' : ''}`}
            >
              <div className="intervention-top">
                <span className={`impact-pill ${impact.className}`}>
                  {impact.label}
                </span>

                <button
                  type="button"
                  onClick={() => toggleCommit(idx)}
                  className={`commit-toggle ${isCommitted ? 'active' : ''}`}
                >
                  {isCommitted ? (
                    <>
                      <Check size={13} strokeWidth={3} /> Committed
                    </>
                  ) : (
                    '+ Commit to Action'
                  )}
                </button>
              </div>

              <div className="intervention-body">
                {tip}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
