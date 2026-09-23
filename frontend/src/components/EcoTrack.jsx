import React, { useState } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function EcoTrack() {
  const [formData, setFormData] = useState({
    transport_km: '',
    electricity_kwh: '',
    waste_kg: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : Math.max(0, parseFloat(value) || 0)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      transport_km: parseFloat(formData.transport_km) || 0,
      electricity_kwh: parseFloat(formData.electricity_kwh) || 0,
      waste_kg: parseFloat(formData.waste_kg) || 0
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-emissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Network anomaly encountered during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>EcoTrack-AI</h1>
        <p style={styles.subtitle}>Production-Grade Decoupled Carbon Intelligence Platform</p>
      </header>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.fieldGroup}>
          <label htmlFor="transport_km" style={styles.label}>
            Daily Transport Distance (km)
          </label>
          <input
            id="transport_km"
            type="number"
            step="0.1"
            min="0"
            name="transport_km"
            value={formData.transport_km}
            onChange={handleInputChange}
            placeholder="e.g. 24.5"
            required
            style={styles.input}
          />
        </div>

        <div style={styles.fieldGroup}>
          <label htmlFor="electricity_kwh" style={styles.label}>
            Electricity Consumption (kWh)
          </label>
          <input
            id="electricity_kwh"
            type="number"
            step="0.1"
            min="0"
            name="electricity_kwh"
            value={formData.electricity_kwh}
            onChange={handleInputChange}
            placeholder="e.g. 12.0"
            required
            style={styles.input}
          />
        </div>

        <div style={styles.fieldGroup}>
          <label htmlFor="waste_kg" style={styles.label}>
            Solid Waste Generated (kg)
          </label>
          <input
            id="waste_kg"
            type="number"
            step="0.1"
            min="0"
            name="waste_kg"
            value={formData.waste_kg}
            onChange={handleInputChange}
            placeholder="e.g. 1.8"
            required
            style={styles.input}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {})
          }}
        >
          {loading ? 'Synthesizing Emissions Profile...' : 'Analyze Carbon Emissions'}
        </button>
      </form>

      {error && (
        <div style={styles.errorBox}>
          <strong>System Error:</strong> {error}
        </div>
      )}

      {result && (
        <section style={styles.resultContainer}>
          <div style={styles.scoreBadge}>
            <span style={styles.scoreLabel}>Computed Carbon Footprint</span>
            <span style={styles.scoreValue}>{result.carbon_score_kg} <small>kg CO₂e</small></span>
          </div>

          <h3 style={styles.recHeading}>Targeted Decarbonization Interventions</h3>
          <ul style={styles.recList}>
            {result.recommendations.map((tip, index) => (
              <li key={index} style={styles.recItem}>
                <span style={styles.recIndex}>0{index + 1}</span>
                <span style={styles.recContent}>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '680px',
    margin: '40px auto',
    padding: '32px',
    backgroundColor: '#0f172a',
    borderRadius: '16px',
    color: '#f8fafc',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: '-0.025em',
    margin: 0
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    marginTop: '6px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#cbd5e1'
  },
  input: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#f8fafc',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    width: '100%'
  },
  button: {
    marginTop: '8px',
    padding: '14px',
    backgroundColor: '#10b981',
    color: '#042f2e',
    fontWeight: '700',
    fontSize: '1rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    width: '100%'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  errorBox: {
    marginTop: '20px',
    padding: '14px 18px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '0.9rem'
  },
  resultContainer: {
    marginTop: '32px',
    borderTop: '1px solid #334155',
    paddingTop: '24px'
  },
  scoreBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155'
  },
  scoreLabel: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#94a3b8'
  },
  scoreValue: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#34d399',
    marginTop: '4px'
  },
  recHeading: {
    fontSize: '1.1rem',
    fontWeight: '700',
    marginTop: '28px',
    marginBottom: '16px',
    color: '#e2e8f0'
  },
  recList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  recItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    backgroundColor: '#1e293b',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #334155'
  },
  recIndex: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#10b981',
    marginTop: '2px'
  },
  recContent: {
    fontSize: '0.925rem',
    lineHeight: '1.5',
    color: '#cbd5e1'
  }
};
