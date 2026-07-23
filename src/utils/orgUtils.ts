/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrgEntity, UnitTypeConfig, TenantConfig } from '../types';

export const DEFAULT_UNIT_TYPES: UnitTypeConfig[] = [
  { id: 'ut_1', name: 'Direction Générale / Siège', level: 1, description: 'Organe de gouvernance suprême de l\'entreprise', code: 'DG' },
  { id: 'ut_2', name: 'Filiale / Succursale', level: 2, description: 'Unité juridique ou entité décentralisée majeure', code: 'FIL' },
  { id: 'ut_3', name: 'Direction', level: 3, description: 'Direction opérationnelle, métier ou fonctionnelle', code: 'DIR' },
  { id: 'ut_4', name: 'Département', level: 4, description: 'Subdivision d\'une Direction', code: 'DEP' },
  { id: 'ut_5', name: 'Division', level: 5, description: 'Division spécifique ou pôle d\'activité', code: 'DIV' },
  { id: 'ut_6', name: 'Service', level: 6, description: 'Service opérationnel de proximité', code: 'SRV' },
  { id: 'ut_7', name: 'Bureau / Cellule', level: 7, description: 'Micro-unité spécialisée, équipe ou atelier', code: 'BUR' },
  { id: 'ut_8', name: 'Site / Usine', level: 8, description: 'Implantation physique ou site logistique', code: 'SITE' }
];

/**
 * Returns the entity ID itself along with all descendant entity IDs recursively.
 */
export function getDescendantEntityIds(entities: OrgEntity[], rootEntityId: string): string[] {
  if (!rootEntityId || rootEntityId === 'all') return [];
  
  const results: string[] = [rootEntityId];
  const traverse = (parentId: string) => {
    entities.forEach(e => {
      if (e.parentId === parentId && e.statut !== 'Archivé') {
        if (!results.includes(e.id)) {
          results.push(e.id);
          traverse(e.id);
        }
      }
    });
  };
  traverse(rootEntityId);
  return results;
}

/**
 * Returns parent entity chain up to the root.
 */
export function getAncestorEntityIds(entities: OrgEntity[], entityId: string): string[] {
  const chain: string[] = [];
  let current = entities.find(e => e.id === entityId);
  while (current && current.parentId) {
    chain.push(current.parentId);
    current = entities.find(e => e.id === current?.parentId);
  }
  return chain;
}

/**
 * Returns a human-readable breadcrumb path for an entity (e.g., "Direction Générale > Filiale Abidjan > DSI > Service Infra").
 */
export function getEntityPathLabel(entities: OrgEntity[], entityId: string): string {
  if (!entityId || entityId === 'all') return 'Toutes les unités (Global)';
  const entityMap = new Map<string, OrgEntity>();
  entities.forEach(e => entityMap.set(e.id, e));

  const pathNames: string[] = [];
  let curr: OrgEntity | undefined = entityMap.get(entityId);
  while (curr) {
    pathNames.unshift(curr.name);
    curr = curr.parentId ? entityMap.get(curr.parentId) : undefined;
  }
  return pathNames.join(' > ');
}

export interface EntityTreeNode {
  entity: OrgEntity;
  depth: number;
  children: EntityTreeNode[];
}

/**
 * Builds a hierarchical tree representation of organizational entities.
 */
export function buildEntityTree(entities: OrgEntity[], parentId?: string, depth = 0): EntityTreeNode[] {
  const activeEntities = entities.filter(e => e.statut !== 'Archivé');
  const nodes = activeEntities.filter(e => e.parentId === parentId || (!parentId && (!e.parentId || !activeEntities.some(p => p.id === e.parentId))));

  return nodes.map(entity => ({
    entity,
    depth,
    children: buildEntityTree(entities, entity.id, depth + 1)
  }));
}

/**
 * Flattens the hierarchical tree to a list with depth indicators for Select rendering.
 */
export function flattenEntityTree(nodes: EntityTreeNode[]): { entity: OrgEntity; depth: number; indentStr: string }[] {
  const result: { entity: OrgEntity; depth: number; indentStr: string }[] = [];
  
  function walk(items: EntityTreeNode[]) {
    for (const node of items) {
      const indentStr = '— '.repeat(node.depth);
      result.push({ entity: node.entity, depth: node.depth, indentStr });
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  }
  
  walk(nodes);
  return result;
}

/**
 * Dynamic GRC Calculation Engine based on Tenant Formula and Matrix Dimensions.
 */
export function calculateRiskScores(
  freq: number,
  impact: number,
  control: number,
  tenantConfig: TenantConfig
) {
  const ratingMode = tenantConfig?.formula?.ratingMode || 'FREQUENCY_IMPACT';
  const netFormulaType = tenantConfig?.formula?.netFormulaType || 
    (tenantConfig?.formula?.expression?.includes('-') ? 'SUBTRACTIVE' : 
     tenantConfig?.formula?.expression?.includes('/') ? 'DIVISIONAL' : 'MULTIPLICATIVE');

  const size = tenantConfig?.matrixSize || 4;

  // Score Brut calculation (Frequency/Probability * Impact)
  const scoreBrut = Math.round(freq * impact * 10) / 10;

  let scoreResiduel = scoreBrut;

  if (netFormulaType === 'MULTIPLICATIVE') {
    // Standard IFACI product
    scoreResiduel = Math.round(scoreBrut * control * 10) / 10;
  } else if (netFormulaType === 'SUBTRACTIVE') {
    // Aeronautical subtractive mitigation
    scoreResiduel = Math.max(1, Math.round((scoreBrut - control) * 10) / 10);
  } else if (netFormulaType === 'DIVISIONAL') {
    // Divisional reduction
    const ctrlNorm = Math.max(1, control);
    scoreResiduel = Math.max(1, Math.round((scoreBrut / ctrlNorm) * 10) / 10);
  } else {
    // Gross only
    scoreResiduel = scoreBrut;
  }

  return { scoreBrut, scoreResiduel };
}
