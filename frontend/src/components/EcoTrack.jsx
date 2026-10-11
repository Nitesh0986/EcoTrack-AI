import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Activity,
  Zap,
  Trash2,
  Car,
  TrendingDown,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  History,
  Target
} from 'lucide-react';
import CarbonGauge from './CarbonGauge';
import EmissionsBreakdown from './EmissionsBreakdown';
import AIRecommendations from './AIRecommendations';
import EcoChallenges from './EcoChallenges';
import AuditHistory from './AuditHistory';
import '../ecotrack.css';

const API_BASE_URL = 'http://127.0.0.1:8000';

const EMISSION_FACTORS = {
  transport: 0.21,
  electricity: 0.42,
  waste: 0.58
};

const PRESETS = [
  {
    name: '🌱 Eco Minimalist',
    data: { transport_km: 3, electricity_kwh: 5, waste_kg: 0.6 }
  },
  {
    name: '🏙️ Urban Commuter',
    data: { transport_km: 18, electricity_kwh: 12, waste_kg: 1.5 }
  },
  {
    name: '🚗 High Footprint',
    data: { transport_km: 55, electricity_kwh: 32, waste_kg: 3.8 }
  }
];

export default function EcoTrack() {
  const [formData, setFormData] = useState({
    transport_km: 15,
    electricity_kwh: 12,
    waste_kg: 1.5
  });

  const [activeTab, setActiveTab] = useState('calculator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ecotrack_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check API health status on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
        if (res.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch {
        setApiStatus('offline');
      }
    };
    checkHealth();
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ecotrack_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to persist history', e);
    }
  }, [history]);

  // Compute live estimated values from current inputs
  const liveTransportScore = (Number(formData.transport_km) || 0) * EMISSION_FACTORS.transport;
  const liveElectricityScore = (Number(formData.electricity_kwh) || 0) * EMISSION_FACTORS.electricity;
  const liveWasteScore = (Number(formData.waste_kg) || 0) * EMISSION_FACTORS.waste;
  const currentTotal = Number((liveTransportScore + liveElectricityScore + liveWasteScore).toFixed(2));

  // Determine dominant emission sector
  const categoryContributions = [
    { name: 'Transport', val: liveTransportScore },
    { name: 'Electricity', val: liveElectricityScore },
    { name: 'Waste', val: liveWasteScore }
  ].sort((a, b) => b.val - a.val);

  const topCategory = categoryContributions[0].name;

  const handleInputChange = (name, value) => {
    const num = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
    setFormData((prev) => ({
      ...prev,
      [name]: num
    }));
  };

  const applyPreset = (preset) => {
    setFormData(preset.data);
    showToast(`Applied preset: ${preset.name}`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

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
        throw new Error(errorData.detail || `Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setApiStatus('online');

      // Record to history
      const newRecord = {
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        score: data.carbon_score_kg,
        transport: payload.transport_km,
        electricity: payload.electricity_kwh,
        waste: payload.waste_kg,
        ai_powered: data.ai_powered
      };

      setHistory((prev) => [newRecord, ...prev.slice(0, 19)]);
      showToast('Emissions profile generated successfully!');
    } catch (err) {
      setError(err.message || 'Unable to connect to carbon intelligence backend.');
      setApiStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    const summary = `EcoTrack-AI Carbon Audit Summary:
Daily Footprint: ${result ? result.carbon_score_kg : currentTotal} kg CO2e
Annual Projection: ${(((result ? result.carbon_score_kg : currentTotal) * 365) / 1000).toFixed(2)} metric tons/year
Inputs: Transport: ${formData.transport_km} km | Electricity: ${formData.electricity_kwh} kWh | Waste: ${formData.waste_kg} kg
Audited via EcoTrack-AI Platform`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    showToast('Executive summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSelectAudit = (record) => {
    setFormData({
      transport_km: record.transport,
      electricity_kwh: record.electricity,
      waste_kg: record.waste
    });
    setActiveTab('calculator');
    showToast('Loaded audit configuration into calculator.');
  };

  const clearHistory = () => {
    setHistory([]);
    showToast('Audit history cleared.');
  };

  return (
    <div className="ecotrack-wrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <CheckCircle size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modern Navigation Bar */}
      <nav className="ecotrack-navbar">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Leaf size={24} />
          </div>
          <div className="brand-text">
            <h1>EcoTrack-AI</h1>
            <p>Carbon Intelligence & Decarbonization Platform</p>
          </div>
        </div>

        <div className="nav-controls">
          <div className="nav-tabs">
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
              onClick={() => setActiveTab('calculator')}
            >
              <BarChart3 size={15} />
              <span>Audit & Analytics</span>
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'challenges' ? 'active' : ''}`}
              onClick={() => setActiveTab('challenges')}
            >
              <Target size={15} />
              <span>Eco Challenges</span>
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={15} />
              <span>Audit History ({history.length})</span>
            </button>
          </div>

          <div className="status-badge" title={`Backend Server: ${API_BASE_URL}`}>
            <span
              className={`status-dot ${
                apiStatus === 'online' ? 'online' : apiStatus === 'offline' ? 'offline' : 'demo'
              }`}
            />
            <span>
              {apiStatus === 'online'
                ? 'Engine Active'
                : apiStatus === 'offline'
                ? 'Offline / Fallback'
                : 'Connecting...'}
            </span>
          </div>
        </div>
      </nav>

      {/* KPI Overview Metrics Bar */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-box emerald">
            <Activity size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Daily Est. Footprint</span>
            <div className="kpi-value-row">
              <span className="kpi-value">
                {result ? result.carbon_score_kg : currentTotal}
              </span>
              <span className="kpi-unit">kg CO₂e</span>
            </div>
            <span className="kpi-subtext">
              Target: &lt; 5.0 kg / day
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box cyan">
            <TrendingDown size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Annualized Run-Rate</span>
            <div className="kpi-value-row">
              <span className="kpi-value">
                {(((result ? result.carbon_score_kg : currentTotal) * 365) / 1000).toFixed(2)}
              </span>
              <span className="kpi-unit">tons / yr</span>
            </div>
            <span className="kpi-subtext">Global Average: 4.8 tons</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box amber">
            <Leaf size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Offset Trees Needed</span>
            <div className="kpi-value-row">
              <span className="kpi-value">
                {Math.max(1, Math.round(((result ? result.carbon_score_kg : currentTotal) * 365) / 22))}
              </span>
              <span className="kpi-unit">mature trees</span>
            </div>
            <span className="kpi-subtext">To reach net-zero offset</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box blue">
            <Layers size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Dominant Sector</span>
            <div className="kpi-value-row">
              <span className="kpi-value" style={{ fontSize: '1.25rem' }}>
                {topCategory}
              </span>
            </div>
            <span className="kpi-subtext">Primary area for reduction</span>
          </div>
        </div>
      </section>

      {/* Main Tab Content */}
      {activeTab === 'challenges' && <EcoChallenges />}

      {activeTab === 'history' && (
        <AuditHistory
          history={history}
          onSelectAudit={handleSelectAudit}
          onClearHistory={clearHistory}
          onCopySummary={handleCopySummary}
          copied={copied}
        />
      )}

      {activeTab === 'calculator' && (
        <main className="dashboard-grid">
          {/* Left Panel: Audit Input Form */}
          <div className="glass-panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">
                  <BarChart3 size={20} color="#10b981" />
                  Resource Audit Parameters
                </h2>
                <p className="panel-subtitle">
                  Configure daily resource consumption to compute real-time emissions.
                </p>
              </div>
            </div>

            {/* Quick Lifestyle Presets */}
            <div className="presets-container">
              <span className="presets-label">⚡ Rapid Presets:</span>
              <div className="presets-chips">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-chip"
                    onClick={() => applyPreset(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="input-section">
              {/* Transport Distance */}
              <div className="field-card">
                <div className="field-header">
                  <div className="field-title-group">
                    <Car size={18} className="field-icon" style={{ color: '#38bdf8' }} />
                    <label htmlFor="transport_km" className="field-label">
                      Daily Commute & Transit
                    </label>
                  </div>
                  <span className="field-badge">
                    +{liveTransportScore.toFixed(2)} kg CO₂e
                  </span>
                </div>

                <div className="field-controls">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.transport_km === '' ? 0 : formData.transport_km}
                    onChange={(e) => handleInputChange('transport_km', e.target.value)}
                    className="custom-range"
                  />
                  <div className="num-input-wrap">
                    <input
                      id="transport_km"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.transport_km}
                      onChange={(e) => handleInputChange('transport_km', e.target.value)}
                      className="custom-input"
                      placeholder="0"
                      required
                    />
                    <span className="num-unit">km</span>
                  </div>
                </div>

                <div className="field-quick-tags">
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => handleInputChange('transport_km', 0)}
                  >
                    WFH (0 km)
                  </button>
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => handleInputChange('transport_km', 8)}
                  >
                    Transit (8 km)
                  </button>
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => handleInputChange('transport_km', 25)}
                  >
                    Car (25 km)
                  </button>
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => handleInputChange('transport_km', 60)}
                  >
                    Long Commute (60 km)
                  </button>
                </div>
              </div>

              {/* Electricity Consumption */}
              <div className="field-card">
                <div className="field-header">
                  <div className="field-title-group">
                    <Zap size={18} className="field-icon" style={{ color: '#fbbf24' }} />
                    <label htmlFor="electricity_kwh" className="field-label">
                      Electricity & Energy Draw
                    </label>
                  </div>
                  <span className="field-badge">
                    +{liveElectricityScore.toFixed(2)} kg CO₂e
                  </span>
                </div>

                <div className="field-controls">
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="0.5"
                    value={formData.electricity_kwh === '' ? 0 : formData.electricity_kwh}
                    onChange={(e) => handleInputChange('electricity_kwh', e.target.value)}
                    className="custom-range"
                  />
                  <div className="num-input-wrap">
                    <input
                      id="electricity_kwh"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.electricity_kwh}
                      onChange={(e) => handleInputChange('electricity_kwh', e.target.value)}
                      className="custom-input"
                      placeholder="0"
                      required
                    />
                    <span className="num-unit">kWh</span>
                  </div>
                </div>

                <div className="field-quick-tags">
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => handleInputChange('electricity_kwh', 4)}
                  >
                    Minimal (4 kWh)
                  </button>
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => handleInputChange('electricity_kwh', 12)}
                  >
                    Apartment (12 kWh)
                  </button>
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => handleInputChange('electricity_kwh', 24)}
                  >
                    Family Home (24 kWh)
                  </button>
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => handleInputChange('electricity_kwh', 40)}
                  >
                    Heavy AC (40 kWh)
                  </button>
                </div>
              </div>

              {/* Municipal Solid Waste */}
              <div className="field-card">
                <div className="field-header">
                  <div className="field-title-group">
                    <Trash2 size={18} className="field-icon" style={{ color: '#34d399' }} />
                    <label htmlFor="waste_kg" className="field-label">
                      Municipal Solid Waste
                    </label>
                  </div>
                  <span className="field-badge">
                    +{liveWasteScore.toFixed(2)} kg CO₂e
                  </span>
                </div>

                <div className="field-controls">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.waste_kg === '' ? 0 : formData.waste_kg}
                    onChange={(e) => handleInputChange('waste_kg', e.target.value)}
                    className="custom-range"
                  />
                  <div className="num-input-wrap">
                    <input
                      id="waste_kg"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.waste_kg}
                      onChange={(e) => handleInputChange('waste_kg', e.target.value)}
                      className="custom-input"
                      placeholder="0"
                      required
                    />
                    <span className="num-unit">kg</span>
                  </div>
                </div>

                <div className="field-quick-tags">
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => handleInputChange('waste_kg', 0.4)}
                  >
                    Near Zero-Waste (0.4 kg)
                  </button>
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => handleInputChange('waste_kg', 1.2)}
                  >
                    Careful (1.2 kg)
                  </button>
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => handleInputChange('waste_kg', 2.0)}
                  >
                    Average (2.0 kg)
                  </button>
                  <button
                    type="button"
                    className="quick-tag-btn"
                    onClick={() => handleInputChange('waste_kg', 4.5)}
                  >
                    High Waste (4.5 kg)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? (
                  <>
                    <Activity size={18} className="spin" />
                    <span>Synthesizing Emissions Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate AI Carbon Audit</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span><strong>Connection Issue:</strong> {error}</span>
              </div>
            )}
          </div>

          {/* Right Panel: Analytics & Insights */}
          <div className="glass-panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">
                  <Sparkles size={20} color="#38bdf8" />
                  Carbon Intelligence & Audit Report
                </h2>
                <p className="panel-subtitle">
                  Comprehensive footprint analysis, emissions breakdown, and interventions.
                </p>
              </div>

              {result && (
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="history-btn"
                  title="Copy carbon audit summary"
                >
                  <CheckCircle size={14} />
                  <span>Copy Report</span>
                </button>
              )}
            </div>

            {/* Always show dynamic gauge and breakdown */}
            <CarbonGauge score={result ? result.carbon_score_kg : currentTotal} />

            <EmissionsBreakdown
              formData={formData}
              totalScore={result ? result.carbon_score_kg : currentTotal}
            />

            {result ? (
              <AIRecommendations
                recommendations={result.recommendations}
                isAiPowered={result.ai_powered}
                notice={result.notice}
              />
            ) : (
              <div className="empty-analytics-card">
                <div className="empty-analytics-icon">
                  <Sparkles size={32} />
                </div>
                <h3>Ready to Analyze</h3>
                <p>
                  Click <strong>"Generate AI Carbon Audit"</strong> to invoke Google Gemini AI
                  for targeted, custom-tailored decarbonization interventions based on your numbers.
                </p>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
