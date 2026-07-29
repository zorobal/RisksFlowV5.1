/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  MINFI_CONFIG,
  SOGESTI_RISKS, 
  AEROTECH_RISKS, 
  MINFI_RISKS,
  ALL_PRESET_RISKS,
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

  // Helper function to merge database risks with local storage risks (DB taking precedence)
  const mergeRisksWithLocal = (dbRisks: Risk[], localRisks: Risk[]): Risk[] => {
    if (!localRisks || localRisks.length === 0) return dbRisks;
    if (!dbRisks || dbRisks.length === 0) return localRisks;

    const dbMap = new Map<string, Risk>(dbRisks.map(r => [r.id, r]));
    const localMap = new Map<string, Risk>(localRisks.map(r => [r.id, r]));
    const mergedMap = new Map<string, Risk>();

    const allIds = new Set([...localMap.keys(), ...dbMap.keys()]);

    for (const id of allIds) {
      const localR = localMap.get(id);
      const dbR = dbMap.get(id);

      if (localR && !dbR) {
        mergedMap.set(id, localR);
      } else if (dbR && !localR) {
        mergedMap.set(id, dbR);
      } else if (localR && dbR) {
        // DB (Supabase) takes precedence for online persistence!
        mergedMap.set(id, {
          ...localR,
          ...dbR,
          title: dbR.title !== undefined && dbR.title !== null && dbR.title.trim() !== '' ? dbR.title : localR.title,
          description: dbR.description !== undefined && dbR.description !== null ? dbR.description : (localR.description || ''),
          causes: dbR.causes !== undefined && dbR.causes !== null ? dbR.causes : (localR.causes || ''),
          consequences: dbR.consequences !== undefined && dbR.consequences !== null ? dbR.consequences : (localR.consequences || ''),
          categoryId: dbR.categoryId || localR.categoryId,
          entityId: dbR.entityId || localR.entityId,
          frequencyValue: dbR.frequencyValue ?? localR.frequencyValue,
          impactValue: dbR.impactValue ?? localR.impactValue,
          controlValue: dbR.controlValue ?? localR.controlValue,
          scoreBrut: dbR.scoreBrut ?? localR.scoreBrut,
          scoreResiduel: dbR.scoreResiduel ?? localR.scoreResiduel,
          statusId: dbR.statusId || localR.statusId,
          history: (dbR.history?.length || 0) >= (localR.history?.length || 0) ? dbR.history : localR.history,
        });
      }
    }

    return Array.from(mergedMap.values());
  };

  const mergeActionsWithLocal = (dbActions: ActionPlan[], localActions: ActionPlan[]): ActionPlan[] => {
    if (!localActions || localActions.length === 0) return dbActions;
    if (!dbActions || dbActions.length === 0) return localActions;

    const dbMap = new Map<string, ActionPlan>(dbActions.map(a => [a.id, a]));
    const localMap = new Map<string, ActionPlan>(localActions.map(a => [a.id, a]));
    const merged: ActionPlan[] = [];

    const allIds = new Set([...localMap.keys(), ...dbMap.keys()]);
    for (const id of allIds) {
      const localA = localMap.get(id);
      const dbA = dbMap.get(id);
      if (localA && !dbA) merged.push(localA);
      else if (dbA && !localA) merged.push(dbA);
      else if (localA && dbA) {
        merged.push({ ...localA, ...dbA });
      }
    }
    return merged;
  };

  const mergeTenantsWithLocal = (dbTenants: TenantConfig[], localTenants: TenantConfig[]): TenantConfig[] => {
    if (!localTenants || localTenants.length === 0) return dbTenants || [SOGESTI_CONFIG, AEROTECH_CONFIG];
    if (!dbTenants || dbTenants.length === 0) return localTenants;

    const dbMap = new Map<string, TenantConfig>(dbTenants.map(t => [t.id, t]));
    const localMap = new Map<string, TenantConfig>(localTenants.map(t => [t.id, t]));
    const merged: TenantConfig[] = [];

    const allIds = new Set([...localMap.keys(), ...dbMap.keys()]);
    for (const id of allIds) {
      const localT = localMap.get(id);
      const dbT = dbMap.get(id);

      if (localT && !dbT) {
        merged.push(localT);
      } else if (dbT && !localT) {
        merged.push(dbT);
      } else if (localT && dbT) {
        // DB is the single source of truth for organization parameters when present in Supabase
        merged.push({
          ...localT,
          ...dbT,
          companyName: dbT.companyName || localT.companyName,
          logoUrl: dbT.logoUrl || localT.logoUrl,
          scales: (dbT.scales?.frequency?.length ? dbT.scales : localT.scales) || localT.scales,
          matrixSize: dbT.matrixSize || localT.matrixSize || 4,
          matrixThresholds: (dbT.matrixThresholds?.length ? dbT.matrixThresholds : localT.matrixThresholds) || localT.matrixThresholds,
          formula: (dbT.formula?.expression ? dbT.formula : localT.formula) || localT.formula,
          categories: (dbT.categories?.length ? dbT.categories : localT.categories) || localT.categories,
          entities: (dbT.entities?.length ? dbT.entities : localT.entities) || localT.entities,
          workflowSteps: (dbT.workflowSteps?.length ? dbT.workflowSteps : localT.workflowSteps) || localT.workflowSteps,
        });
      }
    }

    return merged;
  };

  const mergeArraysWithLocal = <T extends { id: string | number; tenantId?: string }>(
    dbArray: T[] | undefined,
    localArray: T[] | undefined
  ): T[] => {
    if (!localArray || localArray.length === 0) return dbArray || [];
    if (!dbArray || dbArray.length === 0) return localArray;

    const dbMap = new Map<string, T>(dbArray.map(item => [String(item.id), item]));
    const localMap = new Map<string, T>(localArray.map(item => [String(item.id), item]));
    const merged: T[] = [];

    const allIds = new Set([...localMap.keys(), ...dbMap.keys()]);
    for (const id of allIds) {
      const localItem = localMap.get(id);
      const dbItem = dbMap.get(id);

      if (localItem && !dbItem) {
        merged.push(localItem);
      } else if (dbItem && !localItem) {
        merged.push(dbItem);
      } else if (localItem && dbItem) {
        merged.push({
          ...localItem,
          ...dbItem,
          tenantId: dbItem.tenantId || localItem.tenantId
        });
      }
    }

    return merged;
  };

  const mergeSessionsWithLocal = (dbSessions: SessionExercice[], localSessions: SessionExercice[]): SessionExercice[] => {
    if (!localSessions || localSessions.length === 0) return dbSessions;
    if (!dbSessions || dbSessions.length === 0) return localSessions;

    const dbMap = new Map<string, SessionExercice>(dbSessions.map(s => [s.id, s]));
    const localMap = new Map<string, SessionExercice>(localSessions.map(s => [s.id, s]));
    const merged: SessionExercice[] = [];

    const allIds = new Set([...localMap.keys(), ...dbMap.keys()]);
    for (const id of allIds) {
      const localS = localMap.get(id);
      const dbS = dbMap.get(id);
      if (localS && !dbS) merged.push(localS);
      else if (dbS && !localS) merged.push(dbS);
      else if (localS && dbS) {
        merged.push({ ...localS, ...dbS });
      }
    }
    return merged;
  };

  // 1. Initialisation avec Restauration LocalStorage Immédiate + Chargement Supabase
  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      let localDataset: any = null;

      // A. Restauration instantanée depuis LocalStorage si disponible
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          localDataset = JSON.parse(cached);
          if (localDataset.tenants?.length) setTenants(localDataset.tenants);
          if (localDataset.users?.length) setUsers(localDataset.users);
          if (localDataset.risks?.length) setRisks(localDataset.risks);
          if (localDataset.actions?.length) setActions(localDataset.actions);
          if (localDataset.auditLogs?.length) setAuditLogs(localDataset.auditLogs);
          if (localDataset.fonctions?.length) setFonctions(localDataset.fonctions);
          if (localDataset.affectations?.length) setAffectations(localDataset.affectations);
          if (localDataset.rules?.length) setRules(localDataset.rules);
          if (localDataset.accessProfiles?.length) setAccessProfiles(localDataset.accessProfiles);
          if (localDataset.auditMissions?.length) setAuditMissions(localDataset.auditMissions);
          if (localDataset.auditFindings?.length) setAuditFindings(localDataset.auditFindings);
          if (localDataset.complianceFrameworks?.length) setComplianceFrameworks(localDataset.complianceFrameworks);
          if (localDataset.complianceObligations?.length) setComplianceObligations(localDataset.complianceObligations);
          if (localDataset.complianceIncidents?.length) setComplianceIncidents(localDataset.complianceIncidents);
          if (localDataset.entreprises?.length) setEntreprises(localDataset.entreprises);
          if (localDataset.licences?.length) setLicences(localDataset.licences);
          if (localDataset.historiqueLicences?.length) setHistoriqueLicences(localDataset.historiqueLicences);
          if (localDataset.sessions?.length) setSessions(localDataset.sessions);
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
            const finalTenants = mergeTenantsWithLocal(d.tenants || [], localDataset?.tenants || []);
            const tenantsToSet = finalTenants.length > 0 ? finalTenants : [SOGESTI_CONFIG, AEROTECH_CONFIG, MINFI_CONFIG];
            if (!tenantsToSet.some(t => t.id === MINFI_CONFIG.id)) {
              tenantsToSet.push(MINFI_CONFIG);
            }
            setTenants(tenantsToSet);

            if (d.users?.length || localDataset?.users?.length) {
              const mergedUsers = mergeArraysWithLocal<User>(d.users || [], localDataset?.users || []);
              PRESET_USERS.forEach(pu => {
                if (!mergedUsers.some(u => u.email.toLowerCase() === pu.email.toLowerCase())) {
                  mergedUsers.push(pu);
                }
              });
              setUsers(mergedUsers);
            }

            const mergedRisks = mergeRisksWithLocal(d.risks || [], localDataset?.risks || []);
            const finalRisks = mergedRisks.length > 0 ? mergedRisks : [...ALL_PRESET_RISKS];
            // Ensure MINFI risks are present
            MINFI_RISKS.forEach(mr => {
              if (!finalRisks.some(r => r.id === mr.id)) {
                finalRisks.push(mr);
              }
            });
            setRisks(finalRisks);

            const finalActions = mergeActionsWithLocal(d.actions || [], localDataset?.actions || []);
            setActions(finalActions);

            const finalSessions = mergeSessionsWithLocal(d.sessions || [], localDataset?.sessions || []);
            const sessionsToSet = finalSessions.length > 0 ? finalSessions : PRESET_SESSIONS;
            setSessions(sessionsToSet);

            const finalMissions = mergeArraysWithLocal(d.auditMissions || [], localDataset?.auditMissions || []);
            setAuditMissions(finalMissions);

            const finalFindings = mergeArraysWithLocal(d.auditFindings || [], localDataset?.auditFindings || []);
            setAuditFindings(finalFindings);

            const finalFrameworks = mergeArraysWithLocal(d.complianceFrameworks || [], localDataset?.complianceFrameworks || []);
            setComplianceFrameworks(finalFrameworks);

            const finalObligations = mergeArraysWithLocal(d.complianceObligations || [], localDataset?.complianceObligations || []);
            setComplianceObligations(finalObligations);

            const finalIncidents = mergeArraysWithLocal(d.complianceIncidents || [], localDataset?.complianceIncidents || []);
            setComplianceIncidents(finalIncidents);

            const mergedEntreprises = mergeArraysWithLocal<EntrepriseCliente>(d.entreprises || [], localDataset?.entreprises || []);
            const finalEntreprises = mergedEntreprises.length > 0 ? mergedEntreprises : [...PRESET_ENTREPRISES];
            PRESET_ENTREPRISES.forEach(pe => {
              if (!finalEntreprises.some(e => e.id === pe.id || e.raisonSociale === pe.raisonSociale)) {
                finalEntreprises.push(pe);
              }
            });
            setEntreprises(finalEntreprises);

            const mergedLicences = mergeArraysWithLocal<Licence>(d.licences || [], localDataset?.licences || []);
            const finalLicences = mergedLicences.length > 0 ? mergedLicences : [...PRESET_LICENCES];
            PRESET_LICENCES.forEach(pl => {
              if (!finalLicences.some(l => l.id === pl.id || l.entrepriseId === pl.entrepriseId)) {
                finalLicences.push(pl);
              }
            });
            setLicences(finalLicences);

            const finalHistLicences = mergeArraysWithLocal(d.historiqueLicences || [], localDataset?.historiqueLicences || []);
            setHistoriqueLicences(finalHistLicences);

            if (d.auditLogs?.length) setAuditLogs(mergeArraysWithLocal(d.auditLogs, localDataset?.auditLogs || []));
            if (d.fonctions?.length) setFonctions(mergeArraysWithLocal(d.fonctions, localDataset?.fonctions || []));
            if (d.affectations?.length) setAffectations(mergeArraysWithLocal(d.affectations, localDataset?.affectations || []));
            if (d.rules?.length) setRules(mergeArraysWithLocal(d.rules, localDataset?.rules || []));
            if (d.accessProfiles?.length) setAccessProfiles(d.accessProfiles);

            const mergedDataset = {
              ...d,
              tenants: tenantsToSet,
              risks: finalRisks,
              actions: finalActions,
              sessions: sessionsToSet,
              auditMissions: finalMissions,
              auditFindings: finalFindings,
              complianceFrameworks: finalFrameworks,
              complianceObligations: finalObligations,
              complianceIncidents: finalIncidents,
              entreprises: finalEntreprises,
              licences: finalLicences,
              historiqueLicences: finalHistLicences
            };

            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedDataset));
            } catch (e) {
              console.error('[LocalStorage Sync Cache Error]', e);
            }

            // Sync updated dataset back to Supabase
            pushAllToSupabase(client, mergedDataset);
          }
        } catch (error) {
          console.error('[Supabase Error] Échec de récupération BDD:', error);
        }
      }
      setIsLoading(false);
    }

    initData();
  }, []);

  // 2. Persistance locale instantanée + Synchronisation automatique vers Supabase (Throttled par 1s)
  useEffect(() => {
    if (isLoading) return;

    const dataset = {
      tenants, users, risks, actions, auditLogs, fonctions,
      affectations, rules, accessProfiles, auditMissions,
      auditFindings, complianceFrameworks, complianceObligations,
      complianceIncidents, entreprises, licences, historiqueLicences,
      sessions
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
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [
    tenants, users, risks, actions, auditLogs, fonctions,
    affectations, rules, accessProfiles, auditMissions,
    auditFindings, complianceFrameworks, complianceObligations,
    complianceIncidents, entreprises, licences, historiqueLicences, sessions, isLoading
  ]);

  // 3. Action de Sauvegarde Manuelle Déclenchée depuis la Barre Supérieure
  const handleForceSaveData = async () => {
    setSaveStatus('saving');
    const dataset = {
      tenants, users, risks, actions, auditLogs, fonctions,
      affectations, rules, accessProfiles, auditMissions,
      auditFindings, complianceFrameworks, complianceObligations,
      complianceIncidents, entreprises, licences, historiqueLicences,
      sessions
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
          setToastMessage('✅ Toutes vos modifications (Description Détaillée, Causes, Conséquences, Cotations, Risques, Utilisateurs) ont été sauvegardées avec succès en Base de Données !');
        } else {
          setSaveStatus('saved');
          setToastMessage('✅ Données et modifications sauvegardées en BDD !');
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
    // 1. Direct match by ID in tenants
    let found = tenants.find(t => t.id === activeTenantId);
    if (found) return found;

    // 2. Flexible match by ID or company name in tenants (from Supabase/local)
    const lowerActiveId = (activeTenantId || '').toLowerCase().trim();
    found = tenants.find(t => {
      const tId = (t.id || '').toLowerCase().trim();
      const tName = (t.companyName || '').toLowerCase().trim();
      return tId === lowerActiveId || tName === lowerActiveId ||
        (lowerActiveId.length > 3 && (tId.includes(lowerActiveId) || tName.includes(lowerActiveId) || lowerActiveId.includes(tName)));
    });
    if (found) return found;

    if (activeTenantId === 'tenant_minfi' || activeTenantId.toLowerCase().includes('minfi') || activeTenantId.toLowerCase().includes('finance')) {
      return MINFI_CONFIG;
    }

    // Check if an entreprise entry exists with this activeTenantId
    const ent = entreprises.find(e => 
      e.id === activeTenantId || 
      (e.raisonSociale && e.raisonSociale.toLowerCase().includes(activeTenantId.toLowerCase())) ||
      (e.nomComplet && e.nomComplet.toLowerCase().includes(activeTenantId.toLowerCase()))
    );

    if (ent) {
      if (ent.id === 'tenant_minfi' || (ent.raisonSociale && ent.raisonSociale.toLowerCase().includes('finances'))) {
        return MINFI_CONFIG;
      }

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

  const activeEntreprise = useMemo(() => {
    return entreprises.find(e => 
      e.id === activeTenantId || 
      e.id === activeTenantConfig?.id ||
      (e.raisonSociale && activeTenantConfig?.companyName && e.raisonSociale.toLowerCase().includes(activeTenantConfig.companyName.toLowerCase())) ||
      (e.nomComplet && activeTenantConfig?.companyName && e.nomComplet.toLowerCase().includes(activeTenantConfig.companyName.toLowerCase())) ||
      (e.raisonSociale && e.raisonSociale.toLowerCase().includes(activeTenantId.toLowerCase())) ||
      (e.nomComplet && e.nomComplet.toLowerCase().includes(activeTenantId.toLowerCase()))
    ) || PRESET_ENTREPRISES.find(e => e.id === activeTenantId) || entreprises[0];
  }, [entreprises, activeTenantId, activeTenantConfig]);

  const activeLicence = licences.find(l => l.entrepriseId === activeTenantId) || licences.find(l => l.entrepriseId === activeTenantConfig.id);

  const allSelectableTenants = useMemo(() => {
    const list: TenantConfig[] = [...tenants];
    if (!list.some(t => t.id === MINFI_CONFIG.id)) {
      list.push(MINFI_CONFIG);
    }
    entreprises.forEach(ent => {
      if (!list.some(t => t.id === ent.id)) {
        if (ent.id === 'tenant_minfi' || (ent.raisonSociale && ent.raisonSociale.toLowerCase().includes('finances'))) {
          list.push(MINFI_CONFIG);
        } else {
          list.push({
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
          });
        }
      }
    });
    return list;
  }, [tenants, entreprises]);

  // Unified tenant matching helper
  const isTenantMatch = React.useCallback((itemTenantId?: string, itemCompanyName?: string, itemId?: string) => {
    if (itemTenantId === activeTenantId) return true;
    if (activeEntreprise?.id && itemTenantId === activeEntreprise.id) return true;
    if (activeTenantConfig?.id && itemTenantId === activeTenantConfig.id) return true;

    const activeNames = [
      activeTenantId,
      activeTenantConfig?.id,
      activeTenantConfig?.companyName,
      activeEntreprise?.id,
      activeEntreprise?.raisonSociale,
      activeEntreprise?.nomComplet
    ].filter(Boolean).map(s => String(s).toLowerCase().trim());

    if (itemTenantId) {
      const tLower = itemTenantId.toLowerCase().trim();
      if (activeNames.some(name => name === tLower || name.includes(tLower) || tLower.includes(name))) {
        return true;
      }
    }

    if (itemCompanyName) {
      const cLower = itemCompanyName.toLowerCase().trim();
      if (activeNames.some(name => name === cLower || name.includes(cLower) || cLower.includes(name))) {
        return true;
      }
    }

    if (activeTenantId === 'tenant1' && (!itemTenantId || itemTenantId === 'tenant1')) {
      return true;
    }

    if (itemId) {
      if (activeTenantId === 'tenant1' && (itemId.startsWith('R-1') || itemId.startsWith('a1'))) return true;
      if (activeTenantId === 'tenant2' && (itemId.startsWith('R-2') || itemId.startsWith('a2'))) return true;
      if ((activeTenantId === 'tenant_minfi' || activeTenantId === 'tenant5' || activeNames.some(n => n.includes('minfi') || n.includes('finance'))) && (itemId.startsWith('R-5') || itemId.startsWith('a5'))) return true;
    }

    return false;
  }, [activeTenantId, activeEntreprise, activeTenantConfig]);

  const activeTenantRisks = useMemo(() => {
    return risks.filter(r => isTenantMatch(r.tenantId, r.companyName, r.id));
  }, [risks, isTenantMatch]);

  const activeTenantActions = useMemo(() => {
    return actions.filter(a => isTenantMatch(a.tenantId, undefined, a.id));
  }, [actions, isTenantMatch]);

  const activeTenantMissions = useMemo(() => {
    return auditMissions.filter(m => isTenantMatch(m.tenantId, undefined, m.id));
  }, [auditMissions, isTenantMatch]);

  const activeTenantFindings = useMemo(() => {
    const missionIds = new Set(activeTenantMissions.map(m => m.id));
    return auditFindings.filter(f => {
      if (f.missionId && missionIds.has(f.missionId)) return true;
      return isTenantMatch(f.tenantId, undefined, f.id);
    });
  }, [auditFindings, activeTenantMissions, isTenantMatch]);

  const activeTenantFrameworks = useMemo(() => {
    return complianceFrameworks.filter(fw => isTenantMatch(fw.tenantId, undefined, fw.id));
  }, [complianceFrameworks, isTenantMatch]);

  const activeTenantObligations = useMemo(() => {
    const fwIds = new Set(activeTenantFrameworks.map(fw => fw.id));
    return complianceObligations.filter(o => {
      if (o.frameworkId && fwIds.has(o.frameworkId)) return true;
      return isTenantMatch(o.tenantId, undefined, o.id);
    });
  }, [complianceObligations, activeTenantFrameworks, isTenantMatch]);

  const activeTenantIncidents = useMemo(() => {
    return complianceIncidents.filter(i => isTenantMatch(i.tenantId, undefined, i.id));
  }, [complianceIncidents, isTenantMatch]);

  const activeTenantUsers = useMemo(() => {
    return users.filter(u => {
      // SuperAdmin is only displayed in SuperAdmin mode
      if (u.role === 'SuperAdmin') {
        return isSuperAdminMode;
      }

      // Determine explicit tenant ID for user
      let userTenant = u.tenantId;
      if (!userTenant) {
        const em = (u.email || '').toLowerCase();
        if (em.endsWith('@minfi.cm') || em.endsWith('@minfi.gov.cm')) userTenant = 'tenant_minfi';
        else if (em.endsWith('@aerotech.com')) userTenant = 'tenant2';
        else userTenant = 'tenant1';
      }

      // Identify active tenant identifiers
      const activeIds = [
        activeTenantId,
        activeEntreprise?.id,
        activeTenantConfig?.id
      ].filter(Boolean) as string[];

      // Direct match
      if (activeIds.includes(userTenant)) return true;

      // Domain-based match for custom enterprise tenants
      const em = (u.email || '').toLowerCase();
      if ((activeTenantId === 'tenant_minfi' || activeTenantId.includes('minfi') || activeTenantConfig?.companyName?.toLowerCase().includes('finances')) &&
          (em.endsWith('@minfi.cm') || em.endsWith('@minfi.gov.cm'))) {
        return true;
      }
      if ((activeTenantId === 'tenant2' || activeTenantConfig?.companyName?.toLowerCase().includes('aerotech')) &&
          em.endsWith('@aerotech.com')) {
        return true;
      }

      return false;
    });
  }, [users, activeTenantId, activeEntreprise, activeTenantConfig, isSuperAdminMode]);

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
        tenants={allSelectableTenants}
        activeTenantId={activeTenantId}
        setActiveTenantId={setActiveTenantId}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        users={isSuperAdminMode ? users : activeTenantUsers}
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
            sessions={sessions}
            onUpdateSessions={setSessions}
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
                users={activeTenantUsers}
                currentUser={currentUser}
                isSuperAdminMode={isSuperAdminMode}
                onAddRisk={handleAddRisk}
                onUpdateRisk={(updated) => setRisks(prev => prev.map(r => r.id === updated.id ? { ...updated, tenantId: updated.tenantId || r.tenantId || activeTenantId } : r))}
                onDeleteRisk={(id) => {
                  setRisks(prev => prev.filter(r => r.id !== id));
                  setActions(prev => prev.filter(a => a.riskId !== id));
                  addAuditLog('Suppression de Risque', `Suppression définitive du risque ${id} et de ses plans d'action rattachés.`);
                }}
                onAddActionPlan={(plan) => setActions(prev => [...prev, { ...plan, id: `a_${Date.now()}_${prev.length + 1}`, tenantId: activeTenantId, progress: 0 }])}
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
                actions={activeTenantActions}
                onUpdateRisk={(updated) => setRisks(prev => prev.map(r => r.id === updated.id ? { ...updated, tenantId: updated.tenantId || r.tenantId || activeTenantId } : r))}
              />
            )}

            {activeModule === 'actions' && (
              <ActionsModule 
                actions={activeTenantActions}
                risks={activeTenantRisks}
                tenantConfig={activeTenantConfig}
                users={activeTenantUsers}
                onAddActionPlan={(plan) => setActions(prev => [...prev, { ...plan, id: `a_${Date.now()}_${prev.length + 1}`, tenantId: activeTenantId, progress: 0 }])}
                onUpdateActionPlan={(updated) => setActions(prev => prev.map(a => a.id === updated.id ? { ...updated, tenantId: updated.tenantId || a.tenantId || activeTenantId } : a))}
                onAddLog={addAuditLog}
              />
            )}

            {activeModule === 'config' && (
              <ConfigModule 
                tenantConfig={activeTenantConfig}
                onUpdateTenantConfig={(updated) => setTenants(prev => {
                  const exists = prev.some(t => t.id === updated.id);
                  return exists ? prev.map(t => t.id === updated.id ? updated : t) : [...prev, updated];
                })}
                fonctions={fonctions}
                onUpdateFonctions={setFonctions}
                affectations={affectations}
                onUpdateAffectations={setAffectations}
                rules={rules}
                onUpdateRules={setRules}
                accessProfiles={accessProfiles}
                onUpdateAccessProfiles={setAccessProfiles}
                users={activeTenantUsers}
                onAddUser={(u) => setUsers(prev => [...prev, { ...u, id: `u_${Date.now()}`, tenantId: u.tenantId || activeTenantId }])}
                onDeleteUser={(id) => setUsers(prev => prev.filter(u => u.id !== id))}
                onUpdateUser={(u) => setUsers(prev => prev.map(item => item.id === u.id ? { ...u, tenantId: u.tenantId || item.tenantId || activeTenantId } : item))}
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
                missions={activeTenantMissions}
                findings={activeTenantFindings}
                fonctions={fonctions}
                users={activeTenantUsers}
                currentUser={currentUser}
                onAddMission={(newM) => setAuditMissions(prev => [...prev, { ...newM, id: `m_${Date.now()}`, tenantId: activeTenantId }])}
                onAddFinding={(newF) => setAuditFindings(prev => [...prev, { ...newF, id: `f_${Date.now()}`, tenantId: activeTenantId }])}
                onUpdateFindingStatus={(id, status) => setAuditFindings(prev => prev.map(f => f.id === id ? { ...f, statut: status } : f))}
                onAddLog={addAuditLog}
              />
            )}

            {activeModule === 'compliance' && (
              <ComplianceModule 
                frameworks={activeTenantFrameworks}
                obligations={activeTenantObligations}
                incidents={activeTenantIncidents}
                fonctions={fonctions}
                onAddFramework={(fw) => setComplianceFrameworks(prev => [...prev, { ...fw, id: `cf_${Date.now()}`, tenantId: activeTenantId }])}
                onAddObligation={(ob) => setComplianceObligations(prev => [...prev, { ...ob, id: `co_${Date.now()}`, tenantId: activeTenantId }])}
                onUpdateObligationStatus={(id, status) => setComplianceObligations(prev => prev.map(o => o.id === id ? { ...o, statut: status } : o))}
                onAddIncident={(inc) => setComplianceIncidents(prev => [...prev, { ...inc, id: `inc_${Date.now()}`, tenantId: activeTenantId }])}
                onUpdateIncidentStatus={(id, status) => setComplianceIncidents(prev => prev.map(i => i.id === id ? { ...i, statutDeclaration: status } : i))}
                onAddLog={addAuditLog}
              />
            )}

            {activeModule === 'admin' && (
              <AdminModule 
                users={activeTenantUsers}
                onAddUser={(u) => setUsers(prev => [...prev, { ...u, id: `u_${Date.now()}`, tenantId: u.tenantId || activeTenantId }])}
                onDeleteUser={(id) => setUsers(prev => prev.filter(u => u.id !== id))}
                onUpdateUser={(u) => setUsers(prev => prev.map(item => item.id === u.id ? { ...u, tenantId: u.tenantId || item.tenantId || activeTenantId } : item))}
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
                onUpdateTenantConfig={(updated) => setTenants(prev => {
                  const exists = prev.some(t => t.id === updated.id);
                  return exists ? prev.map(t => t.id === updated.id ? updated : t) : [...prev, updated];
                })}
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