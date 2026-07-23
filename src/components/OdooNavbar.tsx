/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Briefcase, 
  Settings, 
  ShieldAlert, 
  Layers, 
  Sliders, 
  BarChart3, 
  Users, 
  FileText, 
  CheckSquare, 
  Grid, 
  ChevronDown, 
  Bell,
  Search,
  Activity,
  LogOut,
  ClipboardList,
  Award
} from 'lucide-react';
import { TenantConfig, User } from '../types';

interface OdooNavbarProps {
  tenants: TenantConfig[];
  activeTenantId: string;
  setActiveTenantId: (id: string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  onUpdateUsers?: React.Dispatch<React.SetStateAction<User[]>>;
  onConfigureCompany?: () => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
  onAddLog: (action: string, details: string) => void;
  isSuperAdminMode: boolean;
  onToggleSuperAdminMode: (active: boolean) => void;
  onLogout?: () => void;
}

export default function OdooNavbar({
  tenants,
  activeTenantId,
  setActiveTenantId,
  currentUser,
  setCurrentUser,
  users,
  onUpdateUsers,
  onConfigureCompany,
  activeModule,
  setActiveModule,
  onAddLog,
  isSuperAdminMode,
  onToggleSuperAdminMode,
  onLogout
}: OdooNavbarProps) {
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // States for password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const activeTenant = tenants.find(t => t.id === activeTenantId) || tenants[0];

  const appModules = [
    { id: 'dashboard', name: 'Tableau de Bord', icon: BarChart3, color: 'bg-indigo-600 text-white' },
    { id: 'risks', name: 'Cartographie', icon: ShieldAlert, color: 'bg-slate-700 text-white' },
    { id: 'evaluation', name: 'Calcul & Évaluation', icon: Sliders, color: 'bg-indigo-500 text-white' },
    { id: 'heatmap', name: 'Matrice Risques', icon: Grid, color: 'bg-red-500 text-white' },
    { id: 'actions', name: 'Plans d\'Actions', icon: CheckSquare, color: 'bg-green-600 text-white' },
    { id: 'audit', name: 'Audit Interne', icon: ClipboardList, color: 'bg-indigo-650 text-white' },
    { id: 'compliance', name: 'Conformité', icon: Award, color: 'bg-teal-600 text-white' },
    { id: 'config', name: 'Configuration', icon: Settings, color: 'bg-amber-600 text-white' },
    { id: 'admin', name: 'Administration', icon: Users, color: 'bg-slate-700 text-white' },
    { id: 'reporting', name: 'Rapports & Audit', icon: FileText, color: 'bg-indigo-600 text-white' },
  ];

  const allowedApps = appModules.filter(mod => {
    if (currentUser.role === 'SuperAdmin' || currentUser.role === 'Administrateur') return true;
    if (currentUser.allowedModules && currentUser.allowedModules.length > 0) {
      return currentUser.allowedModules.includes(mod.id);
    }
    // Fallback: Analyste shouldn't see Admin or Config by default
    if (currentUser.role === 'Analyste') {
      return !['admin', 'config'].includes(mod.id);
    }
    return true;
  });

  const currentModuleObj = appModules.find(m => m.id === activeModule) || appModules[0];

  const handleModuleClick = (modId: string) => {
    setActiveModule(modId);
    if (isSuperAdminMode) {
      onToggleSuperAdminMode(false);
    }
    setShowAppsMenu(false);
    onAddLog('Navigation', `Accès au module ${appModules.find(m => m.id === modId)?.name}`);
  };

  const handleTenantChange = (tenantId: string) => {
    setActiveTenantId(tenantId);
    setShowTenantMenu(false);
    const chosen = tenants.find(t => t.id === tenantId);
    onAddLog('Changement Tenant', `Bascule vers l'organisation ${chosen?.companyName}`);
  };

  const handleUserChange = (u: User) => {
    setCurrentUser(u);
    setShowUserMenu(false);
    onAddLog('Changement Utilisateur', `Connexion en tant que ${u.name} [${u.role}]`);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setPasswordError('Veuillez entrer un mot de passe.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (onUpdateUsers) {
      onUpdateUsers(prev => prev.map(u => {
        if (u.id === currentUser.id) {
          return { ...u, password: newPassword };
        }
        return u;
      }));
    }

    setCurrentUser({ ...currentUser, password: newPassword });
    setPasswordSuccess('Votre mot de passe a été modifié avec succès !');
    setPasswordError('');
    setNewPassword('');
    setConfirmPassword('');
    onAddLog('Sécurité', `Modification du mot de passe pour l'utilisateur ${currentUser.name}`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex flex-col w-full bg-slate-900 text-white shadow-sm border-b border-slate-800">
      {/* Upper bar: Odoo Classic Deep Dark Purple Line replaced with Elegant High Density Dark Slate */}
      <div className="flex items-center justify-between h-11 px-4 bg-slate-900">
        {/* Left Side: Home Apps Switcher & Navigation Title */}
        <div className="flex items-center space-x-4">
          <button 
            id="odoo-app-switcher-btn"
            onClick={() => setShowAppsMenu(!showAppsMenu)}
            className="p-1.5 rounded hover:bg-slate-800 transition-colors focus:outline-none flex items-center space-x-1"
            title="Applications GRC"
          >
            <Grid className="w-4.5 h-4.5" />
            <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded">
              Apps
            </span>
          </button>

          {/* Current App Active Indicator */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-extrabold tracking-widest text-[#D46F33] hidden sm:inline">
              RISKFLOW
            </span>
            <span className="text-slate-650">/</span>
            <div className="flex items-center space-x-2">
              <currentModuleObj.icon className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-sm text-white">{currentModuleObj.name}</span>
            </div>
          </div>
        </div>

        {/* Center/Search Line - standard odoo search styling */}
        <div className="hidden lg:flex items-center max-w-xs xl:max-w-md w-full bg-white/10 hover:bg-white/15 px-3 py-1 rounded text-xs text-slate-200 transition-all border border-white/5">
          <Search className="w-3.5 h-3.5 mr-2 text-slate-300" />
          <input 
            type="text" 
            placeholder="Recherche rapide d'un risque R-..." 
            className="bg-transparent border-none text-white focus:outline-none w-full placeholder-slate-300"
            disabled
          />
          <span className="text-[10px] bg-white/20 px-1 rounded text-white/80">CTRL K</span>
        </div>

        {/* Right Side: Tenant Picker, Notifications, User */}
        <div className="flex items-center space-x-4">
          {/* Toggle button for SuperAdmin Platform mode (Only visible when already in SuperAdminMode to switch back) */}
          {isSuperAdminMode && false && (
            <button
              onClick={() => {
                onToggleSuperAdminMode(false);
                onAddLog('Espace Switch', 'Retour à l\'espace GRC client');
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all duration-150 border cursor-pointer bg-amber-500 text-slate-950 border-amber-600 hover:bg-amber-400"
              title="Retourner à la GRC Client"
            >
              <span>🏢 Retour Client</span>
            </button>
          )}

          {/* Active Tenant Selector (Odoo Multi-company concept) */}
          {!isSuperAdminMode && currentUser.role !== 'SuperAdmin' && (
            <div className="relative">
              <button
                id="tenant-selector-btn"
                disabled
                className="flex items-center space-x-2 px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 text-indigo-300 border border-slate-700 cursor-default select-none"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span className="max-w-[130px] truncate">{activeTenant.companyName}</span>
              </button>
            </div>
          )}

          {/* Quick Alert Bell */}
          <div className="relative">
            <button
              id="notifications-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1 hover:bg-slate-800 rounded transition-colors relative"
            >
              <Bell className="w-4 h-4 text-slate-200" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
                <div className="absolute right-0 mt-1.5 w-72 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-2.5 z-20 animate-fade-in text-xs">
                  <div className="px-3 pb-2 font-semibold text-slate-500 border-b border-slate-100">
                    Notifications GRC
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <div className="px-3 py-2 hover:bg-slate-50 border-b border-slate-50">
                      <span className="font-semibold text-red-600">Alerte Seuil !</span> Le risque <span className="font-semibold text-slate-700">R-105</span> est classé en <span className="font-semibold text-red-600">Risque Élevé (36)</span> nécessitant une relance.
                    </div>
                    <div className="px-3 py-2 hover:bg-slate-50 border-b border-slate-50">
                      <span className="font-semibold text-amber-600">Validation Requise :</span> Le risque <span className="font-semibold text-slate-700">R-102</span> attend la confirmation du représentant.
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Current User Role Identity */}
          <div className="relative">
            <button
              id="user-profile-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 rounded text-left hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
            >
              <img 
                src={currentUser.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80"} 
                alt={currentUser.name} 
                className="w-7 h-7 rounded-full object-cover border border-slate-700" 
              />
              <div className="hidden md:block text-left">
                <div className="flex items-center space-x-1">
                  <p className="text-[11px] font-semibold leading-none text-slate-200">{currentUser.name}</p>
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5">{currentUser.role}</p>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                <div className="absolute right-0 mt-1.5 w-60 bg-slate-900 border border-slate-800 rounded shadow-2xl py-2 z-50 animate-fade-in text-xs text-slate-200">
                  <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-950/40">
                    <p className="font-semibold text-white text-[11px]">{currentUser.name}</p>
                    <p className="text-slate-500 font-mono text-[9px] truncate">{currentUser.email}</p>
                    <p className="mt-1 inline-block bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded text-[8px] font-bold border border-indigo-900/40">
                      {currentUser.role}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowPasswordModal(true);
                        setPasswordSuccess('');
                        setPasswordError('');
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-slate-800 text-left font-medium text-slate-300 text-[11px] transition-colors"
                    >
                      <span>🔑 Modifier mot de passe</span>
                    </button>
                  </div>

                  {/* Logout Button */}
                  {onLogout && (
                    <div className="border-t border-slate-800 mt-1.5 pt-1.5 px-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-400 rounded text-[10px] font-bold border border-red-900/30 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Fermer la session</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Primary Odoo Tab Bar: Quick Module Switch Ribbon replaced with sleek high density bar */}
      {!isSuperAdminMode ? (
        <nav className="flex items-center space-x-1 px-4 py-1 bg-slate-800 overflow-x-auto text-xs font-medium border-t border-slate-700/50 scrollbar-none">
          {allowedApps.map((mod) => {
            const IconComponent = mod.icon;
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => handleModuleClick(mod.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-all duration-150 whitespace-nowrap outline-none ${
                  isActive 
                    ? 'bg-slate-900 text-indigo-400 font-bold border border-slate-750' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{mod.name}</span>
              </button>
            );
          })}
        </nav>
      ) : (
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-850 text-[10px] text-amber-400 font-bold border-t border-slate-800 uppercase tracking-widest">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
            <span>Console d'administration de la Plateforme (Multi-Tenant)</span>
          </div>
        </div>
      )}
    </header>

    {showPasswordModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in text-slate-800">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2">
              <span>🔑 Modifier mon mot de passe</span>
            </h3>
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-[11px] font-semibold">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-[11px] font-semibold">
                {passwordError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase block">Nouveau Mot de Passe</label>
              <input 
                type="password"
                required
                placeholder="Saisissez votre nouveau mot de passe..."
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordSuccess('');
                  setPasswordError('');
                }}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase block">Confirmer le Mot de Passe</label>
              <input 
                type="password"
                required
                placeholder="Confirmez le mot de passe..."
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordSuccess('');
                  setPasswordError('');
                }}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded shadow transition text-xs cursor-pointer"
              >
                Sauvegarder
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded text-xs transition"
              >
                Fermer
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
);
}
