import React, { useState } from 'react';
import { 
  Sparkles, Shield, ArrowRight, Layers, Play, Check, 
  ClipboardList, UserCheck, Building2, Calendar, FileText,
  Globe, Server, Laptop, Mail, ShieldCheck, Zap, Key, CheckCircle2, Lock, Cpu, Info, AlertTriangle
} from 'lucide-react';
import { User, TenantConfig } from '../types';

interface DemoModuleProps {
  users: User[];
  tenants: TenantConfig[];
  onSelectScenario: (user: User, tenantId: string, isSuperAdmin: boolean, initialModule: any) => void;
  onBackToLogin: () => void;
}

export default function DemoModule({ users, tenants, onSelectScenario, onBackToLogin }: DemoModuleProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('sc_admin_entreprise');

  const demoScenarios = [
    {
      id: 'sc_admin_entreprise',
      title: 'Scénario 1 : Administrateur de l\'Entreprise Client',
      description: 'Gérez la configuration interne de votre entreprise : habilitations et rôles des équipes, paramétrage de l\'organisation et des entités métiers, suivi et clôture des sessions d\'exercice annuel.',
      persona: users.find(u => u.role === 'Direction') || users[1] || users[0],
      tenantId: 'tenant1',
      isSuperAdmin: false,
      initialModule: 'admin',
      badge: 'Administration Interne • Utilisateurs & Sessions',
      badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
    },
    {
      id: 'sc_riskmanager',
      title: 'Scénario 2 : Risk Manager de Sogesti S.A.',
      description: 'Pilotez l\'analyse des risques d\'une grande compagnie d\'assurance. Utilisez la matrice de criticité 4x4 et la formule originale de l\'IFACI (F x I x M), planifiez des actions de traitement correctives (MFA, RGPD) et filtrez les indicateurs par Exercice fiscal.',
      persona: users.find(u => u.email === 'alainpatricknkoumou@gmail.com') || users[0],
      tenantId: 'tenant1',
      isSuperAdmin: false,
      initialModule: 'dashboard',
      badge: 'Matrice 4x4 • Formule IFACI',
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'sc_analyste',
      title: 'Scénario 3 : Analyste d\'AeroTech (Terrain)',
      description: 'Saisissez les fiches d\'incidents de calibrage d\'un constructeur aéronautique. Déclarez de nouveaux incidents de conformité technique, mettez à jour l\'état d\'avancement de vos plans de remédiation, et appliquez la formule soustraite mitigée (P * I - M) sur une grille 5x5.',
      persona: users.find(u => u.role === 'Analyste') || users[3] || users[0],
      tenantId: 'tenant2',
      isSuperAdmin: false,
      initialModule: 'actions',
      badge: 'Formule Mitigée • Grille 5x5',
      badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30'
    },
    {
      id: 'sc_direction',
      title: 'Scénario 4 : Direction Générale & Auditeur Chef',
      description: 'Supervisez la conformité réglementaire de haut niveau et examinez les constats d\'audits. Générez de splendides rapports d\'exposition consolidés pour les instances exécutives, et effectuez la clôture officielle d\'une session d\'exercice annuel.',
      persona: users.find(u => u.role === 'Direction') || users[1] || users[0],
      tenantId: 'tenant1',
      isSuperAdmin: false,
      initialModule: 'reporting',
      badge: 'Comité d\'Audit • Clôture d\'Exercice',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    }
  ];

  const caseStudies: Record<string, {
    title: string;
    description: string;
    targetTenantName: string;
    steps: {
      stepNumber: number;
      title: string;
      objective: string;
      action: string;
      result: string;
      module: string;
    }[];
  }> = {
    sc_admin_entreprise: {
      title: "Administration Interne et Gouvernance de l'Entreprise Client",
      description: "Ce cas d'usage simule le rôle d'Administrateur au sein d'une entreprise cliente. Vous configurerez les comptes utilisateurs et habilitations, gérerez les entités de votre structure et suivrez les sessions d'exercice annuel.",
      targetTenantName: "Sogesti S.A. (Assurances)",
      steps: [
        {
          stepNumber: 1,
          title: "Gestion des Comptes Utilisateurs & Habilitations",
          objective: "Accorder et ajuster les rôles et droits d'accès (Risk Manager, Analyste, Auditeur) aux collaborateurs de l'entreprise.",
          action: "Accédez au module Administration (onglet 'Utilisateurs') pour ajouter ou modifier un profil utilisateur.",
          result: "Le compte utilisateur est immédiatement mis à jour avec son périmètre d'accès et ses autorisations.",
          module: "admin"
        },
        {
          stepNumber: 2,
          title: "Configuration de l'Organisation & Entités Métiers",
          objective: "Rattacher les entités organisationnelles et filiales pour une segmentation fine des risques.",
          action: "Dans le module Administration (onglet 'Entreprise'), vérifiez la configuration des départements et périmètres.",
          result: "Les entités organisationnelles sont prêtes pour l'assignation dans les fiches de risques.",
          module: "admin"
        },
        {
          stepNumber: 3,
          title: "Planification d'une Session d'Exercice Annuel",
          objective: "Lancer une nouvelle campagne d'évaluation et fixer les dates d'exercice fiscal (ex: Exercice 2026).",
          action: "Allez sur l'onglet 'Sessions & Exercices', puis créez ou ouvrez une nouvelle session annuelle.",
          result: "La session est activée et permet de filtrer l'ensemble des indicateurs de risques et tableaux de bord.",
          module: "admin"
        },
        {
          stepNumber: 4,
          title: "Clôture de Session d'Exercice & Bilan Annuel",
          objective: "Figer les évaluations de l'exercice en cours et archiver les constats pour les auditeurs.",
          action: "Cliquez sur 'Clôturer l'Exercice', renseignez le bilan consolidé et validez la fermeture de la session.",
          result: "L'exercice est verrouillé avec sauvegarde immuable des indicateurs de performance GRC.",
          module: "admin"
        }
      ]
    },
    sc_riskmanager: {
      title: "Évaluation Réglementaire IFACI & Traitement des Menaces",
      description: "Incarnez le Risk Manager de l'entreprise Sogesti S.A. Ce cas pratique vous guide dans l'évaluation d'un risque d'assurance, le comparatif par exercice fiscal et l'atténuation d'un risque résiduel informatique.",
      targetTenantName: "Sogesti S.A. (Assurances)",
      steps: [
        {
          stepNumber: 1,
          title: "Analyse d'Impact par Exercice Fiscal",
          objective: "Comparer et analyser l'exposition globale aux risques entre deux exercices annuels.",
          action: "Dans le Tableau de Bord, sélectionnez l'Exercice fiscal '2026' ou '2025' et observez le comparateur automatisé.",
          result: "Le système affiche les tendances comparées d'évolution des risques actifs, l'indice net moyen et le taux d'avancement des plans de mitigation.",
          module: "dashboard"
        },
        {
          stepNumber: 2,
          title: "Cotation IFACI d'une Cyberattaque de Ransomware",
          objective: "Réévaluer les critères de sévérité d'une fiche de risque informatique.",
          action: "Naviguez vers 'Cartographie des Risques', localisez le risque R-101 et cliquez sur 'Réévaluer'.",
          result: "Modifiez la Fréquence, l'Impact et la Maîtrise de la menace pour recalculer dynamiquement l'Indice Résiduel selon l'IFACI (F x I x M).",
          module: "risks"
        },
        {
          stepNumber: 3,
          title: "Déploiement du Plan de Traitement (Mitigation)",
          objective: "Associer une action corrective d'urgence pour réduire l'exposition nette de l'assurance.",
          action: "Naviguez dans le module 'Plans d'Actions' et ajoutez une action de mitigation (ex: Authentification MFA).",
          result: "L'action corrective est liée à la fiche de risque avec un responsable désigné et s'intègre au plan d'action global.",
          module: "actions"
        },
        {
          stepNumber: 4,
          title: "Contrôle visuel sur la Matrice de Criticité",
          objective: "Vérifier la descente thermique du risque sur la grille de criticité 4x4.",
          action: "Naviguez vers le module 'Matrice de Criticité' (Heatmap) pour observer la position du risque.",
          result: "Le risque R-101 est positionné à l'intersection brute (Fréquence x Impact) et résiduelle (atténuée par le contrôle).",
          module: "heatmap"
        }
      ]
    },
    sc_analyste: {
      title: "Signalement d'Incidents Qualité et Saisie de Terrain",
      description: "Incarnez l'analyste GRC de terrain chez AeroTech. Ce cas pratique démontre la déclaration d'incidents techniques de calibrage, l'avancement des corrections et l'application de la formule soustraite mitigée.",
      targetTenantName: "AeroTech (Aéronautique)",
      steps: [
        {
          stepNumber: 1,
          title: "Déclaration d'un Incident Qualité de Calibrage",
          objective: "Enregistrer une déviation ou un incident survenu en atelier aéronautique.",
          action: "Dans le module 'Conformité', déclarez un incident lié à un calibrage ou à la sécurité physique.",
          result: "Le système l'enregistre avec un niveau de gravité, trace l'action dans le journal d'audit et la rattache au pôle technique.",
          module: "compliance"
        },
        {
          stepNumber: 2,
          title: "Planification d'une Action Corrective Immédiate",
          objective: "Rédiger une mesure corrective d'ingénierie et l'affecter aux ingénieurs responsables.",
          action: "Naviguez vers 'Plans d'Actions' pour planifier une action corrective d'urgence avec priorité haute.",
          result: "L'action s'intègre au tableau Kanban pour un suivi en temps réel de son exécution par l'atelier.",
          module: "actions"
        },
        {
          stepNumber: 3,
          title: "Clôture de l'Action et Impact sur la Matrice 5x5",
          objective: "Valider l'exécution de la correction et observer le calcul soustrait mitigé (P * I - M).",
          action: "Modifiez le statut de l'action corrective pour la marquer comme 'Réalisé'.",
          result: "Le taux de remédiation global augmente, et la sévérité résiduelle diminue drastiquement sur la matrice 5x5.",
          module: "heatmap"
        }
      ]
    },
    sc_direction: {
      title: "Revue de Conformité, Rapports GRC et Clôture Annuelle d'Exercice",
      description: "Incarnez le Directeur Général ou l'Auditeur en Chef de Sogesti. Ce cas pratique vous guide dans l'examen des constats d'audits, la génération de rapports de conformité et la clôture officielle d'une session annuelle.",
      targetTenantName: "Sogesti S.A. (Assurances)",
      steps: [
        {
          stepNumber: 1,
          title: "Examen des Constats d'Audits Internes",
          objective: "Prendre connaissance des recommandations formulées par les équipes d'audit.",
          action: "Accédez à l'onglet 'Audit Interne' pour examiner la mission d'audit en cours.",
          result: "Vous visualisez l'historique d'audit, les écarts constatés et les plans d'action attendus pour la conformité.",
          module: "audit"
        },
        {
          stepNumber: 2,
          title: "Génération de la Liasse de Reporting",
          objective: "Consulter la synthèse consolidée pour les instances réglementaires.",
          action: "Naviguez vers le module 'Rapports & Audit' pour extraire le dossier de reporting annuel.",
          result: "Les données d'évaluation, de conformité et les indicateurs clés s'affichent sous forme de liasse synthétique.",
          module: "reporting"
        },
        {
          stepNumber: 3,
          title: "Clôture de la Session Annuelle d'Exercice",
          objective: "Figer définitivement les informations de l'exercice pour entamer le nouveau cycle fiscal.",
          action: "Accédez au module 'Administration' (Admin), ouvrez l'onglet 'Sessions & Exercices', cliquez sur 'Clôturer', rédigez le bilan annuel consolidé et validez.",
          result: "La session passe au statut 'Clôturée' immuable et le bilan annuel consolidé est sauvegardé de façon sécurisée.",
          module: "admin"
        }
      ]
    }
  };

  const activeCaseStudy = caseStudies[selectedScenarioId] || caseStudies['sc_admin_entreprise'];
  const activeScenarioObj = demoScenarios.find(s => s.id === selectedScenarioId) || demoScenarios[0];

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-wide">ESPACE DÉMONSTRATION INTERACTIVE</h1>
            <p className="text-[10px] text-slate-400 font-medium">Scénarios Pratiques Pas-à-Pas • Prise en Main Guidée</p>
          </div>
        </div>
        
        <button
          onClick={onBackToLogin}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer text-slate-200 hover:text-white flex items-center gap-1.5 shadow-sm"
        >
          &larr; Retour au Portail de Connexion
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* Intro Hero Banner */}
        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-48 h-48 text-indigo-400" />
          </div>
          
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Guide d'Exploration Interactive</span>
            </div>
            
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
              Bienvenue dans la Démonstration Guidée de la Plateforme GRC
            </h2>
            
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Sélectionnez un scénario métier ci-dessous pour charger son <strong>Cas Pratique Pas-à-Pas</strong>. Vous pouvez démarrer le scénario complet en un clic ou accéder directement à l'étape spécifique de votre choix.
            </p>
          </div>
        </div>

        {/* SECTION: Application Multi-Deployment Versatility Description */}
        <section className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white tracking-wide">
                  Polyvalence d'Utilisation & Modes de Déploiement de l'Application
                </h3>
                <p className="text-[11px] text-slate-400">
                  Adaptée aux exigences des grands groupes, des PME, des réseaux souverains d'entreprise et des usages locaux autonomes.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 text-[10px] font-bold rounded-md border border-indigo-500/20">
              Multi-Environnements
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Deployment 1: Online SaaS */}
            <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-2.5 shadow-md flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <Globe className="w-4 h-4 shrink-0" />
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">1. En Ligne (Cloud / SaaS Multi-Tenant)</h4>
                </div>
                <p className="text-[11.5px] text-slate-300 leading-relaxed">
                  Accessible 24h/24 via n'importe quel navigateur internet sécurisé. Garantit l'étanchéité physique absolue des données entre entreprises clientes (<em>Database-per-Tenant</em>) avec gestion dynamique des abonnements et des modules par le SuperAdmin.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-indigo-300 font-mono">
                <span>• Accès universel web</span>
                <span>• Zero installation</span>
              </div>
            </div>

            {/* Deployment 2: Enterprise Network */}
            <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800/80 hover:border-purple-500/40 transition-all space-y-2.5 shadow-md flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-purple-400">
                  <Server className="w-4 h-4 shrink-0" />
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">2. Réseau d'Entreprise (On-Premise / Intranet)</h4>
                </div>
                <p className="text-[11.5px] text-slate-300 leading-relaxed">
                  Déploiement souverain au sein du réseau intranet ou du Cloud privé d'une grande entreprise (banques, assurances, industrie). Offre un contrôle total sur les serveurs, l'intégration aux annuaires d'entreprise et la confidentialité absolue des flux sans fuite externe.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-purple-300 font-mono">
                <span>• Intranet d'entreprise</span>
                <span>• Souveraineté totale</span>
              </div>
            </div>

            {/* Deployment 3: Personal Local */}
            <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800/80 hover:border-teal-500/40 transition-all space-y-2.5 shadow-md flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-teal-400">
                  <Laptop className="w-4 h-4 shrink-0" />
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">3. Usage Personnel & Local (Stand-Alone)</h4>
                </div>
                <p className="text-[11.5px] text-slate-300 leading-relaxed">
                  Exécution légère et autonome directement sur un ordinateur portable ou un poste de travail individuel (Localhost). Idéal pour un consultant, un auditeur indépendant ou un usage personnel de modélisation de risques monosite sans dépendance serveur.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-teal-300 font-mono">
                <span>• Poste individuel</span>
                <span>• Mode déconnecté</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Scenarios Selection */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Scénarios d'Utilisation Métiers</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">4 profils pré-configurés</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoScenarios.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              return (
                <div 
                  key={sc.id}
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={`flex flex-col justify-between rounded-xl p-5 border transition-all duration-200 cursor-pointer relative overflow-hidden group select-none ${
                    isSelected 
                      ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/30' 
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  {/* Selected Indicator Ribbon */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-[9px] text-white font-extrabold px-3 py-1 rounded-bl-lg shadow flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Cas Pratique Actif
                    </div>
                  )}

                  <div>
                    {/* Badge */}
                    <span className={`inline-block text-[9.5px] font-bold uppercase border px-2.5 py-0.5 rounded-full ${sc.badgeColor} mb-3.5`}>
                      {sc.badge}
                    </span>
                    
                    <h4 className={`text-sm font-bold transition-colors mb-2 ${isSelected ? 'text-indigo-300' : 'text-white group-hover:text-indigo-300'}`}>
                      {sc.title}
                    </h4>
                    
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {sc.description}
                    </p>
                  </div>

                  {/* Footer with persona info & action button */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <img 
                        src={sc.persona.avatar} 
                        alt="" 
                        className="w-8 h-8 rounded-full border border-slate-700 object-cover shadow-sm" 
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-200 leading-none">{sc.persona.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{sc.persona.role}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectScenario(sc.persona, sc.tenantId, sc.isSuperAdmin, sc.initialModule);
                      }}
                      className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-indigo-600/25"
                      title="Lancer le scénario de test complet"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Démarrer ce Scénario</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Active Case Study - Step-by-Step Practical Guide */}
        {activeCaseStudy && (
          <section className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-5 md:p-6 space-y-6 shadow-2xl animate-fade-in">
            {/* Case Study Title Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg">
                    <ClipboardList className="w-5 h-5" />
                  </span>
                  <h3 className="font-extrabold text-base text-white tracking-wide">
                    Cas Pratique : {activeCaseStudy.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {activeCaseStudy.description}
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px] font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 shrink-0 shadow-inner">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>Espace Cible :</span>
                <strong className="text-white">{activeCaseStudy.targetTenantName}</strong>
              </div>
            </div>

            {/* Steps Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Étapes du cas pratique pas-à-pas :
                </p>
                <span className="text-[11px] text-slate-500 font-medium">
                  Cliquez sur "Lancer cette étape" pour accéder directement au module
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeCaseStudy.steps.map((step) => {
                  return (
                    <div 
                      key={step.stepNumber} 
                      className="bg-slate-950/90 border border-slate-800/90 hover:border-indigo-500/40 rounded-xl p-5 space-y-4 transition-all flex flex-col justify-between shadow-md"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                            Étape {step.stepNumber}
                          </span>
                          <span className="text-slate-400 text-[10.5px] font-mono font-bold uppercase flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                            <Layers className="w-3 h-3 text-indigo-400" />
                            Module : {step.module.toUpperCase()}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-100 text-xs md:text-sm tracking-wide">
                          {step.title}
                        </h4>

                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-850">
                            <strong className="text-indigo-400 text-[10.5px] uppercase font-bold block mb-0.5">🎯 Objectif Métier :</strong>
                            <p className="text-slate-300 leading-relaxed text-[11px]">{step.objective}</p>
                          </div>
                          
                          <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-850">
                            <strong className="text-amber-400 text-[10.5px] uppercase font-bold block mb-0.5">🛠️ Action à Réaliser :</strong>
                            <p className="text-slate-300 leading-relaxed text-[11px]">{step.action}</p>
                          </div>
                          
                          <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-850">
                            <strong className="text-emerald-400 text-[10.5px] uppercase font-bold block mb-0.5">✨ Résultat Attendu :</strong>
                            <p className="text-slate-300 leading-relaxed text-[11px]">{step.result}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex justify-end">
                        <button
                          onClick={() => onSelectScenario(
                            activeScenarioObj.persona,
                            activeScenarioObj.tenantId,
                            activeScenarioObj.isSuperAdmin,
                            step.module
                          )}
                          className="w-full sm:w-auto py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-600/20"
                        >
                          <span>Lancer cette étape</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* SECTION: Detailed Description & Importance of Option "Module Serveur Gmail / SMTP Dédié" */}
        <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/60 border-2 border-cyan-500/30 rounded-2xl p-5 md:p-6 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-cyan-500/10 text-cyan-300 rounded-xl border border-cyan-500/30 shadow-inner">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-extrabold text-[9.5px] uppercase rounded border border-cyan-500/40">
                    Module Optionnel de Licence
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Soumis à validation SuperAdmin</span>
                </div>
                <h3 className="font-extrabold text-base text-white tracking-wide mt-0.5">
                  Focus : Module "Serveur Gmail / SMTP Dédié d'Entreprise"
                </h3>
              </div>
            </div>

            <div className="px-3 py-1.5 bg-cyan-950/80 border border-cyan-500/30 rounded-lg text-cyan-300 text-[11px] font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Notification Instantanée des Risques Critiques</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: What this module does */}
            <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Que fait le Module Serveur SMTP Dédié ?</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ce module débloque l'interface d'administration réseau permettant à l'entreprise cliente de configurer son propre canal d'expédition de courriels électroniques (compte Google d'entreprise avec mot de passe d'application 16 lettres, Outlook ou serveur SMTP d'entreprise dédié).
              </p>
              <ul className="space-y-2 text-[11.5px] text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Alertes Automatiques de Risques Critiques :</strong> Expédition immédiate d'un message prioritaire aux responsables dès qu'un risque atteint ou dépasse le seuil de criticité (Score $\ge 15/25$).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Assignation de Plans d'Actions :</strong> Notification automatique envoyée à l'agent responsable lors de l'attribution d'une tâche de remédiation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Audits & Clôtures d'Exercices :</strong> Transmission automatique des avis de missions d'audits internes et diffusion du bilan annuel consolidé.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Journal d'Audit des E-mails :</strong> Traçabilité complète des envois avec horodatage, statut et identifiant de transaction pour les auditeurs.</span>
                </li>
              </ul>
            </div>

            {/* Box 2: Why it is essential to choose it */}
            <div className="p-4 bg-slate-950/90 rounded-xl border border-cyan-500/20 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Pourquoi est-il capital de Choisir & Activer ce Module ?</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                L'activation de ce module est une décision stratégique essentielle pour la sécurité et la gouvernance de l'organisation :
              </p>
              <div className="space-y-2.5 text-[11.5px] text-slate-300">
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <strong className="text-cyan-300 font-bold block mb-0.5">🔒 1. Confidentialité & Souveraineté Multi-Tenant Absolute</strong>
                  <p className="text-slate-300 text-[11px] leading-normal">
                    Vos identifiants de messagerie et clés 16 lettres ne sont jamais partagés sur un serveur tiers. Votre entreprise utilise exclusivement son canal hermétique.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <strong className="text-emerald-300 font-bold block mb-0.5">🏷️ 2. Identity Branding & Délivrabilité Maximale</strong>
                  <p className="text-slate-300 text-[11px] leading-normal">
                    Les e-mails arrivent au nom de votre propre domaine officiel (ex: <code>risques@votre-entreprise.com</code>), évitant d'être filtrés en indésirable (SPAM).
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <strong className="text-amber-300 font-bold block mb-0.5">⚡ 3. Temps de Réaction Instantané (Alerte Risque Majeur)</strong>
                  <p className="text-slate-300 text-[11px] leading-normal">
                    Sans SMTP, les alertes sont uniquement visibles à l'écran. Avec ce module, la Direction et le Risk Manager reçoivent un e-mail immédiat sur leur smartphone en cas de crise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

    </div>
  );
}
