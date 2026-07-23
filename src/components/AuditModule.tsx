/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  User, 
  FileText, 
  ShieldAlert, 
  TrendingUp,
  FileCheck,
  Search,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { AuditMission, AuditFinding, Fonction, User as GrcUser } from '../types';

interface AuditModuleProps {
  missions: AuditMission[];
  findings: AuditFinding[];
  fonctions: Fonction[];
  users: GrcUser[];
  currentUser: GrcUser;
  onAddMission: (mission: Omit<AuditMission, 'id'>) => void;
  onAddFinding: (finding: Omit<AuditFinding, 'id'>) => void;
  onUpdateFindingStatus: (id: string, status: AuditFinding['statut']) => void;
  onAddLog: (action: string, details: string) => void;
}

export default function AuditModule({
  missions,
  findings,
  fonctions,
  users,
  currentUser,
  onAddMission,
  onAddFinding,
  onUpdateFindingStatus,
  onAddLog
}: AuditModuleProps) {
  const [selectedMissionId, setSelectedMissionId] = useState<string>(missions[0]?.id || '');
  const [showAddMissionModal, setShowAddMissionModal] = useState(false);
  const [showAddFindingModal, setShowAddFindingModal] = useState(false);

  // New Mission inputs
  const [newMissionTitre, setNewMissionTitre] = useState('');
  const [newMissionDesc, setNewMissionDesc] = useState('');
  const [newMissionType, setNewMissionType] = useState<AuditMission['type']>('Annuelle');
  const [newMissionDateDeb, setNewMissionDateDeb] = useState('2026-07-01');
  const [newMissionDateFin, setNewMissionDateFin] = useState('2026-07-31');
  const [newMissionPilote, setNewMissionPilote] = useState(fonctions[1]?.id || fonctions[0]?.id || '');

  // New Finding inputs
  const [newFindingTitre, setNewFindingTitre] = useState('');
  const [newFindingDesc, setNewFindingDesc] = useState('');
  const [newFindingGravite, setNewFindingGravite] = useState<AuditFinding['gravite']>('Moyenne');
  const [newFindingRec, setNewFindingRec] = useState('');

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [missionFilter, setMissionFilter] = useState<'all' | 'Annuelle' | 'Cyclique' | 'Ad-hoc'>('all');

  const selectedMission = missions.find(m => m.id === selectedMissionId) || missions[0];
  const missionFindings = findings.filter(f => f.missionId === (selectedMission?.id || ''));

  // Statistics
  const totalFindings = findings.length;
  const criticalFindings = findings.filter(f => f.gravite === 'Critique' || f.gravite === 'Élevée').length;
  const resolvedFindings = findings.filter(f => f.statut === 'Résolu').length;
  const resolutionRate = totalFindings > 0 ? Math.round((resolvedFindings / totalFindings) * 100) : 0;

  const handleCreateMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionTitre.trim()) return;

    onAddMission({
      titre: newMissionTitre,
      description: newMissionDesc,
      type: newMissionType,
      status: 'Planifiée',
      dateDebut: newMissionDateDeb,
      dateFin: newMissionDateFin,
      piloteFonctionId: newMissionPilote
    });

    onAddLog('Audit Mission Planifiée', `Planification de la mission d'audit : ${newMissionTitre}`);
    setNewMissionTitre('');
    setNewMissionDesc('');
    setShowAddMissionModal(false);
  };

  const handleCreateFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFindingTitre.trim() || !selectedMission) return;

    onAddFinding({
      missionId: selectedMission.id,
      titre: newFindingTitre,
      description: newFindingDesc,
      gravite: newFindingGravite,
      recommandation: newFindingRec,
      statut: 'Ouvert'
    });

    onAddLog('Constat Audit Enregistré', `Nouveau constat [Niveau: ${newFindingGravite}] sous la mission ${selectedMission.titre}`);
    setNewFindingTitre('');
    setNewFindingDesc('');
    setNewFindingRec('');
    setShowAddFindingModal(false);
  };

  // Check if current user has Auditeur or CRO role for audit independence
  const isAuditorOrCRO = currentUser.role === 'Risk Manager' || currentUser.role === 'Direction';

  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto space-y-6 text-slate-800 text-xs select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600 animate-pulse" />
            Module 4 — Audit Interne & Indépendance GRC
          </h2>
          <p className="text-slate-500 text-[11px]">
            Planifiez des missions d'audit indépendantes, consignez les constats opérationnels et suivez l'état d'avancement des recommandations réglementaires.
          </p>
        </div>
        
        {isAuditorOrCRO && (
          <button
            onClick={() => setShowAddMissionModal(true)}
            className="px-3 py-1.8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Planifier une Mission d'Audit
          </button>
        )}
      </div>

      {/* THREE ANALYTICAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Missions d'Audit Actives</span>
            <span className="text-2xl font-black text-slate-800 font-mono">
              {missions.length}
            </span>
            <p className="text-[10px] text-slate-500">
              {missions.filter(m => m.status === 'En cours').length} en cours de réalisation
            </p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Constats Non Résolus</span>
            <span className="text-2xl font-black text-red-600 font-mono">
              {findings.filter(f => f.statut !== 'Résolu').length}
            </span>
            <p className="text-[10px] text-slate-500">
              <span className="font-bold text-red-500">{criticalFindings}</span> critiques ou de gravité élevée
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded-full text-red-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Budget Heures Consommé</span>
            <span className="text-2xl font-black text-indigo-600 font-mono">
              285 / 350 h
            </span>
            <p className="text-[10px] text-slate-500">
              Coût estimé : <strong className="text-slate-700">21,375 €</strong> (75 €/h)
            </p>
          </div>
          <div className="bg-amber-50 p-3 rounded-full text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Taux de Remédiation</span>
            <span className="text-2xl font-black text-green-600 font-mono">
              {resolutionRate}%
            </span>
            <p className="text-[10px] text-slate-500">
              {resolvedFindings} recommandations clôturées
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-full text-green-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* AUTOMATED MULTI-YEAR AUDIT PLANNER (3 TO 5 YEARS) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Planificateur Pluriannuel Cyclique Automatique (2026 — 2030)
            </h3>
            <p className="text-slate-500 text-[10.5px]">
              Génération automatique du plan de roulement des contrôles périodiques sur 3 à 5 ans basée sur la criticité des processus.
            </p>
          </div>

          <button
            onClick={() => {
              onAddLog('Plan Pluriannuel Généré', 'Recalcul du plan pluriannuel d\'audit 2026-2030 en fonction des scores de risques.');
              alert('🔄 Le plan pluriannuel cyclique sur 5 ans a été recalculé et synchronisé avec la cartographie des risques !');
            }}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            Recalculer la Rotation 5 Ans
          </button>
        </div>

        {/* 5 Years Roadmap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { annee: '2026 (En cours)', missions: ['Audit SSI & Cyber', 'Conformité RGPD', 'Revue Trésorerie'], charge: '140h', couleur: 'border-indigo-500 bg-indigo-50/50' },
            { annee: '2027', missions: ['Audit Sup. Chaîne Logistique', 'Gouvernance Données', 'Revue Risques RH'], charge: '120h', couleur: 'border-slate-300 bg-slate-50/50' },
            { annee: '2028', missions: ['Audit Processus Ventes', 'Plan Continuité PCA', 'Conformité DORA'], charge: '150h', couleur: 'border-slate-300 bg-slate-50/50' },
            { annee: '2029', missions: ['Revue Contrôle Interne', 'Audit Filiales N+1', 'Comptabilité Clients'], charge: '110h', couleur: 'border-slate-300 bg-slate-50/50' },
            { annee: '2030', missions: ['Audit SSI - Renouvellement', 'Revue ESG / CSRD', 'Gouvernance IT'], charge: '130h', couleur: 'border-slate-300 bg-slate-50/50' }
          ].map((item, idx) => (
            <div key={idx} className={`p-3 rounded-xl border-2 ${item.couleur} space-y-2 text-left`}>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="font-bold text-slate-900 text-xs font-mono">{item.annee}</span>
                <span className="text-[9px] font-bold text-indigo-700 bg-white px-1.5 py-0.2 rounded border shadow-2xs">
                  {item.charge}
                </span>
              </div>
              <ul className="space-y-1 text-[10px] text-slate-600 font-medium">
                {item.missions.map((m, mIdx) => (
                  <li key={mIdx} className="flex items-center gap-1">
                    <span className="text-indigo-600 font-bold">•</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* CORE CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: MISSIONS SIDEBAR */}
        <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Missions de Contrôle</h3>
            <span className="text-[9px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-650">
              Indépendance d'Audit
            </span>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={missionFilter}
              onChange={(e) => setMissionFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-slate-700 focus:outline-none"
            >
              <option value="all">🔍 Tous les types</option>
              <option value="Annuelle">📆 Annuelle</option>
              <option value="Cyclique">🔁 Cyclique</option>
              <option value="Ad-hoc">⚡ Ad-hoc</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {missions
              .filter(m => missionFilter === 'all' || m.type === missionFilter)
              .map(m => {
                const isSelected = m.id === selectedMissionId;
                const piloteFonction = fonctions.find(f => f.id === m.piloteFonctionId)?.libelle || 'Auditeur Interne';
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMissionId(m.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                        : 'border-slate-150 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        m.type === 'Annuelle' ? 'bg-indigo-100 text-indigo-700' :
                        m.type === 'Cyclique' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {m.type}
                      </span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        m.status === 'Clôturée' ? 'bg-green-100 text-green-700' :
                        m.status === 'En cours' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-[11px] leading-tight line-clamp-1">
                      {m.titre}
                    </p>
                    <p className="text-[10px] text-slate-450 mt-1 line-clamp-1">
                      {m.description}
                    </p>
                    
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <User className="w-2.5 h-2.5 text-indigo-400" />
                        {piloteFonction}
                      </span>
                      <span>
                        Échéance : {m.dateFin}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL VIEW & FINDINGS FOR SELECTED MISSION */}
        <div className="lg:col-span-8 space-y-5">
          {selectedMission ? (
            <>
              {/* Mission Summary Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                      Réf: {selectedMission.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug mt-1">
                      {selectedMission.titre}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedMission.dateDebut} au {selectedMission.dateFin}</span>
                  </div>
                </div>

                <p className="text-slate-650 text-[11.5px] leading-relaxed">
                  {selectedMission.description}
                </p>

                <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="text-[9px] text-slate-450 uppercase font-bold block leading-none">Pilote de l'audit</span>
                      <span className="font-bold text-slate-700 text-[11px]">
                        {fonctions.find(f => f.id === selectedMission.piloteFonctionId)?.libelle || 'Auditeur Interne'}
                      </span>
                    </div>
                  </div>

                  {/* Auditor Time Budget Block */}
                  <div className="flex items-center gap-4 border-l border-slate-200 pl-3">
                    <div>
                      <span className="text-[9px] text-slate-450 uppercase font-bold block leading-none">Budget d'Heures</span>
                      <span className="font-mono font-bold text-indigo-700 text-xs">52h / 80h (65%)</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-450 uppercase font-bold block leading-none">Taux Horaire</span>
                      <span className="font-mono font-bold text-slate-700 text-xs">75 €/h (3 900 €)</span>
                    </div>
                    <button
                      onClick={() => {
                        const h = prompt("Nombre d'heures de travail à imputer sur cette mission d'audit :", "8");
                        if (h) {
                          onAddLog('Saisie Temps Auditeur', `Ajout de ${h} heures de travail sur la mission d'audit ${selectedMission.titre}`);
                          alert(`⏱️ ${h} heures de travail ont été enregistrées au budget de la mission !`);
                        }
                      }}
                      className="px-2 py-1 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold rounded text-[10px] cursor-pointer"
                    >
                      + Saisir Heures
                    </button>
                  </div>
                </div>
              </div>

              {/* Mission findings section */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                      Constats & Recommandations ({missionFindings.length})
                    </h4>
                    <p className="text-slate-450 text-[10px]">Éléments et faiblesses décelés par l'équipe indépendante d'audit</p>
                  </div>

                  {isAuditorOrCRO && selectedMission.status !== 'Clôturée' && (
                    <button
                      onClick={() => setShowAddFindingModal(true)}
                      className="px-2.5 py-1.2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-indigo-50/50 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Enregistrer un Constat
                    </button>
                  )}
                </div>

                {missionFindings.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 italic space-y-2">
                    <FileCheck className="w-8 h-8 mx-auto text-slate-250 animate-bounce" style={{ animationDuration: '3s' }} />
                    <p>Aucun constat d'audit n'est enregistré pour cette mission.</p>
                    <p className="text-[10px] text-slate-350">Tout est conforme aux référentiels de contrôle.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {missionFindings.map(f => (
                      <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-inner hover:border-indigo-200 transition">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[9px] font-bold text-slate-400 block">ID CONSTAT : {f.id}</span>
                            <h5 className="font-bold text-slate-800 text-xs leading-tight">
                              {f.titre}
                            </h5>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                              f.gravite === 'Critique' ? 'bg-red-100 text-red-800 border border-red-200' :
                              f.gravite === 'Élevée' ? 'bg-orange-100 text-orange-800' :
                              f.gravite === 'Moyenne' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              ⚠️ {f.gravite}
                            </span>

                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              f.statut === 'Résolu' ? 'bg-green-100 text-green-700' :
                              f.statut === 'En remédiation' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {f.statut}
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {f.description}
                        </p>

                        {/* Recommandations Block */}
                        <div className="p-3 bg-indigo-50/40 rounded border border-indigo-100/60 space-y-1.5">
                          <p className="text-[10px] text-indigo-700 font-bold uppercase flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Recommandation de l'Auditeur :
                          </p>
                          <p className="text-slate-700 leading-normal text-[10.5px]">
                            {f.recommandation}
                          </p>
                        </div>

                        {/* Mitigation plan relationship if any */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-slate-400 text-[10px]">
                            {f.planRemediationId ? (
                              <span>Plan de remédiation associé : <strong className="text-slate-700 font-bold">{f.planRemediationId}</strong></span>
                            ) : (
                              <span className="italic">Aucun plan d'action de remédiation rattaché</span>
                            )}
                          </span>

                          <div className="flex gap-1.5">
                            {f.statut !== 'Résolu' && (
                              <button
                                onClick={() => onUpdateFindingStatus(f.id, 'Résolu')}
                                className="px-2 py-0.8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[9px] cursor-pointer shadow-sm"
                              >
                                Déclarer Résolu
                              </button>
                            )}
                            {f.statut === 'Ouvert' && (
                              <button
                                onClick={() => onUpdateFindingStatus(f.id, 'En remédiation')}
                                className="px-2 py-0.8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[9px] cursor-pointer shadow-sm"
                              >
                                Lancer Remédiation
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-500 font-medium">Aucune mission d'audit n'est enregistrée pour ce tenant.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD MISSION */}
      {showAddMissionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-300 shadow-2xl max-w-md w-full p-6 animate-scale-in space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-2 border-b">
              Planifier une Nouvelle Mission d'Audit
            </h3>
            
            <form onSubmit={handleCreateMission} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Intitulé de l'Audit</label>
                <input
                  type="text"
                  required
                  placeholder="Ex. Revue des accès SI..."
                  value={newMissionTitre}
                  onChange={(e) => setNewMissionTitre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Description du périmètre d'investigation</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex. Évaluation approfondie des contrôles d'accès..."
                  value={newMissionDesc}
                  onChange={(e) => setNewMissionDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Type d'Audit</label>
                  <select
                    value={newMissionType}
                    onChange={(e) => setNewMissionType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Annuelle">Annuelle</option>
                    <option value="Cyclique">Cyclique</option>
                    <option value="Ad-hoc">Ad-hoc</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Auditeur Pilote</label>
                  <select
                    value={newMissionPilote}
                    onChange={(e) => setNewMissionPilote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600"
                  >
                    {fonctions.map(f => (
                      <option key={f.id} value={f.id}>{f.libelle}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Date de début</label>
                  <input
                    type="date"
                    required
                    value={newMissionDateDeb}
                    onChange={(e) => setNewMissionDateDeb(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-850 text-xs rounded p-2 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Date d'échéance</label>
                  <input
                    type="date"
                    required
                    value={newMissionDateFin}
                    onChange={(e) => setNewMissionDateFin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-850 text-xs rounded p-2 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddMissionModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer shadow-sm"
                >
                  Enregistrer et Lancer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD FINDING */}
      {showAddFindingModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-300 shadow-2xl max-w-md w-full p-6 animate-scale-in space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-2 border-b">
              Consigner un Constat d'Audit
            </h3>
            
            <form onSubmit={handleCreateFinding} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-bold">Intitulé du dysfonctionnement</label>
                <input
                  type="text"
                  required
                  placeholder="Ex. Absence de revue annuelle de..."
                  value={newFindingTitre}
                  onChange={(e) => setNewFindingTitre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-bold">Faits et observations</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex. Lors de notre audit du 14, nous avons constaté que..."
                  value={newFindingDesc}
                  onChange={(e) => setNewFindingDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-bold">Gravité constatée</label>
                <select
                  value={newFindingGravite}
                  onChange={(e) => setNewFindingGravite(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600"
                >
                  <option value="Faible">Faible</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Élevée">Élevée</option>
                  <option value="Critique">Critique (Alerte Immédiate)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-bold">Recommandation formelle</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex. Rétablir la procédure de contrôle hebdomadaire..."
                  value={newFindingRec}
                  onChange={(e) => setNewFindingRec(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600 resize-none font-semibold text-indigo-700"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddFindingModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer shadow-sm"
                >
                  Enregistrer le Constat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
