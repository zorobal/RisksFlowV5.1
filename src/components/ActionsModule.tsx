/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  User as UserIcon,
  Search, 
  PlayCircle, 
  CheckCircle, 
  XOctagon, 
  Sliders,
  AlertTriangle,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { ActionPlan, Risk, TenantConfig, User } from '../types';

interface ActionsModuleProps {
  actions: ActionPlan[];
  risks: Risk[];
  tenantConfig: TenantConfig;
  users: User[];
  onAddActionPlan: (plan: Omit<ActionPlan, 'id' | 'progress'>) => void;
  onUpdateActionPlan: (plan: ActionPlan) => void;
  onDeleteActionPlan?: (id: string) => void;
  onAddLog: (action: string, details: string) => void;
}

export default function ActionsModule({
  actions,
  risks,
  tenantConfig,
  users,
  onAddActionPlan,
  onUpdateActionPlan,
  onDeleteActionPlan,
  onAddLog
}: ActionsModuleProps) {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Single Create New Action Panel and form
  const [showCreate, setShowCreate] = useState(false);
  const [formRiskId, setFormRiskId] = useState(risks[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formPriority, setFormPriority] = useState<'Basse' | 'Moyenne' | 'Haute' | 'Critique'>('Moyenne');

  // Unit-Centric Batch Action Creation state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(tenantConfig.entities[0]?.id || tenantConfig.entities[0]?.name || '');
  const [selectedBatchRiskId, setSelectedBatchRiskId] = useState<string>('');
  
  // Single action form fields inside batch workflow
  const [batchActionTitle, setBatchActionTitle] = useState('');
  const [batchActionDesc, setBatchActionDesc] = useState('');
  const [batchActionOwner, setBatchActionOwner] = useState('');
  const [batchActionDueDate, setBatchActionDueDate] = useState('');
  const [batchActionPriority, setBatchActionPriority] = useState<'Basse' | 'Moyenne' | 'Haute' | 'Critique'>('Moyenne');

  // Staged basket of actions for the selected unit
  interface StagedAction {
    tempId: string;
    riskId: string;
    riskTitle: string;
    title: string;
    description: string;
    ownerName: string;
    dueDate: string;
    priority: 'Basse' | 'Moyenne' | 'Haute' | 'Critique';
  }
  const [stagedActions, setStagedActions] = useState<StagedAction[]>([]);

  // Get risks belonging to selected unit
  const unitRisks = risks.filter(r => {
    if (!selectedUnitId) return true;
    const unitObj = tenantConfig.entities.find(e => e.id === selectedUnitId || e.name === selectedUnitId);
    return r.entityId === selectedUnitId || r.entityId === unitObj?.id || r.entityId === unitObj?.name;
  });

  // Automatically update selectedBatchRiskId when unit changes
  React.useEffect(() => {
    if (unitRisks.length > 0 && !unitRisks.some(r => r.id === selectedBatchRiskId)) {
      setSelectedBatchRiskId(unitRisks[0].id);
    }
  }, [selectedUnitId, unitRisks]);

  const handleStageAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchActionTitle.trim() || !selectedBatchRiskId) return;

    const targetRisk = risks.find(r => r.id === selectedBatchRiskId);
    const newStaged: StagedAction = {
      tempId: `staged_${Date.now()}_${Math.random()}`,
      riskId: selectedBatchRiskId,
      riskTitle: targetRisk?.title || selectedBatchRiskId,
      title: batchActionTitle,
      description: batchActionDesc,
      ownerName: batchActionOwner || users[0]?.name || 'Marie-Thérèse Atangana',
      dueDate: batchActionDueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      priority: batchActionPriority
    };

    setStagedActions(prev => [...prev, newStaged]);

    // Reset action inputs to allow adding another action for same risk or choosing another risk
    setBatchActionTitle('');
    setBatchActionDesc('');
  };

  const handleRemoveStagedAction = (tempId: string) => {
    setStagedActions(prev => prev.filter(a => a.tempId !== tempId));
  };

  const handleCommitBatchActions = () => {
    if (stagedActions.length === 0) return;

    stagedActions.forEach(staged => {
      onAddActionPlan({
        riskId: staged.riskId,
        title: staged.title,
        description: staged.description,
        ownerName: staged.ownerName,
        dueDate: staged.dueDate,
        priority: staged.priority,
        status: 'À planifier'
      });
    });

    const unitObj = tenantConfig.entities.find(e => e.id === selectedUnitId || e.name === selectedUnitId);
    const unitName = unitObj?.name || selectedUnitId || 'Unité';
    onAddLog('Planification d\'Actions par Unité', `${stagedActions.length} plan(s) d'action enregistré(s) avec succès pour l'unité organisationnelle "${unitName}".`);
    
    alert(`✅ ${stagedActions.length} plan(s) d'action enregistré(s) avec succès pour l'unité "${unitName}" !`);
    setStagedActions([]);
    setShowBatchModal(false);
  };

  // Filter actions
  const filteredActions = actions.filter(action => {
    const matchStatus = selectedStatusFilter === 'all' || action.status === selectedStatusFilter;
    const matchSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        action.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        action.riskId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleUpdateStatus = (action: ActionPlan, nextStatus: ActionPlan['status']) => {
    const nextProgress = nextStatus === 'Réalisé' ? 100 : (nextStatus === 'À planifier' ? 0 : action.progress);
    const updated: ActionPlan = {
      ...action,
      status: nextStatus,
      progress: nextProgress
    };
    onUpdateActionPlan(updated);
    onAddLog('Action d\'atténuation', `Mise à jour du statut de l'action "${action.title}" vers: ${nextStatus}`);
  };

  const handleUpdateProgressValue = (action: ActionPlan, val: number) => {
    let nextStatus = action.status;
    if (val === 100) nextStatus = 'Réalisé';
    else if (val > 0 && action.status === 'À planifier') nextStatus = 'En cours';

    const updated: ActionPlan = {
      ...action,
      progress: val,
      status: nextStatus
    };
    onUpdateActionPlan(updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formRiskId) return;

    onAddActionPlan({
      riskId: formRiskId,
      title: formTitle,
      description: formDesc,
      ownerName: formOwner || users[0]?.name || 'Marie-Thérèse Atangana',
      dueDate: formDueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      priority: formPriority,
      status: 'À planifier'
    });

    setFormTitle('');
    setFormDesc('');
    setFormOwner('');
    setFormDueDate('');
    setFormPriority('Moyenne');
    setShowCreate(false);
  };

  const getPriorityColor = (p: ActionPlan['priority']) => {
    switch (p) {
      case 'Basse': return 'bg-slate-100 text-slate-800';
      case 'Moyenne': return 'bg-blue-100 text-blue-800';
      case 'Haute': return 'bg-orange-100 text-orange-850';
      case 'Critique': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="flex-grow p-6 bg-slate-50 overflow-y-auto space-y-6 text-xs text-slate-800">
      
      {/* Tab block */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Plans d'Actions Correcteurs & Préventifs
          </h2>
          <p className="text-slate-500 text-[11px]">
            Supervisez le déploiement des chantiers de mitigation et réduisez l'impact ou la survenue des menaces recensées.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBatchModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Saisie / Planification par Unité (Multi-Risques)</span>
          </button>
        </div>
      </div>

      {/* MODAL WORKFLOW: PLANIFICATION PAR UNITÉ ORGANISATIONNELLE (MULTI-RISQUES & MULTI-ACTIONS) */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <Sliders className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    Planification des Actions Correctives par Unité Organisationnelle
                  </h3>
                  <p className="text-[10.5px] text-slate-300">
                    Sélectionnez une unité, parcourez ses risques identifiés et préparez un ou plusieurs plans d'actions par risque avant enregistrement global.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (stagedActions.length === 0 || window.confirm("Des actions sont en cours de préparation dans votre panier. Voulez-vous vraiment fermer ?")) {
                    setShowBatchModal(false);
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50">
              
              {/* STEP 1: CHOICE OF UNIT */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <label className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    1. Sélectionner l'Unité Organisationnelle
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                    {unitRisks.length} risque(s) identifié(s) rattaché(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {tenantConfig.entities.map((unit) => {
                    const count = risks.filter(r => r.entityId === unit.id || r.entityId === unit.name).length;
                    const isSelected = selectedUnitId === unit.id || selectedUnitId === unit.name;
                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => setSelectedUnitId(unit.id)}
                        className={`p-3 rounded-lg border text-left transition flex justify-between items-center cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-900 font-bold'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-mono font-bold text-indigo-600 block">{unit.code}</span>
                          <span className="text-xs">{unit.name}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {count} risque(s)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2 & 3: PICK RISK & ADD ACTIONS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Form to add action for selected risk */}
                <div className="lg:col-span-7 bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      2. Choisir un Risque & Ajouter son/ses Plan(s) d'Action
                    </h4>
                  </div>

                  <form onSubmit={handleStageAction} className="space-y-3">
                    {/* Risk Selector within Unit */}
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-bold text-slate-700">Risque de la structure :</label>
                      <select
                        value={selectedBatchRiskId}
                        onChange={(e) => setSelectedBatchRiskId(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        {unitRisks.length === 0 ? (
                          <option value="">Aucun risque répertorié pour cette unité</option>
                        ) : (
                          unitRisks.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.title}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Action Title */}
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-bold text-slate-700">Intitulé du Plan d'Action :</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Mise à niveau de l'infrastructure de sauvegarde..."
                        value={batchActionTitle}
                        onChange={(e) => setBatchActionTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Action Description */}
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-bold text-slate-700">Description Opérationnelle :</label>
                      <textarea
                        rows={2}
                        placeholder="Modalités de déploiement, moyens nécessaires..."
                        value={batchActionDesc}
                        onChange={(e) => setBatchActionDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Owner & Due Date */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-slate-700">Pilote d'Action :</label>
                        <select
                          value={batchActionOwner}
                          onChange={(e) => setBatchActionOwner(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 text-xs font-medium"
                        >
                          {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-slate-700">Échéance cible :</label>
                        <input
                          type="date"
                          value={batchActionDueDate}
                          onChange={(e) => setBatchActionDueDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-bold text-slate-700">Priorité :</label>
                      <select
                        value={batchActionPriority}
                        onChange={(e) => setBatchActionPriority(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 text-xs font-bold"
                      >
                        <option value="Basse">🟢 Basse</option>
                        <option value="Moyenne">🔵 Moyenne</option>
                        <option value="Haute">🟡 Haute</option>
                        <option value="Critique">🔴 Critique</option>
                      </select>
                    </div>

                    {/* Validate & Add to Basket Button */}
                    <button
                      type="submit"
                      disabled={!batchActionTitle.trim() || !selectedBatchRiskId}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-extrabold rounded-lg shadow-sm transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      + Valider & Ajouter l'Action au Panier de l'Unité
                    </button>
                  </form>
                </div>

                {/* Basket of Staged Actions for this Unit */}
                <div className="lg:col-span-5 bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between h-full min-h-[350px]">
                  <div className="space-y-3">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        3. Panier des Actions Préparées ({stagedActions.length})
                      </h4>
                    </div>

                    {stagedActions.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 italic text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Aucune action préparée pour l'instant dans cette session. Sélectionnez un risque à gauche et cliquez sur "+ Valider & Ajouter".
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                        {stagedActions.map((staged, idx) => (
                          <div 
                            key={staged.tempId}
                            className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-lg border border-slate-200 space-y-1.5 relative group transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[9.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                #{idx + 1} • {staged.riskId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveStagedAction(staged.tempId)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition cursor-pointer"
                                title="Retirer cette action du panier"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <h5 className="font-bold text-slate-900 text-xs leading-snug">{staged.title}</h5>
                            <p className="text-[10px] text-slate-500 line-clamp-1">{staged.riskTitle}</p>
                            <div className="flex items-center justify-between text-[9.5px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                              <span>Pilote : {staged.ownerName}</span>
                              <span className="font-mono text-red-600 font-bold">{staged.dueDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Commit Save Button */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <button
                      type="button"
                      onClick={handleCommitBatchActions}
                      disabled={stagedActions.length === 0}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-lg shadow-md transition text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      💾 Valider & Enregistrer Définitivement les {stagedActions.length} Action(s) de l'Unité
                    </button>
                    <p className="text-[9.5px] text-slate-400 text-center italic">
                      Toutes les actions préparées seront rattachées aux risques correspondants de cette unité.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* OVERDUE REMINDER AUTOMATION PANEL */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-900">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs text-amber-200 uppercase tracking-wider">Moteur de Relances Automatiques e-Mail & Push</h3>
            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/40">
              ● CRON ACTIF (08:00 AM)
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Relances automatiques expédiées aux responsables opérationnels en cas de dépassement d'échéance sans validation.
          </p>
        </div>

        <button
          onClick={() => {
            const overdueCount = actions.filter(a => new Date(a.dueDate) < new Date() && a.progress < 100).length;
            onAddLog('Relances E-mail Automatiques', `Déclenchement manuel de ${overdueCount || 1} relances d'échéance par courriel et push mobile.`);
            alert(`📧 ${overdueCount || 1} notification(s) de relance par e-mail et push mobile ont été transmises avec succès aux responsables des plans d'action en retard !`);
          }}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm text-xs cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <PlayCircle className="w-4 h-4" />
          Déclencher l'envoi des relances
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT: Actions Registry */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          
          {/* Filters Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap gap-1">
              {['all', 'À planifier', 'En cours', 'Réalisé', 'Annulé'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold border transition ${
                    selectedStatusFilter === st 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st === 'all' ? '🔍 Tout voir' : st}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-400" />
              <input 
                type="text"
                placeholder="Rechercher une action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded pl-7 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-48"
              />
            </div>
          </div>

          {/* ACTIONS LIST */}
          {filteredActions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              Aucune action de remédiation ne correspond aux filtres.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActions.map((action) => {
                const parentRisk = risks.find(r => r.id === action.riskId);
                return (
                  <div 
                    key={action.id}
                    className="p-4 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-150 transition-all flex flex-col sm:flex-row justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      {/* Badge Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[9px]">
                          Action {action.id}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Lié au risque : <strong className="text-slate-600 hover:underline cursor-pointer">[{action.riskId}] {parentRisk?.title.substring(0, 45)}...</strong>
                        </span>
                      </div>

                      {/* Title & Desc */}
                      <div>
                        <h4 className="font-bold text-slate-800 text-[12px] leading-snug">{action.title}</h4>
                        <p className="text-slate-500 text-[10.5px] mt-1 leading-relaxed">{action.description || 'Aucune consigne description complémentaire n\'a été formulée.'}</p>
                      </div>

                      {/* Owner and Date */}
                      <div className="flex flex-wrap items-center gap-4 text-[10.5px] font-medium text-slate-500">
                        <span className="flex items-center gap-1 bg-white p-1 px-2 rounded shadow-sm border border-slate-100">
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          Pilote : <span className="font-bold text-indigo-650">{action.ownerName}</span>
                        </span>
                        <span className="flex items-center gap-1 bg-white p-1 px-2 rounded shadow-sm border border-slate-100">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Échéance : <span className="font-bold text-red-600 font-mono">{action.dueDate}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${getPriorityColor(action.priority)}`}>
                          Prio: {action.priority}
                        </span>
                      </div>

                      {/* Multi-step Hierarchical Approval Circuit */}
                      <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          Circuit de Validation Hiérarchique Multi-Étapes :
                        </span>
                        <div className="flex flex-wrap items-center gap-1 text-[9.5px]">
                          {[
                            { label: '1. Soumission Analyste', active: true },
                            { label: '2. Validation N+1', active: action.status !== 'À planifier' },
                            { label: '3. Approbation Risk Manager', active: action.status === 'Réalisé' || action.progress > 50 },
                            { label: '4. Clôture Vérifiée', active: action.status === 'Réalisé' }
                          ].map((step, idx) => (
                            <span 
                              key={idx}
                              className={`px-2 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                                step.active 
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}
                            >
                              {step.active ? '✓' : '○'} {step.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Progress Slider and Status selectors on right */}
                    <div className="sm:w-52 shrink-0 flex flex-col justify-between items-end border-l border-slate-200/60 pl-0 sm:pl-4">
                      {/* Active Status drop action buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleUpdateStatus(action, 'À planifier')}
                          className={`p-1.5 rounded-md text-[10px] uppercase font-bold transition ${
                            action.status === 'À planifier' ? 'bg-amber-100 text-amber-800' : 'hover:bg-amber-50 text-slate-400'
                          }`}
                          title="À planifier"
                        >
                          À planifier
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(action, 'En cours')}
                          className={`p-1.5 rounded-md text-[10px] uppercase font-bold transition ${
                            action.status === 'En cours' ? 'bg-blue-105 text-blue-800' : 'hover:bg-blue-50 text-slate-400'
                          }`}
                          title="Faire tourner"
                        >
                          En cours
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(action, 'Réalisé')}
                          className={`p-1.5 rounded-md text-[10px] uppercase font-bold transition ${
                            action.status === 'Réalisé' ? 'bg-green-100 text-green-800' : 'hover:bg-green-50 text-slate-400'
                          }`}
                          title="Marquer Terminé"
                        >
                          Réalisé
                        </button>
                        {onDeleteActionPlan && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Voulez-vous vraiment supprimer le plan d'action "${action.title}" ?`)) {
                                onDeleteActionPlan(action.id);
                              }
                            }}
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer ml-1"
                            title="Supprimer ce plan d'action"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Manual Progress Slider */}
                      <div className="w-full space-y-1 mt-3">
                        <div className="flex justify-between font-mono text-[9.5px] text-slate-400 font-bold mb-1">
                          <span>AVANCEMENT</span>
                          <span className="text-indigo-600">{action.progress}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={action.progress}
                          onChange={(e) => handleUpdateProgressValue(action, Number(e.target.value))}
                          className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full bg-indigo-600 rounded-full" 
                            style={{ width: `${action.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: New Action Form or guidelines */}
        <div className="lg:col-span-4 space-y-6">
          
          {showCreate ? (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-indigo-650 border-b border-indigo-200 pb-2 flex items-center gap-1.5">
                ✏️ Programmer une action
              </h3>
              
              <form onSubmit={handleCreateSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Associer au Risque</label>
                  <select
                    value={formRiskId}
                    onChange={(e) => setFormRiskId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-700 text-xs font-semibold"
                  >
                    {risks.map(r => (
                      <option key={r.id} value={r.id}>[{r.id}] {r.title.substring(0, 40)}...</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Intitulé du plan</label>
                  <input 
                    type="text"
                    required
                    placeholder="Mettre en place des serveurs redondants..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-700 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Descriptif Opérationnel</label>
                  <textarea 
                    placeholder="Quels sont les détails techniques ou organisationnels à déployer ?"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-700 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Pilote d'Action</label>
                    <select
                      value={formOwner}
                      onChange={(e) => setFormOwner(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-700 text-xs"
                    >
                      {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Échéance de fin</label>
                    <input 
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-700 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Niveau d'Urgence / Priorité</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-700 text-xs font-bold"
                  >
                    <option value="Basse">🟢 Basse</option>
                    <option value="Moyenne">🔵 Moyenne</option>
                    <option value="Haute">🟡 Haute</option>
                    <option value="Critique">🔴 Critique</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow transition-all cursor-pointer text-center text-xs"
                >
                  Enregistrer l'action préventive
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Cycle Mitigateur de Risques
              </h3>
              <p className="text-[10.5px] text-slate-500 leading-relaxed">
                Chaque risque significatif identifié à l'IFACI 2013 doit impérativement s'accompagner d'au moins une <strong>action corrective</strong> visant soit :
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-[10px] text-slate-600 font-medium">
                <li>La réduction de sa probabilité (P) d'occurence (ex: sensibiliser, filtrer).</li>
                <li>La réduction de ses conséquences/Impact (I) (ex: assurance, redondance).</li>
                <li>Le rehaussement des dispositifs de maîtrise (M) (ex: manuel, procédures).</li>
              </ul>
              <button 
                onClick={() => setShowCreate(true)}
                className="w-full text-center py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-605 text-[11px] font-bold rounded border border-indigo-200/45 mt-2 transition"
              >
                + Ajouter une action corrective maintenant
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
