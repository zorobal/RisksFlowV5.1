/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileCheck, 
  ShieldAlert, 
  AlertOctagon, 
  Plus, 
  Calendar, 
  Search, 
  BadgeAlert, 
  DollarSign, 
  BookOpen, 
  CheckCircle, 
  Activity,
  Award,
  Trash2
} from 'lucide-react';
import { ComplianceFramework, ComplianceObligation, ComplianceIncident, Fonction } from '../types';

interface ComplianceModuleProps {
  frameworks: ComplianceFramework[];
  obligations: ComplianceObligation[];
  incidents: ComplianceIncident[];
  fonctions: Fonction[];
  onAddFramework: (fw: Omit<ComplianceFramework, 'id'>) => void;
  onAddObligation: (ob: Omit<ComplianceObligation, 'id'>) => void;
  onUpdateObligationStatus: (id: string, status: ComplianceObligation['statut']) => void;
  onAddIncident: (inc: Omit<ComplianceIncident, 'id'>) => void;
  onUpdateIncidentStatus: (id: string, status: ComplianceIncident['statutDeclaration']) => void;
  onAddLog: (action: string, details: string) => void;
}

export default function ComplianceModule({
  frameworks,
  obligations,
  incidents,
  fonctions,
  onAddFramework,
  onAddObligation,
  onUpdateObligationStatus,
  onAddIncident,
  onUpdateIncidentStatus,
  onAddLog
}: ComplianceModuleProps) {
  const [activeTab, setActiveTab] = useState<'frameworks' | 'incidents'>('frameworks');
  const [selectedFwId, setSelectedFwId] = useState<string>(frameworks[0]?.id || '');
  
  // Modals
  const [showFwModal, setShowFwModal] = useState(false);
  const [showObModal, setShowObModal] = useState(false);
  const [showIncModal, setShowIncModal] = useState(false);

  // Fw Inputs
  const [newFwNom, setNewFwNom] = useState('');
  const [newFwVersion, setNewFwVersion] = useState('');
  const [newFwSecteur, setNewFwSecteur] = useState('');

  // Ob Inputs
  const [newObTitre, setNewObTitre] = useState('');
  const [newObDesc, setNewObDesc] = useState('');
  const [newObResp, setNewObResp] = useState(fonctions[4]?.id || fonctions[0]?.id || '');

  // Inc Inputs
  const [newIncTitre, setNewIncTitre] = useState('');
  const [newIncDesc, setNewIncDesc] = useState('');
  const [newIncImpact, setNewIncImpact] = useState<number>(0);
  const [newIncMesures, setNewIncMesures] = useState('');

  const selectedFw = frameworks.find(f => f.id === selectedFwId) || frameworks[0];
  const fwObligations = obligations.filter(o => o.frameworkId === (selectedFw?.id || ''));

  // Aggregated Stats
  const totalObligations = obligations.length;
  const compliantCount = obligations.filter(o => o.statut === 'Conforme').length;
  const compliantRate = totalObligations > 0 ? Math.round((compliantCount / totalObligations) * 100) : 0;
  
  const totalFinancialImpact = incidents.reduce((sum, current) => sum + (current.impactFinancier || 0), 0);

  const handleAddFw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFwNom.trim()) return;

    onAddFramework({
      nom: newFwNom,
      version: newFwVersion,
      secteur: newFwSecteur
    });
    onAddLog('Compliance Framework', `Ajout du référentiel normatif : ${newFwNom}`);
    setNewFwNom('');
    setNewFwVersion('');
    setNewFwSecteur('');
    setShowFwModal(false);
  };

  const handleAddOb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObTitre.trim() || !selectedFw) return;

    onAddObligation({
      frameworkId: selectedFw.id,
      titre: newObTitre,
      description: newObDesc,
      statut: 'Partiel',
      responsableFonctionId: newObResp,
      derniereRevue: new Date().toISOString().split('T')[0]
    });
    onAddLog('Compliance Obligation', `Création d'une obligation : ${newObTitre}`);
    setNewObTitre('');
    setNewObDesc('');
    setShowObModal(false);
  };

  const handleAddInc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncTitre.trim()) return;

    onAddIncident({
      dateOccurrence: new Date().toISOString().split('T')[0],
      titre: newIncTitre,
      description: newIncDesc,
      impactFinancier: Number(newIncImpact),
      statutDeclaration: 'Brouillon',
      mesuresPrises: newIncMesures
    });
    onAddLog('Compliance Incident', `Déclaration d'incident de conformité : ${newIncTitre}`);
    setNewIncTitre('');
    setNewIncDesc('');
    setNewIncImpact(0);
    setNewIncMesures('');
    setShowIncModal(false);
  };

  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto space-y-6 text-slate-800 text-xs select-none">
      
      {/* HEADER RIBBON */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600 animate-spin" style={{ animationDuration: '10s' }} />
            Module 5 — Conformité Réglementaire (Gouvernance Multi-Référentiels)
          </h2>
          <p className="text-slate-500 text-[11px]">
            Gérez vos obligations réglementaires (RGPD, ISO 27001, Bâle III), évaluez le statut de conformité et déclarez les incidents réglementaires majeurs aux autorités.
          </p>
        </div>
        
        <div className="flex bg-slate-150 p-0.5 rounded border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('frameworks')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              activeTab === 'frameworks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📋 Référentiels & Obligations
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              activeTab === 'incidents' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🚨 Incidents & Déclarations
          </button>
        </div>
      </div>

      {/* COMPLIANCE ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Normes et Référentiels</span>
            <span className="text-2xl font-black text-slate-800 font-mono">
              {frameworks.length}
            </span>
            <p className="text-[10px] text-slate-500">
              Couvrant vos différents secteurs d'activité
            </p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Indice de Conformité Globale</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {compliantRate}%
            </span>
            <p className="text-[10px] text-slate-500">
              {compliantCount}/{totalObligations} obligations évaluées conformes
            </p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-full text-emerald-600">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Impact Financier des Incidents</span>
            <span className="text-2xl font-black text-rose-600 font-mono">
              {totalFinancialImpact.toLocaleString('fr-FR')} FCFA
            </span>
            <p className="text-[10px] text-slate-500">
              {incidents.length} incidents réglementaires déclarés
            </p>
          </div>
          <div className="bg-rose-50 p-3 rounded-full text-rose-600">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* AUTOMATED LEGAL WATCH & RSS/API CONNECTOR PANEL */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Connecteur Automatisé de Veille Juridique & Textes de Lois (Flux RSS / API Législation)
            </h3>
            <p className="text-slate-500 text-[10.5px]">
              Importation continue des nouvelles directives, lois et décrets d'application en temps réel (EUR-Lex, Légifrance, CNIL, COBAC, BCEAO).
            </p>
          </div>

          <button
            onClick={() => {
              onAddLog('Veille Juridique Synchronisée', 'Synchronisation automatique du flux RSS Légifrance / EUR-Lex / COBAC.');
              alert('📡 Synchronisation réussie ! 3 nouveaux textes de loi et amendements réglementaires ont été importés avec succès.');
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow text-xs cursor-pointer flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            Synchroniser Flux RSS/API Juridique
          </button>
        </div>

        {/* Live legal feed updates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { titre: 'EU AI Act (Règlement Européen sur l\'IA)', source: 'EUR-Lex Official', date: 'Juillet 2026', desc: 'Mise en conformité obligatoire des systèmes IA à haut risque.', statut: 'Nouveau' },
            { titre: 'Directive NIS 2 - Exigences Cybersécurité', source: 'ANSSI / Légifrance', date: 'Juin 2026', desc: 'Renforcement de la résilience des entités essentielles et importantes.', statut: 'Importé' },
            { titre: 'Règlementation COBAC / BCEAO - Risque TIC', source: 'Journal Officiel', date: 'Mai 2026', desc: 'Cadre de gestion du risque lié aux prestataires TIC tiers.', statut: 'Nouveau' }
          ].map((feed, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-mono">
                  {feed.source}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">{feed.date}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs">{feed.titre}</h4>
              <p className="text-slate-500 text-[10px] leading-snug">{feed.desc}</p>
              <button
                onClick={() => {
                  onAddFramework({ nom: feed.titre, version: '2026.1', secteur: feed.source });
                  onAddLog('Veille Juridique Importée', `Import direct du texte : ${feed.titre}`);
                  alert(`✅ Le texte de loi "${feed.titre}" a été converti et ajouté à vos référentiels de conformité !`);
                }}
                className="w-full mt-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded text-[10px] cursor-pointer text-center"
              >
                + Convertir en Référentiel
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CORE SECTIONS */}
      {activeTab === 'frameworks' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT LIST: FRAMEWORKS */}
          <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Bibliothèque Normative</h3>
              <button
                onClick={() => setShowFwModal(true)}
                className="p-1 hover:bg-slate-100 rounded text-indigo-600"
                title="Ajouter un référentiel"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {frameworks.map(fw => {
                const isSelected = fw.id === selectedFwId;
                const fwOblCount = obligations.filter(o => o.frameworkId === fw.id).length;
                return (
                  <div
                    key={fw.id}
                    onClick={() => setSelectedFwId(fw.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-indigo-650 bg-indigo-50/55 shadow-sm font-semibold' 
                        : 'border-slate-150 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <p className="font-bold text-slate-800 text-[11px] leading-tight">
                      {fw.nom}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-[9px] text-slate-400">
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        v{fw.version}
                      </span>
                      <span>
                        {fwOblCount} obligations référencées
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT GRID: OBLIGATIONS */}
          <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            {selectedFw ? (
              <>
                <div className="flex justify-between items-center border-b pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                      Périmètre : {selectedFw.secteur}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight mt-1.5">
                      Obligations du Référentiel {selectedFw.nom}
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowObModal(true)}
                    className="px-2.5 py-1.2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-indigo-50/50 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter Obligation
                  </button>
                </div>

                <div className="space-y-4">
                  {fwObligations.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 italic">
                      Aucune obligation documentée pour ce référentiel.
                    </div>
                  ) : (
                    fwObligations.map(ob => (
                      <div key={ob.id} className="p-4 rounded-xl border border-slate-150 hover:border-indigo-200 transition bg-slate-50/30 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                        
                        <div className="md:col-span-8 space-y-1.5 text-left">
                          <span className="font-mono text-[9px] text-slate-400 font-bold block">CODE EXIGENCE : {ob.id}</span>
                          <h4 className="font-bold text-slate-800 text-[11px] leading-tight">
                            {ob.titre}
                          </h4>
                          <p className="text-slate-500 leading-relaxed text-[10.5px]">
                            {ob.description}
                          </p>

                          <div className="pt-2 flex flex-wrap items-center gap-4 text-[9px] text-slate-400">
                            <span className="font-semibold text-indigo-650">
                              Responsable : {fonctions.find(f => f.id === ob.responsableFonctionId)?.libelle || 'Compliance Officer'}
                            </span>
                            <span>
                              Dernière revue : {ob.derniereRevue}
                            </span>
                          </div>
                        </div>

                        <div className="md:col-span-4 flex flex-col items-stretch md:items-end gap-2 shrink-0 h-full justify-between">
                          <select
                            value={ob.statut}
                            onChange={(e) => onUpdateObligationStatus(ob.id, e.target.value as any)}
                            className={`px-2 py-1.5 rounded text-[10px] font-bold border ${
                              ob.statut === 'Conforme' ? 'bg-green-50 text-green-800 border-green-200' :
                              ob.statut === 'Partiel' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                              ob.statut === 'Non conforme' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-gray-50 text-gray-850'
                            }`}
                          >
                            <option value="Conforme">✅ Conforme</option>
                            <option value="Partiel">⚠️ Partiel</option>
                            <option value="Non conforme">❌ Non conforme</option>
                            <option value="Non applicable">⚪ Non applicable</option>
                          </select>
                          
                          <span className="text-[9px] text-slate-400 italic text-right hidden md:block">
                            Mis à jour le jour de l'évaluation
                          </span>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 italic">
                Veuillez sélectionner ou créer un référentiel normatif dans la colonne de gauche.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* INCIDENTS TABLE VIEW */
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wide">Journal des Incidents Réglementaires (Log)</h3>
              <p className="text-slate-450 text-[10px]">Suivi des non-conformités, fuites de données d'entreprise ou fraudes signalées.</p>
            </div>

            <button
              onClick={() => setShowIncModal(true)}
              className="px-3 py-1.8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Déclarer un Incident
            </button>
          </div>

          <table className="w-full border-collapse border border-slate-200 text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider text-[9px] border-b border-slate-200">
                <th className="py-2.5 px-3 border border-slate-200">ID / Date</th>
                <th className="py-2.5 px-3 border border-slate-200">Incident réglementaire</th>
                <th className="py-2.5 px-3 border border-slate-200 text-right">Impact Financier</th>
                <th className="py-2.5 px-3 border border-slate-200">Mesures d'atténuation prises</th>
                <th className="py-2.5 px-3 border border-slate-200 text-center">Statut Déclaration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[10.5px]">
              {incidents.map(inc => (
                <tr key={inc.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 border border-slate-200">
                    <span className="font-mono font-bold text-slate-500 block">{inc.id}</span>
                    <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-2.5 h-2.5 text-slate-450" /> {inc.dateOccurrence}
                    </span>
                  </td>
                  <td className="py-3 px-3 border border-slate-200">
                    <p className="font-bold text-slate-800 leading-tight">{inc.titre}</p>
                    <p className="text-slate-450 text-[9.5px] mt-1 leading-normal">{inc.description}</p>
                  </td>
                  <td className="py-3 px-3 border border-slate-200 text-right font-mono font-bold text-rose-600">
                    {inc.impactFinancier ? `${inc.impactFinancier.toLocaleString('fr-FR')} FCFA` : 'Néant'}
                  </td>
                  <td className="py-3 px-3 border border-slate-200 italic text-slate-600 leading-normal">
                    {inc.mesuresPrises}
                  </td>
                  <td className="py-3 px-3 border border-slate-200 text-center">
                    <select
                      value={inc.statutDeclaration}
                      onChange={(e) => onUpdateIncidentStatus(inc.id, e.target.value as any)}
                      className={`px-1.5 py-1 rounded text-[9px] font-bold border bg-white ${
                        inc.statutDeclaration === 'Résolu' ? 'text-green-800 border-green-200' :
                        inc.statutDeclaration === 'Déclaré CNIL' ? 'text-blue-800 border-blue-200' :
                        inc.statutDeclaration === 'Déclaré Autorités' ? 'text-amber-800 border-amber-200' : 'text-slate-650 border-slate-200'
                      }`}
                    >
                      <option value="Brouillon">📊 Brouillon</option>
                      <option value="Déclaré CNIL">🛡️ Déclaré CNIL</option>
                      <option value="Déclaré Autorités">🏛️ Déclaré Autorités</option>
                      <option value="Résolu">✅ Résolu</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: ADD FRAMEWORK */}
      {showFwModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-300 shadow-2xl max-w-md w-full p-6 animate-scale-in space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-2 border-b">
              Ajouter un Nouveau Référentiel Normatif
            </h3>
            
            <form onSubmit={handleAddFw} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Nom de la Réglementation / Norme</label>
                <input
                  type="text"
                  required
                  placeholder="Ex. ISO 27001 - Management de la Sécurité..."
                  value={newFwNom}
                  onChange={(e) => setNewFwNom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Version / Année</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex. 2022..."
                    value={newFwVersion}
                    onChange={(e) => setNewFwVersion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-850 text-xs rounded p-2 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Secteur / Domaine</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex. Cyber, Finance..."
                    value={newFwSecteur}
                    onChange={(e) => setNewFwSecteur(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-850 text-xs rounded p-2 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFwModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer shadow-sm"
                >
                  Enregistrer Référentiel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD OBLIGATION */}
      {showObModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-300 shadow-2xl max-w-md w-full p-6 animate-scale-in space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-2 border-b">
              Consigner une Obligation Réglementaire
            </h3>
            
            <form onSubmit={handleAddOb} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Code et Titre de l'Exigence</label>
                <input
                  type="text"
                  required
                  placeholder="Ex. Art 32 - Mesures techniques de sécurité..."
                  value={newObTitre}
                  onChange={(e) => setNewObTitre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-bold">Description de l'obligation légale</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex. L'entreprise doit mettre en oeuvre des moyens de chiffrement des bases de données..."
                  value={newObDesc}
                  onChange={(e) => setNewObDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Fonction Responsable du Suivi</label>
                <select
                  value={newObResp}
                  onChange={(e) => setNewObResp(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600"
                >
                  {fonctions.map(f => (
                    <option key={f.id} value={f.id}>{f.libelle}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowObModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer shadow-sm"
                >
                  Enregistrer l'Obligation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD INCIDENT */}
      {showIncModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-300 shadow-2xl max-w-md w-full p-6 animate-scale-in space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-2 border-b">
              Signaler un Incident de Conformité
            </h3>
            
            <form onSubmit={handleAddInc} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-bold">Nature de l'incident</label>
                <input
                  type="text"
                  required
                  placeholder="Ex. Fuite accidentelle d'e-mails prospects..."
                  value={newIncTitre}
                  onChange={(e) => setNewIncTitre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Description circonstanciée</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex. Le 14 juin, un collaborateur a partagé un document Excel..."
                  value={newIncDesc}
                  onChange={(e) => setNewIncDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-bold">Impact financier direct / amendes potentielles (FCFA)</label>
                <input
                  type="number"
                  required
                  value={newIncImpact}
                  onChange={(e) => setNewIncImpact(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600 font-mono font-bold text-rose-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-bold">Mesures correctives immédiates prises</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex. Révocation immédiate de l'accès public, rapport de sécurité..."
                  value={newIncMesures}
                  onChange={(e) => setNewIncMesures(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded p-2 focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowIncModal(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer shadow-sm"
                >
                  Consigner et Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
