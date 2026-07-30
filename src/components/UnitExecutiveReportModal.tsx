/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Download, 
  Printer, 
  X, 
  ShieldAlert, 
  Grid, 
  CheckSquare, 
  Award,
  Calendar,
  User as UserIcon,
  Layers,
  Sparkles
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { toPng } from 'html-to-image';
import { ActionPlan, Risk, TenantConfig } from '../types';
import { getCriticalityFromThresholds, getThresholdColorStyles } from '../utils/riskUtils';

interface UnitExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUnitId?: string;
  tenantConfig: TenantConfig;
  risks: Risk[];
  actions: ActionPlan[];
}

export default function UnitExecutiveReportModal({
  isOpen,
  onClose,
  initialUnitId,
  tenantConfig,
  risks,
  actions
}: UnitExecutiveReportModalProps) {
  const defaultUnitId = initialUnitId || tenantConfig.entities[0]?.id || tenantConfig.entities[0]?.name || '';
  const [selectedUnitId, setSelectedUnitId] = useState<string>(defaultUnitId);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Selected Unit Object
  const currentUnit = tenantConfig.entities.find(e => e.id === selectedUnitId || e.name === selectedUnitId) || tenantConfig.entities[0];

  // Risks for this unit
  const unitRisks = risks.filter(r => {
    if (!currentUnit) return false;
    return r.entityId === currentUnit.id || r.entityId === currentUnit.name || r.entityId === selectedUnitId;
  });

  // Action Plans for this unit's risks
  const unitRiskIds = new Set(unitRisks.map(r => r.id));
  const unitActions = actions.filter(a => unitRiskIds.has(a.riskId));

  // Key Statistics
  const totalRisks = unitRisks.length;
  const totalActions = unitActions.length;
  const completedActions = unitActions.filter(a => a.status === 'Réalisé').length;
  const risksWithActionsCount = unitRisks.filter(r => unitActions.some(a => a.riskId === r.id)).length;
  const coverageRate = totalRisks > 0 ? Math.round((risksWithActionsCount / totalRisks) * 100) : 0;
  
  const avgResidualScore = totalRisks > 0 
    ? (unitRisks.reduce((sum, r) => sum + (r.scoreResiduel ?? r.scoreBrut ?? 0), 0) / totalRisks).toFixed(1)
    : '0';

  const maxResidualScore = totalRisks > 0
    ? Math.max(...unitRisks.map(r => r.scoreResiduel ?? r.scoreBrut ?? 0))
    : 0;

  // Matrix Heatmap grid sizing
  const matrixSize = tenantConfig.matrixSize || 4;

  // PNG Export Handler
  const handleExportPNG = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      // Small delay for DOM layout stabilization
      await new Promise(resolve => setTimeout(resolve, 200));

      const targetNode = reportRef.current;
      const width = 960;
      const height = targetNode.scrollHeight || targetNode.offsetHeight;

      let image = '';
      try {
        // Primary Method: html-to-image with explicit container width & height to avoid right margin clipping
        image = await toPng(targetNode, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
          width: width,
          height: height,
          style: {
            transform: 'none',
            width: `${width}px`,
            height: `${height}px`,
            maxWidth: 'none',
            margin: '0',
            boxSizing: 'border-box',
          }
        });
      } catch (toPngErr) {
        console.warn('toPng direct export failed, using html2canvas-pro fallback:', toPngErr);
        // Fallback Method: html2canvas-pro with cloned node width enforcement
        const canvas = await html2canvas(targetNode, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: width,
          height: height,
          windowWidth: width + 200,
          onclone: (clonedDoc) => {
            try {
              const clonedNode = clonedDoc.getElementById('unit-executive-report-document');
              if (clonedNode) {
                clonedNode.style.width = `${width}px`;
                clonedNode.style.minWidth = `${width}px`;
                clonedNode.style.maxWidth = `${width}px`;
              }
              const styleElements = Array.from(clonedDoc.querySelectorAll('style'));
              styleElements.forEach((styleEl) => {
                try {
                  if (styleEl.textContent && (styleEl.textContent.includes('oklch') || styleEl.textContent.includes('color-mix') || styleEl.textContent.includes('oklab'))) {
                    styleEl.textContent = styleEl.textContent
                      .replace(/oklch\([^)]+\)/gi, '#64748b')
                      .replace(/oklab\([^)]+\)/gi, '#64748b')
                      .replace(/color-mix\([^)]+\)/gi, '#64748b');
                  }
                } catch (e) {}
              });
            } catch (e) {}
          }
        });
        image = canvas.toDataURL('image/png');
      }

      const link = document.createElement('a');
      const unitCodeOrName = currentUnit?.code || currentUnit?.name || 'Unite';
      const cleanName = unitCodeOrName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Synthese_DG_${cleanName}_${new Date().toISOString().split('T')[0]}.png`;

      link.href = image;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Erreur export PNG:', err);
      alert(`Une erreur est survenue lors de la génération du fichier PNG : ${err?.message || 'Erreur inconnue'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden my-auto animate-fade-in">
        
        {/* Modal Navigation & Controls Header (Not exported to PNG) */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-inner">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                Export Synthèse Direction Générale (Image PNG)
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Page Unique
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Cartographie, Matrice de Risques & Planification d'Actions réunies sur un document officiel pour le Conseil d'Administration & la DG.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Unit Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-[10.5px] font-bold text-slate-400">Unité :</span>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="bg-slate-900 text-white font-bold text-xs rounded border border-slate-600 px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {tenantConfig.entities.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.code ? `[${e.code}] ` : ''}{e.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PNG Export Button */}
            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-black rounded-lg transition-all flex items-center gap-2 text-xs shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Génération PNG en cours...' : '📸 Exporter en Image PNG'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
              title="Imprimer le document"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* EXPORTABLE DOCUMENT CANVAS (ID: unit-executive-report-document) */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-auto flex-1 bg-slate-200/60 flex justify-center">
          <div
            id="unit-executive-report-document"
            ref={reportRef}
            className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 space-y-6 text-slate-900 font-sans shrink-0"
            style={{ width: '960px', minWidth: '960px', boxSizing: 'border-box' }}
          >
            {/* 1. OFFICIAL EXECUTIVE HEADER */}
            <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Enterprise Logo */}
                {tenantConfig.logoUrl ? (
                  <img
                    src={tenantConfig.logoUrl}
                    alt="Logo Client"
                    className="h-14 max-w-[160px] object-contain border border-slate-200 rounded p-1 bg-white"
                    style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
                  />
                ) : (
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shadow-md border"
                    style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: '#1e293b' }}
                  >
                    {tenantConfig.companyName ? tenantConfig.companyName.substring(0, 2).toUpperCase() : 'DG'}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight" style={{ color: '#0f172a' }}>
                    {tenantConfig.companyName || 'ENTREPRISE CLIENTE'}
                  </h1>
                  <p className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: '#4338ca' }}>
                    Direction Générale • Governance, Risk & Compliance (GRC)
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded border font-mono"
                      style={{ backgroundColor: '#f8fafc', color: '#334155', borderColor: '#cbd5e1' }}
                    >
                      REF : SYNTHESE-DG-{currentUnit?.code || 'UNIT'}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: '#64748b' }}>
                      Édition officielle du : {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1 max-w-[340px] shrink-0">
                <span 
                  className="inline-block px-3 py-1 font-black text-xs rounded-lg uppercase tracking-wide border shadow-xs"
                  style={{ backgroundColor: '#0f172a', color: '#fbbf24', borderColor: '#1e293b' }}
                >
                  RAPPORT SYNTHÈSE EXECUTIVE
                </span>
                <h2 className="text-xs font-extrabold pt-1 leading-snug break-words" style={{ color: '#0f172a' }}>
                  Unité : <span style={{ color: '#4338ca' }}>{currentUnit?.name || 'Unité Organisationnelle'}</span>
                </h2>
                {currentUnit?.code && (
                  <p className="text-[10.5px] font-mono" style={{ color: '#64748b' }}>Code Structure : {currentUnit.code}</p>
                )}
              </div>
            </div>

            {/* EXECUTIVE SUMMARY KPI CARDS */}
            <div className="grid grid-cols-5 gap-3">
              <div 
                className="p-3 rounded-xl border text-center space-y-1 shadow-2xs"
                style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a' }}
              >
                <span className="text-[9.5px] font-bold uppercase tracking-wider block" style={{ color: '#64748b' }}>Risques Recensés</span>
                <span className="text-xl font-black font-mono" style={{ color: '#0f172a' }}>{totalRisks}</span>
              </div>

              <div 
                className="p-3 rounded-xl border text-center space-y-1 shadow-2xs"
                style={{ backgroundColor: '#eef2ff', borderColor: '#c7d2fe', color: '#1e1b4b' }}
              >
                <span className="text-[9.5px] font-bold uppercase tracking-wider block" style={{ color: '#4338ca' }}>Score Net Moyen</span>
                <span className="text-xl font-black font-mono" style={{ color: '#1e1b4b' }}>{avgResidualScore}</span>
              </div>

              <div 
                className="p-3 rounded-xl border text-center space-y-1 shadow-2xs"
                style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#78350f' }}
              >
                <span className="text-[9.5px] font-bold uppercase tracking-wider block" style={{ color: '#b45309' }}>Score Max Unité</span>
                <span className="text-xl font-black font-mono" style={{ color: '#78350f' }}>{maxResidualScore}</span>
              </div>

              <div 
                className="p-3 rounded-xl border text-center space-y-1 shadow-2xs"
                style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#064e3b' }}
              >
                <span className="text-[9.5px] font-bold uppercase tracking-wider block" style={{ color: '#047857' }}>Plans d'Action</span>
                <span className="text-xl font-black font-mono" style={{ color: '#064e3b' }}>{totalActions} ({completedActions} rés.)</span>
              </div>

              <div 
                className="p-3 rounded-xl border text-center space-y-1 shadow-sm"
                style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#ffffff' }}
              >
                <span className="text-[9.5px] font-bold uppercase tracking-wider block" style={{ color: '#fbbf24' }}>Couverture Actions</span>
                <span className="text-xl font-black font-mono" style={{ color: '#ffffff' }}>{coverageRate}%</span>
              </div>
            </div>

            {/* SECTION 1: CARTOGRAPHIE DES RISQUES DE L'UNITÉ */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b-2 pb-1.5" style={{ borderColor: '#4338ca' }}>
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: '#0f172a' }}>
                  <ShieldAlert className="w-4 h-4" style={{ color: '#4338ca' }} />
                  1. Cartographie & Registre des Risques de l'Unité ({totalRisks})
                </h3>
                <span className="text-[10px] font-semibold" style={{ color: '#64748b' }}>
                  Trié par Score Résiduel Décroissant
                </span>
              </div>

              {unitRisks.length === 0 ? (
                <div 
                  className="p-4 rounded-lg text-center italic text-xs border"
                  style={{ backgroundColor: '#f8fafc', color: '#64748b', borderColor: '#cbd5e1' }}
                >
                  Aucun risque répertorié pour cette unité organisationnelle.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {unitRisks
                    .sort((a, b) => (b.scoreResiduel ?? b.scoreBrut ?? 0) - (a.scoreResiduel ?? a.scoreBrut ?? 0))
                    .map((risk) => {
                      const netScore = risk.scoreResiduel ?? risk.scoreBrut ?? 0;
                      const brutScore = risk.scoreBrut || (risk.frequencyValue || 1) * (risk.impactValue || 1);
                      const threshold = getCriticalityFromThresholds(netScore, tenantConfig.matrixThresholds || []);
                      const colorStyle = getThresholdColorStyles(threshold.label, tenantConfig.matrixThresholds || []);

                      return (
                        <div 
                          key={risk.id}
                          className="p-2.5 rounded-lg border flex flex-col justify-between space-y-2 shadow-2xs"
                          style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                        >
                          <div className="flex items-start gap-1.5 min-w-0">
                            <h4 className="font-bold text-[10px] leading-tight line-clamp-2" style={{ color: '#0f172a' }}>
                              {risk.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t" style={{ borderColor: '#e2e8f0' }}>
                            <div className="flex items-center gap-1 text-[9.5px]">
                              <span style={{ color: '#64748b' }}>Score Brut :</span>
                              <span className="font-mono font-black" style={{ color: '#0f172a' }}>{brutScore}</span>
                            </div>

                            <span 
                              className="px-2 py-0.5 rounded font-black text-[8.5px] uppercase border"
                              style={{
                                backgroundColor: colorStyle.bg || '#f1f5f9',
                                borderColor: colorStyle.border || '#cbd5e1',
                                color: colorStyle.text || '#1e293b'
                              }}
                            >
                              {threshold.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* SECTION 2: MATRICE DES RISQUES / HEATMAP DE L'UNITÉ */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-1.5">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                  <Grid className="w-4 h-4 text-indigo-600" />
                  2. Matrice de Positionnement des Risques de l'Unité (Heatmap {matrixSize}×{matrixSize})
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Positionnement selon Fréquence (Y) × Impact (X)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Heatmap Grid */}
                <div className="md:col-span-8 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex flex-col space-y-1">
                    {/* Y-Axis Label */}
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">
                      ▲ Fréquence / Probabilité (Y)
                    </span>

                    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${matrixSize}, minmax(0, 1fr))` }}>
                      {Array.from({ length: matrixSize }).flatMap((_, rowIdx) => {
                        const freqVal = matrixSize - rowIdx; // Top to bottom
                        return Array.from({ length: matrixSize }).map((_, colIdx) => {
                          const impVal = colIdx + 1; // Left to right
                          const cellScore = freqVal * impVal;
                          const threshold = getCriticalityFromThresholds(cellScore, tenantConfig.matrixThresholds || []);
                          const colorStyle = getThresholdColorStyles(threshold.label, tenantConfig.matrixThresholds || []);

                          // Risks inside this cell for this unit
                          const cellRisks = unitRisks.filter(r => (r.frequencyValue || 1) === freqVal && (r.impactValue || 1) === impVal);
                          const riskCount = cellRisks.length;

                          return (
                            <div
                              key={`cell_${freqVal}_${impVal}`}
                              className="p-2.5 rounded-xl border min-h-[65px] flex flex-col justify-between items-center text-center font-sans shadow-2xs transition-all"
                              style={{
                                backgroundColor: colorStyle.bg || '#f8fafc',
                                borderColor: colorStyle.border || '#cbd5e1',
                                color: colorStyle.text || '#1e293b'
                              }}
                            >
                              {/* Header: Frequency - Impact & Cell Score */}
                              <div 
                                className="w-full flex justify-between items-center text-[8.5px] font-bold font-mono opacity-80 border-b pb-1"
                                style={{ borderColor: (colorStyle.border || '#cbd5e1') + '40' }}
                              >
                                <span>F{freqVal}-I{impVal}</span>
                                <span className="font-extrabold font-mono">Score {cellScore}</span>
                              </div>

                              {/* Center: Risk Count Badge */}
                              <div className="my-1.5 flex flex-col items-center justify-center">
                                {riskCount > 0 ? (
                                  <span 
                                    className="px-2.5 py-0.5 rounded-full font-black font-mono text-sm shadow-xs"
                                    style={{ backgroundColor: colorStyle.text || '#1e293b', color: '#ffffff' }}
                                  >
                                    {riskCount}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold opacity-40 font-mono">- 0 -</span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })}
                    </div>

                    {/* X-Axis Label */}
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center pt-1">
                      Gravité / Impact (X) ►
                    </span>
                  </div>
                </div>

                {/* Threshold Legends & Statistics */}
                <div className="md:col-span-4 space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-slate-700 tracking-wider border-b pb-1">
                    Légende Officielle des Seuils de Criticité :
                  </h4>
                  <div className="space-y-1.5">
                    {(tenantConfig.matrixThresholds || []).map((t, idx) => {
                      const colorStyle = getThresholdColorStyles(t.label, tenantConfig.matrixThresholds || []);
                      const countInThreshold = unitRisks.filter(r => {
                        const score = r.scoreResiduel ?? r.scoreBrut ?? 0;
                        const crit = getCriticalityFromThresholds(score, tenantConfig.matrixThresholds || []);
                        return crit.label === t.label;
                      }).length;

                      return (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-2 rounded-lg border shadow-2xs text-[10px]"
                          style={{
                            backgroundColor: colorStyle.bg || '#ffffff',
                            borderColor: colorStyle.border || '#cbd5e1',
                            color: colorStyle.text || '#1e293b'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-3.5 h-3.5 rounded-full border shrink-0" 
                              style={{ backgroundColor: colorStyle.text || colorStyle.border, borderColor: colorStyle.border }}
                            />
                            <span className="font-extrabold">{t.label}</span>
                          </div>
                          <span 
                            className="font-mono font-black text-xs px-2 py-0.5 rounded border"
                            style={{ backgroundColor: '#ffffff', color: colorStyle.text || '#1e293b', borderColor: colorStyle.border }}
                          >
                            {countInThreshold} risque(s)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: PLANIFICATION DES PLANS D'ACTION DE L'UNITÉ */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b-2 pb-1.5" style={{ borderColor: '#4338ca' }}>
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: '#0f172a' }}>
                  <CheckSquare className="w-4 h-4" style={{ color: '#4338ca' }} />
                  3. Feuille de Route & Planification des Actions de Remédiation de l'Unité ({totalActions})
                </h3>
                <span className="text-[10px] font-semibold" style={{ color: '#64748b' }}>
                  Suivi Opérationnel & Avancement des Chantiers
                </span>
              </div>

              {unitActions.length === 0 ? (
                <div 
                  className="p-4 rounded-lg text-center italic text-xs border"
                  style={{ backgroundColor: '#f8fafc', color: '#64748b', borderColor: '#cbd5e1' }}
                >
                  Aucun plan d'action de remédiation enregistré pour l'instant pour cette unité.
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border" style={{ borderColor: '#cbd5e1' }}>
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="font-bold text-[9px] uppercase tracking-wider" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                        <th className="p-2 pl-3">Risque Associé</th>
                        <th className="p-2">Intitulé du Plan d'Action</th>
                        <th className="p-2">Description Opérationnelle</th>
                        <th className="p-2 text-center">Priorité</th>
                        <th className="p-2 text-center pr-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium" style={{ borderColor: '#e2e8f0' }}>
                      {unitActions.map((act, idx) => {
                        const linkedRisk = unitRisks.find(r => r.id === act.riskId);
                        const isHighPriority = act.priority === 'Critique' || act.priority === 'Haute';
                        const isCompleted = act.status === 'Réalisé';
                        const isInProgress = act.status === 'En cours';

                        return (
                          <tr key={act.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                            <td className="p-2 pl-3 font-bold" style={{ color: '#334155' }}>{linkedRisk?.title || 'N/A'}</td>
                            <td className="p-2 font-bold" style={{ color: '#0f172a' }}>{act.title}</td>
                            <td className="p-2 max-w-[220px] truncate" style={{ color: '#475569' }} title={act.description}>
                              {act.description || 'N/A'}
                            </td>
                            <td className="p-2 text-center">
                              <span 
                                className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase border"
                                style={{
                                  backgroundColor: isHighPriority ? '#fee2e2' : '#f1f5f9',
                                  color: isHighPriority ? '#991b1b' : '#334155',
                                  borderColor: isHighPriority ? '#fca5a5' : '#cbd5e1'
                                }}
                              >
                                {act.priority}
                              </span>
                            </td>
                            <td className="p-2 text-center pr-3">
                              <span 
                                className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase border"
                                style={{
                                  backgroundColor: isCompleted ? '#dcfce7' : isInProgress ? '#e0e7ff' : '#f1f5f9',
                                  color: isCompleted ? '#166534' : isInProgress ? '#3730a3' : '#475569',
                                  borderColor: isCompleted ? '#86efac' : isInProgress ? '#a5b4fc' : '#cbd5e1'
                                }}
                              >
                                {act.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* OFFICIAL FOOTER */}
            <div className="pt-6 border-t-2 flex justify-between items-end text-[9.5px] font-semibold" style={{ borderColor: '#0f172a', color: '#64748b' }}>
              <div className="space-y-0.5">
                <p className="font-bold uppercase tracking-wider" style={{ color: '#0f172a' }}>
                  Document Officiel Validé par le Comité des Risques & la Direction Générale
                </p>
                <p>Protéger la valeur • Assurer la pérennité • Système Certifié IFACI & ISO 31000</p>
              </div>

              <div className="text-right font-mono">
                <p className="font-bold" style={{ color: '#1e1b4b' }}>Signé électroniquement par la Direction</p>
                <p style={{ color: '#94a3b8' }}>Empreinte SHA256 / GRC-REG-{Date.now().toString(36).toUpperCase()}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
