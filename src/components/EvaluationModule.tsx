/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sliders, 
  HelpCircle, 
  ShieldAlert, 
  TrendingDown, 
  Sparkles,
  Info,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { Risk, TenantConfig } from '../types';

interface EvaluationModuleProps {
  risks: Risk[];
  tenantConfig: TenantConfig;
}

export default function EvaluationModule({
  risks,
  tenantConfig
}: EvaluationModuleProps) {
  // Simulator State variables
  const [selectedSimRisk, setSelectedSimRisk] = useState<Risk | null>(risks[0] || null);
  const [simFreq, setSimFreq] = useState(risks[0]?.frequencyValue || 2);
  const [simImpact, setSimImpact] = useState(risks[0]?.impactValue || 2);
  const [simControl, setSimControl] = useState(risks[0]?.controlValue || 2);
  
  // Custom manual simulation if no risk is selected
  const [finExposure, setFinExposure] = useState(150000); // base exposure in euros

  const handleSelectRiskSim = (riskId: string) => {
    const found = risks.find(r => r.id === riskId);
    if (found) {
      setSelectedSimRisk(found);
      setSimFreq(found.frequencyValue);
      setSimImpact(found.impactValue);
      setSimControl(found.controlValue);
    } else {
      setSelectedSimRisk(null);
    }
  };

  // Re-calculate scores dynamically
  const isSoustractive = tenantConfig.formula.expression === '(P * I) - M';
  const scoreBrutSim = simFreq * simImpact;
  
  const scoreResiduelSim = isSoustractive 
    ? Math.max(0, scoreBrutSim - simControl)
    : (scoreBrutSim * simControl);

  const getCritForScore = (score: number) => {
    const found = tenantConfig.matrixThresholds.find(t => score >= t.minScore && score <= t.maxScore);
    return found || tenantConfig.matrixThresholds[0];
  };

  const currentCritSim = getCritForScore(scoreResiduelSim);

  // Financial Estimation simulation
  const rawFinancialLoss = finExposure * (simImpact / tenantConfig.matrixSize);
  const mitigationFactor = (tenantConfig.matrixSize - simControl + 1) / tenantConfig.matrixSize;
  const estimatedResidualLoss = Math.round(rawFinancialLoss * mitigationFactor);

  return (
    <div className="flex-grow p-6 bg-slate-50 overflow-y-auto space-y-6 text-slate-800 text-xs">
      
      {/* Title block */}
      <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-600" />
          Moteur d'Évaluation & Simulateur de Scénarios
        </h2>
        <p className="text-slate-500 text-[11px]">
          Simulez dynamiquement l'atténuation du risque par le renforcement des contrôles internes pour justifier vos budgets de compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COMPONENT: Interactive Sliders Simulator */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Simulateur d'Atténuation (What-If)
            </h3>

            {/* Select risk layout */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Charger risque existant :</span>
              <select
                value={selectedSimRisk?.id || 'manual'}
                onChange={(e) => handleSelectRiskSim(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1 font-semibold"
              >
                <option value="manual">Simulation Manuelle Libre</option>
                {risks.map(r => (
                  <option key={r.id} value={r.id}>
                    [{r.id}] {r.title.substring(0, 40)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SIMULATION SLIDERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              {/* Slider 1: Probabilité */}
              <div className="space-y-1.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-150">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600 uppercase text-[10px]">1. Probabilité / Fréquence (P)</span>
                  <span className="font-bold font-mono text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">{simFreq}</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max={tenantConfig.matrixSize}
                  step="1"
                  value={simFreq}
                  onChange={(e) => { setSimFreq(Number(e.target.value)); setSelectedSimRisk(null); }}
                  className="w-full h-1.5 accent-indigo-600 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-indigo-600 font-semibold">
                  <span>Exceptionnel (1)</span>
                  <span>Fréquent ({tenantConfig.matrixSize})</span>
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1 font-medium bg-white/70 p-1 rounded">
                  💡 {tenantConfig.scales.frequency.find(f => f.value === simFreq)?.description}
                </p>
              </div>

              {/* Slider 2: Impact */}
              <div className="space-y-1.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-150">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600 uppercase text-[10px]">2. Gravité / Impact (I)</span>
                  <span className="font-bold font-mono text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">{simImpact}</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max={tenantConfig.matrixSize}
                  step="1"
                  value={simImpact}
                  onChange={(e) => { setSimImpact(Number(e.target.value)); setSelectedSimRisk(null); }}
                  className="w-full h-1.5 accent-indigo-600 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-indigo-600 font-semibold">
                  <span>Limité/Mineur (1)</span>
                  <span>Critique ({tenantConfig.matrixSize})</span>
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1 font-medium bg-white/70 p-1 rounded">
                  💡 {tenantConfig.scales.impact.find(f => f.value === simImpact)?.description}
                </p>
              </div>

              {/* Slider 3: Maitrise */}
              <div className="space-y-1.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-150">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600 uppercase text-[10px]">3. Efficacité Maîtrise / Contrôle (M)</span>
                  <span className="font-bold font-mono text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">{simControl}</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max={tenantConfig.matrixSize}
                  step="1"
                  value={simControl}
                  onChange={(e) => { setSimControl(Number(e.target.value)); setSelectedSimRisk(null); }}
                  className="w-full h-1.5 accent-indigo-600 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-indigo-600 font-semibold">
                  <span>Maîtrisé (1)</span>
                  <span>Faible / Inexistant ({tenantConfig.matrixSize})</span>
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1 font-medium bg-white/70 p-1 rounded">
                  💡 {tenantConfig.scales.control.find(m => m.value === simControl)?.description}
                </p>
              </div>
            </div>

            {/* RESULTS VIEW */}
            <div className="flex flex-col justify-between p-5 bg-indigo-50/20 border border-indigo-100 rounded-2xl relative overflow-hidden">
              <div className="space-y-4">
                <p className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Résultats Simulés</p>

                {/* Score Brut Display */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-600 font-medium">Score de Risque Brut (P x I) :</span>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-slate-800">{scoreBrutSim}</span>
                  </div>
                </div>

                {/* Score Residuel Display */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                  <div>
                    <span className="text-indigo-600 font-bold block">Critique/Score Net :</span>
                    <span className="text-[9px] text-slate-400">Score avec plans de mitigation</span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black font-mono text-red-600">{scoreResiduelSim}</span>
                  </div>
                </div>

                {/* Level Tag Output */}
                <div className="p-3.5 rounded-lg text-center space-y-1.5 border" style={{ backgroundColor: currentCritSim.color, color: currentCritSim.textColor, borderColor: currentCritSim.textColor + '35' }}>
                  <p className="text-xs font-black uppercase tracking-wider">{currentCritSim.label}</p>
                  <p className="text-[10px] leading-relaxed italic">{currentCritSim.description}</p>
                </div>
              </div>

              {/* Financial Loss simulation */}
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500 uppercase text-[9px] flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-600" /> Exposition financière brute :
                  </span>
                  <input 
                    type="number"
                    value={finExposure}
                    onChange={(e) => setFinExposure(Math.max(1, Number(e.target.value)))}
                    className="w-24 bg-white border border-slate-200 text-xs px-1.5 py-0.5 rounded text-slate-700 font-bold"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-600">Perte brute estimée :</span>
                  <span className="font-bold text-slate-700 font-mono">{rawFinancialLoss.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-indigo-600">Perte résiduelle nette :</span>
                  <span className="font-black text-emerald-600 font-mono">{estimatedResidualLoss.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT: Official Standards reference card */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Info className="w-4.5 h-4.5 text-indigo-600" />
            Cadre de Référence IFACI 2013
          </h3>

          <p className="text-[10.5px] text-slate-500 leading-relaxed">
            Conforme au <strong>Groupe Professionnel IFACI, La cartographie des risques (2ème édition)</strong>. L'évaluation est axée sur le risque résiduel ou net avec 3 variables, et sa hiérarchisation en un tableau logique :
          </p>

          <div className="space-y-3.5 pt-2">
            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[10px] space-y-1">
              <p className="font-bold text-indigo-600">Formule standard IFACI :</p>
              <code className="text-xs font-bold font-mono block bg-white p-1 rounded border border-slate-150">
                Risque Résiduel = Probabilité x Impact x Maîtrise
              </code>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-700 text-[10px] uppercase">Règles de lecture des Seuils Net :</p>
              
              {tenantConfig.matrixThresholds.map((m, idx) => (
                <div key={idx} className="flex gap-2 items-start text-[10px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: m.textColor }}></span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{m.label} ({m.minScore} à {m.maxScore})</p>
                    <p className="text-slate-500 text-[9px]">{m.description.substring(0, 95)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
