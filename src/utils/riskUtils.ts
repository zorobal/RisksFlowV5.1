import { MatrixThreshold } from '../types';

export interface ColorPreset {
  id: string;
  name: string;
  colorClass: string;
  textColor: string;
  bgColorHex: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'emerald', name: '🟢 Vert Émeraude (Faible)', colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', textColor: '#059669', bgColorHex: '#dcfce7' },
  { id: 'lime', name: '🌱 Vert Citron (Mineur)', colorClass: 'bg-lime-100 text-lime-800 border-lime-200', textColor: '#65a30d', bgColorHex: '#ecfccb' },
  { id: 'amber', name: '🟡 Jaune Ambre (Modéré)', colorClass: 'bg-amber-100 text-amber-800 border-amber-200', textColor: '#d97706', bgColorHex: '#fef3c7' },
  { id: 'orange', name: '🟠 Orange (Significatif / Élevé)', colorClass: 'bg-orange-100 text-orange-800 border-orange-200', textColor: '#ea580c', bgColorHex: '#ffedd5' },
  { id: 'red', name: '🔴 Rouge (Critique)', colorClass: 'bg-red-100 text-red-800 border-red-200', textColor: '#dc2626', bgColorHex: '#fee2e2' },
  { id: 'purple', name: '🟣 Violet (Catastrophique / Sévère)', colorClass: 'bg-purple-100 text-purple-800 border-purple-200', textColor: '#9333ea', bgColorHex: '#f3e8ff' },
  { id: 'rose', name: '🍷 Rose Foncé (Majeur)', colorClass: 'bg-rose-100 text-rose-800 border-rose-200', textColor: '#e11d48', bgColorHex: '#ffe4e6' },
  { id: 'sky', name: '🔵 Bleu Ciel (Négligeable)', colorClass: 'bg-sky-100 text-sky-800 border-sky-200', textColor: '#0284c7', bgColorHex: '#e0f2fe' },
  { id: 'slate', name: '🔘 Gris Neutre (Indéfini)', colorClass: 'bg-slate-100 text-slate-800 border-slate-200', textColor: '#475569', bgColorHex: '#f1f5f9' },
];

/**
 * Robustly matches a risk score to a MatrixThreshold
 */
export function getCriticalityFromThresholds(score: number, thresholds: MatrixThreshold[]): MatrixThreshold {
  if (!thresholds || thresholds.length === 0) {
    return {
      label: 'Indéfini',
      minScore: 0,
      maxScore: 999,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      textColor: '#475569',
      description: 'Aucun seuil défini.'
    };
  }

  const sorted = [...thresholds].sort((a, b) => a.minScore - b.minScore);

  // Direct match in range [minScore, maxScore]
  const found = sorted.find(t => score >= t.minScore && score <= t.maxScore);
  if (found) return found;

  // Below minimum
  if (score < sorted[0].minScore) return sorted[0];

  // Above maximum
  if (score > sorted[sorted.length - 1].maxScore) return sorted[sorted.length - 1];

  // Nearest midpoint fallback for gaps
  let closest = sorted[0];
  let minDiff = Math.abs(score - (closest.minScore + closest.maxScore) / 2);
  for (const t of sorted) {
    const mid = (t.minScore + t.maxScore) / 2;
    const diff = Math.abs(score - mid);
    if (diff < minDiff) {
      minDiff = diff;
      closest = t;
    }
  }

  return closest;
}

/**
 * Returns exact background, border, and text colors for a threshold label or threshold object
 */
export function getThresholdColorStyles(critLabel: string, thresholds?: MatrixThreshold[]) {
  const match = (thresholds || []).find(t => t.label.toLowerCase() === critLabel.toLowerCase());
  if (match) {
    const preset = COLOR_PRESETS.find(p => p.id === match.color || p.colorClass === match.color);
    if (preset) {
      return { bg: preset.bgColorHex, border: preset.textColor + '60', text: preset.textColor, rawColor: match.color };
    }
    if (match.color && match.color.startsWith('#')) {
      return { bg: match.color + '20', border: match.color + '80', text: match.textColor || match.color, rawColor: match.color };
    }
    if (match.textColor) {
      return { bg: '#F8FAFC', border: match.textColor + '80', text: match.textColor, rawColor: match.color };
    }
  }

  const labelLower = critLabel.toLowerCase();
  if (labelLower.includes('faible') || labelLower.includes('mineur') || labelLower.includes('bas') || labelLower.includes('très faible') || labelLower.includes('insignifiant') || labelLower.includes('négligeable')) {
    return { bg: '#dcfce7', border: '#059669', text: '#047857', rawColor: '#059669' };
  }
  if (labelLower.includes('modéré') || labelLower.includes('moyen')) {
    return { bg: '#fef3c7', border: '#d97706', text: '#b45309', rawColor: '#d97706' };
  }
  if (labelLower.includes('élevé') || labelLower.includes('fort') || labelLower.includes('significatif')) {
    return { bg: '#ffedd5', border: '#ea580c', text: '#c2410c', rawColor: '#ea580c' };
  }
  if (labelLower.includes('critique') || labelLower.includes('sévère') || labelLower.includes('majeur')) {
    return { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c', rawColor: '#dc2626' };
  }
  if (labelLower.includes('catastrophique')) {
    return { bg: '#f3e8ff', border: '#9333ea', text: '#7e22ce', rawColor: '#9333ea' };
  }
  return { bg: '#f1f5f9', border: '#475569', text: '#334155', rawColor: '#475569' };
}

/**
 * Generates default thresholds for a matrix of size (e.g. 3 for 3x3, 4 for 4x4, 5 for 5x5)
 * and a chosen number of graduation levels (e.g. 3, 4, 5, 6).
 */
export function generateDefaultThresholds(matrixSize: number, numLevels: number): MatrixThreshold[] {
  const maxScore = matrixSize * matrixSize;

  // Specific preset for 3x3 matrix with 4 levels (User's explicit example)
  if (matrixSize === 3 && numLevels === 4) {
    return [
      {
        label: 'Faible',
        minScore: 1,
        maxScore: 1,
        color: COLOR_PRESETS[0].colorClass,
        textColor: COLOR_PRESETS[0].textColor,
        description: 'Événement mineur sans conséquence majeure. Surveillance simple.'
      },
      {
        label: 'Modéré',
        minScore: 2,
        maxScore: 3,
        color: COLOR_PRESETS[2].colorClass,
        textColor: COLOR_PRESETS[2].textColor,
        description: 'Impact à suivre avec plan d\'action à moyen terme.'
      },
      {
        label: 'Élevé',
        minScore: 4,
        maxScore: 6,
        color: COLOR_PRESETS[3].colorClass,
        textColor: COLOR_PRESETS[3].textColor,
        description: 'Sévérité forte exigeant des mesures correctives rapides.'
      },
      {
        label: 'Critique',
        minScore: 7,
        maxScore: 9,
        color: COLOR_PRESETS[4].colorClass,
        textColor: COLOR_PRESETS[4].textColor,
        description: 'Risque majeur nécessitant une escalade immédiate en Comité de Direction.'
      }
    ];
  }

  // General generator for any size & any level count
  const labels3 = ['Faible', 'Modéré', 'Élevé'];
  const labels4 = ['Faible', 'Modéré', 'Élevé', 'Critique'];
  const labels5 = ['Très Faible', 'Faible', 'Modéré', 'Élevé', 'Critique'];
  const labels6 = ['Insignifiant', 'Mineur', 'Modéré', 'Significatif', 'Élevé', 'Catastrophique'];

  let chosenLabels = labels4;
  if (numLevels === 3) chosenLabels = labels3;
  if (numLevels === 5) chosenLabels = labels5;
  if (numLevels === 6) chosenLabels = labels6;

  const presetColors = [
    COLOR_PRESETS[0], // Green
    COLOR_PRESETS[2], // Yellow
    COLOR_PRESETS[3], // Orange
    COLOR_PRESETS[4], // Red
    COLOR_PRESETS[5], // Purple
    COLOR_PRESETS[6], // Rose
  ];

  const result: MatrixThreshold[] = [];
  const step = maxScore / numLevels;

  for (let i = 0; i < numLevels; i++) {
    const minVal = i === 0 ? 1 : Math.round(i * step) + 1;
    const maxVal = i === numLevels - 1 ? maxScore : Math.round((i + 1) * step);
    const label = chosenLabels[i] || `Niveau ${i + 1}`;
    const colorObj = presetColors[i % presetColors.length];

    result.push({
      label,
      minScore: minVal,
      maxScore: Math.max(minVal, maxVal),
      color: colorObj.colorClass,
      textColor: colorObj.textColor,
      description: `Description pour le niveau de criticité ${label} (Score ${minVal} à ${maxVal}).`
    });
  }

  return result;
}
