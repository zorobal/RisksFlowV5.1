/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Briefcase, 
  History, 
  Lock, 
  UserPlus,
  Edit,
  Power,
  Check,
  X,
  Mail,
  Send,
  Server,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  FileText,
  Sparkles,
  Settings,
  Building,
  CreditCard,
  UploadCloud,
  Image as ImageIcon
} from 'lucide-react';
import { User, TenantConfig, AuditLog, Role, SessionExercice, Licence, EntrepriseCliente } from '../types';

interface AdminModuleProps {
  users: User[];
  onAddUser: (u: Omit<User, 'id'>) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (u: User) => void;
  tenants: TenantConfig[];
  onAddTenant: (name: string) => void;
  auditLogs: AuditLog[];
  activeTenantId: string;
  initialTab?: 'users' | 'tenants' | 'audit' | 'sessions' | 'smtp';
  sessions: SessionExercice[];
  onAddSession: (s: SessionExercice) => void;
  onUpdateSession: (s: SessionExercice) => void;
  licence?: Licence;
  onUpdateLicence?: (licence: Licence) => void;
  tenantConfig?: TenantConfig;
  onUpdateTenantConfig?: (config: TenantConfig) => void;
  onAddLog?: (category: string, details: string) => void;
  activeEntreprise?: EntrepriseCliente;
  onUpdateEntreprise?: (entreprise: EntrepriseCliente) => void;
}

export default function AdminModule({
  users,
  onAddUser,
  onDeleteUser,
  onUpdateUser,
  tenants,
  onAddTenant,
  auditLogs,
  activeTenantId,
  initialTab,
  sessions,
  onAddSession,
  onUpdateSession,
  licence,
  onUpdateLicence,
  tenantConfig,
  onUpdateTenantConfig,
  onAddLog,
  activeEntreprise,
  onUpdateEntreprise
}: AdminModuleProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'tenants' | 'audit' | 'sessions' | 'smtp'>(initialTab || 'users');

  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<Role>('Analyste');
  const [editUserIsActive, setEditUserIsActive] = useState(true);
  const [editUserAllowedModules, setEditUserAllowedModules] = useState<string[]>([]);
  const [editUserEntityId, setEditUserEntityId] = useState('');

  // Session state
  const [newSessionAnnee, setNewSessionAnnee] = useState(2027);
  const [newSessionDebut, setNewSessionDebut] = useState('2027-01-01');
  const [newSessionFin, setNewSessionFin] = useState('2027-12-31');

  const [closingSession, setClosingSession] = useState<SessionExercice | null>(null);
  const [bilanAnnuelInput, setBilanAnnuelInput] = useState('');

  // Check if current enterprise license includes SMTP module
  const hasSmtpModule = licence?.modulesActives?.some(m => m === 'Serveur SMTP' || m === 'SMTP');

  // Enterprise SMTP Configuration State
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpEnabled, setSmtpEnabled] = useState(true);
  const [smtpHasPass, setSmtpHasPass] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [smtpLogs, setSmtpLogs] = useState<any[]>([]);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpStatusMsg, setSmtpStatusMsg] = useState<{ type: 'success' | 'error'; text: string; details?: string } | null>(null);
  const [showAppPassHelp, setShowAppPassHelp] = useState(false);
  const [licenseUpgradeRequested, setLicenseUpgradeRequested] = useState(false);

  // Enterprise Tenant Configuration States (Paramètres)
  const [compName, setCompName] = useState(tenantConfig?.companyName || '');
  const [compLogo, setCompLogo] = useState(tenantConfig?.logoUrl || '');
  const [compEmail, setCompEmail] = useState(activeEntreprise?.email || '');
  const [compPhone, setCompPhone] = useState(activeEntreprise?.telephone || '');
  const [compCity, setCompCity] = useState(activeEntreprise?.ville || '');
  const [compCountry, setCompCountry] = useState(activeEntreprise?.pays || '');
  const [isSavingParams, setIsSavingParams] = useState(false);
  const [paramsStatus, setParamsStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const handleLogoFile = (file: File) => {
    setLogoError(null);
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setLogoError("Le fichier est trop volumineux. Taille maximum : 2 Mo.");
      return;
    }
    if (!file.type.startsWith('image/')) {
      setLogoError("Le fichier doit être une image (PNG, JPEG, SVG, WebP, GIF).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setCompLogo(e.target.result);
      }
    };
    reader.onerror = () => {
      setLogoError("Erreur lors de la lecture du fichier.");
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    if (tenantConfig) {
      setCompName(tenantConfig.companyName || '');
      setCompLogo(tenantConfig.logoUrl || '');
    }
    if (activeEntreprise) {
      setCompEmail(activeEntreprise.email || '');
      setCompPhone(activeEntreprise.telephone || '');
      setCompCity(activeEntreprise.ville || '');
      setCompCountry(activeEntreprise.pays || '');
    }
  }, [tenantConfig, activeEntreprise]);

  // Fetch SMTP config & logs when switching to 'smtp' tab or when activeTenantId changes
  React.useEffect(() => {
    if (activeTab === 'smtp' && activeTenantId) {
      fetch(`/api/email/config/${activeTenantId}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setSmtpHost(data.host || 'smtp.gmail.com');
            setSmtpPort(data.port || 587);
            setSmtpSecure(Boolean(data.secure));
            setSmtpUser(data.user || '');
            setSmtpFromName(data.fromName || (tenantConfig?.companyName ? `${tenantConfig.companyName} GRC` : `Sogesti GRC - ${activeTenantId}`));
            setSmtpFromEmail(data.fromEmail || data.user || '');
            setSmtpEnabled(data.enabled !== false);
            setSmtpHasPass(Boolean(data.hasPass));
          }
        })
        .catch(err => console.error('Error loading SMTP config:', err));

      fetch(`/api/email/logs/${activeTenantId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.logs) {
            setSmtpLogs(data.logs);
          }
        })
        .catch(err => console.error('Error loading SMTP logs:', err));
    }
  }, [activeTab, activeTenantId, tenantConfig]);

  const handleSaveParams = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingParams(true);
    setParamsStatus(null);

    try {
      if (tenantConfig && onUpdateTenantConfig) {
        onUpdateTenantConfig({
          ...tenantConfig,
          companyName: compName,
          logoUrl: compLogo,
        });
      }

      if (activeEntreprise && onUpdateEntreprise) {
        onUpdateEntreprise({
          ...activeEntreprise,
          raisonSociale: compName,
          email: compEmail,
          telephone: compPhone,
          ville: compCity,
          pays: compCountry,
        });
      }

      setParamsStatus({
        type: 'success',
        text: 'Les paramètres de votre entreprise ont été mis à jour avec succès !'
      });

      if (onAddLog) {
        onAddLog('Administration', `Mise à jour des paramètres et de la fiche d'identité de l'entreprise : ${compName}`);
      }
    } catch (err: any) {
      setParamsStatus({
        type: 'error',
        text: `Une erreur est survenue : ${err?.message || 'Erreur inconnue'}`
      });
    } finally {
      setIsSavingParams(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    setSmtpStatusMsg(null);
    try {
      const res = await fetch(`/api/email/config/${activeTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          fromName: smtpFromName,
          fromEmail: smtpFromEmail,
          enabled: smtpEnabled,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSmtpStatusMsg({
          type: 'success',
          text: `Configuration SMTP de l'entreprise enregistrée avec succès !`
        });
        if (smtpPass) setSmtpHasPass(true);
        if (onAddLog) onAddLog('Configuration SMTP', `Mise à jour du serveur SMTP d'entreprise (${tenantConfig?.companyName || activeTenantId})`);
      } else {
        setSmtpStatusMsg({
          type: 'error',
          text: data.error || 'Erreur lors de la sauvegarde de la configuration SMTP.'
        });
      }
    } catch (err: any) {
      setSmtpStatusMsg({
        type: 'error',
        text: 'Impossible de joindre le serveur Express backend.',
        details: err?.message
      });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!testRecipient) {
      setSmtpStatusMsg({
        type: 'error',
        text: 'Veuillez renseigner une adresse e-mail destinataire pour recevoir le message de test.'
      });
      return;
    }
    setIsTestingSmtp(true);
    setSmtpStatusMsg(null);
    try {
      const res = await fetch(`/api/email/test/${activeTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmail: testRecipient,
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          fromName: smtpFromName,
          fromEmail: smtpFromEmail,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSmtpStatusMsg({
          type: 'success',
          text: data.message
        });
        if (onAddLog) onAddLog('Test SMTP', `Test d'envoi e-mail réussi vers ${testRecipient}`);
      } else {
        setSmtpStatusMsg({
          type: 'error',
          text: data.error || 'Échec de la connexion SMTP.',
          details: data.suggestion || data.error
        });
      }
      fetch(`/api/email/logs/${activeTenantId}`)
        .then(r => r.json())
        .then(d => d && d.logs && setSmtpLogs(d.logs));
    } catch (err: any) {
      setSmtpStatusMsg({
        type: 'error',
        text: 'Erreur réseau lors de la tentative de test SMTP.',
        details: err?.message
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleClearSmtpLogs = async () => {
    try {
      await fetch(`/api/email/logs/${activeTenantId}`, { method: 'DELETE' });
      setSmtpLogs([]);
      if (onAddLog) onAddLog('Purge Logs SMTP', `Réinitialisation du journal des e-mails expédiés`);
    } catch (err) {
      console.error('Error clearing logs:', err);
    }
  };

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserEntityId, setNewUserEntityId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['Analyste']);
  const [userError, setUserError] = useState('');

  const [newTenantName, setNewTenantName] = useState('');

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    if (!newUserName.trim() || !newUserEmail.trim() || selectedRoles.length === 0) return;

    // Validation d'unicité de l'email (insensible à la casse)
    const emailLower = newUserEmail.trim().toLowerCase();
    const emailExists = users.some(u => u.email.trim().toLowerCase() === emailLower);
    if (emailExists) {
      setUserError(`L'adresse email "${newUserEmail}" est déjà attribuée à un collaborateur existant.`);
      return;
    }

    onAddUser({
      name: newUserName,
      email: newUserEmail,
      role: selectedRoles[0],
      roles: selectedRoles,
      isActive: true,
      entityId: newUserEntityId || undefined,
      allowedModules: selectedRoles.includes('Administrateur') || selectedRoles.includes('SuperAdmin')
        ? ['dashboard', 'risks', 'evaluation', 'heatmap', 'actions', 'audit', 'compliance', 'config', 'admin', 'reporting']
        : ['dashboard', 'risks', 'evaluation', 'heatmap', 'actions', 'audit', 'compliance', 'reporting'],
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=80&fit=crop&q=80`
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserEntityId('');
    setSelectedRoles(['Analyste']);
    setUserError('');
  };

  const startEditUser = (u: User) => {
    setUserError('');
    setEditingUser(u);
    setEditUserName(u.name);
    setEditUserEmail(u.email);
    setEditUserRole(u.role);
    setEditUserIsActive(u.isActive !== false);
    setEditUserAllowedModules(u.allowedModules || ['dashboard', 'risks', 'evaluation', 'heatmap', 'actions', 'audit', 'compliance', 'reporting']);
    setEditUserEntityId(u.entityId || '');
  };

  const saveUserEdit = () => {
    if (!editingUser) return;
    setUserError('');

    // Validation d'unicité de l'email (exclure l'utilisateur en cours de modification)
    const emailLower = editUserEmail.trim().toLowerCase();
    const emailExists = users.some(u => u.id !== editingUser.id && u.email.trim().toLowerCase() === emailLower);
    if (emailExists) {
      setUserError(`L'adresse email "${editUserEmail}" est déjà attribuée à un collaborateur existant.`);
      return;
    }

    onUpdateUser({
      ...editingUser,
      name: editUserName,
      email: editUserEmail,
      role: editUserRole,
      roles: [editUserRole],
      isActive: editUserIsActive,
      allowedModules: editUserAllowedModules,
      entityId: editUserEntityId || undefined
    });
    setEditingUser(null);
  };

  const handleAddTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;

    onAddTenant(newTenantName);
    setNewTenantName('');
  };

  const handleCreateSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSession({
      id: `sess_${Date.now()}`,
      annee: newSessionAnnee,
      dateDebut: newSessionDebut,
      dateFin: newSessionFin,
      statut: 'Ouverte'
    });
    // Increment default year
    const nextYear = newSessionAnnee + 1;
    setNewSessionAnnee(nextYear);
    setNewSessionDebut(`${nextYear}-01-01`);
    setNewSessionFin(`${nextYear}-12-31`);
  };

  const handleCloturerClick = (s: SessionExercice) => {
    setClosingSession(s);
    setBilanAnnuelInput(`Bilan de l'exercice ${s.annee} : Clôture annuelle effectuée le ${new Date().toISOString().split('T')[0]}. Tous les comptes et écritures sont chronologiquement figés.`);
  };

  const submitCloture = () => {
    if (!closingSession) return;
    onUpdateSession({
      ...closingSession,
      statut: 'Clôturée',
      dateCloture: new Date().toISOString().split('T')[0],
      bilanAnnuel: bilanAnnuelInput
    });
    setClosingSession(null);
    setBilanAnnuelInput('');
  };

  return (
    <div className="flex-grow p-6 bg-slate-50 overflow-y-auto space-y-6 text-xs text-slate-800">
      
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Module d'Administration Générale
          </h2>
          <p className="text-slate-500 text-[11px]">
            Gérez les habilitations utilisateurs (RBAC), provisionnez de nouvelles structures (Multi-tenancy), et inspectez la traçabilité des opérations en base.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT: Local Sub Navigation */}
        <div className="lg:col-span-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'users' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>🔑 Profils & Habilitations</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'audit' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span>📝 Journal d'Audit Système</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'sessions' ? 'bg-indigo-50 text-emerald-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>📅 Sessions & Exercices</span>
          </button>

          <button
            onClick={() => setActiveTab('smtp')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'smtp' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>📧 Serveur SMTP / Gmail</span>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              hasSmtpModule ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {hasSmtpModule ? 'Inclus' : 'Sur Option'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tenants')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'tenants' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>⚙️ Paramètres</span>
          </button>
        </div>

        {/* RIGHT COMPONENT: Content Area */}
        <div className="lg:col-span-9 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
          
          {/* USERS PRIVILEGES TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Gestion des Utilisateurs & Rôles (RBAC)</h3>
                  <p className="text-slate-400 text-[10.5px]">Affectation de privilèges et de signatures de validation pour les Analystes, Managers et la Direction.</p>
                </div>
              </div>

              {/* Message d'erreur d'unicité */}
              {userError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full shrink-0"></span>
                  <span>{userError}</span>
                </div>
              )}

              {/* Creator Form */}
              <form onSubmit={handleAddUserSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-150 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Nom complet</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Jean-Pierre..."
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Email professionnel</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="jp.dupont@co.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Rattachement Unité</label>
                  <select
                    value={newUserEntityId}
                    onChange={(e) => setNewUserEntityId(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
                  >
                    <option value="">-- Aucune unité --</option>
                    {(tenantConfig?.entities || []).filter(e => e.statut !== 'Archivé').map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Rôles / Privilèges (Multi-sélection)</label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto bg-white p-2 rounded border border-slate-200">
                    {(['Analyste', 'Responsable', 'Risk Manager', 'Direction', 'Administrateur'] as Role[]).map((r) => {
                      const isChecked = selectedRoles.includes(r);
                      return (
                        <label key={r} className="flex items-center space-x-2 p-1 rounded hover:bg-slate-50 transition-colors cursor-pointer text-[11px] font-semibold text-slate-700">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRoles([...selectedRoles, r]);
                              } else {
                                  if (selectedRoles.length > 1) {
                                    setSelectedRoles(selectedRoles.filter(role => role !== r));
                                  }
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>
                            {r === 'Analyste' && 'Analyste'}
                            {r === 'Responsable' && 'Responsable'}
                            {r === 'Risk Manager' && 'Risk Manager'}
                            {r === 'Direction' && 'Direction'}
                            {r === 'Administrateur' && 'Admin'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="submit"
                  className="py-1.5 px-3 bg-indigo-600 text-white font-bold rounded shadow hover:bg-indigo-700 text-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Créer Utilisateur
                </button>
              </form>

              {/* Users tables list */}
              <div className="space-y-2">
                <p className="font-bold text-slate-800">Liste des collaborateurs référencés :</p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <th className="py-2.5 px-4 font-bold">Collaborateur</th>
                        <th className="py-2.5 px-4 font-bold">Email</th>
                        <th className="py-2.5 px-4 font-bold">Unité</th>
                        <th className="py-2.5 px-4 font-bold">Rôle principal</th>
                        <th className="py-2.5 px-4 font-bold">Statut</th>
                        <th className="py-2.5 px-4 font-bold">Modules Visibles</th>
                        <th className="py-2.5 px-4 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-2 px-4 flex items-center gap-2">
                            <img src={u.avatar} alt="" className="w-6 h-6 rounded-full shrink-0" />
                            <strong className="text-slate-800 text-[11px]">{u.name}</strong>
                          </td>
                          <td className="py-2 px-4 font-mono text-slate-500">{u.email}</td>
                          <td className="py-2 px-4">
                            {u.entityId ? (
                              <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[9.5px]">
                                {tenantConfig?.entities?.find(e => e.id === u.entityId)?.name || u.entityId}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Non rattaché</span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles && u.roles.length > 0 ? (
                                u.roles.map((r) => (
                                  <span key={r} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-indigo-100">
                                    {r}
                                  </span>
                                ))
                              ) : (
                                <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-indigo-100">
                                  {u.role}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            {u.isActive !== false ? (
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold border border-emerald-200 flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                Actif
                              </span>
                            ) : (
                              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-[9px] font-bold border border-red-200 flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                Suspendu
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-slate-500 max-w-[180px] truncate" title={u.allowedModules ? u.allowedModules.join(', ') : 'Tous'}>
                            {u.allowedModules ? (
                              <div className="flex flex-wrap gap-1">
                                {u.allowedModules.map(m => (
                                  <span key={m} className="bg-slate-100 text-slate-700 text-[8px] font-bold px-1 rounded">
                                    {m === 'dashboard' ? 'TdB' : m === 'risks' ? 'Carto' : m === 'evaluation' ? 'Calcul' : m === 'heatmap' ? 'Matrice' : m === 'actions' ? 'Actions' : m === 'audit' ? 'Audit' : m === 'compliance' ? 'Conformité' : m === 'config' ? 'Config' : m === 'admin' ? 'Admin' : m === 'reporting' ? 'Rapports' : m}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Tous les modules (Par défaut)</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => startEditUser(u)}
                                className="p-1 text-slate-500 hover:text-indigo-600 rounded transition"
                                title="Modifier / Gérer les modules"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {users.length > 1 ? (
                                (u.email === activeEntreprise?.contactEmail) ? (
                                  <span className="p-1 text-slate-300 cursor-not-allowed" title="Administrateur principal d'origine. Seul le SuperAdmin peut supprimer ce profil.">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => onDeleteUser(u.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                                    title="Supprimer définitivement"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* EDIT USER MODAL */}
              {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in text-slate-800">
                  <div className="bg-white rounded-xl border border-slate-250 shadow-2xl p-6 w-full max-w-lg space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                        <Edit className="w-4 h-4 text-indigo-600" />
                        <span>Modifier le Collaborateur : {editingUser.name}</span>
                      </h3>
                      <button 
                        onClick={() => setEditingUser(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    {userError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full shrink-0"></span>
                        <span>{userError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Nom complet</label>
                        <input 
                          type="text" 
                          required 
                          value={editUserName}
                          onChange={(e) => setEditUserName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Email professionnel</label>
                        <input 
                          type="email" 
                          required 
                          value={editUserEmail}
                          onChange={(e) => setEditUserEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded p-1.5 text-xs text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Rattachement Unité</label>
                        <select
                          value={editUserEntityId}
                          onChange={(e) => setEditUserEntityId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
                        >
                          <option value="">-- Aucune unité --</option>
                          {(tenantConfig?.entities || []).filter(e => e.statut !== 'Archivé').map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Rôle principal GRC</label>
                        <select
                          value={editUserRole}
                          onChange={(e) => setEditUserRole(e.target.value as Role)}
                          className="w-full bg-slate-50 border border-slate-250 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
                        >
                          <option value="Analyste">Analyste (Saisie)</option>
                          <option value="Responsable">Responsable (Revue)</option>
                          <option value="Risk Manager">Risk Manager (Cotation)</option>
                          <option value="Direction">Direction (Approbation)</option>
                          <option value="Administrateur">Administrateur (Gestion Totale)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Statut d'activité</label>
                        <div className="flex items-center space-x-4 h-8">
                          <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold">
                            <input 
                              type="radio"
                              checked={editUserIsActive}
                              onChange={() => setEditUserIsActive(true)}
                              className="text-indigo-600"
                            />
                            <span className="text-emerald-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              Actif
                            </span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold">
                            <input 
                              type="radio"
                              checked={!editUserIsActive}
                              onChange={() => setEditUserIsActive(false)}
                              className="text-indigo-600"
                            />
                            <span className="text-red-650 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                              Suspendu
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Checkboxes for Module Permissions */}
                      <div className="col-span-2 border-t border-slate-150 pt-3">
                        <label className="text-[10px] text-indigo-650 font-bold uppercase block mb-2">🛡️ Visibilité des modules (Habilitations de visibilité)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-150">
                          {[
                            { id: 'dashboard', name: 'Tableau de Bord' },
                            { id: 'risks', name: 'Cartographie' },
                            { id: 'evaluation', name: 'Calcul & Évaluation' },
                            { id: 'heatmap', name: 'Matrice Risques' },
                            { id: 'actions', name: "Plans d'Actions" },
                            { id: 'audit', name: 'Audit Interne' },
                            { id: 'compliance', name: 'Conformité' },
                            { id: 'reporting', name: 'Rapports' },
                            { id: 'config', name: 'Configuration' },
                            { id: 'admin', name: 'Administration' },
                          ].map((m) => {
                            const isChecked = editUserAllowedModules.includes(m.id);
                            return (
                              <label key={m.id} className="flex items-center space-x-2 p-1 rounded hover:bg-white transition cursor-pointer text-[10.5px] font-semibold text-slate-750">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditUserAllowedModules([...editUserAllowedModules, m.id]);
                                    } else {
                                      setEditUserAllowedModules(editUserAllowedModules.filter(x => x !== m.id));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{m.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-150 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={saveUserEdit}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded shadow transition text-xs cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Sauvegarder les modifications
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded text-xs transition flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC REAL TIME AUDIT LOG LIST */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2 flex justify-between items-center h-14">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Journal d'Audit Système & Traçabilité (Compliance Audit Trail)</h3>
                  <p className="text-slate-400 text-[10.5px]">Historique inaltérable de l'activité pour l'audit et la conformité SOX / IFACI.</p>
                </div>
              </div>

              {/* Logger block list */}
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {auditLogs.slice().reverse().map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between gap-2.5 text-[10.5px]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded text-[9.5px]">
                          {log.action}
                        </span>
                        <span className="text-slate-400 font-mono text-[9px]">
                          {new Date(log.timestamp).toLocaleTimeString() || log.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium leading-relaxed">{log.details}</p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <p className="font-bold text-slate-700">👤 {log.userName}</p>
                      <p className="text-slate-400 text-[9.5px]">Grade: {log.userRole}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SESSIONS & EXERCICES TAB */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">📅 Gestion des Exercices & Sessions Annuelles</h3>
                  <p className="text-slate-400 text-[10.5px]">Configurez la périodicité de vos sessions d'exercice, démarrez une nouvelle année ou clôturez l'exercice en cours.</p>
                </div>
              </div>

              {/* Form to open new session */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <p className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  Démarrer une Nouvelle Session d'Exercice Annuel
                </p>
                <form onSubmit={handleCreateSessionSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Année d'Exercice</label>
                    <input 
                      type="number" 
                      required 
                      value={newSessionAnnee}
                      onChange={(e) => {
                        const yr = parseInt(e.target.value) || 2027;
                        setNewSessionAnnee(yr);
                        setNewSessionDebut(`${yr}-01-01`);
                        setNewSessionFin(`${yr}-12-31`);
                      }}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Date de début de session</label>
                    <input 
                      type="date" 
                      required 
                      value={newSessionDebut}
                      onChange={(e) => setNewSessionDebut(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Date de fin de session</label>
                    <input 
                      type="date" 
                      required 
                      value={newSessionFin}
                      onChange={(e) => setNewSessionFin(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow transition text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Démarrer l'Exercice
                  </button>
                </form>
              </div>

              {/* Sessions List */}
              <div className="space-y-3">
                <p className="font-bold text-slate-800">Historique des Exercices GRC :</p>
                <div className="grid grid-cols-1 gap-3">
                  {sessions.slice().reverse().map((s) => (
                    <div 
                      key={s.id} 
                      className={`p-4 rounded-xl border transition-all duration-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        s.statut === 'Ouverte' 
                          ? 'bg-emerald-50/40 border-emerald-200 shadow-sm' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-900">Exercice {s.annee}</span>
                          {s.statut === 'Ouverte' ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                              Session Ouverte (En cours)
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                              Clôturé
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[10.5px]">
                          Période : <strong className="text-slate-700">{s.dateDebut}</strong> au <strong className="text-slate-700">{s.dateFin}</strong>
                          {s.dateCloture && (
                            <>
                              {' '}• Clôturé le : <strong className="text-slate-700">{s.dateCloture}</strong>
                            </>
                          )}
                        </p>
                        {s.bilanAnnuel && (
                          <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-slate-600 max-w-2xl font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
                            💡 {s.bilanAnnuel}
                          </div>
                        )}
                      </div>

                      {s.statut === 'Ouverte' && (
                        <button
                          onClick={() => handleCloturerClick(s)}
                          className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow transition text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Power className="w-3.5 h-3.5" />
                          Clôturer l'Exercice
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* MODAL CLÔTURE D'EXERCICE (Bilan Annuel) */}
              {closingSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in text-slate-800">
                  <div className="bg-white rounded-xl border border-slate-250 shadow-2xl p-6 w-full max-w-lg space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                      <h3 className="text-sm font-bold text-slate-950 flex items-center space-x-2">
                        <Power className="w-4 h-4 text-red-600" />
                        <span>Clôture de l'Exercice Annuel {closingSession.annee}</span>
                      </h3>
                      <button 
                        onClick={() => setClosingSession(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        La clôture d'un exercice fige les écritures, risques et plans d'action de cette période. Veuillez enregistrer un <strong>bilan annuel récapitulatif</strong> (indicateurs clés, avancement des plans) avant de confirmer la fermeture définitive de la session.
                      </p>

                      <div className="space-y-1 pt-2">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Bilan récapitulatif annuel (Bilan Annuel)</label>
                        <textarea
                          rows={4}
                          required
                          value={bilanAnnuelInput}
                          onChange={(e) => setBilanAnnuelInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded p-2 text-xs text-slate-800 leading-relaxed focus:outline-none font-sans"
                          placeholder="Entrez les conclusions de l'année..."
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-150 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={submitCloture}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow transition text-xs cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Valider la Clôture Définitive
                      </button>
                      <button
                        type="button"
                        onClick={() => setClosingSession(null)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded text-xs transition flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SMTP SERVER CONFIGURATION TAB (Enterprise Tenant Level) */}
          {activeTab === 'smtp' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    Configuration du Serveur d'Envoi E-mails (Gmail SMTP)
                  </h3>
                  <p className="text-slate-400 text-[10.5px]">
                    Paramétrage indépendant du serveur SMTP réservé à l'entreprise : <strong className="text-slate-700">{tenantConfig?.companyName || activeTenantId}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] flex items-center gap-1 ${
                    hasSmtpModule ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {hasSmtpModule ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Module Inclus au Contrat
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-amber-600" />
                        Module Non Souscrit
                      </>
                    )}
                  </span>
                </div>
              </div>

              {!hasSmtpModule ? (
                <div className="p-8 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 space-y-6 text-center max-w-3xl mx-auto my-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 mb-2">
                    <Lock className="w-7 h-7 text-amber-400" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-white">
                      🔒 Module Serveur SMTP Dédié Non Inclus dans votre Contrat
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed max-w-xl mx-auto">
                      Le module <strong>Serveur d'Envoi E-mails Gmail SMTP Dédié</strong> n'est pas activé dans la licence actuelle de <span className="text-indigo-300 font-bold">{tenantConfig?.companyName || activeTenantId}</span>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left bg-slate-950/80 p-4 rounded-lg border border-slate-800/80 text-[11px] text-slate-300">
                    <div className="flex items-start space-x-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-semibold">Isolation Totale des Identifiants</strong>
                        Mots de passe d'application et comptes SMTP 100% étanches et isolés des autres filiales.
                      </div>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <Send className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-semibold">Adresse Expéditeur Personnalisée</strong>
                        Notifications transmises sous votre nom d'entreprise et domaine propre (ex: @{tenantConfig?.companyName ? tenantConfig.companyName.toLowerCase().replace(/\s+/g, '') + '.com' : 'votre-entreprise.com'}).
                      </div>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-semibold">Alertes Automatiques de Risques</strong>
                        Avis d'urgence immédiats envoyés aux responsables sur création de Risques Critiques (&ge; 15/25).
                      </div>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-semibold">Journal d'Audit des Envois</strong>
                        Historique détaillé et traçabilité de tous les e-mails expédiés avec identifiants uniques de transaction.
                      </div>
                    </div>
                  </div>

                  { (licenseUpgradeRequested || licence?.demandeValidationSmtp) ? (
                    <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border border-indigo-500/30 rounded-xl text-left space-y-3 shadow-lg">
                      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                          <h5 className="font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            Demande Transmise au SuperAdministrateur Contrat & Licence
                          </h5>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Réf: REQ-SMTP-{(activeTenantId || 'T1').toUpperCase()}
                        </span>
                      </div>

                      <p className="text-slate-300 text-xs leading-relaxed">
                        Cette fonctionnalité d'envoi e-mail SMTP est soumise à la <strong>validation et à la signature du contrat de licence</strong> par le SuperAdministrateur Commercial (SuperAdmin). Votre demande est enregistrée.
                      </p>

                      <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800/80 flex flex-wrap justify-between items-center gap-2 text-[11px]">
                        <div className="text-slate-400">
                          <span>Date de soumission : </span>
                          <strong className="text-white font-mono">{licence?.dateDemandeSmtp ? new Date(licence.dateDemandeSmtp).toLocaleString('fr-FR') : 'À l\'instant'}</strong>
                        </div>
                        <div className="text-amber-400 font-semibold flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          En attente de validation SuperAdmin Commercial
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (licence && onUpdateLicence) {
                              const updatedModules = Array.from(new Set([...(licence.modulesActives || []), 'Serveur SMTP' as const]));
                              onUpdateLicence({
                                ...licence,
                                modulesActives: updatedModules,
                                demandeValidationSmtp: false
                              });
                            }
                            if (onAddLog) {
                              onAddLog('Administration', `Validation et homologation immédiate de la licence SMTP effectuée pour ${tenantConfig?.companyName || activeTenantId}`);
                            }
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg shadow transition text-[11px] cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ⚡ Valider & Approuver le Contrat SMTP (Simulation SuperAdmin)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (licence && onUpdateLicence) {
                          onUpdateLicence({
                            ...licence,
                            demandeValidationSmtp: true,
                            dateDemandeSmtp: new Date().toISOString(),
                            motifDemandeSmtp: `Demande d'activation du module Serveur Gmail SMTP Dédié pour ${tenantConfig?.companyName || activeTenantId}`
                          });
                        }
                        setLicenseUpgradeRequested(true);
                        if (onAddLog) {
                          onAddLog('Administration', `Soumission d'une demande d'activation du module Serveur SMTP à la validation du SuperAdministrateur Contrat & Licence`);
                        }
                      }}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-500/25 transition text-xs cursor-pointer inline-flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      📩 Soumettre la Demande d'Activation au SuperAdministrateur Contrat & Licence
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Banner */}
                  {smtpStatusMsg && (
                    <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs shadow-sm ${
                      smtpStatusMsg.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}>
                      {smtpStatusMsg.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <p className="font-bold">{smtpStatusMsg.text}</p>
                        {smtpStatusMsg.details && (
                          <p className="text-[11px] text-slate-600 font-mono bg-white/70 p-2 rounded border border-slate-200 mt-1">
                            {smtpStatusMsg.details}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: Configuration Form & Test Panel */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Configuration Form */}
                      <form onSubmit={handleSaveSmtp} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                          <div className="flex items-center space-x-2">
                            <Server className="w-4 h-4 text-indigo-600" />
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Identifiants & Serveur SMTP D'Entreprise</h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAppPassHelp(!showAppPassHelp)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 underline cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            Comment obtenir le Mot de Passe Google ?
                          </button>
                        </div>

                        {/* App Password Guide Modal/Accordion */}
                        {showAppPassHelp && (
                          <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-lg text-[11px] text-indigo-950 space-y-2">
                            <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                              <Key className="w-4 h-4 text-indigo-600" />
                              Guide d'activation du Mot de Passe d'Application Google (16 caractères) :
                            </div>
                            <ol className="list-decimal list-inside space-y-1 text-[10.5px] leading-relaxed text-indigo-900">
                              <li>Connectez-vous à votre compte Google d'entreprise (<span className="font-mono">myaccount.google.com</span>).</li>
                              <li>Allez dans l'onglet <strong>Sécurité</strong> et activez la <strong>Validation en deux étapes</strong> si ce n'est pas déjà fait.</li>
                              <li>Recherchez <strong>Mots de passe d'application</strong> dans la barre de recherche en haut.</li>
                              <li>Créez une application nommée <span className="font-mono font-bold">Sogesti GRC</span> puis copiez le code à 16 lettres généré.</li>
                              <li>Collez ce code dans le champ <strong>Mot de passe d'application</strong> ci-dessous.</li>
                            </ol>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Hôte SMTP</label>
                            <input 
                              type="text"
                              required
                              value={smtpHost}
                              onChange={(e) => setSmtpHost(e.target.value)}
                              placeholder="smtp.gmail.com"
                              className="w-full bg-white border border-slate-250 rounded p-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Port</label>
                              <input 
                                type="number"
                                required
                                value={smtpPort}
                                onChange={(e) => setSmtpPort(parseInt(e.target.value, 10) || 587)}
                                className="w-full bg-white border border-slate-250 rounded p-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="space-y-1 flex flex-col justify-end pb-1">
                              <label className="flex items-center space-x-1.5 cursor-pointer text-[10px] font-bold text-slate-600">
                                <input 
                                  type="checkbox"
                                  checked={smtpSecure}
                                  onChange={(e) => setSmtpSecure(e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                                />
                                <span>SSL (Port 465)</span>
                              </label>
                            </div>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Compte Google / Identifiant SMTP</label>
                            <input 
                              type="email"
                              required
                              value={smtpUser}
                              onChange={(e) => setSmtpUser(e.target.value)}
                              placeholder="direction.grc@sogesti-grc.com"
                              className="w-full bg-white border border-slate-250 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Mot de Passe d'Application Google (16 Lettres)</label>
                              {smtpHasPass && !smtpPass && (
                                <span className="text-[9.5px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  ✓ Mot de passe enregistré
                                </span>
                              )}
                            </div>
                            <input 
                              type="password"
                              value={smtpPass}
                              onChange={(e) => setSmtpPass(e.target.value)}
                              placeholder={smtpHasPass ? "•••••••••••••••• (Laissez vide pour conserver)" : "ex: abcd efgh ijkl mnop"}
                              className="w-full bg-white border border-slate-250 rounded p-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nom d'Expéditeur Affiché</label>
                            <input 
                              type="text"
                              value={smtpFromName}
                              onChange={(e) => setSmtpFromName(e.target.value)}
                              placeholder="Sogesti S.A. - Direction RiskFlow"
                              className="w-full bg-white border border-slate-250 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">E-mail d'En-tête (Reply-To)</label>
                            <input 
                              type="email"
                              value={smtpFromEmail}
                              onChange={(e) => setSmtpFromEmail(e.target.value)}
                              placeholder="noreply@sogesti-grc.com"
                              className="w-full bg-white border border-slate-250 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={smtpEnabled}
                              onChange={(e) => setSmtpEnabled(e.target.checked)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                            />
                            <span className="text-xs font-bold text-slate-700">Activer l'expédition automatique des notifications e-mail</span>
                          </label>

                          <button
                            type="submit"
                            disabled={isSavingSmtp}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow transition text-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isSavingSmtp ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Enregistrer la Configuration SMTP
                          </button>
                        </div>
                      </form>

                      {/* Quick Test Panel */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <Send className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Test de Connexion & Expédition d'E-mail Réel</h4>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          Saisissez une adresse e-mail destinataire ci-dessous pour tester la connexion réseau et recevoir un message de validation.
                        </p>
                        <div className="flex flex-wrap sm:flex-nowrap gap-2">
                          <input 
                            type="email"
                            value={testRecipient}
                            onChange={(e) => setTestRecipient(e.target.value)}
                            placeholder="ex: admin.conformite@entreprise.com"
                            className="flex-grow bg-slate-50 border border-slate-250 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={handleTestSmtp}
                            disabled={isTestingSmtp}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow transition text-xs cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                          >
                            {isTestingSmtp ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            🧪 Tester la Connexion SMTP
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: Audit Logs & Automated Rules */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* E-mail Audit Log */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <History className="w-4 h-4 text-indigo-600" />
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Journal d'Audit des E-mails Expédiés</h4>
                          </div>
                          <button
                            onClick={handleClearSmtpLogs}
                            className="text-[10px] text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                          >
                            Vider le journal
                          </button>
                        </div>

                        <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
                          {smtpLogs.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-[11px] italic">
                              Aucun e-mail expédié récemment pour cette entreprise.
                            </div>
                          ) : (
                            smtpLogs.map((log) => (
                              <div key={log.id} className="p-2.5 bg-white rounded border border-slate-200 text-[11px] space-y-1 shadow-2xs">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-800 truncate max-w-[180px]">{log.to}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    log.status === 'Envoyé' 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : log.status === 'Échec'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {log.status}
                                  </span>
                                </div>
                                <div className="text-slate-600 font-medium truncate">{log.subject}</div>
                                <div className="flex justify-between items-center text-[9.5px] text-slate-400 font-mono">
                                  <span>{log.type}</span>
                                  <span>{new Date(log.timestamp).toLocaleTimeString('fr-FR')}</span>
                                </div>
                                {log.error && (
                                  <div className="text-[10px] text-red-600 font-mono bg-red-50 p-1 rounded border border-red-150 mt-1">
                                    {log.error}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Automated GRC Dispatch Rules */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm text-[11px]">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Règles d'Expédition Automatisées</h4>
                        </div>
                        <ul className="space-y-2 text-slate-600">
                          <li className="flex items-start space-x-2">
                            <span className="text-red-500 font-bold">🚨</span>
                            <span><strong>Risque Critique :</strong> Alerte e-mail instantanée si Score Net &ge; 15.</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-indigo-500 font-bold">📋</span>
                            <span><strong>Plan d'Action :</strong> Notification au Responsable lors de l'assignation.</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-emerald-500 font-bold">🕵️</span>
                            <span><strong>Missions d'Audit :</strong> Convocation automatique des auditeurs & audités.</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-amber-500 font-bold">📅</span>
                            <span><strong>Bilan d'Exercice :</strong> Envoi du rapport annuel lors de la clôture.</span>
                          </li>
                        </ul>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TENANT CONFIGURATION TAB (Enterprise Settings & Quotas) */}
          {activeTab === 'tenants' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    Fiche d'Identité & Configuration de l'Entreprise
                  </h3>
                  <p className="text-slate-400 text-[10.5px]">
                    Gérez l'identité institutionnelle, l'identité visuelle de l'ERP pour votre entreprise et consultez vos limites de quotas contractuels.
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              {paramsStatus && (
                <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs shadow-sm ${
                  paramsStatus.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${paramsStatus.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`} />
                  <p className="font-bold">{paramsStatus.text}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Identity Form */}
                <form onSubmit={handleSaveParams} className="lg:col-span-7 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-sm text-left">
                  <div className="border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-indigo-600" />
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Identité Institutionnelle de l'Entreprise</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Raison Sociale / Nom d'Entreprise</label>
                      <input 
                        type="text"
                        required
                        value={compName}
                        onChange={(e) => setCompName(e.target.value)}
                        placeholder="Ex. Sogesti S.A."
                        className="w-full bg-white border border-slate-250 rounded p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Logo de l'Entreprise</label>
                      
                      {/* Drag & Drop Zone */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(true);
                        }}
                        onDragLeave={() => setIsDraggingLogo(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleLogoFile(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => document.getElementById('logo-file-input')?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                          isDraggingLogo 
                            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
                            : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <input 
                          id="logo-file-input"
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLogoFile(e.target.files[0]);
                            }
                          }}
                        />

                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className={`p-3 rounded-full ${isDraggingLogo ? 'bg-indigo-100 text-indigo-650' : 'bg-slate-100 text-slate-500'}`}>
                            <UploadCloud className="w-6 h-6 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">
                              Faites glisser votre image ici, ou <span className="text-indigo-650 hover:underline">parcourez vos fichiers</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                              Taille maximum : 2 Mo | Formats acceptés : PNG, JPG, SVG, WebP
                            </p>
                          </div>
                        </div>
                      </div>

                      {logoError && (
                        <div className="text-[11px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-150 flex items-center gap-1.5 animate-shake">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {logoError}
                        </div>
                      )}

                      {compLogo && (
                        <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="p-1 bg-slate-50 rounded border border-slate-100">
                              <img 
                                src={compLogo} 
                                alt="Logo entreprise" 
                                className="h-12 w-20 object-contain rounded"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&fit=crop&q=60';
                                }}
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Aperçu Actif du Logo</span>
                              <span className="text-[11px] font-mono text-slate-600">Image chargée avec succès</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompLogo('');
                              setLogoError(null);
                            }}
                            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Supprimer le logo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">E-mail de Contact Officiel</label>
                      <input 
                        type="email"
                        value={compEmail}
                        onChange={(e) => setCompEmail(e.target.value)}
                        placeholder="contact@entreprise.com"
                        className="w-full bg-white border border-slate-250 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Téléphone</label>
                      <input 
                        type="text"
                        value={compPhone}
                        onChange={(e) => setCompPhone(e.target.value)}
                        placeholder="+237 600 00 00 00"
                        className="w-full bg-white border border-slate-250 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ville</label>
                      <input 
                        type="text"
                        value={compCity}
                        onChange={(e) => setCompCity(e.target.value)}
                        placeholder="Yaoundé"
                        className="w-full bg-white border border-slate-250 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pays</label>
                      <input 
                        type="text"
                        value={compCountry}
                        onChange={(e) => setCompCountry(e.target.value)}
                        placeholder="Cameroun"
                        className="w-full bg-white border border-slate-250 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-200">
                    <button
                      type="submit"
                      disabled={isSavingParams}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow transition text-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingParams ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Enregistrer les Paramètres d'Entreprise
                    </button>
                  </div>
                </form>

                {/* RIGHT COLUMN: License Details & Quota Limits */}
                <div className="lg:col-span-5 space-y-6 text-left">
                  {/* Subscription Card */}
                  <div className="p-4 bg-slate-900 text-white border border-slate-800 rounded-xl space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-indigo-400" />
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">Abonnement & Licence GRC</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                        {licence?.statutLicence || 'Active'}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Type d'Offre :</span>
                        <strong className="text-indigo-300 font-bold">Formule {licence?.typeAbonnement || 'Sur devis'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Période d'Exercice :</span>
                        <strong className="text-white font-mono">{licence?.dateDebut ? new Date(licence.dateDebut).toLocaleDateString('fr-FR') : '01/01/2026'} au {licence?.dateFin ? new Date(licence.dateFin).toLocaleDateString('fr-FR') : '31/12/2026'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mode Dépassement Quota :</span>
                        <strong className={`font-semibold capitalize ${licence?.depassementQuotaMode === 'blocage' ? 'text-red-400' : 'text-amber-400'}`}>
                          {licence?.depassementQuotaMode || 'Blocage strict'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Moteur de Cotation Actif :</span>
                        <strong className="text-cyan-300 font-bold uppercase">{tenantConfig?.formula?.name || 'IFACI (F x I x M)'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Quotas & Quota Consumptions */}
                  {(() => {
                    const maxF = activeEntreprise?.maxFiliales ?? 5;
                    const maxDir = activeEntreprise?.maxDirections ?? 5;
                    const maxDep = activeEntreprise?.maxDepartements ?? 10;
                    const maxSer = activeEntreprise?.maxServices ?? 15;
                    const maxSit = activeEntreprise?.maxSitesLocaux ?? 5;
                    const maxSuc = licence?.nombre_succursales_max ?? activeEntreprise?.maxSuccursales ?? 5;

                    const curF = tenantConfig?.entities?.filter(e => e.statut !== 'Archivé' && e.type === 'Filiale').length || 0;
                    const curDir = tenantConfig?.entities?.filter(e => e.statut !== 'Archivé' && e.type === 'Direction').length || 0;
                    const curDep = tenantConfig?.entities?.filter(e => e.statut !== 'Archivé' && e.type === 'Département').length || 0;
                    const curSer = tenantConfig?.entities?.filter(e => e.statut !== 'Archivé' && e.type === 'Service').length || 0;
                    const curSit = tenantConfig?.entities?.filter(e => e.statut !== 'Archivé' && e.type === 'Site').length || 0;
                    const curSuc = tenantConfig?.entities?.filter(e => e.statut !== 'Archivé' && e.est_succursale === true).length || 0;

                    const barWidth = (cur: number, max: number) => {
                      const pct = Math.min(100, (cur / max) * 100);
                      return `${pct}%`;
                    };

                    const barColor = (cur: number, max: number) => {
                      if (cur >= max) return 'bg-red-500';
                      if (cur >= max * 0.8) return 'bg-amber-500';
                      return 'bg-indigo-600';
                    };

                    return (
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm text-xs">
                        <div className="border-b border-slate-100 pb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <h4 className="font-bold text-slate-800 text-[10.5px] uppercase tracking-wider">Périmètres & Consommation des Quotas</h4>
                        </div>

                        <div className="space-y-3.5">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold text-slate-700">Directions Métier</span>
                              <span className="text-slate-500 font-mono font-bold">{curDir} / {maxDir}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${barColor(curDir, maxDir)}`} style={{ width: barWidth(curDir, maxDir) }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold text-slate-700">Départements GRC</span>
                              <span className="text-slate-500 font-mono font-bold">{curDep} / {maxDep}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${barColor(curDep, maxDep)}`} style={{ width: barWidth(curDep, maxDep) }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold text-slate-700">Services Opérationnels</span>
                              <span className="text-slate-500 font-mono font-bold">{curSer} / {maxSer}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${barColor(curSer, maxSer)}`} style={{ width: barWidth(curSer, maxSer) }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold text-slate-700">Sites Physiques / Agences</span>
                              <span className="text-slate-500 font-mono font-bold">{curSit} / {maxSit}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${barColor(curSit, maxSit)}`} style={{ width: barWidth(curSit, maxSit) }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold text-slate-700">Filiales Juridiques</span>
                              <span className="text-slate-500 font-mono font-bold">{curF} / {maxF}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${barColor(curF, maxF)}`} style={{ width: barWidth(curF, maxF) }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold text-slate-700">Succursales d'Entreprise</span>
                              <span className="text-slate-500 font-mono font-bold">{curSuc} / {maxSuc}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${barColor(curSuc, maxSuc)}`} style={{ width: barWidth(curSuc, maxSuc) }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
