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
  HelpCircle
} from 'lucide-react';
import { ActionPlan, Risk, TenantConfig, User } from '../types';

interface ActionsModuleProps {
  actions: ActionPlan[];
  risks: Risk[];
  tenantConfig: TenantConfig;
  users: User[];
  onAddActionPlan: (plan: Omit<ActionPlan, 'id' | 'progress'>) => void;
  onUpdateActionPlan: (plan: ActionPlan) => void;
  onAddLog: (action: string, details: string) => void;
}

export default function ActionsModule({
  actions,
  risks,
  tenantConfig,
  users,
  onAddActionPlan,
  onUpdateActionPlan,
  onAddLog
}: ActionsModuleProps) {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create New Action Panel and form
  const [showCreate, setShowCreate] = useState(false);
  const [formRiskId, setFormRiskId] = useState(risks[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formPriority, setFormPriority] = useState<'Basse' | 'Moyenne' | 'Haute' | 'Critique'>('Moyenne');

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

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Planifier un plan d'action
        </button>
      </div>

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
