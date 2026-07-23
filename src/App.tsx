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

  // 1. Chargement inconditionnel depuis Supabase
  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      const client = getSupabaseClient();
      if (client) {
        try {
          console.log('[Supabase Sync] Chargement de la base de données...');
          const res = await pullAllFromSupabase(client);
          if (res.success && res.data) {
            const d = res.data;
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
        } catch (error) {
          console.error('[Supabase Error] Échec de récupération des données:', error);
        }
      }
      setIsLoading(false);
    }

    initData();
  }, []);

  // 2. Synchronisation automatique vers Supabase lors des mises à jour (Throttled par 2s)
  useEffect(() => {
    if (isLoading) return;

    const client = getSupabaseClient();
    if (!client) return;

    const dataset = {
      tenants, users, risks, actions, auditLogs, fonctions,
      affectations, rules, accessProfiles, auditMissions,
      auditFindings, complianceFrameworks, complianceObligations,
      complianceIncidents, entreprises, licences, historiqueLicences,
    };

    const delayDebounceFn = setTimeout(() => {
      console.log('[Supabase Sync] Sauvegarde automatique...');
      pushAllToSupabase(client, dataset);
    }, 2000);

    return () => clearTimeout(delayDebounceFn);
  }, [
    tenants, users, risks, actions, auditLogs, fonctions,
    affectations, rules, accessProfiles, auditMissions,
    auditFindings, complianceFrameworks, complianceObligations,
    complianceIncidents, entreprises, licences, historiqueLicences, isLoading
  ]);

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

  // Configurations actives
  const activeTenantConfig = tenants.find(t => t.id === activeTenantId) || tenants[0];
  const activeEntreprise = entreprises.find(e => e.id === activeTenantId) || entreprises.find(e => e.id === activeTenantConfig.id);
  const activeLicence = licences.find(l => l.entrepriseId === activeTenantId) || licences.find(l => l.entrepriseId === activeTenantConfig.id);
  
  const activeTenantRisks = risks.filter(r => {
    if (activeTenantId === 'tenant1') return r.id.startsWith('R-1') || r.tenantId === 'tenant1';
    if (activeTenantId === 'tenant2') return r.id.startsWith('R-2') || r.tenantId === 'tenant2';
    return r.tenantId === activeTenantId;
  });

  const activeTenantActions = actions.filter(a => {
    if (activeTenantId === 'tenant1') return !a.tenantId || a.tenantId === 'tenant1';
    return a.tenantId === activeTenantId || activeTenantRisks.some(r => r.id === a.riskId);
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased text-xs select-none">
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