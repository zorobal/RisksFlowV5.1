/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  ShieldAlert, 
  Calendar, 
  User as UserIcon,
  ChevronRight,
  Briefcase,
  AlertOctagon,
  Wrench,
  Trash2,
  Copy,
  History,
  FileSpreadsheet,
  Boxes,
  FileText,
  AlertTriangle,
  Target,
  CheckSquare,
  Sparkles,
  Download,
  Layers,
  Building2,
  Check,
  RotateCcw,
  Tag,
  Printer,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { Risk, TenantConfig, User, ActionPlan } from '../types';
import OrgEntityTreeFilter from './OrgEntityTreeFilter';
import { getDescendantEntityIds } from '../utils/orgUtils';
import { getCriticalityFromThresholds, computeGRCScores, getThresholdColorStyles } from '../utils/riskUtils';

interface RiskMappingModuleProps {
  risks: Risk[];
  tenantConfig: TenantConfig;
  actions: ActionPlan[];
  users: User[];
  currentUser: User;
  isSuperAdminMode?: boolean;
  onAddRisk: (risk: Omit<Risk, 'id' | 'scoreBrut' | 'scoreResiduel' | 'createdAt' | 'history'>) => void;
  onUpdateRisk: (risk: Risk) => void;
  onDeleteRisk: (id: string) => void;
  onAddActionPlan: (plan: Omit<ActionPlan, 'id' | 'progress'>) => void;
  onAddLog: (action: string, details: string) => void;
}

export default function RiskMappingModule({
  risks,
  tenantConfig,
  actions,
  users,
  currentUser,
  isSuperAdminMode = false,
  onAddRisk,
  onUpdateRisk,
  onDeleteRisk,
  onAddActionPlan,
  onAddLog
}: RiskMappingModuleProps) {
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'graph'>('list');
  const [activeTab, setActiveTab] = useState<'general' | 'major_risks'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // "Cartographie des Risques Majeurs" State
  const [majorSelectedEntity, setMajorSelectedEntity] = useState<string>('all');
  const [majorCustomName, setMajorCustomName] = useState<string>('Risques Majeurs');
  const [majorShowScoreBrut, setMajorShowScoreBrut] = useState<boolean>(false);
  const [majorShowScoreNet, setMajorShowScoreNet] = useState<boolean>(true);
  const [majorShowActionTitle, setMajorShowActionTitle] = useState<boolean>(true);
  const majorReportRef = useRef<HTMLDivElement>(null);
  const [isExportingMajor, setIsExportingMajor] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [majorViewMode, setMajorViewMode] = useState<'table' | 'cards' | 'heatmap'>('table');
  
  // Selection / Editing States
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form fields for creating/editing
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCauses, setFormCauses] = useState('');
  const [formConsequences, setFormConsequences] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formEntity, setFormEntity] = useState('');
  const [formFreq, setFormFreq] = useState(1);
  const [formImpact, setFormImpact] = useState(1);
  const [formControl, setFormControl] = useState(1);
  const [formStatus, setFormStatus] = useState('');

  // Action creation within risk sheet
  const [showAddAction, setShowAddAction] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [actionOwnerName, setActionOwnerName] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');
  const [actionPriority, setActionPriority] = useState<'Basse' | 'Moyenne' | 'Haute' | 'Critique'>('Moyenne');

  // History comments
  const [historyComment, setHistoryComment] = useState('');

  // Safe fallbacks for props and config
  const safeRisks = risks || [];
  const safeActions = actions || [];
  const safeUsers = users || [];
  const categories = tenantConfig?.categories || [];
  const entities = tenantConfig?.entities || [];
  const workflowSteps = tenantConfig?.workflowSteps || [];
  const matrixThresholds = tenantConfig?.matrixThresholds || [];
  const frequencyScales = tenantConfig?.scales?.frequency || [];
  const impactScales = tenantConfig?.scales?.impact || [];
  const controlScales = tenantConfig?.scales?.control || [];
  const formulaExpr = tenantConfig?.formula?.expression || '(P * I) * M';

  // Initialize selected thresholds for Major Risks
  const [majorSelectedThresholds, setMajorSelectedThresholds] = useState<string[]>(() => {
    const thresholds = matrixThresholds || [];
    const high = thresholds.filter(t => {
      const lower = (t.label || '').toLowerCase();
      return lower.includes('élevé') || lower.includes('critique') || lower.includes('majeur') || lower.includes('fort') || lower.includes('sévère') || lower.includes('catastrophique');
    }).map(t => t.label);
    if (high.length > 0) return high;
    return thresholds.slice(Math.floor(thresholds.length / 2)).map(t => t.label);
  });

  // Toggle multi-choice threshold selection
  const handleToggleMajorThreshold = (label: string) => {
    setMajorSelectedThresholds(prev => {
      if (prev.includes(label)) {
        return prev.filter(l => l !== label);
      } else {
        return [...prev, label];
      }
    });
  };

  // Presets helper for quick nominations & multi-choice thresholds
  const applyThresholdPreset = (preset: 'majeurs' | 'intermediaires' | 'mineurs' | 'tous') => {
    const allLabels = matrixThresholds.map(t => t.label);
    if (preset === 'tous') {
      setMajorSelectedThresholds(allLabels);
      setMajorCustomName('Cartographie Globale des Risques');
    } else if (preset === 'majeurs') {
      const high = allLabels.filter(l => {
        const lower = l.toLowerCase();
        return lower.includes('élevé') || lower.includes('critique') || lower.includes('majeur') || lower.includes('fort') || lower.includes('sévère') || lower.includes('catastrophique');
      });
      setMajorSelectedThresholds(high.length > 0 ? high : matrixThresholds.slice(Math.floor(matrixThresholds.length / 2)).map(t => t.label));
      setMajorCustomName('Risques Majeurs');
    } else if (preset === 'intermediaires') {
      const mid = allLabels.filter(l => {
        const lower = l.toLowerCase();
        return lower.includes('modéré') || lower.includes('moyen') || lower.includes('significatif');
      });
      setMajorSelectedThresholds(mid.length > 0 ? mid : matrixThresholds.slice(0, Math.ceil(matrixThresholds.length / 2)).map(t => t.label));
      setMajorCustomName('Risques Intermédiaires');
    } else if (preset === 'mineurs') {
      const low = allLabels.filter(l => {
        const lower = l.toLowerCase();
        return lower.includes('faible') || lower.includes('mineur') || lower.includes('insignifiant') || lower.includes('négligeable') || lower.includes('bas');
      });
      setMajorSelectedThresholds(low.length > 0 ? low : [allLabels[0]]);
      setMajorCustomName('Risques Mineurs');
    }
  };

  const selectedEntityDescendants = selectedEntity !== 'all'
    ? getDescendantEntityIds(entities, selectedEntity)
    : [];

  // Filter risks
  const filteredRisks = safeRisks.filter(r => {
    if (!r) return false;
    const matchSearch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (r.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (r.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const selectedCatObj = categories.find(c => c.id === selectedCategory || c.name === selectedCategory);
    const matchCat = selectedCategory === 'all' || 
                     r.categoryId === selectedCategory || 
                     (selectedCatObj && (r.categoryId === selectedCatObj.name || r.categoryId === selectedCatObj.id));
    const matchEntity = selectedEntity === 'all' || selectedEntityDescendants.includes(r.entityId);
    const matchStatus = selectedStatus === 'all' || r.statusId === selectedStatus;
    
    return matchSearch && matchCat && matchEntity && matchStatus;
  });

  // Mapped Major Risks Filtering
  const majorSelectedEntityDescendants = majorSelectedEntity !== 'all'
    ? getDescendantEntityIds(entities, majorSelectedEntity)
    : [];

  const majorFilteredRisks = safeRisks.filter(r => {
    if (!r) return false;

    // Search query match
    const matchSearch = !searchQuery ? true : (
      (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Entity match
    const matchEntity = majorSelectedEntity === 'all' || 
                        majorSelectedEntityDescendants.includes(r.entityId) || 
                        r.entityId === majorSelectedEntity;

    // Criticality Threshold match
    const crit = getCriticalityFromThresholds(r.scoreResiduel, matrixThresholds);
    const matchThreshold = majorSelectedThresholds.length === 0 || majorSelectedThresholds.includes(crit.label);

    return matchSearch && matchEntity && matchThreshold;
  });

  // Export Major Risks Mapping Image
  const handleExportMajorMapping = async () => {
    if (!majorReportRef.current) return;
    setIsExportingMajor(true);
    try {
      const node = majorReportRef.current;
      const width = node.scrollWidth || 1000;
      const height = node.scrollHeight || 800;
      
      const dataUrl = await toPng(node, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width,
        height
      });
      
      const link = document.createElement('a');
      link.download = `Cartographie_${(majorCustomName || 'Risques').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      onAddLog('Export Cartographie', `Export de la cartographie ${majorCustomName}`);
    } catch (err) {
      console.warn("Export PNG Direct error, trying html2canvas-pro:", err);
      try {
        const canvas = await html2canvas(majorReportRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `Cartographie_${(majorCustomName || 'Risques').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (e) {
        alert("Impossible de générer l'image de la cartographie.");
      }
    } finally {
      setIsExportingMajor(false);
    }
  };

  // Export Major Risks to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const dataToExport = majorFilteredRisks.map((risk) => {
        const crit = getCriticality(risk.scoreResiduel);
        const brutCrit = getCriticality(risk.scoreBrut);
        const category = categories.find(c => c.id === risk.categoryId || c.name === risk.categoryId);
        const riskActions = safeActions.filter(a => a.riskId === risk.id);

        const actionsText = riskActions.length > 0 
          ? riskActions.map(a => {
              const titlePart = majorShowActionTitle ? `${a.title} : ` : '';
              const descPart = a.description || '';
              const statusPart = a.status ? ` [Statut: ${a.status}]` : '';
              return `${titlePart}${descPart}${statusPart}`;
            }).join(' | ')
          : "Aucun plan d'action";

        const row: Record<string, any> = {
          'Intitulé du Risque': risk.title,
          'Catégorie': category?.name || risk.categoryId || 'Général',
        };

        if (majorShowScoreBrut) {
          row['Score Brut'] = risk.scoreBrut;
          row['Criticité Brute'] = brutCrit.label;
        }

        if (majorShowScoreNet) {
          row['Score Net (Residual)'] = risk.scoreResiduel;
          row['Criticité Nette'] = crit.label;
        }

        row["Plan d'Actions"] = actionsText;

        const entityObj = entities.find(e => e.id === risk.entityId);
        row['Périmètre / Unité'] = entityObj?.name || risk.entityId || 'Global';

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      // Set explicit column widths for Excel
      worksheet['!cols'] = [
        { wch: 45 }, // Intitulé du Risque
        { wch: 25 }, // Catégorie
        { wch: 12 }, // Score Brut
        { wch: 18 }, // Criticité Brute
        { wch: 20 }, // Score Net
        { wch: 60 }, // Plan d'Actions
        { wch: 25 }, // Périmètre
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Risques Majeurs');

      const fileName = `Cartographie_${(majorCustomName || 'Risques').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      onAddLog('Export Excel', `Export Excel de la cartographie ${majorCustomName}`);
    } catch (err) {
      console.error("Erreur lors de l'export Excel:", err);
      alert("Impossible de générer le fichier Excel.");
    }
  };

  // Export Major Risks Mapping PDF (With non-chopped table rows & repeating header on every page)
  const handleExportMajorPDF = async () => {
    if (!majorReportRef.current) return;
    setIsExportingPDF(true);
    try {
      const node = majorReportRef.current;
      const reportTable = node.querySelector('table');
      const tableRows = reportTable ? Array.from(reportTable.querySelectorAll('tbody tr')) as HTMLElement[] : [];

      // Fallback to single page screenshot if no table or rows found
      if (!reportTable || tableRows.length === 0) {
        const dataUrl = await toPng(node, { quality: 0.98, pixelRatio: 2, backgroundColor: '#ffffff' });
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        pdf.addImage(dataUrl, 'PNG', 8, 8, 281, 0);
        pdf.save(`Cartographie_${(majorCustomName || 'Risques').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        return;
      }

      // Landscape A4 PDF (297mm x 210mm)
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const margin = 8;
      const printWidth = 281; // 297 - 16
      const printHeight = 194; // 210 - 16

      const nodeWidth = node.scrollWidth || 1100;
      // Max height allowed per page in canvas pixels for exact A4 aspect ratio
      const maxCanvasPageHeight = Math.floor((printHeight * nodeWidth) / printWidth);

      const tableHeader = reportTable.querySelector('thead') as HTMLElement | null;
      const topHeaderElem = node.querySelector('.report-top-header') as HTMLElement | null;
      const titleUnitElem = node.querySelector('.report-title-unit') as HTMLElement | null;
      const kpiElem = node.querySelector('.report-kpi-bar') as HTMLElement | null;

      // Temporary off-screen container for dynamic DOM measurement & canvas rendering
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0px';
      tempContainer.style.width = `${nodeWidth}px`;
      tempContainer.style.backgroundColor = '#ffffff';
      document.body.appendChild(tempContainer);

      const pageBuckets: HTMLElement[][] = [];
      let currentBucketRows: HTMLElement[] = [];
      let currentPageIdx = 0;

      // Helper to build a page node structure
      const createPageNode = (pageIndex: number) => {
        const pageNode = document.createElement('div');
        pageNode.className = "bg-white p-5 rounded-xl border border-slate-200 space-y-3";
        pageNode.style.width = `${nodeWidth}px`;

        if (pageIndex === 0) {
          if (topHeaderElem) pageNode.appendChild(topHeaderElem.cloneNode(true));
          if (titleUnitElem) pageNode.appendChild(titleUnitElem.cloneNode(true));
          if (kpiElem) pageNode.appendChild(kpiElem.cloneNode(true));
        } else {
          const compactHeader = document.createElement('div');
          compactHeader.className = "border-b-2 border-slate-900 pb-2.5 flex items-center justify-between";
          compactHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #0f172a;">${tenantConfig?.companyName || 'Entreprise Cliente'}</span>
              <span style="font-size: 11px; font-weight: 700; color: #4338ca;">— ${majorCustomName || 'Cartographie des Risques'} (Suite)</span>
            </div>
            <span style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">Page ${pageIndex + 1}</span>
          `;
          pageNode.appendChild(compactHeader);
        }

        const tableWrapper = document.createElement('div');
        tableWrapper.className = "overflow-x-auto rounded-lg border border-slate-200";

        const newTable = document.createElement('table');
        newTable.className = "w-full text-left border-collapse";

        if (tableHeader) {
          newTable.appendChild(tableHeader.cloneNode(true));
        }

        const newTbody = document.createElement('tbody');
        newTbody.className = "divide-y divide-slate-200 text-xs";

        newTable.appendChild(newTbody);
        tableWrapper.appendChild(newTable);
        pageNode.appendChild(tableWrapper);

        return { pageNode, newTbody };
      };

      let { pageNode: activePageNode, newTbody: activeTbody } = createPageNode(currentPageIdx);
      tempContainer.appendChild(activePageNode);

      for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i];
        const clonedRow = row.cloneNode(true) as HTMLElement;
        activeTbody.appendChild(clonedRow);

        // Check if adding this row caused activePageNode to exceed maxCanvasPageHeight
        const currentHeight = activePageNode.offsetHeight;

        if (currentHeight > (maxCanvasPageHeight - 15) && currentBucketRows.length > 0) {
          // Remove row that overflowed
          activeTbody.removeChild(clonedRow);

          // Save current bucket
          pageBuckets.push(currentBucketRows);
          currentBucketRows = [];

          // Start a new page node
          currentPageIdx++;
          tempContainer.removeChild(activePageNode);

          const newPage = createPageNode(currentPageIdx);
          activePageNode = newPage.pageNode;
          activeTbody = newPage.newTbody;
          tempContainer.appendChild(activePageNode);

          // Re-append row to the new page
          const reClonedRow = row.cloneNode(true) as HTMLElement;
          activeTbody.appendChild(reClonedRow);
          currentBucketRows.push(row);
        } else {
          currentBucketRows.push(row);
        }
      }

      if (currentBucketRows.length > 0) {
        pageBuckets.push(currentBucketRows);
      }

      // Render each page bucket to canvas and add to PDF
      for (let pageIdx = 0; pageIdx < pageBuckets.length; pageIdx++) {
        if (pageIdx > 0) {
          pdf.addPage();
        }

        tempContainer.innerHTML = '';
        const { pageNode } = createPageNode(pageIdx);
        const tbody = pageNode.querySelector('tbody')!;

        pageBuckets[pageIdx].forEach((r) => {
          tbody.appendChild(r.cloneNode(true));
        });

        tempContainer.appendChild(pageNode);

        const pageDataUrl = await toPng(pageNode, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          width: nodeWidth,
        });

        pdf.addImage(pageDataUrl, 'PNG', margin, margin, printWidth, 0);
      }

      document.body.removeChild(tempContainer);

      const fileName = `Cartographie_${(majorCustomName || 'Risques').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      onAddLog('Export Cartographie PDF', `Export PDF (${pageBuckets.length} page${pageBuckets.length > 1 ? 's' : ''}) de la cartographie ${majorCustomName}`);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Impossible de générer le fichier PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getCriticality = (score: number) => {
    return getCriticalityFromThresholds(score, matrixThresholds);
  };

  const handleOpenEdit = (risk: Risk) => {
    setSelectedRisk(risk);
    setIsCreating(false);
    setFormTitle(risk.title || '');
    setFormDesc(risk.description || '');
    setFormCauses(risk.causes || '');
    setFormConsequences(risk.consequences || '');

    // Match existing category by ID or name, fallback to first available
    const matchedCategory = categories.find(c => c.id === risk.categoryId || c.name === risk.categoryId || c.name.toLowerCase() === risk.categoryId?.toLowerCase());
    setFormCategory(matchedCategory ? matchedCategory.id : (categories[0]?.id || ''));

    // Match existing entity by ID or name, fallback to first available
    const matchedEntity = entities.find(e => e.id === risk.entityId || e.name === risk.entityId || e.name.toLowerCase() === risk.entityId?.toLowerCase());
    setFormEntity(matchedEntity ? matchedEntity.id : (entities[0]?.id || ''));

    setFormFreq(risk.frequencyValue || 1);
    setFormImpact(risk.impactValue || 1);
    setFormControl(risk.controlValue || 1);
    setFormStatus(risk.statusId || '');
    setShowAddAction(false);
  };

  const handleOpenCreate = () => {
    setIsCreating(true);
    setSelectedRisk(null);
    setFormTitle('');
    setFormDesc('');
    setFormCauses('');
    setFormConsequences('');
    setFormCategory(categories[0]?.id || '');
    setFormEntity(entities[0]?.id || '');
    setFormFreq(1);
    setFormImpact(1);
    setFormControl(1);
    setFormStatus(workflowSteps[0]?.id || 'w_brouillon');
    setShowAddAction(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    // Resolve valid category & entity IDs
    const targetCatObj = categories.find(c => c.id === formCategory || c.name === formCategory || c.name.toLowerCase() === formCategory?.toLowerCase());
    const finalCategory = targetCatObj ? targetCatObj.id : (categories[0]?.id || formCategory);

    const targetEntObj = entities.find(e => e.id === formEntity || e.name === formEntity || e.name.toLowerCase() === formEntity?.toLowerCase());
    const finalEntity = targetEntObj ? targetEntObj.id : (entities[0]?.id || formEntity);

    if (isCreating) {
      onAddRisk({
        title: formTitle,
        description: formDesc,
        causes: formCauses,
        consequences: formConsequences,
        categoryId: finalCategory,
        entityId: finalEntity,
        createdBy: currentUser.name,
        statusId: formStatus,
        frequencyValue: formFreq,
        impactValue: formImpact,
        controlValue: formControl
      });
      setIsCreating(false);
    } else if (selectedRisk) {
      // Calculate scores dynamically according to active formula expression
      const { scoreBrut, scoreResiduel } = computeGRCScores(formFreq, formImpact, formControl, tenantConfig.formula);

      const updatedHistory = [...selectedRisk.history];
      if (
        formFreq !== selectedRisk.frequencyValue || 
        formImpact !== selectedRisk.impactValue || 
        formControl !== selectedRisk.controlValue ||
        finalCategory !== selectedRisk.categoryId ||
        finalEntity !== selectedRisk.entityId ||
        formTitle !== selectedRisk.title ||
        formDesc !== selectedRisk.description ||
        formCauses !== selectedRisk.causes ||
        formConsequences !== selectedRisk.consequences
      ) {
        updatedHistory.push({
          date: new Date().toISOString().split('T')[0],
          user: currentUser.name,
          action: 'Mise à jour',
          comment: `Modification de la fiche risque (Description, Causes, Conséquences ou Cotation).`
        });
      }

      const updated: Risk = {
        ...selectedRisk,
        title: formTitle,
        description: formDesc,
        causes: formCauses,
        consequences: formConsequences,
        categoryId: finalCategory,
        entityId: finalEntity,
        frequencyValue: formFreq,
        impactValue: formImpact,
        controlValue: formControl,
        statusId: formStatus,
        scoreBrut,
        scoreResiduel,
        history: updatedHistory
      };

      onUpdateRisk(updated);
      setSelectedRisk(null);
    }
  };

  const handleAddComment = () => {
    if (!selectedRisk || !historyComment.trim()) return;

    const updated: Risk = {
      ...selectedRisk,
      history: [
        ...selectedRisk.history,
        {
          date: new Date().toISOString().split('T')[0],
          user: currentUser.name,
          action: 'Commentaire',
          comment: historyComment
        }
      ]
    };

    onUpdateRisk(updated);
    setHistoryComment('');
    setSelectedRisk(updated);
    onAddLog('Forum Risk', `Commentaire ajouté sur le risque ${selectedRisk.id}`);
  };

  const handleAddActionPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim() || !selectedRisk) return;

    onAddActionPlan({
      riskId: selectedRisk.id,
      title: actionTitle,
      description: actionDesc,
      ownerName: actionOwnerName || currentUser.name,
      dueDate: actionDueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      priority: actionPriority,
      status: 'À planifier'
    });

    setActionTitle('');
    setActionDesc('');
    setActionOwnerName('');
    setActionDueDate('');
    setActionPriority('Moyenne');
    setShowAddAction(false);
  };

  const changeWorkflowStep = (stepId: string) => {
    if (!selectedRisk) return;
    const updated: Risk = {
      ...selectedRisk,
      statusId: stepId,
      history: [
        ...selectedRisk.history,
        {
          date: new Date().toISOString().split('T')[0],
          user: currentUser.name,
          action: 'Transition de statut',
          comment: `Passage à l'étape: ${tenantConfig.workflowSteps.find(s => s.id === stepId)?.name || stepId}`
        }
      ]
    };
    onUpdateRisk(updated);
    setSelectedRisk(updated);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-50 overflow-hidden text-xs text-slate-800">
      {/* LEFT AREA: Filter Sidebar & Directory List */}
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto max-w-full md:max-w-4xl border-r border-slate-200">
        
        {/* TOP LEVEL NAVIGATION SWITCHER: Cartographie Générale vs Cartographie des Risques Majeurs */}
        <div className="flex items-center space-x-1.5 bg-slate-200/80 p-1.5 rounded-xl border border-slate-300 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            <span>Cartographie Générale</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('major_risks')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'major_risks'
                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300/50 font-extrabold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Flame className={`w-4 h-4 ${activeTab === 'major_risks' ? 'text-amber-300 animate-pulse' : 'text-rose-500'}`} />
            <span>Cartographie des Risques Majeurs</span>
            <span className="ml-1 bg-white/20 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-black uppercase">
              Sur-Mesure
            </span>
          </button>
        </div>

        {activeTab === 'major_risks' ? (
          <div className="space-y-5">
            {/* 1. CONFIGURATION PANEL FOR MAJOR RISKS */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-600" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Paramétrage & Multi-Choix des Risques Majeurs</h3>
                    <p className="text-[11px] text-slate-500">Sélectionnez une unité et cochez la graduation & seuils de criticité issus de la Configuration.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportMajorMapping}
                    disabled={isExportingMajor || isExportingPDF}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                    title="Exporter la cartographie au format PNG"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isExportingMajor ? 'PNG...' : 'Export PNG'}</span>
                  </button>

                  <button
                    onClick={handleExportMajorPDF}
                    disabled={isExportingMajor || isExportingPDF}
                    className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                    title="Exporter la cartographie au format PDF multi-pages"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-200" />
                    <span>{isExportingPDF ? 'PDF...' : 'Export PDF'}</span>
                  </button>

                  <button
                    onClick={handleExportExcel}
                    disabled={isExportingMajor || isExportingPDF}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                    title="Exporter la cartographie au format Microsoft Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Unit & Custom Title */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase block mb-1">
                      1. Périmètre Organisationnel (Unité / Succursale)
                    </label>
                    <OrgEntityTreeFilter
                      entities={entities}
                      selectedEntityId={majorSelectedEntity}
                      onSelectEntity={(id) => setMajorSelectedEntity(id)}
                      label=""
                      includeAllOption={true}
                      allOptionLabel="Toutes les unités organisationnelles"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase block mb-1">
                      2. Nomination de la Cartographie (Définie par l'Utilisateur)
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-indigo-500" />
                      <input
                        type="text"
                        value={majorCustomName}
                        onChange={(e) => setMajorCustomName(e.target.value)}
                        placeholder="Ex: Risques Majeurs, Risques Critiques, Risques Mineurs..."
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-indigo-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase block mb-1">
                      3. Colonnes Optionnelles à Afficher dans la Cartographie
                    </label>
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 shadow-2xs hover:bg-slate-50 select-none">
                        <input
                          type="checkbox"
                          checked={majorShowScoreBrut}
                          onChange={(e) => setMajorShowScoreBrut(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span>Score Brut</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 shadow-2xs hover:bg-slate-50 select-none">
                        <input
                          type="checkbox"
                          checked={majorShowScoreNet}
                          onChange={(e) => setMajorShowScoreNet(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span>Score Net (Criticité)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 shadow-2xs hover:bg-slate-50 select-none">
                        <input
                          type="checkbox"
                          checked={majorShowActionTitle}
                          onChange={(e) => setMajorShowActionTitle(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span>Intitulé Plan d'Action</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Multi-Choice Thresholds & Presets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase block">
                      4. Graduation & Seuils de Criticité (Multi-Choix)
                    </label>
                    <span className="text-[10px] text-indigo-600 font-semibold">
                      {majorSelectedThresholds.length} sélectionné(s)
                    </span>
                  </div>

                  {/* Threshold Checkboxes / Toggle Pills */}
                  <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    {matrixThresholds.map((t) => {
                      const isChecked = majorSelectedThresholds.includes(t.label);
                      const styles = getThresholdColorStyles(t.label, matrixThresholds);
                      
                      return (
                        <button
                          type="button"
                          key={t.label}
                          onClick={() => handleToggleMajorThreshold(t.label)}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                            isChecked 
                              ? 'ring-2 ring-indigo-500/40 font-extrabold' 
                              : 'opacity-50 hover:opacity-100 bg-white border-slate-300 text-slate-600'
                          }`}
                          style={isChecked ? { backgroundColor: styles.bg, color: styles.text, borderColor: styles.border } : {}}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                            isChecked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300'
                          }`}>
                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span>{t.label}</span>
                          <span className="text-[9.5px] opacity-75 font-mono">({t.minScore}-{t.maxScore})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Preset Shortcuts */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1.5">Raccourcis de nomination :</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyThresholdPreset('majeurs')}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                        <span>🔴 Risques Majeurs</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyThresholdPreset('intermediaires')}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>🟡 Risques Intermédiaires</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyThresholdPreset('mineurs')}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span>🟢 Risques Mineurs</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyThresholdPreset('tous')}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>⚡ Tous les Niveaux</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. MAPPED DASHBOARD & EXPORT CONTAINER */}
            <div 
              ref={majorReportRef}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-md space-y-3.5"
            >
              {/* Dashboard Top Header (Company Name & Selected Levels at Top Right) */}
              <div className="report-top-header border-b-2 border-slate-900 pb-3 flex flex-wrap items-center justify-between gap-3">
                {/* Left: Entreprise Cliente Logo & Nom */}
                <div className="flex items-center gap-3">
                  {tenantConfig?.logoUrl ? (
                    <img 
                      src={tenantConfig.logoUrl} 
                      alt={tenantConfig.companyName || "Logo Entreprise"} 
                      className="h-8 max-w-[160px] object-contain rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 font-black text-xs flex items-center justify-center border border-slate-800 shadow-2xs">
                      {tenantConfig?.companyName ? tenantConfig.companyName.substring(0, 2).toUpperCase() : <Building2 className="w-4 h-4 text-amber-400" />}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                      {tenantConfig?.companyName || 'Entreprise Cliente'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-tight block">
                      Gouvernance, Risques & Conformité
                    </span>
                  </div>
                </div>

                {/* Right: Active Threshold Badges right at the top right */}
                <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[9.5px] font-extrabold text-slate-600 uppercase shrink-0">Niveaux Sélectionnés :</span>
                  <div className="flex flex-wrap items-center gap-1">
                    {majorSelectedThresholds.length === 0 ? (
                      <span className="text-rose-600 font-bold text-xs italic">Aucun niveau coché</span>
                    ) : (
                      majorSelectedThresholds.map(lbl => {
                        const styles = getThresholdColorStyles(lbl, matrixThresholds);
                        return (
                          <span 
                            key={lbl} 
                            className="px-2 py-0.5 rounded text-[9px] font-extrabold border"
                            style={{ backgroundColor: styles.bg, color: styles.text, borderColor: styles.border }}
                          >
                            {lbl}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Title & Perimeter/Entity Bar */}
              <div className="report-title-unit flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
                  {majorCustomName || 'Cartographie des Risques'}
                </h2>
                <p className="text-xs text-indigo-700 font-bold flex items-center gap-1.5 bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-100">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Périmètre : {
                    majorSelectedEntity === 'all' 
                      ? 'Toutes les Unités Organisationnelles' 
                      : (entities.find(e => e.id === majorSelectedEntity)?.name || majorSelectedEntity)
                  }</span>
                </p>
              </div>

              {/* Dynamic KPI Metrics Bar (Considerably reduced in size) */}
              <div className="report-kpi-bar flex flex-wrap items-center gap-1.5">
                {/* Total Filtered Risks Card */}
                <div className="px-2 py-1 bg-slate-900 text-white rounded-md border border-slate-800 flex items-center justify-between gap-2 min-w-[110px] flex-1 shadow-2xs">
                  <span className="text-[8px] text-slate-300 font-extrabold uppercase tracking-wider">
                    Total Risques
                  </span>
                  <span className="text-xs font-black font-mono text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded">{majorFilteredRisks.length}</span>
                </div>

                {/* Per Selected Threshold Count Cards */}
                {majorSelectedThresholds.map((thresholdLabel) => {
                  const count = majorFilteredRisks.filter(r => {
                    const crit = getCriticality(r.scoreResiduel);
                    return crit.label === thresholdLabel;
                  }).length;
                  const styles = getThresholdColorStyles(thresholdLabel, matrixThresholds);

                  return (
                    <div 
                      key={thresholdLabel} 
                      className="px-2 py-1 rounded-md border flex items-center justify-between gap-2 min-w-[110px] flex-1 shadow-2xs"
                      style={{ backgroundColor: styles.bg, borderColor: styles.border }}
                    >
                      <span className="text-[8px] font-black uppercase tracking-tight" style={{ color: styles.text }}>
                        {thresholdLabel}
                      </span>
                      <span className="text-xs font-black font-mono px-1.5 py-0.5 rounded bg-white/80" style={{ color: styles.text }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mapped Risks Viewport Table */}
              {majorFilteredRisks.length === 0 ? (
                <div className="bg-slate-50 p-8 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                  <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-600 text-xs">
                    Aucun risque ne correspond au périmètre et à la graduation de criticité sélectionnée.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Cochez d'autres niveaux de graduation (ex: Élevé, Modéré) ou cliquez sur "⚡ Tous les Niveaux".
                  </p>
                  <button
                    onClick={() => applyThresholdPreset('tous')}
                    className="px-3 py-1 bg-indigo-600 text-white rounded font-bold text-xs hover:bg-indigo-700 transition cursor-pointer"
                  >
                    Afficher tous les niveaux
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-white uppercase text-[9.5px]">
                      <tr>
                        <th className="py-2.5 px-3 font-bold text-center">Intitulé du Risque</th>
                        <th className="py-2.5 px-3 font-bold text-center">Catégorie</th>
                        {majorShowScoreBrut && (
                          <th className="py-2.5 px-3 font-bold text-center">Score Brut</th>
                        )}
                        {majorShowScoreNet && (
                          <th className="py-2.5 px-3 font-bold text-center">Score Net (Criticité)</th>
                        )}
                        <th className="py-2.5 px-3 font-bold text-center">Plan d'Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {majorFilteredRisks.map((risk) => {
                        const crit = getCriticality(risk.scoreResiduel);
                        const brutCrit = getCriticality(risk.scoreBrut);
                        const category = categories.find(c => c.id === risk.categoryId || c.name === risk.categoryId);
                        const riskActions = safeActions.filter(a => a.riskId === risk.id);

                        return (
                          <tr 
                            key={risk.id}
                            onClick={() => handleOpenEdit(risk)}
                            className={`hover:bg-indigo-50/40 cursor-pointer transition ${selectedRisk?.id === risk.id ? 'bg-indigo-50 font-semibold' : ''}`}
                          >
                            <td className="py-3 px-3 font-bold text-slate-900 leading-snug max-w-xs">
                              <div className="text-sm font-extrabold text-slate-900">{risk.title}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-900 font-semibold text-xs text-center">
                              {category?.name || risk.categoryId || 'Général'}
                            </td>
                            {majorShowScoreBrut && (
                              <td className="py-3 px-3 text-center">
                                <span 
                                  className="inline-block px-2.5 py-1 rounded-lg text-xs font-black border shadow-2xs"
                                  style={{ backgroundColor: brutCrit.color, color: brutCrit.textColor, borderColor: brutCrit.textColor + '40' }}
                                >
                                  {risk.scoreBrut}
                                </span>
                              </td>
                            )}
                            {majorShowScoreNet && (
                              <td className="py-3 px-3 text-center">
                                <span 
                                  className="inline-block px-2.5 py-1 rounded-lg text-xs font-black border shadow-2xs"
                                  style={{ backgroundColor: crit.color, color: crit.textColor, borderColor: crit.textColor + '40' }}
                                >
                                  {risk.scoreResiduel} ({crit.label})
                                </span>
                              </td>
                            )}
                            <td className="py-3 px-3">
                              {riskActions.length > 0 ? (
                                <div className="space-y-2 max-w-md">
                                  {riskActions.map((act) => {
                                    let statusBg = "bg-blue-50 text-blue-800 border-blue-200";
                                    if (act.status === 'En cours') {
                                      statusBg = "bg-amber-50 text-amber-800 border-amber-200";
                                    } else if (act.status === 'Réalisé') {
                                      statusBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
                                    } else if (act.status === 'Annulé') {
                                      statusBg = "bg-rose-50 text-rose-800 border-rose-200";
                                    }

                                    return (
                                      <div key={act.id} className="py-1 px-1.5 bg-white text-xs space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                          {majorShowActionTitle && (
                                            <span className="text-indigo-950 font-extrabold text-xs">📌 {act.title}</span>
                                          )}
                                          <span className={`text-[9.5px] px-2 py-0.5 rounded font-extrabold border ${statusBg} ${!majorShowActionTitle ? 'ml-auto' : ''} shrink-0`}>
                                            {act.status || 'À planifier'}
                                          </span>
                                        </div>
                                        {act.description && (
                                          <p className="text-xs text-slate-800 leading-relaxed font-normal pt-0.5">
                                            {act.description}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-[10px] text-amber-700 font-bold bg-white px-2 py-1 inline-block">
                                  ⚠️ Aucun plan d'action renseigné
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STANDARD CARTOGRAPHIE GÉNÉRALE VIEW */
          <>
            {/* Odoo Style Sub-Header: Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleOpenCreate}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nouveau Risque
                </button>

                {/* View Mode buttons */}
                <div className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200 text-slate-500">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'hover:bg-slate-50'}`}
                    title="Vue Liste"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('kanban')}
                    className={`p-1.5 rounded transition ${viewMode === 'kanban' ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'hover:bg-slate-50'}`}
                    title="Vue Kanban"
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('graph')}
                    className={`p-1.5 rounded transition flex items-center gap-1 text-[10px] ${viewMode === 'graph' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'hover:bg-slate-50'}`}
                    title="Graphe de Dépendances Processus Métiers"
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Graphe Processus</span>
                  </button>
                </div>
              </div>

              {/* Quick text search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Rechercher par Titre, Code, ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 w-full"
                />
              </div>
            </div>

        {/* Modular filters ribbon */}
        <div className={`grid grid-cols-1 ${(isSuperAdminMode || tenantConfig?.showWorkflowFilter) ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm`}>
          <div>
            <label className="text-[10px] text-slate-400 font-bold block h-4">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1 w-full"
            >
              <option value="all">Toutes</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <OrgEntityTreeFilter
              entities={entities}
              selectedEntityId={selectedEntity}
              onSelectEntity={(id) => setSelectedEntity(id)}
              label="Périmètre / Unité d'assiette"
              includeAllOption={true}
              allOptionLabel="Tous les périmètres"
            />
          </div>
          {(isSuperAdminMode || tenantConfig?.showWorkflowFilter) && (
            <div>
              <label className="text-[10px] text-slate-400 font-bold block h-4">Étape Workflow</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1 w-full"
              >
                <option value="all">Tous</option>
                {workflowSteps.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* RISKS VIEWPORT CONTAINER */}
        {filteredRisks.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-500 font-semibold">Aucun risque ne correspond à vos filtres.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedEntity('all'); setSelectedStatus('all'); }} 
              className="text-indigo-600 hover:underline hover:font-bold font-medium"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* Odoo Style Beautiful Tree list Table view with scrollbar */
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-300">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-2xs">
                  <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4 font-bold">Code</th>
                    <th className="py-2.5 px-4 font-bold">Intitulé du risque</th>
                    <th className="py-2.5 px-4 font-bold">Entité Affectée</th>
                    <th className="py-2.5 px-4 font-bold text-center">Score Brut</th>
                    <th className="py-2.5 px-4 font-bold text-center">Risque Net</th>
                    <th className="py-2.5 px-4 font-bold text-center">Statut</th>
                    <th className="py-2.5 px-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRisks.map((risk) => {
                    const crit = getCriticality(risk.scoreResiduel);
                    const category = categories.find(c => c.id === risk.categoryId || c.name === risk.categoryId || c.name.toLowerCase() === risk.categoryId?.toLowerCase());
                    const entity = entities.find(e => e.id === risk.entityId);
                    const step = workflowSteps.find(s => s.id === risk.statusId);
                    
                    return (
                      <tr 
                        key={risk.id}
                        onClick={() => handleOpenEdit(risk)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          selectedRisk?.id === risk.id ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{risk.id}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800 text-[11px] leading-tight">{risk.title}</p>
                          <span 
                            className="inline-block mt-1 font-semibold text-[9px] px-1.5 py-0.5 rounded text-white"
                            style={{ backgroundColor: category?.color || '#cbd5e1' }}
                          >
                            {category?.name || risk.categoryId || 'Non catégorisé'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600">
                          {entity ? entity.name : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">{risk.scoreBrut}</td>
                        <td className="py-3 px-4 text-center">
                          <span 
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border"
                            style={{ backgroundColor: crit.color, color: crit.textColor, borderColor: crit.textColor + '35' }}
                          >
                            {risk.scoreResiduel} ({crit.label})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${step?.color}`}>
                            {step ? step.name.substring(2) : risk.statusId}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              onClick={() => {
                                if (confirm("Êtes-vous sûr de vouloir archiver/supprimer ce risque ?")) {
                                  onDeleteRisk(risk.id);
                                  setSelectedRisk(null);
                                }
                              }}
                              className="p-1 hover:text-red-600 rounded hover:bg-red-50 text-slate-400"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Board layout */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRisks.map((risk) => {
              const crit = getCriticality(risk.scoreResiduel);
              const category = categories.find(c => c.id === risk.categoryId || c.name === risk.categoryId || c.name.toLowerCase() === risk.categoryId?.toLowerCase());
              const entity = entities.find(e => e.id === risk.entityId);
              
              return (
                <div 
                  key={risk.id}
                  onClick={() => handleOpenEdit(risk)}
                  className={`bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer relative ${
                    selectedRisk?.id === risk.id ? 'ring-2 ring-indigo-600/30' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[9px]">
                        {risk.id}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le risque [${risk.id}] ${risk.title} ?`)) {
                            onDeleteRisk(risk.id);
                            if (selectedRisk?.id === risk.id) setSelectedRisk(null);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Supprimer ce risque"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span 
                      className="px-2 py-0.5 rounded text-[9px] font-bold border"
                      style={{ backgroundColor: crit.color, color: crit.textColor, borderColor: crit.textColor + '30' }}
                    >
                      Score Net : {risk.scoreResiduel}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-[11px] leading-tight mb-2">{risk.title}</h4>
                  <p className="text-slate-500 text-[10px] line-clamp-2 leading-relaxed mb-3">{risk.description}</p>
                  
                  <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-100 gap-2">
                    <span 
                      className="text-[9px] font-bold px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: category?.color || '#cbd5e1' }}
                    >
                      {category?.name || risk.categoryId || 'Non catégorisé'}
                    </span>
                    <span className="text-slate-400 italic text-[10px]">{entity?.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Multi-Level Process Dependency Graph View */
          <div className="space-y-6">
            <div className="p-4 bg-indigo-900 text-white rounded-xl shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-indigo-300" />
                  <h3 className="font-bold text-sm text-indigo-100">Graphe Visuel de Dépendances Multi-Niveaux des Processus Métiers</h3>
                </div>
                <span className="bg-indigo-800 text-indigo-200 font-mono text-[9px] px-2 py-0.5 rounded border border-indigo-700 font-bold">
                  Indépendant des Entités
                </span>
              </div>
              <p className="text-[11px] text-indigo-200 leading-relaxed">
                Représentation sous forme d'arborescence des processus transversaux de l'organisation : <strong className="text-white">Processus Métiers ➔ Sous-processus ➔ Risques Identifiés ➔ Dispositifs de Contrôle Interne</strong>.
              </p>
            </div>

            {/* Tree Nodes for Business Processes */}
            <div className="space-y-4">
              {[
                {
                  code: 'PROC-01',
                  nom: 'Gestion des Ventes & Relation Client GRC',
                  pilote: 'Direction Commerciale',
                  sousProcessus: [
                    { code: 'SP-1.1', nom: 'Prise de commande et Validation de solvabilité', risques: safeRisks.slice(0, 2) },
                    { code: 'SP-1.2', nom: 'Facturation client et Suivi des créances', risques: safeRisks.slice(2, 3) }
                  ]
                },
                {
                  code: 'PROC-02',
                  nom: 'Sécurité de l\'Information & Infrastructures Cloud',
                  pilote: 'Direction de la Sécurité (RSSI)',
                  sousProcessus: [
                    { code: 'SP-2.1', nom: 'Gestion des accès et des identités privilégiées', risques: safeRisks.slice(1, 3) },
                    { code: 'SP-2.2', nom: 'Sauvegardes et Plan de Continuité d\'Activité (PCA)', risques: safeRisks.slice(0, 1) }
                  ]
                },
                {
                  code: 'PROC-03',
                  nom: 'Gestion de la Trésorerie & Engagements Financiers',
                  pilote: 'Direction Financière',
                  sousProcessus: [
                    { code: 'SP-3.1', nom: 'Paiement des fournisseurs et Rapprochement bancaire', risques: safeRisks.slice(3, 5) }
                  ]
                }
              ].map((proc) => (
                <div key={proc.code} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition space-y-4">
                  {/* Process Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                        {proc.code}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs">{proc.nom}</h4>
                    </div>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                      Pilote : {proc.pilote}
                    </span>
                  </div>

                  {/* Sub-processes tree children */}
                  <div className="pl-4 border-l-2 border-indigo-200 space-y-3">
                    {proc.sousProcessus.map((sp) => (
                      <div key={sp.code} className="bg-slate-50/70 p-3 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                            {sp.code}
                          </span>
                          <strong className="text-slate-800 text-[11px]">{sp.nom}</strong>
                        </div>

                        {/* Linked Risks in sub-process */}
                        <div className="pt-1 pl-3 border-l border-slate-300 space-y-1.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">
                            Risques Rattachés à ce Sous-Processus ({sp.risques.length}) :
                          </span>
                          {sp.risques.length === 0 ? (
                            <span className="text-slate-400 text-[10px] italic">Aucun risque directement rattaché.</span>
                          ) : (
                            sp.risques.map((r) => {
                              const crit = getCriticality(r.scoreResiduel);
                              return (
                                <div 
                                  key={r.id} 
                                  onClick={() => handleOpenEdit(r)}
                                  className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-indigo-50/30 transition"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] font-bold text-indigo-600">{r.id}</span>
                                    <span className="text-[10.5px] font-semibold text-slate-800">{r.title}</span>
                                  </div>
                                  <span 
                                    className="px-1.5 py-0.2 rounded text-[9px] font-bold border"
                                    style={{ backgroundColor: crit.color, color: crit.textColor }}
                                  >
                                    Net : {r.scoreResiduel}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* RIGHT AREA: Odoo Form Sheet and Sidebar Details */}
      {(selectedRisk || isCreating) ? (
        <div className="w-full md:w-[450px] bg-white border-t md:border-t-0 border-l border-slate-200 shadow-sm flex flex-col h-full overflow-y-auto">
          
          {/* Header Odoo stage bar */}
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">
                {isCreating ? "✏️ Création Risque" : `📄 Fiche ${selectedRisk?.id}`}
              </span>
              {!isCreating && selectedRisk && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le risque [${selectedRisk.id}] ${selectedRisk.title} ?`)) {
                      onDeleteRisk(selectedRisk.id);
                      setSelectedRisk(null);
                      onAddLog('Suppression Risque', `Suppression du risque ${selectedRisk.id}`);
                    }
                  }}
                  className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-bold border border-red-200 flex items-center gap-1 cursor-pointer transition"
                  title="Supprimer ce risque"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>

            {/* Clickable Status Bar */}
            {!isCreating && (
              <div className="flex items-center space-x-0.5 text-[9px] font-bold uppercase">
                {workflowSteps.map((s, index) => {
                  const isActive = selectedRisk?.statusId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => changeWorkflowStep(s.id)}
                      className={`px-2 py-1 rounded-sm border transition-all ${
                        isActive 
                           ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {s.name ? s.name.substring(2) : s.id}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Intitulé du Risque</label>
              <input 
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex. Fuite de données critiques clients..."
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
              />
            </div>

            {/* Section 1: Description Détaillée */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Description Détaillée du Risque
              </label>
              <textarea 
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={2}
                placeholder="Description globale du risque et contexte d'apparition..."
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Section 2: Causes du Risque */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Causes du Risque (Facteurs déclencheurs)
              </label>
              <textarea 
                value={formCauses}
                onChange={(e) => setFormCauses(e.target.value)}
                rows={2}
                placeholder="Ex. Faiblesse de contrôle interne, vulnérabilité technique, erreur humaine, facteur externe..."
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Section 3: Conséquences du Risque */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                Conséquences du Risque (Impacts majeurs)
              </label>
              <textarea 
                value={formConsequences}
                onChange={(e) => setFormConsequences(e.target.value)}
                rows={2}
                placeholder="Ex. Pertes financières, arrêt d'activité, sanctions réglementaires, atteinte à l'image..."
                className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Catégorie</label>
                <select
                  value={categories.some(c => c.id === formCategory) ? formCategory : (categories.find(c => c.name === formCategory || c.name.toLowerCase() === formCategory?.toLowerCase())?.id || categories[0]?.id || '')}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {categories.length === 0 && (
                    <option value="">Aucune catégorie disponible</option>
                  )}
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Périmètre / Entité</label>
                <select
                  value={entities.some(e => e.id === formEntity) ? formEntity : (entities.find(e => e.name === formEntity || e.name.toLowerCase() === formEntity?.toLowerCase())?.id || entities[0]?.id || '')}
                  onChange={(e) => setFormEntity(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {entities.length === 0 && (
                    <option value="">Aucune entité disponible</option>
                  )}
                  {entities.map(ent => (
                    <option key={ent.id} value={ent.id}>{ent.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* RATINGS ENGINE CONFIGURATION */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
              <h4 className="font-bold text-xs text-indigo-600 uppercase border-b border-indigo-200 pb-1 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5" />
                Évaluation (Formule: {formulaExpr})
              </h4>
              
              {/* Variable 1: Probability */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Probabilité/Fréquence (P)</span>
                  <span className="font-bold font-mono text-xs text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100 shadow-sm">{formFreq}</span>
                </div>
                <select
                  value={formFreq}
                  onChange={(e) => setFormFreq(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded p-1.5"
                >
                  {frequencyScales.map(item => (
                    <option key={item.value} value={item.value}>
                      Cotation {item.value} : {item.label}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 italic">
                  {frequencyScales.find(f => f.value === formFreq)?.description}
                </p>
              </div>

              {/* Variable 2: Impact */}
              <div className="space-y-1 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Impact Conséquence (I)</span>
                  <span className="font-bold font-mono text-xs text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100 shadow-sm">{formImpact}</span>
                </div>
                <select
                  value={formImpact}
                  onChange={(e) => setFormImpact(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded p-1.5"
                >
                  {impactScales.map(item => (
                    <option key={item.value} value={item.value}>
                      Cotation {item.value} : {item.label}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 italic">
                  {impactScales.find(f => f.value === formImpact)?.description}
                </p>
              </div>

              {/* Variable 3: Maîtrise (conditional if Direct Brut mode) */}
              {(() => {
                const { scoreBrut: formScoreBrut, scoreResiduel: formScoreResiduel, isDirect: isDirectFormula } = computeGRCScores(formFreq, formImpact, formControl, tenantConfig?.formula);

                return (
                  <>
                    {isDirectFormula ? (
                      <div className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-lg text-indigo-900 text-[10.5px] mt-2 space-y-1">
                        <span className="font-bold flex items-center gap-1 text-indigo-800">
                          <Wrench className="w-3.5 h-3.5 text-indigo-600" /> Mode Score Brut Direct (Sans Maîtrise)
                        </span>
                        <p className="text-slate-600 text-[10px] leading-relaxed">
                          Conformément à la formule GRC configurée, l'atténuation par le niveau de maîtrise (M) n'est pas appliquée. Le Score Net est strictement égal au Score Brut (F × I).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Niveau de Maîtrise / Contrôle (M)</span>
                          <span className="font-bold font-mono text-xs text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100 shadow-sm">{formControl}</span>
                        </div>
                        <select
                          value={formControl}
                          onChange={(e) => setFormControl(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded p-1.5"
                        >
                          {controlScales.map(item => (
                            <option key={item.value} value={item.value}>
                              Cotation {item.value} : {item.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[9px] text-slate-400 italic">
                          {controlScales.find(f => f.value === formControl)?.description}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-purple-100 shadow-sm text-center mt-3">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Score Brut</span>
                        <span className="font-extrabold text-slate-700 text-lg font-mono">{formScoreBrut}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Score Net / Résiduel</span>
                        <span className="font-extrabold text-red-600 text-lg font-mono">{formScoreResiduel}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Workflow status picker if creating */}
            {isCreating && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Statut d'Initiation</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600"
                >
                  {workflowSteps.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded shadow transition-all cursor-pointer text-center"
              >
                Enregistrer les modifications
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRisk(null); setIsCreating(false); }}
                className="py-2 px-3 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition-all cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </form>

          {/* RELATED PLANS AND FORUM COMMENTS FOR EXISTING RISK */}
          {!isCreating && selectedRisk && (
            <div className="border-t border-slate-200 bg-slate-50/50 p-5 space-y-4">
              
              {/* RELATED ACTION PLANS LIST */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-slate-700 uppercase flex items-center gap-1">
                    🔧 Actions Correctives associées
                  </h4>
                  <button 
                    onClick={() => setShowAddAction(!showAddAction)}
                    className="text-[11px] text-indigo-600 hover:underline font-bold flex items-center gap-0.5"
                  >
                    {showAddAction ? "Fermer" : "+ Ajouter une action"}
                  </button>
                </div>

                {showAddAction && (
                  <form onSubmit={handleAddActionPlanSubmit} className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <p className="font-semibold text-slate-700 text-[10px]">Nouvelle action de remédiation</p>
                    <input 
                      type="text" 
                      placeholder="Intitulé de l'action corrective..." 
                      required
                      value={actionTitle}
                      onChange={(e) => setActionTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded focus:outline-none focus:border-indigo-600 font-semibold"
                    />
                    <textarea 
                      placeholder="Description de la solution corrective..." 
                      value={actionDesc}
                      onChange={(e) => setActionDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded focus:outline-none focus:border-indigo-600"
                    ></textarea>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={actionOwnerName}
                        onChange={(e) => setActionOwnerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded"
                      >
                        <option value="">Pilote (Propriétaire)</option>
                        {safeUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                      <input 
                        type="date"
                        value={actionDueDate}
                        onChange={(e) => setActionDueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded"
                      />
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-1">
                      <select 
                        value={actionPriority}
                        onChange={(e) => setActionPriority(e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 text-xs p-1.5 rounded"
                      >
                        <option value="Basse">Priorité: Basse</option>
                        <option value="Moyenne">Priorité: Moyenne</option>
                        <option value="Haute">Priorité: Haute</option>
                        <option value="Critique">Priorité: Critique</option>
                      </select>
                      <button 
                        type="submit"
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold hover:bg-indigo-700 cursor-pointer"
                      >
                        Créer plan d'action
                      </button>
                    </div>
                  </form>
                )}

                {/* Actual related actions list */}
                <div className="space-y-1.5">
                  {safeActions.filter(a => a.riskId === selectedRisk.id).length === 0 ? (
                    <p className="text-slate-400 italic text-[10px] text-center py-2">Aucun moyen correctif n'est planifié pour ce risque.</p>
                  ) : (
                    safeActions.filter(a => a.riskId === selectedRisk.id).map(a => (
                      <div key={a.id} className="bg-white p-2.5 rounded border border-slate-100 flex items-center justify-between text-xs hover:border-indigo-150 transition-all">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 text-[11px] leading-tight">{a.title}</p>
                          <p className="text-[10px] text-slate-400">Responsable: <span className="font-semibold text-indigo-650">{a.ownerName}</span> | Échéance: {a.dueDate}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          a.status === 'Réalisé' ? 'bg-green-100 text-green-800' :
                          a.status === 'En cours' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* TIMELINE AUDIT HISTORY */}
              <div className="space-y-2 border-t border-slate-200/60 pt-4">
                <h4 className="font-bold text-xs text-slate-700 uppercase flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Journal d'impact & Historique d'évaluation
                </h4>
                
                {/* Comments Form */}
                <div className="flex gap-2 text-xs">
                  <input 
                    type="text" 
                    placeholder="Écrire une observation ou note interne..." 
                    value={historyComment}
                    onChange={(e) => setHistoryComment(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 text-xs p-1.5 rounded focus:outline-none focus:border-indigo-600"
                  />
                  <button 
                    onClick={handleAddComment}
                    className="px-3 bg-slate-700 hover:bg-slate-800 text-white rounded font-bold cursor-pointer text-[10px]"
                  >
                    Ajouter
                  </button>
                </div>

                {/* Timeline */}
                <div className="space-y-2 max-h-48 overflow-y-auto pt-1 pr-1">
                  {selectedRisk.history.slice().reverse().map((h, i) => (
                    <div key={i} className="relative pl-4 border-l border-slate-300 pb-2 text-[10px]">
                      <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-indigo-500"></div>
                      <div className="flex justify-between items-center text-slate-400 font-mono text-[9px]">
                        <span>{h.date} - 👤 {h.user}</span>
                        <span className="font-bold text-indigo-600">{h.action}</span>
                      </div>
                      <p className="text-slate-600 font-medium leading-relaxed mt-0.5">{h.comment || "Aucune note additionnelle."}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-12 text-slate-400 text-center bg-white">
          <ShieldAlert className="w-14 h-14 text-slate-200 mb-3" />
          <h3 className="font-bold text-slate-600 text-sm">Fiche de Détail Odoo</h3>
          <p className="max-w-xs text-xs mt-1 leading-relaxed">
            Sélectionnez un risque existant dans la cartographie à gauche pour afficher sa fiche d'évaluation, ses plans d'actions d'atténuation et son journal d'audit en temps réel, ou cliquez sur <strong>Nouveau Risque</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
