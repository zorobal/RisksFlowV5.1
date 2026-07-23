/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Grid, 
  HelpCircle, 
  ChevronRight, 
  ShieldAlert, 
  Check, 
  Building2,
  FolderOpen,
  Search,
  Maximize2,
  Printer,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Table,
  Eye,
  Info,
  Layers,
  Download,
  AlertCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { Risk, TenantConfig, ActionPlan } from '../types';

interface MatrixModuleProps {
  risks: Risk[];
  tenantConfig: TenantConfig;
  onAddLog: (action: string, details: string) => void;
  actions?: ActionPlan[]; // Optional actions to bind and compute dynamic trend
}

export default function MatrixModule({
  risks,
  tenantConfig,
  onAddLog,
  actions = []
}: MatrixModuleProps) {
  const [matrixType, setMatrixType] = useState<'brut' | 'net'>('brut');
  const [selectedCell, setSelectedCell] = useState<{ y: number; x: number } | null>(null);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [viewStyle, setViewStyle] = useState<'standard' | 'presentation'>('standard');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Local Filter States
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Refs for capture
  const standardMatrixRef = useRef<HTMLDivElement>(null);
  const presentationMatrixRef = useRef<HTMLDivElement>(null);
  const registerTableRef = useRef<HTMLDivElement>(null);
  const printRegisterTableRef = useRef<HTMLDivElement>(null);

  // Filter risk base list
  const filteredRisks = risks.filter(r => {
    const matchEntity = entityFilter === 'all' || r.entityId === entityFilter;
    const matchCat = categoryFilter === 'all' || r.categoryId === categoryFilter;
    const matchSearch = searchQuery.trim() === '' || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchEntity && matchCat && matchSearch;
  });

  const getCriticality = (score: number) => {
    const found = tenantConfig.matrixThresholds.find(t => score >= t.minScore && score <= t.maxScore);
    return found || tenantConfig.matrixThresholds[0];
  };

  // Matrix sizes from 3 to 10
  const size = tenantConfig.matrixSize;

  // Render Brut Matrix (Frequency Y vs Impact X)
  const freqValues = Array.from({ length: size }, (_, i) => size - i); // e.g. 5, 4, 3, 2, 1
  const impactValues = Array.from({ length: size }, (_, i) => i + 1); // e.g. 1, 2, 3, 4, 5

  // Dynamic Brut Brackets based on matrixSize
  const getBrutBrackets = () => {
    if (size === 5) {
      return [
        { label: 'Sévère (20-25)', min: 20, max: 25 },
        { label: 'Majeur (13-19)', min: 13, max: 19 },
        { label: 'Modéré (6-12)', min: 6, max: 12 },
        { label: 'Faible (1-5)', min: 1, max: 5 }
      ];
    } else {
      return [
        { label: 'Sévère (12-16)', min: 12, max: 16 },
        { label: 'Majeur (8-11)', min: 8, max: 11 },
        { label: 'Modéré (4-7)', min: 4, max: 7 },
        { label: 'Faible (1-3)', min: 1, max: 3 }
      ];
    }
  };

  const brutBrackets = getBrutBrackets();
  const controlValues = Array.from({ length: size === 5 ? 5 : 4 }, (_, i) => i + 1);

  // Vibrant aesthetic matching the attached image
  const getVibrantColors = (critLabel: string) => {
    const labelLower = critLabel.toLowerCase();
    if (labelLower.includes('faible') || labelLower.includes('mineur') || labelLower.includes('bas')) {
      return {
        bg: '#00DF89', // Vibrant neon mint green from attached image
        text: '#091E13',
        border: '#00c578'
      };
    }
    if (labelLower.includes('modéré') || labelLower.includes('moyen')) {
      return {
        bg: '#FFE600', // Vibrant pure yellow from attached image
        text: '#221F00',
        border: '#e6cf00'
      };
    }
    // High / Critical / Catastrophic
    return {
      bg: '#FF2E2E', // Vibrant solid red from attached image
      text: '#FFFFFF',
      border: '#e61d1d'
    };
  };

  const getCellClassNameForBrut = (f: number, i: number) => {
    const product = f * i;
    const ratio = size === 4 ? (16 / 64) : (25 / 25);
    const scoreVal = product / ratio;
    const crit = getCriticality(scoreVal);
    const labelLower = crit.label.toLowerCase();
    
    if (labelLower.includes('faible') || labelLower.includes('mineur') || labelLower.includes('bas')) {
      return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-850 border-emerald-200';
    }
    if (labelLower.includes('modéré') || labelLower.includes('moyen')) {
      return 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200';
    }
    if (labelLower.includes('significatif') || labelLower.includes('critique')) {
      return 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-orange-200';
    }
    return 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200';
  };

  const getCellClassNameForNet = (brutMin: number, controlVal: number) => {
    const midBrut = brutMin; 
    let netScore = midBrut * controlVal;
    
    if (tenantConfig.formula.expression === '(P * I) - M') {
      netScore = Math.max(0, midBrut - controlVal);
    }

    const crit = getCriticality(netScore);
    const labelLower = crit.label.toLowerCase();

    if (labelLower.includes('faible') || labelLower.includes('mineur') || labelLower.includes('bas')) {
      return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-850 border-emerald-200';
    }
    if (labelLower.includes('modéré') || labelLower.includes('moyen')) {
      return 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200';
    }
    if (labelLower.includes('significatif') || labelLower.includes('critique')) {
      return 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-orange-200';
    }
    return 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200';
  };

  // Risks inside a selected Brut Cell
  const getRisksInBrutCell = (f: number, i: number) => {
    return filteredRisks.filter(r => r.frequencyValue === f && r.impactValue === i);
  };

  // Risks inside a selected Net Cell (Brut bracket vs Maîtrise value)
  const getRisksInNetCell = (brutMin: number, brutMax: number, m: number) => {
    return filteredRisks.filter(r => r.scoreBrut >= brutMin && r.scoreBrut <= brutMax && r.controlValue === m);
  };

  const currentCellRisks = selectedCell 
    ? (matrixType === 'brut' 
        ? getRisksInBrutCell(selectedCell.y, selectedCell.x)
        : getRisksInNetCell(selectedCell.y, selectedCell.y + (size === 5 ? 5 : 3), selectedCell.x)
      )
    : [];

  const handleCellClick = (y: number, x: number) => {
    if (selectedCell && selectedCell.y === y && selectedCell.x === x) {
      setSelectedCell(null);
    } else {
      setSelectedCell({ y, x });
      onAddLog('Drill-down Matrice', `Filtre interactif appliqué sur la coordonnée [Y=${y}, X=${x}]`);
    }
  };

  // Professional logical trend indicators based on associated mitigation plans
  const getRiskTrend = (r: Risk) => {
    const riskActions = actions.filter(a => a.riskId === r.id);
    if (riskActions.length === 0) {
      return { icon: <Minus className="w-3.5 h-3.5 text-gray-400" />, label: 'Stable', color: 'text-gray-500 bg-gray-50' };
    }
    const avgProgress = riskActions.reduce((acc, cur) => acc + cur.progress, 0) / riskActions.length;
    if (avgProgress > 50) {
      return { icon: <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />, label: 'Baisse', color: 'text-emerald-700 bg-emerald-50 border border-emerald-100' };
    }
    if (avgProgress > 0) {
      return { icon: <Minus className="w-3.5 h-3.5 text-blue-500" />, label: 'Stable', color: 'text-blue-700 bg-blue-50 border border-blue-100' };
    }
    return { icon: <TrendingUp className="w-3.5 h-3.5 text-rose-500 font-bold" />, label: 'Hausse', color: 'text-rose-700 bg-rose-50 border border-rose-100' };
  };

  // Structured consequences based on category for realistic printable detail
  const getRiskConsequences = (r: Risk) => {
    if (r.categoryId === 'cat_finance') return 'Pertes financières de trésorerie, pénalités contractuelles et impacts sur les marges.';
    if (r.categoryId === 'cat_operational') return 'Rupture d\'activité, retards de livraison, goulots d\'étranglements et insatisfaction client.';
    if (r.categoryId === 'cat_it') return 'Indisponibilité des serveurs, risque de piratage, violation de données confidentielles (RGPD).';
    if (r.categoryId === 'cat_regulatory') return 'Amendes administratives lourdes (CNIL, régulateurs), risques judiciaires et dégradation de réputation.';
    if (r.categoryId === 'cat_human') return 'Absentéisme accru, perte de compétences clés, climat social tendu et baisse de productivité.';
    return 'Perturbations de l\'activité, coûts de remédiation imprévus et dégradation de l\'image de marque.';
  };

  const handlePrint = () => {
    onAddLog('Exportation Cartographie', `Déclenchement de l'impression du rapport papier (${size}x${size})`);
    window.print();
  };

  // High-fidelity PNG Export using html2canvas
  const handleExportPNG = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    setIsExporting(true);
    onAddLog('Exportation Image PNG', `Génération d'un fichier image PNG de haute qualité pour ${filename}`);
    
    try {
      // Store current scroll heights to restore later
      const originalScrollTop = ref.current.scrollTop;
      ref.current.scrollTop = 0;

      // Small delay to allow any paint
      await new Promise(resolve => setTimeout(resolve, 150));

      // Tag and consolidate same-origin stylesheets from original document
      let consolidatedCss = '';
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            let sheetCss = '';
            for (let i = 0; i < rules.length; i++) {
              sheetCss += rules[i].cssText + '\n';
            }
            consolidatedCss += sheetCss + '\n';

            if (sheet.ownerNode && sheet.ownerNode instanceof HTMLElement) {
              sheet.ownerNode.setAttribute('data-html2canvas-remove-style', 'true');
            }
          }
        } catch (e) {
          // Cross-origin, ignore
        }
      });

      const canvas = await html2canvas(ref.current, {
        scale: 2, // Doubled pixel density for high resolution crispness
        useCORS: true,
        allowTaint: true,
        backgroundColor: null, // support transparent border overlays beautifully
        logging: false,
        onclone: (clonedDoc) => {
          // You can perform DOM adjustments in cloned render context if needed
          const clonedEl = clonedDoc.getElementById(ref.current?.id || '');
          if (clonedEl) {
            clonedEl.style.maxHeight = 'none';
            clonedEl.style.overflow = 'visible';
          }

          // Resolve oklch / color-mix / light-dark / oklab colors into standard rgb/rgba computed colors so html2canvas doesn't crash
          const oklchRegex = /(?:oklch|color-mix|light-dark|oklab)\((?:[^()]+|\([^()]*\))*\)/gi;

          // Create a temporary element on the ORIGINAL document for computing style colors
          const tempEl = document.createElement('div');
          tempEl.style.display = 'none';
          document.body.appendChild(tempEl);

          // Standardize non-standard colors using a 1x1 canvas
          const convertColorToRgba = (colorStr: string) => {
            try {
              const cvs = document.createElement('canvas');
              cvs.width = 1;
              cvs.height = 1;
              const ctx = cvs.getContext('2d');
              if (!ctx) return colorStr;
              ctx.clearRect(0, 0, 1, 1);
              ctx.fillStyle = colorStr;
              ctx.fillRect(0, 0, 1, 1);
              const data = ctx.getImageData(0, 0, 1, 1).data;
              return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${parseFloat((data[3] / 255).toFixed(3))})`;
            } catch (e) {
              return colorStr;
            }
          };

          const resolveColor = (colorStr: string) => {
            try {
              tempEl.style.color = '';
              tempEl.style.color = colorStr;
              const computed = window.getComputedStyle(tempEl).color;
              if (computed && computed !== '') {
                // If computed color contains any oklch, color-mix or isn't rgb/rgba/hex, use Canvas to resolve
                if (!/^(?:#|rgb\s*\(|rgba\s*\()/i.test(computed)) {
                  return convertColorToRgba(computed);
                }
                return computed;
              }
              return colorStr;
            } catch (e) {
              return colorStr;
            }
          };

          // Sanitize the consolidated CSS string
          let prevText = '';
          let currentText = consolidatedCss;
          // Loop up to 3 times to handle nested functions from the inside out
          for (let i = 0; i < 3 && currentText !== prevText; i++) {
            prevText = currentText;
            currentText = currentText.replace(oklchRegex, resolveColor);
          }

          // Remove the processed style/link nodes from clonedDoc
          clonedDoc.querySelectorAll('[data-html2canvas-remove-style="true"]').forEach(node => {
            node.parentNode?.removeChild(node);
          });

          // Inject the clean consolidated CSS as a single style tag in clonedDoc
          const styleEl = clonedDoc.createElement('style');
          styleEl.textContent = currentText;
          clonedDoc.head.appendChild(styleEl);

          // Clean all elements with inline style attribute in clonedDoc
          clonedDoc.querySelectorAll('[style]').forEach(el => {
            const styleAttr = el.getAttribute('style');
            if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('color-mix') || styleAttr.includes('light-dark') || styleAttr.includes('oklab'))) {
              let prevAttr = '';
              let currentAttr = styleAttr;
              for (let i = 0; i < 3 && currentAttr !== prevAttr; i++) {
                prevAttr = currentAttr;
                currentAttr = currentAttr.replace(oklchRegex, resolveColor);
              }
              el.setAttribute('style', currentAttr);
            }
          });

          // Cleanup temp element from original document
          document.body.removeChild(tempEl);
        }
      });

      ref.current.scrollTop = originalScrollTop;

      const imageURI = canvas.toDataURL('image/png');
      const downloadLink = clonedDocDownloadLink(imageURI, filename);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Erreur exportation image PNG:', err);
      alert("L'exportation PNG a échoué. Veuillez réessayer. L'erreur a été rapportée en console.");
    } finally {
      document.querySelectorAll('[data-html2canvas-remove-style="true"]').forEach(node => {
        node.removeAttribute('data-html2canvas-remove-style');
      });
      setIsExporting(false);
    }
  };

  const clonedDocDownloadLink = (uri: string, name: string) => {
    const a = document.createElement('a');
    a.href = uri;
    a.download = name;
    return a;
  };

  // Render printable executive report view
  if (isPrintMode) {
    return (
      <div className="flex-1 p-8 bg-white overflow-y-auto space-y-8 text-slate-800 print-full-width" id="print-area">
        {/* Style injection for seamless high-quality printing */}
        <style>{`
          @media print {
            @page {
              size: A4 landscape;
              margin: 10mm 15mm 10mm 15mm;
            }
            .no-print {
              display: none !important;
            }
            body {
              background: white !important;
              color: #1e293b !important;
            }
            #print-area {
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-card {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              border: 1px solid #cbd5e1 !important;
              box-shadow: none !important;
              margin-bottom: 2rem !important;
            }
            .print-page-break {
              page-break-before: always !important;
              break-before: page !important;
            }
          }
        `}</style>

        {/* Floating print actions for preview */}
        <div className="no-print flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-650 rounded-lg text-white font-bold text-xs">Aperçu</span>
            <div>
              <h4 className="font-bold text-sm">Mode Rapport de Présentation (Exportation PDF Paysage)</h4>
              <p className="text-slate-400 text-[11px]">Formaté pour le papier A4 Paysage. Utilisez la fonction PDF de votre navigateur.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintMode(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'application
            </button>
            <button
              onClick={() => handleExportPNG(printRegisterTableRef, 'rapport-paysage-complet.png')}
              disabled={isExporting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Télécharger Rapport complet (PNG)
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" />
              Déclencher Impression / PDF
            </button>
          </div>
        </div>

        {/* Sandbox compliance banner */}
        <div className="no-print bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-2.5 text-amber-900 text-[11px]">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">⚠️ Note de compatibilité Iframe :</span> Si le bouton d'impression ne s'ouvre pas, c'est en raison des règles de sécurité de l'iframe de prévisualisation. Pour imprimer en PDF classique :
            <ul className="list-disc list-inside mt-1 font-medium text-amber-800">
              <li>Cliquez d'abord sur le bouton <strong>"Ouvrir dans un nouvel onglet"</strong> (icône flèche en haut à droite de l'AI Studio).</li>
              <li>Puis cliquez sur <strong>"Déclencher Impression / PDF"</strong> pour ouvrir le dialogue natif de votre navigateur.</li>
              <li>Alternativement, utilisez le bouton <strong>"Télécharger Rapport complet (PNG)"</strong> qui fonctionne de manière 100% autonome et sécurisée !</li>
            </ul>
          </div>
        </div>

        {/* Outer print wrapper captured for PDF/PNG rendering */}
        <div id="print-capture-area" ref={printRegisterTableRef} className="bg-white p-6 rounded-lg space-y-6">
          {/* Company Header Block */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 gap-4">
            <div className="flex items-start gap-4">
              {tenantConfig.logoUrl && (
                <img 
                  src={tenantConfig.logoUrl} 
                  alt="Logo Entreprise" 
                  className="h-16 max-w-[140px] object-contain rounded border border-slate-200 p-1 bg-white shrink-0" 
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="space-y-2">
                <span className="px-3 py-1 bg-slate-100 border border-slate-300 text-slate-800 text-[10px] font-extrabold uppercase rounded-full">
                  RAPPORT OFFICIEL GRC (ORGANISME CONFORME)
                </span>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Cartographie Analytique des Risques Majeurs
                </h1>
                <p className="text-slate-500 text-xs">
                  Généré le {new Date().toLocaleDateString('fr-FR')} | Organisme client : <strong className="text-slate-800 font-extrabold">{tenantConfig.companyName}</strong>
                </p>
              </div>
            </div>
            <div className="text-right border-l pl-6 border-slate-200 space-y-1 shrink-0">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">{tenantConfig.companyName}</h4>
              <p className="text-[10px] text-slate-400">Évaluation Dimension : <strong className="font-bold text-slate-700">{size}x{size}</strong></p>
              <p className="text-[10px] text-slate-400">Périmètre : <strong className="font-bold text-slate-700">Global Corporate</strong></p>
            </div>
          </div>

          {/* Executive Summary Paragraph */}
          <div className="bg-slate-50 border-l-4 border-indigo-600 p-4 rounded-r-lg space-y-1 print-card">
            <h3 className="font-bold text-slate-900 text-xs">Note de Synthèse GRC</h3>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Ce document présente l'évaluation consolidée des risques pour l'entreprise <strong className="font-semibold text-slate-800">{tenantConfig.companyName}</strong>. 
              Il intègre la répartition matricielle des vulnérabilités identifiées ainsi que le registre détaillé du portefeuille de risques. 
              Ces données font foi pour la conformité réglementaire, la gouvernance interne et l'allocation des plans d'action de mitigation.
            </p>
          </div>

          {/* Register Table Section */}
          <div className="space-y-3 print-page-break">
            <h3 className="font-bold text-slate-900 text-xs border-b pb-2 flex items-center gap-1.5">
              <Table className="w-4 h-4 text-indigo-600" />
              3. Registre d'Enregistrement Détaillé des Risques (Portefeuille GRC)
            </h3>

            <div className="overflow-hidden border border-slate-300 rounded-lg">
              <table className="w-full text-left border-collapse text-[9.5px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase font-extrabold border-b border-slate-300">
                    <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center">ID</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-32">Nature / Catégorie</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Description du Risque</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 w-10 text-center">Grav (I)</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 w-10 text-center">Prob (P)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-16 text-center">Crit (Brut)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-16 text-center">Net</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 w-44">Conséquences Potentielles</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 w-14 text-center">Tendance</th>
                    <th className="py-2.5 px-3 w-28">Responsable Métier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredRisks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">Aucun risque enregistré dans cette base de données client.</td>
                    </tr>
                  ) : (
                    filteredRisks.map((risk) => {
                      const trendObj = getRiskTrend(risk);
                      const critBrut = getCriticality(risk.scoreBrut);
                      const critNet = getCriticality(risk.scoreResiduel);
                      const riskCategory = tenantConfig.categories.find(c => c.id === risk.categoryId)?.name || risk.categoryId;
                      const entityName = tenantConfig.entities.find(e => e.id === risk.entityId)?.name || risk.entityId;

                      return (
                        <tr key={risk.id} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-center text-slate-950">{risk.id}</td>
                          <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-600">
                            <p className="font-extrabold text-slate-800 truncate">{riskCategory}</p>
                            <p className="text-[7.5px] text-slate-400 truncate">{entityName}</p>
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            <p className="font-extrabold text-slate-900 leading-tight">{risk.title}</p>
                            <p className="text-slate-400 text-[8px] line-clamp-2 mt-0.5">{risk.description}</p>
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-center font-bold text-slate-700">{risk.impactValue}</td>
                          <td className="py-2 px-2 border-r border-slate-200 text-center font-bold text-slate-700">{risk.frequencyValue}</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-black" style={{ color: critBrut.textColor }}>
                            {risk.scoreBrut}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-black" style={{ color: critNet.textColor }}>
                            {risk.scoreResiduel}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-500 text-[8.5px] leading-tight">
                            {getRiskConsequences(risk)}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 text-center">
                            <span className="font-extrabold text-[9px] text-slate-800">{trendObj.label}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-700 font-semibold truncate max-w-[110px]">
                            {risk.createdBy || 'Responsable GRC'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer sign-off block */}
          <div className="pt-12 border-t flex justify-between items-end text-[9px] text-slate-400 mt-12 print-card">
            <div>
              <p>© Logiciel de GRC Sogesti - Module Cartographie des Risques.</p>
              <p>Ce rapport fait foi pour l'exercice en cours sous réserve d'approbation réglementaire.</p>
            </div>
            <div className="flex gap-16 text-center border-t border-dashed pt-6 pr-6">
              <div className="space-y-8">
                <p className="font-bold text-slate-700">Signature du Responsable de la Conformité</p>
                <div className="h-6 w-32 border-b border-slate-300 mx-auto"></div>
              </div>
              <div className="space-y-8">
                <p className="font-bold text-slate-700">Cachet de la Direction Générale</p>
                <div className="h-6 w-32 border-b border-slate-300 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD INTERACTIVE GRC DASHBOARD VIEW
  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto space-y-6 text-slate-800 text-xs">
      {/* Title block */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-[10px] font-extrabold uppercase">
              Module Cartographie
            </span>
            <span className="font-mono text-slate-400 text-[10px]">🏢 {tenantConfig.companyName}</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1">
            <Grid className="w-5 h-5 text-indigo-600" />
            Matrice Analytique des Risques (Heatmap)
          </h2>
          <p className="text-slate-500 text-[11px]">
            Visualisation bi-dimensionnelle de la cartographie. Basculez sur la Matrice de Présentation pour l'exporter en PNG comme le modèle.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Aesthetic style tab */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setViewStyle('standard')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                viewStyle === 'standard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Vue GRC Interactive
            </button>
            <button
              onClick={() => setViewStyle('presentation')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                viewStyle === 'presentation' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              Matrice de Présentation Officielle (PNG)
            </button>
          </div>

          {/* Matrix selector tab (Only visible when standard view is active) */}
          {viewStyle === 'standard' && (
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => { setMatrixType('brut'); setSelectedCell(null); }}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                  matrixType === 'brut' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                🔥 1. Risque Brut (P x I)
              </button>
              <button
                onClick={() => { setMatrixType('net'); setSelectedCell(null); }}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                  matrixType === 'net' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                🛡️ 2. Risque Net (Brut x Maîtrise)
              </button>
            </div>
          )}

          {/* Paper Export Mode Trigger */}
          <button
            onClick={() => setIsPrintMode(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 shadow-sm border border-slate-700"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            Rapport Paysage (PDF)
          </button>
        </div>
      </div>

      {/* Advanced Filter options for the Matrix heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm items-center">
        <div className="md:col-span-2 flex items-center gap-1 text-slate-400 uppercase text-[10px] font-extrabold">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          Recherche & Filtres :
        </div>
        
        {/* Search input field */}
        <div className="md:col-span-4 relative">
          <input
            type="text"
            placeholder="Rechercher par ID, nom, description..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedCell(null); }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Entity Selector */}
        <div className="md:col-span-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <select 
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setSelectedCell(null); }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded px-2 py-1.5 text-xs"
          >
            <option value="all">Toutes les entités / directions</option>
            {tenantConfig.entities.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        {/* Category Selector */}
        <div className="md:col-span-3 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
          <select 
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setSelectedCell(null); }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded px-2 py-1.5 text-xs"
          >
            <option value="all">Toutes les catégories de risques</option>
            {tenantConfig.categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sandbox warning banner for general app usage */}
      <div className="bg-slate-100 border-l-4 border-indigo-600 rounded-r-lg p-3 flex items-start gap-2.5 text-slate-700 text-[11px]">
        <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">💡 Astuce d'exportation :</span> Vous pouvez télécharger la matrice au format <strong>Image PNG haute définition</strong> ou le registre d'enregistrement complet pour vos rapports officiels. Si l'impression PDF bloque, pensez à ouvrir le site dans un <strong>nouvel onglet</strong>.
        </div>
      </div>

      {/* CONDITIONAL RENDERING BASED ON SELECTED VIEW STYLE */}
      {viewStyle === 'standard' ? (
        /* ORIGINAL COMPREHENSIVE INTERACTIVE GRC HEATMAP VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* HEATMAP SCREEN */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4" ref={standardMatrixRef} id="standard-matrix-container">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                {matrixType === 'brut' 
                  ? `Grille d'Évaluation de Sévérité Brute (${size}x${size})`
                  : `Grille d'Appréciation du Risque Net (Brut vs Maîtrise)`}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportPNG(standardMatrixRef, `matrice-interactive-${matrixType}.png`)}
                  disabled={isExporting}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border text-slate-700 rounded text-[10px] font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  Exporter cette grille en PNG
                </button>
                <span className="text-[10px] text-slate-400">Dimension active : <strong className="font-bold text-indigo-600">{size}x{size}</strong></span>
              </div>
            </div>

            {/* Brut Heatmap */}
            {matrixType === 'brut' ? (
              <div className="space-y-1.5 pt-2">
                {/* Y Axis: Frequency */}
                {freqValues.map((f) => (
                  <div key={f} className="flex items-stretch">
                    <div className="w-24 shrink-0 flex items-center pr-3 text-right justify-end font-semibold text-slate-500 text-[11px] leading-tight">
                      {tenantConfig.scales.frequency.find(item => item.value === f)?.label || `P-${f}`}
                    </div>
                    <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
                      {impactValues.map((i) => {
                        const cellsCount = getRisksInBrutCell(f, i).length;
                        const cellSelected = selectedCell && selectedCell.y === f && selectedCell.x === i;
                        return (
                          <div
                            key={i}
                            onClick={() => handleCellClick(f, i)}
                            className={`h-16 flex flex-col items-center justify-center border rounded-lg cursor-pointer transition relative ${getCellClassNameForBrut(f, i)} ${
                              cellSelected ? 'ring-4 ring-indigo-600 ring-offset-1 border-transparent scale-98 shadow-md z-10 font-bold' : ''
                            }`}
                          >
                            {/* Cell Coordinates Indicator */}
                            <span className="absolute top-1 left-2 font-mono text-[8px] text-slate-400 font-black">
                              P{f}, I{i}
                            </span>
                            
                            {/* Risks bubble count inside */}
                            {cellsCount > 0 ? (
                              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow-md border border-indigo-400">
                                {cellsCount}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs font-semibold">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* X Axis: Impact bottom labels */}
                <div className="flex pt-2">
                  <div className="w-24 shrink-0"></div>
                  <div className="flex-1 grid gap-1.5 text-center font-bold text-slate-500 text-[10px]" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
                    {impactValues.map((i) => (
                      <div key={i} className="pt-1 select-none leading-none truncate">
                        <p className="text-slate-700 font-mono text-[11px] font-black">I={i}</p>
                        <p className="text-[9px] text-slate-400 font-normal truncate mt-0.5">
                          {tenantConfig.scales.impact.find(item => item.value === i)?.label || `Impact ${i}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Net Heatmap: Bracket vs Control */
              <div className="space-y-1.5 pt-2">
                {brutBrackets.map((bracket) => (
                  <div key={bracket.min} className="flex items-stretch">
                    <div className="w-24 shrink-0 flex items-center pr-3 text-right justify-end font-semibold text-slate-500 text-[10px] leading-tight">
                      {bracket.label}
                    </div>
                    <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${controlValues.length}, minmax(0, 1fr))` }}>
                      {controlValues.map((coef) => {
                        const cellsCount = getRisksInNetCell(bracket.min, bracket.max, coef).length;
                        const cellSelected = selectedCell && selectedCell.y === bracket.min && selectedCell.x === coef;
                        return (
                          <div
                            key={coef}
                            onClick={() => handleCellClick(bracket.min, coef)}
                            className={`h-16 flex flex-col items-center justify-center border rounded-lg cursor-pointer transition relative ${getCellClassNameForNet(bracket.min, coef)} ${
                              cellSelected ? 'ring-4 ring-indigo-600 ring-offset-1 border-transparent scale-98 shadow-md z-10' : ''
                            }`}
                          >
                            <span className="absolute top-1 left-2 font-mono text-[8px] text-slate-400 font-bold">
                              Brut x Maîtrise{coef}
                            </span>
                            
                            {cellsCount > 0 ? (
                              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow-md border border-indigo-400">
                                {cellsCount}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs font-semibold">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* X Axis: Control bottom labels */}
                <div className="flex pt-2">
                  <div className="w-24 shrink-0"></div>
                  <div className="flex-1 grid gap-1.5 text-center font-bold text-slate-500 text-[10px]" style={{ gridTemplateColumns: `repeat(${controlValues.length}, minmax(0, 1fr))` }}>
                    {controlValues.map((coef) => (
                      <div key={coef} className="pt-1 select-none leading-none truncate">
                        <p className="text-slate-700 font-mono text-[11px] font-black">M={coef}</p>
                        <p className="text-[9px] text-slate-400 font-normal truncate mt-0.5">
                          {tenantConfig.scales.control.find(item => item.value === coef)?.label || `Mitig ${coef}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Color legends matching thresholds */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between gap-2.5 text-[10px]">
              {tenantConfig.matrixThresholds.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1.5 p-1 px-2.5 rounded bg-slate-50 border border-slate-150 shadow-2xs">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.textColor }}></span>
                  <span className="font-extrabold text-slate-700">{t.label} :</span>
                  <span className="text-slate-500 font-mono font-black">({t.minScore}-{t.maxScore})</span>
                </div>
              ))}
            </div>
          </div>

          {/* DRILL DOWN RESULTS LIST */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase tracking-wide">
                <Maximize2 className="w-4 h-4 text-purple-600" />
                Drill-down : Détails de la Sélection
              </h3>

              {!selectedCell ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <Grid className="w-10 h-10 text-slate-200 mx-auto" />
                  <p className="font-bold text-xs text-slate-500">Sélectionnez une coordonnée</p>
                  <p className="text-[10px] max-w-[240px] mx-auto text-slate-400 leading-relaxed">
                    Cliquez sur n'importe quelle cellule colorée dans la grille de gauche pour isoler et inspecter les risques associés en temps réel.
                  </p>
                </div>
              ) : currentCellRisks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShieldAlert className="w-8 h-8 text-slate-200 mx-auto" />
                  <p className="font-extrabold text-indigo-600 text-[11px]">Aucun risque rattaché</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">Aucun incident de risque n'est encore positionné sur ce quadrant de criticité.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    🎯 {currentCellRisks.length} {currentCellRisks.length > 1 ? 'risques identifiés' : 'risque identifié'} à la coordonnée :
                  </p>
                  
                  {currentCellRisks.map((risk) => {
                    const crit = getCriticality(risk.scoreResiduel);
                    const trend = getRiskTrend(risk);
                    return (
                      <div 
                        key={risk.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-300 transition-all space-y-2.5 shadow-2xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-black text-slate-700 bg-slate-200 px-2 py-0.5 rounded text-[9.5px]">
                            {risk.id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold flex items-center gap-1 ${trend.color}`}>
                              {trend.icon}
                              {trend.label}
                            </span>
                            <span 
                              className="px-2 py-0.5 rounded text-[9px] font-bold"
                              style={{ backgroundColor: crit.color, color: crit.textColor }}
                            >
                              Net: {risk.scoreResiduel}
                            </span>
                          </div>
                        </div>
                        
                        <p className="font-extrabold text-slate-900 text-[11.5px] leading-tight">{risk.title}</p>
                        <p className="text-slate-500 text-[10px] line-clamp-2 leading-relaxed">{risk.description}</p>
                        
                        <div className="flex items-center justify-between text-[9.5px] text-slate-400 pt-2 border-t border-slate-200/50">
                          <span>P: {risk.frequencyValue} | I: {risk.impactValue} | M: {risk.controlValue}</span>
                          <span className="font-extrabold text-slate-500">Score Brut: {risk.scoreBrut}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 p-3.5 bg-blue-50 border border-blue-100 rounded-lg text-[10.5px] text-blue-900 flex items-start gap-2 shadow-2xs">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Drill-down GRC :</strong> Ce tableau interactif vous permet de filtrer en profondeur et d'isoler instantanément les fiches de risques. Cliquez sur une autre cellule ou utilisez les filtres globaux pour réinitialiser la vue.
              </p>
            </div>
          </div>

        </div>
      ) : (
        /* OFFICIAL PRESENTATION MATRIX (REPLICATING THE ATTACHED IMAGE) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border px-3 py-1 rounded">
              💡 <strong>Rendu Image PNG Haute Fidélité :</strong> Utilisez le bouton d'exportation ci-contre pour enregistrer la cartographie.
            </span>
            <button
              onClick={() => handleExportPNG(presentationMatrixRef, `matrice-officielle-${tenantConfig.id}.png`)}
              disabled={isExporting}
              className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-lg transition flex items-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4 text-amber-400" />
              {isExporting ? 'Génération de l\'image...' : 'Télécharger la Matrice (PNG)'}
            </button>
          </div>

          {/* The Capture Wrapper styled exactly like the attachment */}
          <div 
            id="presentation-matrix-container"
            ref={presentationMatrixRef}
            className="bg-[#0B192C] p-8 rounded-2xl border border-slate-800 text-white space-y-6 relative overflow-hidden select-none"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            {/* Header banner matching attachment */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              {/* Logo / Tenant placeholder (Left top block) */}
              <div className="bg-white px-4 py-2 rounded-lg flex items-center justify-center border border-slate-300 shrink-0 w-36 h-11">
                <span className="text-slate-900 font-black text-xs uppercase tracking-tight text-center truncate">
                  🏢 {tenantConfig.companyName.split(' ')[0]} GRC
                </span>
              </div>

              {/* Center Title */}
              <h1 className="text-center font-black tracking-widest text-2xl uppercase flex-1 text-white">
                MATRICE DES RISQUES
              </h1>

              {/* Legends (Right top block) */}
              <div className="flex flex-col items-start gap-1 bg-[#10243C] p-2.5 rounded-lg border border-[#1e3450] text-[10px] font-bold shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#FF2E2E]"></div>
                  <span className="text-slate-100">Élevé / Critique</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-4 h-4 rounded bg-[#FFE600]"></div>
                  <span className="text-slate-100">Moyen / Modéré</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-4 h-4 rounded bg-[#00DF89]"></div>
                  <span className="text-slate-100">Faible / Limité</span>
                </div>
              </div>
            </div>

            {/* Outer Layout containing Gravité (horizontal arrow) and Probability (vertical arrow) */}
            <div className="space-y-4">
              
              {/* Horizontal Gravity Arrow */}
              <div className="flex flex-col items-center pl-28">
                <span className="text-slate-300 font-extrabold text-[12px] uppercase tracking-widest mb-1">
                  Gravité (Impact d'un sinistre)
                </span>
                <div className="w-full flex items-center pr-2">
                  <div className="flex-1 h-[2.5px] bg-white/90 relative">
                    {/* Arrow Head */}
                    <div className="absolute right-0 -top-[3.5px] w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-white"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-stretch">
                
                {/* Vertical Probability Arrow (Left side) */}
                <div className="flex items-stretch gap-4 shrink-0 mr-4">
                  {/* Rotated label */}
                  <div className="flex items-center justify-center">
                    <span className="text-slate-300 font-extrabold text-[12px] uppercase tracking-widest -rotate-90 origin-center whitespace-nowrap">
                      Probabilité (Occurrence)
                    </span>
                  </div>
                  {/* Vertical Line with Arrow Head at top */}
                  <div className="flex flex-col items-center pt-2">
                    <div className="flex-1 w-[2.5px] bg-white/90 relative">
                      {/* Arrow Head at top */}
                      <div className="absolute top-0 -left-[3.5px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-white"></div>
                    </div>
                  </div>
                </div>

                {/* Main Symmetric Grid */}
                <div className="flex-1">
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${size + 1}, minmax(0, 1fr))` }}>
                    
                    {/* 1. Corner Intersection Cell */}
                    <div className="bg-[#10243C]/40 border border-slate-800 rounded-lg flex items-center justify-center h-14 p-2 text-center">
                      <span className="text-[10px] text-slate-400 font-bold font-mono">P \ I</span>
                    </div>

                    {/* 2. Top row column headers: Dynamic Scale Impact labels */}
                    {impactValues.map((i) => {
                      const scaleItem = tenantConfig.scales.impact.find(x => x.value === i);
                      return (
                        <div 
                          key={i} 
                          className="bg-[#DCE2F9] text-slate-900 font-black rounded-lg flex flex-col items-center justify-center h-14 p-1.5 text-center shadow-sm border border-slate-300"
                        >
                          <span className="text-[10px] text-slate-500 font-bold block">{i}</span>
                          <span className="text-[10px] leading-tight font-extrabold uppercase truncate w-full">
                            {scaleItem?.label || `Impact ${i}`}
                          </span>
                        </div>
                      );
                    })}

                    {/* 3. Grid Rows dynamically rendering coordinates */}
                    {freqValues.map((f) => {
                      const probScaleItem = tenantConfig.scales.frequency.find(x => x.value === f);
                      return (
                        <React.Fragment key={f}>
                          
                          {/* Row Header leftmost column (Probability values) */}
                          <div 
                            className="bg-[#DCE2F9] text-slate-900 font-black rounded-lg flex flex-col items-center justify-center min-h-[6rem] h-full p-1.5 text-center shadow-sm border border-slate-300"
                          >
                            <span className="text-[10px] text-slate-500 font-bold block">{f}</span>
                            <span className="text-[9.5px] leading-tight font-extrabold uppercase truncate w-full">
                              {probScaleItem?.label || `Prob ${f}`}
                            </span>
                          </div>

                          {/* Matrix Cells containing mapped risks */}
                          {impactValues.map((i) => {
                            const cellRisks = getRisksInBrutCell(f, i);
                            
                            // Color mapping matching threshold calculations
                            const product = f * i;
                            const ratio = size === 4 ? (16 / 64) : (25 / 25);
                            const scoreVal = product / ratio;
                            const crit = getCriticality(scoreVal);
                            const styles = getVibrantColors(crit.label);

                            return (
                              <div
                                key={i}
                                className="rounded-lg p-2.5 flex flex-col justify-start min-h-[6rem] h-auto pb-4 shadow-md transition-all border relative overflow-visible"
                                style={{
                                  backgroundColor: styles.bg,
                                  color: styles.text,
                                  borderColor: styles.border
                                }}
                              >
                                {/* Position Marker */}
                                <span className="text-[8px] font-mono opacity-40 font-black block absolute top-1 right-1.5 select-none">
                                  P{f}, I{i}
                                </span>

                                {/* Risks list */}
                                {cellRisks.length === 0 ? (
                                  <div className="flex-1 flex items-center justify-center mt-3">
                                    <span className="text-[10px] font-bold opacity-30 select-none">-</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 overflow-visible mt-3 w-full text-left">
                                    {cellRisks.map((r) => (
                                      <div 
                                        key={r.id} 
                                        className="text-[9px] font-bold leading-tight border-b border-black/10 pb-1 last:border-0 last:pb-0"
                                      >
                                        <p className="font-mono underline text-[8.5px] tracking-wide select-all opacity-80">
                                          {r.id}
                                        </p>
                                        <p className="leading-tight break-words text-[9px] font-bold">
                                          {r.title}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                        </React.Fragment>
                      );
                    })}

                  </div>
                </div>

              </div>

            </div>

            {/* Custom footer signature banner */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-6 border-t border-slate-800/80">
              <div>
                <p className="font-bold">© Logiciel de GRC Sogesti - Module Cartographie</p>
                <p className="text-slate-500 font-medium">Généré par le module officiel en format haute résolution.</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-300">Organisme client : {tenantConfig.companyName}</span>
                <p className="text-slate-500 font-medium font-mono text-[9px]">Type de calcul : {tenantConfig.formula.name}</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PORTFOLIO REGISTER TABLE (INSPIRATION STYLE) WITH PNG EXPORT */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-600" />
              Registre Général d'Enregistrement (Tableau de Référence)
            </h3>
            <p className="text-[10px] text-slate-400">Ce registre centralise tous les dossiers de risques identifiés du périmètre.</p>
          </div>
          
          {/* Table actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportPNG(registerTableRef, `registre-risques-${tenantConfig.id}.png`)}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-extrabold text-[11px] transition flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter Registre en Image PNG
            </button>
            <button
              onClick={() => setIsPrintMode(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded font-extrabold text-[11px] transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              Aperçu PDF Paysage
            </button>
          </div>
        </div>

        {/* The Capture Wrapper styled with solid white background */}
        <div className="overflow-x-auto rounded-lg border border-slate-200" ref={registerTableRef} id="risk-register-table-export">
          <div className="bg-white p-4 min-w-[1100px] space-y-3">
            <div className="hidden show-on-export flex justify-between items-center pb-2 border-b">
              <h4 className="font-extrabold text-xs text-slate-900">{tenantConfig.companyName} - Registre GRC</h4>
              <span className="text-[9px] text-slate-400">Date d'exportation : {new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-extrabold text-[9.5px] border-b border-slate-200">
                  <th className="py-3 px-4 border-r border-slate-200 w-16 text-center">Code</th>
                  <th className="py-3 px-4 border-r border-slate-200 w-44">Nature (Catégorie)</th>
                  <th className="py-3 px-4 border-r border-slate-200">Description / Intitulé du Risque</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-14 text-center">Prob (P)</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-14 text-center">Grav (I)</th>
                  <th className="py-3 px-4 border-r border-slate-200 w-24 text-center">Score Brut</th>
                  <th className="py-3 px-4 border-r border-slate-200 w-24 text-center">Score Net</th>
                  <th className="py-3 px-4 border-r border-slate-200 w-48">Conséquence</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-20 text-center">Tendance</th>
                  <th className="py-3 px-4 w-32">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 bg-white">
                {filteredRisks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <ShieldAlert className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      Aucun risque ne correspond à vos critères de recherche ou cette base client est vide.
                    </td>
                  </tr>
                ) : (
                  filteredRisks.map((risk) => {
                    const trend = getRiskTrend(risk);
                    const critBrut = getCriticality(risk.scoreBrut);
                    const critNet = getCriticality(risk.scoreResiduel);
                    const categoryName = tenantConfig.categories.find(c => c.id === risk.categoryId)?.name || risk.categoryId;
                    const entityName = tenantConfig.entities.find(e => e.id === risk.entityId)?.name || risk.entityId;

                    return (
                      <tr key={risk.id} className="hover:bg-slate-50/80 transition text-[11px]">
                        <td className="py-2.5 px-4 border-r border-slate-200 font-mono font-black text-slate-900 text-center">{risk.id}</td>
                        <td className="py-2.5 px-4 border-r border-slate-200 text-slate-600 font-semibold leading-tight">
                          <p className="font-extrabold text-slate-800">{categoryName}</p>
                          <p className="text-[8px] text-slate-400 mt-0.5 truncate">{entityName}</p>
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-200">
                          <p className="font-extrabold text-slate-900 leading-tight">{risk.title}</p>
                          <p className="text-[10px] text-slate-400 leading-normal line-clamp-1 mt-0.5">{risk.description}</p>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-slate-800">{risk.frequencyValue}</td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-slate-800">{risk.impactValue}</td>
                        <td className="py-2.5 px-4 border-r border-slate-200 text-center font-black" style={{ color: critBrut.textColor }}>
                          {risk.scoreBrut}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-200 text-center font-black" style={{ color: critNet.textColor }}>
                          {risk.scoreResiduel}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-200 text-slate-500 leading-tight text-[10px]">
                          {getRiskConsequences(risk)}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold flex items-center gap-1 justify-center ${trend.color}`}>
                            {trend.icon}
                            {trend.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-700 truncate max-w-[120px]">
                          {risk.createdBy || 'Responsable GRC'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
