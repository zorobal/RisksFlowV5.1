/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Building2, Layers, ChevronRight, Filter } from 'lucide-react';
import { OrgEntity, UnitTypeConfig } from '../types';
import { buildEntityTree, flattenEntityTree, getDescendantEntityIds } from '../utils/orgUtils';

interface OrgEntityTreeFilterProps {
  entities: OrgEntity[];
  selectedEntityId: string;
  onSelectEntity: (id: string) => void;
  isConsolidated?: boolean;
  onToggleConsolidated?: (consolidated: boolean) => void;
  unitTypes?: UnitTypeConfig[];
  label?: string;
  className?: string;
  showConsolidatedToggle?: boolean;
  includeAllOption?: boolean;
  allOptionLabel?: string;
}

export default function OrgEntityTreeFilter({
  entities = [],
  selectedEntityId,
  onSelectEntity,
  isConsolidated = false,
  onToggleConsolidated = () => {},
  unitTypes = [],
  label = "Périmètre Organique",
  className = "",
  showConsolidatedToggle = true,
  includeAllOption = true,
  allOptionLabel = "🏢 Toutes les Unités (Vue Globale Entreprise)"
}: OrgEntityTreeFilterProps) {
  const treeNodes = buildEntityTree(entities);
  const flattenedList = flattenEntityTree(treeNodes);

  // Compute number of descendant entities when a specific entity is selected
  const descendantIds = selectedEntityId && selectedEntityId !== 'all' 
    ? getDescendantEntityIds(entities, selectedEntityId) 
    : [];
  const childCount = descendantIds.length > 1 ? descendantIds.length - 1 : 0;

  const selectedEntityObj = entities.find(e => e.id === selectedEntityId);

  return (
    <div className={`flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm ${className}`}>
      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
        <Building2 className="w-4 h-4 text-emerald-600" />
        <span>{label} :</span>
      </div>

      <div className="flex-1 min-w-[200px]">
        <select
          value={selectedEntityId}
          onChange={(e) => onSelectEntity(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium shadow-xs"
        >
          {includeAllOption && <option value="all">{allOptionLabel}</option>}
          {flattenedList.map(({ entity, indentStr }) => (
            <option key={entity.id} value={entity.id}>
              {indentStr} {entity.name} ({entity.type})
            </option>
          ))}
        </select>
      </div>

      {showConsolidatedToggle && selectedEntityId !== 'all' && (
        <button
          type="button"
          onClick={() => onToggleConsolidated(!isConsolidated)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer text-xs font-semibold shadow-xs ${
            isConsolidated
              ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
          title={
            isConsolidated
              ? "Vue Consolidée : inclut le périmètre propre et l'ensemble des départements, services et bureaux rattachés."
              : "Vue Stricte : affiche uniquement les éléments rattachés directement à cette unité."
          }
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isConsolidated ? 'Vue Consolidée' : 'Vue Directe'}</span>
          {childCount > 0 && isConsolidated && (
            <span className="bg-emerald-800 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
              +{childCount} sous-unités
            </span>
          )}
        </button>
      )}

      {selectedEntityObj && selectedEntityId !== 'all' && (
        <div className="text-[11px] text-slate-500 flex items-center gap-1 pl-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-slate-700">{selectedEntityObj.type}</span>
          {isConsolidated && childCount > 0 && (
            <span className="text-slate-500">
              (regroupé avec {childCount} sous-unité{childCount > 1 ? 's' : ''})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
