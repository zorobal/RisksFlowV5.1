/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import OdooNavbar from './components/OdooNavbar';
import DashboardModule from './components/DashboardModule';
import RiskMappingModule from './components/RiskMappingModule';
import EvaluationModule from './components/EvaluationModule';
import MatrixModule from './components/MatrixModule';
import ActionsModule from './components/ActionsModule';
import ConfigModule from './components/ConfigModule';
import AdminModule from './components/AdminModule';
import ReportingModule from './components/ReportingModule';
import AuditModule from './components/AuditModule';
import ComplianceModule from './components/ComplianceModule';
import SuperAdminModule from './components/SuperAdminModule';
import LoginModule from './components/LoginModule';
import DemoModule from './components/DemoModule';
import { generateScalesForSize } from './components/ConfigModule';
import { generateDefaultThresholds } from './utils/riskUtils';
import { getSupabaseClient, pullAllFromSupabase, pushAllToSupabase } from './lib/supabase';

import { 
  SOGESTI_CONFIG, 
  AEROTECH_CONFIG, 
  SOGESTI_RISKS, 
  AEROTECH_RISKS, 
  PRESET_USERS, 
  PRESET_ACTIONS, 
  PRESET_AUDIT_LOGS,
  PRESET_FONCTIONS,
  PRESET_AFFECTATIONS,
  PRESET_RULES,
  PRESET_ACCESS_PROFILES,
  PRESET_AUDIT_MISSIONS,
  PRESET_AUDIT_FINDINGS,
  PRESET_COMPLIANCE_FRAMEWORKS,
  PRESET_COMPLIANCE_OBLIGATIONS,
  PRESET_COMPLIANCE_INCIDENTS,
  PRESET_ENTREPRISES,
  PRESET_LICENCES,
  PRESET_HISTORIQUE_LICENCES,
  PRESET_SESSIONS
} from './initialData';

import { CheckCircle, AlertTriangle, Save, Database, X } from 'lucide-react';

import { 
  TenantConfig, 
  User, 
  Risk, 
  ActionPlan, 
  AuditLog,
  Fonction,
  Affectation,
  Rule,
  AccessProfile,
  AuditMission,
  AuditFinding,
  ComplianceFramework,
  ComplianceObligation,
  ComplianceIncident,
  EntrepriseCliente,
  Licence,
  HistoriqueLicence,
  SessionExercice
} from './types';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // States initialisés à vide (remplis par Supabase au montage)
  const [tenants, setTenants] = useState<TenantConfig[]>([SOGESTI_CONFIG, AEROTECH_CONFIG]);
  const [activeTenantId, setActiveTenantId] = useState<string>('tenant1');
  const [risks, setRisks] = useState<Risk[]>([]);
  const [actions, setActions] = useState<ActionPlan[]>([]);
  const [users, setUsers] = useState<User[]>(PRESET_USERS);
  const [currentUser, setCurrentUser] = useState<User>(PRESET_USERS[0]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [fonctions, setFonctions] = useState<Fonction[]>([]);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [accessProfiles, setAccessProfiles] = useState<AccessProfile[]>([]);
  const [auditMissions, setAuditMissions] = useState<AuditMission[]>([]);
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([]);
  const [complianceFrameworks, setComplianceFrameworks] = useState<ComplianceFramework[]>([]);
  const [complianceObligations, setComplianceObligations] = useState<ComplianceObligation[]>([]);
  const [complianceIncidents, setComplianceIncidents] = useState<ComplianceIncident[]>([]);
  const [entreprises, setEntreprises] = useState<EntrepriseCliente[]>([]);
  const [licences, setLicences] = useState<Licence[]>([]);
  const [historiqueLicences, setHistoriqueLicences] = useState<HistoriqueLicence[]>([]);
  const [sessions, setSessions] = useState<SessionExercice[]>([]);

  const [isSuperAdminMode, setIsSuperAdminMode] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showDemo, setShowDemo] = useState<boolean>(false);

  const [activeModule, setActiveModule] = useState<'dashboard' | 'risks' | 'evaluation' | 'heatmap' | 'actions' | 'config' | 'admin' | 'reporting' | 'audit' | 'compliance'>('dashboard');
  const [adminTab, setAdminTab] = useState<'users' | 'tenants' | 'audit'>('users');

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const LOCAL_STORAGE_KEY = 'riskflow_grc_dataset_v3';

  // 1. Initialisation avec Restauration LocalStorage Immédiate + Chargement Supabase
  useEffect(() => {
    async function initData() {
      setIsLoading(true);

      // A. Restauration instantanée depuis LocalStorage si disponible
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const d = JSON.parse(cached);
          if (d.tenants?.length) setTenants(d.tenants);
          if (d.users?.length) setUsers(d.users);
          if (d.risks?.length) setRisks(d.risks);
          if (d.actions?.length) setActions(d.actions);
          if (d.auditLogs?.length) setAuditLogs(d.auditLogs);
          if (d.fonctions?.length) setFonctions(d.fonctions);
          if (d.affectations?.length) setAffectations(d.affectations);
          if (d.rules?.length) setRules(d.rules);
          if (d.accessProfiles?.length) setAccessProfiles(d.accessProfiles);
          if (d.auditMissions?.length) setAuditMissions(d.auditMissions);
          if (d.auditFindings?.length) setAuditFindings(d.auditFindings);
          if (d.complianceFrameworks?.length) setComplianceFrameworks(d.complianceFrameworks);
          if (d.complianceObligations?.length) setComplianceObligations(d.complianceObligations);
          if (d.complianceIncidents?.length) setComplianceIncidents(d.complianceIncidents);
          if (d.entreprises?.length) setEntreprises(d.entreprises);
          if (d.licences?.length) setLicences(d.licences);
          if (d.historiqueLicences?.length) setHistoriqueLicences(d.historiqueLicences);
        }
      } catch (e) {
        console.error('[LocalStorage Init Error]', e);
      }

      // B. Chargement depuis Supabase en arrière-plan
      const client = getSupabaseClient();
      if (client) {
        try {
          console.log('[Supabase Sync] Synchronisation depuis la BDD Supabase...');
          const res = await pullAllFromSupabase(client);
          if (res.success && res.data) {
            const d = res.data;
            if (d.tenants?.length) setTenants(d.tenants);
            if (d.users?.length) {
              // Ensure superadmin and preset accounts are available alongside database users
              const mergedUsers = [...d.users];
              PRESET_USERS.forEach(pu => {
                if (!mergedUsers.some(u => u.email.toLowerCase() === pu.email.toLowerCase())) {
                  mergedUsers.push(pu);
                }
              });
              setUsers(mergedUsers);
            }
            if (d.risks?.length) setRisks(d.risks);
            if (d.actions?.length) setActions(d.actions);
            if (d.auditLogs?.length) setAuditLogs(d.auditLogs);
            if (d.fonctions?.length) setFonctions(d.fonctions);
            if (d.affectations?.length) setAffectations(d.affectations);
            if (d.rules?.length) setRules(d.rules);
            if (d.accessProfiles?.length) setAccessProfiles(d.accessProfiles);
            if (d.auditMissions?.length) setAuditMissions(d.auditMissions);
            if (d.auditFindings?.length) setAuditFindings(d.auditFindings);
            if (d.complianceFrameworks?.length) setComplianceFrameworks(d.complianceFrameworks);
            if (d.complianceObligations?.length) setComplianceObligations(d.complianceObligations);
            if (d.complianceIncidents?.length) setComplianceIncidents(d.complianceIncidents);
            if (d.entreprises?.length) setEntreprises(d.entreprises);
            if (d.licences?.length) setLicences(d.licences);
            if (d.historiqueLicences?.length) setHistoriqueLicences(d.historiqueLicences);

            // Cache fresh central database state in LocalStorage for fast offline display
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(d));
            } catch (e) {
              console.error('[LocalStorage Sync Cache Error]', e);
            }
          }
        } catch (error) {
          console.error('[Supabase Error] Échec de récupération BDD:', error);
        }
      }
      setIsLoading(false);
    }

    initData();
  }, []);

  // 2. Persistance locale instantanée + Synchronisation automatique vers Supabase (Throttled par 2.5s)
  useEffect(() => {
    if (isLoading) return;

    const dataset = {
      tenants, users, risks, actions, auditLogs, fonctions,
      affectations, rules, accessProfiles, auditMissions,
      auditFindings, complianceFrameworks, complianceObligations,
      complianceIncidents, entreprises, licences, historiqueLicences,
    };

    // A. Écriture immédiate en LocalStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataset));
    } catch (err) {
      console.error('[LocalStorage Save Error]', err);
    }

    // B. Push vers Supabase après délai
    const client = getSupabaseClient();
    if (!client) return;

    const delayDebounceFn = setTimeout(() => {
      console.log('[Supabase Sync] Sauvegarde automatique BDD...');
      pushAllToSupabase(client, dataset);
    }, 2500);

    return () => clearTimeout(delayDebounceFn);
  }, [
    tenants, users, risks, actions, auditLogs, fonctions,
    affectations, rules, accessProfiles, auditMissions,
    auditFindings, complianceFrameworks, complianceObligations,
    complianceIncidents, entreprises, licences, historiqueLicences, isLoading
  ]);

  // 3. Action de Sauvegarde Manuelle Déclenchée depuis la Barre Supérieure
  const handleForceSaveData = async () => {
    setSaveStatus('saving');
    const dataset = {
      tenants, users, risks, actions, auditLogs, fonctions,
      affectations, rules, accessProfiles, auditMissions,
      auditFindings, complianceFrameworks, complianceObligations,
      complianceIncidents, entreprises, licences, historiqueLicences,
    };

    // Sauvegarde locale instantanée
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataset));
    } catch (err) {
      console.error('[LocalStorage Force Save Error]', err);
    }

    // Synchronisation explicite Supabase
    const client = getSupabaseClient();
    if (client) {
      try {
        const res = await pushAllToSupabase(client, dataset);
        if (res.success) {
          setSaveStatus('saved');
          setToastMessage('✅ Toutes vos modifications (Catégories, Seuils, Matrice, Risques, Utilisateurs) sont enregistrées en Base de Données !');
        } else {
          setSaveStatus('saved');
          setToastMessage('✅ Données sauvegardées avec succès !');
        }
      } catch (err) {
        setSaveStatus('saved');
        setToastMessage('✅ Données conservées en sécurité dans le navigateur !');
      }
    } else {
      setSaveStatus('saved');
      setToastMessage('✅ Données et configurations enregistrées dans le navigateur avec succès !');
    }

    setTimeout(() => setSaveStatus('idle'), 3000);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Synchronisation des licences & succursales
  useEffect(() => {
    setLicences(prevLicences => {
      let changed = false;
      const updated = prevLicences.map(lic => {
        const usersCount = users.filter(u => u.tenantId === lic.entrepriseId).length;
        const tenant = tenants.find(t => t.id === lic.entrepriseId);
        const succursalesCount = tenant 
          ? tenant.entities.filter(e => e.est_succursale === true && e.statut !== 'Archivé').length
          : 0;

        if (
          lic.nombreUtilisateursActuel !== usersCount || 
          lic.nombre_succursales_actuel !== succursalesCount
        ) {
          changed = true;
          return {
            ...lic,
            nombreUtilisateursActuel: usersCount,
            nombre_succursales_actuel: succursalesCount,
            nombre_succursales_max: lic.nombre_succursales_max ?? 5,
            depassementQuotaMode: lic.depassementQuotaMode ?? 'blocage',
            succursalesActives: lic.succursalesActives ?? true
          };
        }
        return lic;
      });
      return changed ? updated : prevLicences;
    });
  }, [users, tenants]);

  // Configurations actives avec recherche et fallback dynamique
  const activeTenantConfig = React.useMemo(() => {
    const found = tenants.find(t => t.id === activeTenantId);
    if (found) return found;

    // Check if an entreprise entry exists with this activeTenantId
    const ent = entreprises.find(e => e.id === activeTenantId);
    if (ent) {
      const fallbackConfig: TenantConfig = {
        id: ent.id,
        companyName: ent.nomComplet || ent.raisonSociale || 'Entreprise Cliente',
        logoUrl: ent.logoUrl || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&fit=crop&q=80',
        matrixSize: 3,
        scales: generateScalesForSize(3),
        formula: {
          id: 'f1',
          name: 'Formule IFACI Standard',
          expression: 'P * I * M',
          variables: [
            { name: 'P', label: 'Probabilité/Fréquence', min: 1, max: 3 },
            { name: 'I', label: 'Impact', min: 1, max: 3 },
            { name: 'M', label: 'Maîtrise/Contrôle', min: 1, max: 3 }
          ],
          description: 'Calcul par produit de la fréquence et de l\'impact.'
        },
        matrixThresholds: generateDefaultThresholds(3, 4),
        workflowSteps: [
          { id: 'w_brouillon', name: '📊 Brouillon', color: 'bg-gray-100 text-gray-800', order: 1 },
          { id: 'w_evaluation', name: '🔍 Évaluation en cours', color: 'bg-blue-100 text-blue-800', order: 2 },
          { id: 'w_validation', name: '⏳ Validation Responsable', color: 'bg-amber-100 text-amber-800', order: 3 },
          { id: 'w_approuve', name: '✅ Approuvé GRC', color: 'bg-green-100 text-green-800', order: 4 },
        ],
        categories: [
          { id: 'cat_finance', name: 'Risques Financiers', color: '#3b82f6', description: 'Pertes de chiffre d\'affaires, fraudes.' },
          { id: 'cat_operational', name: 'Risques Opérationnels', color: '#10b981', description: 'Pannes matérielles, logistique.' },
          { id: 'cat_it', name: 'Risques SI & Cybersécurité', color: '#8b5cf6', description: 'Piratages, fuites de données.' },
        ],
        entities: [
          { id: `e_${ent.id}_DG`, name: `Direction Générale (${ent.raisonSociale || ent.nomComplet})`, type: 'Direction' }
        ]
      };
      return fallbackConfig;
    }

    return tenants[0] || SOGESTI_CONFIG;
  }, [tenants, entreprises, activeTenantId]);
  const activeEntreprise = entreprises.find(e => e.id === activeTenantId) || entreprises.find(e => e.id === activeTenantConfig.id);
  const activeLicence = licences.find(l => l.entrepriseId === activeTenantId) || licences.find(l => l.entrepriseId === activeTenantConfig.id);
  
  const activeTenantRisks = risks.filter(r => {
    if (activeTenantId === 'tenant1') return r.id.startsWith('R-1') || r.tenantId === 'tenant1' || !r.tenantId;
    if (activeTenantId === 'tenant2') return r.id.startsWith('R-2') || r.tenantId === 'tenant2' || !r.tenantId;
    return !r.tenantId || r.tenantId === activeTenantId || r.tenantId === activeEntreprise?.id;
  });

  const activeTenantActions = actions.filter(a => {
    if (activeTenantId === 'tenant1') return !a.tenantId || a.tenantId === 'tenant1';
    return !a.tenantId || a.tenantId === activeTenantId || a.tenantId === activeEntreprise?.id || activeTenantRisks.some(r => r.id === a.riskId);
  });

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      details,
      tenantId: activeTenantId
    };
    setAuditLogs(prev => [...prev, newLog]);
  };

  const handleAddRisk = (rawRisk: Omit<Risk, 'id' | 'scoreBrut' | 'scoreResiduel' | 'createdAt' | 'history'>) => {
    const prefix = activeTenantId === 'tenant1' ? 'R-1' : (activeTenantId === 'tenant2' ? 'R-2' : 'R-3');
    const existingIds = risks.filter(r => r.id.startsWith(prefix)).map(r => Number(r.id.split('-')[1]));
    const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 101;
    const newId = `${prefix}${nextNum}`;

    const scoreBrut = rawRisk.frequencyValue * rawRisk.impactValue;
    let scoreResiduel = scoreBrut * rawRisk.controlValue;

    if (activeTenantConfig.formula?.expression === '(P * I) - M') {
      scoreResiduel = Math.max(0, scoreBrut - rawRisk.controlValue);
    }

    const newRisk: Risk = {
      ...rawRisk,
      id: newId,
      scoreBrut,
      scoreResiduel,
      createdAt: new Date().toISOString().split('T')[0],
      tenantId: activeTenantId,
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          user: currentUser.name,
          action: 'Initiation',
          comment: `Fiche de risque initiée en tant que ${currentUser.role}.`
        }
      ]
    };

    setRisks(prev => [...prev, newRisk]);
    addAuditLog('Création Risque', `Nouveau risque enregistré : [Code ID: ${newId}] ${rawRisk.title}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100 text-slate-700">
        <div className="text-center">
          <div className="mb-2 text-base font-semibold">Chargement des données GRC...</div>
          <div className="text-xs text-slate-500">Connexion à Supabase en cours</div>
        </div>
      </div>
    );
  }

  if (showDemo) {
    return (
      <DemoModule
        users={users}
        tenants={tenants}
        onBackToLogin={() => setShowDemo(false)}
        onSelectScenario={(user, tenantId, isSuperAdmin, initialModule) => {
          setCurrentUser(user);
          setActiveTenantId(tenantId);
          setIsSuperAdminMode(isSuperAdmin);
          setActiveModule(initialModule);
          setIsLoggedIn(true);
          setShowDemo(false);
          addAuditLog('Lancement Démo', `Lancement du scénario de démonstration pour : ${user.name}`);
        }}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginModule
        users={users}
        onEnterDemo={() => setShowDemo(true)}
        onLogin={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
          if (user.role === 'SuperAdmin') {
            setIsSuperAdminMode(true);
          } else {
            setIsSuperAdminMode(false);
            setActiveTenantId(user.tenantId || 'tenant1');
            setActiveModule('dashboard');
          }
          addAuditLog('Connexion', `Authentification réussie pour ${user.name}`);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased text-xs select-none relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-500/60 flex items-center gap-3 backdrop-blur-md animate-fade-in transition-all">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-extrabold tracking-wide">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)} 
            className="ml-3 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <OdooNavbar 
        tenants={tenants}
        activeTenantId={activeTenantId}
        setActiveTenantId={setActiveTenantId}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        users={users}
        onUpdateUsers={setUsers}
        onConfigureCompany={() => {
          setAdminTab('tenants');
          setActiveModule('admin');
        }}
        activeModule={activeModule}
        setActiveModule={setActiveModule as any}
        onAddLog={addAuditLog}
        isSuperAdminMode={isSuperAdminMode}
        onToggleSuperAdminMode={setIsSuperAdminMode}
        onLogout={() => {
          setIsLoggedIn(false);
          setIsSuperAdminMode(false);
        }}
        onSaveData={handleForceSaveData}
        saveStatus={saveStatus}
      />

      <main className="flex-1 overflow-hidden flex flex-col bg-slate-50">
        {isSuperAdminMode ? (
          <SuperAdminModule
            entreprises={entreprises}
            onUpdateEntreprises={setEntreprises}
            licences={licences}
            onUpdateLicences={setLicences}
            historiqueLicences={historiqueLicences}
            onUpdateHistoriqueLicences={setHistoriqueLicences}
            tenants={tenants}
            onUpdateTenants={setTenants}
            risks={risks}
            onUpdateRisks={setRisks}
            actions={actions}
            onUpdateActions={setActions}
            auditLogs={auditLogs}
            onUpdateAuditLogs={setAuditLogs}
            fonctions={fonctions}
            onUpdateFonctions={setFonctions}
            users={users}
            onUpdateUsers={setUsers}
            affectations={affectations}
            onUpdateAffectations={setAffectations}
            rules={rules}
            onUpdateRules={setRules}
            accessProfiles={accessProfiles}
            onUpdateAccessProfiles={setAccessProfiles}
            auditMissions={auditMissions}
            onUpdateAuditMissions={setAuditMissions}
            auditFindings={auditFindings}
            onUpdateAuditFindings={setAuditFindings}
            complianceFrameworks={complianceFrameworks}
            onUpdateComplianceFrameworks={setComplianceFrameworks}
            complianceObligations={complianceObligations}
            onUpdateComplianceObligations={setComplianceObligations}
            complianceIncidents={complianceIncidents}
            onUpdateComplianceIncidents={setComplianceIncidents}
            onAddLog={addAuditLog}
            onRestoreTenantData={() => {}}
          />
        ) : (
          <>
            {activeModule === 'dashboard' && (
              <DashboardModule 
                risks={activeTenantRisks}
                tenantConfig={activeTenantConfig}
                actions={activeTenantActions}
              />
            )}

            {activeModule === 'risks' && (
              <RiskMappingModule 
                risks={activeTenantRisks}
                tenantConfig={activeTenantConfig}
                actions={activeTenantActions}
                users={users}
                currentUser={currentUser}
                isSuperAdminMode={isSuperAdminMode}
                onAddRisk={handleAddRisk}
                onUpdateRisk={(updated) => setRisks(prev => prev.map(r => r.id === updated.id ? updated : r))}
                onDeleteRisk={(id) => setRisks(prev => prev.filter(r => r.id !== id))}
                onAddActionPlan={(plan) => setActions(prev => [...prev, { ...plan, id: `a${actions.length + 1}`, progress: 0 }])}
                onAddLog={addAuditLog}
              />
            )}

            {activeModule === 'evaluation' && (
              <EvaluationModule 
                risks={activeTenantRisks}
                tenantConfig={activeTenantConfig}
              />
            )}

            {activeModule === 'heatmap' && (
              <MatrixModule 
                risks={activeTenantRisks}
                tenantConfig={activeTenantConfig}
                onAddLog={addAuditLog}
              />
            )}

            {activeModule === 'actions' && (
              <ActionsModule 
                actions={activeTenantActions}
                risks={activeTenantRisks}
                tenantConfig={activeTenantConfig}
                users={users}
                onAddActionPlan={(plan) => setActions(prev => [...prev, { ...plan, id: `a${actions.length + 1}`, progress: 0 }])}
                onUpdateActionPlan={(updated) => setActions(prev => prev.map(a => a.id === updated.id ? updated : a))}
                onAddLog={addAuditLog}
              />
            )}

            {activeModule === 'config' && (
              <ConfigModule 
                tenantConfig={activeTenantConfig}
                onUpdateTenantConfig={(updated) => setTenants(prev => prev.map(t => t.id === updated.id ? updated : t))}
                fonctions={fonctions}
                onUpdateFonctions={setFonctions}
                affectations={affectations}
                onUpdateAffectations={setAffectations}
                rules={rules}
                onUpdateRules={setRules}
                accessProfiles={accessProfiles}
                onUpdateAccessProfiles={setAccessProfiles}
                users={users}
                onAddLog={addAuditLog}
                maxSuccursales={activeLicence?.nombre_succursales_max ?? 5}
                maxDirections={5}
                maxDepartements={10}
                maxServices={15}
                maxSitesLocaux={5}
                maxFiliales={5}
                depassementQuotaMode={activeLicence?.depassementQuotaMode ?? 'blocage'}
                succursalesActives={activeLicence?.succursalesActives ?? true}
              />
            )}

            {activeModule === 'audit' && (
              <AuditModule 
                missions={auditMissions}
                findings={auditFindings}
                fonctions={fonctions}
                users={users}
                currentUser={currentUser}
                onAddMission={(newM) => setAuditMissions(prev => [...prev, { ...newM, id: `m_${Date.now()}` }])}
                onAddFinding={(newF) => setAuditFindings(prev => [...prev, { ...newF, id: `f_${Date.now()}` }])}
                onUpdateFindingStatus={(id, status) => setAuditFindings(prev => prev.map(f => f.id === id ? { ...f, statut: status } : f))}
                onAddLog={addAuditLog}
              />
            )}

            {activeModule === 'compliance' && (
              <ComplianceModule 
                frameworks={complianceFrameworks}
                obligations={complianceObligations}
                incidents={complianceIncidents}
                fonctions={fonctions}
                onAddFramework={(fw) => setComplianceFrameworks(prev => [...prev, { ...fw, id: `cf_${Date.now()}` }])}
                onAddObligation={(ob) => setComplianceObligations(prev => [...prev, { ...ob, id: `co_${Date.now()}` }])}
                onUpdateObligationStatus={(id, status) => setComplianceObligations(prev => prev.map(o => o.id === id ? { ...o, statut: status } : o))}
                onAddIncident={(inc) => setComplianceIncidents(prev => [...prev, { ...inc, id: `inc_${Date.now()}` }])}
                onUpdateIncidentStatus={(id, status) => setComplianceIncidents(prev => prev.map(i => i.id === id ? { ...i, statutDeclaration: status } : i))}
                onAddLog={addAuditLog}
              />
            )}

            {activeModule === 'admin' && (
              <AdminModule 
                users={users}
                onAddUser={(u) => setUsers(prev => [...prev, { ...u, id: `u_${Date.now()}` }])}
                onDeleteUser={(id) => setUsers(prev => prev.filter(u => u.id !== id))}
                onUpdateUser={(u) => setUsers(prev => prev.map(item => item.id === u.id ? u : item))}
                tenants={tenants}
                onAddTenant={(name) => setTenants(prev => [...prev, { ...SOGESTI_CONFIG, id: `tenant_${Date.now()}`, companyName: name }])}
                auditLogs={auditLogs}
                activeTenantId={activeTenantId}
                initialTab={adminTab as any}
                sessions={sessions}
                onAddSession={(s) => setSessions(prev => [...prev, s])}
                onUpdateSession={(s) => setSessions(prev => prev.map(item => item.id === s.id ? s : item))}
                licence={activeLicence}
                onUpdateLicence={(l) => setLicences(prev => prev.map(item => item.id === l.id ? l : item))}
                tenantConfig={activeTenantConfig}
                onUpdateTenantConfig={(updated) => setTenants(prev => prev.map(t => t.id === updated.id ? updated : t))}
                onAddLog={addAuditLog}
                activeEntreprise={activeEntreprise}
                onUpdateEntreprise={(e) => setEntreprises(prev => prev.map(item => item.id === e.id ? e : item))}
              />
            )}

            {activeModule === 'reporting' && (
              <ReportingModule 
                risks={activeTenantRisks}
                tenantConfig={activeTenantConfig}
                actions={activeTenantActions}
                onAddLog={addAuditLog}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}