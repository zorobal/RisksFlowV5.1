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
  // Master state
  const [tenants, setTenants] = useState<TenantConfig[]>(() => {
    const saved = localStorage.getItem('grc_tenants19');
    return saved ? JSON.parse(saved) : [SOGESTI_CONFIG, AEROTECH_CONFIG];
  });

  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    return localStorage.getItem('grc_activeTenantId19') || 'tenant1';
  });

  const [risks, setRisks] = useState<Risk[]>(() => {
    const saved = localStorage.getItem('grc_risks19');
    return saved ? JSON.parse(saved) : [...SOGESTI_RISKS, ...AEROTECH_RISKS];
  });

  const [actions, setActions] = useState<ActionPlan[]>(() => {
    const saved = localStorage.getItem('grc_actions19');
    return saved ? JSON.parse(saved) : PRESET_ACTIONS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('grc_users19');
    return saved ? JSON.parse(saved) : PRESET_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('grc_currentUser19');
    if (saved) return JSON.parse(saved);
    return PRESET_USERS.find(u => u.name.includes('Alain')) || PRESET_USERS[0];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('grc_auditLogs19');
    return saved ? JSON.parse(saved) : PRESET_AUDIT_LOGS;
  });

  const [fonctions, setFonctions] = useState<Fonction[]>(() => {
    const saved = localStorage.getItem('grc_fonctions19');
    return saved ? JSON.parse(saved) : PRESET_FONCTIONS;
  });

  const [affectations, setAffectations] = useState<Affectation[]>(() => {
    const saved = localStorage.getItem('grc_affectations19');
    return saved ? JSON.parse(saved) : PRESET_AFFECTATIONS;
  });

  const [rules, setRules] = useState<Rule[]>(() => {
    const saved = localStorage.getItem('grc_rules19');
    return saved ? JSON.parse(saved) : PRESET_RULES;
  });

  const [accessProfiles, setAccessProfiles] = useState<AccessProfile[]>(() => {
    const saved = localStorage.getItem('grc_accessProfiles19');
    return saved ? JSON.parse(saved) : PRESET_ACCESS_PROFILES;
  });

  const [auditMissions, setAuditMissions] = useState<AuditMission[]>(() => {
    const saved = localStorage.getItem('grc_auditMissions19');
    return saved ? JSON.parse(saved) : PRESET_AUDIT_MISSIONS;
  });

  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>(() => {
    const saved = localStorage.getItem('grc_auditFindings19');
    return saved ? JSON.parse(saved) : PRESET_AUDIT_FINDINGS;
  });

  const [complianceFrameworks, setComplianceFrameworks] = useState<ComplianceFramework[]>(() => {
    const saved = localStorage.getItem('grc_complianceFrameworks19');
    return saved ? JSON.parse(saved) : PRESET_COMPLIANCE_FRAMEWORKS;
  });

  const [complianceObligations, setComplianceObligations] = useState<ComplianceObligation[]>(() => {
    const saved = localStorage.getItem('grc_complianceObligations19');
    return saved ? JSON.parse(saved) : PRESET_COMPLIANCE_OBLIGATIONS;
  });

  const [complianceIncidents, setComplianceIncidents] = useState<ComplianceIncident[]>(() => {
    const saved = localStorage.getItem('grc_complianceIncidents19');
    return saved ? JSON.parse(saved) : PRESET_COMPLIANCE_INCIDENTS;
  });

  const [entreprises, setEntreprises] = useState<EntrepriseCliente[]>(() => {
    const saved = localStorage.getItem('grc_entreprises19');
    return saved ? JSON.parse(saved) : PRESET_ENTREPRISES;
  });

  const [licences, setLicences] = useState<Licence[]>(() => {
    const saved = localStorage.getItem('grc_licences19');
    return saved ? JSON.parse(saved) : PRESET_LICENCES;
  });

  const [historiqueLicences, setHistoriqueLicences] = useState<HistoriqueLicence[]>(() => {
    const saved = localStorage.getItem('grc_historiqueLicences19');
    return saved ? JSON.parse(saved) : PRESET_HISTORIQUE_LICENCES;
  });

  const [sessions, setSessions] = useState<SessionExercice[]>(() => {
    const saved = localStorage.getItem('grc_sessions19');
    return saved ? JSON.parse(saved) : PRESET_SESSIONS;
  });

  useEffect(() => {
    localStorage.setItem('grc_sessions19', JSON.stringify(sessions));
  }, [sessions]);

  const handleAddSession = (s: SessionExercice) => {
    setSessions(prev => [...prev, s]);
    addAuditLog('Administration', `Démarrage d'une nouvelle session d'exercice ${s.annee} (${s.dateDebut} à ${s.dateFin})`);
  };

  const handleUpdateSession = (updated: SessionExercice) => {
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
    if (updated.statut === 'Clôturée') {
      addAuditLog('Administration', `Clôture de la session d'exercice ${updated.annee} avec bilan annuel répertorié.`);
    } else {
      addAuditLog('Administration', `Mise à jour de la session d'exercice ${updated.annee}`);
    }
  };

  const [isSuperAdminMode, setIsSuperAdminMode] = useState<boolean>(() => {
    return localStorage.getItem('grc_superAdminMode19') === 'true';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('grc_isLoggedIn19') === 'true';
  });

  const [showDemo, setShowDemo] = useState<boolean>(() => {
    return localStorage.getItem('grc_showDemo19') === 'true';
  });

  const [activeModule, setActiveModule] = useState<'dashboard' | 'risks' | 'evaluation' | 'heatmap' | 'actions' | 'config' | 'admin' | 'reporting' | 'audit' | 'compliance'>('dashboard');
  const [adminTab, setAdminTab] = useState<'users' | 'tenants' | 'audit'>('users');

  // Persistence side-effects
  useEffect(() => {
    localStorage.setItem('grc_tenants19', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('grc_activeTenantId19', activeTenantId);
  }, [activeTenantId]);

  useEffect(() => {
    localStorage.setItem('grc_risks19', JSON.stringify(risks));
  }, [risks]);

  useEffect(() => {
    localStorage.setItem('grc_actions19', JSON.stringify(actions));
  }, [actions]);

  useEffect(() => {
    localStorage.setItem('grc_users19', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('grc_currentUser19', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (currentUser.role === 'SuperAdmin' || currentUser.role === 'Administrateur') return;
    if (currentUser.allowedModules && currentUser.allowedModules.length > 0) {
      if (!currentUser.allowedModules.includes(activeModule)) {
        setActiveModule('dashboard');
      }
    } else {
      if (currentUser.role === 'Analyste' && ['admin', 'config'].includes(activeModule)) {
        setActiveModule('dashboard');
      }
    }
  }, [currentUser, activeModule]);

  useEffect(() => {
    localStorage.setItem('grc_auditLogs19', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('grc_fonctions19', JSON.stringify(fonctions));
  }, [fonctions]);

  useEffect(() => {
    localStorage.setItem('grc_affectations19', JSON.stringify(affectations));
  }, [affectations]);

  useEffect(() => {
    localStorage.setItem('grc_rules19', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('grc_accessProfiles19', JSON.stringify(accessProfiles));
  }, [accessProfiles]);

  useEffect(() => {
    localStorage.setItem('grc_auditMissions19', JSON.stringify(auditMissions));
  }, [auditMissions]);

  useEffect(() => {
    localStorage.setItem('grc_auditFindings19', JSON.stringify(auditFindings));
  }, [auditFindings]);

  useEffect(() => {
    localStorage.setItem('grc_complianceFrameworks19', JSON.stringify(complianceFrameworks));
  }, [complianceFrameworks]);

  useEffect(() => {
    localStorage.setItem('grc_complianceObligations19', JSON.stringify(complianceObligations));
  }, [complianceObligations]);

  useEffect(() => {
    localStorage.setItem('grc_complianceIncidents19', JSON.stringify(complianceIncidents));
  }, [complianceIncidents]);

  useEffect(() => {
    localStorage.setItem('grc_entreprises19', JSON.stringify(entreprises));
  }, [entreprises]);

  useEffect(() => {
    localStorage.setItem('grc_licences19', JSON.stringify(licences));
  }, [licences]);

  useEffect(() => {
    localStorage.setItem('grc_historiqueLicences19', JSON.stringify(historiqueLicences));
  }, [historiqueLicences]);

  useEffect(() => {
    localStorage.setItem('grc_superAdminMode19', String(isSuperAdminMode));
  }, [isSuperAdminMode]);

  useEffect(() => {
    localStorage.setItem('grc_isLoggedIn19', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('grc_showDemo19', String(showDemo));
  }, [showDemo]);

  // Supabase Auto-sync Pull on mount
  useEffect(() => {
    const isAutoSync = localStorage.getItem('supabase_auto_sync') === 'true';
    if (isAutoSync) {
      const client = getSupabaseClient();
      if (client) {
        console.log('[Supabase Auto-Sync] Récupération initiale des données...');
        pullAllFromSupabase(client).then(res => {
          if (res.success && res.data) {
            const d = res.data;
            if (d.tenants && d.tenants.length > 0) setTenants(d.tenants);
            if (d.users && d.users.length > 0) setUsers(d.users);
            if (d.risks && d.risks.length > 0) setRisks(d.risks);
            if (d.actions && d.actions.length > 0) setActions(d.actions);
            if (d.auditLogs && d.auditLogs.length > 0) setAuditLogs(d.auditLogs);
            if (d.fonctions && d.fonctions.length > 0) setFonctions(d.fonctions);
            if (d.affectations && d.affectations.length > 0) setAffectations(d.affectations);
            if (d.rules && d.rules.length > 0) setRules(d.rules);
            if (d.accessProfiles && d.accessProfiles.length > 0) setAccessProfiles(d.accessProfiles);
            if (d.auditMissions && d.auditMissions.length > 0) setAuditMissions(d.auditMissions);
            if (d.auditFindings && d.auditFindings.length > 0) setAuditFindings(d.auditFindings);
            if (d.complianceFrameworks && d.complianceFrameworks.length > 0) setComplianceFrameworks(d.complianceFrameworks);
            if (d.complianceObligations && d.complianceObligations.length > 0) setComplianceObligations(d.complianceObligations);
            if (d.complianceIncidents && d.complianceIncidents.length > 0) setComplianceIncidents(d.complianceIncidents);
            if (d.entreprises && d.entreprises.length > 0) setEntreprises(d.entreprises);
            if (d.licences && d.licences.length > 0) setLicences(d.licences);
            if (d.historiqueLicences && d.historiqueLicences.length > 0) setHistoriqueLicences(d.historiqueLicences);
            console.log('[Supabase Auto-Sync] Données synchronisées.');
          }
        });
      }
    }
  }, []);

  // Synchronisation en temps réel des compteurs de licences (utilisateurs et succursales)
  useEffect(() => {
    setLicences(prevLicences => {
      let changed = false;
      const updated = prevLicences.map(lic => {
        const usersCount = users.filter(u => u.tenantId === lic.entrepriseId).length;
        const tenant = tenants.find(t => t.id === lic.entrepriseId);
        const succursalesCount = tenant 
          ? tenant.entities.filter(e => e.est_succursale === true && e.statut !== 'Archivé').length
          : 0;

        const currentMax = lic.nombre_succursales_max ?? 5;
        const currentActuel = lic.nombre_succursales_actuel ?? 0;
        const currentQuotaMode = lic.depassementQuotaMode ?? 'blocage';
        const currentActive = lic.succursalesActives ?? true;

        if (
          lic.nombreUtilisateursActuel !== usersCount || 
          currentActuel !== succursalesCount
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

  // Supabase Auto-sync Push on changes (throttled by 2-second debounce)
  useEffect(() => {
    const isAutoSync = localStorage.getItem('supabase_auto_sync') === 'true';
    if (!isAutoSync) return;

    const client = getSupabaseClient();
    if (!client) return;

    const dataset = {
      tenants,
      users,
      risks,
      actions,
      auditLogs,
      fonctions,
      affectations,
      rules,
      accessProfiles,
      auditMissions,
      auditFindings,
      complianceFrameworks,
      complianceObligations,
      complianceIncidents,
      entreprises,
      licences,
      historiqueLicences,
    };

    const delayDebounceFn = setTimeout(() => {
      console.log('[Supabase Auto-Sync] Changement détecté, sauvegarde dans le cloud...');
      pushAllToSupabase(client, dataset).then(res => {
        if (res.success) {
          console.log('[Supabase Auto-Sync] Sauvegarde réussie.');
        } else {
          console.warn('[Supabase Auto-Sync] Échec de la sauvegarde :', res.messages);
        }
      });
    }, 2000);

    return () => clearTimeout(delayDebounceFn);
  }, [
    tenants,
    users,
    risks,
    actions,
    auditLogs,
    fonctions,
    affectations,
    rules,
    accessProfiles,
    auditMissions,
    auditFindings,
    complianceFrameworks,
    complianceObligations,
    complianceIncidents,
    entreprises,
    licences,
    historiqueLicences,
  ]);

  // Current selected configurations
  const activeTenantConfig = tenants.find(t => t.id === activeTenantId) || tenants[0];
  const activeEntreprise = entreprises.find(e => e.id === activeTenantId) || entreprises.find(e => e.id === activeTenantConfig.id);
  const activeLicence = licences.find(l => l.entrepriseId === activeTenantId) || licences.find(l => l.entrepriseId === activeTenantConfig.id);
  
  // Scoped risk list belonging to active Tenant
  const activeTenantRisks = risks.filter(r => {
    // Treat R-100 values as Sogesti S.A. and R-200 as AeroTech
    if (activeTenantId === 'tenant1') {
      return r.id.startsWith('R-1') || r.tenantId === 'tenant1';
    } else if (activeTenantId === 'tenant2') {
      return r.id.startsWith('R-2') || r.tenantId === 'tenant2';
    }
    // Dynamic tenants fallback inside active selection
    return r.tenantId === activeTenantId;
  });

  // Scoped actions belonging to active Tenant
  const activeTenantActions = actions.filter(a => {
    if (activeTenantId === 'tenant1') {
      return !a.tenantId || a.tenantId === 'tenant1';
    }
    return a.tenantId === activeTenantId || activeTenantRisks.some(r => r.id === a.riskId);
  });

  // Scoped audit missions and findings
  const activeTenantAuditMissions = auditMissions.filter(m => {
    if (activeTenantId === 'tenant1') {
      return !m.tenantId || m.tenantId === 'tenant1';
    }
    return m.tenantId === activeTenantId;
  });

  const activeTenantAuditFindings = auditFindings.filter(f => {
    if (activeTenantId === 'tenant1') {
      return !f.tenantId || f.tenantId === 'tenant1';
    }
    return f.tenantId === activeTenantId || activeTenantAuditMissions.some(m => m.id === f.missionId);
  });

  // Scoped compliance datasets
  const activeTenantComplianceFrameworks = complianceFrameworks.filter(cf => {
    if (activeTenantId === 'tenant1') {
      return !cf.tenantId || cf.tenantId === 'tenant1';
    }
    return cf.tenantId === activeTenantId;
  });

  const activeTenantComplianceObligations = complianceObligations.filter(co => {
    if (activeTenantId === 'tenant1') {
      return !co.tenantId || co.tenantId === 'tenant1';
    }
    return co.tenantId === activeTenantId || activeTenantComplianceFrameworks.some(cf => cf.id === co.frameworkId);
  });

  const activeTenantComplianceIncidents = complianceIncidents.filter(inc => {
    if (activeTenantId === 'tenant1') {
      return !inc.tenantId || inc.tenantId === 'tenant1';
    }
    return inc.tenantId === activeTenantId;
  });

  // Scoped organizational/structural lists
  const activeTenantFonctions = fonctions.filter(f => {
    if (activeTenantId === 'tenant1') {
      return !f.tenantId || f.tenantId === 'tenant1';
    }
    return f.tenantId === activeTenantId || activeTenantConfig.entities.some(e => e.id === f.entityId);
  });

  const activeTenantAffectations = affectations.filter(aff => {
    if (activeTenantId === 'tenant1') {
      return !aff.tenantId || aff.tenantId === 'tenant1';
    }
    return aff.tenantId === activeTenantId;
  });

  const activeTenantRules = rules.filter(r => {
    if (activeTenantId === 'tenant1') {
      return !r.tenantId || r.tenantId === 'tenant1';
    }
    return r.tenantId === activeTenantId;
  });

  const activeTenantAccessProfiles = accessProfiles.filter(ap => {
    if (activeTenantId === 'tenant1') {
      return !ap.tenantId || ap.tenantId === 'tenant1';
    }
    return ap.tenantId === activeTenantId;
  });

  // State modifying functions
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
    // Generate sequential unique ID based on active tenants
    const prefix = activeTenantId === 'tenant1' ? 'R-1' : (activeTenantId === 'tenant2' ? 'R-2' : 'R-3');
    const existingIds = risks.filter(r => r.id.startsWith(prefix)).map(r => Number(r.id.split('-')[1]));
    const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 101;
    const newId = `${prefix}${nextNum}`;

    // Compute original standard scores
    const scoreBrut = rawRisk.frequencyValue * rawRisk.impactValue;
    let scoreResiduel = scoreBrut * rawRisk.controlValue;

    if (activeTenantConfig.formula.expression === '(P * I) - M') {
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

  const handleUpdateRisk = (updated: Risk) => {
    setRisks(prev => prev.map(r => r.id === updated.id ? updated : r));
    addAuditLog('Re-évaluation', `Mise à jour des critères de sévérité du risque ${updated.id}`);
  };

  const handleDeleteRisk = (id: string) => {
    setRisks(prev => prev.filter(r => r.id !== id));
    addAuditLog('Archivage', `Retrait/Suppression définitive de la fiche de risque ${id}`);
  };

  const handleAddActionPlan = (rawPlan: Omit<ActionPlan, 'id' | 'progress'>) => {
    const newPlan: ActionPlan = {
      ...rawPlan,
      id: `a${actions.length + 1}`,
      progress: 0,
      tenantId: activeTenantId
    };
    setActions(prev => [...prev, newPlan]);
    addAuditLog('Planification d\'action', `Nouveau plan d'action de mitigation lié au risque ${rawPlan.riskId}`);
  };

  const handleUpdateActionPlan = (updated: ActionPlan) => {
    setActions(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const handleUpdateFonctions = (updatedFonctions: Fonction[]) => {
    setFonctions(prev => {
      const otherTenantFonctions = prev.filter(f => {
        const belongsToActive = activeTenantConfig.entities.some(e => e.id === f.entityId) || f.tenantId === activeTenantId;
        return !belongsToActive;
      });
      const processed = updatedFonctions.map(f => {
        if (!f.tenantId && activeTenantId !== 'tenant1') {
          return { ...f, tenantId: activeTenantId };
        }
        return f;
      });
      return [...otherTenantFonctions, ...processed];
    });
  };

  const handleUpdateAffectations = (updatedAffectations: Affectation[]) => {
    setAffectations(prev => {
      const otherTenantAffectations = prev.filter(aff => {
        const belongsToActive = (activeTenantId === 'tenant1' && !aff.tenantId) || aff.tenantId === activeTenantId;
        return !belongsToActive;
      });
      const processed = updatedAffectations.map(aff => {
        if (!aff.tenantId && activeTenantId !== 'tenant1') {
          return { ...aff, tenantId: activeTenantId };
        }
        return aff;
      });
      return [...otherTenantAffectations, ...processed];
    });
  };

  const handleUpdateRules = (updatedRules: Rule[]) => {
    setRules(prev => {
      const otherTenantRules = prev.filter(r => {
        const belongsToActive = (activeTenantId === 'tenant1' && !r.tenantId) || r.tenantId === activeTenantId;
        return !belongsToActive;
      });
      const processed = updatedRules.map(r => {
        if (!r.tenantId && activeTenantId !== 'tenant1') {
          return { ...r, tenantId: activeTenantId };
        }
        return r;
      });
      return [...otherTenantRules, ...processed];
    });
  };

  const handleUpdateAccessProfiles = (updatedProfiles: AccessProfile[]) => {
    setAccessProfiles(prev => {
      const otherTenantProfiles = prev.filter(ap => {
        const belongsToActive = (activeTenantId === 'tenant1' && !ap.tenantId) || ap.tenantId === activeTenantId;
        return !belongsToActive;
      });
      const processed = updatedProfiles.map(ap => {
        if (!ap.tenantId && activeTenantId !== 'tenant1') {
          return { ...ap, tenantId: activeTenantId };
        }
        return ap;
      });
      return [...otherTenantProfiles, ...processed];
    });
  };

  const handleUpdateTenantConfig = (updatedConfig: TenantConfig) => {
    setTenants(prev => prev.map(t => t.id === updatedConfig.id ? updatedConfig : t));
    addAuditLog('Modification Paramètres', `Échelles de cotation ou périmètre révisés pour ${updatedConfig.companyName}`);
  };

  const handleAddUser = (rawUser: Omit<User, 'id'>) => {
    const emailLower = rawUser.email.trim().toLowerCase();
    const emailExists = users.some(u => u.email.trim().toLowerCase() === emailLower);
    if (emailExists) {
      console.warn(`Tentative de création d'un utilisateur avec un email déjà existant : ${rawUser.email}`);
      return;
    }

    const newUser: User = {
      ...rawUser,
      id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      tenantId: rawUser.tenantId || activeTenantId
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('Nouveau membre', `Création du compte utilisateur "${rawUser.name}" [Privilèges: ${rawUser.role}]`);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    addAuditLog('Habilitation', `Suppression du profil de collaborateur DB ID: ${id}`);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const emailLower = updatedUser.email.trim().toLowerCase();
    const emailExists = users.some(u => u.id !== updatedUser.id && u.email.trim().toLowerCase() === emailLower);
    if (emailExists) {
      console.warn(`Tentative de modification d'un utilisateur vers un email déjà existant : ${updatedUser.email}`);
      return;
    }

    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    addAuditLog('Habilitation', `Modification de l'utilisateur "${updatedUser.name}" [Privilèges: ${updatedUser.role}, Actif: ${updatedUser.isActive !== false}]`);
  };

  const handleAddTenant = (name: string) => {
    const newId = `tenant_${Date.now()}`;
    const newTenant: TenantConfig = {
      // Setup identical layout to Sogesti custom
      ...SOGESTI_CONFIG,
      id: newId,
      companyName: name,
      entities: [
        { id: `${newId}_e1`, name: 'Direction Audit & Risques', type: 'Direction' },
        { id: `${newId}_e2`, name: 'Département Opérations', type: 'Département' }
      ]
    };

    setTenants(prev => [...prev, newTenant]);
    setActiveTenantId(newId);
    addAuditLog('Multi-tenant', `Initialisation d'une base de données étanche pour : ${name}`);
  };

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
          addAuditLog('Lancement Démo', `Lancement du scénario de démonstration pour : ${user.name} (${user.role})`);
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
            if (user.tenantId) {
              setActiveTenantId(user.tenantId);
            } else if (user.email.toLowerCase().includes('aerotech') || user.name.includes('Dieudonné') || user.id === 'u4') {
              setActiveTenantId('tenant2');
            } else {
              setActiveTenantId('tenant1');
            }
            setActiveModule('dashboard');
          }
          addAuditLog('Connexion', `Authentification réussie pour ${user.name} (${user.role}).`);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased text-xs select-none">
      
      {/* ODOO STYLED HEADER BAR */}
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

      {/* MODULAR MODULES PORTAL */}
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
            onRestoreTenantData={(tenantId, restoredData) => {
              if (tenantId === 'tenant1') {
                setRisks(prev => {
                  const filtered = prev.filter(r => !r.id.startsWith('R-1'));
                  return [...filtered, ...SOGESTI_RISKS];
                });
                addAuditLog('Restauration Système', 'Restauration complète des données Sogesti S.A. à l\'état de référence.');
              } else if (tenantId === 'tenant2') {
                setRisks(prev => {
                  const filtered = prev.filter(r => !r.id.startsWith('R-2'));
                  return [...filtered, ...AEROTECH_RISKS];
                });
                addAuditLog('Restauration Système', 'Restauration complète des données AeroTech à l\'état de référence.');
              }
            }}
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
                onUpdateRisk={handleUpdateRisk}
                onDeleteRisk={handleDeleteRisk}
                onAddActionPlan={handleAddActionPlan}
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
                onAddActionPlan={handleAddActionPlan}
                onUpdateActionPlan={handleUpdateActionPlan}
                onAddLog={addAuditLog}
              />
            )}

            {activeModule === 'config' && (
              <ConfigModule 
                tenantConfig={activeTenantConfig}
                onUpdateTenantConfig={handleUpdateTenantConfig}
                fonctions={activeTenantFonctions}
                onUpdateFonctions={handleUpdateFonctions}
                affectations={activeTenantAffectations}
                onUpdateAffectations={handleUpdateAffectations}
                rules={activeTenantRules}
                onUpdateRules={handleUpdateRules}
                accessProfiles={activeTenantAccessProfiles}
                onUpdateAccessProfiles={handleUpdateAccessProfiles}
                users={users}
                onAddLog={addAuditLog}
                maxSuccursales={activeLicence?.nombre_succursales_max ?? activeEntreprise?.maxSuccursales ?? 5}
                maxDirections={activeEntreprise?.maxDirections ?? 5}
                maxDepartements={activeEntreprise?.maxDepartements ?? 10}
                maxServices={activeEntreprise?.maxServices ?? 15}
                maxSitesLocaux={activeEntreprise?.maxSitesLocaux ?? 5}
                maxFiliales={activeEntreprise?.maxFiliales ?? 5}
                depassementQuotaMode={activeLicence?.depassementQuotaMode ?? activeEntreprise?.depassementQuotaMode ?? 'blocage'}
                succursalesActives={activeLicence?.succursalesActives ?? activeEntreprise?.succursalesActives ?? true}
              />
            )}

            {activeModule === 'audit' && (
              <AuditModule 
                missions={activeTenantAuditMissions}
                findings={activeTenantAuditFindings}
                fonctions={activeTenantFonctions}
                users={users}
                currentUser={currentUser}
                onAddMission={(newMission) => {
                  setAuditMissions(prev => [...prev, { ...newMission, id: `m_${Date.now()}`, tenantId: activeTenantId }]);
                }}
                onAddFinding={(newFinding) => {
                  setAuditFindings(prev => [...prev, { ...newFinding, id: `f_${Date.now()}`, tenantId: activeTenantId }]);
                }}
                onUpdateFindingStatus={(id, status) => {
                  setAuditFindings(prev => prev.map(f => f.id === id ? { ...f, statut: status } : f));
                }}
                onAddLog={addAuditLog}
              />
            )}

            {activeModule === 'compliance' && (
              <ComplianceModule 
                frameworks={activeTenantComplianceFrameworks}
                obligations={activeTenantComplianceObligations}
                incidents={activeTenantComplianceIncidents}
                fonctions={activeTenantFonctions}
                onAddFramework={(newFw) => {
                  setComplianceFrameworks(prev => [...prev, { ...newFw, id: `cf_${Date.now()}`, tenantId: activeTenantId }]);
                }}
                onAddObligation={(newOb) => {
                  setComplianceObligations(prev => [...prev, { ...newOb, id: `co_${Date.now()}`, tenantId: activeTenantId }]);
                }}
                onUpdateObligationStatus={(id, status) => {
                  setComplianceObligations(prev => prev.map(ob => ob.id === id ? { ...ob, statut: status } : ob));
                }}
                onAddIncident={(newInc) => {
                  setComplianceIncidents(prev => [...prev, { ...newInc, id: `inc_${Date.now()}`, tenantId: activeTenantId }]);
                }}
                onUpdateIncidentStatus={(id, status) => {
                  setComplianceIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, statutDeclaration: status } : inc));
                }}
                onAddLog={addAuditLog}
              />
            )}

            {activeModule === 'admin' && (
              <AdminModule 
                users={users.filter(u => u.tenantId === activeTenantId || (activeTenantId === 'tenant1' && !u.tenantId && u.role !== 'SuperAdmin'))}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                onUpdateUser={handleUpdateUser}
                tenants={tenants}
                onAddTenant={handleAddTenant}
                auditLogs={auditLogs}
                activeTenantId={activeTenantId}
                initialTab={adminTab as any}
                sessions={sessions}
                onAddSession={handleAddSession}
                onUpdateSession={handleUpdateSession}
                licence={activeLicence}
                onUpdateLicence={(updated) => setLicences(prev => prev.map(l => l.id === updated.id ? updated : l))}
                tenantConfig={activeTenantConfig}
                onUpdateTenantConfig={handleUpdateTenantConfig}
                onAddLog={addAuditLog}
                activeEntreprise={activeEntreprise}
                onUpdateEntreprise={(updated) => setEntreprises(prev => prev.map(e => e.id === updated.id ? updated : e))}
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
