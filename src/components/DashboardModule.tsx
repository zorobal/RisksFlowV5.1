/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  CheckSquare, 
  TrendingUp, 
  FolderIcon, 
  HelpCircle,
  Building2,
  Calendar,
  AlertTriangle,
  Download,
  Layers,
  ArrowRight,
  X,
  Clock,
  Info,
  Check,
  FileText,
  User as UserIcon,
  ListFilter
} from 'lucide-react';
import { Risk, TenantConfig, ActionPlan, OrgEntity } from '../types';

interface DashboardModuleProps {
  risks: Risk[];
  tenantConfig: TenantConfig;
  actions: ActionPlan[];
}

export default function DashboardModule({
  risks,
  tenantConfig,
  actions
}: DashboardModuleProps) {
  // Filters State
  const [selectedEntityId, setSelectedEntityId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedOrgMode, setSelectedOrgMode] = useState<'hierarchique' | 'matriciel'>('hierarchique');
  const [matrixType, setMatrixType] = useState<'brut' | 'residuel'>('brut');

  // Interactive Matrix Cell Selection
  const [selectedCell, setSelectedCell] = useState<{ y: number; x: number } | null>(null);
  
  // Selected Risk for Multi-level Detailed Drill-down
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  // Temporal Date filters state
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedPeriodicity, setSelectedPeriodicity] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(3); // March (standard mock data month)
  const [selectedTrimester, setSelectedTrimester] = useState<number>(1);
  const [selectedStartMonth, setSelectedStartMonth] = useState<number>(1);
  const [selectedEndMonth, setSelectedEndMonth] = useState<number>(6);

  const size = tenantConfig.matrixSize || 4;

  // 1. Recursive helper to get all descendants of an entity (Hierarchical mode)
  const getDescendantEntityIds = (entityId: string): string[] => {
    const result: string[] = [entityId];
    const traverse = (parentId: string) => {
      tenantConfig.entities.forEach(e => {
        if (e.parentId === parentId && e.statut !== 'Archivé') {
          if (!result.includes(e.id)) {
            result.push(e.id);
            traverse(e.id);
          }
        }
      });
    };
    traverse(entityId);
    return result;
  };

  // 2. Helper to filter risks based on Hierarchical & Matriciel logic
  const orgFilteredRisks = useMemo(() => {
    if (selectedEntityId === 'all') return risks;

    const targetIds = getDescendantEntityIds(selectedEntityId);

    return risks.filter(r => {
      // Direct match
      if (targetIds.includes(r.entityId)) return true;

      // Check if we are in matriciel mode, search secondary connections
      if (selectedOrgMode === 'matriciel') {
        const riskEntity = tenantConfig.entities.find(e => e.id === r.entityId);
        if (riskEntity && riskEntity.rattachementsSecondaires) {
          // If any of the secondary attachments matches the target hierarchy, include it
          const hasSecondaryMatch = riskEntity.rattachementsSecondaires.some(secId => targetIds.includes(secId));
          if (hasSecondaryMatch) return true;
        }
      }
      return false;
    });
  }, [risks, selectedEntityId, selectedOrgMode, tenantConfig.entities]);

  // 3. Helper to check if a risk falls inside a specific year & month range
  const matchPeriod = (createdAtStr: string, year: string, periodicity: string, month: number, trimester: number, startM: number, endM: number) => {
    if (!createdAtStr) return false;
    const parts = createdAtStr.split('-');
    if (parts.length < 3) return false;
    const rYear = parts[0];
    const rMonth = parseInt(parts[1], 10);

    if (year !== 'all' && rYear !== year) return false;

    if (periodicity === 'month') {
      return rMonth === month;
    } else if (periodicity === 'trimester') {
      if (trimester === 1) return rMonth >= 1 && rMonth <= 3;
      if (trimester === 2) return rMonth >= 4 && rMonth <= 6;
      if (trimester === 3) return rMonth >= 7 && rMonth <= 9;
      if (trimester === 4) return rMonth >= 10 && rMonth <= 12;
    } else if (periodicity === 'interval') {
      return rMonth >= startM && rMonth <= endM;
    }
    return true; // if periodicity is all
  };

  // 4. Current period filtered risks (combining org filter + date + category filter)
  const filteredRisks = useMemo(() => {
    return orgFilteredRisks.filter(r => {
      const matchCat = selectedCategoryId === 'all' || r.categoryId === selectedCategoryId;
      const matchTime = matchPeriod(r.createdAt, selectedYear, selectedPeriodicity, selectedMonth, selectedTrimester, selectedStartMonth, selectedEndMonth);
      return matchCat && matchTime;
    });
  }, [orgFilteredRisks, selectedCategoryId, selectedYear, selectedPeriodicity, selectedMonth, selectedTrimester, selectedStartMonth, selectedEndMonth]);

  // 5. Compute previous period parameters for comparison GRC
  const prevParams = useMemo(() => {
    let prevYear = selectedYear;
    let prevPeriodicity = selectedPeriodicity;
    let prevMonth = selectedMonth;
    let prevTrimester = selectedTrimester;
    let prevStartM = selectedStartMonth;
    let prevEndM = selectedEndMonth;

    if (selectedPeriodicity === 'all') {
      prevYear = selectedYear === '2026' ? '2025' : 'all';
    } else if (selectedPeriodicity === 'month') {
      if (selectedMonth === 1) {
        prevMonth = 12;
        prevYear = selectedYear === '2026' ? '2025' : 'all';
      } else {
        prevMonth = selectedMonth - 1;
      }
    } else if (selectedPeriodicity === 'trimester') {
      if (selectedTrimester === 1) {
        prevTrimester = 4;
        prevYear = selectedYear === '2026' ? '2025' : 'all';
      } else {
        prevTrimester = selectedTrimester - 1;
      }
    } else if (selectedPeriodicity === 'interval') {
      const intervalSize = selectedEndMonth - selectedStartMonth + 1;
      if (selectedStartMonth - intervalSize >= 1) {
        prevStartM = selectedStartMonth - intervalSize;
        prevEndM = selectedStartMonth - 1;
      } else {
        prevYear = selectedYear === '2026' ? '2025' : 'all';
        prevStartM = 12 - intervalSize + 1;
        prevEndM = 12;
      }
    }

    return { prevYear, prevPeriodicity, prevMonth, prevTrimester, prevStartM, prevEndM };
  }, [selectedYear, selectedPeriodicity, selectedMonth, selectedTrimester, selectedStartMonth, selectedEndMonth]);

  // 6. Previous period filtered risks for comparison
  const previousPeriodRisks = useMemo(() => {
    return orgFilteredRisks.filter(r => {
      const matchCat = selectedCategoryId === 'all' || r.categoryId === selectedCategoryId;
      const matchTime = matchPeriod(r.createdAt, prevParams.prevYear, prevParams.prevPeriodicity, prevParams.prevMonth, prevParams.prevTrimester, prevParams.prevStartM, prevParams.prevEndM);
      return matchCat && matchTime;
    });
  }, [orgFilteredRisks, selectedCategoryId, prevParams]);

  // Calculate Metrics
  const totalRisks = filteredRisks.length;
  const totalRisksPrev = previousPeriodRisks.length;
  
  const avgResidualScore = useMemo(() => {
    if (totalRisks === 0) return 0;
    return Number((filteredRisks.reduce((acc, curr) => acc + curr.scoreResiduel, 0) / totalRisks).toFixed(1));
  }, [filteredRisks, totalRisks]);

  const avgResidualScorePrev = useMemo(() => {
    if (totalRisksPrev === 0) return 0;
    return Number((previousPeriodRisks.reduce((acc, curr) => acc + curr.scoreResiduel, 0) / totalRisksPrev).toFixed(1));
  }, [previousPeriodRisks, totalRisksPrev]);

  const currentActions = useMemo(() => {
    return actions.filter(a => filteredRisks.some(r => r.id === a.riskId));
  }, [actions, filteredRisks]);

  const previousActions = useMemo(() => {
    return actions.filter(a => previousPeriodRisks.some(r => r.id === a.riskId));
  }, [actions, previousPeriodRisks]);

  const totalActions = currentActions.length;
  const completedActions = currentActions.filter(a => a.status === 'Réalisé').length;
  const actionCompletionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const totalActionsPrev = previousActions.length;
  const completedActionsPrev = previousActions.filter(a => a.status === 'Réalisé').length;
  const actionCompletionRatePrev = totalActionsPrev > 0 ? Math.round((completedActionsPrev / totalActionsPrev) * 100) : 0;

  // Helper to categorize criticality
  const getCriticality = (score: number) => {
    const found = tenantConfig.matrixThresholds.find(t => score >= t.minScore && score <= t.maxScore);
    return found || tenantConfig.matrixThresholds[0];
  };

  const criticalRisksCount = useMemo(() => {
    return filteredRisks.filter(r => {
      const label = getCriticality(r.scoreResiduel).label.toLowerCase();
      return label.includes('élevé') || label.includes('catastrophique') || label.includes('critique') || label.includes('significatif');
    }).length;
  }, [filteredRisks]);

  // Criticality Breakdown
  const criticalityCounts = useMemo(() => {
    return tenantConfig.matrixThresholds.map(t => {
      const count = filteredRisks.filter(r => getCriticality(r.scoreResiduel).label === t.label).length;
      return {
        label: t.label,
        count,
        color: t.color,
        textColor: t.textColor,
        percentage: totalRisks > 0 ? Math.round((count / totalRisks) * 100) : 0
      };
    });
  }, [filteredRisks, tenantConfig.matrixThresholds, totalRisks]);

  // Categories Breakdown
  const categoryCounts = useMemo(() => {
    return tenantConfig.categories.map(cat => {
      const count = filteredRisks.filter(r => r.categoryId === cat.id).length;
      return {
        label: cat.name,
        count,
        color: cat.color,
        percentage: totalRisks > 0 ? Math.round((count / totalRisks) * 100) : 0
      };
    });
  }, [filteredRisks, tenantConfig.categories, totalRisks]);

  // Top Risks
  const topRisks = useMemo(() => {
    return [...filteredRisks].sort((a, b) => b.scoreResiduel - a.scoreResiduel).slice(0, 5);
  }, [filteredRisks]);

  // Matrix axes values
  const freqValues = Array.from({ length: size }, (_, i) => size - i); // e.g. 4, 3, 2, 1
  const impactValues = Array.from({ length: size }, (_, i) => i + 1); // e.g. 1, 2, 3, 4

  // Matrix Cell color functions
  const getVibrantColors = (critLabel: string) => {
    const labelLower = critLabel.toLowerCase();
    if (labelLower.includes('faible') || labelLower.includes('mineur') || labelLower.includes('bas')) {
      return { bg: '#E6FAF0', border: '#10B981', text: '#047857' }; // Soft green
    }
    if (labelLower.includes('modéré') || labelLower.includes('moyen') || labelLower.includes('significatif')) {
      return { bg: '#FFFBEB', border: '#F59E0B', text: '#B45309' }; // Soft yellow
    }
    return { bg: '#FEF2F2', border: '#EF4444', text: '#B91C1C' }; // Soft red
  };

  // Helper to determine cell criticality label
  const getCellCriticality = (f: number, i: number, type: 'brut' | 'residuel') => {
    const product = f * i;
    // For residuel matrix, let's estimate product with a generic control factor of 2.
    // Real risks score determines color. We can approximate cell color based on scoreBrut or thresholds.
    const scoreVal = type === 'brut' ? product : Math.max(1, Math.round(product / 2));
    return getCriticality(scoreVal);
  };

  // Filter risks in a specific matrix cell
  const getRisksInCell = (f: number, i: number, type: 'brut' | 'residuel') => {
    return filteredRisks.filter(r => {
      if (type === 'brut') {
        return r.frequencyValue === f && r.impactValue === i;
      } else {
        // Residual matrix maps Brut score level (Y) vs Control level (X)
        // Let's divide Brut score into bracket index (from 1 to size) and Control value as X
        // Frequency is Y, Control is X
        return r.frequencyValue === f && r.controlValue === i;
      }
    });
  };

  // Selected Risk Object for detailed view
  const selectedRisk = useMemo(() => {
    if (!selectedRiskId) return null;
    return risks.find(r => r.id === selectedRiskId) || null;
  }, [risks, selectedRiskId]);

  // Action plans attached to the selected risk
  const selectedRiskActions = useMemo(() => {
    if (!selectedRiskId) return [];
    return actions.filter(a => a.riskId === selectedRiskId);
  }, [actions, selectedRiskId]);

  // Handler for cell clicks
  const handleCellClick = (f: number, i: number) => {
    if (selectedCell && selectedCell.y === f && selectedCell.x === i) {
      setSelectedCell(null); // Deselect
    } else {
      setSelectedCell({ y: f, x: i });
    }
  };

  // Filtered risks list in the active selected cell
  const cellRisks = useMemo(() => {
    if (!selectedCell) return [];
    return getRisksInCell(selectedCell.y, selectedCell.x, matrixType);
  }, [selectedCell, filteredRisks, matrixType]);

  // Dynamic GRC Markdown synthesis based on selected filters
  const handleExportMarkdown = () => {
    const dateStr = new Date().toLocaleDateString('fr-FR');
    const entityName = selectedEntityId === 'all' 
      ? 'Tous les périmètres (Global)' 
      : (tenantConfig.entities.find(e => e.id === selectedEntityId)?.name || 'Inconnu');

    const catName = selectedCategoryId === 'all'
      ? 'Toutes les catégories'
      : (tenantConfig.categories.find(c => c.id === selectedCategoryId)?.name || 'Inconnu');

    let mdContent = `# RAPPORT DE SYNTHÈSE DÉCISIONNELLE GRC
---
**Destinataires :** Direction Générale, Comité des Risques, Décideurs Stratégiques
**Organisation :** ${tenantConfig.companyName}
**Périmètre d'Analyse :** ${entityName} (${selectedOrgMode === 'hierarchique' ? 'Mode Hiérarchique strict' : 'Mode Matriciel transverse'})
**Filtre Thématique :** ${catName}
**Exercice de Référence :** Exercice ${selectedYear} (${selectedPeriodicity === 'all' ? 'Annuel' : selectedPeriodicity})
**Date d'Émission :** ${dateStr}

---

## 1. Résumé Exécutif & Tableau de Bord Général

Le présent rapport synthétise la cartographie globale des risques consolidée en temps réel. Les données reflètent les dispositifs actifs de maîtrise ainsi que l'évolution des initiatives de remédiation en cours.

### Indicateurs de Performance GRC Clés (KPIs)
* **Volume Global de Risques Actifs :** **${totalRisks}** risques identifiés et suivis (vs **${totalRisksPrev}** lors du cycle précédent).
* **Indice Global Net Moyen (Gravité Résiduelle) :** **${avgResidualScore}** / 100 (vs **${avgResidualScorePrev}** précédemment).
  * *Note de lecture :* L'indice net représente le score d'exposition réelle après application des dispositifs de maîtrise.
* **Taux d'Avancement des Actions de Remédiation :** **${actionCompletionRate}%** de clôture des actions programmées (vs **${actionCompletionRatePrev}%** au cycle précédent).
* **Alertes de Criticité Majeure :** **${criticalRisksCount}** risques en zone d'alerte rouge exigeant une attention immédiate de la Direction.

---

## 2. Analyse Comparative & Tendances Temporelles

L'évaluation comparative automatisée entre le cycle actuel et le cycle précédent révèle les dynamiques suivantes :
* **Exposition globale :** ${
      avgResidualScore < avgResidualScorePrev 
        ? `Tendance favorable. L'indice net moyen a diminué de **${Number((prevParams.prevYear !== 'all' ? (avgResidualScorePrev - avgResidualScore) : 0).toFixed(1))}** points grâce à l'efficacité accrue des barrières de contrôle.`
        : avgResidualScore === avgResidualScorePrev
        ? `Exposition stable. L'indice net est inchangé.`
        : `Vigilance requise. Augmentation de l'indice de risque de **${Number((avgResidualScore - avgResidualScorePrev).toFixed(1))}** points, indiquant de nouvelles menaces ou une dégradation des contrôles.`
    }
* **Avancement des plans d'atténuation :** ${
      actionCompletionRate >= actionCompletionRatePrev
        ? `Accélération du traitement des risques avec un gain de **${actionCompletionRate - actionCompletionRatePrev}%** dans l'exécution du plan GRC.`
        : `Ralentissement constaté dans l'exécution du plan d'action (baisse de **${actionCompletionRatePrev - actionCompletionRate}%**). Des goulots d'étranglement opérationnels doivent être levés.`
    }

---

## 3. Répartition Stratégique des Risques Résiduels

### 3.1 Décomposition par Seuil de Criticité
${criticalityCounts.map(c => `* **${c.label} :** ${c.count} risque(s) (${c.percentage}%)`).join('\n')}

### 3.2 Décomposition par Catégorie Thématique
${categoryCounts.map(c => `* **${c.label} :** ${c.count} risque(s) (${c.percentage}%)`).join('\n')}

---

## 4. Focus sur les Risques Majeurs (Top Alerte Rouge)

Les risques suivants présentent les scores résiduels nets les plus élevés de la période et concentrent l'attention des risk managers :

${
  topRisks.length === 0 
    ? "Aucun risque majeur répertorié dans ce périmètre." 
    : topRisks.map((r, index) => {
        const crit = getCriticality(r.scoreResiduel);
        return `### 4.${index + 1}. [${r.id}] ${r.title}
* **Catégorie :** ${tenantConfig.categories.find(c => c.id === r.categoryId)?.name || 'Inconnue'}
* **Gravité Résiduelle (Net) :** **${r.scoreResiduel}** (${crit.label}) | **Gravité brute :** ${r.scoreBrut}
* **Formule de Cotation :** Fréquence [${r.frequencyValue}] x Impact [${r.impactValue}] x Maîtrise [${r.controlValue}]
* **Propriétaire / Initiateur :** ${r.createdBy}
* **Description :** ${r.description}
* **Plans d'action associés :** ${actions.filter(a => a.riskId === r.id).length} actions définies.
`;
      }).join('\n')
}

---

## 5. Recommandations de la Direction GRC & Prochaines Étapes

1. **Focus sur la Maîtrise des Risques Majeurs :** Allouer prioritairement les ressources budgétaires et humaines sur les risques dont l'indice résiduel dépasse le seuil critique (Score > 32).
2. **Dynamisation des Plans de Remédiation :** Assurer des revues bimensuelles sur les actions en statut "En cours" ou "À planifier" pour maintenir le taux de remédiation au-dessus de 80%.
3. **Audits de Maîtrise :** Diligenter des missions d'audit ciblées pour valider l'efficacité réelle des barrières de contrôle (coefficient de maîtrise) déclarées par les opérationnels.

---
*Rapport généré automatiquement par Sogesti GRC. Confidentialité Niveau 3 - Réservé aux Décideurs.*
`;

    // Trigger file download
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GRC-Synthese-Decisionnelle-${entityName.replace(/\s+/g, '-')}-${dateStr}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto space-y-6 text-slate-800 text-xs" id="dashboard-module-container">
      
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 bg-indigo-600 border border-indigo-400 text-indigo-50 font-extrabold text-[9px] uppercase rounded-full tracking-wider font-mono">
            PORTAIL DECISIONNAIRE GRC
          </span>
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Tableau de Bord Stratégique — Direction Générale
          </h2>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Cartographie dynamique, pilotage matriciel transverse et évaluation temps réel pour <strong className="text-slate-100">{tenantConfig.companyName}</strong>
          </p>
        </div>

        {/* Export and action options */}
        <div className="flex items-center gap-3">
          {tenantConfig.logoUrl && (
            <img 
              src={tenantConfig.logoUrl} 
              alt="Logo d'entreprise" 
              className="h-10 max-w-[100px] object-contain rounded bg-white p-1 border border-slate-700" 
              referrerPolicy="no-referrer"
            />
          )}
          <button
            onClick={handleExportMarkdown}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm hover:shadow active:scale-98"
            title="Exporter l'explication synthétique du tableau de bord au format Markdown"
          >
            <Download className="w-4 h-4" />
            Exporter Synthèse (.md)
          </button>
        </div>
      </div>

      {/* Advanced Filter Ribbon */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <ListFilter className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Filtres de Consolidation Stratégique</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Organization Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Entité & Périmètre</label>
            <select
              value={selectedEntityId}
              onChange={(e) => {
                setSelectedEntityId(e.target.value);
                setSelectedCell(null); // Clear selected cell on perimeter change
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer text-xs"
            >
              <option value="all">Périmètre Global (Toutes les entités)</option>
              {tenantConfig.entities.map(e => (
                <option key={e.id} value={e.id}>
                  {e.type === 'Filiale' ? '🏢 ' : e.type === 'Site' ? '📍 ' : '📁 '} {e.name} ({e.type})
                </option>
              ))}
            </select>
          </div>

          {/* Org Mode: Hierarchical vs Matriciel */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Type de Consolidation</label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrgMode('hierarchique');
                  setSelectedCell(null);
                }}
                className={`py-1.5 text-center font-bold rounded-md transition-all text-[10px] ${
                  selectedOrgMode === 'hierarchique' 
                    ? 'bg-white text-indigo-650 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Hiérarchique (Strict)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrgMode('matriciel');
                  setSelectedCell(null);
                }}
                className={`py-1.5 text-center font-bold rounded-md transition-all text-[10px] ${
                  selectedOrgMode === 'matriciel' 
                    ? 'bg-white text-indigo-650 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Consolidation incluant les double-rattachements et liaisons matricielles transverses"
              >
                Matriciel (Transverse)
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Catégorie Thématique</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedCell(null);
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer text-xs"
            >
              <option value="all">Toutes les catégories</option>
              {tenantConfig.categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Temporal / Exercise filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider block">Période Temporelle GRC</label>
            <div className="flex gap-2">
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedCell(null);
                }}
                className="flex-1 bg-indigo-50/50 border border-indigo-100 text-indigo-900 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold cursor-pointer text-xs"
              >
                <option value="all">Toutes les années</option>
                <option value="2025">Année 2025</option>
                <option value="2026">Année 2026</option>
                <option value="2027">Année 2027</option>
              </select>
              
              <select
                value={selectedPeriodicity}
                onChange={(e) => {
                  setSelectedPeriodicity(e.target.value);
                  setSelectedCell(null);
                }}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer text-xs"
              >
                <option value="all">Annuel</option>
                <option value="month">Mensuel</option>
                <option value="trimester">Trimestriel</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic sub temporal filters if active */}
        {selectedPeriodicity !== 'all' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 items-center bg-slate-50/55 p-3 rounded-lg animate-fade-in">
            <span className="text-[10px] font-bold text-indigo-650 uppercase">Configuration Sub-période :</span>
            
            {selectedPeriodicity === 'month' && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Mois de l'exercice :</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(parseInt(e.target.value));
                    setSelectedCell(null);
                  }}
                  className="bg-white border border-slate-250 text-slate-700 rounded px-2.5 py-1 text-xs font-bold cursor-pointer"
                >
                  {[
                    { v: 1, l: 'Janvier' }, { v: 2, l: 'Février' }, { v: 3, l: 'Mars' }, { v: 4, l: 'Avril' },
                    { v: 5, l: 'Mai' }, { v: 6, l: 'Juin' }, { v: 7, l: 'Juillet' }, { v: 8, l: 'Août' },
                    { v: 9, l: 'Septembre' }, { v: 10, l: 'Octobre' }, { v: 11, l: 'Novembre' }, { v: 12, l: 'Décembre' }
                  ].map(m => (
                    <option key={m.v} value={m.v}>{m.l}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedPeriodicity === 'trimester' && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Trimestre :</span>
                <select
                  value={selectedTrimester}
                  onChange={(e) => {
                    setSelectedTrimester(parseInt(e.target.value));
                    setSelectedCell(null);
                  }}
                  className="bg-white border border-slate-250 text-slate-700 rounded px-2.5 py-1 text-xs font-bold cursor-pointer"
                >
                  <option value={1}>Trimestre 1 (Jan-Mar)</option>
                  <option value={2}>Trimestre 2 (Avr-Jun)</option>
                  <option value={3}>Trimestre 3 (Jul-Sep)</option>
                  <option value={4}>Trimestre 4 (Oct-Déc)</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bento Row of KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow transition-all">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Volume de Risques</span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900 leading-tight">{totalRisks}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                totalRisks <= totalRisksPrev 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {totalRisks <= totalRisksPrev ? '↓' : '↑'} vs {totalRisksPrev}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Menaces référencées actives</p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-indigo-650 rounded-lg flex items-center justify-center border border-indigo-100 shadow-xs shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow transition-all">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Exposition Net Moyenne</span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-indigo-650 leading-tight">{avgResidualScore}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                avgResidualScore <= avgResidualScorePrev 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {avgResidualScore <= avgResidualScorePrev ? '↓' : '↑'} vs {avgResidualScorePrev}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Gravité résiduelle consolidée</p>
          </div>
          <div className="w-11 h-11 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center border border-teal-100 shadow-xs shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow transition-all">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Taux d'Avancement GRC</span>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-emerald-600 leading-tight">{actionCompletionRate}%</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                actionCompletionRate >= actionCompletionRatePrev 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {actionCompletionRate >= actionCompletionRatePrev ? '↑' : '↓'} vs {actionCompletionRatePrev}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500">{completedActions}/{totalActions} actions clôturées</p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100 shadow-xs shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow transition-all">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Alertes Critiques Rouges</span>
            <p className="text-3xl font-black text-red-600 leading-tight">{criticalRisksCount}</p>
            <p className="text-[10px] text-slate-500">Risques à haute criticité</p>
          </div>
          <div className="w-11 h-11 bg-red-50 text-red-650 rounded-lg flex items-center justify-center border border-red-100 shadow-xs shrink-0 animate-bounce">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Analysis Hub: Matrix (Left) + Selected Cell Risks List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Interactive Matrix Heatmap */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Layers className="w-4.5 h-4.5 text-indigo-600" />
                Matrice Décisionnelle des Risques
              </h3>
              <p className="text-[10.5px] text-slate-400">
                Mise à jour automatique. Cliquez sur une cellule pour voir les détails opérationnels.
              </p>
            </div>

            {/* Matrix Type Toggle */}
            <div className="flex p-0.5 bg-slate-100 rounded-lg border">
              <button
                type="button"
                onClick={() => {
                  setMatrixType('brut');
                  setSelectedCell(null);
                }}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  matrixType === 'brut' 
                    ? 'bg-white text-slate-800 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Brute (Fréquence x Impact)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMatrixType('residuel');
                  setSelectedCell(null);
                }}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  matrixType === 'residuel' 
                    ? 'bg-white text-slate-800 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Résiduelle (Brute x Maîtrise)
              </button>
            </div>
          </div>

          {/* Matrix rendering */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-4">
            
            {/* Matrix Heatmap Grid */}
            <div className="space-y-1.5 pt-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase text-center select-none tracking-widest mb-2">
                {matrixType === 'brut' ? '▲ Fréquence / Probabilité (Y)' : '▲ Gravité Brute Équivalente (Y)'}
              </p>

              {freqValues.map((f) => (
                <div key={f} className="flex items-stretch">
                  {/* Y Axis Label */}
                  <div className="w-24 shrink-0 flex items-center pr-3 text-right justify-end font-bold text-slate-500 text-[10px] leading-tight select-none">
                    {matrixType === 'brut' 
                      ? (tenantConfig.scales.frequency.find(item => item.value === f)?.label || `Niveau ${f}`)
                      : `Palier Brut ${f}`}
                  </div>
                  
                  {/* Grid cells */}
                  <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
                    {impactValues.map((i) => {
                      const cellsCount = getRisksInCell(f, i, matrixType).length;
                      const isSelected = selectedCell && selectedCell.y === f && selectedCell.x === i;
                      const cellCrit = getCellCriticality(f, i, matrixType);
                      const styles = getVibrantColors(cellCrit.label);

                      return (
                        <div
                          key={i}
                          onClick={() => handleCellClick(f, i)}
                          style={{ 
                            backgroundColor: styles.bg,
                            borderColor: isSelected ? '#4F46E5' : styles.border,
                            color: styles.text
                          }}
                          className={`h-14 flex flex-col items-center justify-center border rounded-lg cursor-pointer transition-all relative select-none hover:scale-[1.02] ${
                            isSelected ? 'ring-4 ring-indigo-500 ring-offset-1 scale-98 shadow-md z-10 font-bold' : 'hover:shadow-xs'
                          }`}
                        >
                          <span className="absolute top-1 left-1.5 font-mono text-[8px] opacity-40 font-black">
                            {matrixType === 'brut' ? `F${f}, I${i}` : `B${f}, M${i}`}
                          </span>

                          {cellsCount > 0 ? (
                            <div 
                              style={{ backgroundColor: cellCrit.textColor }} 
                              className="w-6 h-6 rounded-full text-white font-extrabold flex items-center justify-center shadow-sm border border-white/20 text-[11px] animate-pulse"
                            >
                              {cellsCount}
                            </div>
                          ) : (
                            <span className="opacity-30 text-[10px]">-</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* X Axis bottom labels */}
              <div className="flex pt-2">
                <div className="w-24 shrink-0"></div>
                <div className="flex-1 grid gap-1.5 text-center font-bold text-slate-500 text-[10px]" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
                  {impactValues.map((i) => (
                    <div key={i} className="pt-1 select-none leading-none truncate">
                      <p className="text-slate-700 font-mono text-[10px] font-black">
                        {matrixType === 'brut' ? `I = ${i}` : `Maîtrise = ${i}`}
                      </p>
                      <p className="text-[8px] text-slate-400 font-normal truncate mt-0.5">
                        {matrixType === 'brut' 
                          ? (tenantConfig.scales.impact.find(item => item.value === i)?.label || `Impact ${i}`)
                          : (tenantConfig.scales.control?.find(item => item.value === i)?.label || `Contrôle ${i}`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[9px] font-bold text-slate-400 uppercase text-center select-none tracking-widest mt-4">
                {matrixType === 'brut' ? '◀ Impact / Gravité (X) ▶' : '◀ Niveau d\'efficacité de Maîtrise (X) ▶'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: List of Risks inside Selected Cell / Overall Top list if none selected */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between">
                <span>
                  {selectedCell 
                    ? `Risques dans la Cellule [${matrixType === 'brut' ? `F${selectedCell.y}, I${selectedCell.x}` : `B${selectedCell.y}, M${selectedCell.x}`}]`
                    : 'Aperçu des Risques Actifs'}
                </span>
                {selectedCell && (
                  <button 
                    onClick={() => setSelectedCell(null)}
                    className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold"
                  >
                    Effacer filtre
                  </button>
                )}
              </h3>
              <p className="text-[10.5px] text-slate-400 mt-1">
                {selectedCell 
                  ? `Il y a ${cellRisks.length} risque(s) correspondant à cette criticité.`
                  : `Visualisez les risques consolidés (${filteredRisks.length} au total).`}
              </p>
            </div>

            {/* List of Risks */}
            <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
              {(selectedCell ? cellRisks : filteredRisks).length === 0 ? (
                <div className="py-12 text-center text-slate-450 space-y-2">
                  <Info className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-[11px]">Aucun risque référencé</p>
                  <p className="text-[10px] text-slate-400">Ajustez vos filtres ou sélectionnez une autre cellule de la matrice.</p>
                </div>
              ) : (
                (selectedCell ? cellRisks : filteredRisks).map(r => {
                  const crit = getCriticality(r.scoreResiduel);
                  const isSelected = selectedRiskId === r.id;

                  return (
                    <div 
                      key={r.id}
                      onClick={() => setSelectedRiskId(r.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2 ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/20 shadow-xs' 
                          : 'border-slate-150 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-[9px] text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded">
                            {r.id}
                          </span>
                          <span className="text-[9.5px] text-slate-400 ml-2 font-medium">
                            {tenantConfig.categories.find(c => c.id === r.categoryId)?.name || 'Inconnu'}
                          </span>
                        </div>

                        <span 
                          style={{ backgroundColor: crit.color, color: crit.textColor }}
                          className="px-2 py-0.5 rounded text-[9px] font-bold shrink-0 border border-white/10"
                        >
                          Index Net: {r.scoreResiduel}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-[11px] hover:text-indigo-650">
                        {r.title}
                      </h4>

                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>F:{r.frequencyValue} | I:{r.impactValue} | M:{r.controlValue}</span>
                        <span className="text-[10.5px] font-bold text-indigo-600">Voir détails →</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Sélectionnez un risque pour lancer l'audit de détails multi-niveau.</span>
          </div>
        </div>
      </div>

      {/* Multi-level Drill-down Panel (Renders when a Risk is selected) */}
      {selectedRisk && (
        <div className="bg-white rounded-xl shadow-md border border-slate-250 p-6 space-y-6 animate-fade-in relative scroll-mt-6" id="risk-drilldown-panel">
          
          {/* Panel Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl border border-indigo-100 mt-1 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-xs text-indigo-650 bg-indigo-50 border border-indigo-200 rounded px-2.5 py-0.5">
                    ID RISQUE : {selectedRisk.id}
                  </span>
                  <span className="text-slate-400 font-semibold">•</span>
                  <span className="text-slate-600 font-bold text-xs uppercase">
                    Catégorie : {tenantConfig.categories.find(c => c.id === selectedRisk.categoryId)?.name || 'Inconnue'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                  {selectedRisk.title}
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Rapport consolidé pour la Direction Générale et Décisionnelle | Enregistré le {new Date(selectedRisk.createdAt).toLocaleDateString('fr-FR')} par <strong className="text-slate-600">{selectedRisk.createdBy}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedRiskId(null)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors shrink-0"
              title="Fermer le panneau de détails"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side: Evaluation & Calculations, History, Stepper */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Row 1: Description & Core Parameters */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description de la Menace</h4>
                <p className="text-slate-700 bg-slate-50/50 border rounded-lg p-3.5 text-xs leading-relaxed font-medium">
                  {selectedRisk.description || "Aucune description détaillée enregistrée pour ce risque."}
                </p>
              </div>

              {/* Row 2: Visual Step Evolution (Initiation & Workflow Stepper) */}
              <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-650" />
                  Évolution du Statut d'Initiation & Workflow de Validation
                </h4>
                
                {/* 5-Step Progress Stepper representing risk lifecycle */}
                <div className="pt-2">
                  <div className="flex items-center justify-between relative">
                    
                    {/* Stepper background track line */}
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0"></div>
                    
                    {/* Active track line overlay */}
                    <div 
                      className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 z-0 transition-all duration-500"
                      style={{ 
                        width: selectedRisk.statusId === 'Clôturé' ? '100%' : selectedRisk.statusId === 'Approuvé' ? '75%' : selectedRisk.statusId === 'Évalué' ? '50%' : selectedRisk.statusId === 'Identifié' ? '25%' : '0%' 
                      }}
                    ></div>

                    {/* Step 1: Brouillon */}
                    <div className="z-10 flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center border-4 border-white text-[10px] shadow-sm">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-[9.5px] font-bold text-slate-700 mt-1">Brouillon</span>
                      <span className="text-[8px] text-slate-400 font-mono">Initié</span>
                    </div>

                    {/* Step 2: Identifié */}
                    <div className="z-10 flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full font-extrabold flex items-center justify-center border-4 border-white text-[10px] shadow-sm transition-all ${
                        ['Identifié', 'Évalué', 'Approuvé', 'Clôturé'].includes(selectedRisk.statusId)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {['Évalué', 'Approuvé', 'Clôturé'].includes(selectedRisk.statusId) ? <Check className="w-3 h-3" /> : '2'}
                      </div>
                      <span className={`text-[9.5px] font-bold mt-1 ${['Identifié', 'Évalué', 'Approuvé', 'Clôturé'].includes(selectedRisk.statusId) ? 'text-slate-700' : 'text-slate-400'}`}>Identifié</span>
                      <span className="text-[8px] text-slate-400 font-mono">Consolidé</span>
                    </div>

                    {/* Step 3: Évalué */}
                    <div className="z-10 flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full font-extrabold flex items-center justify-center border-4 border-white text-[10px] shadow-sm transition-all ${
                        ['Évalué', 'Approuvé', 'Clôturé'].includes(selectedRisk.statusId)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {['Approuvé', 'Clôturé'].includes(selectedRisk.statusId) ? <Check className="w-3 h-3" /> : '3'}
                      </div>
                      <span className={`text-[9.5px] font-bold mt-1 ${['Évalué', 'Approuvé', 'Clôturé'].includes(selectedRisk.statusId) ? 'text-slate-700' : 'text-slate-400'}`}>Évalué</span>
                      <span className="text-[8px] text-slate-400 font-mono">Coté</span>
                    </div>

                    {/* Step 4: Approuvé */}
                    <div className="z-10 flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full font-extrabold flex items-center justify-center border-4 border-white text-[10px] shadow-sm transition-all ${
                        ['Approuvé', 'Clôturé'].includes(selectedRisk.statusId)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {['Clôturé'].includes(selectedRisk.statusId) ? <Check className="w-3 h-3" /> : '4'}
                      </div>
                      <span className={`text-[9.5px] font-bold mt-1 ${['Approuvé', 'Clôturé'].includes(selectedRisk.statusId) ? 'text-emerald-600' : 'text-slate-400'}`}>Approuvé</span>
                      <span className="text-[8px] text-slate-400 font-mono">Validé DG</span>
                    </div>

                    {/* Step 5: Traité / Clôturé */}
                    <div className="z-10 flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full font-extrabold flex items-center justify-center border-4 border-white text-[10px] shadow-sm transition-all ${
                        selectedRisk.statusId === 'Clôturé'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}>
                        {selectedRisk.statusId === 'Clôturé' ? <Check className="w-3 h-3" /> : '5'}
                      </div>
                      <span className={`text-[9.5px] font-bold mt-1 ${selectedRisk.statusId === 'Clôturé' ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}`}>Sous-contrôle</span>
                      <span className="text-[8px] text-slate-400 font-mono">Clôturé</span>
                    </div>

                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-2 text-[10.5px] text-slate-500 leading-relaxed mt-2">
                  <Info className="w-4 h-4 text-indigo-650 shrink-0 mt-0.5" />
                  <p>
                    L'évolution du statut d'initiation certifie la chaîne d'évaluation de la menace. Un risque reste en statut de consolidation jusqu'à ce qu'un plan de maîtrise soit validé par la Direction Générale et le Risk Manager.
                  </p>
                </div>
              </div>

              {/* Row 3: History / Audit Trail of Evaluations */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Historique d'Évaluation & Piste d'Audit</h4>
                
                <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Opérateur</th>
                        <th className="py-2.5 px-3">Action GRC effectuée</th>
                        <th className="py-2.5 px-3">Commentaire d'évaluation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedRisk.history && selectedRisk.history.length > 0 ? (
                        selectedRisk.history.map((hist, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 text-[11px] text-slate-600">
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(hist.date).toLocaleDateString('fr-FR')} à {new Date(hist.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 font-bold flex items-center gap-1">
                              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                              {hist.user}
                            </td>
                            <td className="py-2.5 px-3 text-indigo-600 font-semibold">
                              {hist.action}
                            </td>
                            <td className="py-2.5 px-3 italic text-slate-500 leading-snug">
                              "{hist.comment || 'Aucun commentaire apporté'}"
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 px-3 text-center text-slate-400 italic">
                            Aucun événement historique enregistré pour ce risque.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right side: Numerical calculations & attached action plans */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Rating Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-5 border border-slate-800 space-y-4 shadow-md">
                <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Moteur de Cotation Analytique</h4>
                
                <div className="space-y-3 font-medium">
                  {/* Calculation Details */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Fréquence / Probabilité (F) :</span>
                    <strong className="text-slate-100 font-mono text-xs">{selectedRisk.frequencyValue} / {size}</strong>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Impact de la Menace (I) :</span>
                    <strong className="text-slate-100 font-mono text-xs">{selectedRisk.impactValue} / {size}</strong>
                  </div>

                  <div className="border-t border-indigo-900/50 pt-2.5 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Gravité Brute Intermédiaire :</span>
                    <strong className="text-slate-100 font-bold font-mono">F x I = {selectedRisk.scoreBrut}</strong>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Coeff d'Efficacité de Maîtrise (M) :</span>
                    <strong className="text-slate-100 font-mono text-xs">x {selectedRisk.controlValue}</strong>
                  </div>

                  {/* Net Score Display */}
                  <div className="border-t border-indigo-900 pt-3 flex flex-col gap-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider">Gravité Résiduelle Nette (Note finale) :</span>
                      <span className="text-3xl font-black text-white leading-none font-mono">
                        {selectedRisk.scoreResiduel}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-slate-400">Classe d'évaluation :</span>
                      <span 
                        style={{ color: getCriticality(selectedRisk.scoreResiduel).textColor }}
                        className="text-[11px] font-extrabold uppercase tracking-wider"
                      >
                        {getCriticality(selectedRisk.scoreResiduel).label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-950/60 rounded-lg p-3 border border-indigo-900/50 text-[10px] text-indigo-200 leading-relaxed font-medium">
                  <strong>Moteur IFACI :</strong> Le score d'exposition finale (Résiduelle) est calculé par la formule <code>{tenantConfig.formula?.expression || 'ScoreBrut * CoeffMaîtrise'}</code>. Un coefficient de maîtrise bas diminue le score résiduel final.
                </div>
              </div>

              {/* Attached Action Plans List */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Remédiation & Maîtrise active</span>
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[9.5px]">
                    {selectedRiskActions.length} action(s)
                  </span>
                </h4>

                <div className="space-y-3">
                  {selectedRiskActions.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 italic text-[11px]">
                      Aucun plan de remédiation actif défini pour ce risque.
                    </div>
                  ) : (
                    selectedRiskActions.map(action => (
                      <div 
                        key={action.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 hover:border-slate-350 hover:shadow-xs transition-all font-medium"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            action.priority === 'Critique' || action.priority === 'Haute'
                              ? 'bg-red-50 text-red-650 border border-red-100'
                              : 'bg-slate-100 text-slate-600 border'
                          }`}>
                            Prio : {action.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            action.status === 'Réalisé'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : action.status === 'En cours'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'bg-slate-100 text-slate-500 border'
                          }`}>
                            {action.status}
                          </span>
                        </div>

                        <h5 className="font-bold text-slate-900 text-[11.5px] leading-snug">
                          {action.title}
                        </h5>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                            <span>Avancement</span>
                            <span className="font-mono">{action.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${action.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-50">
                          <span>Resp : <strong>{action.ownerName}</strong></span>
                          <span>Échéance : <strong>{new Date(action.dueDate).toLocaleDateString('fr-FR')}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
