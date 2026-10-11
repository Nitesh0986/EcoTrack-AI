import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Award, Flame, RotateCcw } from 'lucide-react';

const INITIAL_CHALLENGES = [
  { id: 1, title: 'Carry a reusable water bottle & mug all day', co2: '-0.2 kg CO₂e', done: false },
  { id: 2, title: 'Opt for cycling, walking, or public transit for 1 commute', co2: '-2.4 kg CO₂e', done: false },
  { id: 3, title: 'Unplug idle electronics / power strips overnight', co2: '-0.5 kg CO₂e', done: false },
  { id: 4, title: 'Enjoy a 100% plant-based lunch or dinner', co2: '-1.8 kg CO₂e', done: false },
  { id: 5, title: 'Air-dry laundry or wash in cold water', co2: '-1.1 kg CO₂e', done: false }
];

export default function EcoChallenges() {
  const [challenges, setChallenges] = useState(() => {
    try {
      const saved = localStorage.getItem('ecotrack_challenges');
      return saved ? JSON.parse(saved) : INITIAL_CHALLENGES;
    } catch {
      return INITIAL_CHALLENGES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ecotrack_challenges', JSON.stringify(challenges));
    } catch (e) {
      console.warn('Failed saving challenges to localStorage', e);
    }
  }, [challenges]);

  const toggleChallenge = (id) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    );
  };

  const resetChallenges = () => {
    setChallenges(INITIAL_CHALLENGES);
  };

  const completedCount = challenges.filter((c) => c.done).length;
  const progressPercent = Math.round((completedCount / challenges.length) * 100);

  return (
    <div className="challenges-card fade-in">
      <div className="challenges-hero">
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target size={22} color="#10b981" /> Daily Decarbonization Challenges
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Micro-habits proven to systematically slash personal emissions over time.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
              {completedCount} / {challenges.length}
            </span>
            <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Completed Today</div>
          </div>

          <button
            type="button"
            onClick={resetChallenges}
            className="history-btn"
            title="Reset daily checklist"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: '#94a3b8', marginBottom: '8px' }}>
          <span>Daily Progress</span>
          <span style={{ fontWeight: 700, color: progressPercent === 100 ? '#34d399' : '#f8fafc' }}>
            {progressPercent}% {progressPercent === 100 ? '🎉 All Goals Achieved!' : ''}
          </span>
        </div>
        <div style={{ height: '10px', background: '#1e293b', borderRadius: '9999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #10b981, #06b6d4)',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Challenge Rows */}
      <div className="challenge-list">
        {challenges.map((c) => (
          <div
            key={c.id}
            onClick={() => toggleChallenge(c.id)}
            className={`challenge-row ${c.done ? 'done' : ''}`}
          >
            <div className="challenge-left">
              <div className="challenge-check-icon">
                {c.done && <CheckCircle2 size={16} color="#022c22" strokeWidth={3} />}
              </div>
              <span className="challenge-title">{c.title}</span>
            </div>
            <span className="challenge-co2-save">{c.co2}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
