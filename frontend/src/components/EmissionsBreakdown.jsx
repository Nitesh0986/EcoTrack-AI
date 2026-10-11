import React from 'react';
import { Car, Zap, Trash2, Trees, Smartphone, Compass } from 'lucide-react';

const EMISSION_FACTORS = {
  transport: 0.21,
  electricity: 0.42,
  waste: 0.58
};

export default function EmissionsBreakdown({ formData, totalScore }) {
  const tEmissions = (formData.transport_km || 0) * EMISSION_FACTORS.transport;
  const eEmissions = (formData.electricity_kwh || 0) * EMISSION_FACTORS.electricity;
  const wEmissions = (formData.waste_kg || 0) * EMISSION_FACTORS.waste;

  const validTotal = Math.max(totalScore, 0.001);

  const tPercent = Math.min(100, Math.round((tEmissions / validTotal) * 100)) || 0;
  const ePercent = Math.min(100, Math.round((eEmissions / validTotal) * 100)) || 0;
  const wPercent = Math.min(100, Math.round((wEmissions / validTotal) * 100)) || 0;

  // Equivalencies:
  // 1 mature tree absorbs ~21.77 kg CO2/year -> ~0.06 kg/day
  const treesNeededYear = Math.max(1, Math.round((totalScore * 365) / 22));
  // 1 passenger car mile = 0.404 kg CO2
  const carMilesEquivalent = Math.round(totalScore / 0.404);
  // 1 smartphone charge = ~0.008 kg CO2
  const phoneChargesEquivalent = Math.round(totalScore / 0.008);

  return (
    <div className="breakdown-box">
      <div className="breakdown-header">
        <span>Sector Emissions Composition</span>
        <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>
          EPA / DEFRA Factors
        </span>
      </div>

      <div className="breakdown-list">
        {/* Transport */}
        <div className="breakdown-item">
          <div className="breakdown-row-labels">
            <span className="breakdown-category-name">
              <Car size={14} color="#38bdf8" /> Transport Mobility
            </span>
            <span className="breakdown-vals">
              <strong>{tEmissions.toFixed(2)} kg</strong> ({tPercent}%)
            </span>
          </div>
          <div className="breakdown-bar-track">
            <div
              className="breakdown-bar-fill fill-transport"
              style={{ width: `${tPercent}%` }}
            />
          </div>
        </div>

        {/* Electricity */}
        <div className="breakdown-item">
          <div className="breakdown-row-labels">
            <span className="breakdown-category-name">
              <Zap size={14} color="#fbbf24" /> Electricity & Grid
            </span>
            <span className="breakdown-vals">
              <strong>{eEmissions.toFixed(2)} kg</strong> ({ePercent}%)
            </span>
          </div>
          <div className="breakdown-bar-track">
            <div
              className="breakdown-bar-fill fill-electricity"
              style={{ width: `${ePercent}%` }}
            />
          </div>
        </div>

        {/* Solid Waste */}
        <div className="breakdown-item">
          <div className="breakdown-row-labels">
            <span className="breakdown-category-name">
              <Trash2 size={14} color="#34d399" /> Municipal Waste
            </span>
            <span className="breakdown-vals">
              <strong>{wEmissions.toFixed(2)} kg</strong> ({wPercent}%)
            </span>
          </div>
          <div className="breakdown-bar-track">
            <div
              className="breakdown-bar-fill fill-waste"
              style={{ width: `${wPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Real-World Equivalencies */}
      <div className="equiv-grid">
        <div className="equiv-card">
          <span className="equiv-icon">🌲</span>
          <div className="equiv-info">
            <span className="equiv-num">{treesNeededYear} Trees</span>
            <span className="equiv-desc">Needed to sequester your annual footprint</span>
          </div>
        </div>

        <div className="equiv-card">
          <span className="equiv-icon">🚗</span>
          <div className="equiv-info">
            <span className="equiv-num">{carMilesEquivalent} Miles</span>
            <span className="equiv-desc">Equivalent ICE car commuting distance</span>
          </div>
        </div>

        <div className="equiv-card">
          <span className="equiv-icon">📱</span>
          <div className="equiv-info">
            <span className="equiv-num">{phoneChargesEquivalent.toLocaleString()}</span>
            <span className="equiv-desc">Equivalent smartphone full battery cycles</span>
          </div>
        </div>

        <div className="equiv-card">
          <span className="equiv-icon">🌍</span>
          <div className="equiv-info">
            <span className="equiv-num">{((totalScore * 365) / 1000).toFixed(2)} Tons</span>
            <span className="equiv-desc">Projected annual CO₂e run-rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
