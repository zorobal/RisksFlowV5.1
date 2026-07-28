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
  ListFilter,
  PieChart,
  BarChart3,
  Printer,
  Sliders,
  Loader2,
  Image as ImageIcon,
  Search
} from 'lucide-react';
import { Risk, TenantConfig, ActionPlan, OrgEntity } from '../types';
import { getCriticalityFromThresholds, getThresholdColorStyles, COLOR_PRESETS, generateDefaultThresholds } from '../utils/riskUtils';
import OrgEntityTreeFilter from './OrgEntityTreeFilter';

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

  // Search filter for active risks panel
  const [riskSearchQuery, setRiskSearchQuery] = useState<string>('');

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
      const selectedCatObj = (tenantConfig.categories || []).find(c => c.id === selectedCategoryId || c.name === selectedCategoryId);
      const matchCat = selectedCategoryId === 'all' || 
                       r.categoryId === selectedCategoryId || 
                       (selectedCatObj && (r.categoryId === selectedCatObj.name || r.categoryId === selectedCatObj.id));
      const matchTime = matchPeriod(r.createdAt, selectedYear, selectedPeriodicity, selectedMonth, selectedTrimester, selectedStartMonth, selectedEndMonth);
      return matchCat && matchTime;
    });
  }, [orgFilteredRisks, selectedCategoryId, selectedYear, selectedPeriodicity, selectedMonth, selectedTrimester, selectedStartMonth, selectedEndMonth, tenantConfig.categories]);

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
    return getCriticalityFromThresholds(score, tenantConfig.matrixThresholds || []);
  };

  const criticalRisksCount = useMemo(() => {
    return filteredRisks.filter(r => {
      const label = getCriticality(r.scoreResiduel).label.toLowerCase();
      return label.includes('élevé') || label.includes('catastrophique') || label.includes('critique') || label.includes('significatif');
    }).length;
  }, [filteredRisks]);

  // Criticality Breakdown
  const criticalityCounts = useMemo(() => {
    return (tenantConfig.matrixThresholds || []).map(t => {
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

  const resolveCategoryName = (catId?: string) => {
    if (!catId) return 'Inconnue';
    const found = (tenantConfig.categories || []).find(c => c.id === catId || c.name === catId || c.name.toLowerCase() === catId.toLowerCase());
    return found?.name || catId || 'Inconnue';
  };

  // Categories Breakdown
  const categoryCounts = useMemo(() => {
    return (tenantConfig.categories || []).map(cat => {
      const count = filteredRisks.filter(r => 
        r.categoryId === cat.id || 
        r.categoryId === cat.name || 
        (r.categoryId && cat.name && r.categoryId.toLowerCase() === cat.name.toLowerCase())
      ).length;
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

  // 1. Entity Breakdown (Risques par Unité - Pie / Donut Chart Data)
  const entityBreakdown = useMemo(() => {
    if (totalRisks === 0) return [];
    const map = new Map<string, { id: string; code: string; name: string; count: number }>();

    filteredRisks.forEach(r => {
      const entId = r.entityId || 'unassigned';
      const entObj = tenantConfig.entities.find(e => e.id === entId);
      const entCode = entObj?.code || entObj?.name || (entId === 'unassigned' ? 'N/A' : entId);
      const entName = entObj ? entObj.name : (entId === 'unassigned' ? 'Non affecté / Unité inconnue' : entId);

      if (!map.has(entId)) {
        map.set(entId, { id: entId, code: entCode, name: entName, count: 0 });
      }
      map.get(entId)!.count += 1;
    });

    const palette = [
      '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#06B6D4', '#14B8A6', '#F97316', '#3B82F6'
    ];

    const items = Array.from(map.values()).sort((a, b) => b.count - a.count);
    let accumulatedAngle = 0;

    return items.map((item, idx) => {
      const percentage = Number(((item.count / totalRisks) * 100).toFixed(1));
      const angle = (item.count / totalRisks) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;

      return {
        ...item,
        percentage,
        color: palette[idx % palette.length],
        startAngle,
        angle
      };
    });
  }, [filteredRisks, tenantConfig.entities, totalRisks]);

  // 2. Strategic Decision Chart 1: Attenuation & Control Efficiency (Score Brut vs Score Résiduel par Catégorie)
  const categoryControlImpact = useMemo(() => {
    return (tenantConfig.categories || []).map(cat => {
      const catRisks = filteredRisks.filter(r => 
        r.categoryId === cat.id || 
        r.categoryId === cat.name || 
        (r.categoryId && cat.name && r.categoryId.toLowerCase() === cat.name.toLowerCase())
      );
      const count = catRisks.length;
      const avgBrut = count > 0 ? Number((catRisks.reduce((sum, r) => sum + r.scoreBrut, 0) / count).toFixed(1)) : 0;
      const avgResiduel = count > 0 ? Number((catRisks.reduce((sum, r) => sum + r.scoreResiduel, 0) / count).toFixed(1)) : 0;
      const reductionPercent = avgBrut > 0 ? Math.round(((avgBrut - avgResiduel) / avgBrut) * 100) : 0;

      return {
        id: cat.id,
        name: cat.name,
        color: cat.color || '#6366F1',
        count,
        avgBrut,
        avgResiduel,
        reductionPercent
      };
    }).filter(c => c.count > 0);
  }, [filteredRisks, tenantConfig.categories]);

  // 3. Strategic Decision Chart 2: Remediation & Action Plan Coverage by Criticality Level
  const criticalityActionCoverage = useMemo(() => {
    return (tenantConfig.matrixThresholds || []).map(t => {
      const levelRisks = filteredRisks.filter(r => getCriticality(r.scoreResiduel).label === t.label);
      const totalCount = levelRisks.length;
      
      const withActionsCount = levelRisks.filter(r => actions.some(a => a.riskId === r.id)).length;
      const coveredPercent = totalCount > 0 ? Math.round((withActionsCount / totalCount) * 100) : 0;
      
      const levelActions = actions.filter(a => levelRisks.some(r => r.id === a.riskId));
      const completedActionsCount = levelActions.filter(a => a.status === 'Réalisé').length;
      const actionProgressAvg = levelActions.length > 0 
        ? Math.round(levelActions.reduce((acc, a) => acc + (a.progress || 0), 0) / levelActions.length)
        : 0;

      return {
        label: t.label,
        color: t.color,
        textColor: t.textColor,
        totalCount,
        withActionsCount,
        orphanCount: totalCount - withActionsCount,
        coveredPercent,
        totalActionsCount: levelActions.length,
        completedActionsCount,
        actionProgressAvg
      };
    });
  }, [filteredRisks, tenantConfig.matrixThresholds, actions]);

  // 4. Strategic Chart: Unit vs Criticality Thresholds (X-axis: Units, Y-axis: Criticality Thresholds)
  const unitCriticalityBreakdown = useMemo(() => {
    const thresholds = tenantConfig.matrixThresholds || [];

    const entityMap = new Map<string, {
      id: string;
      code: string;
      name: string;
      total: number;
      maxScore: number;
      avgScore: number;
      levelCounts: { label: string; color: string; textColor: string; count: number }[];
    }>();

    filteredRisks.forEach(r => {
      const entId = r.entityId || 'unassigned';
      const entObj = tenantConfig.entities.find(e => e.id === entId);
      const entCode = entObj?.code || entObj?.name || (entId === 'unassigned' ? 'N/A' : entId);
      const entName = entObj ? entObj.name : (entId === 'unassigned' ? 'Non affecté' : entId);

      if (!entityMap.has(entId)) {
        entityMap.set(entId, {
          id: entId,
          code: entCode,
          name: entName,
          total: 0,
          maxScore: 0,
          avgScore: 0,
          levelCounts: thresholds.map(t => ({
            label: t.label,
            color: t.color,
            textColor: t.textColor,
            count: 0
          }))
        });
      }

      const item = entityMap.get(entId)!;
      item.total += 1;
      item.maxScore = Math.max(item.maxScore, r.scoreResiduel);

      const crit = getCriticality(r.scoreResiduel);
      const levelObj = item.levelCounts.find(l => l.label === crit.label);
      if (levelObj) {
        levelObj.count += 1;
      }
    });

    return Array.from(entityMap.values()).map(item => {
      const entRisks = filteredRisks.filter(r => (r.entityId || 'unassigned') === item.id);
      const sum = entRisks.reduce((acc, r) => acc + r.scoreResiduel, 0);
      item.avgScore = item.total > 0 ? Number((sum / item.total).toFixed(1)) : 0;
      return item;
    }).sort((a, b) => b.total - a.total);
  }, [filteredRisks, tenantConfig.entities, tenantConfig.matrixThresholds]);

  // 5. Strategic Chart: Unit vs Risk Categories Breakdown (X-axis: Units, Sub-bars / Stacked: Categories with %, counts, and legend)
  const unitCategoryBreakdown = useMemo(() => {
    const categories = tenantConfig.categories || [];
    const catPalette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#F97316'];

    const catWithColor = categories.map((cat, idx) => ({
      ...cat,
      color: cat.color || catPalette[idx % catPalette.length]
    }));

    const entityMap = new Map<string, {
      id: string;
      code: string;
      name: string;
      total: number;
      catCounts: { id: string; name: string; color: string; count: number; percentage: number }[];
    }>();

    filteredRisks.forEach(r => {
      const entId = r.entityId || 'unassigned';
      const entObj = tenantConfig.entities.find(e => e.id === entId);
      const entCode = entObj?.code || entObj?.name || (entId === 'unassigned' ? 'N/A' : entId);
      const entName = entObj ? entObj.name : (entId === 'unassigned' ? 'Non affecté' : entId);

      if (!entityMap.has(entId)) {
        entityMap.set(entId, {
          id: entId,
          code: entCode,
          name: entName,
          total: 0,
          catCounts: catWithColor.map(c => ({
            id: c.id,
            name: c.name,
            color: c.color,
            count: 0,
            percentage: 0
          }))
        });
      }

      const item = entityMap.get(entId)!;
      item.total += 1;

      const catObj = item.catCounts.find(c => 
        c.id === r.categoryId || 
        c.name === r.categoryId || 
        (r.categoryId && c.name && r.categoryId.toLowerCase() === c.name.toLowerCase())
      );
      if (catObj) {
        catObj.count += 1;
      }
    });

    return Array.from(entityMap.values()).map(item => {
      item.catCounts.forEach(c => {
        c.percentage = item.total > 0 ? Math.round((c.count / item.total) * 100) : 0;
      });
      return item;
    }).sort((a, b) => b.total - a.total);
  }, [filteredRisks, tenantConfig.entities, tenantConfig.categories]);

  // Matrix axes values
  const freqValues = Array.from({ length: size }, (_, i) => size - i); // e.g. 4, 3, 2, 1
  const impactValues = Array.from({ length: size }, (_, i) => i + 1); // e.g. 1, 2, 3, 4

  // Matrix Cell color functions
  const getVibrantColors = (critLabel: string) => {
    return getThresholdColorStyles(critLabel, tenantConfig.matrixThresholds);
  };

  // Helper to determine cell criticality label
  const getCellCriticality = (f: number, i: number, type: 'brut' | 'residuel') => {
    const cellRisks = getRisksInCell(f, i, type);
    if (cellRisks.length > 0) {
      const avgScore = cellRisks.reduce((sum, r) => sum + (type === 'brut' ? r.scoreBrut : r.scoreResiduel), 0) / cellRisks.length;
      return getCriticality(Math.round(avgScore));
    }

    if (type === 'brut') {
      const product = f * i;
      return getCriticality(product);
    } else {
      // Residual matrix score estimation for empty cells (f = Frequency 1..size, i = Control 1..size)
      const maxBrutForFreq = f * size;
      const mitigationFactor = (size - i + 1) / size;
      const estimatedResiduel = Math.max(1, Math.round(maxBrutForFreq * mitigationFactor));
      return getCriticality(estimatedResiduel);
    }
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

  // Dynamic GRC Markdown synthesis based on selected filters, chapters, sections and paragraphs
  const handleExportMarkdown = () => {
    const dateStr = new Date().toLocaleDateString('fr-FR');
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const entityName = selectedEntityId === 'all' 
      ? 'Tous les périmètres (Périmètre Global Groupe)' 
      : (tenantConfig.entities.find(e => e.id === selectedEntityId)?.name || 'Inconnu');

    const catName = selectedCategoryId === 'all'
      ? 'Toutes les catégories thématiques'
      : (tenantConfig.categories.find(c => c.id === selectedCategoryId)?.name || 'Inconnu');

    const modeLabel = selectedOrgMode === 'hierarchique' 
      ? 'Hiérarchique strict (ligne directe)' 
      : 'Matriciel (incluant les rattachements secondaires et double-lignes)';

    const periodLabel = selectedPeriodicity === 'all' 
      ? `Exercice global ${selectedYear}`
      : selectedPeriodicity === 'month'
      ? `Exercice ${selectedYear} — Mois ${selectedMonth}`
      : selectedPeriodicity === 'trimester'
      ? `Exercice ${selectedYear} — Trimestre ${selectedTrimester}`
      : `Exercice ${selectedYear} — Intervalle mois ${selectedStartMonth} à ${selectedEndMonth}`;

    let mdContent = `# RAPPORT DE SYNTHÈSE STRATÉGIQUE ET DÉCISIONNELLE GRC
---
**Société / Organisation :** ${tenantConfig.companyName}
**Destinataires :** Direction Générale, Comité des Risques et Décideurs Stratégiques
**Date d'émission :** ${dateStr} à ${timeStr}
**Document Référence :** RAP-GRC-${selectedYear}-${Date.now().toString().slice(-4)}

---

## CHAPITRE 1 : PÉRIMÈTRE ET CONTEXTE DE L'ÉVALUATION

### Section 1.1 : Filtres d'Analyse Actifs
Le présent rapport est établi à partir des données réelles de la cartographie des risques consolidées en BDD selon la configuration de filtres suivante :
* **Unité / Périmètre Organisationnel :** **${entityName}**
* **Mode de Consolidation :** **${modeLabel}**
* **Catégorie Thématique Filtre :** **${catName}**
* **Exercice et Période Temporelle :** **${periodLabel}**

### Section 1.2 : Cadre Méthodologique et Moteur de Cotation
Les évaluations de risques reposent sur la méthodologie standard IFACI / COSO GRC. La gravité brute d'un risque est déterminée par le produit de sa Fréquence (*F*) par son Impact (*I*). La gravité résiduelle (score net) prend en compte le Coefficient d'Efficacité de Maîtrise (*M*) selon la formule configurée : \`${tenantConfig.formula?.expression || 'ScoreBrut * CoeffMaîtrise'}\`.

---

## CHAPITRE 2 : SYNTHÈSE EXÉCUTIVE ET INDICATEURS MAJEURS (KPIS)

### Section 2.1 : Tableau de Bord des Métriques Clés
Les métriques consolidees du périmètre actif s'établissent comme suit :

1. **Volume Global de Risques Actifs :** **${totalRisks}** risque(s) répertorié(s) (vs **${totalRisksPrev}** sur la période comparée précédente).
2. **Indice d'Exposition Nette Moyenne (Gravité Résiduelle) :** **${avgResidualScore}** / 100 (vs **${avgResidualScorePrev}** précédemment).
3. **Taux Globale d'Avancement des Plans de Remédiation :** **${actionCompletionRate}%** d'exécution (vs **${actionCompletionRatePrev}%** précédemment).
4. **Volume d'Alertes Critiques Rouges :** **${criticalRisksCount}** risque(s) au-dessus des seuils de tolérance exigibles.

### Section 2.2 : Analyse Paragraphe des Tendances Temporelles
* **Évolution de la Gravité Résiduelle :** ${
      avgResidualScore < avgResidualScorePrev 
        ? `Tendance favorable. L'indice net moyen a baissé de **${Number((avgResidualScorePrev - avgResidualScore).toFixed(1))}** points grâce au renforcement des contrôles.`
        : avgResidualScore === avgResidualScorePrev
        ? `Stabilisation constatée. L'exposition résiduelle nette est identique entre les deux exercices.`
        : `Augmentation de l'exposition globale de **${Number((avgResidualScore - avgResidualScorePrev).toFixed(1))}** points. Des menaces émergentes nécessitent des ajustements de contrôle.`
    }
* **Exécution des Initiatives de Remédiation :** ${
      actionCompletionRate >= actionCompletionRatePrev
        ? `Progression satisfaisante avec une hausse de **${actionCompletionRate - actionCompletionRatePrev}%** du taux de réalisation.`
        : `Ralentissement constaté (-**${actionCompletionRatePrev - actionCompletionRate}%**). Les managers doivent être relancés sur les plans en retard.`
    }

---

## CHAPITRE 3 : VENTILATION ET DISTRIBUTION DES RISQUES PAR UNITÉ / ENTITÉ

### Section 3.1 : Répartition des Risques par Unité Organisationnelle (Effectif & Pourcentage)

| Unité / Entité | Nombre de Risques | Pourcentage du Volume Global |
| :--- | :---: | :---: |
${
  entityBreakdown.length === 0 
    ? '| Aucune donnée | 0 | 0% |'
    : entityBreakdown.map(e => `| **${e.name}** | **${e.count}** | **${e.percentage}%** |`).join('\n')
}

### Section 3.2 : Synthèse Paragraphe sur la Concentration Opérationnelle
${
  entityBreakdown.length > 0 
    ? `L'unité principale **${entityBreakdown[0].name}** concentre **${entityBreakdown[0].count}** risques, soit **${entityBreakdown[0].percentage}%** de l'ensemble du périmètre filtré. La Direction doit s'assurer que les ressources d'audit et de contrôle sont proportionnellement allouées à cette entité.`
    : `Aucun risque n'est répertorié dans cette sélection.`
}

---

## CHAPITRE 4 : PROFIL DE CRITICITÉ ET SEUILS PAR UNITÉ (AXE X: UNITÉS / AXE Y: SEUILS DE CRITICITÉ)

### Section 4.1 : Inscription des Effectifs de Risques par Seuil et par Unité Organisationnelle

| Unité / Entité (Axe X) | Total Risques | Score Net Moyen | Score Max | ${(tenantConfig.matrixThresholds || []).map(t => t.label).join(' | ')} |
| :--- | :---: | :---: | :---: | ${(tenantConfig.matrixThresholds || []).map(() => ':---:').join(' | ')} |
${
  unitCriticalityBreakdown.length === 0
    ? '| Aucune unité | 0 | 0 | 0 | ' + (tenantConfig.matrixThresholds || []).map(() => '0').join(' | ') + ' |'
    : unitCriticalityBreakdown.map(u => {
        const levelCols = u.levelCounts.map(l => `**${l.count}**`).join(' | ');
        return `| **${u.name}** | **${u.total}** | ${u.avgScore} | ${u.maxScore} | ${levelCols} |`;
      }).join('\n')
}

### Section 4.2 : Paragraphe d'Analyse de la Sensibilité par Unité
L'analyse croisée (Unités sur l'Axe X / Graduation de Criticité sur l'Axe Y) met en évidence la répartition effective des niveaux d'exposition. Chaque tranche de criticité est inscrite de manière explicite pour permettre à la Direction Générale d'identifier les poches de vulnérabilités majeures et d'allouer les ressources d'atténuation aux unités les plus exposées.

---

## CHAPITRE 5 : ANALYSE STRATÉGIQUE DE L'EFFICACITÉ DES CONTRÔLES PAR CATÉGORIE

### Section 5.1 : Répartition par Seuil de Criticité Global
${criticalityCounts.map(c => `* **${c.label} :** ${c.count} risque(s) (**${c.percentage}%**)`).join('\n')}

### Section 5.2 : Évaluation de l'Efficacité des Contrôles par Catégorie (Atténuation Brut vs Résiduel)

| Catégorie Thématique | Vol. Risques | Score Brut Moyen | Score Résiduel Moyen | Taux de Réduction |
| :--- | :---: | :---: | :---: | :---: |
${
  categoryControlImpact.length === 0 
    ? '| Aucune catégorie | 0 | 0 | 0 | 0% |'
    : categoryControlImpact.map(c => `| **${c.name}** | ${c.count} | ${c.avgBrut} | **${c.avgResiduel}** | **-${c.reductionPercent}%** |`).join('\n')
}

---

## CHAPITRE 6 : COUVERTURE DES PLANS D'ACTION ET TRAITEMENT DES RISQUES ORPHELINS

### Section 6.1 : Couverture des Risques par Niveau de Severity et Plans d'Action

| Niveau de Criticité | Volume Risques | Risques Couverts (≥1 action) | Risques Sans Action (Orphelins) | Taux de Couverture |
| :--- | :---: | :---: | :---: | :---: |
${
  criticalityActionCoverage.map(c => `| **${c.label}** | ${c.totalCount} | ${c.withActionsCount} | **${c.orphanCount}** | **${c.coveredPercent}%** |`).join('\n')
}

### Section 6.2 : Paragraphe d'Analyse des Risques Sans Plan de Remédiation
Les risques orphelins (ne bénéficiant d'aucune action de remédiation enregistrée) constituent un facteur d'insécurité prioritaire. Une relance systématique est programmée auprès des responsables d'entités pour garantir l'adjonction d'un plan d'action d'ici la prochaine échéance.

---

## CHAPITRE 7 : DOSSIERS PRIORITAIRES (TOP 5 DES RISQUES MAJEURS)

Les fiches ci-dessous récapitulent les 5 risques dont le score résiduel net est le plus préoccupant :

${
  topRisks.length === 0 
    ? "Aucun risque majeur répertorié dans ce périmètre." 
    : topRisks.map((r, index) => {
        const crit = getCriticality(r.scoreResiduel);
        const entObj = tenantConfig.entities.find(e => e.id === r.entityId);
        const entName = entObj ? entObj.name : r.entityId || 'Non spécifiée';
        const riskActions = actions.filter(a => a.riskId === r.id);

        return `### Section 7.${index + 1} : [${r.id}] ${r.title}
* **Unité Rattachée :** ${entName}
* **Catégorie :** ${resolveCategoryName(r.categoryId)}
* **Score Brut :** ${r.scoreBrut} | **Maîtrise :** x${r.controlValue} | **Score Résiduel Net :** **${r.scoreResiduel}** (${crit.label})
* **Description Détaillée :** ${r.description || 'Non renseignée.'}
* **Causes Origines :** ${r.causes || 'Non renseignées.'}
* **Conséquences Potentielles :** ${r.consequences || 'Non renseignées.'}
* **Plans de Remédiation Rattachés (${riskActions.length}) :**
${riskActions.length === 0 ? '  * *Aucun plan d\'action rattaché à ce jour.*' : riskActions.map(a => `  * **[${a.status}]** ${a.title} (Resp: ${a.ownerName}, Avancement: ${a.progress}%)`).join('\n')}
`;
      }).join('\n')
}

---

## CHAPITRE 8 : RECOMMANDATIONS STRATÉGIQUES ET PLAN D'ACTION DIRECTION

### Section 8.1 : Recommandations Immédiates pour la Direction
1. **Traitement Prioritaire des Risques Orphelins Critiques :** Exiger le raccordement immédiat d'un plan de remédiation pour tout risque de criticité Élevée/Critique ne disposant pas d'action attribuée.
2. **Revue des Coefficients de Maîtrise :** Diligenter un contrôle d'audit sur les entités affichant une forte réduction théorique pour valider la réalité opérationnelle des barrières de contrôle.
3. **Maintien du Cadence de Clôture :** Fixer un objectif de réalisation de minimum 85% d'avancement sur les plans d'actions majeurs d'ici la prochaine revue.

---
*Rapport d'évaluation décisionnelle exporté depuis Sogesti GRC. Document confidentiel réservé à la Direction.*
`;

    // Trigger file download
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GRC-Rapport-Decisionnel-${entityName.replace(/[^a-zA-Z0-9]/g, '_')}-${dateStr}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isExportingPNG, setIsExportingPNG] = useState<boolean>(false);

  const handleExportMatrixPNG = async () => {
    setIsExportingPNG(true);
    try {
      const { toPng } = await import('html-to-image');

      // Allow React to re-render matrix-decision-card with export header
      await new Promise(resolve => setTimeout(resolve, 250));

      const element = document.getElementById('matrix-decision-card');
      if (!element) {
        alert("Élément de la matrice introuvable.");
        setIsExportingPNG(false);
        return;
      }

      // Generate high-resolution PNG directly from the live DOM element
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        filter: (node: HTMLElement) => {
          if (node.classList && node.classList.contains('pdf-hide-action')) {
            return false;
          }
          return true;
        }
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      const sanitizedCompanyName = tenantConfig.companyName.replace(/[^a-zA-Z0-9]/g, '_');
      const link = document.createElement('a');
      link.download = `Matrice_Risques_${sanitizedCompanyName}_${matrixType}_${dateStr}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Erreur lors de l'exportation PNG :", err);
      alert("Une erreur s'est produite lors de la génération de l'image PNG.");
    } finally {
      setIsExportingPNG(false);
    }
  };

  const [exportingChartId, setExportingChartId] = useState<string | null>(null);

  const handleExportChartPNG = async (chartId: string, chartTitle: string) => {
    setExportingChartId(chartId);
    try {
      const { toPng } = await import('html-to-image');
      await new Promise(resolve => setTimeout(resolve, 150));
      const element = document.getElementById(chartId);
      if (!element) {
        alert("Graphique introuvable pour l'exportation.");
        setExportingChartId(null);
        return;
      }

      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        filter: (node: HTMLElement) => {
          if (node.classList && node.classList.contains('pdf-hide-action')) {
            return false;
          }
          return true;
        }
      });

      const sanitizedTitle = chartTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.download = `GRC_Graphe_${sanitizedTitle}_${dateStr}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onAddLog('Export PNG Graphique', `Exportation de l'image du graphique "${chartTitle}" au format PNG.`);
    } catch (err) {
      console.error("Erreur d'exportation PNG du graphique :", err);
      alert("Une erreur est survenue lors de l'exportation du graphique en PNG.");
    } finally {
      setExportingChartId(null);
    }
  };

  const renderExportPNGButton = (chartId: string, chartTitle: string) => (
    <button
      onClick={() => handleExportChartPNG(chartId, chartTitle)}
      disabled={exportingChartId === chartId}
      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-250 rounded-lg font-extrabold text-[10.5px] transition-all flex items-center gap-1.5 shadow-2xs pdf-hide-action cursor-pointer disabled:opacity-50 shrink-0"
      title="Exporter ce graphique au format image PNG Haute Définition"
    >
      <Download className={`w-3.5 h-3.5 ${exportingChartId === chartId ? 'animate-bounce text-indigo-400' : 'text-indigo-600 group-hover:text-white'}`} />
      <span>{exportingChartId === chartId ? 'Export...' : 'Exporter PNG'}</span>
    </button>
  );

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
          <div>
            <OrgEntityTreeFilter
              entities={tenantConfig.entities}
              selectedEntityId={selectedEntityId}
              onSelectEntity={(id) => {
                setSelectedEntityId(id);
                setSelectedCell(null);
              }}
              label="Entité & Périmètre"
              includeAllOption={true}
              allOptionLabel="Périmètre Global (Toutes les entités)"
            />
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
        <div id="matrix-decision-card" className="lg:col-span-7 bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          
          {/* Export Header rendered when generating image */}
          {isExportingPNG && (
            <div className="border-b-2 border-indigo-600 pb-4 mb-2 bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <span className="bg-indigo-600 text-white px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider font-mono">
                    GRC PLATFORM — EXPORTATION IMAGE DE LA MATRICE
                  </span>
                  <h1 className="text-xl font-black text-slate-900 mt-2 mb-1">
                    Matrice Décisionnelle des Risques — {tenantConfig.companyName}
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold">
                    Cartographie dynamique & Évaluation des seuils de criticité
                  </p>
                </div>
                {tenantConfig.logoUrl && (
                  <img src={tenantConfig.logoUrl} alt="Logo" className="h-12 max-w-[140px] object-contain rounded border border-slate-200 p-1" />
                )}
              </div>

              {/* Filter Description Box */}
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 mt-3">
                <h2 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5 border-b border-slate-200 pb-1">
                  Filtres d'Analyse Sélectionnés & Périmètre :
                </h2>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-800">
                  <div><strong className="text-slate-600">Entité / Périmètre :</strong> {selectedEntityId === 'all' ? 'Périmètre Global (Toutes les entités)' : (tenantConfig.entities.find(e => e.id === selectedEntityId)?.name || selectedEntityId)}</div>
                  <div><strong className="text-slate-600">Type de Consolidation :</strong> {selectedOrgMode === 'hierarchique' ? 'Hiérarchique (Strict)' : 'Matriciel (Transverse)'}</div>
                  <div><strong className="text-slate-600">Catégorie Thématique :</strong> {selectedCategoryId === 'all' ? 'Toutes les catégories' : (tenantConfig.categories.find(c => c.id === selectedCategoryId)?.name || selectedCategoryId)}</div>
                  <div><strong className="text-slate-600">Période Temporelle :</strong> {selectedYear === 'all' ? 'Toutes les années' : `Exercice ${selectedYear}`}{selectedPeriodicity === 'month' ? ` | Mensuel (${['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][selectedMonth - 1] || selectedMonth})` : selectedPeriodicity === 'trimester' ? ` | Trimestriel (T${selectedTrimester})` : ' | Annuel'}</div>
                  <div><strong className="text-slate-600">Type de Matrice :</strong> {matrixType === 'brut' ? 'Matrice Brute (Fréquence x Impact)' : 'Matrice Résiduelle (Brute x Maîtrise)'}</div>
                  <div><strong className="text-slate-600">Date d'Exportation :</strong> {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</div>
                </div>
              </div>
            </div>
          )}

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

            <div className="flex items-center gap-2">
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
                  Brute (F x I)
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
                  Résiduelle (B x M)
                </button>
              </div>

              {/* Export PNG Button for this block */}
              <button
                type="button"
                onClick={handleExportMatrixPNG}
                disabled={isExportingPNG}
                className="pdf-hide-action bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs hover:shadow active:scale-98 disabled:opacity-50 cursor-pointer"
                title="Exporter uniquement la Matrice Décisionnelle et ses Seuils/Graduations au format image PNG"
              >
                {isExportingPNG ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" />
                )}
                <span>{isExportingPNG ? 'Génération...' : 'Exporter PNG'}</span>
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

            {/* Graduation & Seuils de Criticité section */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  Graduation & Seuils de Criticité
                </h4>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                  Grille {size}x{size} ({matrixType === 'brut' ? 'Fréquence x Impact' : 'Matrice Résiduelle'})
                </span>
              </div>

              {/* 1. Graduation des Échelles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10.5px]">
                {/* Axe Y Scale Graduation */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                  <p className="font-extrabold text-indigo-900 text-[10px] uppercase tracking-wide flex items-center gap-1 border-b border-slate-100 pb-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    {matrixType === 'brut' ? 'Graduation Fréquence / Probabilité (Y)' : 'Graduation Gravité Brute (Y)'}
                  </p>
                  <div className="space-y-1">
                    {freqValues.map(f => {
                      const scaleItem = matrixType === 'brut' 
                        ? tenantConfig.scales.frequency.find(s => s.value === f) 
                        : { value: f, label: `Palier Brut ${f}`, description: `Sévérité brute équivalente ${f}` };
                      return (
                        <div key={f} className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <span className="font-mono font-bold text-indigo-700 text-[10px]">Niveau {f}</span>
                          <span className="font-bold text-slate-800">{scaleItem?.label || `Niveau ${f}`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Axe X Scale Graduation */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                  <p className="font-extrabold text-teal-900 text-[10px] uppercase tracking-wide flex items-center gap-1 border-b border-slate-100 pb-1">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    {matrixType === 'brut' ? 'Graduation Impact / Gravité (X)' : 'Graduation Niveau de Maîtrise (X)'}
                  </p>
                  <div className="space-y-1">
                    {impactValues.map(i => {
                      const scaleItem = matrixType === 'brut'
                        ? tenantConfig.scales.impact.find(s => s.value === i)
                        : tenantConfig.scales.control?.find(s => s.value === i);
                      return (
                        <div key={i} className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <span className="font-mono font-bold text-teal-700 text-[10px]">{matrixType === 'brut' ? `Impact ${i}` : `Contrôle ${i}`}</span>
                          <span className="font-bold text-slate-800">{scaleItem?.label || `Palier ${i}`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Seuils de Criticité & Matrice de Rangs */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <p className="font-extrabold text-slate-800 text-[10.5px] uppercase tracking-wide">
                    Seuils de Criticité & Répartition des Risques
                  </p>
                  <span className="text-[9.5px] font-semibold text-slate-400">Index de score & effectifs</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {(tenantConfig.matrixThresholds && tenantConfig.matrixThresholds.length > 0 
                    ? tenantConfig.matrixThresholds 
                    : generateDefaultThresholds(size, 4)
                  ).map((t, idx) => {
                    const count = filteredRisks.filter(r => getCriticality(r.scoreResiduel).label === t.label).length;
                    const colorStyle = getThresholdColorStyles(t.label, tenantConfig.matrixThresholds);
                    return (
                      <div 
                        key={idx} 
                        style={{ backgroundColor: colorStyle.bg, borderColor: colorStyle.border }}
                        className="p-2 rounded-md border flex flex-col justify-between space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ color: colorStyle.text }} className="font-black text-[11px]">
                            {t.label}
                          </span>
                          <span className="font-mono text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-white/90 shadow-2xs text-slate-800">
                            Score {t.minScore}-{t.maxScore}
                          </span>
                        </div>
                        {t.description && (
                          <p className="text-[9px] text-slate-600 line-clamp-2 leading-tight">
                            {t.description}
                          </p>
                        )}
                        <div className="pt-1 border-t border-black/5 flex justify-between items-center text-[9px] font-bold text-slate-700">
                          <span>Risques actifs :</span>
                          <span className="font-mono bg-white px-1.5 py-0.2 rounded border border-slate-300 font-black">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Export Footer rendered when generating image */}
            {isExportingPNG && (
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-medium bg-white">
                <span>Sogesti GRC Platform — Exportation Image PNG de la Matrice Décisionnelle</span>
                <span>Document Confidentiel — {tenantConfig.companyName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: List of Risks inside Selected Cell / Overall Top list if none selected */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4 h-full min-h-[580px]">
          <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
            {/* Title & Filter Header */}
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    {selectedCell 
                      ? `Risques Cellule [${matrixType === 'brut' ? `F${selectedCell.y}, I${selectedCell.x}` : `B${selectedCell.y}, M${selectedCell.x}`}]`
                      : 'Aperçu des Risques Actifs'}
                  </span>
                </h3>
                {selectedCell && (
                  <button 
                    type="button"
                    onClick={() => setSelectedCell(null)}
                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold transition-all border border-indigo-100"
                  >
                    Effacer filtre
                  </button>
                )}
              </div>
              <p className="text-[10.5px] text-slate-400 mt-1">
                {selectedCell 
                  ? `Il y a ${cellRisks.length} risque(s) dans cette cellule de criticité.`
                  : `Visualisation dynamique des risques consolidés dans cet espace (${filteredRisks.length} au total).`}
              </p>
            </div>

            {/* Quick Search & Count Pills */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, ID, catégorie..."
                  value={riskSearchQuery}
                  onChange={(e) => setRiskSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                {riskSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRiskSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Chips */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 px-0.5">
                <span className="font-semibold">
                  {(selectedCell ? cellRisks : filteredRisks).filter(r => 
                    !riskSearchQuery || 
                    r.title.toLowerCase().includes(riskSearchQuery.toLowerCase()) || 
                    r.id.toLowerCase().includes(riskSearchQuery.toLowerCase()) || 
                    resolveCategoryName(r.categoryId).toLowerCase().includes(riskSearchQuery.toLowerCase())
                  ).length} risque(s) affiché(s)
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold rounded text-[9.5px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    Espace Actif
                  </span>
                </div>
              </div>
            </div>

            {/* List of Risks */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-[360px] max-h-[520px]">
              {(() => {
                const sourceRisks = selectedCell ? cellRisks : filteredRisks;
                const displayList = sourceRisks.filter(r => 
                  !riskSearchQuery || 
                  r.title.toLowerCase().includes(riskSearchQuery.toLowerCase()) || 
                  r.id.toLowerCase().includes(riskSearchQuery.toLowerCase()) || 
                  resolveCategoryName(r.categoryId).toLowerCase().includes(riskSearchQuery.toLowerCase())
                );

                if (displayList.length === 0) {
                  return (
                    <div className="py-16 text-center text-slate-450 space-y-2.5 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <Info className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-[11px] text-slate-600">Aucun risque correspondant</p>
                      <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto">
                        Ajustez vos filtres de recherche ou sélectionnez une autre cellule dans la matrice.
                      </p>
                    </div>
                  );
                }

                return displayList.map(r => {
                  const crit = getCriticality(r.scoreResiduel);
                  const isSelected = selectedRiskId === r.id;
                  const entObj = tenantConfig.entities.find(e => e.id === r.entityId);
                  const entityName = entObj?.name || r.entityId || 'Global';

                  return (
                    <div 
                      key={r.id}
                      onClick={() => setSelectedRiskId(r.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/30 shadow-xs ring-1 ring-indigo-400/40' 
                          : 'border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-bold text-[9px] text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                            {r.id}
                          </span>
                          <span className="text-[9.5px] text-indigo-700 font-bold bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100/60 truncate max-w-[120px]">
                            {resolveCategoryName(r.categoryId)}
                          </span>
                          <span className="text-[9.5px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[110px]">
                            {entityName}
                          </span>
                        </div>

                        <span 
                          style={{ backgroundColor: crit.color, color: crit.textColor }}
                          className="px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 shadow-2xs border border-white/20"
                        >
                          {crit.label} ({r.scoreResiduel})
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs leading-snug hover:text-indigo-600 transition-colors">
                        {r.title}
                      </h4>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-2 font-mono text-[9.5px]">
                          <span className="bg-slate-100 px-1 py-0.2 rounded">F: <strong className="text-slate-800">{r.frequencyValue}</strong></span>
                          <span className="bg-slate-100 px-1 py-0.2 rounded">I: <strong className="text-slate-800">{r.impactValue}</strong></span>
                          <span className="bg-slate-100 px-1 py-0.2 rounded">M: <strong className="text-slate-800">{r.controlValue}</strong></span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Audit <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Card Footer Summary */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Cliquez sur un risque pour ouvrir l'analyse détaillée.</span>
            </div>
            <div className="font-bold text-slate-700 font-mono text-[10px]">
              Moy. Net : <span className="text-indigo-600 font-black">{avgResidualScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Decision Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
        
        {/* Chart 1: Risques par Unité (Pie/Donut + Histogramme en Barres) */}
        <div id="chart-unit-distribution" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4 md:col-span-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                Risques par Unité (Histogramme & Donut)
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full">
                  {entityBreakdown.length} Unité(s)
                </span>
                {renderExportPNGButton('chart-unit-distribution', 'Risques_Par_Unite_Donut')}
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400">
              Répartition en nombre et pourcentage de l'exposition par entité organisationnelle.
            </p>
          </div>

          {entityBreakdown.length === 0 || totalRisks === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-xs">
              Aucun risque répertorié dans cette sélection.
            </div>
          ) : (
            <div className="space-y-4 my-1">
              {/* Dual Presentation: Donut SVG Chart + Vertical Bar Chart spanning full width */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50/80 p-4 rounded-xl border border-slate-150">
                
                {/* SVG Donut Chart (Diagramme en Cercle) */}
                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    <circle
                      cx="80"
                      cy="80"
                      r="55"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="22"
                    />
                    {(() => {
                      const circumference = 2 * Math.PI * 55;
                      let accumulated = 0;
                      return entityBreakdown.map((item) => {
                        const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -((accumulated / 100) * circumference);
                        accumulated += item.percentage;
                        return (
                          <circle
                            key={item.id}
                            cx="80"
                            cy="80"
                            r="55"
                            fill="none"
                            stroke={item.color}
                            strokeWidth="22"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                          >
                            <title>{`${item.name}: ${item.count} risque(s) (${item.percentage}%)`}</title>
                          </circle>
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-900 leading-tight">{totalRisks}</span>
                    <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Risques</span>
                  </div>
                </div>

                {/* Vertical Bar Chart (Diagramme en Barres - Expanding across full container length) */}
                <div className="flex-1 w-full flex items-end justify-around h-36 pt-4 px-3 border-b border-l border-slate-300 relative gap-2">
                  <div className="absolute -left-6 top-1/2 -rotate-90 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
                    Volume
                  </div>

                  {entityBreakdown.map((item) => {
                    const maxCount = Math.max(...entityBreakdown.map(e => e.count), 1);
                    const heightPct = Math.max(15, Math.round((item.count / maxCount) * 100));
                    return (
                      <div key={item.id} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <div 
                          className="w-full max-w-[48px] rounded-t-md transition-all duration-500 flex items-center justify-center shadow-xs hover:brightness-110 relative"
                          style={{ height: `${heightPct}%`, backgroundColor: item.color }}
                        >
                          <span className="font-mono font-black text-[11px] text-white drop-shadow-xs">
                            {item.count}
                          </span>
                        </div>
                        <span className="text-[9.5px] font-extrabold text-slate-700 truncate w-full text-center mt-1.5 font-mono" title={`${item.code} - ${item.name}`}>
                          {item.code}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Color Legend with Counts & Percentages across responsive columns */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-40 overflow-y-auto pr-1 text-[10.5px]">
                {entityBreakdown.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-50 border border-slate-150 p-2 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span className="font-bold text-slate-700 truncate" title={`${item.code} - ${item.name}`}>
                        <strong className="font-mono text-indigo-900 mr-1">{item.code}</strong> {item.name}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 ml-1">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Périmètre : {selectedEntityId === 'all' ? 'Global Groupe' : (tenantConfig.entities.find(e => e.id === selectedEntityId)?.name || selectedEntityId)}</span>
            <span className="font-semibold text-slate-500">Diagramme en Barres & Cercle</span>
          </div>
        </div>

        {/* Featured Excel Combo Chart: Risques par entité du Programme (Grouped Bars + Line % on Dual Y-Axes) */}
        <div id="chart-excel-combo" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4 md:col-span-2 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Risques par entité du Programme / Cartographie Global
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Histogramme combiné : Niveaux de criticité, Volume total (Cyan) & Proportion relative (Courbe Orange - Axe droit %).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full shadow-2xs">
                Double Axe Y (Volumes & %)
              </span>
              {renderExportPNGButton('chart-excel-combo', 'Risques_Entites_Programme_Combo')}
            </div>
          </div>

          {unitCriticalityBreakdown.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-xs">
              Aucune donnée d'entité disponible pour l'analyse croisée.
            </div>
          ) : (
            <div className="space-y-4 my-1">
              {/* Dual Y-Axes Chart Area */}
              <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 relative overflow-hidden">
                {/* SVG Container for the Orange Line Graph (Risques %) */}
                {(() => {
                  const globalTotal = filteredRisks.length || 1;
                  const dataWithPct = unitCriticalityBreakdown.map(u => ({
                    ...u,
                    pct: Number(((u.total / globalTotal) * 100).toFixed(1))
                  }));

                  const maxVol = Math.max(...dataWithPct.map(u => u.total), 1);
                  const maxPctVal = Math.max(...dataWithPct.map(u => u.pct), 10);

                  // Calculate point coordinates for the line chart (percentage overlay)
                  const numEntities = dataWithPct.length;
                  const points = dataWithPct.map((u, idx) => {
                    const xPct = numEntities === 1 ? 50 : 5 + (idx + 0.5) * (90 / numEntities);
                    const yPct = 100 - (u.pct / Math.max(maxPctVal, 1)) * 80 - 10;
                    return { ...u, xPct, yPct };
                  });

                  const linePath = points.length > 0 
                    ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.xPct}% ${pt.yPct}%`, '')
                    : '';

                  return (
                    <div className="relative w-full h-56 pt-2 pb-8 pl-10 pr-12">
                      {/* Left Y-Axis (Volume Graduation) */}
                      <div className="absolute left-0 top-2 bottom-8 w-9 flex flex-col justify-between items-end pr-1.5 text-[9.5px] font-bold text-slate-500 border-r border-slate-300">
                        {[maxVol, Math.round(maxVol * 0.75), Math.round(maxVol * 0.5), Math.round(maxVol * 0.25), 0].map((v, i) => (
                          <span key={i} className="font-mono">{v}</span>
                        ))}
                      </div>

                      {/* Right Y-Axis (Percentage Graduation) */}
                      <div className="absolute right-0 top-2 bottom-8 w-11 flex flex-col justify-between items-start pl-1.5 text-[9.5px] font-bold font-mono text-orange-600 border-l border-slate-300">
                        {[
                          `${maxPctVal.toFixed(1)}%`,
                          `${(maxPctVal * 0.75).toFixed(1)}%`,
                          `${(maxPctVal * 0.5).toFixed(1)}%`,
                          `${(maxPctVal * 0.25).toFixed(1)}%`,
                          `0.0%`
                        ].map((v, i) => (
                          <span key={i}>{v}</span>
                        ))}
                      </div>

                      {/* Main Chart Graphic Area */}
                      <div className="w-full h-full border-b border-slate-300 relative flex items-end justify-around gap-1.5 px-2">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                          <div className="border-b border-dashed border-slate-400 w-full h-0"></div>
                          <div className="border-b border-dashed border-slate-400 w-full h-0"></div>
                          <div className="border-b border-dashed border-slate-400 w-full h-0"></div>
                          <div className="border-b border-dashed border-slate-400 w-full h-0"></div>
                          <div className="border-b border-slate-400 w-full h-0"></div>
                        </div>

                        {/* Grouped Bars for each Entity */}
                        {dataWithPct.map((u) => {
                          return (
                            <div key={u.id} className="flex-1 flex flex-col items-center h-full justify-end z-10 group relative min-w-0">
                              {/* Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none z-30 whitespace-nowrap">
                                <div><span className="font-mono text-indigo-300 mr-1">{u.code}</span> - {u.name}</div>
                                <div className="text-orange-300 font-mono">Total : {u.total} ({u.pct}% du global)</div>
                              </div>

                              {/* Grouped Bar Container */}
                              <div className="flex items-end gap-0.5 w-full justify-center h-full max-w-[64px]">
                                {/* Bars for each Criticality Threshold */}
                                {u.levelCounts.map((level, idx) => {
                                  const barH = level.count > 0 ? Math.max(8, Math.round((level.count / maxVol) * 100)) : 0;
                                  const colorStyle = getThresholdColorStyles(level.label, tenantConfig.matrixThresholds);
                                  const color = colorStyle.text || level.color || '#4F46E5';
                                  return (
                                    <div
                                      key={idx}
                                      className="flex-1 rounded-t-xs transition-all duration-300 flex items-end justify-center hover:brightness-125 relative"
                                      style={{ height: `${barH}%`, backgroundColor: color, minHeight: level.count > 0 ? '4px' : '0' }}
                                      title={`${level.label}: ${level.count}`}
                                    >
                                      {level.count > 0 && barH > 15 && (
                                        <span className="font-mono font-black text-[8.5px] text-white leading-none mb-0.5 drop-shadow-xs">
                                          {level.count}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Total Risques Bar (Cyan / Turquoise) */}
                                <div
                                  className="flex-1 rounded-t-xs transition-all duration-300 flex items-end justify-center bg-cyan-500 hover:brightness-125 relative"
                                  style={{ height: `${Math.max(10, Math.round((u.total / maxVol) * 100))}%` }}
                                  title={`Total Risques: ${u.total}`}
                                >
                                  <span className="font-mono font-black text-[9px] text-white leading-none mb-0.5 drop-shadow-xs">
                                    {u.total}
                                  </span>
                                </div>
                              </div>

                              {/* X-Axis Entity Label */}
                              <div className="absolute -bottom-6 w-full text-center">
                                <span className="text-[9.5px] font-extrabold text-slate-800 block truncate font-mono" title={`${u.code} - ${u.name}`}>
                                  {u.code}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Superimposed SVG Line for "Risques %" */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                          <path
                            d={linePath}
                            fill="none"
                            stroke="#F97316"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-xs"
                          />
                          {points.map((pt, i) => (
                            <g key={i}>
                              <circle
                                cx={`${pt.xPct}%`}
                                cy={`${pt.yPct}%`}
                                r="4"
                                fill="#F97316"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                                className="drop-shadow-xs"
                              />
                              <text
                                x={`${pt.xPct}%`}
                                y={`${pt.yPct - 3}%`}
                                textAnchor="middle"
                                fill="#EA580C"
                                fontSize="9"
                                fontWeight="800"
                                fontFamily="monospace"
                              >
                                {pt.pct}%
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>
                  );
                })()}

                {/* X and Y Axis Titles Footer */}
                <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-500 pt-3 border-t border-slate-200">
                  <span className="text-slate-600">Axe Y Gauche : Volume de Risques (Groupes de Barres)</span>
                  <span className="text-slate-800 uppercase tracking-wider">Axe X : Entités / Unités du Programme</span>
                  <span className="text-orange-600">Axe Y Droit : Proportion (%) des Risques</span>
                </div>
              </div>

              {/* Dynamic Threshold Legend matching Configuration */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[10.5px] font-bold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {(tenantConfig.matrixThresholds && tenantConfig.matrixThresholds.length > 0 
                  ? tenantConfig.matrixThresholds 
                  : generateDefaultThresholds(size, 4)
                ).map((t, idx) => {
                  const colorStyle = getThresholdColorStyles(t.label, tenantConfig.matrixThresholds);
                  const color = colorStyle.text || t.color || '#4F46E5';
                  return (
                    <span key={idx} className="flex items-center gap-1.5">
                      <span 
                        className="w-3.5 h-3.5 rounded-xs shadow-2xs border border-black/10" 
                        style={{ backgroundColor: color }}
                      ></span>
                      <span>Risques {t.label}</span>
                    </span>
                  );
                })}
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-xs bg-cyan-500 shadow-2xs"></span>
                  Total Risques
                </span>
                <span className="flex items-center gap-1.5 text-orange-600 font-extrabold">
                  <span className="w-5 h-1 bg-orange-500 rounded-full inline-block relative">
                    <span className="w-2 h-2 rounded-full bg-orange-600 border border-white absolute -top-0.5 left-1.5"></span>
                  </span>
                  Proportion %
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Visualisation Conforme Excel / Business Intelligence (Programme 034 / Direction)</span>
            <span className="font-semibold text-slate-500">Comité de Direction & Cartographie</span>
          </div>
        </div>

        {/* Dedicated Chart: Diagramme en Barres - Unités & Seuils de Criticité avec Effectifs, Pourcentages (%) et Légende */}
        <div id="chart-unit-criticality-breakdown" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4 md:col-span-2 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Diagramme en Barres : Unités & Seuils de Criticité
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Histogramme en barres horizontales cumulées par unité : Effectif (N) & Pourcentage (%) inscrits sur chaque segment.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                Pourcentages (%) & Effectifs
              </span>
              {renderExportPNGButton('chart-unit-criticality-breakdown', 'Diagramme_Unites_Seuils_Criticite')}
            </div>
          </div>

          {/* Explicit Legend for Criticality Thresholds */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 uppercase tracking-wide text-[10.5px] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Légende Officielle des Seuils de Criticité :
              </span>
              <span className="text-[10px] font-bold text-slate-500 font-mono">
                Total Sélection : {filteredRisks.length} Risques
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(tenantConfig.matrixThresholds && tenantConfig.matrixThresholds.length > 0 
                ? tenantConfig.matrixThresholds 
                : generateDefaultThresholds(size, 4)
              ).map((t, idx) => {
                const globalCount = filteredRisks.filter(r => getCriticality(r.scoreResiduel).label === t.label).length;
                const globalPct = filteredRisks.length > 0 ? Math.round((globalCount / filteredRisks.length) * 100) : 0;
                const colorStyle = getThresholdColorStyles(t.label, tenantConfig.matrixThresholds);

                return (
                  <div 
                    key={idx}
                    className="p-2 rounded-lg border flex items-center justify-between shadow-2xs transition-transform hover:scale-[1.01]"
                    style={{ backgroundColor: colorStyle.bg, borderColor: colorStyle.border }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs border border-black/10" style={{ backgroundColor: colorStyle.text }}></span>
                      <span className="font-extrabold truncate text-[11px]" style={{ color: colorStyle.text }}>
                        {t.label}
                      </span>
                    </div>
                    <span className="font-black font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-white/90 border border-black/10 shrink-0 ml-1 text-slate-900 shadow-2xs">
                      {globalCount} ({globalPct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unit x Criticality Bar Chart */}
          {unitCriticalityBreakdown.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-xs">
              Aucune donnée d'unité disponible.
            </div>
          ) : (
            <div className="space-y-3.5 my-1 max-h-96 overflow-y-auto pr-1">
              {unitCriticalityBreakdown.map(u => {
                const uTotal = u.total || 1;
                return (
                  <div key={u.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5 hover:border-indigo-300 transition-all shadow-2xs">
                    {/* Unit Header */}
                    <div className="flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-mono font-black text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[10.5px]">
                          {u.code}
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs">{u.name}</span>
                      </div>
                      <span className="font-mono text-[11px] font-black text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                        Total Unité : {u.total} risque(s) (100%)
                      </span>
                    </div>

                    {/* Stacked Horizontal Bar with Inscribed Count AND Percentage */}
                    <div className="w-full bg-slate-200 h-7 rounded-lg overflow-hidden flex shadow-2xs border border-slate-300/80">
                      {u.levelCounts.map((level, idx) => {
                        if (level.count === 0) return null;
                        const segPct = Math.round((level.count / uTotal) * 100);
                        const colorStyle = getThresholdColorStyles(level.label, tenantConfig.matrixThresholds);
                        const barBg = colorStyle.text || level.color || '#4F46E5';

                        return (
                          <div
                            key={idx}
                            style={{ width: `${segPct}%`, backgroundColor: barBg }}
                            className="h-full flex items-center justify-center transition-all duration-300 relative group cursor-pointer hover:brightness-110"
                            title={`${u.name} - ${level.label}: ${level.count} risque(s) (${segPct}%)`}
                          >
                            <span className="font-mono font-black text-[10.5px] text-white drop-shadow-xs px-1 truncate">
                              {segPct >= 8 ? `${level.count} (${segPct}%)` : level.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sub-badges per Criticality Threshold */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5 text-[10px]">
                      {u.levelCounts.map((level, idx) => {
                        if (level.count === 0) return null;
                        const segPct = Math.round((level.count / uTotal) * 100);
                        const colorStyle = getThresholdColorStyles(level.label, tenantConfig.matrixThresholds);

                        return (
                          <span 
                            key={idx} 
                            className="px-2.5 py-0.5 rounded-md font-extrabold border flex items-center gap-1.5 shadow-2xs"
                            style={{ 
                              backgroundColor: colorStyle.bg, 
                              color: colorStyle.text, 
                              borderColor: colorStyle.border 
                            }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorStyle.text }}></span>
                            {level.label} : <strong className="font-black font-mono text-slate-900">{level.count}</strong> ({segPct}%)
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Graphique Croisé : Unités x Seuils de Criticité</span>
            <span className="font-semibold text-slate-500">Pourcentages (%) & Effectifs Inscrits</span>
          </div>
        </div>

        {/* Chart 4: Profil de Criticité par Unité (Axe X: Unités / Axe Y: Graduation & Seuils de Criticité) */}
        <div id="chart-unit-criticality-profile" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Profil de Criticité par Unité
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full">
                  Axe X: Unités | Axe Y: Graduation
                </span>
                {renderExportPNGButton('chart-unit-criticality-profile', 'Profil_Criticite_Par_Unite')}
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400">
              Histogramme vertical : Graduation en ordonnée (Y), Unités en abscisse (X) et nombre inscrit sur chaque barre.
            </p>
          </div>

          {unitCriticalityBreakdown.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-xs">
              Aucune donnée d'unité disponible.
            </div>
          ) : (
            <div className="space-y-3 my-1">
              {/* Threshold Legend Bar */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 text-[9.5px]">
                <span className="font-bold text-slate-400">Seuils Y :</span>
                {(tenantConfig.matrixThresholds || []).map((t, i) => (
                  <span key={i} className="flex items-center gap-1 font-bold px-1.5 py-0.5 rounded border border-slate-150" style={{ backgroundColor: `${t.color}20`, color: t.textColor }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }}></span>
                    {t.label}
                  </span>
                ))}
              </div>

              {/* True Vertical Column Bar Chart with Axes (X: Units, Y: Graduation Thresholds) */}
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-150">
                <div className="flex h-44 relative pl-8 pb-6 pr-2 pt-2">
                  {/* Y-Axis Line & Scale Graduation Marks */}
                  <div className="absolute left-0 top-2 bottom-6 w-8 flex flex-col justify-between items-end pr-1 text-[9px] font-bold text-slate-400 border-r border-slate-300">
                    {(() => {
                      const maxVal = Math.max(...unitCriticalityBreakdown.map(u => u.total), 1);
                      return [maxVal, Math.round(maxVal * 0.75), Math.round(maxVal * 0.5), Math.round(maxVal * 0.25), 0].map((v, i) => (
                        <span key={i} className="font-mono leading-none">{v}</span>
                      ));
                    })()}
                  </div>

                  {/* X-Axis Baseline Grid & Columns */}
                  <div className="flex-1 flex items-end justify-around gap-2 border-b border-slate-300 h-full">
                    {unitCriticalityBreakdown.map(u => {
                      const maxVal = Math.max(...unitCriticalityBreakdown.map(item => item.total), 1);
                      const barHeightPct = Math.max(12, Math.round((u.total / maxVal) * 100));

                      return (
                        <div key={u.id} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          {/* Total tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded pointer-events-none shadow-md z-10 whitespace-nowrap">
                            <span className="font-mono text-indigo-300 mr-1">{u.code}</span> - {u.name} : {u.total} risque(s)
                          </div>

                          {/* Stacked Vertical Column with Inscribed Numbers */}
                          <div 
                            className="w-full max-w-[42px] rounded-t-md overflow-hidden flex flex-col justify-end shadow-xs transition-all duration-300 border border-slate-200"
                            style={{ height: `${barHeightPct}%` }}
                          >
                            {u.levelCounts.map((level, idx) => {
                              if (level.count === 0) return null;
                              const segPct = (level.count / u.total) * 100;
                              return (
                                <div
                                  key={idx}
                                  style={{ height: `${segPct}%`, backgroundColor: level.color }}
                                  className="w-full flex items-center justify-center transition-all duration-300 relative"
                                  title={`${u.code} (${u.name}) - ${level.label}: ${level.count}`}
                                >
                                  {/* Inscribed number inside bar segment */}
                                  <span 
                                    className="font-extrabold text-[10.5px] font-mono leading-none drop-shadow-xs"
                                    style={{ color: level.textColor || '#FFFFFF' }}
                                  >
                                    {level.count}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* X-Axis Label (Unit Code) */}
                          <div className="absolute -bottom-6 w-full text-center">
                            <span className="text-[9px] font-bold text-slate-700 block truncate font-mono" title={`${u.code} - ${u.name}`}>
                              {u.code}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Axis Titles */}
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 pt-2 border-t border-slate-200">
                  <span>Axe Y : Graduation des Risques</span>
                  <span>Axe X : Unités Organisationnelles</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Graphique en Colonnes Verticaux</span>
            <span className="font-semibold text-slate-500">Axe X (Entités) / Y (Graduation)</span>
          </div>
        </div>

        {/* Chart 5: Efficacité des Contrôles par Catégorie (Histogramme en Barres) */}
        <div id="chart-control-efficacy" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Efficacité des Contrôles par Catégorie
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Atténuation Brut vs Net
                </span>
                {renderExportPNGButton('chart-control-efficacy', 'Efficacite_Controles_Categorie')}
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400">
              Barres comparatives : Score brut (Ambre) vs Score net résiduel (Émeraude) inscrit sur la barre.
            </p>
          </div>

          {categoryControlImpact.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-xs">
              Aucune donnée thématique disponible.
            </div>
          ) : (
            <div className="space-y-3 my-1">
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {categoryControlImpact.map(cat => (
                  <div key={cat.id} className="space-y-1 bg-slate-50/70 border border-slate-150 p-2.5 rounded-lg">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-800 truncate" title={cat.name}>{cat.name}</span>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-mono">
                        -{cat.reductionPercent}% d'atténuation
                      </span>
                    </div>

                    {/* Dual Bar Comparison with Inscribed Numbers */}
                    <div className="space-y-1.5 pt-1">
                      {/* Score Brut Bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-500 w-16 text-right shrink-0">Brut</span>
                        <div className="flex-1 bg-slate-200 h-4 rounded-md overflow-hidden flex items-center shadow-2xs">
                          <div 
                            className="bg-amber-500 h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(12, Math.min(100, (cat.avgBrut / ((tenantConfig.matrixSize || 4) * (tenantConfig.matrixSize || 4))) * 100))}%` }}
                          >
                            <span className="text-[10px] font-extrabold text-white font-mono leading-none">
                              {cat.avgBrut}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Score Residuel Bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-indigo-700 w-16 text-right shrink-0">Net Résiduel</span>
                        <div className="flex-1 bg-slate-200 h-4 rounded-md overflow-hidden flex items-center shadow-2xs">
                          <div 
                            className="bg-emerald-500 h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(12, Math.min(100, (cat.avgResiduel / ((tenantConfig.matrixSize || 4) * (tenantConfig.matrixSize || 4))) * 100))}%` }}
                          >
                            <span className="text-[10px] font-extrabold text-white font-mono leading-none">
                              {cat.avgResiduel}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded bg-amber-500"></span> Score Brut
              <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-500"></span> Score Net
            </span>
            <span className="font-semibold text-slate-500">Diagramme en Barres Comparatif</span>
          </div>
        </div>

        {/* Chart 6: Couverture & Plans d'Action par Niveau de Criticité */}
        <div id="chart-action-coverage" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4 md:col-span-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                Couverture des Plans d'Action par Niveau de Criticité
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full">
                  Par Criticité
                </span>
                {renderExportPNGButton('chart-action-coverage', 'Couverture_Plans_Action_Criticite')}
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400">
              Barres empilées avec effectifs inscrits : Risques couverts (Vert) vs Orphelins sans action (Ambre/Rouge).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-1">
            {criticalityActionCoverage.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-150 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2 py-0.5 rounded text-[9.5px] font-bold border border-white/20 shadow-2xs"
                      style={{ backgroundColor: item.color, color: item.textColor }}
                    >
                      {item.label}
                    </span>
                    <span className="font-extrabold text-slate-800 font-mono">
                      {item.totalCount} risque(s)
                    </span>
                  </div>

                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                    item.orphanCount === 0 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {item.coveredPercent}% Couverts
                  </span>
                </div>

                {/* Progress Bar of Action Coverage with Inscribed Numbers & Percentages */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-200 h-6 rounded-lg overflow-hidden flex shadow-2xs">
                    {item.withActionsCount > 0 && (
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-500 flex items-center justify-center font-mono font-extrabold text-[10.5px] text-white" 
                        style={{ width: `${item.coveredPercent}%` }}
                        title={`${item.withActionsCount} couverts`}
                      >
                        {item.withActionsCount} ({item.coveredPercent}%)
                      </div>
                    )}
                    {item.orphanCount > 0 && (
                      <div 
                        className="bg-amber-500 h-full transition-all duration-500 flex items-center justify-center font-mono font-extrabold text-[10.5px] text-white" 
                        style={{ width: `${100 - item.coveredPercent}%` }}
                        title={`${item.orphanCount} orphelins (sans action)`}
                      >
                        {item.orphanCount} ({100 - item.coveredPercent}%)
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[9.5px] text-slate-500 pt-0.5">
                    <span className="font-semibold text-emerald-700">
                      ✓ {item.withActionsCount} sous plan ({item.totalActionsCount} action{item.totalActionsCount > 1 ? 's' : ''})
                    </span>
                    {item.orphanCount > 0 ? (
                      <span className="text-amber-700 font-bold">⚠️ {item.orphanCount} sans action</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">✓ 100% traités</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-500"></span> Couvert
              <span className="inline-block w-2.5 h-2.5 rounded bg-amber-500"></span> Sans Action
            </span>
            <span className="font-semibold text-slate-500">Diagramme en Barres Empilées</span>
          </div>
        </div>

        {/* Chart 7: Répartition des Catégories de Risques par Unité (Diagramme en Barres avec Pourcentages, Légende & Nombres) */}
        <div id="chart-unit-categories" className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4 md:col-span-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Répartition des Catégories de Risques par Unité
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Histogramme en Barres | Effectifs & Pourcentages (%)
                </span>
                {renderExportPNGButton('chart-unit-categories', 'Repartition_Categories_Par_Unite')}
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400">
              Barres empilées par unité avec le nombre exact et le pourcentage (%) inscrits sur chaque segment de catégorie.
            </p>
          </div>

          {/* Interactive Legend for Categories */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-[10.5px]">
            <span className="font-bold text-slate-500">Légende des Catégories :</span>
            {(tenantConfig.categories || []).map((cat, idx) => {
              const catPalette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#F97316'];
              const color = cat.color || catPalette[idx % catPalette.length];
              return (
                <span key={cat.id || idx} className="flex items-center gap-1.5 font-bold px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-800 shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                  {cat.name}
                </span>
              );
            })}
          </div>

          {unitCategoryBreakdown.length === 0 ? (
            <div className="py-10 text-center text-slate-400 italic text-xs">
              Aucune donnée d'unité ou de catégorie disponible.
            </div>
          ) : (
            <div className="space-y-3.5 my-1 max-h-72 overflow-y-auto pr-1">
              {unitCategoryBreakdown.map(u => (
                <div key={u.id} className="p-3 rounded-xl border border-slate-150 bg-slate-50/60 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 text-[10px]">{u.code}</span>
                      <span className="font-extrabold text-slate-900">{u.name}</span>
                    </div>
                    <span className="font-mono text-[10.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      Total Unité : {u.total} risque(s) (100%)
                    </span>
                  </div>

                  {/* Stacked Horizontal Bar with Inscribed Count AND Percentage */}
                  <div className="w-full bg-slate-200 h-6.5 rounded-lg overflow-hidden flex shadow-2xs">
                    {u.catCounts.map((cat, idx) => {
                      if (cat.count === 0) return null;
                      return (
                        <div
                          key={idx}
                          style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                          className="h-full flex items-center justify-center transition-all duration-300 relative group cursor-pointer"
                          title={`${u.name} - ${cat.name}: ${cat.count} risque(s) (${cat.percentage}%)`}
                        >
                          {/* Inscribed label with count and percentage */}
                          <span className="font-extrabold text-[10px] font-mono text-white drop-shadow-xs px-1 truncate">
                            {cat.percentage >= 10 ? `${cat.count} (${cat.percentage}%)` : cat.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Category Badges under the bar */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {u.catCounts.map((cat, idx) => cat.count > 0 && (
                      <span 
                        key={idx} 
                        className="px-2 py-0.5 rounded text-[9.5px] font-bold border flex items-center gap-1 shadow-2xs"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color, borderColor: `${cat.color}40` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                        {cat.name} : <strong className="font-extrabold font-mono">{cat.count}</strong> ({cat.percentage}%)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Graphique Croisé : Unités (Axes) x Catégories de Risques</span>
            <span className="font-semibold text-slate-500">Pourcentages (%) & Effectifs Inscrits</span>
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
                    Catégorie : {resolveCategoryName(selectedRisk.categoryId)}
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
              
              {/* Row 1: Description, Causes & Conséquences */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Description Détaillée
                  </h4>
                  <p className="text-slate-800 text-xs leading-relaxed font-medium">
                    {selectedRisk.description || "Aucune description enregistrée."}
                  </p>
                </div>

                <div className="space-y-1.5 bg-amber-50/60 border border-amber-200/80 rounded-lg p-3">
                  <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Causes du Risque
                  </h4>
                  <p className="text-slate-800 text-xs leading-relaxed font-medium">
                    {selectedRisk.causes || "Aucune cause spécifiée."}
                  </p>
                </div>

                <div className="space-y-1.5 bg-rose-50/60 border border-rose-200/80 rounded-lg p-3">
                  <h4 className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    Conséquences du Risque
                  </h4>
                  <p className="text-slate-800 text-xs leading-relaxed font-medium">
                    {selectedRisk.consequences || "Aucune conséquence spécifiée."}
                  </p>
                </div>
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
