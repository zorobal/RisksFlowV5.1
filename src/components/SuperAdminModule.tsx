/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  Database, 
  Activity, 
  LifeBuoy, 
  Lock, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Download, 
  Upload, 
  ShieldCheck, 
  Search, 
  Filter, 
  Eye, 
  FileText,
  Clock,
  Settings,
  X,
  Smartphone,
  Server,
  CloudLightning,
  Code,
  Copy,
  Check,
  AlertCircle,
  Briefcase,
  MapPin,
  Mail,
  Send,
  Key,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { 
  EntrepriseCliente, 
  Licence, 
  HistoriqueLicence, 
  SuperAdminRole, 
  TenantConfig, 
  Risk, 
  ActionPlan, 
  AuditLog, 
  Fonction 
} from '../types';
import { 
  getSupabaseConfig, 
  getSupabaseClient, 
  testSupabaseConnection, 
  pushAllToSupabase, 
  pullAllFromSupabase, 
  getSqlSchema, 
  resetSupabaseClient 
} from '../lib/supabase';

interface SuperAdminModuleProps {
  entreprises: EntrepriseCliente[];
  onUpdateEntreprises: React.Dispatch<React.SetStateAction<EntrepriseCliente[]>>;
  licences: Licence[];
  onUpdateLicences: React.Dispatch<React.SetStateAction<Licence[]>>;
  historiqueLicences: HistoriqueLicence[];
  onUpdateHistoriqueLicences: React.Dispatch<React.SetStateAction<HistoriqueLicence[]>>;
  tenants: TenantConfig[];
  onUpdateTenants: React.Dispatch<React.SetStateAction<TenantConfig[]>>;
  risks: Risk[];
  onUpdateRisks: React.Dispatch<React.SetStateAction<Risk[]>>;
  actions: ActionPlan[];
  onUpdateActions: React.Dispatch<React.SetStateAction<ActionPlan[]>>;
  auditLogs: AuditLog[];
  onUpdateAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  fonctions: Fonction[];
  onUpdateFonctions: React.Dispatch<React.SetStateAction<Fonction[]>>;
  users: any[];
  onUpdateUsers: React.Dispatch<React.SetStateAction<any[]>>;
  affectations: any[];
  onUpdateAffectations: React.Dispatch<React.SetStateAction<any[]>>;
  rules: any[];
  onUpdateRules: React.Dispatch<React.SetStateAction<any[]>>;
  accessProfiles: any[];
  onUpdateAccessProfiles: React.Dispatch<React.SetStateAction<any[]>>;
  auditMissions: any[];
  onUpdateAuditMissions: React.Dispatch<React.SetStateAction<any[]>>;
  auditFindings: any[];
  onUpdateAuditFindings: React.Dispatch<React.SetStateAction<any[]>>;
  complianceFrameworks: any[];
  onUpdateComplianceFrameworks: React.Dispatch<React.SetStateAction<any[]>>;
  complianceObligations: any[];
  onUpdateComplianceObligations: React.Dispatch<React.SetStateAction<any[]>>;
  complianceIncidents: any[];
  onUpdateComplianceIncidents: React.Dispatch<React.SetStateAction<any[]>>;
  onAddLog: (action: string, details: string) => void;
  onRestoreTenantData: (tenantId: string, restoredData: any) => void;
}

export default function SuperAdminModule({
  entreprises,
  onUpdateEntreprises,
  licences,
  onUpdateLicences,
  historiqueLicences,
  onUpdateHistoriqueLicences,
  tenants,
  onUpdateTenants,
  risks,
  onUpdateRisks,
  actions,
  onUpdateActions,
  auditLogs,
  onUpdateAuditLogs,
  fonctions,
  onUpdateFonctions,
  users,
  onUpdateUsers,
  affectations,
  onUpdateAffectations,
  rules,
  onUpdateRules,
  accessProfiles,
  onUpdateAccessProfiles,
  auditMissions,
  onUpdateAuditMissions,
  auditFindings,
  onUpdateAuditFindings,
  complianceFrameworks,
  onUpdateComplianceFrameworks,
  complianceObligations,
  onUpdateComplianceObligations,
  complianceIncidents,
  onUpdateComplianceIncidents,
  onAddLog,
  onRestoreTenantData
}: SuperAdminModuleProps) {
  // Navigation tabs in SuperAdmin space
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tenants' | 'licences' | 'users' | 'backups' | 'supervision' | 'support' | 'supabase' | 'settings' | 'smtp'>('dashboard');

  // Gmail / SMTP Server Configuration & Testing States
  const [smtpForm, setSmtpForm] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: 'Sogesti GRC RiskFlow',
    fromEmail: '',
    enabled: true
  });
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message?: string; error?: string; suggestion?: string } | null>(null);
  const [smtpLogs, setSmtpLogs] = useState<any[]>([]);
  const [autoEmailAlerts, setAutoEmailAlerts] = useState({
    riskCritical: true,
    actionAssigned: true,
    auditLaunched: true,
    weeklyDigest: false
  });

  const fetchSmtpConfigAndLogs = async () => {
    try {
      const resCfg = await fetch('/api/email/config');
      if (resCfg.ok) {
        const data = await resCfg.json();
        setSmtpForm(prev => ({
          ...prev,
          host: data.host || 'smtp.gmail.com',
          port: data.port || 587,
          secure: Boolean(data.secure),
          user: data.user || '',
          pass: data.hasPass ? '••••••••••••••••' : prev.pass,
          fromName: data.fromName || 'Sogesti GRC RiskFlow',
          fromEmail: data.fromEmail || '',
          enabled: Boolean(data.enabled)
        }));
      }

      const resLogs = await fetch('/api/email/logs');
      if (resLogs.ok) {
        const dataLogs = await resLogs.json();
        if (dataLogs.logs) setSmtpLogs(dataLogs.logs);
      }
    } catch (e) {
      console.log('Backend email API initialized or running locally', e);
    }
  };

  useEffect(() => {
    fetchSmtpConfigAndLogs();
  }, []);

  const handleSaveSmtpConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/email/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...smtpForm,
          pass: smtpForm.pass.includes('•••') ? undefined : smtpForm.pass
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('✅ Configuration Gmail / SMTP enregistrée avec succès sur le serveur backend Express !', 'success');
        addSystemLog('Config SMTP', `Mise à jour des paramètres SMTP (${smtpForm.user})`, 'Succès');
        fetchSmtpConfigAndLogs();
      } else {
        triggerAlert(`Erreur : ${data.error || 'Échec de la sauvegarde'}`, 'error');
      }
    } catch (err: any) {
      triggerAlert(`Erreur réseau : ${err.message}`, 'error');
    }
  };

  const handleTestSmtpConnection = async () => {
    if (!smtpForm.user || (!smtpForm.pass && !smtpForm.pass.includes('•••'))) {
      triggerAlert('Veuillez renseigner votre adresse e-mail Gmail et votre mot de passe d\'application Google.', 'warning');
      return;
    }
    setIsTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmail: testEmailRecipient.trim() || undefined,
          host: smtpForm.host,
          port: smtpForm.port,
          secure: smtpForm.secure,
          user: smtpForm.user,
          pass: smtpForm.pass.includes('•••') ? undefined : smtpForm.pass,
          fromName: smtpForm.fromName,
          fromEmail: smtpForm.fromEmail || smtpForm.user
        })
      });

      const data = await res.json();
      setSmtpTestResult(data);

      if (data.success) {
        triggerAlert(data.message || '🎉 Connexion SMTP réussie !', 'success');
        addSystemLog('Test SMTP', `Test de connexion SMTP réussi pour ${smtpForm.user}`, 'Succès');
      } else {
        addSystemLog('Test SMTP', `Échec test connexion SMTP : ${data.error}`, 'Échec');
      }

      fetchSmtpConfigAndLogs();
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        error: `Erreur de communication backend : ${err.message}`,
        suggestion: 'Vérifiez que le serveur Express tourne sur le port 3000.'
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Secteurs d'activité customisables
  const [sectors, setSectors] = useState<string[]>(() => {
    const saved = localStorage.getItem('grc_superadmin_sectors');
    return saved ? JSON.parse(saved) : [
      "🌾 Agriculture et Agro-industrie",
      "🏭 Industrie et Manufacturier",
      "🛒 Commerce et Distribution",
      "🍽️ Restauration et Hôtellerie",
      "🏦 Banque Finance et Microfinance",
      "💻 Technologies de l'Information",
      "🏥 Pharmacie & Santé",
      "✈️ Aéronautique & Défense"
    ];
  });

  // Régions d'hébergement customisables
  const [regions, setRegions] = useState<string[]>(() => {
    const saved = localStorage.getItem('grc_superadmin_regions');
    return saved ? JSON.parse(saved) : [
      "Europe (Paris)",
      "Europe (Francfort)",
      "Afrique (Rabat)",
      "Afrique (Johannesbourg)",
      "Afrique de l'Ouest (Dakar)",
      "Afrique Centrale (Douala)",
      "US East (N. Virginia)"
    ];
  });

  useEffect(() => {
    localStorage.setItem('grc_superadmin_sectors', JSON.stringify(sectors));
  }, [sectors]);

  useEffect(() => {
    localStorage.setItem('grc_superadmin_regions', JSON.stringify(regions));
  }, [regions]);
  
  // SuperAdmin Role State
  const [currentRole, setCurrentRole] = useState<SuperAdminRole>('SuperAdministrateur technique');
  
  // MFA (Multi-Factor Authentication) State for Section 10.5
  const [mfaVerified, setMfaVerified] = useState<boolean>(() => {
    return sessionStorage.getItem('grc_superadmin_mfa') === 'true';
  });
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');

  // SuperAdmin Access Security Code (Default: 123456, fully customizable in Settings)
  const [superadminCode, setSuperadminCode] = useState<string>(() => {
    return localStorage.getItem('grc_superadmin_access_code') || '123456';
  });

  useEffect(() => {
    localStorage.setItem('grc_superadmin_access_code', superadminCode);
  }, [superadminCode]);

  // Form states for updating passcode in Settings
  const [oldCodeInput, setOldCodeInput] = useState('');
  const [newCodeInput, setNewCodeInput] = useState('');
  const [confirmCodeInput, setConfirmCodeInput] = useState('');
  
  // System Log trail (separate from functional tenant logs)
  const [systemLogs, setSystemLogs] = useState<{ id: string; timestamp: string; role: string; action: string; details: string; status: 'Succès' | 'Échec' | 'Alerte' }[]>(() => {
    const saved = localStorage.getItem('grc_syslogs19');
    return saved ? JSON.parse(saved) : [
      { id: 'sys1', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), role: 'SuperAdministrateur technique', action: 'Démarrage système', details: 'Déploiement de la version GRC v1.4.2 complété sur l\'infrastructure cloud.', status: 'Succès' },
      { id: 'sys2', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), role: 'SuperAdministrateur commercial / contractuel', action: 'Création Entreprise', details: 'Initialisation du tenant Pharmaco Group S.A. en statut Essai.', status: 'Succès' },
      { id: 'sys3', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), role: 'Support niveau 2', action: 'Diagnostic Lecture seule', details: 'Consultation diagnostic pour le ticket support #2819 de Sogesti International S.A.', status: 'Succès' },
    ];
  });

  // Save System Logs
  useEffect(() => {
    localStorage.setItem('grc_syslogs19', JSON.stringify(systemLogs));
  }, [systemLogs]);

  const addSystemLog = (action: string, details: string, status: 'Succès' | 'Échec' | 'Alerte' = 'Succès') => {
    const newLog = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      role: currentRole,
      action,
      details,
      status
    };
    setSystemLogs(prev => [newLog, ...prev]);
  };

  // Supabase Integration States
  const [dbUrl, setDbUrl] = useState(() => localStorage.getItem('supabase_url_override') || '');
  const [dbKey, setDbKey] = useState(() => localStorage.getItem('supabase_key_override') || '');
  const [connStatus, setConnStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [connMessage, setConnMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pushing' | 'pulling'>('idle');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [copiedSql, setCopiedSql] = useState(false);
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem('supabase_auto_sync') === 'true');

  useEffect(() => {
    const config = getSupabaseConfig();
    if (config.url && config.key) {
      testSupabaseConnection(config.url, config.key).then(res => {
        if (res.success) {
          setConnStatus('success');
          setConnMessage('Supabase connecté ! ' + (config.isOverridden ? '(Surcharges manuelles)' : '(Variables d\'environnement)'));
        } else {
          setConnStatus('error');
          setConnMessage(res.message);
        }
      });
    }
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(getSqlSchema());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!dbUrl || !dbKey) {
      setConnStatus('error');
      setConnMessage('Veuillez spécifier l\'URL Supabase et la clé d\'API Anon.');
      return;
    }
    setConnStatus('loading');
    setConnMessage('Test de la connexion en cours...');
    try {
      const result = await testSupabaseConnection(dbUrl, dbKey);
      if (result.success) {
        setConnStatus('success');
        localStorage.setItem('supabase_url_override', dbUrl);
        localStorage.setItem('supabase_key_override', dbKey);
        resetSupabaseClient();
        addSystemLog('Intégration Cloud', 'Connexion réussie à la base de données Supabase.', 'Succès');
      } else {
        setConnStatus('error');
      }
      setConnMessage(result.message);
    } catch (e: any) {
      setConnStatus('error');
      setConnMessage(`Erreur : ${e?.message || 'Identifiants invalides'}`);
    }
  };

  const handleClearConfig = () => {
    localStorage.removeItem('supabase_url_override');
    localStorage.removeItem('supabase_key_override');
    setDbUrl('');
    setDbKey('');
    setConnStatus('idle');
    setConnMessage('Configuration réinitialisée. Les variables d\'environnement système seront privilégiées.');
    resetSupabaseClient();
    addSystemLog('Intégration Cloud', 'Réinitialisation des configurations d\'accès à la base de données', 'Succès');
  };

  const handlePushData = async () => {
    const client = getSupabaseClient();
    if (!client) {
      triggerAlert('Erreur : Aucun client Supabase connecté. Veuillez configurer les accès.', "error");
      return;
    }
    setSyncStatus('pushing');
    setSyncLogs(['Début du transfert des tables...', 'Lecture des données locales...']);

    const dataset = {
      tenants: tenants || [],
      users: users || [],
      risks: risks || [],
      actions: actions || [],
      auditLogs: auditLogs || [],
      fonctions: fonctions || [],
      affectations: affectations || [],
      rules: rules || [],
      accessProfiles: accessProfiles || [],
      auditMissions: auditMissions || [],
      auditFindings: auditFindings || [],
      complianceFrameworks: complianceFrameworks || [],
      complianceObligations: complianceObligations || [],
      complianceIncidents: complianceIncidents || [],
      entreprises: entreprises || [],
      licences: licences || [],
      historiqueLicences: historiqueLicences || [],
    };

    try {
      const res = await pushAllToSupabase(client, dataset);
      if (res.success) {
        setSyncLogs(prev => [...prev, '✓ Données synchronisées avec succès sur Supabase (17 tables) !']);
        addSystemLog('Supabase Push', 'Transfert complet des données locales vers Supabase', 'Succès');
      } else {
        setSyncLogs(prev => [...prev, '⚠ Des erreurs ont été détectées :', ...res.messages]);
      }
    } catch (err: any) {
      setSyncLogs(prev => [...prev, `Erreur critique : ${err?.message || err}`]);
    } finally {
      setSyncStatus('idle');
    }
  };

  const handlePullData = async () => {
    const client = getSupabaseClient();
    if (!client) {
      triggerAlert('Erreur : Aucun client Supabase connecté. Veuillez configurer les accès.', "error");
      return;
    }
    setSyncStatus('pulling');
    setSyncLogs(['Début de la récupération des données...', 'Interrogation des tables cloud...']);

    try {
      const res = await pullAllFromSupabase(client);
      if (res.success && res.data) {
        const d = res.data;
        if (onUpdateTenants && d.tenants && d.tenants.length > 0) onUpdateTenants(d.tenants);
        if (onUpdateUsers && d.users && d.users.length > 0) onUpdateUsers(d.users);
        if (onUpdateRisks && d.risks && d.risks.length > 0) onUpdateRisks(d.risks);
        if (onUpdateActions && d.actions && d.actions.length > 0) onUpdateActions(d.actions);
        if (onUpdateAuditLogs && d.auditLogs && d.auditLogs.length > 0) onUpdateAuditLogs(d.auditLogs);
        if (onUpdateFonctions && d.fonctions && d.fonctions.length > 0) onUpdateFonctions(d.fonctions);
        if (onUpdateAffectations && d.affectations && d.affectations.length > 0) onUpdateAffectations(d.affectations);
        if (onUpdateRules && d.rules && d.rules.length > 0) onUpdateRules(d.rules);
        if (onUpdateAccessProfiles && d.accessProfiles && d.accessProfiles.length > 0) onUpdateAccessProfiles(d.accessProfiles);
        if (onUpdateAuditMissions && d.auditMissions && d.auditMissions.length > 0) onUpdateAuditMissions(d.auditMissions);
        if (onUpdateAuditFindings && d.auditFindings && d.auditFindings.length > 0) onUpdateAuditFindings(d.auditFindings);
        if (onUpdateComplianceFrameworks && d.complianceFrameworks && d.complianceFrameworks.length > 0) onUpdateComplianceFrameworks(d.complianceFrameworks);
        if (onUpdateComplianceObligations && d.complianceObligations && d.complianceObligations.length > 0) onUpdateComplianceObligations(d.complianceObligations);
        if (onUpdateComplianceIncidents && d.complianceIncidents && d.complianceIncidents.length > 0) onUpdateComplianceIncidents(d.complianceIncidents);
        if (onUpdateEntreprises && d.entreprises && d.entreprises.length > 0) onUpdateEntreprises(d.entreprises);
        if (onUpdateLicences && d.licences && d.licences.length > 0) onUpdateLicences(d.licences);
        if (onUpdateHistoriqueLicences && d.historiqueLicences && d.historiqueLicences.length > 0) onUpdateHistoriqueLicences(d.historiqueLicences);

        setSyncLogs(prev => [...prev, '✓ Récupération cloud réussie ! L\'ERP local a été mis à jour.']);
        addSystemLog('Supabase Pull', 'Synchronisation locale des données depuis Supabase', 'Succès');
      } else {
        setSyncLogs(prev => [...prev, `⚠ Échec : ${res.message}`]);
      }
    } catch (err: any) {
      setSyncLogs(prev => [...prev, `Erreur : ${err?.message || err}`]);
    } finally {
      setSyncStatus('idle');
    }
  };

  const handleToggleAutoSync = () => {
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    localStorage.setItem('supabase_auto_sync', String(nextVal));
    addSystemLog('Supabase Config', `Auto-Sync ${nextVal ? 'activé' : 'désactivé'}`, 'Succès');
  };

  // Diagnostic Mode states
  const [diagnosticTenantId, setDiagnosticTenantId] = useState<string>('');
  const [diagnosticReason, setDiagnosticReason] = useState('');
  const [diagnosticActive, setDiagnosticActive] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);

  // Modals / forms states
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showEditLicenceModal, setShowEditLicenceModal] = useState(false);
  const [selectedLicence, setSelectedLicence] = useState<Licence | null>(null);

  // Security & Workflow configuration states for tenants
  const [showWorkflowConfigModal, setShowWorkflowConfigModal] = useState(false);
  const [selectedConfigTenantId, setSelectedConfigTenantId] = useState<string | null>(null);
  const [tempWorkflowSteps, setTempWorkflowSteps] = useState<{ id: string; name: string; color: string; order: number }[]>([]);
  const [tempShowWorkflowFilter, setTempShowWorkflowFilter] = useState(false);
  
  // New Company form
  const [newCompany, setNewCompany] = useState({
    raisonSociale: '',
    secteurActivite: '🌾 Agriculture et Agro-industrie',
    specificationSecteur: '',
    regionHebergement: 'Europe (Paris)',
    contactPrincipal: '',
    typeAbonnement: 'Mensuel' as 'Mensuel' | 'Annuel' | 'Sur devis',
    maxUsers: 10,
    maxSuccursales: 5,
    maxDirections: 5,
    maxDepartements: 10,
    maxServices: 15,
    maxSitesLocaux: 5,
    maxFiliales: 5,
    modules: ['Cartographie', 'Plans d\'action'] as ('Cartographie' | 'Plans d\'action' | 'Audit' | 'Conformité' | 'Reporting' | 'Serveur SMTP')[],
    // extra company details
    pays: 'Cameroun',
    ville: 'Yaoundé',
    telephone: '',
    email: '',
    siteWeb: '',
    // contact admin details
    contactNom: '',
    contactPrenom: '',
    contactTitre: 'Directeur Général',
    contactTelephone: '',
    contactEmail: ''
  });

  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<EntrepriseCliente | null>(null);

  // SuperAdmin password update states
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [adminPasswordSuccess, setAdminPasswordSuccess] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');

  // Add client user states
  const [newClientUserName, setNewClientUserName] = useState('');
  const [newClientUserEmail, setNewClientUserEmail] = useState('');
  const [newClientUserPassword, setNewClientUserPassword] = useState('');
  const [newClientUserRole, setNewClientUserRole] = useState<'Analyste' | 'Responsable' | 'Risk Manager' | 'Direction'>('Analyste');
  const [newClientUserTenant, setNewClientUserTenant] = useState('tenant1');

  // Edit client user states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [editingUserEmail, setEditingUserEmail] = useState('');
  const [editingUserPassword, setEditingUserPassword] = useState('');
  const [editingUserRole, setEditingUserRole] = useState<'Analyste' | 'Responsable' | 'Risk Manager' | 'Direction' | 'SuperAdmin'>('Analyste');
  const [editingUserTenant, setEditingUserTenant] = useState('tenant1');

  const handleUpdateAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword) {
      setAdminPasswordError('Veuillez saisir un mot de passe.');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setAdminPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    onUpdateUsers(prev => prev.map(u => {
      if (u.role === 'SuperAdmin') {
        return { ...u, password: newAdminPassword };
      }
      return u;
    }));

    setNewAdminPassword('');
    setConfirmAdminPassword('');
    setAdminPasswordSuccess('Mot de passe SuperAdmin mis à jour avec succès !');
    setAdminPasswordError('');
    addSystemLog('Sécurité', 'Le mot de passe du SuperAdministrateur a été modifié.', 'Succès');
  };

  const handleAddClientUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientUserName || !newClientUserEmail || !newClientUserPassword) {
      triggerAlert("Veuillez remplir tous les champs obligatoires.", "warning");
      return;
    }

    // Validation : Vérification de l'unicité de l'adresse email
    const emailLower = newClientUserEmail.trim().toLowerCase();
    const emailExists = users.some(u => u.email.trim().toLowerCase() === emailLower);
    if (emailExists) {
      triggerAlert(`L'adresse email "${newClientUserEmail}" est déjà utilisée par un autre collaborateur de la plateforme.`, "error");
      addSystemLog('Habilitation', `Échec de création de l'utilisateur ${newClientUserName} : Email "${newClientUserEmail}" déjà existant.`, 'Échec');
      return;
    }

    const newUser = {
      id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: newClientUserName,
      email: newClientUserEmail,
      role: newClientUserRole,
      password: newClientUserPassword,
      tenantId: newClientUserTenant,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=80&fit=crop&q=80`
    };

    onUpdateUsers(prev => [...prev, newUser]);

    setNewClientUserName('');
    setNewClientUserEmail('');
    setNewClientUserPassword('');
    addSystemLog('Habilitation', `Création du compte d'accès client : ${newClientUserName} (${newClientUserRole})`, 'Succès');
    triggerAlert(`Compte client créé avec succès pour ${newClientUserName}.`, "success");
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserEmail || !editingUserName) {
      triggerAlert("Champs obligatoires manquants.", "warning");
      return;
    }

    // Validation : Vérification de l'unicité de l'adresse email (exclure l'utilisateur en cours d'édition)
    const emailLower = editingUserEmail.trim().toLowerCase();
    const emailExists = users.some(u => u.id !== editingUserId && u.email.trim().toLowerCase() === emailLower);
    if (emailExists) {
      triggerAlert(`L'adresse email "${editingUserEmail}" est déjà utilisée par un autre collaborateur de la plateforme.`, "error");
      addSystemLog('Habilitation', `Échec de modification de l'utilisateur : Email "${editingUserEmail}" déjà existant.`, 'Échec');
      return;
    }

    onUpdateUsers(prev => prev.map(u => {
      if (u.id === editingUserId) {
        return {
          ...u,
          name: editingUserName,
          email: editingUserEmail,
          password: editingUserPassword || u.password,
          role: editingUserRole,
          tenantId: editingUserTenant
        };
      }
      return u;
    }));

    addSystemLog('Habilitation', `Modification du compte d'accès client : ${editingUserName}`, 'Succès');
    setEditingUserId(null);
    triggerAlert('Modifications enregistrées avec succès.', "success");
  };

  const handleDeleteClientUser = (userId: string, userName: string) => {
    triggerConfirm(
      "Supprimer le compte utilisateur",
      `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${userName} ?`,
      () => {
        onUpdateUsers(prev => prev.filter(u => u.id !== userId));
        addSystemLog('Habilitation', `Suppression du compte d'accès client : ${userName}`, 'Succès');
        triggerAlert("Le compte utilisateur a été supprimé avec succès.", "success");
      }
    );
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterStatut, setFilterStatut] = useState('All');

  // Double validations
  const [doubleValidationTarget, setDoubleValidationTarget] = useState<{ type: 'delete' | 'restore'; id: string; name?: string } | null>(null);
  const [doubleValidationCode, setDoubleValidationCode] = useState('');

  // Canary deployment simulations (Section 10.3.5)
  const [canaryStatus, setCanaryStatus] = useState<'IDLE' | 'PROGRESS' | 'COMPLETED'>('IDLE');
  const [canaryProgress, setCanaryProgress] = useState(0);

  // Auto save database backup / restore
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [exportData, setExportData] = useState<string>('');

  const [clientBackups, setClientBackups] = useState<{
    id: string;
    companyId: string;
    companyName: string;
    timestamp: string;
    sizeBytes: number;
    data: any;
  }[]>(() => {
    const saved = localStorage.getItem('grc_client_backups_list');
    return saved ? JSON.parse(saved) : [
      {
        id: 'bk_preset_1',
        companyId: 'tenant1',
        companyName: 'Sogesti International S.A.',
        timestamp: '30/06/2026, 04:00:00',
        sizeBytes: 15420,
        data: null // Simulated backup
      },
      {
        id: 'bk_preset_2',
        companyId: 'tenant2',
        companyName: 'AeroTech France',
        timestamp: '29/06/2026, 00:00:00',
        sizeBytes: 24110,
        data: null // Simulated backup
      }
    ];
  });

  // Custom Alert and Confirm Dialog states to bypass iframe sandboxing restrictions on window.alert / window.confirm
  const [customAlert, setCustomAlert] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null);
  const [customConfirm, setCustomConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const triggerAlert = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setCustomAlert({ message, type });
  };

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomConfirm({ title, message, onConfirm });
  };

  // Handle SuperAdmin security passcode verification
  const handleVerifyMfa = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.trim() === superadminCode) {
      setMfaVerified(true);
      sessionStorage.setItem('grc_superadmin_mfa', 'true');
      setMfaError('');
      addSystemLog('Connexion MFA', 'Authentification à double facteur SuperAdministrateur validée avec succès.', 'Succès');
    } else {
      setMfaError('Code d\'accès incorrect. Saisissez votre code de sécurité à 6 chiffres ou modifiez-le dans vos paramètres.');
      addSystemLog('Connexion MFA', 'Échec de validation du code d\'accès SuperAdmin (code erroné).', 'Échec');
    }
  };

  const handleChangeSuperadminCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldCodeInput !== superadminCode) {
      triggerAlert("L'ancien code de sécurité est incorrect.", "error");
      return;
    }
    if (newCodeInput.length !== 6) {
      triggerAlert("Le nouveau code doit contenir exactement 6 chiffres.", "warning");
      return;
    }
    if (newCodeInput !== confirmCodeInput) {
      triggerAlert("Le nouveau code et sa confirmation ne correspondent pas.", "error");
      return;
    }

    setSuperadminCode(newCodeInput);
    setOldCodeInput('');
    setNewCodeInput('');
    setConfirmCodeInput('');
    triggerAlert("Le code de sécurité d'accès SuperAdmin a été mis à jour avec succès !", "success");
    addSystemLog('Sécurité SuperAdmin', 'Modification du code de sécurité d\'accès à l\'Espace SuperAdministrateur.', 'Succès');
  };

  const handleLogoutMfa = () => {
    setMfaVerified(false);
    sessionStorage.removeItem('grc_superadmin_mfa');
    addSystemLog('Déconnexion', 'Session SuperAdministrateur fermée.', 'Succès');
  };

  // Helper function to check role permission
  const hasPermission = (action: 'INFRA' | 'COMMERCIAL' | 'SUPPORT') => {
    return true; // Le SuperAdministrateur dispose de l'intégralité des privilèges sur tous les modules (Infra, Commercial et Support)
  };

  // 10.3.1 - Lifecycle Management
  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('COMMERCIAL')) {
      triggerAlert("Votre sous-rôle actuel ne vous autorise pas à réaliser des opérations commerciales.", "error");
      return;
    }

    const companyId = `tenant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const licenceId = `lic_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newCompanyObj: EntrepriseCliente = {
      id: companyId,
      raisonSociale: newCompany.raisonSociale,
      secteurActivite: newCompany.secteurActivite,
      specificationSecteur: newCompany.specificationSecteur,
      dateCreationCompte: new Date().toISOString().split('T')[0],
      statutCompte: 'Essai',
      regionHebergement: newCompany.regionHebergement,
      idContactPrincipal: `${newCompany.contactPrenom} ${newCompany.contactNom} (${newCompany.contactEmail})`,
      maxSuccursales: Number(newCompany.maxSuccursales || 5),
      maxDirections: Number(newCompany.maxDirections || 5),
      maxDepartements: Number(newCompany.maxDepartements || 10),
      maxServices: Number(newCompany.maxServices || 15),
      maxSitesLocaux: Number(newCompany.maxSitesLocaux || 5),
      maxFiliales: Number(newCompany.maxFiliales || 5),

      pays: newCompany.pays,
      ville: newCompany.ville,
      telephone: newCompany.telephone,
      email: newCompany.email,
      siteWeb: newCompany.siteWeb,

      contactNom: newCompany.contactNom,
      contactPrenom: newCompany.contactPrenom,
      contactTitre: newCompany.contactTitre,
      contactTelephone: newCompany.contactTelephone,
      contactEmail: newCompany.contactEmail
    };

    const newLicenceObj: Licence = {
      id: licenceId,
      entrepriseId: companyId,
      typeAbonnement: newCompany.typeAbonnement,
      nombreUtilisateursMax: Number(newCompany.maxUsers),
      nombreUtilisateursActuel: 1,
      modulesActives: newCompany.modules as any,
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: new Date(Date.now() + 3600000 * 24 * 30).toISOString().split('T')[0], // 30 days trial
      statutLicence: "En période d'essai",
      nombre_succursales_max: Number(newCompany.maxSuccursales || 5),
      nombre_succursales_actuel: 0,
      succursalesActives: true,
      depassementQuotaMode: 'blocage'
    };

    const newAdminUser = {
      id: `u_${Date.now()}_admin`,
      name: `${newCompany.contactPrenom} ${newCompany.contactNom}`,
      email: newCompany.contactEmail,
      role: 'Administrateur' as const,
      password: 'password123',
      tenantId: companyId
    };

    const newHist: HistoriqueLicence = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      licenceId: licenceId,
      typeChangement: 'Création',
      dateChangement: new Date().toISOString().split('T')[0],
      effectuePar: currentRole,
      details: `Création de l'entreprise ${newCompany.raisonSociale} avec offre ${newCompany.typeAbonnement} (${newCompany.maxUsers} max users). Succursales autorisées: ${newCompany.maxSuccursales}.`
    };

    // Standard Tenant Config initialization so the tenant actually exists and can be logged into!
    const newTenantConfig: TenantConfig = {
      id: companyId,
      companyName: newCompany.raisonSociale,
      logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&fit=crop&q=80',
      matrixSize: 4,
      scales: {
        frequency: [
          { value: 1, label: 'Exceptionnel', description: 'Occurrence quasi nulle (<1%) sur 2 ans' },
          { value: 2, label: 'Rare', description: 'Occurrence possible mais peu probable (1 à 10%) sur 2 ans' },
          { value: 3, label: 'Probable', description: 'Occurrence plausible (10 à 50%) sur 2 ans' },
          { value: 4, label: 'Fréquent', description: 'Occurrence quasi certaine (>50%) sur 2 ans' },
        ],
        impact: [
          { value: 1, label: 'Mineur', description: '<5% du résultat net annuel. Perturbation minimale, pas de communication.' },
          { value: 2, label: 'Significatif', description: '5% à 30% du résultat annuel. Communication défavorable locale, avertissement.' },
          { value: 3, label: 'Majeur', description: '30% à 50% du résultat annuel. Couverture large, blâme ou poursuite pénale.' },
          { value: 4, label: 'Critique', description: '>50% du résultat annuel. Retrait d\'agrément, destitution ou condamnation.' },
        ],
        control: [
          { value: 1, label: 'Maîtrisé', description: 'Règles écrites et détaillées, contrôles formalisés et appliqués à 100%' },
          { value: 2, label: 'Acceptable', description: 'Règles écrites à compléter, contrôles existants et à formaliser' },
          { value: 3, label: 'Insuffisant', description: 'Règles orales, contrôles partiels peu structurés' },
          { value: 4, label: 'Faible / Néant', description: 'Absence d\'éléments de maîtrise, aucune règle formalisée' },
        ],
      },
      formula: {
        id: 'f1',
        name: 'Formule IFACI Standard',
        expression: 'P * I * M',
        variables: [
          { name: 'P', label: 'Probabilité/Fréquence', min: 1, max: 4 },
          { name: 'I', label: 'Impact', min: 1, max: 4 },
          { name: 'M', label: 'Maîtrise/Contrôle', min: 1, max: 4 },
        ],
        description: 'Calcul par produit simple du score brut (P x I) puis risque net (Brut x Maîtrise). Échelle de 1 à 64.',
      },
      matrixThresholds: [
        { label: 'Risque faible', minScore: 0, maxScore: 6, color: 'bg-green-100 text-green-800 border-green-200', textColor: '#15803d', description: 'L\'impact sur l\'atteinte des objectifs n\'est pas préoccupant, le risque is sous contrôle.' },
        { label: 'Risque modéré', minScore: 6.1, maxScore: 18, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', textColor: '#a16207', description: 'L\'impact sur l\'atteinte des objectifs est limité. Des actions de suivi doivent être planifiées sans urgence accrue.' },
        { label: 'Risque significatif', minScore: 18.1, maxScore: 32, color: 'bg-orange-100 text-orange-800 border-orange-200', textColor: '#c2410c', description: 'L\'impact sur l\'atteinte des objectifs est significatif. Nécessité de prendre des actions immédiates.' },
        { label: 'Risque élevé', minScore: 32.1, maxScore: 64, color: 'bg-red-100 text-red-800 border-red-200', textColor: '#b91c1c', description: 'L\'impact est critique. Les objectifs ne seront très probablement pas atteints. Alerte direction immédiate.' },
      ],
      workflowSteps: [
        { id: 'w_brouillon', name: '📊 Brouillon', color: 'bg-gray-100 text-gray-800', order: 1 },
        { id: 'w_evaluation', name: '🔍 Évaluation en cours', color: 'bg-blue-100 text-blue-800', order: 2 },
        { id: 'w_validation', name: '⏳ Validation Responsable', color: 'bg-amber-100 text-amber-800', order: 3 },
        { id: 'w_approuve', name: '✅ Approuvé GRC', color: 'bg-green-100 text-green-800', order: 4 },
      ],
      categories: [
        { id: 'cat_finance', name: 'Risques Financiers', color: '#3b82f6', description: 'Pertes de chiffre d\'affaires, fraudes, créances douteuses, liquidités.' },
        { id: 'cat_operational', name: 'Risques Opérationnels', color: '#10b981', description: 'Pannes matérielles, logistique défaillante, erreurs humaines.' },
        { id: 'cat_it', name: 'Risques SI & Cybersécurité', color: '#8b5cf6', description: 'Piratages, fuites de données d\'entreprise, pannes de serveurs.' },
        { id: 'cat_regulatory', name: 'Risques Réglementaires & Juridiques', color: '#f59e0b', description: 'Non-conformité RGPD, amendes, poursuites judiciaires, audits défavorables.' },
        { id: 'cat_human', name: 'Risques Humains & RH', color: '#ec4899', description: 'Fuite des talents, grèves prolongées, doutes managériaux.' },
      ],
      entities: [
        { id: `e_${Date.now()}_DG`, name: `Direction Générale (${newCompany.raisonSociale})`, type: 'Direction' }
      ],
      showWorkflowFilter: true
    };

    onUpdateEntreprises(prev => [...prev, newCompanyObj]);
    onUpdateLicences(prev => [...prev, newLicenceObj]);
    onUpdateHistoriqueLicences(prev => [newHist, ...prev]);
    onUpdateUsers(prev => [...prev, newAdminUser]);
    if (onUpdateTenants) {
      onUpdateTenants(prev => [...prev, newTenantConfig]);
    }

    setShowAddCompanyModal(false);
    triggerAlert(`Entreprise "${newCompany.raisonSociale}" créée avec succès !`, "success");
    addSystemLog('Création Entreprise', `Initialisation réussie de l'entreprise : ${newCompany.raisonSociale}. Administrateur ${newAdminUser.name} créé d'office.`, 'Succès');
    
    // Reset form
    setNewCompany({
      raisonSociale: '',
      secteurActivite: '🌾 Agriculture et Agro-industrie',
      specificationSecteur: '',
      regionHebergement: 'Europe (Paris)',
      contactPrincipal: '',
      typeAbonnement: 'Mensuel',
      maxUsers: 10,
      maxSuccursales: 5,
      maxDirections: 5,
      maxDepartements: 10,
      maxServices: 15,
      maxSitesLocaux: 5,
      maxFiliales: 5,
      modules: ['Cartographie', 'Plans d\'action'],
      pays: 'Cameroun',
      ville: 'Yaoundé',
      telephone: '',
      email: '',
      siteWeb: '',
      contactNom: '',
      contactPrenom: '',
      contactTitre: 'Directeur Général',
      contactTelephone: '',
      contactEmail: ''
    });
  };

  const handleOpenEditCompany = (ent: EntrepriseCliente) => {
    if (!hasPermission('COMMERCIAL')) {
      triggerAlert("Privilèges d'administration commerciale requis pour modifier un compte client.", "error");
      return;
    }
    setEditingCompany({ 
      ...ent, 
      maxSuccursales: ent.maxSuccursales || 5,
      maxDirections: ent.maxDirections || 5,
      maxDepartements: ent.maxDepartements || 10,
      maxServices: ent.maxServices || 15,
      maxSitesLocaux: ent.maxSitesLocaux || 5,
      maxFiliales: ent.maxFiliales || 5
    });
    setShowEditCompanyModal(true);
  };

  const handleUpdateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany || !hasPermission('COMMERCIAL')) return;

    // Find the original company to get the previous contact email
    const originalCompany = entreprises.find(ent => ent.id === editingCompany.id);
    const prevEmail = originalCompany?.contactEmail?.trim().toLowerCase();

    // Update matching user(s) in global state
    if (onUpdateUsers) {
      onUpdateUsers(prevUsers => prevUsers.map(u => {
        const isMatch = u.tenantId === editingCompany.id && (
          (prevEmail && u.email?.trim().toLowerCase() === prevEmail) || 
          u.role === 'Administrateur'
        );
        if (isMatch) {
          return {
            ...u,
            name: `${editingCompany.contactPrenom || ''} ${editingCompany.contactNom || ''}`.trim() || u.name,
            email: editingCompany.contactEmail || u.email
          };
        }
        return u;
      }));
    }

    onUpdateEntreprises(prev => prev.map(c => {
      if (c.id === editingCompany.id) {
        addSystemLog('Modification Entreprise', `Mise à jour des informations pour l'entreprise ${editingCompany.raisonSociale}. Quotas modifiés.`, 'Succès');
        return { 
          ...editingCompany, 
          idContactPrincipal: `${editingCompany.contactPrenom || ''} ${editingCompany.contactNom || ''} (${editingCompany.contactEmail || ''})`.trim() || editingCompany.idContactPrincipal,
          maxSuccursales: Number(editingCompany.maxSuccursales || 5),
          maxDirections: Number(editingCompany.maxDirections || 5),
          maxDepartements: Number(editingCompany.maxDepartements || 10),
          maxServices: Number(editingCompany.maxServices || 15),
          maxSitesLocaux: Number(editingCompany.maxSitesLocaux || 5),
          maxFiliales: Number(editingCompany.maxFiliales || 5)
        };
      }
      return c;
    }));

    // Update matching TenantConfig companyName
    if (onUpdateTenants) {
      onUpdateTenants(prev => prev.map(t => {
        if (t.id === editingCompany.id) {
          return {
            ...t,
            companyName: editingCompany.raisonSociale
          };
        }
        return t;
      }));
    }

    triggerAlert("Informations de l'entreprise mises à jour avec succès !", "success");
    setShowEditCompanyModal(false);
    setEditingCompany(null);
  };

  const handleUpdateCompanyStatut = (id: string, newStatus: EntrepriseCliente['statutCompte']) => {
    if (!hasPermission('COMMERCIAL')) {
      triggerAlert("Droits commerciaux requis.", "error");
      return;
    }

    onUpdateEntreprises(prev => prev.map(ent => {
      if (ent.id === id) {
        addSystemLog('Modification Statut', `Passage de l'entreprise ${ent.raisonSociale} à l'état [${newStatus}]`, 'Succès');
        
        // Also update associated licence status appropriately
        onUpdateLicences(lics => lics.map(l => {
          if (l.entrepriseId === id) {
            let licStatut: Licence['statutLicence'] = 'Active';
            if (newStatus === 'Suspendu') licStatut = 'Suspendue';
            if (newStatus === 'Résilié') licStatut = 'Expirée';
            if (newStatus === 'Essai') licStatut = 'En période d\'essai';
            
            // Log history
            const newHist: HistoriqueLicence = {
              id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              licenceId: l.id,
              typeChangement: newStatus === 'Suspendu' ? 'Suspension' : 'Changement de palier',
              dateChangement: new Date().toISOString().split('T')[0],
              effectuePar: currentRole,
              details: `Statut entreprise modifié vers ${newStatus}. Statut licence aligné sur ${licStatut}.`
            };
            onUpdateHistoriqueLicences(h => [newHist, ...h]);

            return { ...l, statutLicence: licStatut };
          }
          return l;
        }));

        return { ...ent, statutCompte: newStatus };
      }
      return ent;
    }));
  };

  const handleDeleteCompanyRequest = (ent: EntrepriseCliente) => {
    if (!hasPermission('COMMERCIAL')) {
      triggerAlert("Droits requis.", "error");
      return;
    }
    setDoubleValidationTarget({ type: 'delete', id: ent.id, name: ent.raisonSociale });
    setDoubleValidationCode('');
  };

  const handleConfirmDeleteCompany = () => {
    if (doubleValidationCode !== 'SUPPRIMER') {
      triggerAlert('Veuillez saisir exactement le mot "SUPPRIMER" pour valider l\'opération irréversible.', "warning");
      return;
    }

    const companyId = doubleValidationTarget?.id;
    const companyName = doubleValidationTarget?.name;

    if (companyId) {
      onUpdateEntreprises(prev => prev.filter(ent => ent.id !== companyId));
      onUpdateLicences(prev => prev.filter(l => l.entrepriseId !== companyId));
      addSystemLog('Suppression Définitive', `Compte client [${companyName}] et toutes les licences associées ont été purgés.`, 'Succès');
    }

    setDoubleValidationTarget(null);
  };

  // 10.3.2 - Licence Management
  const handleOpenEditLicence = (lic: Licence) => {
    if (!hasPermission('COMMERCIAL')) {
      triggerAlert("Privilèges d'administration commerciale requis.", "error");
      return;
    }
    setSelectedLicence(lic);
    setShowEditLicenceModal(true);
  };

  const handleUpdateLicence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicence || !hasPermission('COMMERCIAL')) return;

    onUpdateLicences(prev => prev.map(l => {
      if (l.id === selectedLicence.id) {
        const company = entreprises.find(c => c.id === l.entrepriseId);
        
        // Log changes in history
        const newHist: HistoriqueLicence = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          licenceId: l.id,
          typeChangement: 'Changement de palier',
          dateChangement: new Date().toISOString().split('T')[0],
          effectuePar: currentRole,
          details: `Licence mise à jour: Max users=${selectedLicence.nombreUtilisateursMax}, Modules=[${selectedLicence.modulesActives.join(', ')}], Offre=${selectedLicence.typeAbonnement}`
        };
        onUpdateHistoriqueLicences(h => [newHist, ...h]);
        addSystemLog('Mise à jour Licence', `Paramètres de licence modifiés pour l'entreprise ${company?.raisonSociale || l.entrepriseId}`, 'Succès');

        return selectedLicence;
      }
      return l;
    }));

    setShowEditLicenceModal(false);
    setSelectedLicence(null);
  };

  const handleOpenWorkflowModal = (tenantId: string) => {
    const config = tenants.find(t => t.id === tenantId);
    if (!config) {
      triggerAlert("Configuration du tenant introuvable.", "error");
      return;
    }
    setSelectedConfigTenantId(tenantId);
    setTempWorkflowSteps(config.workflowSteps || []);
    setTempShowWorkflowFilter(!!config.showWorkflowFilter);
    setShowWorkflowConfigModal(true);
  };

  const handleSaveWorkflowConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfigTenantId) return;

    if (tempWorkflowSteps.length === 0) {
      triggerAlert("Le workflow doit contenir au moins une étape.", "error");
      return;
    }

    if (onUpdateTenants) {
      onUpdateTenants(prev => prev.map(t => {
        if (t.id === selectedConfigTenantId) {
          return {
            ...t,
            workflowSteps: tempWorkflowSteps.map((s, index) => ({ ...s, order: index + 1 })),
            showWorkflowFilter: tempShowWorkflowFilter
          };
        }
        return t;
      }));
    }

    addSystemLog('Sécurité', `Mise à jour de la sécurité et du workflow pour le tenant ID ${selectedConfigTenantId}. Filtre workflow: ${tempShowWorkflowFilter ? 'Activé' : 'Désactivé'}.`, 'Succès');
    triggerAlert("Configuration de sécurité et de workflow mise à jour avec succès !", "success");
    setShowWorkflowConfigModal(false);
    setSelectedConfigTenantId(null);
  };

  const handleAddTempStep = () => {
    const nextId = `step_${Date.now()}`;
    const nextOrder = tempWorkflowSteps.length + 1;
    setTempWorkflowSteps([
      ...tempWorkflowSteps,
      { id: nextId, name: '🆕 Nouvelle Étape', color: 'bg-indigo-100 text-indigo-800', order: nextOrder }
    ]);
  };

  const handleUpdateTempStep = (id: string, field: 'name' | 'color', value: string) => {
    setTempWorkflowSteps(tempWorkflowSteps.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleDeleteTempStep = (id: string) => {
    if (tempWorkflowSteps.length <= 1) {
      triggerAlert("Impossible de supprimer la dernière étape.", "error");
      return;
    }
    setTempWorkflowSteps(tempWorkflowSteps.filter(s => s.id !== id));
  };

  // 10.3.4 - Backup / Restore & Portability
  const handleExportData = (companyId: string) => {
    if (!hasPermission('INFRA')) {
      triggerAlert("Droits d'administration technique (INFRA) requis pour l'exportation des bases de données.", "error");
      return;
    }

    const company = entreprises.find(c => c.id === companyId);
    
    // Filter data relating to this tenant to construct a genuine SQL/JSON struct dump
    const tenantRisks = risks.filter(r => r.entityId.startsWith(companyId === 'tenant1' ? 'e1' : companyId === 'tenant2' ? 'e1' : 'none')); // approximation based on presets
    const tenantActions = actions.filter(a => tenantRisks.some(r => r.id === a.riskId));
    const tenantAuditLogs = auditLogs.filter(al => al.tenantId === companyId);
    
    const exportDump = {
      version: "GRC_EXPORT_v1.0",
      timestamp: new Date().toISOString(),
      exportedBy: currentRole,
      entreprise: company,
      tenantConfig: tenants.find(t => t.id === companyId),
      data: {
        risks: tenantRisks,
        actions: tenantActions,
        auditLogs: tenantAuditLogs,
      }
    };

    setExportData(JSON.stringify(exportDump, null, 2));
    addSystemLog('Export Données', `Sauvegarde complète à la demande générée avec succès pour l'entreprise : ${company?.raisonSociale}`, 'Succès');
  };

  const handleCreateClientBackup = (companyId: string) => {
    if (!hasPermission('INFRA')) {
      triggerAlert("Droits d'administration technique (INFRA) requis.", "error");
      return;
    }
    if (!companyId) {
      triggerAlert("Veuillez choisir une entreprise.", "warning");
      return;
    }
    const company = entreprises.find(c => c.id === companyId);
    if (!company) return;

    const companyTenant = tenants.find(t => t.id === companyId);
    const tenantEntities = companyTenant?.entities?.map((e: any) => e.id) || [];
    
    const companyUsers = users.filter(u => u.tenantId === companyId);
    const companyRisks = risks.filter(r => r.entityId && (r.entityId.startsWith(companyId) || tenantEntities.includes(r.entityId)));
    const companyActions = actions.filter(a => companyRisks.some(r => r.id === a.riskId));
    const companyRules = rules.filter(ru => ru.entityId && (ru.entityId.startsWith(companyId) || tenantEntities.includes(ru.entityId)));
    const companyAuditLogs = auditLogs.filter(l => l.tenantId === companyId);
    const companyLicences = licences.filter(l => l.entrepriseId === companyId);

    const backupPayload = {
      companyId,
      company,
      tenantConfig: companyTenant,
      users: companyUsers,
      risks: companyRisks,
      actions: companyActions,
      rules: companyRules,
      auditLogs: companyAuditLogs,
      licences: companyLicences,
    };

    const newBackup = {
      id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      companyId,
      companyName: company.raisonSociale,
      timestamp: new Date().toLocaleString('fr-FR'),
      sizeBytes: JSON.stringify(backupPayload).length,
      data: backupPayload
    };

    const updated = [newBackup, ...clientBackups];
    setClientBackups(updated);
    localStorage.setItem('grc_client_backups_list', JSON.stringify(updated));
    
    addSystemLog('Backup Client', `Sauvegarde complète créée avec succès pour l'entreprise : ${company.raisonSociale}`, 'Succès');
    triggerAlert(`Sauvegarde créée avec succès pour "${company.raisonSociale}" ! Elle est stockée de manière persistante.`, "success");
  };

  const handleRestoreClientBackup = (backupId: string) => {
    if (!hasPermission('INFRA')) {
      triggerAlert("Droits d'administration technique (INFRA) requis.", "error");
      return;
    }

    const backup = clientBackups.find(b => b.id === backupId);
    if (!backup) return;

    if (!backup.data) {
      triggerConfirm(
        "Restauration de snapshot simulé",
        `Attention : Restaurer ce snapshot simulé "${backup.companyName}" (${backup.timestamp}) va réinitialiser ses données de production par défaut. Voulez-vous continuer ?`,
        () => {
          addSystemLog('Restauration Système', `Données du tenant [${backup.companyName}] restaurées à partir du snapshot.`, 'Succès');
          triggerAlert(`Les données pour "${backup.companyName}" ont été réinitialisées avec succès.`, "success");
        }
      );
      return;
    }

    const { companyId, company, tenantConfig, users: bkUsers, risks: bkRisks, actions: bkActions, rules: bkRules, auditLogs: bkLogs, licences: bkLicences } = backup.data;

    triggerConfirm(
      "ATTENTION - CONFIRMATION DE RESTAURATION",
      `ATTENTION DANGER : Vous allez écraser l'intégralité des données en production de l'entreprise "${backup.companyName}". Cette action est irréversible et écrasera tous les risques, règles et plans d'actions en cours. Êtes-vous sûr de vouloir continuer ?`,
      () => {
        if (onUpdateEntreprises && company) {
          onUpdateEntreprises(prev => prev.map(e => e.id === companyId ? company : e));
        }
        if (onUpdateTenants && tenantConfig) {
          onUpdateTenants(prev => prev.map(t => t.id === companyId ? tenantConfig : t));
        }
        if (onUpdateUsers && bkUsers) {
          onUpdateUsers(prev => [
            ...prev.filter(u => u.tenantId !== companyId),
            ...bkUsers
          ]);
        }
        if (onUpdateRisks && bkRisks) {
          const tenantEntities = tenantConfig?.entities?.map((e: any) => e.id) || [];
          onUpdateRisks(prev => [
            ...prev.filter(r => !tenantEntities.includes(r.entityId) && !r.entityId.startsWith(companyId)),
            ...bkRisks
          ]);
        }
        if (onUpdateActions && bkActions) {
          onUpdateActions(prev => [
            ...prev.filter(a => !bkActions.some((ba: any) => ba.id === a.id)),
            ...bkActions
          ]);
        }
        if (onUpdateRules && bkRules) {
          const tenantEntities = tenantConfig?.entities?.map((e: any) => e.id) || [];
          onUpdateRules(prev => [
            ...prev.filter(ru => !tenantEntities.includes(ru.entityId) && !ru.entityId.startsWith(companyId)),
            ...bkRules
          ]);
        }
        if (onUpdateAuditLogs && bkLogs) {
          onUpdateAuditLogs(prev => [
            ...prev.filter(l => l.tenantId !== companyId),
            ...bkLogs
          ]);
        }
        if (onUpdateLicences && bkLicences) {
          onUpdateLicences(prev => [
            ...prev.filter(l => l.entrepriseId !== companyId),
            ...bkLicences
          ]);
        }

        addSystemLog('Restauration Système', `Données restaurées avec succès pour l'entreprise : ${backup.companyName}`, 'Succès');
        triggerAlert(`Restauration complète effectuée avec succès pour l'entreprise "${backup.companyName}". Toutes les configurations GRC et données associées ont été restaurées.`, "success");
      }
    );
  };

  const handleDeleteClientBackup = (backupId: string) => {
    if (!hasPermission('INFRA')) {
      triggerAlert("Droits d'administration technique (INFRA) requis.", "error");
      return;
    }
    const backup = clientBackups.find(b => b.id === backupId);
    if (!backup) return;

    triggerConfirm(
      "Supprimer définitivement la sauvegarde",
      `Voulez-vous supprimer définitivement ce snapshot pour "${backup.companyName}" du ${backup.timestamp} ?`,
      () => {
        const updated = clientBackups.filter(b => b.id !== backupId);
        setClientBackups(updated);
        localStorage.setItem('grc_client_backups_list', JSON.stringify(updated));
        addSystemLog('Suppression Backup', `Snapshot du ${backup.timestamp} supprimé pour l'entreprise ${backup.companyName}`, 'Succès');
        triggerAlert("Snapshot supprimé de l'historique.", "success");
      }
    );
  };

  const handleSimulateRestore = (companyId: string) => {
    if (!hasPermission('INFRA')) {
      triggerAlert("Droits d'administration technique (INFRA) requis.", "error");
      return;
    }
    const company = entreprises.find(c => c.id === companyId);
    setDoubleValidationTarget({ type: 'restore', id: companyId, name: company?.raisonSociale });
    setDoubleValidationCode('');
  };

  const handleConfirmRestore = () => {
    if (doubleValidationCode !== 'RESTAURER') {
      triggerAlert('Veuillez saisir "RESTAURER" pour confirmer l\'écrasement des données de production.', "warning");
      return;
    }

    // Simulate restoring from a backup
    addSystemLog('Restauration Système', `Données du tenant [${doubleValidationTarget?.name}] restaurées à partir du dernier snapshot planifié.`, 'Succès');
    triggerAlert(`Les données de production pour l'entreprise "${doubleValidationTarget?.name}" ont été restaurées avec succès.`, "success");
    setDoubleValidationTarget(null);
  };

  // 10.3.5 - Canary Update deployment
  const handleTriggerCanaryUpdate = () => {
    if (!hasPermission('INFRA')) {
      triggerAlert("Droits d'administration technique (INFRA) requis.", "error");
      return;
    }

    setCanaryStatus('PROGRESS');
    setCanaryProgress(10);
    addSystemLog('Mise à jour Canary', 'Déploiement progressif du correctif de sécurité GRC-2026-09 au lot d\'entreprises "Essai" initié.', 'Succès');

    const interval = setInterval(() => {
      setCanaryProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCanaryStatus('COMPLETED');
          addSystemLog('Mise à jour Canary', 'Mise à jour appliquée à 100% sur l\'ensemble des nœuds de la plateforme.', 'Succès');
          return 100;
        }
        return prev + 30;
      });
    }, 800);
  };

  // 10.3.6 - Diagnostic Read-Only Support Mode
  const handleActivateDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('SUPPORT')) {
      triggerAlert("Droits de diagnostic et de support requis.", "error");
      return;
    }

    if (!diagnosticTenantId || !diagnosticReason.trim()) {
      triggerAlert("Veuillez sélectionner une entreprise et spécifier le motif du diagnostic.", "warning");
      return;
    }

    const company = entreprises.find(c => c.id === diagnosticTenantId);
    
    setDiagnosticActive(true);
    // Simulate diagnostic system loading logs
    setDiagnosticLogs([
      `[${new Date().toLocaleTimeString()}] Connexion sécurisée au diagnostic tenant [${company?.raisonSociale}] établie.`,
      `[${new Date().toLocaleTimeString()}] MODE DIAGNOSTIC LECTURE SEULE ACTIF - Droits d'écriture suspendus pour la sécurité.`,
      `[${new Date().toLocaleTimeString()}] Récupération des logs d'audit fonctionnels du client...`,
      `[${new Date().toLocaleTimeString()}] Analyse de conformité du moteur de règles du client...`,
      `[${new Date().toLocaleTimeString()}] Total de ${risks.length} fiches de risques inspectées.`,
      `[${new Date().toLocaleTimeString()}] Aucune anomalie de base de données détectée.`
    ]);

    addSystemLog('Accès Diagnostic', `Mode diagnostic ouvert pour [${company?.raisonSociale}] - Motif : ${diagnosticReason}`, 'Succès');
  };

  // Filter companies list
  const filteredCompanies = entreprises.filter(ent => {
    const matchesSearch = ent.raisonSociale.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ent.secteurActivite.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = filterRegion === 'All' || ent.regionHebergement === filterRegion;
    const matchesStatut = filterStatut === 'All' || ent.statutCompte === filterStatut;
    return matchesSearch && matchesRegion && matchesStatut;
  });

  // KPI Calculations (Section 10.3.3)
  const totalClients = entreprises.length;
  const trialClients = entreprises.filter(c => c.statutCompte === 'Essai').length;
  const activeClients = entreprises.filter(c => c.statutCompte === 'Actif').length;
  const suspendedClients = entreprises.filter(c => c.statutCompte === 'Suspendu').length;
  const renewalRate = 94.8; // Simulated aggregate metric

  // Modules distribution metric counts
  const modulesCounts = {
    Cartographie: licences.filter(l => l.modulesActives.includes('Cartographie')).length,
    Plans: licences.filter(l => l.modulesActives.includes('Plans de traitement' as any) || l.modulesActives.includes('Plans d\'action')).length,
    Audit: licences.filter(l => l.modulesActives.includes('Audit')).length,
    Conformite: licences.filter(l => l.modulesActives.includes('Conformité')).length,
    Reporting: licences.filter(l => l.modulesActives.includes('Reporting')).length,
  };

  if (!mfaVerified) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500"></div>
          
          <div className="flex flex-col items-center text-center space-y-4 pt-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-500">
              <Lock className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Accès Espace SuperAdministrateur</h2>
              <p className="text-slate-400 text-[11px]">
                Pour des raisons de sécurité, l'accès à la console d'administration de la plateforme requiert une double authentification.
              </p>
            </div>

            <div className="w-full bg-slate-950 rounded-lg p-3 border border-slate-800 text-left space-y-2">
              <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Code d'Accès Sécurisé</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Veuillez saisir votre code de sécurité à 6 chiffres pour accéder à la console. Vous pouvez modifier ce code à tout moment dans l'onglet <strong>Paramètres</strong> de votre espace.
              </p>
            </div>

            <form onSubmit={handleVerifyMfa} className="w-full space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Code à 6 chiffres</label>
                <input 
                  type="password"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-center text-lg font-mono tracking-widest text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {mfaError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-[11px] text-left flex items-start space-x-1.5">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{mfaError}</span>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded text-xs transition-colors flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Valider l'Authentification</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-950 text-slate-100">
      
      {/* Unified High-Density SuperAdmin Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Side: Brand and Tabs */}
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-400">
              <Settings className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">Console SuperAdmin</h1>
              <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Multi-Tenant</p>
            </div>
          </div>

          {/* Navigation Ribbon on the same line */}
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none border-l border-slate-800 pl-4 h-8">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded transition-colors whitespace-nowrap ${
                activeTab === 'dashboard' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tableau de Bord Global
            </button>
            <button 
              onClick={() => setActiveTab('tenants')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded transition-colors whitespace-nowrap ${
                activeTab === 'tenants' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entreprises Clientes
            </button>
            <button 
              onClick={() => setActiveTab('licences')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded transition-colors whitespace-nowrap ${
                activeTab === 'licences' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Licences & Contrats
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded transition-colors whitespace-nowrap ${
                activeTab === 'users' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔑 Comptes Accès Clients
            </button>
            <button 
              onClick={() => setActiveTab('backups')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded transition-colors whitespace-nowrap ${
                activeTab === 'backups' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sauvegardes & Restitution
            </button>
            <button 
              onClick={() => setActiveTab('supervision')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded transition-colors whitespace-nowrap ${
                activeTab === 'supervision' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Supervision Technique
            </button>
            <button 
              onClick={() => setActiveTab('support')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded transition-colors whitespace-nowrap ${
                activeTab === 'support' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diagnostic & Support
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded transition-colors whitespace-nowrap ${
                activeTab === 'settings' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚙ Paramètres
            </button>
            <button 
              onClick={() => setActiveTab('supabase')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded transition-colors whitespace-nowrap ${
                activeTab === 'supabase' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ☁ Intégration Supabase
            </button>
            <button 
              onClick={() => {
                setActiveTab('smtp');
                fetchSmtpConfigAndLogs();
              }}
              className={`px-3 py-1.5 text-[11px] font-bold rounded transition-colors whitespace-nowrap ${
                activeTab === 'smtp' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📧 Serveur SMTP / Gmail
            </button>
          </div>
        </div>

        {/* Right Side: Role Selector and Session Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Habilitation :</span>
            <select
              value={currentRole}
              onChange={(e) => {
                const newRole = e.target.value as SuperAdminRole;
                setCurrentRole(newRole);
                addSystemLog('Changement Privilèges', `Basculé vers le profil de droits : ${newRole}`, 'Succès');
              }}
              className="bg-transparent text-[11px] text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="SuperAdministrateur technique" className="bg-slate-900">⚙️ Technique</option>
              <option value="SuperAdministrateur commercial / contractuel" className="bg-slate-900">💼 Commercial</option>
              <option value="Support niveau 2" className="bg-slate-900">🛠️ Support L2</option>
            </select>
          </div>

          <button 
            onClick={handleLogoutMfa}
            className="bg-slate-950 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded text-[11px] flex items-center space-x-1.5 transition-all"
          >
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <span>Fermer Session</span>
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ==================== TAB: DASHBOARD ==================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Statistics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Clients de la Plateforme</p>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-2xl font-bold text-white">{totalClients}</span>
                  <span className="text-[10px] text-emerald-400 font-medium">SaaS Multi-tenant</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Comptes Actifs</p>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-2xl font-bold text-emerald-400">{activeClients}</span>
                  <span className="text-[10px] text-slate-500">Abonnements actifs</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Comptes d'Essai</p>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-2xl font-bold text-indigo-400">{trialClients}</span>
                  <span className="text-[10px] text-slate-500">Prospects</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Comptes Suspendus</p>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-2xl font-bold text-red-400">{suspendedClients}</span>
                  <span className="text-[10px] text-slate-500">Blocage impayés</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg col-span-2 lg:col-span-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Taux de Renouvellement</p>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-2xl font-bold text-white">{renewalRate}%</span>
                  <span className="text-[10px] text-emerald-400 font-medium">Trimestriel</span>
                </div>
              </div>
            </div>

            {/* Alertes Opérationnelles & Distribution Modules */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Alertes Opérationnelles */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Alertes d'exploitation et d'usage</span>
                  </h3>
                  <span className="bg-slate-950 text-slate-400 px-2 py-0.5 rounded text-[10px] font-mono">Actives</span>
                </div>

                <div className="space-y-3">
                  {/* Real simulated quota alert */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start space-x-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white">Quotas d'utilisateurs proches du plafond - Sogesti</p>
                      <p className="text-slate-400 text-[11px]">
                        L'entreprise Sogesti International S.A. approche de sa limite contractuelle (<strong>45</strong> utilisateurs enregistrés sur un plafond de <strong>50</strong>).
                      </p>
                      <button 
                        onClick={() => {
                          const lic = licences.find(l => l.entrepriseId === 'tenant1');
                          if (lic) handleOpenEditLicence(lic);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-bold text-[10px] tracking-wide"
                      >
                        Ajuster le palier contractuel &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Suspended alert */}
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white">Facturation en défaut - Global Retail Corp</p>
                      <p className="text-slate-400 text-[11px]">
                        L'accès au portail de l'entreprise Global Retail Corp est actuellement suspendu temporairement.
                      </p>
                      <button 
                        onClick={() => handleUpdateCompanyStatut('tenant4', 'Actif')}
                        className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] tracking-wide"
                      >
                        Réactiver le compte suite à régularisation &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Trial ending alert */}
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-start space-x-3">
                    <AlertTriangle className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white">Fin de période d'essai imminente - Pharmaco Group S.A.</p>
                      <p className="text-slate-400 text-[11px]">
                        La période d'essai de Pharmaco Group S.A. expire dans 2 jours. Aucune carte bancaire n'est enregistrée.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Distribution Modules souscrits */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm">Modules les plus souscrits</h3>
                </div>

                <div className="space-y-3.5 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">Cartographie des risques</span>
                      <span className="text-indigo-400 font-bold">{modulesCounts.Cartographie} / {totalClients}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${(modulesCounts.Cartographie / totalClients) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">Plans d'action</span>
                      <span className="text-indigo-400 font-bold">{modulesCounts.Plans} / {totalClients}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(modulesCounts.Plans / totalClients) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">Rapports & Indicateurs (KRI)</span>
                      <span className="text-indigo-400 font-bold">{modulesCounts.Reporting} / {totalClients}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(modulesCounts.Reporting / totalClients) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">Audit interne</span>
                      <span className="text-indigo-400 font-bold">{modulesCounts.Audit} / {totalClients}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${(modulesCounts.Audit / totalClients) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">Conformité réglementaire</span>
                      <span className="text-indigo-400 font-bold">{modulesCounts.Conformite} / {totalClients}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: `${(modulesCounts.Conformite / totalClients) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sécurité du Compte SuperAdmin */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Sécurité & Clé SuperAdmin</span>
                  </h3>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded font-mono">vito</span>
                </div>

                <form onSubmit={handleUpdateAdminPassword} className="space-y-3.5">
                  {adminPasswordSuccess && (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[11px] font-medium">
                      {adminPasswordSuccess}
                    </div>
                  )}
                  {adminPasswordError && (
                    <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[11px] font-medium">
                      {adminPasswordError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Nouveau Mot de Passe SuperAdmin</label>
                    <input 
                      type="password"
                      required
                      placeholder="Saisissez le nouveau mot de passe..."
                      value={newAdminPassword}
                      onChange={(e) => {
                        setNewAdminPassword(e.target.value);
                        setAdminPasswordSuccess('');
                        setAdminPasswordError('');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Confirmer le Mot de Passe</label>
                    <input 
                      type="password"
                      required
                      placeholder="Retapez le mot de passe..."
                      value={confirmAdminPassword}
                      onChange={(e) => {
                        setConfirmAdminPassword(e.target.value);
                        setAdminPasswordSuccess('');
                        setAdminPasswordError('');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded shadow transition text-xs cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <span>Sauvegarder la Clé d'Accès</span>
                  </button>
                </form>
              </div>

            </div>

            {/* Journaux Système récents */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Dernières actions du SuperAdministrateur (Immuables)</span>
                </h3>
                <span className="bg-slate-950 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                  Syslog Immuable
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2">Horodatage</th>
                      <th className="py-2">Habilité</th>
                      <th className="py-2">Action</th>
                      <th className="py-2">Détails</th>
                      <th className="py-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {systemLogs.slice(0, 5).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/50">
                        <td className="py-2.5 font-mono text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 font-semibold text-slate-300">{log.role}</td>
                        <td className="py-2.5 text-indigo-400 font-medium">{log.action}</td>
                        <td className="py-2.5 text-slate-400 max-w-sm truncate">{log.details}</td>
                        <td className="py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            log.status === 'Succès' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                            log.status === 'Échec' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: TENANTS ==================== */}
        {activeTab === 'tenants' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrer par raison sociale, secteur..."
                    className="bg-slate-900 border border-slate-800 text-xs text-white rounded pl-9 pr-3 py-2 w-64 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>

                {/* Filters */}
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded px-3 py-2 focus:outline-none"
                >
                  <option value="All">Toutes les régions</option>
                  <option value="Europe (Paris)">Europe (Paris)</option>
                  <option value="Europe (Francfort)">Europe (Francfort)</option>
                  <option value="US East (N. Virginia)">US East (N. Virginia)</option>
                </select>

                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded px-3 py-2 focus:outline-none"
                >
                  <option value="All">Tous les statuts</option>
                  <option value="Actif">Actif</option>
                  <option value="Essai">Période d'essai</option>
                  <option value="Suspendu">Suspendu</option>
                </select>
              </div>

              {/* Action Button */}
              {hasPermission('COMMERCIAL') && (
                <button
                  onClick={() => setShowAddCompanyModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer une Entreprise Cliente (Tenant)</span>
                </button>
              )}
            </div>

            {/* List of Tenants */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Entreprises clientes inscrites</h3>
              </div>

              <div className="divide-y divide-slate-800">
                {filteredCompanies.map((ent) => {
                  const associatedLicence = licences.find(l => l.entrepriseId === ent.id);
                  return (
                    <div key={ent.id} className="p-4 hover:bg-slate-850/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white">{ent.raisonSociale}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ent.statutCompte === 'Actif' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            ent.statutCompte === 'Essai' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {ent.statutCompte === 'Actif' ? 'Actif' : ent.statutCompte === 'Essai' ? 'Essai' : 'Suspendu'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-[11px] text-slate-400">
                          <p>Secteur : <span className="text-slate-300 font-medium">{ent.secteurActivite}</span></p>
                          <p>Hébergement : <span className="text-slate-300 font-medium font-mono text-[10px]">{ent.regionHebergement}</span></p>
                          <p>Création : <span className="text-slate-300 font-medium">{ent.dateCreationCompte}</span></p>
                          <p>Contact : <span className="text-slate-300 font-medium">{ent.idContactPrincipal}</span></p>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] bg-slate-950/80 p-1.5 rounded border border-slate-800 mt-1.5 text-slate-400 font-mono">
                          <span>🚪 Succursales : <strong className="text-amber-400 font-bold">{ent.maxSuccursales || 5}</strong></span>
                          <span>🧭 Directions : <strong className="text-blue-400 font-bold">{ent.maxDirections || 5}</strong></span>
                          <span>🏢 Départements : <strong className="text-indigo-400 font-bold">{ent.maxDepartements || 10}</strong></span>
                          <span>🔧 Services : <strong className="text-purple-400 font-bold">{ent.maxServices || 15}</strong></span>
                          <span>📍 Sites Locaux : <strong className="text-teal-400 font-bold">{ent.maxSitesLocaux || 5}</strong></span>
                          <span>🏛️ Filiales : <strong className="text-pink-400 font-bold">{ent.maxFiliales || 5}</strong></span>
                        </div>
                      </div>

                      {/* Associated Licence Summary & Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-[11px] space-y-0.5">
                          <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">Abonnement</p>
                          <p className="text-slate-200 font-medium">
                            {associatedLicence ? `${associatedLicence.typeAbonnement} (${associatedLicence.nombreUtilisateursMax} max users)` : 'Aucune licence'}
                          </p>
                        </div>

                        {/* Lifecycle buttons */}
                        <div className="flex items-center space-x-1">
                          {hasPermission('COMMERCIAL') && (
                            <>
                              <button
                                onClick={() => handleOpenEditCompany(ent)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded text-[10px] font-bold transition flex items-center space-x-1"
                                title="Modifier l'entreprise et ses limites"
                              >
                                ✏️ Modifier
                              </button>

                              {ent.statutCompte === 'Suspendu' ? (
                                <button
                                  onClick={() => handleUpdateCompanyStatut(ent.id, 'Actif')}
                                  className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 px-2 py-1.5 rounded text-[10px] font-bold"
                                  title="Réactiver l'accès au portail"
                                >
                                  Réactiver
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateCompanyStatut(ent.id, 'Suspendu')}
                                  className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-1.5 rounded text-[10px] font-bold"
                                  title="Suspendre temporairement l'accès"
                                >
                                  Suspendre
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenWorkflowModal(ent.id)}
                                className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 px-2.5 py-1.5 rounded text-[10px] font-bold transition flex items-center space-x-1"
                                title="Gérer la sécurité et le workflow"
                              >
                                <Settings className="w-3.5 h-3.5" />
                                <span>Sécurité & Workflow</span>
                              </button>
                              
                              <button
                                onClick={() => handleDeleteCompanyRequest(ent)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 p-1.5 rounded"
                                title="Suppression définitive du compte client"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredCompanies.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Aucune entreprise cliente ne correspond aux filtres appliqués.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: COMPTES ACCES CLIENTS ==================== */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Formulaire de création / édition */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm">
                    {editingUserId ? "✏️ Modifier le Compte Client" : "➕ Nouveau Compte Client"}
                  </h3>
                  <p className="text-slate-400 text-[10px] mt-0.5">
                    Configurez un identifiant d'accès pour un client. L'utilisateur pourra ensuite modifier ses identifiants depuis son profil.
                  </p>
                </div>

                <form onSubmit={editingUserId ? handleSaveEditUser : handleAddClientUser} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Nom Complet du Collaborateur</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex : Jean-Pierre Ndzana"
                      value={editingUserId ? editingUserName : newClientUserName}
                      onChange={(e) => editingUserId ? setEditingUserName(e.target.value) : setNewClientUserName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Adresse Email (Identifiant / Login)</label>
                    <input 
                      type="email"
                      required
                      placeholder="Ex : j.dupont@entreprise.com"
                      value={editingUserId ? editingUserEmail : newClientUserEmail}
                      onChange={(e) => editingUserId ? setEditingUserEmail(e.target.value) : setNewClientUserEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      {editingUserId ? "Mot de passe (Laisser vide pour ne pas modifier)" : "Mot de passe Initial"}
                    </label>
                    <input 
                      type="text"
                      required={!editingUserId}
                      placeholder={editingUserId ? "••••••••" : "Saisissez un mot de passe temporaire..."}
                      value={editingUserId ? editingUserPassword : newClientUserPassword}
                      onChange={(e) => editingUserId ? setEditingUserPassword(e.target.value) : setNewClientUserPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Rattaché à l'Entreprise</label>
                    <select
                      value={editingUserId ? editingUserTenant : newClientUserTenant}
                      onChange={(e) => editingUserId ? setEditingUserTenant(e.target.value) : setNewClientUserTenant(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.companyName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Rôle Applicatif</label>
                    <select
                      value={editingUserId ? editingUserRole : newClientUserRole}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        editingUserId ? setEditingUserRole(val) : setNewClientUserRole(val);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Analyste">Analyste (Lecture seule / Saisie des risques)</option>
                      <option value="Responsable">Responsable de division (Validation d'évaluations)</option>
                      <option value="Risk Manager">Risk Manager (Création, cotations & plans d'actions)</option>
                      <option value="Direction">Direction (Tableau de bord et rapports décisionnels)</option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded shadow text-xs transition cursor-pointer"
                    >
                      {editingUserId ? "Enregistrer les modifications" : "Créer le compte d'accès"}
                    </button>
                    {editingUserId && (
                      <button
                        type="button"
                        onClick={() => setEditingUserId(null)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-xs transition"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Liste des comptes clients actifs */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 xl:col-span-2 space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Habilitations & Identifiants Actifs</h3>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      Tous les comptes d'accès configurés pour les entreprises de la plateforme.
                    </p>
                  </div>
                  <span className="bg-slate-950 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                    {users.filter(u => u.role !== 'SuperAdmin').length} Comptes clients
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold">
                        <th className="py-2.5">Utilisateur</th>
                        <th className="py-2.5">Email (Login ID)</th>
                        <th className="py-2.5">Mot de Passe actuel</th>
                        <th className="py-2.5">Entreprise rattachée</th>
                        <th className="py-2.5">Rôle</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {users.filter(u => u.role !== 'SuperAdmin').map((u) => {
                        const associatedTenant = tenants.find(t => t.id === u.tenantId);
                        const tenantName = associatedTenant ? associatedTenant.companyName : 'Sogesti International S.A. (Défaut)';
                        
                        return (
                          <tr key={u.id} className="hover:bg-slate-850/30">
                            <td className="py-3 font-semibold text-white flex items-center space-x-2">
                              <img src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80"} className="w-5 h-5 rounded-full border border-slate-800 shrink-0" />
                              <span>{u.name}</span>
                            </td>
                            <td className="py-3 font-mono text-slate-300">{u.email}</td>
                            <td className="py-3 font-mono text-amber-400 select-all font-bold">
                              {u.password || "Initial123"}
                            </td>
                            <td className="py-3 text-slate-300">{tenantName}</td>
                            <td className="py-3">
                              <span className="bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingUserId(u.id);
                                    setEditingUserName(u.name);
                                    setEditingUserEmail(u.email);
                                    setEditingUserPassword(u.password || '');
                                    setEditingUserRole(u.role);
                                    setEditingUserTenant(u.tenantId || 'tenant1');
                                  }}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition"
                                  title="Modifier l'identifiant"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteClientUser(u.id, u.name)}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition"
                                  title="Supprimer le compte"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB: LICENCES & CONTRACTS ==================== */}
        {activeTab === 'licences' && (
          <div className="space-y-6 animate-fade-in">

            {/* Pending Module Validation Requests Banner for SuperAdmin Commercial */}
            {licences.filter(l => l.demandeValidationSmtp).length > 0 && (
              <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border-2 border-amber-500/40 rounded-xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
                    <h4 className="font-bold text-sm text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                      Demandes de Validation Contractuelle en Attente ({licences.filter(l => l.demandeValidationSmtp).length})
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                    SuperAdmin Commercial / Contrat & Licence
                  </span>
                </div>

                <p className="text-slate-300 text-xs">
                  Les entreprises suivantes ont soumis une demande d'activation et d'homologation du <strong>Module Serveur Gmail SMTP Dédié</strong>. Cliquez sur <strong>Approuver</strong> pour valider l'avenant au contrat et débloquer l'accès pour le client.
                </p>

                <div className="space-y-2">
                  {licences.filter(l => l.demandeValidationSmtp).map((pendingLic) => {
                    const company = entreprises.find(c => c.id === pendingLic.entrepriseId);
                    return (
                      <div key={pendingLic.id} className="p-3.5 bg-slate-950 rounded-lg border border-amber-500/30 flex flex-wrap justify-between items-center gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <strong className="text-white text-xs font-bold">{company?.raisonSociale || pendingLic.entrepriseId}</strong>
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                              Licence #{pendingLic.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Demande transmise le : <span className="text-slate-200 font-mono">{pendingLic.dateDemandeSmtp ? new Date(pendingLic.dateDemandeSmtp).toLocaleString('fr-FR') : 'Date récente'}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedModules = Array.from(new Set([...pendingLic.modulesActives, 'Serveur SMTP' as const]));
                              const updated = {
                                ...pendingLic,
                                modulesActives: updatedModules,
                                demandeValidationSmtp: false
                              };
                              onUpdateLicences(prev => prev.map(l => l.id === pendingLic.id ? updated : l));

                              const newHist: HistoriqueLicence = {
                                id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                                licenceId: pendingLic.id,
                                typeChangement: 'Ajout de module',
                                dateChangement: new Date().toISOString().split('T')[0],
                                effectuePar: 'SuperAdministrateur Commercial / Contrat & Licence',
                                details: `Approbation et validation contractuelle du module Serveur SMTP pour ${company?.raisonSociale || pendingLic.entrepriseId}.`
                              };
                              onUpdateHistoriqueLicences(h => [newHist, ...h]);
                              addSystemLog('Validation Licence', `Avenant contractuel validé : Module Serveur SMTP activé pour ${company?.raisonSociale}`, 'Succès');
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs shadow flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ✅ Approuver & Valider le Contrat
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = {
                                ...pendingLic,
                                demandeValidationSmtp: false
                              };
                              onUpdateLicences(prev => prev.map(l => l.id === pendingLic.id ? updated : l));
                              addSystemLog('Refus Licence', `Demande d'activation du module SMTP refusée pour ${company?.raisonSociale}`, 'Alerte');
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-xs cursor-pointer"
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grid of Licences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {licences.map((lic) => {
                const company = entreprises.find(c => c.id === lic.entrepriseId);
                const isNearingLimit = lic.nombreUtilisateursMax - lic.nombreUtilisateursActuel <= 5;
                
                return (
                  <div key={lic.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md relative overflow-hidden">
                    {/* Status ribbon */}
                    <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-lg ${
                      lic.statutLicence === 'Active' ? 'bg-emerald-600/10 text-emerald-400 border-l border-b border-emerald-500/20' :
                      lic.statutLicence === 'En période d\'essai' ? 'bg-indigo-600/10 text-indigo-400 border-l border-b border-indigo-500/20' :
                      'bg-red-600/10 text-red-400 border-l border-b border-red-500/20'
                    }`}>
                      {lic.statutLicence}
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-indigo-400 font-mono tracking-widest">ID LICENCE : {lic.id}</p>
                      <h4 className="text-sm font-bold text-white">{company?.raisonSociale || 'Inconnue'}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded-lg border border-slate-850 text-xs">
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Abonnement</p>
                        <p className="text-slate-200 font-semibold mt-0.5">{lic.typeAbonnement}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Échéance contractuelle</p>
                        <p className="text-slate-200 font-semibold mt-0.5">{lic.dateFin}</p>
                      </div>
                    </div>

                    {/* Quota Consumable display Section 10.3.2 */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Consommation Quota Utilisateurs :</span>
                        <span className={`font-bold ${isNearingLimit ? 'text-red-400' : 'text-slate-200'}`}>
                          {lic.nombreUtilisateursActuel} / {lic.nombreUtilisateursMax} actifs
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${isNearingLimit ? 'bg-red-500' : 'bg-indigo-500'}`} 
                          style={{ width: `${Math.min(100, (lic.nombreUtilisateursActuel / lic.nombreUtilisateursMax) * 100)}%` }}
                        ></div>
                      </div>
                      {isNearingLimit && (
                        <p className="text-[10px] text-red-400 font-medium flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Alerte quota : le client approche de sa limite active contractuelle.</span>
                        </p>
                      )}
                    </div>

                    {/* Activates Modules list (instant toggle impact) */}
                    <div className="space-y-1.5">
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Modules Activés :</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Cartographie', 'Plans d\'action', 'Audit', 'Conformité', 'Reporting', 'Serveur SMTP'].map((modName) => {
                          const isAct = lic.modulesActives.includes(modName as any);
                          return (
                            <span 
                              key={modName}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                isAct 
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                                  : 'bg-slate-950 text-slate-600 border-slate-850 line-through'
                              }`}
                            >
                              {modName}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick actions */}
                    {hasPermission('COMMERCIAL') && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">Débute le : {lic.dateDebut}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              const updated = {
                                ...lic,
                                dateFin: new Date(Date.now() + 3600000 * 24 * 365).toISOString().split('T')[0],
                                statutLicence: 'Active' as const
                              };
                              onUpdateLicences(prev => prev.map(l => l.id === lic.id ? updated : l));
                              
                              const newHist: HistoriqueLicence = {
                                id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                                licenceId: lic.id,
                                typeChangement: 'Renouvellement',
                                dateChangement: new Date().toISOString().split('T')[0],
                                effectuePar: currentRole,
                                details: `Renouvellement annuel rapide effectué pour ${company?.raisonSociale}. Nouvelle échéance: ${updated.dateFin}.`
                              };
                              onUpdateHistoriqueLicences(h => [newHist, ...h]);
                              addSystemLog('Renouvellement Licence', `Abonnement annuel renouvelé pour ${company?.raisonSociale}`, 'Succès');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded text-[10px]"
                          >
                            Renouveler +1 An
                          </button>
                          <button
                            onClick={() => handleOpenEditLicence(lic)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1 rounded text-[10px] flex items-center space-x-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Ajuster</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Historique Contractuel */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Historique de Licence (Traçabilité Section 10.2.3)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2">Date</th>
                      <th className="py-2">ID Licence</th>
                      <th className="py-2">Type d'Événement</th>
                      <th className="py-2">Opérateur</th>
                      <th className="py-2">Modifications apportées</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {historiqueLicences.map((hist) => (
                      <tr key={hist.id} className="hover:bg-slate-850/30">
                        <td className="py-2.5 font-mono text-[10px] text-slate-400">{hist.dateChangement}</td>
                        <td className="py-2.5 text-indigo-400 font-mono text-[10px]">{hist.licenceId}</td>
                        <td className="py-2.5 font-bold text-slate-200">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            hist.typeChangement === 'Création' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            hist.typeChangement === 'Suspension' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {hist.typeChangement}
                          </span>
                        </td>
                        <td className="py-2.5 font-semibold text-slate-300">{hist.effectuePar}</td>
                        <td className="py-2.5 text-slate-400">{hist.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: BACKUPS & PORTABILITY ==================== */}
        {activeTab === 'backups' && (
          <div className="space-y-6 animate-fade-in text-xs text-slate-300">
            {/* Explanatory Banner */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Database className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Gestion des Sauvegardes par Organisation (Supabase Multi-Tenant)</h3>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Puisque la plateforme utilise une base de données unique partitionnée (multi-tenant), les sauvegardes et restaurations d'une organisation spécifique s'effectuent par filtrage relationnel strict. Vous pouvez créer un snapshot des données d'un client à un instant T et le restaurer ultérieurement sans affecter les autres entreprises hébergées sur le même projet Supabase.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Backup Creator Panel */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
                <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-3">
                  <Download className="w-5 h-5" />
                  <h3 className="font-bold text-white text-sm">Création de Sauvegarde à la demande</h3>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Générez instantanément un snapshot persistant contenant toutes les informations d'un client (risques, actions, règles, logs d'audit et licences) pour des fins de conformité ou de sécurité.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Sélectionner l'organisation à sauvegarder :</label>
                    <div className="flex gap-2">
                      <select
                        id="backup-company-select"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        defaultValue=""
                      >
                        <option value="" disabled>-- Choisir une entreprise --</option>
                        {entreprises.map(c => (
                          <option key={c.id} value={c.id}>{c.raisonSociale}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const val = (document.getElementById('backup-company-select') as HTMLSelectElement).value;
                          if (val) {
                            handleCreateClientBackup(val);
                          } else {
                            triggerAlert("Veuillez d'abord sélectionner une entreprise.", "warning");
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded text-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Sauvegarder
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-850 space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Export manuel JSON (Réversibilité totale) :</label>
                    <select
                      id="export-company-select"
                      className="w-full bg-slate-950 border border-slate-800 rounded text-xs px-3 py-2 text-white focus:outline-none"
                      onChange={(e) => handleExportData(e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>-- Choisir une entreprise --</option>
                      {entreprises.map(c => (
                        <option key={c.id} value={c.id}>{c.raisonSociale}</option>
                      ))}
                    </select>
                  </div>

                  {exportData && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Archive JSON générée :</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(exportData);
                            triggerAlert("Archive copiée dans le presse-papiers ! Vous pouvez la coller dans un fichier.", "success");
                          }}
                          className="text-indigo-400 hover:text-indigo-300 font-bold text-[10px] tracking-wide"
                        >
                          Copier l'archive
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={exportData}
                        rows={6}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-[10px] text-indigo-300 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Restore Panel */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
                <div className="flex items-center space-x-2 text-amber-500 border-b border-slate-800 pb-3">
                  <Upload className="w-5 h-5 animate-pulse" />
                  <h3 className="font-bold text-white text-sm">Restauration isolée d'une organisation</h3>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Restaurez instantanément l'état d'un client à partir de la liste des snapshots ci-dessous. <strong>Attention :</strong> La restauration écrase uniquement les données du client concerné, laissant les autres organisations intactes.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Restauration rapide via client :</label>
                    <div className="flex gap-2">
                      <select
                        id="restore-company-select"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        defaultValue=""
                      >
                        <option value="" disabled>-- Choisir une entreprise --</option>
                        {entreprises.map(c => (
                          <option key={c.id} value={c.id}>{c.raisonSociale}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const val = (document.getElementById('restore-company-select') as HTMLSelectElement).value;
                          if (val) {
                            handleSimulateRestore(val);
                          } else {
                            triggerAlert("Veuillez d'abord sélectionner une entreprise.", "warning");
                          }
                        }}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded text-xs cursor-pointer transition"
                      >
                        Restaurer simulation
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-800 bg-slate-950/50 p-3 rounded-lg text-[11px] text-slate-400 space-y-1">
                    <p className="font-semibold text-white text-[11px]">Planification des Backups Système Automatiques :</p>
                    <div className="flex items-center justify-between py-1 border-b border-slate-900 font-mono text-[10px]">
                      <span>Snapshot_Hourly_0400.sql (Global)</span>
                      <span className="text-emerald-400 font-bold">Aujourd'hui, 04:00 (Actif)</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-900 font-mono text-[10px]">
                      <span>Snapshot_Daily_Yesterday.sql (Global)</span>
                      <span className="text-emerald-400 font-bold">Hier, 00:00 (Actif)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Snapshot Management List */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-white text-sm">Liste des Snapshots Applicatifs Disponibles</h3>
                </div>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold px-2 py-0.5 rounded text-[10px]">
                  {clientBackups.length} Snapshots
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5">Date de sauvegarde</th>
                      <th className="py-2.5">Organisation</th>
                      <th className="py-2.5">Statut de la base</th>
                      <th className="py-2.5">Taille</th>
                      <th className="py-2.5 text-right">Actions de Restauration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {clientBackups.map((backup) => (
                      <tr key={backup.id} className="hover:bg-slate-850/20">
                        <td className="py-3 font-semibold text-slate-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {backup.timestamp}
                        </td>
                        <td className="py-3">
                          <span className="text-indigo-400 font-bold">{backup.companyName}</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            backup.data ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {backup.data ? 'SAUVEGARDE RÉELLE' : 'SIMULÉ / PRÉ-REQUIS'}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-[10px] text-slate-400">
                          {(backup.sizeBytes / 1024).toFixed(2)} Ko
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRestoreClientBackup(backup.id)}
                              className="px-2.5 py-1 bg-amber-600/25 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/25 font-bold rounded text-[10px] transition cursor-pointer"
                            >
                              Restaurer
                            </button>
                            {backup.data && (
                              <button
                                onClick={() => {
                                  const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `GRC_Backup_${backup.companyName.replace(/\s+/g, '_')}_${backup.timestamp.replace(/[\/,\s:]/g, '_')}.json`;
                                  link.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-[10px] transition cursor-pointer"
                                title="Télécharger le fichier JSON de sauvegarde"
                              >
                                Télécharger
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteClientBackup(backup.id)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition cursor-pointer"
                              title="Supprimer la sauvegarde"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {clientBackups.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                          Aucun snapshot disponible. Sélectionnez un client ci-dessus pour générer une sauvegarde.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: SUPERVISION TECHNIQUE ==================== */}
        {activeTab === 'supervision' && (
          <div className="space-y-6 animate-fade-in">
            {/* Live Infrastructure Stats Section 10.3.5 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Disponibilité Plateforme</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">99.98%</p>
                </div>
                <div className="text-emerald-400 bg-emerald-500/10 p-2 rounded-full">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Charge CPU Moyenne</p>
                  <p className="text-xl font-bold text-white mt-1">18.4%</p>
                </div>
                <div className="text-indigo-400 bg-indigo-500/10 p-2 rounded-full">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Temps de réponse API</p>
                  <p className="text-xl font-bold text-white mt-1">45 ms</p>
                </div>
                <div className="text-indigo-400 bg-indigo-500/10 p-2 rounded-full">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Volumétrie DB Globale</p>
                  <p className="text-xl font-bold text-amber-500 mt-1">1.24 Go</p>
                </div>
                <div className="text-amber-400 bg-amber-500/10 p-2 rounded-full">
                  <Database className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Canary Release & Deployment section */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm">Gestion des Mises à jour Applicatives (Section 10.3.5)</h3>
                <span className="bg-indigo-600/10 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold">Plateforme centralisée</span>
              </div>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                Déployez de nouvelles versions du moteur de règles et de l'ERP à l'ensemble du portefeuille ou de manière ciblée par lots de serveurs (Canary Release).
              </p>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Version de production stable active : <span className="font-mono text-indigo-400 text-xs">v1.4.2</span></p>
                  <p className="text-slate-500 text-[10px]">Dernière mise à jour effectuée le 2026-06-25 par double approbation infra.</p>
                </div>

                <div className="flex items-center gap-2">
                  {canaryStatus === 'IDLE' && (
                    <button
                      onClick={handleTriggerCanaryUpdate}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded text-xs flex items-center space-x-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Lancer le déploiement v1.4.3 (Canary)</span>
                    </button>
                  )}

                  {canaryStatus === 'PROGRESS' && (
                    <div className="flex items-center space-x-3 text-xs text-amber-500 font-semibold">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                      <span>Canary en cours : {canaryProgress}%</span>
                    </div>
                  )}

                  {canaryStatus === 'COMPLETED' && (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Mise à jour v1.4.3 terminée à 100% !</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: DIAGNOSTIC & SUPPORT ==================== */}
        {activeTab === 'support' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
              <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-3">
                <LifeBuoy className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Mode Support & Diagnostic en lecture seule (Section 10.3.6)</h3>
              </div>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                Le SuperAdministrateur dispose d'un accès en <strong>lecture seule</strong> aux données du tenant uniquement pour résoudre un ticket de support ouvert. Toute modification de données est bloquée pour préserver l'intégrité, et l'historique d'accès est journalisé dans l'audit trail de la plateforme de manière immuable.
              </p>

              {!diagnosticActive ? (
                <form onSubmit={handleActivateDiagnostic} className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sélectionner l'Entreprise à inspecter :</label>
                      <select
                        id="diag-company-select"
                        className="w-full bg-slate-950 border border-slate-800 rounded text-xs px-3 py-2 text-white focus:outline-none"
                        value={diagnosticTenantId}
                        onChange={(e) => setDiagnosticTenantId(e.target.value)}
                        required
                      >
                        <option value="" disabled>-- Choisir une entreprise --</option>
                        {entreprises.map(c => (
                          <option key={c.id} value={c.id}>{c.raisonSociale}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Motif / Ticket n° :</label>
                      <input 
                        type="text"
                        placeholder="Ex : Ticket #2819 - Anomalie affichage matrice"
                        className="w-full bg-slate-950 border border-slate-800 rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        value={diagnosticReason}
                        onChange={(e) => setDiagnosticReason(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Démarrer la Session Diagnostic (Lecture Seule)</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></span>
                      <p className="text-slate-200 font-semibold">
                        Inspection active de l'entreprise : <span className="text-indigo-400">{entreprises.find(e => e.id === diagnosticTenantId)?.raisonSociale}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setDiagnosticActive(false);
                        addSystemLog('Fermeture Diagnostic', `Mode diagnostic fermé pour l'entreprise inspectée.`, 'Succès');
                      }}
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      Quitter
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest font-mono">Console d'inspection diagnostic :</p>
                    <div className="bg-slate-950 border border-slate-800 rounded p-4 font-mono text-[10px] text-indigo-300 space-y-1 max-h-48 overflow-y-auto">
                      {diagnosticLogs.map((log, idx) => (
                        <p key={idx}>{log}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: SUPABASE INTEGRATION ==================== */}
        {activeTab === 'supabase' && (
          <div className="space-y-6 animate-fade-in text-xs text-slate-300">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
              <div className="flex items-center space-x-2 text-amber-400 border-b border-slate-800 pb-3">
                <Database className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="font-bold text-white text-sm">Intégration Cloud Supabase (Moteur PostgreSQL)</h3>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Configurez la connexion avec votre instance PostgreSQL hébergée chez <strong className="text-amber-400">Supabase</strong>. Cette fonctionnalité de synchronisation multi-tenant et de réplication cloud est strictement restreinte aux <strong className="text-white">SuperAdministrateurs de la Plateforme</strong> pour des raisons de sécurité de l'infrastructure.
              </p>

              {/* SECTION 1: CREDENTIALS */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-400" />
                    1. Paramètres de Connexion Supabase
                  </h4>
                  {connStatus === 'success' ? (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold px-2.5 py-1 rounded text-[10px] flex items-center gap-1 self-start">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      RÉSEAU CONNECTÉ & FONCTIONNEL
                    </span>
                  ) : connStatus === 'loading' ? (
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/25 font-bold px-2.5 py-1 rounded text-[10px] flex items-center gap-1 animate-pulse self-start">
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                      TENTATIVE D'ACCÈS...
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-slate-400 border border-slate-700 font-bold px-2.5 py-1 rounded text-[10px] flex items-center gap-1 self-start">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                      ACCÈS NON CONFIGURÉ
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">URL du Projet (API endpoint)</label>
                    <input
                      type="text"
                      placeholder="https://your-project-id.supabase.co"
                      value={dbUrl}
                      onChange={(e) => {
                        setDbUrl(e.target.value);
                        setConnStatus('idle');
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">Clé d'API publique (anon key)</label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={dbKey}
                      onChange={(e) => {
                        setDbKey(e.target.value);
                        setConnStatus('idle');
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow transition text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CloudLightning className="w-3.5 h-3.5" />
                    Tester & Enregistrer les identifiants
                  </button>
                  {(dbUrl || dbKey) && (
                    <button
                      type="button"
                      onClick={handleClearConfig}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded transition text-xs cursor-pointer"
                    >
                      Réinitialiser par défaut (Clés système)
                    </button>
                  )}
                </div>

                {connMessage && (
                  <div className={`p-3 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 ${
                    connStatus === 'success' 
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                      : connStatus === 'error'
                      ? 'bg-red-950/40 border-red-900 text-red-300'
                      : 'bg-indigo-950/40 border-indigo-900 text-indigo-300'
                  }`}>
                    <div className="mt-0.5 font-bold">● Statut :</div>
                    <div className="flex-1 font-medium">{connMessage}</div>
                  </div>
                )}
              </div>

              {/* SECTION 2: SQL SCHEMA GENERATOR */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Code className="w-4 h-4 text-amber-500" />
                    2. Schéma d'initialisation PostgreSQL (Supabase SQL Editor)
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-indigo-400 font-bold rounded text-[10px] transition cursor-pointer flex items-center gap-1"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier le Script SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-slate-400 text-[10.5px] leading-relaxed">
                  Avant de commencer le transit de données, exécutez le script SQL ci-dessous dans la console de votre projet Supabase (<strong className="text-indigo-400">SQL Editor</strong>) pour configurer les 17 tables relationnelles de la plateforme ERP GRC.
                </p>

                <div className="relative">
                  <pre className="p-4 bg-slate-950 text-slate-400 rounded-lg text-[10px] font-mono overflow-x-auto max-h-52 overflow-y-auto border border-slate-850 shadow-inner select-all leading-normal">
                    {getSqlSchema()}
                  </pre>
                </div>
              </div>

              {/* SECTION 3: DATA SYNCHRONIZATION */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  3. Synchronisation et transit des données locales & distantes
                </h4>
                <p className="text-slate-400 text-[10.5px]">
                  Basculez librement vos données entre le stockage local du navigateur et la base de données relationnelle Supabase de l'organisation.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Push controls */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                    <h5 className="font-bold text-white text-[11px] uppercase tracking-wide">
                      Push (Navigateur Local ➔ Base PostgreSQL)
                    </h5>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      Publier l'intégralité des configurations locales, utilisateurs, risques, contrôles, audits, et licences vers votre base de données Supabase cloud.
                    </p>
                    <button
                      type="button"
                      onClick={handlePushData}
                      disabled={connStatus !== 'success' || syncStatus !== 'idle'}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded shadow transition text-xs cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      {syncStatus === 'pushing' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <CloudLightning className="w-3.5 h-3.5" />
                          Lancer la Synchronisation Push
                        </>
                      )}
                    </button>
                  </div>

                  {/* Pull controls */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                    <h5 className="font-bold text-white text-[11px] uppercase tracking-wide">
                      Pull (Base PostgreSQL ➔ Navigateur Local)
                    </h5>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      Importer l'intégralité des données GRC depuis la base de données Supabase cloud et écraser toutes les informations en cours d'utilisation dans ce navigateur.
                    </p>
                    <button
                      type="button"
                      onClick={handlePullData}
                      disabled={connStatus !== 'success' || syncStatus !== 'idle'}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded shadow transition text-xs cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      {syncStatus === 'pulling' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Récupération...
                        </>
                      ) : (
                        <>
                          <Database className="w-3.5 h-3.5" />
                          Lancer la Synchronisation Pull
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Auto-Sync Switch */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-amber-400 text-xs">Mise à jour en temps réel automatique (Auto-Sync)</h5>
                    <p className="text-slate-400 text-[10px]">
                      Lorsque cette option de réplication cloud est activée, toutes les modifications du système (création de risques, plans d'actions, comptes, licences, audits) sont automatiquement transmises à Supabase.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAutoSync}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out shrink-0 relative focus:outline-none cursor-pointer ${
                      autoSync ? 'bg-amber-600' : 'bg-slate-800'
                    }`}
                  >
                    <span 
                      className={`inline-block w-4 h-4 rounded-full bg-white transform transition-transform duration-200 ease-in-out absolute top-1 left-1 ${
                        autoSync ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sync Logs */}
                {syncLogs.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Console de synchronisation :</div>
                    <div className="p-3 bg-slate-950 text-slate-350 rounded-lg font-mono text-[9px] max-h-36 overflow-y-auto space-y-1 shadow-inner border border-slate-900 leading-normal select-text">
                      {syncLogs.map((log, idx) => (
                        <div key={idx} className={log.startsWith('✓') ? 'text-emerald-400' : log.startsWith('⚠') ? 'text-amber-400' : 'text-slate-400'}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: SETTINGS (PARAMÈTRES) ==================== */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in text-xs text-slate-300">
            {/* LEFT COLUMN: Secteurs d'activité */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-3">
                <Briefcase className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-white text-sm">Gestion des Secteurs d'Activité</h3>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Configurez les secteurs d'activité disponibles lors de la création d'une entreprise cliente sur la plateforme.
              </p>

              {/* Add Sector Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.elements.namedItem('newSector') as HTMLInputElement;
                  const val = input.value.trim();
                  if (val) {
                    if (sectors.includes(val)) {
                      triggerAlert("Ce secteur existe déjà !", "warning");
                    } else {
                      setSectors([...sectors, val]);
                      triggerAlert(`Secteur "${val}" ajouté avec succès.`, "success");
                      addSystemLog('Configuration', `Ajout du secteur d'activité : ${val}`, 'Succès');
                      input.value = '';
                    }
                  }
                }}
                className="flex gap-2"
              >
                <input 
                  name="newSector"
                  type="text"
                  required
                  placeholder="Ex: 🩺 Santé et Industrie Médicale"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded transition-colors shrink-0"
                >
                  Ajouter
                </button>
              </form>

              {/* Sectors List */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {sectors.map((sec, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded hover:bg-slate-900 transition-colors">
                    <span className="text-slate-200 font-semibold">{sec}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (sectors.length <= 1) {
                          triggerAlert("Vous devez garder au moins un secteur d'activité.", "error");
                          return;
                        }
                        setSectors(sectors.filter(s => s !== sec));
                        triggerAlert(`Secteur "${sec}" supprimé.`, "success");
                        addSystemLog('Configuration', `Suppression du secteur d'activité : ${sec}`, 'Succès');
                      }}
                      className="text-slate-500 hover:text-rose-500 transition-colors p-1"
                      title="Supprimer ce secteur"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Régions d'hébergement RGPD */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-teal-400 border-b border-slate-800 pb-3">
                <MapPin className="w-5 h-5 text-teal-500" />
                <h3 className="font-bold text-white text-sm">Gestion des Régions d'Hébergement (RGPD)</h3>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Gérez les régions d'hébergement cloud d'infrastructure (RGPD) disponibles pour le déploiement des bases de données clientes.
              </p>

              {/* Add Region Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.elements.namedItem('newRegion') as HTMLInputElement;
                  const val = input.value.trim();
                  if (val) {
                    if (regions.includes(val)) {
                      triggerAlert("Cette région existe déjà !", "warning");
                    } else {
                      setRegions([...regions, val]);
                      triggerAlert(`Région "${val}" ajoutée avec succès.`, "success");
                      addSystemLog('Configuration', `Ajout de la région d'hébergement : ${val}`, 'Succès');
                      input.value = '';
                    }
                  }
                }}
                className="flex gap-2"
              >
                <input 
                  name="newRegion"
                  type="text"
                  required
                  placeholder="Ex: Afrique de l'Ouest (Dakar)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
                />
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded transition-colors shrink-0"
                >
                  Ajouter
                </button>
              </form>

              {/* Regions List */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {regions.map((reg, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded hover:bg-slate-900 transition-colors">
                    <span className="text-slate-200 font-semibold">{reg}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (regions.length <= 1) {
                          triggerAlert("Vous devez garder au moins une région d'hébergement.", "error");
                          return;
                        }
                        setRegions(regions.filter(r => r !== reg));
                        triggerAlert(`Région "${reg}" supprimée.`, "success");
                        addSystemLog('Configuration', `Suppression de la région : ${reg}`, 'Succès');
                      }}
                      className="text-slate-500 hover:text-rose-500 transition-colors p-1"
                      title="Supprimer cette région"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD: Security Passcode Configuration */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4 shadow-xl col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-amber-400">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-white text-sm">Code de Sécurité d'Accès Espace SuperAdministrateur</h3>
                </div>
                <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[10px] font-mono font-bold">
                  Protégé & Confidentiel
                </span>
              </div>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                Pour des raisons de sécurité, le code d'accès à la console SuperAdmin n'est pas affiché en clair par défaut. Vous pouvez personnaliser votre code de sécurité à 6 chiffres ci-dessous.
              </p>

              <form onSubmit={handleChangeSuperadminCode} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-950 p-4 rounded-lg border border-slate-850">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Ancien Code de Sécurité</label>
                  <input 
                    type="password"
                    maxLength={6}
                    required
                    value={oldCodeInput}
                    onChange={(e) => setOldCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Nouveau Code (6 chiffres)</label>
                  <input 
                    type="password"
                    maxLength={6}
                    required
                    value={newCodeInput}
                    onChange={(e) => setNewCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Nouveau code 6 chiffres"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Confirmation Nouveau Code</label>
                  <input 
                    type="password"
                    maxLength={6}
                    required
                    value={confirmCodeInput}
                    onChange={(e) => setConfirmCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Répétez le nouveau code"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                <div className="col-span-1 md:col-span-3 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded text-xs transition-colors flex items-center space-x-2 cursor-pointer shadow-md"
                  >
                    <Key className="w-4 h-4" />
                    <span>Mettre à jour le Code de Sécurité SuperAdmin</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== TAB: SMTP GMAIL EMAIL SERVER ==================== */}
        {activeTab === 'smtp' && (
          <div className="space-y-6 animate-fade-in text-xs text-slate-300">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 rounded-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400 shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-white tracking-tight">Configuration Serveur d'Envoi E-Mails — Gmail SMTP Backend</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${smtpForm.user && smtpForm.pass ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                      {smtpForm.user && smtpForm.pass ? '🟢 Gmail SMTP Connecté' : '🟡 Non configuré (Mode simulation)'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-3xl">
                    Administrez l'expédition réelle des notifications e-mails de la plateforme Sogesti GRC RiskFlow. Ce module s'appuie sur le backend Node.js / Express et la bibliothèque <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300 font-mono">nodemailer</code> pour délivrer les messages directement via votre compte Gmail ou serveur SMTP d'entreprise.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={fetchSmtpConfigAndLogs}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualiser</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT COLUMN: Configuration Form */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* SMTP Credentials Form Card */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                      <Key className="w-4 h-4 text-indigo-400" />
                      <span>Paramètres d'Authentification SMTP / Gmail</span>
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">Serveur backend Express</span>
                  </div>

                  <form onSubmit={handleSaveSmtpConfig} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Serveur Hôte SMTP</label>
                        <input 
                          type="text"
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                          placeholder="smtp.gmail.com"
                          value={smtpForm.host}
                          onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                        />
                        <span className="text-[10px] text-slate-500">Défaut pour Gmail : <code className="text-slate-300">smtp.gmail.com</code></span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Port SMTP & Sécurité</label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="number"
                            required
                            className="w-28 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                            placeholder="587"
                            value={smtpForm.port}
                            onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                          />
                          <label className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded cursor-pointer hover:bg-slate-850 flex-1">
                            <input 
                              type="checkbox"
                              checked={smtpForm.secure}
                              onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                              className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                            />
                            <span className="text-[11px] text-slate-300 font-medium">SSL Direct (Port 465)</span>
                          </label>
                        </div>
                        <span className="text-[10px] text-slate-500">Port 587 (STARTTLS) ou Port 465 (SSL/TLS)</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Compte Google / Identifiant SMTP</label>
                        <input 
                          type="email"
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                          placeholder="votre.compte@gmail.com"
                          value={smtpForm.user}
                          onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                        />
                        <span className="text-[10px] text-slate-500">Adresse Gmail ou Google Workspace d'entreprise</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Mot de Passe d'Application Google</label>
                        <input 
                          type="password"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                          placeholder="xxxx xxxx xxxx xxxx"
                          value={smtpForm.pass}
                          onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                        />
                        <span className="text-[10px] text-slate-500">Code de 16 caractères généré dans le Compte Google</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Nom de l'Expéditeur Affiché</label>
                        <input 
                          type="text"
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                          placeholder="Sogesti GRC RiskFlow"
                          value={smtpForm.fromName}
                          onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">E-mail de Réponse / Expéditeur</label>
                        <input 
                          type="email"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                          placeholder="noreply@sogesti-grc.com"
                          value={smtpForm.fromEmail}
                          onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                        />
                      </div>

                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={smtpForm.enabled}
                          onChange={(e) => setSmtpForm({ ...smtpForm, enabled: e.target.checked })}
                          className="rounded border-slate-800 text-indigo-600 focus:ring-0 w-4 h-4"
                        />
                        <span className="font-bold text-slate-200">Activer le service d'expédition automatique d'e-mails</span>
                      </label>

                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center space-x-2 shadow-lg cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Enregistrer la Configuration SMTP</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Test Connection Panel */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>Test de Connexion & Envoi d'E-mail de Validation</span>
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">Banc d'essai SMTP</span>
                  </div>

                  <p className="text-slate-400 text-xs">
                    Testez instantanément la validité de vos identifiants Gmail SMTP et envoyez un e-mail de démonstration à l'adresse de votre choix.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="email"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 text-xs"
                      placeholder="Saisissez un e-mail destinataire (ex: votre.adresse@domaine.com)"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={isTestingSmtp}
                      onClick={handleTestSmtpConnection}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                    >
                      {isTestingSmtp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Connexion en cours...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>🧪 Tester la Connexion & Envoyer</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Test Result Feedback Card */}
                  {smtpTestResult && (
                    <div className={`p-4 rounded-lg border text-xs space-y-2 animate-fade-in ${
                      smtpTestResult.success 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}>
                      <div className="flex items-start space-x-2">
                        {smtpTestResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                        )}
                        <div className="space-y-1">
                          <p className="font-bold text-sm">
                            {smtpTestResult.success ? 'Succès de la connexion Gmail SMTP !' : 'Échec de connexion SMTP'}
                          </p>
                          <p className="text-slate-200">{smtpTestResult.message || smtpTestResult.error}</p>
                          {smtpTestResult.suggestion && (
                            <p className="text-amber-300/90 text-[11px] mt-1 bg-amber-500/10 p-2 rounded border border-amber-500/20 font-sans">
                              💡 <strong>Conseil :</strong> {smtpTestResult.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Dispatch Audit Log Table */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-white text-sm">Journal d'Expédition des E-Mails (Audit Logs)</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Historique temps réel des messages expédiés par la plateforme</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch('/api/email/logs', { method: 'DELETE' });
                        fetchSmtpConfigAndLogs();
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Purger le journal</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950">
                          <th className="py-2.5 px-3">Horodatage</th>
                          <th className="py-2.5 px-3">Destinataire</th>
                          <th className="py-2.5 px-3">Sujet</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {smtpLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                              Aucun e-mail expédié dans la session actuelle.
                            </td>
                          </tr>
                        ) : (
                          smtpLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                              <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                              </td>
                              <td className="py-2 px-3 text-indigo-300 font-semibold">{log.to}</td>
                              <td className="py-2 px-3 text-slate-200 font-sans truncate max-w-xs">{log.subject}</td>
                              <td className="py-2 px-3 text-slate-400 font-sans">{log.type}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                                  log.status === 'Envoyé' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                  log.status === 'Échec' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Guide & Auto Alert Rules */}
              <div className="space-y-6">

                {/* Google App Password Guide Card */}
                <div className="bg-slate-900 border border-indigo-500/30 p-5 rounded-xl space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-3">
                    <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                    <h3 className="font-bold text-white text-sm">Guide : Mot de passe d'application Google</h3>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">
                    Google requiert un <strong>Mot de passe d'application</strong> (16 lettres) pour autoriser l'envoi d'e-mails sécurisé via SMTP sans compromettre votre mot de passe principal.
                  </p>

                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex items-start space-x-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-[11px] shrink-0">Étape 1</span>
                      <p className="text-slate-300">Connectez-vous à votre Compte Google et activez la <strong>Validation en 2 étapes (2FA)</strong> dans l'onglet Sécurité.</p>
                    </div>

                    <div className="flex items-start space-x-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-[11px] shrink-0">Étape 2</span>
                      <p className="text-slate-300">Rendez-vous sur la page Google : <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono text-[10px]">myaccount.google.com/apppasswords</code></p>
                    </div>

                    <div className="flex items-start space-x-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-[11px] shrink-0">Étape 3</span>
                      <p className="text-slate-300">Saisissez le nom d'application <strong className="text-white">"Sogesti GRC RiskFlow"</strong> puis cliquez sur <strong>Créer</strong>.</p>
                    </div>

                    <div className="flex items-start space-x-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-[11px] shrink-0">Étape 4</span>
                      <p className="text-slate-300">Copiez la clé de 16 caractères générée (ex : <code className="text-emerald-400 font-mono">abcd efgh ijkl mnop</code>) et collez-la dans le champ ci-contre.</p>
                    </div>
                  </div>
                </div>

                {/* Automated Operational Triggers */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-white text-sm">Règles de Déclenchement Automatique</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sélectionnez les évènements générant un e-mail automatique</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <label className="flex items-start space-x-3 p-2.5 bg-slate-950 rounded-lg border border-slate-850 cursor-pointer hover:bg-slate-850 transition-colors">
                      <input 
                        type="checkbox"
                        checked={autoEmailAlerts.riskCritical}
                        onChange={(e) => setAutoEmailAlerts({ ...autoEmailAlerts, riskCritical: e.target.checked })}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0 mt-0.5 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-slate-200 block">Création / Modification d'un Risque Critique</span>
                        <span className="text-slate-400 text-[10px] block mt-0.5">Alerter le Risk Manager lorsqu'un risque brut ou net dépasse la note de 15/25.</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 p-2.5 bg-slate-950 rounded-lg border border-slate-850 cursor-pointer hover:bg-slate-850 transition-colors">
                      <input 
                        type="checkbox"
                        checked={autoEmailAlerts.actionAssigned}
                        onChange={(e) => setAutoEmailAlerts({ ...autoEmailAlerts, actionAssigned: e.target.checked })}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0 mt-0.5 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-slate-200 block">Assignation d'un Plan d'Action</span>
                        <span className="text-slate-400 text-[10px] block mt-0.5">Notifier le responsable désigné avec le détail des objectifs et la date limite.</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 p-2.5 bg-slate-950 rounded-lg border border-slate-850 cursor-pointer hover:bg-slate-850 transition-colors">
                      <input 
                        type="checkbox"
                        checked={autoEmailAlerts.auditLaunched}
                        onChange={(e) => setAutoEmailAlerts({ ...autoEmailAlerts, auditLaunched: e.target.checked })}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0 mt-0.5 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-slate-200 block">Lancement d'une Mission d'Audit</span>
                        <span className="text-slate-400 text-[10px] block mt-0.5">Transmettre la lettre de mission aux auditeurs et responsables d'entités.</span>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 p-2.5 bg-slate-950 rounded-lg border border-slate-850 cursor-pointer hover:bg-slate-850 transition-colors">
                      <input 
                        type="checkbox"
                        checked={autoEmailAlerts.weeklyDigest}
                        onChange={(e) => setAutoEmailAlerts({ ...autoEmailAlerts, weeklyDigest: e.target.checked })}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0 mt-0.5 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-slate-200 block">Synthèse Hebdomadaire Automatique</span>
                        <span className="text-slate-400 text-[10px] block mt-0.5">Envoyer chaque lundi un résumé exécutif du niveau d'exposition au Comité de Direction.</span>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ==================== MODAL: ADD COMPANY ==================== */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 animate-fade-in">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-850 rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-slate-850 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Création d'une Entreprise Cliente & Licence Initiale</h3>
              <button onClick={() => setShowAddCompanyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Raison Sociale de l'entreprise</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex : Pharmaco Group S.A."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    value={newCompany.raisonSociale}
                    onChange={(e) => setNewCompany({...newCompany, raisonSociale: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Secteur d'Activité</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.secteurActivite}
                    onChange={(e) => setNewCompany({...newCompany, secteurActivite: e.target.value})}
                  >
                    {sectors.map((sec, i) => (
                      <option key={i} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Région d'Hébergement (RGPD)</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.regionHebergement}
                    onChange={(e) => setNewCompany({...newCompany, regionHebergement: e.target.value})}
                  >
                    {regions.map((reg, i) => (
                      <option key={i} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Spécification descriptive sur l'activité</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex : Commerce de détail agroalimentaire en zone urbaine..."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.specificationSecteur}
                    onChange={(e) => setNewCompany({...newCompany, specificationSecteur: e.target.value})}
                  />
                </div>

                {/* SECTION: CONTACT ADMINISTRATEUR */}
                <div className="col-span-2 border-t border-slate-800 pt-3 mt-1">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">👤 Contact Administrateur Client</span>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Prénom</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex : Alain Patrick"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.contactPrenom}
                    onChange={(e) => setNewCompany({...newCompany, contactPrenom: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nom</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex : Nkoumou"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.contactNom}
                    onChange={(e) => setNewCompany({...newCompany, contactNom: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Titre dans l'entreprise</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex : Directeur Général"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.contactTitre}
                    onChange={(e) => setNewCompany({...newCompany, contactTitre: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Téléphone Contact</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex : +237 6xx xx xx xx"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                    value={newCompany.contactTelephone}
                    onChange={(e) => setNewCompany({...newCompany, contactTelephone: e.target.value})}
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Adresse E-mail du Compte</label>
                  <input 
                    type="email"
                    required
                    placeholder="Ex : alain.nkoumou@entreprise.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.contactEmail}
                    onChange={(e) => setNewCompany({...newCompany, contactEmail: e.target.value})}
                  />
                </div>

                {/* SECTION: EXTRA COMPANY INFO */}
                <div className="col-span-2 border-t border-slate-800 pt-3 mt-1">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">🏢 Informations d'Entreprise Supplémentaires</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pays</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex : Cameroun"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.pays}
                    onChange={(e) => setNewCompany({...newCompany, pays: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ville</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex : Douala"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.ville}
                    onChange={(e) => setNewCompany({...newCompany, ville: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Téléphone Entreprise</label>
                  <input 
                    type="text"
                    placeholder="Ex : +237 2xx xx xx xx"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                    value={newCompany.telephone}
                    onChange={(e) => setNewCompany({...newCompany, telephone: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Adresse Email Générale</label>
                  <input 
                    type="email"
                    placeholder="Ex : contact@entreprise.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Site Web de l'Entreprise (Optionnel)</label>
                  <input 
                    type="text"
                    placeholder="Ex : www.entreprise.com (Optionnel)"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.siteWeb}
                    onChange={(e) => setNewCompany({...newCompany, siteWeb: e.target.value})}
                  />
                </div>

                {/* SECTION: CONTRACT DETAILS */}
                <div className="col-span-2 border-t border-slate-800 pt-3 mt-1">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">📜 Licence & Contrat Commercial</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Type d'abonnement</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.typeAbonnement}
                    onChange={(e) => setNewCompany({...newCompany, typeAbonnement: e.target.value as any})}
                  >
                    <option value="Mensuel">Mensuel</option>
                    <option value="Annuel">Annuel</option>
                    <option value="Sur devis">Sur devis</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plafond utilisateurs max</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.maxUsers}
                    onChange={(e) => setNewCompany({...newCompany, maxUsers: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plafond succursales max (Facturable)</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={newCompany.maxSuccursales}
                    onChange={(e) => setNewCompany({...newCompany, maxSuccursales: Number(e.target.value)})}
                  />
                </div>

                {/* QUOTAS DE STRUCTURE */}
                <div className="col-span-2 border-t border-slate-800 pt-3 mt-1">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">🏢 Quotas des Unités de Structure (Gérés par Licence)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Directions Max</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                    value={newCompany.maxDirections}
                    onChange={(e) => setNewCompany({...newCompany, maxDirections: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Départements Max</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                    value={newCompany.maxDepartements}
                    onChange={(e) => setNewCompany({...newCompany, maxDepartements: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Services Max</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                    value={newCompany.maxServices}
                    onChange={(e) => setNewCompany({...newCompany, maxServices: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sites Locaux Max</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                    value={newCompany.maxSitesLocaux}
                    onChange={(e) => setNewCompany({...newCompany, maxSitesLocaux: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filiales Max</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                    value={newCompany.maxFiliales}
                    onChange={(e) => setNewCompany({...newCompany, maxFiliales: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Modules inclus au contrat :</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Cartographie', 'Plans d\'action', 'Audit', 'Conformité', 'Reporting', 'Serveur SMTP'].map((mod) => (
                      <label key={mod} className="flex items-center space-x-2 bg-slate-950 p-2 rounded border border-slate-850 cursor-pointer hover:bg-slate-900">
                        <input 
                          type="checkbox"
                          checked={newCompany.modules.includes(mod as any)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewCompany({...newCompany, modules: [...newCompany.modules, mod as any]});
                            } else {
                              setNewCompany({...newCompany, modules: newCompany.modules.filter(m => m !== mod)});
                            }
                          }}
                          className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">{mod}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded"
                >
                  Créer et Activer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT COMPANY ==================== */}
      {showEditCompanyModal && editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 animate-fade-in">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-850 rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-slate-850 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Modifier l'Entreprise Cliente</h3>
              <button onClick={() => { setShowEditCompanyModal(false); setEditingCompany(null); }} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCompany} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Raison Sociale de l'entreprise</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    value={editingCompany.raisonSociale}
                    onChange={(e) => setEditingCompany({...editingCompany, raisonSociale: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Secteur d'Activité</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={editingCompany.secteurActivite}
                    onChange={(e) => setEditingCompany({...editingCompany, secteurActivite: e.target.value})}
                  >
                    {sectors.map((sec, i) => (
                      <option key={i} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Région d'Hébergement (RGPD)</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={editingCompany.regionHebergement}
                    onChange={(e) => setEditingCompany({...editingCompany, regionHebergement: e.target.value})}
                  >
                    {regions.map((reg, i) => (
                      <option key={i} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Spécification descriptive sur l'activité</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={editingCompany.specificationSecteur || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, specificationSecteur: e.target.value})}
                  />
                </div>

                {/* SECTION: CONTACT ADMINISTRATEUR */}
                <div className="col-span-2 border-t border-slate-800 pt-3 mt-1">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">👤 Contact Administrateur Client</span>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Prénom</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={editingCompany.contactPrenom || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, contactPrenom: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nom</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={editingCompany.contactNom || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, contactNom: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Titre dans l'entreprise</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={editingCompany.contactTitre || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, contactTitre: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Téléphone Contact</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                    value={editingCompany.contactTelephone || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, contactTelephone: e.target.value})}
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Adresse E-mail du Compte</label>
                  <input 
                    type="email"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={editingCompany.contactEmail || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, contactEmail: e.target.value})}
                  />
                </div>

                {/* SECTION: EXTRA COMPANY INFO */}
                <div className="col-span-2 border-t border-slate-800 pt-3 mt-1">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">🏢 Informations d'Entreprise Supplémentaires</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pays</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={editingCompany.pays || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, pays: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ville</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={editingCompany.ville || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, ville: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Téléphone Entreprise</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-mono"
                    value={editingCompany.telephone || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, telephone: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Adresse Email Générale</label>
                  <input 
                    type="email"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={editingCompany.email || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, email: e.target.value})}
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Site Web de l'Entreprise</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={editingCompany.siteWeb || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, siteWeb: e.target.value})}
                  />
                </div>

                {/* SECTION: PARAMETERS & LIMITS */}
                <div className="col-span-2 border-t border-slate-800 pt-3 mt-1">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">⚙️ Paramètres de Fonctionnement & Plafonds</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Statut Compte</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                    value={editingCompany.statutCompte}
                    onChange={(e) => setEditingCompany({...editingCompany, statutCompte: e.target.value as any})}
                  >
                    <option value="Essai">Essai</option>
                    <option value="Actif">Actif</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="Résilié">Résilié</option>
                    <option value="Archivé">Archivé</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plafond succursales max</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-bold"
                    value={editingCompany.maxSuccursales || 5}
                    onChange={(e) => setEditingCompany({...editingCompany, maxSuccursales: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plafond directions max</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-bold font-mono"
                    value={editingCompany.maxDirections || 5}
                    onChange={(e) => setEditingCompany({...editingCompany, maxDirections: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plafond départements max</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-bold font-mono"
                    value={editingCompany.maxDepartements || 10}
                    onChange={(e) => setEditingCompany({...editingCompany, maxDepartements: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plafond services max</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-bold font-mono"
                    value={editingCompany.maxServices || 15}
                    onChange={(e) => setEditingCompany({...editingCompany, maxServices: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plafond sites locaux max</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-bold font-mono"
                    value={editingCompany.maxSitesLocaux || 5}
                    onChange={(e) => setEditingCompany({...editingCompany, maxSitesLocaux: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plafond filiales max</label>
                  <input 
                    type="number"
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none font-bold font-mono"
                    value={editingCompany.maxFiliales || 5}
                    onChange={(e) => setEditingCompany({...editingCompany, maxFiliales: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setShowEditCompanyModal(false); setEditingCompany(null); }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded"
                >
                  Sauvegarder les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT LICENCE ==================== */}
      {showEditLicenceModal && selectedLicence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-850 rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-slate-850 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Ajuster la Licence Contractuelle</h3>
              <button onClick={() => setShowEditLicenceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateLicence} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Type d'abonnement</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                  value={selectedLicence.typeAbonnement}
                  onChange={(e) => setSelectedLicence({...selectedLicence, typeAbonnement: e.target.value as any})}
                >
                  <option value="Mensuel">Mensuel</option>
                  <option value="Annuel">Annuel</option>
                  <option value="Sur devis">Sur devis</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nombre d'utilisateurs max</label>
                <input 
                  type="number"
                  min={selectedLicence.nombreUtilisateursActuel}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                  value={selectedLicence.nombreUtilisateursMax}
                  onChange={(e) => setSelectedLicence({...selectedLicence, nombreUtilisateursMax: Number(e.target.value)})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date d'échéance contractuelle</label>
                <input 
                  type="date"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                  value={selectedLicence.dateFin}
                  onChange={(e) => setSelectedLicence({...selectedLicence, dateFin: e.target.value})}
                />
              </div>

              {/* GESTION CONTRACTUELLE DES SUCCURSALES */}
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">Gestion Contractuelle des Succursales</span>
                
                <label className="flex items-center space-x-2 bg-slate-950 p-2 rounded border border-slate-850 cursor-pointer hover:bg-slate-900">
                  <input 
                    type="checkbox"
                    checked={selectedLicence.succursalesActives ?? true}
                    onChange={(e) => setSelectedLicence({...selectedLicence, succursalesActives: e.target.checked})}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-slate-300 font-bold">Activer l'option de gestion des Succursales</span>
                </label>

                {(selectedLicence.succursalesActives ?? true) && (
                  <div className="grid grid-cols-2 gap-3 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Quota succursales max</label>
                      <input 
                        type="number"
                        min={0}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                        value={selectedLicence.nombre_succursales_max ?? 5}
                        onChange={(e) => setSelectedLicence({...selectedLicence, nombre_succursales_max: Number(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">En cas de dépassement</label>
                      <select
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                        value={selectedLicence.depassementQuotaMode ?? 'blocage'}
                        onChange={(e) => setSelectedLicence({...selectedLicence, depassementQuotaMode: e.target.value as any})}
                      >
                        <option value="blocage">🛑 Bloquer strictement</option>
                        <option value="inactif">⚠️ Créer en "Inactif / Bloqué"</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Activer/Désactiver des modules :</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Cartographie', 'Plans d\'action', 'Audit', 'Conformité', 'Reporting', 'Serveur SMTP'].map((mod) => (
                    <label key={mod} className="flex items-center space-x-2 bg-slate-950 p-2 rounded border border-slate-850 cursor-pointer hover:bg-slate-900">
                      <input 
                        type="checkbox"
                        checked={selectedLicence.modulesActives.includes(mod as any)}
                        onChange={(e) => {
                          const modules = selectedLicence.modulesActives;
                          if (e.target.checked) {
                            setSelectedLicence({...selectedLicence, modulesActives: [...modules, mod as any]});
                          } else {
                            setSelectedLicence({...selectedLicence, modulesActives: modules.filter(m => m !== mod)});
                          }
                        }}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                      />
                      <span className="text-slate-300">{mod}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditLicenceModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: SECURITY & WORKFLOW CONFIGURATION ==================== */}
      {showWorkflowConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 animate-fade-in overflow-y-auto">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-850 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Sécurité & Configuration du Workflow</h3>
              </div>
              <button 
                onClick={() => {
                  setShowWorkflowConfigModal(false);
                  setSelectedConfigTenantId(null);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkflowConfig} className="p-5 space-y-6 text-xs text-slate-300">
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-850 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">Visibilité du filtre de workflow client</h4>
                    <p className="text-slate-500 text-[10px] mt-0.5">Si désactivé, le filtre "Étape Workflow" dans la cartographie des risques est masqué pour l'ensemble des utilisateurs de cette entreprise cliente.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={tempShowWorkflowFilter}
                      onChange={(e) => setTempShowWorkflowFilter(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-white text-xs">Étapes du Workflow de Validation</h4>
                  <button
                    type="button"
                    onClick={handleAddTempStep}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-[10px] transition-colors"
                  >
                    + Ajouter une étape
                  </button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {tempWorkflowSteps.map((step, idx) => (
                    <div key={step.id} className="p-3 bg-slate-950 rounded border border-slate-850 flex items-center gap-3">
                      <span className="font-mono text-slate-500 font-bold text-[10px] w-4 shrink-0 font-bold">#{idx + 1}</span>
                      
                      <div className="flex-1 min-w-0">
                        <input 
                          type="text" 
                          required
                          value={step.name}
                          onChange={(e) => handleUpdateTempStep(step.id, 'name', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 p-1 px-2 rounded text-white text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          placeholder="Nom de l'étape (ex. ✅ Validé)"
                        />
                      </div>

                      <div className="w-36 shrink-0">
                        <select
                          value={step.color}
                          onChange={(e) => handleUpdateTempStep(step.id, 'color', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 p-1 px-1.5 rounded text-slate-300 text-xs focus:outline-none"
                        >
                          <option value="bg-gray-100 text-gray-800">Gris discret</option>
                          <option value="bg-blue-100 text-blue-800">Bleu info</option>
                          <option value="bg-amber-100 text-amber-800">Orange attente</option>
                          <option value="bg-green-100 text-green-800">Vert validé</option>
                          <option value="bg-rose-100 text-rose-800">Rouge alerte</option>
                          <option value="bg-indigo-100 text-indigo-800">Indigo prime</option>
                          <option value="bg-purple-100 text-purple-800">Violet thématique</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTempStep(step.id)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-red-500/10 shrink-0"
                        title="Supprimer l'étape"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWorkflowConfigModal(false);
                    setSelectedConfigTenantId(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded shadow-md"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DOUBLE VALIDATION FOR SENSITIVE ACTIONS ==================== */}
      {doubleValidationTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-red-500/10 px-5 py-4 border-b border-red-500/20 flex items-center justify-between text-red-400">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <h3 className="font-bold text-sm">Double Validation Requise (Sécurité Section 10.5)</h3>
              </div>
              <button onClick={() => setDoubleValidationTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {doubleValidationTarget.type === 'delete' ? (
                <>
                  <p className="text-slate-300 leading-relaxed">
                    Vous demandez la suppression définitive de l'entreprise cliente <strong className="text-white">{doubleValidationTarget.name}</strong>.
                    Cette opération est destructrice et supprimera instantanément l'ensemble des licences, des comptes utilisateurs et de l'historique associé.
                  </p>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saisir <span className="text-red-400 font-mono">SUPPRIMER</span> pour valider :</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-bold text-center uppercase focus:border-red-500 focus:outline-none"
                      value={doubleValidationCode}
                      onChange={(e) => setDoubleValidationCode(e.target.value)}
                      placeholder="Tapez SUPPRIMER"
                    />
                  </div>
                  <div className="pt-3 border-t border-slate-850 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setDoubleValidationTarget(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteCompany}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded"
                    >
                      Confirmer la suppression irréversible
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-300 leading-relaxed">
                    Vous demandez la restauration de la base de données de production pour l'entreprise <strong className="text-white">{doubleValidationTarget.name}</strong> à partir d'un snapshot technique de sauvegarde. Tout travail non sauvegardé effectué depuis ce snapshot sera irrémédiablement perdu.
                  </p>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saisir <span className="text-amber-500 font-mono">RESTAURER</span> pour valider :</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-bold text-center uppercase focus:border-amber-500 focus:outline-none"
                      value={doubleValidationCode}
                      onChange={(e) => setDoubleValidationCode(e.target.value)}
                      placeholder="Tapez RESTAURER"
                    />
                  </div>
                  <div className="pt-3 border-t border-slate-850 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setDoubleValidationTarget(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRestore}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded"
                    >
                      Rétablir le snapshot de sauvegarde
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== CUSTOM DIALOG: ALERT ==================== */}
      {customAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-850 rounded-lg shadow-2xl p-6 text-xs text-slate-300 space-y-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full shrink-0 ${
                customAlert.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
                customAlert.type === 'error' ? 'bg-red-500/15 text-red-400' :
                customAlert.type === 'warning' ? 'bg-amber-500/15 text-amber-400' :
                'bg-indigo-500/15 text-indigo-400'
              }`}>
                {customAlert.type === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : customAlert.type === 'error' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : customAlert.type === 'warning' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">
                  {customAlert.type === 'success' ? 'Opération réussie' :
                   customAlert.type === 'error' ? 'Erreur rencontrée' :
                   customAlert.type === 'warning' ? 'Avertissement' :
                   'Information'}
                </h4>
                <p className="leading-relaxed text-slate-300 text-xs">
                  {customAlert.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setCustomAlert(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded transition text-xs cursor-pointer"
              >
                D'accord
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CUSTOM DIALOG: CONFIRM ==================== */}
      {customConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-850 rounded-lg shadow-2xl p-6 text-xs text-slate-300 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-amber-500/15 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">
                  {customConfirm.title}
                </h4>
                <p className="leading-relaxed text-slate-300 text-xs">
                  {customConfirm.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setCustomConfirm(null)}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded text-xs cursor-pointer transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const onConf = customConfirm.onConfirm;
                  setCustomConfirm(null);
                  onConf();
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded text-xs cursor-pointer transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
