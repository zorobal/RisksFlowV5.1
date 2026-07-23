/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Layers, 
  Wrench, 
  Boxes, 
  FolderOpen, 
  ShieldCheck, 
  Users, 
  Workflow, 
  Code, 
  Clock, 
  ArrowRight,
  UserCheck,
  ToggleLeft,
  CheckCircle,
  Activity,
  UserX,
  Database,
  Copy,
  Check,
  CloudLightning,
  RefreshCw,
  AlertCircle,
  Server,
  ArrowUp,
  ArrowDown,
  Edit
} from 'lucide-react';
import { 
  TenantConfig, 
  ScaleItem, 
  RiskCategory, 
  OrgEntity, 
  Fonction, 
  Affectation, 
  Rule, 
  AccessProfile,
  User as GrcUser,
  Role
} from '../types';
interface ConfigModuleProps {
  tenantConfig: TenantConfig;
  onUpdateTenantConfig: (config: TenantConfig) => void;
  fonctions: Fonction[];
  onUpdateFonctions: (fns: Fonction[]) => void;
  affectations: Affectation[];
  onUpdateAffectations: (affs: Affectation[]) => void;
  rules: Rule[];
  onUpdateRules: (rls: Rule[]) => void;
  accessProfiles: AccessProfile[];
  onUpdateAccessProfiles: (aps: AccessProfile[]) => void;
  users: GrcUser[];
  onAddUser?: (u: Omit<GrcUser, 'id'>) => void;
  onDeleteUser?: (id: string) => void;
  onUpdateUser?: (u: GrcUser) => void;
  onAddLog: (action: string, details: string) => void;
  maxSuccursales?: number;
  maxDirections?: number;
  maxDepartements?: number;
  maxServices?: number;
  maxSitesLocaux?: number;
  maxFiliales?: number;
  depassementQuotaMode?: 'blocage' | 'inactif';
  succursalesActives?: boolean;
}

export default function ConfigModule({
  tenantConfig,
  onUpdateTenantConfig,
  fonctions,
  onUpdateFonctions,
  affectations,
  onUpdateAffectations,
  rules,
  onUpdateRules,
  accessProfiles,
  onUpdateAccessProfiles,
  users,
  onAddUser,
  onDeleteUser,
  onUpdateUser,
  onAddLog,
  maxSuccursales = 5,
  maxDirections = 5,
  maxDepartements = 10,
  maxServices = 15,
  maxSitesLocaux = 5,
  maxFiliales = 5,
  depassementQuotaMode = 'blocage',
  succursalesActives = true
}: ConfigModuleProps) {
  // Config Modules Sub-tab switcher
  const [activeTab, setActiveTab] = useState<'org' | 'functions' | 'rules' | 'scales' | 'formula' | 'categories' | 'workflow' | 'rights' | 'formbuilder'>('org');

  // Form Builder No-Code State
  const [customFields, setCustomFields] = useState<{
    id: string;
    targetObject: 'Risque' | 'Incident' | 'Action' | 'Audit';
    label: string;
    code: string;
    type: 'Texte' | 'Nombre' | 'Liste' | 'Date' | 'Case à cocher';
    options?: string;
    required: boolean;
  }>([
    { id: 'cf_1', targetObject: 'Risque', label: 'Montant d\'assurance spécifique (€)', code: 'VALEUR_ASSURANCE', type: 'Nombre', required: false },
    { id: 'cf_2', targetObject: 'Risque', label: 'Référent Technique Métier', code: 'REF_TECH', type: 'Texte', required: true },
    { id: 'cf_3', targetObject: 'Incident', label: 'Infiltration / Fiche SSI', code: 'INC_SSI', type: 'Case à cocher', required: false },
    { id: 'cf_4', targetObject: 'Action', label: 'Centre de coût rattaché', code: 'CENTRE_COUT', type: 'Liste', options: 'Finance, DSI, Logistique, RH', required: true }
  ]);

  const [newCfTarget, setNewCfTarget] = useState<'Risque' | 'Incident' | 'Action' | 'Audit'>('Risque');
  const [newCfLabel, setNewCfLabel] = useState('');
  const [newCfCode, setNewCfCode] = useState('');
  const [newCfType, setNewCfType] = useState<'Texte' | 'Nombre' | 'Liste' | 'Date' | 'Case à cocher'>('Texte');
  const [newCfOptions, setNewCfOptions] = useState('');
  const [newCfReq, setNewCfReq] = useState(false);

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCfLabel.trim()) return;
    const generatedCode = newCfCode.trim() ? newCfCode.toUpperCase().replace(/\s+/g, '_') : `CF_${Date.now()}`;
    const newField = {
      id: `cf_${Date.now()}`,
      targetObject: newCfTarget,
      label: newCfLabel,
      code: generatedCode,
      type: newCfType,
      options: newCfOptions,
      required: newCfReq
    };
    setCustomFields([...customFields, newField]);
    setNewCfLabel('');
    setNewCfCode('');
    setNewCfOptions('');
    onAddLog('Form Builder', `Ajout du champ personnalisé "${newCfLabel}" pour les formulaires ${newCfTarget}`);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter(cf => cf.id !== id));
  };

  // Org Node Inputs
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState<OrgEntity['type']>('Département');
  const [newOrgParent, setNewOrgParent] = useState('');
  const [newOrgCode, setNewOrgCode] = useState('');
  const [newOrgSecondary, setNewOrgSecondary] = useState<string>(''); // For matriciel
  const [newOrgIsSuccursale, setNewOrgIsSuccursale] = useState(false);
  const [newOrgSousOrgMode, setNewOrgSousOrgMode] = useState<'heritage' | 'propre'>('heritage');
  const [newOrgVille, setNewOrgVille] = useState('');
  const [newOrgPays, setNewOrgPays] = useState('');
  const [newOrgAdresse, setNewOrgAdresse] = useState('');

  // Function & Assignment Inputs
  const [newFTitle, setNewFTitle] = useState('');
  const [newFEntity, setNewFEntity] = useState(tenantConfig.entities[0]?.id || '');
  const [newFProfile, setNewFProfile] = useState(accessProfiles[0]?.id || 'ap3');

  // Collaborator management states
  const [editingCollab, setEditingCollab] = useState<GrcUser | null>(null);
  const [editCollabName, setEditCollabName] = useState('');
  const [editCollabEmail, setEditCollabEmail] = useState('');
  const [editCollabRole, setEditCollabRole] = useState<Role>('Analyste');
  const [editCollabEntityId, setEditCollabEntityId] = useState('');
  const [editCollabIsActive, setEditCollabIsActive] = useState(true);

  const [showAddCollabForm, setShowAddCollabForm] = useState(false);
  const [newCollabName, setNewCollabName] = useState('');
  const [newCollabEmail, setNewCollabEmail] = useState('');
  const [newCollabRole, setNewCollabRole] = useState<Role>('Analyste');
  const [newCollabEntityId, setNewCollabEntityId] = useState('');

  // Access profiles CRUD states
  const [showAddProfileForm, setShowAddProfileForm] = useState(false);
  const [newProfileLibelle, setNewProfileLibelle] = useState('');
  const [newProfilePortee, setNewProfilePortee] = useState<'Unité propre' | 'Unité + sous-unités' | 'Toutes unités' | 'Unités spécifiques'>('Unité propre');
  const [newProfileModuleDroits, setNewProfileModuleDroits] = useState<{
    [moduleId: string]: {
      lecture: boolean;
      ecriture: boolean;
      modification: boolean;
      suppression: boolean;
      importation: boolean;
      exportation: boolean;
    }
  }>({
    dashboard: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: false },
    risks: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: false },
    evaluation: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: false },
    heatmap: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: false },
    actions: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: false },
    audit: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: false },
    compliance: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: false },
    admin: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: false },
    reporting: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: false }
  });

  const [editingProfile, setEditingProfile] = useState<AccessProfile | null>(null);
  const [editProfileLibelle, setEditProfileLibelle] = useState('');
  const [editProfilePortee, setEditProfilePortee] = useState<'Unité propre' | 'Unité + sous-unités' | 'Toutes unités' | 'Unités spécifiques'>('Unité propre');
  const [editProfileModuleDroits, setEditProfileModuleDroits] = useState<{
    [moduleId: string]: {
      lecture: boolean;
      ecriture: boolean;
      modification: boolean;
      suppression: boolean;
      importation: boolean;
      exportation: boolean;
    }
  }>({});

  const handleNewProfileModuleDroitChange = (moduleId: string, rightKey: 'lecture' | 'ecriture' | 'modification' | 'suppression' | 'importation' | 'exportation', value: boolean) => {
    setNewProfileModuleDroits(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [rightKey]: value
      }
    }));
  };

  const handleEditProfileModuleDroitChange = (moduleId: string, rightKey: 'lecture' | 'ecriture' | 'modification' | 'suppression' | 'importation' | 'exportation', value: boolean) => {
    setEditProfileModuleDroits(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [rightKey]: value
      }
    }));
  };

  const [assignUser, setAssignUser] = useState(users[0]?.id || '');
  const [assignFunction, setAssignFunction] = useState(fonctions[0]?.id || '');
  const [assignDateDebut, setAssignDateDebut] = useState('2026-06-29');

  // Rules Engine Builder Inputs
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleType, setNewRuleType] = useState<Rule['typeRegle']>('Workflow');
  const [newRuleTarget, setNewRuleTarget] = useState<Rule['objetCible']>('Risque');
  const [newRuleCondField, setNewRuleCondField] = useState('scoreBrut');
  const [newRuleCondOp, setNewRuleCondOp] = useState('>=');
  const [newRuleCondVal, setNewRuleCondVal] = useState('12');
  const [newRuleActType, setNewRuleActType] = useState<Rule['action']['type']>('ESCALADE_VALIDATION');
  const [newRuleActLevel, setNewRuleActLevel] = useState('Comite_Audit');
  const [newRuleActNotifier, setNewRuleActNotifier] = useState<string>('f_cro');

  // Scales Sub-tab toggle
  const [activeScaleType, setActiveScaleType] = useState<'freq' | 'imp' | 'ctrl'>('freq');

  // Category Inputs
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#22c55e');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Formula Inputs
  const [selectedFormulaId, setSelectedFormulaId] = useState(tenantConfig.formula.id);
  const [matrixSize, setMatrixSize] = useState(tenantConfig.matrixSize);

  // Workflow step edit/create states
  const [newStepName, setNewStepName] = useState('');
  const [newStepColor, setNewStepColor] = useState('bg-slate-50 border-slate-200 text-slate-800');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepName, setEditingStepName] = useState('');
  const [editingStepColor, setEditingStepColor] = useState('');

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepName.trim()) return;

    const nextOrder = tenantConfig.workflowSteps.length + 1;
    const newStep = {
      id: `w_step_${Date.now()}`,
      name: newStepName.trim(),
      color: newStepColor,
      order: nextOrder
    };

    onUpdateTenantConfig({
      ...tenantConfig,
      workflowSteps: [...tenantConfig.workflowSteps, newStep]
    });

    onAddLog('Workflow', `Ajout de l'étape de validation : ${newStep.name}`);
    setNewStepName('');
  };

  const handleDeleteStep = (id: string) => {
    if (tenantConfig.workflowSteps.length <= 1) {
      alert("Impossible de supprimer la dernière étape de validation.");
      return;
    }
    const filteredSteps = tenantConfig.workflowSteps.filter(s => s.id !== id);
    const reorderedSteps = filteredSteps.map((s, index) => ({
      ...s,
      order: index + 1
    }));

    onUpdateTenantConfig({
      ...tenantConfig,
      workflowSteps: reorderedSteps
    });
    onAddLog('Workflow', `Suppression de l'étape de validation ID ${id}.`);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const steps = [...tenantConfig.workflowSteps];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = steps[index];
    steps[index] = steps[targetIndex];
    steps[targetIndex] = temp;

    const updatedSteps = steps.map((s, idx) => ({
      ...s,
      order: idx + 1
    }));

    onUpdateTenantConfig({
      ...tenantConfig,
      workflowSteps: updatedSteps
    });
    onAddLog('Workflow', `Réorganisation de la séquence du workflow.`);
  };

  const handleSaveEditStep = (id: string) => {
    if (!editingStepName.trim()) return;
    const updatedSteps = tenantConfig.workflowSteps.map(s => {
      if (s.id === id) {
        return {
          ...s,
          name: editingStepName.trim(),
          color: editingStepColor
        };
      }
      return s;
    });

    onUpdateTenantConfig({
      ...tenantConfig,
      workflowSteps: updatedSteps
    });

    onAddLog('Workflow', `Modification de l'étape en : ${editingStepName}`);
    setEditingStepId(null);
  };

  // --- Org Nodes Add & Remove ---
  const handleAddOrgNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    let determinedStatus: 'Actif' | 'Inactif' = 'Actif';

    if (newOrgIsSuccursale) {
      if (!succursalesActives) {
        alert("⚠️ Fonctionnalité Succursales désactivée :\n\nLa création de succursales est actuellement désactivée pour cet abonnement par le SuperAdministrateur.");
        return;
      }

      const currentSuccursalesCount = tenantConfig.entities.filter(
        ent => ent.statut !== 'Archivé' && ent.est_succursale === true
      ).length;

      if (currentSuccursalesCount >= maxSuccursales) {
        if (depassementQuotaMode === 'blocage') {
          alert(`⚠️ Dépassement de quota bloqué :\n\nVotre licence actuelle limite le nombre de succursales à ${maxSuccursales} (Nombre actuel: ${currentSuccursalesCount}).\n\nLa création d'une nouvelle succursale est interdite. Veuillez contacter le SuperAdministrateur pour modifier votre offre contractuelle.`);
          return;
        } else {
          // creation with Inactif status
          alert(`⚠️ Quota dépassé (Création restreinte) :\n\nLa limite contractuelle de ${maxSuccursales} succursales est atteinte.\nLa succursale sera créée avec le statut "Inactif" et sera bloquée jusqu'à mise à niveau de votre abonnement.`);
          determinedStatus = 'Inactif';
        }
      }
    }

    // Enforce specific structural unit quotas
    if (newOrgType === 'Direction') {
      const currentCount = tenantConfig.entities.filter(ent => ent.statut !== 'Archivé' && ent.type === 'Direction').length;
      if (currentCount >= maxDirections) {
        if (depassementQuotaMode === 'blocage') {
          alert(`⚠️ Dépassement de quota bloqué :\n\nVotre licence actuelle limite le nombre de Directions à ${maxDirections}.\n\nLa création d'une nouvelle Direction est interdite. Veuillez contacter le SuperAdministrateur pour modifier votre offre contractuelle.`);
          return;
        } else {
          alert(`⚠️ Quota dépassé :\n\nLa limite contractuelle de ${maxDirections} Directions est atteinte. L'unité sera créée avec le statut "Inactif".`);
          determinedStatus = 'Inactif';
        }
      }
    } else if (newOrgType === 'Département') {
      const currentCount = tenantConfig.entities.filter(ent => ent.statut !== 'Archivé' && ent.type === 'Département').length;
      if (currentCount >= maxDepartements) {
        if (depassementQuotaMode === 'blocage') {
          alert(`⚠️ Dépassement de quota bloqué :\n\nVotre licence actuelle limite le nombre de Départements à ${maxDepartements}.\n\nLa création d'un nouveau Département est interdite. Veuillez contacter le SuperAdministrateur pour modifier votre offre contractuelle.`);
          return;
        } else {
          alert(`⚠️ Quota dépassé :\n\nLa limite contractuelle de ${maxDepartements} Départements est atteinte. L'unité sera créée avec le statut "Inactif".`);
          determinedStatus = 'Inactif';
        }
      }
    } else if (newOrgType === 'Service') {
      const currentCount = tenantConfig.entities.filter(ent => ent.statut !== 'Archivé' && ent.type === 'Service').length;
      if (currentCount >= maxServices) {
        if (depassementQuotaMode === 'blocage') {
          alert(`⚠️ Dépassement de quota bloqué :\n\nVotre licence actuelle limite le nombre de Services à ${maxServices}.\n\nLa création d'un nouveau Service est interdite. Veuillez contacter le SuperAdministrateur pour modifier votre offre contractuelle.`);
          return;
        } else {
          alert(`⚠️ Quota dépassé :\n\nLa limite contractuelle de ${maxServices} Services est atteinte. L'unité sera créée avec le statut "Inactif".`);
          determinedStatus = 'Inactif';
        }
      }
    } else if (newOrgType === 'Site') {
      const currentCount = tenantConfig.entities.filter(ent => ent.statut !== 'Archivé' && ent.type === 'Site').length;
      if (currentCount >= maxSitesLocaux) {
        if (depassementQuotaMode === 'blocage') {
          alert(`⚠️ Dépassement de quota bloqué :\n\nVotre licence actuelle limite le nombre de Sites Locaux à ${maxSitesLocaux}.\n\nLa création d'un nouveau Site Local est interdite. Veuillez contacter le SuperAdministrateur pour modifier votre offre contractuelle.`);
          return;
        } else {
          alert(`⚠️ Quota dépassé :\n\nLa limite contractuelle de ${maxSitesLocaux} Sites Locaux est atteinte. L'unité sera créée avec le statut "Inactif".`);
          determinedStatus = 'Inactif';
        }
      }
    } else if (newOrgType === 'Filiale') {
      const currentCount = tenantConfig.entities.filter(ent => ent.statut !== 'Archivé' && ent.type === 'Filiale').length;
      if (currentCount >= maxFiliales) {
        if (depassementQuotaMode === 'blocage') {
          alert(`⚠️ Dépassement de quota bloqué :\n\nVotre licence actuelle limite le nombre de Filiales à ${maxFiliales}.\n\nLa création d'une nouvelle Filiale est interdite. Veuillez contacter le SuperAdministrateur pour modifier votre offre contractuelle.`);
          return;
        } else {
          alert(`⚠️ Quota dépassé :\n\nLa limite contractuelle de ${maxFiliales} Filiales est atteinte. L'unité sera créée avec le statut "Inactif".`);
          determinedStatus = 'Inactif';
        }
      }
    }

    const codeShort = newOrgCode.trim() || newOrgName.toUpperCase().substring(0, 5).replace(/ /g, '-');
    const newNode: OrgEntity = {
      id: `e_${Date.now()}`,
      name: newOrgName,
      type: newOrgType,
      parentId: newOrgParent || undefined,
      code: codeShort,
      statut: determinedStatus,
      rattachementsSecondaires: newOrgSecondary ? [newOrgSecondary] : [],
      est_succursale: newOrgIsSuccursale,
      sousOrganigrammeMode: newOrgIsSuccursale ? newOrgSousOrgMode : undefined,
      ville: newOrgVille.trim() || undefined,
      pays: newOrgPays.trim() || undefined,
      adresse: newOrgAdresse.trim() || undefined
    };

    onUpdateTenantConfig({
      ...tenantConfig,
      entities: [...tenantConfig.entities, newNode]
    });

    onAddLog('Config Structure', `Ajout de l'unité organisationnelle "${newOrgName}" [Code: ${codeShort}, Type: ${newOrgType}]${newOrgIsSuccursale ? ' (Marquée comme Succursale)' : ''}`);
    setNewOrgName('');
    setNewOrgCode('');
    setNewOrgParent('');
    setNewOrgSecondary('');
    setNewOrgIsSuccursale(false);
    setNewOrgSousOrgMode('heritage');
    setNewOrgVille('');
    setNewOrgPays('');
    setNewOrgAdresse('');
  };

  const handleRemoveOrgNode = (id: string) => {
    const hasChildren = tenantConfig.entities.some(e => e.parentId === id);
    if (hasChildren) {
      alert("⚠️ Cette unité possède des sous-composants hiérarchiques. Veuillez d'abord supprimer ou réassigner ces sous-unités.");
      return;
    }

    const updated = {
      ...tenantConfig,
      entities: tenantConfig.entities.map(e => e.id === id ? { ...e, statut: 'Archivé' as const } : e)
    };
    onUpdateTenantConfig(updated);
    onAddLog('Config Structure', `Archivage / Soft Delete de l'unité organisationnelle [ID: ${id}]`);
  };

  // --- Functions & Assignments ---
  const handleAddFunction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFTitle.trim()) return;

    const newFn: Fonction = {
      id: `fn_${Date.now()}`,
      libelle: newFTitle,
      entityId: newFEntity,
      habilitationProfileId: newFProfile
    };

    onUpdateFonctions([...fonctions, newFn]);
    onAddLog('Config Fonctions', `Création de la fonction métier "${newFTitle}"`);
    setNewFTitle('');
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUser || !assignFunction) return;

    // Check if there is already an active assignment for this function
    const existingActive = affectations.find(a => a.fonctionId === assignFunction && a.statut === 'Actif');
    let updatedAffectations = [...affectations];
    
    if (existingActive) {
      // Soft end existing one to maintain history
      updatedAffectations = updatedAffectations.map(a => 
        a.id === existingActive.id 
          ? { ...a, statut: 'Historique' as const, dateFin: assignDateDebut } 
          : a
      );
    }

    const newAff: Affectation = {
      id: `aff_${Date.now()}`,
      userId: assignUser,
      fonctionId: assignFunction,
      dateDebut: assignDateDebut,
      statut: 'Actif'
    };

    onUpdateAffectations([...updatedAffectations, newAff]);
    
    const userName = users.find(u => u.id === assignUser)?.name || 'Inconnu';
    const functionLabel = fonctions.find(f => f.id === assignFunction)?.libelle || 'Fonction';
    onAddLog('Config Habilitations', `Affectation de ${userName} à la fonction "${functionLabel}"`);
  };

  const handleRemoveAssignment = (id: string) => {
    const updated = affectations.map(a => 
      a.id === id ? { ...a, statut: 'Historique' as const, dateFin: new Date().toISOString().split('T')[0] } : a
    );
    onUpdateAffectations(updated);
  };

  // --- Rules Engine ---
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle.trim()) return;

    const parsedValue = isNaN(Number(newRuleCondVal)) ? newRuleCondVal : Number(newRuleCondVal);

    const newRule: Rule = {
      id: `r_rule_${Date.now()}`,
      libelle: newRuleTitle,
      typeRegle: newRuleType,
      objetCible: newRuleTarget,
      condition: {
        operateur: 'ET',
        regles: [
          { champ: newRuleCondField, operateur: newRuleCondOp, valeur: parsedValue }
        ]
      },
      action: {
        type: newRuleActType,
        parametres: {
          niveau_requis: newRuleActLevel,
          delai_jours: 15,
          notifier: [newRuleActNotifier]
        }
      },
      priorite: rules.length + 1,
      statut: 'Active'
    };

    onUpdateRules([...rules, newRule]);
    onAddLog('Moteur Règles', `Création d'une règle de gestion "${newRuleTitle}"`);
    setNewRuleTitle('');
  };

  const handleRemoveRule = (id: string) => {
    onUpdateRules(rules.filter(r => r.id !== id));
  };

  // --- Scales Edit ---
  const handleUpdateScaleLabel = (type: 'freq' | 'imp' | 'ctrl', index: number, field: 'label' | 'description', value: string) => {
    const nextScales = { ...tenantConfig.scales };
    let list: ScaleItem[] = [];

    if (type === 'freq') {
      list = [...nextScales.frequency];
      list[index] = { ...list[index], [field]: value };
      nextScales.frequency = list;
    } else if (type === 'imp') {
      list = [...nextScales.impact];
      list[index] = { ...list[index], [field]: value };
      nextScales.impact = list;
    } else {
      list = [...nextScales.control];
      list[index] = { ...list[index], [field]: value };
      nextScales.control = list;
    }

    onUpdateTenantConfig({
      ...tenantConfig,
      scales: nextScales
    });
  };

  // --- Category Management ---
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: RiskCategory = {
      id: `cat_${Date.now()}`,
      name: newCatName,
      color: newCatColor,
      description: newCatDesc
    };

    onUpdateTenantConfig({
      ...tenantConfig,
      categories: [...tenantConfig.categories, newCat]
    });
    
    setNewCatName('');
    setNewCatDesc('');
    onAddLog('Config Catégories', `Ajout de la catégorie de risque "${newCatName}"`);
  };

  const handleRemoveCategory = (id: string) => {
    onUpdateTenantConfig({
      ...tenantConfig,
      categories: tenantConfig.categories.filter(c => c.id !== id)
    });
  };

  // --- Formulas Configuration ---
  const handleFormulaUpdate = (formId: string) => {
    setSelectedFormulaId(formId);
    let expression = 'P * I * M';
    let label = 'Formule IFACI Standard';
    let variables = [
      { name: 'P', label: 'Probabilité/Fréquence', min: 1, max: 4 },
      { name: 'I', label: 'Impact', min: 1, max: 4 },
      { name: 'M', label: 'Maîtrise/Contrôle', min: 1, max: 4 },
    ];
    let description = 'Calcul par produit simple du score brut (P x I) puis risque net (Brut x Maîtrise). Échelle de 1 à 64.';

    if (formId === 'f2') {
      expression = '(P * I) - M';
      label = 'Formule Aéronautique P * I - M';
      variables = [
        { name: 'P', label: 'Probabilité/Fréquence', min: 1, max: 5 },
        { name: 'I', label: 'Impact', min: 1, max: 5 },
        { name: 'M', label: 'Maîtrise/Contrôle', min: 1, max: 5 },
      ];
      description = 'Score Brut = P x I (max 25). Score Net = (P x I) - M (échelle de 0 à 24 pour intégrer la mitigation soustractive).';
    }

    onUpdateTenantConfig({
      ...tenantConfig,
      formula: { id: formId, name: label, expression, variables, description }
    });
    onAddLog('Config Moteur', `Modification de la formule de calcul vers : ${label}`);
  };

  const handleMatrixSizeUpdate = (newSize: number) => {
    setMatrixSize(newSize);
    onUpdateTenantConfig({
      ...tenantConfig,
      matrixSize: newSize
    });
  };

  // Indented helper to display nested structure
  const renderIndentedOrg = (parentId: string | undefined, depth: number = 0): React.ReactNode => {
    const children = tenantConfig.entities.filter(e => e.parentId === parentId && e.statut !== 'Archivé');
    if (children.length === 0) return null;

    return (
      <div className={`space-y-1.5 ${depth > 0 ? 'pl-4 border-l border-indigo-100 mt-1' : ''}`}>
        {children.map(node => (
          <div key={node.id} className="space-y-1">
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 hover:bg-indigo-50/20 border rounded-lg gap-2 ${
              node.statut === 'Inactif' ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50/70 border-slate-200'
            }`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9px] font-bold bg-indigo-150 text-indigo-750 px-1.5 py-0.5 rounded">
                  {node.code}
                </span>
                <span className="font-bold text-slate-800 text-[11px]">{node.name}</span>
                <span className="text-[8.5px] text-slate-400 capitalize bg-white border px-1 rounded">
                  {node.type}
                </span>
                {node.est_succursale && (
                  <span className="text-[8.5px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                    🏢 Succursale
                  </span>
                )}
                {node.est_succursale && node.sousOrganigrammeMode && (
                  <span className="text-[8px] bg-slate-100 text-slate-600 font-semibold px-1 py-0.2 rounded border">
                    {node.sousOrganigrammeMode === 'heritage' ? '🔗 Héritage' : '💼 Propre'}
                  </span>
                )}
                {node.est_succursale && (node.ville || node.pays) && (
                  <span className="text-[8.5px] text-slate-500 font-semibold bg-white border px-1 rounded">
                    📍 {node.ville}{node.pays ? `, ${node.pays}` : ''}
                  </span>
                )}
                {node.statut === 'Inactif' && (
                  <span className="text-[8.5px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded border border-rose-300 animate-pulse">
                    ⚠️ Bloqué (Quota dépassé)
                  </span>
                )}
                {node.rattachementsSecondaires && node.rattachementsSecondaires.length > 0 && (
                  <span className="text-[8px] bg-amber-50 text-amber-700 font-semibold px-1 py-0.2 rounded border border-amber-200">
                    🔗 Matriciel: {tenantConfig.entities.find(e => e.id === node.rattachementsSecondaires?.[0])?.code || 'Secondaire'}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleRemoveOrgNode(node.id)}
                className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 cursor-pointer self-end sm:self-auto"
                title="Supprimer / Archiver"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {renderIndentedOrg(node.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };



  return (
    <div className="flex-grow p-6 bg-slate-50 overflow-y-auto space-y-6 text-slate-800 text-xs select-none">
      
      {/* Title block */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
            Paramétrage de l'ERP GRC (No-Code Configurable Engine)
          </h2>
          <p className="text-slate-500 text-[11px]">
            Configurez l'organigramme matriciel, le moteur de règles de gestion, l'affectation des personnes aux rôles d'audit, et les échelles de cotation pour <span className="font-bold text-indigo-650">{tenantConfig.companyName}</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT: CONFIG MODULES TAB SELECTOR */}
        <div className="lg:col-span-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="px-3 py-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider">
            1. Organigramme & Rôles
          </div>
          <button
            onClick={() => setActiveTab('org')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'org' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Organigramme Arborescent</span>
          </button>
          
          <button
            onClick={() => setActiveTab('functions')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'functions' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Fonctions & Affectations</span>
          </button>

          <button
            onClick={() => setActiveTab('rights')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'rights' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>🛡️ Profils de Droits (RBAC)</span>
          </button>

          <div className="px-3 py-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider pt-3">
            2. Moteur de Règles & Workflows
          </div>
          <button
            onClick={() => setActiveTab('rules')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'rules' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Code className="w-4 h-4 text-indigo-600" />
            <span>Moteur de Règles No-Code</span>
          </button>

          <button
            onClick={() => setActiveTab('workflow')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'workflow' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Workflow className="w-4 h-4 text-indigo-600" />
            <span>Workflow de Validation</span>
          </button>

          <div className="px-3 py-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider pt-3">
            3. Paramètres de Notation & Cotation
          </div>
          <button
            onClick={() => setActiveTab('scales')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'scales' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Wrench className="w-4 h-4 text-indigo-600" />
            <span>Échelles de Cotation</span>
          </button>

          <button
            onClick={() => setActiveTab('formula')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'formula' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Boxes className="w-4 h-4 text-indigo-600" />
            <span>Formule de Calcul GRC</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'categories' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-indigo-600" />
            <span>Catégories de Risques</span>
          </button>

          <div className="px-3 py-1 font-bold text-slate-400 text-[9px] uppercase tracking-wider pt-3">
            4. Formulaires & Chantiers Métier
          </div>
          <button
            onClick={() => setActiveTab('formbuilder')}
            className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded font-bold transition text-left ${
              activeTab === 'formbuilder' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Code className="w-4 h-4 text-indigo-600" />
            <span>Form Builder No-Code</span>
          </button>
        </div>

        {/* RIGHT PANEL: DISPLAY ACTIVE CONFIGURATION VIEWS */}
        <div className="lg:col-span-9 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[440px]">
          
          {/* TAB: ORGANIGRAMME */}
          {activeTab === 'org' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Organigramme Hiérarchique & Matriciel (Section 2.1)</h3>
                  <p className="text-slate-400 text-[10.5px]">Configurez la structure arborescente de votre organisation avec gestion des rattachements fonctionnels multiples et succursales optionnelles.</p>
                </div>
                {(() => {
                  const currentSuccursalesCount = tenantConfig.entities.filter(
                    e => e.statut !== 'Archivé' && e.est_succursale === true
                  ).length;
                  const isNearLimit = currentSuccursalesCount >= maxSuccursales;
                  return (
                    <div className="flex items-center space-x-2">
                      {!succursalesActives && (
                        <div className="bg-slate-100 border border-slate-200 text-slate-500 rounded px-2.5 py-1 text-right text-[9px] font-bold uppercase">
                          Succursales désactivées
                        </div>
                      )}
                      <div className={`border rounded px-3 py-1 text-right ${
                        isNearLimit ? 'bg-red-50 border-red-200 text-red-800' : 'bg-indigo-50 border-indigo-150 text-indigo-950'
                      }`}>
                        <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider">Quota Succursales</span>
                        <span className="font-mono text-xs font-bold">
                          {currentSuccursalesCount} / {maxSuccursales} contractuelles
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Add form */}
              <form onSubmit={handleAddOrgNode} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-10 gap-3 items-end">
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-[9px] text-slate-400 font-bold uppercase block">Libellé Unité</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex. Direction Financière..."
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] text-slate-400 font-bold uppercase block">Code Court</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex. DAF-GRP..."
                      value={newOrgCode}
                      onChange={(e) => setNewOrgCode(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs font-mono font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1.5 col-span-2">
                    <label className="text-[9px] text-slate-400 font-bold uppercase block">Type Unité</label>
                    <select
                      value={newOrgType}
                      onChange={(e) => setNewOrgType(e.target.value as any)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Direction">👨‍💼 Direction</option>
                      <option value="Département">📁 Département</option>
                      <option value="Service">🔧 Service</option>
                      <option value="Site">📍 Site Local</option>
                      <option value="Filiale">🏢 Filiale</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-1.5 col-span-2">
                    <label className="text-[9px] text-slate-400 font-bold uppercase block">Unité Parente</label>
                    <select
                      value={newOrgParent}
                      onChange={(e) => setNewOrgParent(e.target.value)}
                      className="w-full bg-white border border-slate-255 rounded p-1.5 text-xs text-slate-600 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Racine (Groupe) --</option>
                      {tenantConfig.entities.filter(e => e.statut !== 'Archivé').map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] text-slate-400 font-bold uppercase block">Rattachement Matriciel</label>
                    <select
                      value={newOrgSecondary}
                      onChange={(e) => setNewOrgSecondary(e.target.value)}
                      className="w-full bg-white border border-slate-255 rounded p-1.5 text-xs text-slate-600 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Aucun (Hiérarchique simple)</option>
                      {tenantConfig.entities.filter(e => e.statut !== 'Archivé').map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Succursale section */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={newOrgIsSuccursale}
                        disabled={!succursalesActives}
                        onChange={(e) => setNewOrgIsSuccursale(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer disabled:opacity-50"
                      />
                      <span className={`text-xs font-bold ${succursalesActives ? 'text-slate-800' : 'text-slate-400'}`}>
                        Marquer comme une Succursale contractuelle (Géré par quota de licence)
                      </span>
                    </label>
                    {!succursalesActives && (
                      <span className="text-[9px] text-amber-700 font-bold uppercase bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Fonctionnalité non souscrite
                      </span>
                    )}
                  </div>

                  {newOrgIsSuccursale && succursalesActives && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs animate-fade-in">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase block">Mode d'organisation / Organigramme</label>
                        <select
                          value={newOrgSousOrgMode}
                          onChange={(e) => setNewOrgSousOrgMode(e.target.value as any)}
                          className="w-full bg-white border border-slate-250 rounded p-1.5 text-slate-700 focus:outline-none"
                        >
                          <option value="heritage">🔗 Hériter de l'organigramme de l'entreprise mère</option>
                          <option value="propre">💼 Posséder son propre sous-organigramme complet</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase block">Ville</label>
                        <input 
                          type="text"
                          placeholder="Ex: Douala, Paris, Garoua..."
                          value={newOrgVille}
                          onChange={(e) => setNewOrgVille(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded p-1.5 text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase block">Pays / Zone géographique</label>
                        <input 
                          type="text"
                          placeholder="Ex: Cameroun, France, International..."
                          value={newOrgPays}
                          onChange={(e) => setNewOrgPays(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded p-1.5 text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-3">
                        <label className="text-[9px] text-slate-400 font-bold uppercase block">Adresse / Localisation complète</label>
                        <input 
                          type="text"
                          placeholder="Ex: Boulevard de la Liberté, Akwa..."
                          value={newOrgAdresse}
                          onChange={(e) => setNewOrgAdresse(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded p-1.5 text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-6 rounded text-xs shadow transition cursor-pointer"
                  >
                    Ajouter l'Unité à la Structure
                  </button>
                </div>
              </form>

              {/* Visual Hierarchy */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 uppercase text-xs">Aperçu Arborescent du Périmètre :</h4>
                <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/30 max-h-96 overflow-y-auto">
                  {/* Render root level entities */}
                  {renderIndentedOrg(undefined)}
                </div>
              </div>
            </div>
          )}

          {/* TAB: FUNCTIONS & ASSIGNMENTS */}
          {activeTab === 'functions' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">Séparation Personne / Fonction / Unité (Section 2.1.4)</h3>
                <p className="text-slate-400 text-[10.5px]">Une fonction est rattachée à une unité structurelle. Une personne physique (Utilisateur) y est affectée pour une période donnée.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Create Function Block */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-left">
                  <h4 className="font-bold text-slate-850 uppercase text-xs flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                    1. Déclarer une Nouvelle Fonction
                  </h4>

                  <form onSubmit={handleAddFunction} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase">Intitulé de la fonction</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ex. Auditeur Interne local, CRO Filiale..."
                        value={newFTitle}
                        onChange={(e) => setNewFTitle(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase">Rattaché à l'unité</label>
                      <select
                        value={newFEntity}
                        onChange={(e) => setNewFEntity(e.target.value)}
                        className="w-full bg-white border border-slate-255 rounded p-1.5 text-slate-650"
                      >
                        {tenantConfig.entities.filter(e => e.statut !== 'Archivé').map(e => (
                          <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase">Profil de droits (RBAC)</label>
                      <select
                        value={newFProfile}
                        onChange={(e) => setNewFProfile(e.target.value)}
                        className="w-full bg-white border border-slate-255 rounded p-1.5 text-slate-650"
                      >
                        {accessProfiles.map(p => (
                          <option key={p.id} value={p.id}>{p.libelle} ({p.portee})</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.8 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded shadow cursor-pointer text-center text-xs"
                    >
                      Enregistrer la Fonction
                    </button>
                  </form>
                </div>

                {/* Affect User to Function Block */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-left">
                  <h4 className="font-bold text-slate-850 uppercase text-xs flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    2. Affecter une Personne à une Fonction
                  </h4>

                  <form onSubmit={handleAddAssignment} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase">Personne physique (Collaborateur)</label>
                      <select
                        value={assignUser}
                        onChange={(e) => setAssignUser(e.target.value)}
                        className="w-full bg-white border border-slate-255 rounded p-1.5 text-slate-650 font-semibold"
                      >
                        {users
                          .filter(u => u.tenantId === tenantConfig.id || (tenantConfig.id === 'tenant1' && !u.tenantId))
                          .map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase">Fonction occupée</label>
                      <select
                        value={assignFunction}
                        onChange={(e) => setAssignFunction(e.target.value)}
                        className="w-full bg-white border border-slate-255 rounded p-1.5 text-slate-650"
                      >
                        {fonctions.map(f => {
                          const entityCode = tenantConfig.entities.find(e => e.id === f.entityId)?.code || 'GRP';
                          return (
                            <option key={f.id} value={f.id}>{f.libelle} [Unité: {entityCode}]</option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase">Date de prise de poste (Début)</label>
                      <input 
                        type="date"
                        required
                        value={assignDateDebut}
                        onChange={(e) => setAssignDateDebut(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow cursor-pointer text-center text-xs"
                    >
                      Activer l'affectation nominative
                    </button>
                  </form>
                </div>

              </div>

              {/* 👥 Collaborateurs de l'Entreprise Cliente Section */}
              <div className="border-t pt-4 space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-800 uppercase text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>👥 Suivi des Collaborateurs (Fiches Physiques) :</span>
                  </h4>
                  <button
                    onClick={() => setShowAddCollabForm(!showAddCollabForm)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded flex items-center gap-1 border border-indigo-200 transition cursor-pointer"
                  >
                    {showAddCollabForm ? '✕ Fermer' : '＋ Enregistrer Collaborateur'}
                  </button>
                </div>

                {showAddCollabForm && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h5 className="font-bold text-xs text-slate-700 uppercase">Nouvelle Fiche Collaborateur</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Nom Complet</label>
                        <input
                          type="text"
                          placeholder="Ex. Christian Ndoumbe"
                          value={newCollabName}
                          onChange={(e) => setNewCollabName(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Adresse Email</label>
                        <input
                          type="email"
                          placeholder="Ex. c.ndoumbe@client.com"
                          value={newCollabEmail}
                          onChange={(e) => setNewCollabEmail(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Rattachement Unité</label>
                        <select
                          value={newCollabEntityId}
                          onChange={(e) => setNewCollabEntityId(e.target.value)}
                          className="w-full bg-white border border-slate-255 rounded p-1.5 text-xs text-slate-650 focus:outline-none font-semibold"
                        >
                          <option value="">-- Sélectionner l'Unité --</option>
                          {tenantConfig.entities.filter(e => e.statut !== 'Archivé').map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCollabName.trim() || !newCollabEmail.trim()) {
                            alert("Veuillez renseigner le nom et l'email du collaborateur.");
                            return;
                          }
                          if (onAddUser) {
                            onAddUser({
                              name: newCollabName,
                              email: newCollabEmail,
                              role: newCollabRole,
                              roles: [newCollabRole],
                              isActive: true,
                              entityId: newCollabEntityId || undefined,
                              tenantId: tenantConfig.id,
                              allowedModules: ['dashboard', 'risks', 'evaluation', 'heatmap', 'actions', 'audit', 'compliance', 'reporting'],
                              avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=80&fit=crop&q=80`
                            });
                            onAddLog('Gestion Collaborateurs', `Création du collaborateur ${newCollabName} rattaché à l'unité ${newCollabEntityId}`);
                            setNewCollabName('');
                            setNewCollabEmail('');
                            setNewCollabEntityId('');
                            setShowAddCollabForm(false);
                          }
                        }}
                        className="py-1.8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow cursor-pointer text-center text-xs"
                      >
                        Enregistrer Collaborateur
                      </button>
                    </div>
                  </div>
                )}

                <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] text-slate-400 uppercase font-bold tracking-wider border-b">
                        <th className="py-2.5 px-3">Collaborateur</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Unité de l'organigramme</th>
                        <th className="py-2.5 px-3 text-center font-bold">Statut</th>
                        <th className="py-2.5 px-3 text-center font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[10.5px]">
                      {users
                        .filter(u => u.tenantId === tenantConfig.id || (tenantConfig.id === 'tenant1' && !u.tenantId))
                        .map(u => {
                          const unitObj = tenantConfig.entities.find(e => e.id === u.entityId);
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-2">
                                <img src={u.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80`} alt="" className="w-5 h-5 rounded-full shrink-0" />
                                {u.name}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-500">{u.email}</td>
                              <td className="py-2.5 px-3 font-bold text-indigo-750">
                                {unitObj ? `${unitObj.name} (${unitObj.code})` : <span className="text-slate-450 italic font-normal text-[10px]">Non rattaché</span>}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onUpdateUser) {
                                      onUpdateUser({
                                        ...u,
                                        isActive: u.isActive === false ? true : false
                                      });
                                      onAddLog('Gestion Collaborateurs', `Changement de statut de ${u.name} (Actif: ${u.isActive === false})`);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase transition cursor-pointer border ${
                                    u.isActive !== false 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  }`}
                                  title="Cliquer pour changer le statut d'activité"
                                >
                                  {u.isActive !== false ? 'Actif' : 'Suspendu'}
                                </button>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCollab(u);
                                      setEditCollabName(u.name);
                                      setEditCollabEmail(u.email);
                                      setEditCollabRole(u.role);
                                      setEditCollabEntityId(u.entityId || '');
                                      setEditCollabIsActive(u.isActive !== false);
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer"
                                    title="Modifier les coordonnées & rattachement"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-indigo-600" />
                                  </button>
                                  {u.email !== (tenantConfig as any).contactEmail ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le collaborateur ${u.name} ?`)) {
                                          if (onDeleteUser) {
                                            onDeleteUser(u.id);
                                            onAddLog('Gestion Collaborateurs', `Suppression définitive de ${u.name}`);
                                          }
                                        }
                                      }}
                                      className="p-1 hover:bg-red-50 rounded text-red-500 transition cursor-pointer"
                                      title="Supprimer définitivement"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span className="p-1 text-slate-350 cursor-not-allowed" title="Administrateur principal GRC de l'Entreprise d'origine.">
                                      <Trash2 className="w-3.5 h-3.5 text-slate-300" />
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* EDIT COLLAB MODAL */}
              {editingCollab && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in text-slate-800 text-xs">
                  <div className="bg-white rounded-xl border border-slate-250 shadow-2xl p-6 w-full max-w-md space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                        <Edit className="w-4 h-4 text-indigo-600" />
                        <span>Modifier Collaborateur : {editingCollab.name}</span>
                      </h3>
                      <button 
                        onClick={() => setEditingCollab(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Nom Complet</label>
                        <input 
                          type="text" 
                          required 
                          value={editCollabName}
                          onChange={(e) => setEditCollabName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded p-1.5 font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Email Professionnel</label>
                        <input 
                          type="email" 
                          required 
                          value={editCollabEmail}
                          onChange={(e) => setEditCollabEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded p-1.5 text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Rattachement Unité</label>
                        <select
                          value={editCollabEntityId}
                          onChange={(e) => setEditCollabEntityId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded p-1.5 font-semibold text-slate-800 focus:outline-none"
                        >
                          <option value="">-- Aucune unité --</option>
                          {tenantConfig.entities.filter(e => e.statut !== 'Archivé').map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Statut d'activité</span>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-1.5 cursor-pointer text-xs">
                            <input 
                              type="radio" 
                              checked={editCollabIsActive} 
                              onChange={() => setEditCollabIsActive(true)}
                              className="text-indigo-600 focus:ring-indigo-500" 
                            />
                            <span className="text-emerald-600 font-bold">Actif</span>
                          </label>
                          <label className="flex items-center space-x-1.5 cursor-pointer text-xs">
                            <input 
                              type="radio" 
                              checked={!editCollabIsActive} 
                              onChange={() => setEditCollabIsActive(false)}
                              className="text-indigo-600 focus:ring-indigo-500" 
                            />
                            <span className="text-red-650 font-bold">Suspendu</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <button 
                        onClick={() => setEditingCollab(null)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button 
                        onClick={() => {
                          if (!editCollabName.trim() || !editCollabEmail.trim()) return;
                          if (onUpdateUser) {
                            onUpdateUser({
                              ...editingCollab,
                              name: editCollabName,
                              email: editCollabEmail,
                              role: editCollabRole,
                              roles: [editCollabRole],
                              entityId: editCollabEntityId || undefined,
                              isActive: editCollabIsActive
                            });
                            onAddLog('Gestion Collaborateurs', `Mise à jour de la fiche de ${editCollabName}`);
                            setEditingCollab(null);
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs cursor-pointer"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Active & Historical Roles list */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="font-extrabold text-slate-800 uppercase text-xs">Suivi des Titulaires de Rôles et Historique des Nominations :</h4>
                <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] text-slate-400 uppercase font-bold tracking-wider border-b">
                        <th className="py-2 px-3">Collaborateur</th>
                        <th className="py-2 px-3">Fonction administrative</th>
                        <th className="py-2 px-3">Unité Rattachée</th>
                        <th className="py-2 px-3">Période d'affectation</th>
                        <th className="py-2 px-3 text-center">Statut du Titre</th>
                        <th className="py-2 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[10.5px]">
                      {affectations.map(aff => {
                        const colName = users.find(u => u.id === aff.userId)?.name || 'Collaborateur';
                        const fnObj = fonctions.find(f => f.id === aff.fonctionId);
                        const fnLabel = fnObj?.libelle || 'Fonction';
                        const unitObj = fnObj ? tenantConfig.entities.find(e => e.id === fnObj.entityId) : null;
                        return (
                          <tr key={aff.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{colName}</td>
                            <td className="py-2 px-3 text-indigo-700 font-medium">{fnLabel}</td>
                            <td className="py-2 px-3 font-bold font-mono">{unitObj ? unitObj.code : 'GRP'}</td>
                            <td className="py-2 px-3 font-mono text-slate-500">
                              Du {aff.dateDebut} {aff.dateFin ? `au ${aff.dateFin}` : 'à ce jour'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                aff.statut === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {aff.statut}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {aff.statut === 'Actif' && (
                                <button
                                  onClick={() => handleRemoveAssignment(aff.id)}
                                  className="p-1 hover:bg-rose-50 rounded text-rose-500 cursor-pointer"
                                  title="Clôturer la fonction (Libérer)"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB: RULES ENGINE */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Moteur de Règles de Gestion No-Code (Section 2.2)</h3>
                  <p className="text-slate-400 text-[10.5px]">Configurez des règles conditionnelles interactives (Calcul, Seuil, Escalades). Les règles sont lues en tâche de fond et exécutées.</p>
                </div>
              </div>

              {/* Rules creator */}
              <form onSubmit={handleAddRule} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-indigo-700 text-xs uppercase">Constructeur Visuel de Logique "Si ... Alors"</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="space-y-1 sm:col-span-4">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Libellé de la règle métier</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex. Escalade automatique si budget critique..."
                      value={newRuleTitle}
                      onChange={(e) => setNewRuleTitle(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Type Règle</label>
                    <select
                      value={newRuleType}
                      onChange={(e) => setNewRuleType(e.target.value as any)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-700"
                    >
                      <option value="Workflow">Workflow</option>
                      <option value="Seuil">Seuil d'alerte</option>
                      <option value="Calcul">Calcul / Score</option>
                      <option value="Accès">Droits / Accès</option>
                      <option value="Reporting">Reporting</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Objet Pivot</label>
                    <select
                      value={newRuleTarget}
                      onChange={(e) => setNewRuleTarget(e.target.value as any)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-700"
                    >
                      <option value="Risque">Risque</option>
                      <option value="Plan d'action">Plan d'action</option>
                      <option value="Audit">Audit</option>
                      <option value="Conformité">Conformité</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Condition Champ</label>
                    <select
                      value={newRuleCondField}
                      onChange={(e) => setNewRuleCondField(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-750"
                    >
                      <option value="scoreBrut">Score Brut (P x I)</option>
                      <option value="scoreResiduel">Score Résiduel</option>
                      <option value="categoryId">Id Catégorie</option>
                      <option value="impactValue">Gravité</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Opérateur</label>
                    <select
                      value={newRuleCondOp}
                      onChange={(e) => setNewRuleCondOp(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-750"
                    >
                      <option value=">=">&gt;= (Supérieur)</option>
                      <option value="=">= (Égal)</option>
                      <option value="<=">&lt;= (Inférieur)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Valeur seuil</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex. 12 ou cat_finance..."
                      value={newRuleCondVal}
                      onChange={(e) => setNewRuleCondVal(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs font-mono font-bold text-indigo-700"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Action déclenchée</label>
                    <select
                      value={newRuleActType}
                      onChange={(e) => setNewRuleActType(e.target.value as any)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-700"
                    >
                      <option value="ESCALADE_VALIDATION">ESCALADE_VALIDATION</option>
                      <option value="NOTIFY_ROLE">NOTIFY_ROLE (Notifier Rôle)</option>
                      <option value="BLOCK_ACCESS">BLOCK_ACCESS (Bloquer Accès)</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Destinataire / Rôle cible</label>
                    <select
                      value={newRuleActNotifier}
                      onChange={(e) => setNewRuleActNotifier(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-650"
                    >
                      {fonctions.map(f => (
                        <option key={f.id} value={f.libelle}>{f.libelle}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="sm:col-span-3 py-1.8 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded shadow cursor-pointer text-center text-xs"
                  >
                    Activer la Règle Métier
                  </button>
                </div>
              </form>

              {/* Rules list with JSON preview */}
              <div className="space-y-4 pt-2">
                <h4 className="font-extrabold text-slate-800 uppercase text-xs">Registre Actif du Moteur de Règles :</h4>
                <div className="space-y-3.5">
                  {rules.map(rule => (
                    <div key={rule.id} className="p-4 bg-white hover:border-indigo-300 border border-slate-200 rounded-xl shadow-inner grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-7 space-y-2 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] bg-indigo-50 text-indigo-750 px-1.5 py-0.5 rounded font-bold">
                            RULE ID: {rule.id}
                          </span>
                          <span className="text-[8.5px] bg-amber-50 text-amber-800 font-bold px-1 py-0.2 rounded border border-amber-200">
                            Priorité {rule.priorite}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-800 text-xs leading-tight">
                          {rule.libelle}
                        </h5>
                        <p className="text-slate-400 text-[9.5px]">
                          Cible d'interprétation : <strong className="text-slate-600">{rule.objetCible}</strong> | Type : <strong className="text-slate-600">{rule.typeRegle}</strong>
                        </p>
                      </div>

                      <div className="lg:col-span-5 text-left bg-slate-850 p-2.5 rounded font-mono text-[10px] text-emerald-400 overflow-x-auto">
                        <span className="text-slate-400 block pb-1 border-b border-slate-700">// Représentation Interne (Section 2.2.2 JSON)</span>
                        <pre className="mt-1">{JSON.stringify({ condition: rule.condition, action: rule.action }, null, 2)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB: WORKFLOWS */}
          {activeTab === 'workflow' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-slate-100 pb-3 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Circuits de Validation et Délais d'Escalade (Section 2.2.4)</h3>
                  <p className="text-slate-400 text-[10.5px]">Définissez les étapes séquentielles obligatoires pour approuver un risque. Chaque étape est liée à une fonction GRC.</p>
                </div>
              </div>

              {/* Form to Add New Step */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-800 text-[11.5px] uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  Créer et Ajouter une Étape au Workflow de Validation
                </h4>
                
                <form onSubmit={handleAddStep} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Libellé de l'étape de validation</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex. Validation Direction Générale"
                      value={newStepName}
                      onChange={(e) => setNewStepName(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Style Visuel de l'Étape</label>
                    <select
                      value={newStepColor}
                      onChange={(e) => setNewStepColor(e.target.value)}
                      className="bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-700 font-bold focus:outline-none"
                    >
                      <option value="bg-slate-50 border-slate-200 text-slate-800">🔘 Gris Neutre (Brouillon / Attente)</option>
                      <option value="bg-amber-50 border-amber-200 text-amber-800">🟡 Jaune Ambre (Soumis / En Revue)</option>
                      <option value="bg-blue-50 border-blue-200 text-blue-800">🔵 Bleu Azur (Validation Intermédiaire)</option>
                      <option value="bg-emerald-50 border-emerald-200 text-emerald-800">🟢 Vert Émeraude (Approuvé / Finalisé)</option>
                      <option value="bg-rose-50 border-rose-200 text-rose-800">🔴 Rouge Rose (Rejeté / À Corriger)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow transition text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter l'Étape
                  </button>
                </form>
              </div>

              {/* Steps Sequencer List */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 uppercase text-xs flex items-center gap-1.5">
                  <Workflow className="w-4 h-4 text-indigo-600" />
                  Séquence et Ordonnancement du Workflow GRC :
                </h4>
                
                <div className="space-y-2">
                  {tenantConfig.workflowSteps.map((step, index) => {
                    const isEditing = editingStepId === step.id;
                    const stepStyle = step.color || "bg-slate-50 border-slate-200 text-slate-800";
                    
                    return (
                      <div 
                        key={step.id} 
                        className={`p-3 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm transition-all duration-150 hover:shadow-md ${stepStyle}`}
                      >
                        {/* Information / Inline Edit Form */}
                        {isEditing ? (
                          <div className="flex-1 flex flex-col sm:flex-row gap-2.5 items-end bg-white/20 p-2.5 rounded-lg border border-white/30 text-left">
                            <div className="flex-1 space-y-1">
                              <label className="text-[9px] font-bold uppercase opacity-85 block text-slate-700">Nom de l'étape</label>
                              <input 
                                type="text"
                                value={editingStepName}
                                onChange={(e) => setEditingStepName(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-bold focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase opacity-85 block text-slate-700">Style</label>
                              <select
                                value={editingStepColor}
                                onChange={(e) => setEditingStepColor(e.target.value)}
                                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 font-bold focus:outline-none"
                              >
                                <option value="bg-slate-50 border-slate-200 text-slate-800">🔘 Gris Neutre</option>
                                <option value="bg-amber-50 border-amber-200 text-amber-800">🟡 Jaune Ambre</option>
                                <option value="bg-blue-50 border-blue-200 text-blue-800">🔵 Bleu Azur</option>
                                <option value="bg-emerald-50 border-emerald-200 text-emerald-800">🟢 Vert Émeraude</option>
                                <option value="bg-rose-50 border-rose-200 text-rose-800">🔴 Rouge Rose</option>
                              </select>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSaveEditStep(step.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded cursor-pointer"
                              >
                                Sauver
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStepId(null)}
                                className="px-2.5 py-1 bg-slate-500 hover:bg-slate-600 text-white text-[10px] font-bold rounded cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3.5">
                            <span className="bg-white/75 px-2 py-0.5 rounded font-mono text-[10px] font-bold shadow-sm text-slate-800">
                              Rang {step.order}
                            </span>
                            <div>
                              <strong className="text-xs font-black block">{step.name}</strong>
                              <span className="text-[9.5px] font-mono opacity-80">
                                ID: <code className="bg-white/30 p-0.5 rounded">{step.id}</code>
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Controls (Disabled when editing) */}
                        {!isEditing && (
                          <div className="flex items-center gap-1 shrink-0 self-end md:self-auto bg-white/45 p-1 rounded-lg border border-white/20">
                            {/* Reorder Buttons */}
                            <button
                              type="button"
                              onClick={() => handleMoveStep(index, 'up')}
                              disabled={index === 0}
                              className={`p-1.5 rounded transition cursor-pointer ${
                                index === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-white'
                              }`}
                              title="Déplacer vers le haut"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveStep(index, 'down')}
                              disabled={index === tenantConfig.workflowSteps.length - 1}
                              className={`p-1.5 rounded transition cursor-pointer ${
                                index === tenantConfig.workflowSteps.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-white'
                              }`}
                              title="Déplacer vers le bas"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStepId(step.id);
                                setEditingStepName(step.name);
                                setEditingStepColor(stepStyle);
                              }}
                              className="p-1.5 text-slate-700 hover:bg-white rounded transition cursor-pointer"
                              title="Modifier l'étape"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteStep(step.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Supprimer l'étape"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-left text-indigo-900 leading-relaxed text-[11px]">
                <strong className="block mb-1">📢 Escalades et Notifications de Délai :</strong>
                Conformément au modèle, si le délai de validation est dépassé, le système exécute une escalade automatique vers la direction supérieure ou applique une validation tacite selon le paramétrage de l'étape. Les relances automatiques par courriel sont adressées aux *fonctions* et non aux personnes physiques pour parer à toute absence de titulaire.
              </div>
            </div>
          )}

          {/* TAB: RIGHTS / PROFILES */}
          {activeTab === 'rights' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Gestionnaire de Profils de Droits & RBAC (Section 2.2.5)</h3>
                  <p className="text-slate-400 text-[10.5px]">Créez et configurez des profils d'accès d'habilitation (Portée: unité propre, unité + sous-unités, toutes unités, unités spécifiques).</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProfileForm(!showAddProfileForm);
                    setNewProfileLibelle('');
                    setNewProfilePortee('Unité propre');
                    setNewProfileModuleDroits({
                      dashboard: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: false },
                      risks: { lecture: true, ecriture: true, modification: true, suppression: false, importation: false, exportation: true },
                      evaluation: { lecture: true, ecriture: true, modification: true, suppression: false, importation: false, exportation: true },
                      heatmap: { lecture: true, ecriture: true, modification: true, suppression: false, importation: false, exportation: true },
                      actions: { lecture: true, ecriture: true, modification: true, suppression: false, importation: false, exportation: true },
                      audit: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: false },
                      compliance: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: false },
                      admin: { lecture: false, ecriture: false, modification: false, suppression: false, importation: false, exportation: false },
                      reporting: { lecture: true, ecriture: false, modification: false, suppression: false, importation: false, exportation: true }
                    });
                  }}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded shadow cursor-pointer transition flex items-center gap-1 shrink-0"
                >
                  {showAddProfileForm ? '✕ Fermer' : '＋ Déclarer un Profil de Droits'}
                </button>
              </div>

              {/* 1. NEW PROFILE FORM */}
              {showAddProfileForm && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-left">
                  <h4 className="font-bold text-xs text-slate-800 uppercase">Créer un nouveau Profil de Droits</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Libellé du Profil</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ex. Directeur de l'Audit, Correspondant Risque..."
                        value={newProfileLibelle}
                        onChange={(e) => setNewProfileLibelle(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Portée d'Habilitation d'Unité</label>
                      <select
                        value={newProfilePortee}
                        onChange={(e) => setNewProfilePortee(e.target.value as any)}
                        className="w-full bg-white border border-slate-255 rounded p-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
                      >
                        <option value="Unité propre">Unité propre uniquement</option>
                        <option value="Unité + sous-unités">Unité propre + sous-unités</option>
                        <option value="Toutes unités">Toutes les unités de l'entreprise (Portée Globale)</option>
                        <option value="Unités spécifiques">Unités spécifiques (Sur-mesure)</option>
                      </select>
                    </div>
                  </div>

                  {/* Matrix Checkboxes per module */}
                  <div className="space-y-1.5 border-t pt-3">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase block mb-1">Droits d'Accès Granulaires par Module :</span>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full border-collapse text-left bg-white">
                        <thead>
                          <tr className="bg-slate-100 text-[9px] text-slate-500 font-black uppercase tracking-wider border-b border-slate-200">
                            <th className="py-2 px-3">Module Système</th>
                            <th className="py-2 px-1 text-center">Lecture</th>
                            <th className="py-2 px-1 text-center">Écriture</th>
                            <th className="py-2 px-1 text-center">Modification</th>
                            <th className="py-2 px-1 text-center">Suppression</th>
                            <th className="py-2 px-1 text-center">Importation</th>
                            <th className="py-2 px-1 text-center">Exportation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-[10.5px]">
                          {[
                            { id: 'dashboard', label: 'TdB / Décisionnel' },
                            { id: 'risks', label: 'Cartographie / Risques' },
                            { id: 'evaluation', label: 'Calcul & Cotation' },
                            { id: 'heatmap', label: 'Matrice de criticité' },
                            { id: 'actions', label: 'Plans d\'Action (GRC)' },
                            { id: 'audit', label: 'Missions d\'Audit Interne' },
                            { id: 'compliance', label: 'Obligations & Conformité' },
                            { id: 'admin', label: 'Paramétrage & SMTP' },
                            { id: 'reporting', label: 'Rapports & Logs' }
                          ].map(m => {
                            const rights = newProfileModuleDroits[m.id] || { lecture: false, ecriture: false, modification: false, suppression: false, importation: false, exportation: false };
                            return (
                              <tr key={m.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-semibold text-slate-700">{m.label}</td>
                                {['lecture', 'ecriture', 'modification', 'suppression', 'importation', 'exportation'].map((rk) => {
                                  const rkey = rk as 'lecture' | 'ecriture' | 'modification' | 'suppression' | 'importation' | 'exportation';
                                  return (
                                    <td key={rkey} className="py-2 px-1 text-center">
                                      <input 
                                        type="checkbox"
                                        checked={rights[rkey]}
                                        onChange={(e) => handleNewProfileModuleDroitChange(m.id, rkey, e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProfileForm(false)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold rounded text-xs cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newProfileLibelle.trim()) {
                          alert("Le libellé du profil est obligatoire.");
                          return;
                        }
                        const newP: AccessProfile = {
                          id: `ap_${Date.now()}`,
                          libelle: newProfileLibelle,
                          portee: newProfilePortee,
                          droits: {
                            lecture: newProfileModuleDroits.risks.lecture,
                            creation: newProfileModuleDroits.risks.ecriture,
                            modification: newProfileModuleDroits.risks.modification,
                            validation: newProfileModuleDroits.risks.modification,
                            cloture: newProfileModuleDroits.risks.suppression,
                            export: newProfileModuleDroits.risks.exportation
                          },
                          moduleDroits: newProfileModuleDroits
                        };
                        onUpdateAccessProfiles([...accessProfiles, newP]);
                        onAddLog('Profils RBAC', `Création du profil d'accès "${newProfileLibelle}"`);
                        setNewProfileLibelle('');
                        setShowAddProfileForm(false);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs cursor-pointer shadow"
                    >
                      Enregistrer le Profil
                    </button>
                  </div>
                </div>
              )}

              {/* 2. PROFILES LIST WITH MODULE RIGHTS OVERVIEWS */}
              <div className="space-y-4">
                {accessProfiles.map(profile => {
                  const isPreset = ['ap1', 'ap2', 'ap3', 'ap4', 'ap5'].includes(profile.id);
                  return (
                    <div key={profile.id} className="p-4 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl shadow-sm space-y-3.5 text-left transition">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <strong className="text-slate-900 text-xs font-black flex items-center gap-1.5">
                            {profile.libelle}
                            {isPreset && (
                              <span className="bg-slate-100 text-slate-500 px-1 text-[8.5px] rounded font-bold uppercase border border-slate-200">Preset Système</span>
                            )}
                          </strong>
                          <span className="text-[9px] text-indigo-700 font-black bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded mt-1.5 inline-block uppercase tracking-wider">
                            Portée : {profile.portee}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProfile(profile);
                              setEditProfileLibelle(profile.libelle);
                              setEditProfilePortee(profile.portee);
                              // Copy or build standard rights map
                              const rightsMap: any = {};
                              [
                                'dashboard', 'risks', 'evaluation', 'heatmap', 'actions', 'audit', 'compliance', 'admin', 'reporting'
                              ].forEach(mid => {
                                if (profile.moduleDroits && profile.moduleDroits[mid]) {
                                  rightsMap[mid] = { ...profile.moduleDroits[mid] };
                                } else {
                                  rightsMap[mid] = {
                                    lecture: profile.droits?.lecture ?? true,
                                    ecriture: profile.droits?.creation ?? false,
                                    modification: profile.droits?.modification ?? false,
                                    suppression: profile.droits?.cloture ?? false,
                                    importation: false,
                                    exportation: profile.droits?.export ?? false
                                  };
                                }
                              });
                              setEditProfileModuleDroits(rightsMap);
                            }}
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded transition cursor-pointer"
                            title="Modifier le profil & habilitations"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {!isPreset && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le profil d'habilitations "${profile.libelle}" ?`)) {
                                  onUpdateAccessProfiles(accessProfiles.filter(ap => ap.id !== profile.id));
                                  onAddLog('Profils RBAC', `Suppression du profil de droits "${profile.libelle}"`);
                                }
                              }}
                              className="p-1 hover:bg-red-50 text-red-500 rounded transition cursor-pointer"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Display per-module quick dashboard */}
                      <div className="border border-slate-150 rounded-lg bg-slate-50/50 p-2 text-[10px] space-y-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Matrice de Sécurité Résumée (RBAC) :</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {[
                            { id: 'dashboard', label: 'Tableau de Bord' },
                            { id: 'risks', label: 'Carto Risques' },
                            { id: 'evaluation', label: 'Cotation / Calcul' },
                            { id: 'heatmap', label: 'Matrice Criticité' },
                            { id: 'actions', label: 'Plans d\'Action' },
                            { id: 'audit', label: 'Missions d\'Audit' },
                            { id: 'compliance', label: 'Conformité' },
                            { id: 'admin', label: 'Admin Système' },
                            { id: 'reporting', label: 'Logs & Rapports' }
                          ].map(m => {
                            const r = (profile.moduleDroits && profile.moduleDroits[m.id]) ? profile.moduleDroits[m.id] : {
                              lecture: profile.droits?.lecture ?? true,
                              ecriture: profile.droits?.creation ?? false,
                              modification: profile.droits?.modification ?? false,
                              suppression: profile.droits?.cloture ?? false,
                              importation: false,
                              exportation: profile.droits?.export ?? false
                            };
                            return (
                              <div key={m.id} className="bg-white p-1.5 border border-slate-150 rounded text-left space-y-1 shadow-2xs">
                                <span className="font-bold text-slate-700 block truncate text-[9.5px] border-b pb-0.5">{m.label}</span>
                                <div className="grid grid-cols-3 gap-0.5 font-mono text-[8.5px] text-center font-bold">
                                  <span className={r.lecture ? 'text-green-600 bg-green-50 rounded-[2px]' : 'text-slate-350 bg-slate-100 rounded-[2px]'} title="Lecture">L</span>
                                  <span className={r.ecriture ? 'text-indigo-600 bg-indigo-50 rounded-[2px]' : 'text-slate-350 bg-slate-100 rounded-[2px]'} title="Écriture">É</span>
                                  <span className={r.modification ? 'text-amber-600 bg-amber-50 rounded-[2px]' : 'text-slate-350 bg-slate-100 rounded-[2px]'} title="Modification">M</span>
                                  <span className={r.suppression ? 'text-red-600 bg-red-50 rounded-[2px]' : 'text-slate-350 bg-slate-100 rounded-[2px]'} title="Suppression">S</span>
                                  <span className={r.importation ? 'text-sky-600 bg-sky-50 rounded-[2px]' : 'text-slate-350 bg-slate-100 rounded-[2px]'} title="Importation">I</span>
                                  <span className={r.exportation ? 'text-emerald-600 bg-emerald-50 rounded-[2px]' : 'text-slate-350 bg-slate-100 rounded-[2px]'} title="Exportation">X</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* EDIT PROFILE MODAL */}
              {editingProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in text-slate-800 text-xs">
                  <div className="bg-white rounded-xl border border-slate-250 shadow-2xl p-6 w-full max-w-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                        <Edit className="w-4 h-4 text-indigo-600" />
                        <span>Modifier Profil : {editingProfile.libelle}</span>
                      </h3>
                      <button 
                        onClick={() => setEditingProfile(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4 text-left">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Libellé du Profil</label>
                          <input 
                            type="text" 
                            required 
                            value={editProfileLibelle}
                            onChange={(e) => setEditProfileLibelle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-250 rounded p-1.5 font-semibold focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Portée d'Habilitation</label>
                          <select
                            value={editProfilePortee}
                            onChange={(e) => setEditProfilePortee(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-250 rounded p-1.5 font-semibold focus:outline-none text-slate-800"
                          >
                            <option value="Unité propre">Unité propre uniquement</option>
                            <option value="Unité + sous-unités">Unité propre + sous-unités</option>
                            <option value="Toutes unités">Toutes les unités (Global)</option>
                            <option value="Unités spécifiques">Unités spécifiques</option>
                          </select>
                        </div>
                      </div>

                      {/* Editing Module rights */}
                      <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
                        <span className="text-[10px] text-slate-500 font-black uppercase block mb-1">Détails des Droits par Module (RBAC) :</span>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <table className="w-full border-collapse text-left bg-white">
                            <thead>
                              <tr className="bg-slate-50 text-[9px] text-slate-500 font-black uppercase border-b border-slate-200">
                                <th className="py-2 px-3">Module Système</th>
                                <th className="py-2 px-1 text-center">Lecture</th>
                                <th className="py-2 px-1 text-center">Écriture</th>
                                <th className="py-2 px-1 text-center">Modif.</th>
                                <th className="py-2 px-1 text-center">Suppr.</th>
                                <th className="py-2 px-1 text-center">Import.</th>
                                <th className="py-2 px-1 text-center">Export.</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y text-[10.5px]">
                              {[
                                { id: 'dashboard', label: 'TdB / Décisionnel' },
                                { id: 'risks', label: 'Cartographie / Risques' },
                                { id: 'evaluation', label: 'Calcul & Cotation' },
                                { id: 'heatmap', label: 'Matrice de criticité' },
                                { id: 'actions', label: 'Plans d\'Action (GRC)' },
                                { id: 'audit', label: 'Missions d\'Audit Interne' },
                                { id: 'compliance', label: 'Obligations & Conformité' },
                                { id: 'admin', label: 'Paramétrage & SMTP' },
                                { id: 'reporting', label: 'Rapports & Logs' }
                              ].map(m => {
                                const rights = editProfileModuleDroits[m.id] || { lecture: false, ecriture: false, modification: false, suppression: false, importation: false, exportation: false };
                                return (
                                  <tr key={m.id} className="hover:bg-slate-50">
                                    <td className="py-2 px-3 font-semibold text-slate-750">{m.label}</td>
                                    {['lecture', 'ecriture', 'modification', 'suppression', 'importation', 'exportation'].map((rk) => {
                                      const rkey = rk as 'lecture' | 'ecriture' | 'modification' | 'suppression' | 'importation' | 'exportation';
                                      return (
                                        <td key={rkey} className="py-2 px-1 text-center">
                                          <input 
                                            type="checkbox"
                                            checked={rights[rkey]}
                                            onChange={(e) => handleEditProfileModuleDroitChange(m.id, rkey, e.target.checked)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                          />
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <button 
                        onClick={() => setEditingProfile(null)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button 
                        onClick={() => {
                          if (!editProfileLibelle.trim()) return;
                          onUpdateAccessProfiles(accessProfiles.map(ap => ap.id === editingProfile.id ? {
                            ...ap,
                            libelle: editProfileLibelle,
                            portee: editProfilePortee,
                            droits: {
                              lecture: editProfileModuleDroits.risks.lecture,
                              creation: editProfileModuleDroits.risks.ecriture,
                              modification: editProfileModuleDroits.risks.modification,
                              validation: editProfileModuleDroits.risks.modification,
                              cloture: editProfileModuleDroits.risks.suppression,
                              export: editProfileModuleDroits.risks.exportation
                            },
                            moduleDroits: editProfileModuleDroits
                          } : ap));
                          onAddLog('Profils RBAC', `Mise à jour du profil d'habilitations "${editProfileLibelle}"`);
                          setEditingProfile(null);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs cursor-pointer"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RATING SCALES EDITING */}
          {activeTab === 'scales' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Échelles de Cotation et Description des Seuils</h3>
                  <p className="text-slate-400 text-[10.5px]">Configurez la signification textuelle de chaque niveau de cotation (Variables de probabilité, impact et maîtrise).</p>
                </div>
              </div>

              {/* Variables scale type selector */}
              <div className="flex bg-slate-100 rounded p-0.5 max-w-sm border border-slate-200">
                <button
                  onClick={() => setActiveScaleType('freq')}
                  className={`flex-1 py-1 px-3 text-center rounded text-xs font-bold transition ${activeScaleType === 'freq' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Probabilité / Fréquence (P)
                </button>
                <button
                  onClick={() => setActiveScaleType('imp')}
                  className={`flex-1 py-1 px-3 text-center rounded text-xs font-bold transition ${activeScaleType === 'imp' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Gravité / Impact (I)
                </button>
                <button
                  onClick={() => setActiveScaleType('ctrl')}
                  className={`flex-1 py-1 px-3 text-center rounded text-xs font-bold transition ${activeScaleType === 'ctrl' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Niveau Maîtrise (M)
                </button>
              </div>

              {/* Editing block layout */}
              <div className="space-y-4">
                {activeScaleType === 'freq' && tenantConfig.scales.frequency.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="col-span-1 text-center">
                      <span className="font-bold text-sm font-mono text-indigo-600 bg-white px-2 py-1.5 rounded-full border shadow-inner">
                        {item.value}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <input 
                        type="text" 
                        value={item.label}
                        onChange={(e) => handleUpdateScaleLabel('freq', idx, 'label', e.target.value)}
                        className="w-full bg-white border border-slate-200 p-1 rounded font-bold text-xs" 
                      />
                    </div>
                    <div className="col-span-8">
                      <input 
                        type="text" 
                        value={item.description}
                        onChange={(e) => handleUpdateScaleLabel('freq', idx, 'description', e.target.value)}
                        className="w-full bg-white border border-slate-200 p-1 rounded text-slate-500" 
                      />
                    </div>
                  </div>
                ))}

                {activeScaleType === 'imp' && tenantConfig.scales.impact.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="col-span-1 text-center">
                      <span className="font-bold text-sm font-mono text-indigo-600 bg-white px-2 py-1.5 rounded-full border shadow-inner">
                        {item.value}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <input 
                        type="text" 
                        value={item.label}
                        onChange={(e) => handleUpdateScaleLabel('imp', idx, 'label', e.target.value)}
                        className="w-full bg-white border border-slate-200 p-1 rounded font-bold text-xs" 
                      />
                    </div>
                    <div className="col-span-8">
                      <input 
                        type="text" 
                        value={item.description}
                        onChange={(e) => handleUpdateScaleLabel('imp', idx, 'description', e.target.value)}
                        className="w-full bg-white border border-slate-200 p-1 rounded text-slate-500" 
                      />
                    </div>
                  </div>
                ))}

                {activeScaleType === 'ctrl' && tenantConfig.scales.control.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="col-span-1 text-center">
                      <span className="font-bold text-sm font-mono text-indigo-600 bg-white px-2 py-1.5 rounded-full border shadow-inner">
                        {item.value}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <input 
                        type="text" 
                        value={item.label}
                        onChange={(e) => handleUpdateScaleLabel('ctrl', idx, 'label', e.target.value)}
                        className="w-full bg-white border border-slate-200 p-1 rounded font-bold text-xs" 
                      />
                    </div>
                    <div className="col-span-8">
                      <input 
                        type="text" 
                        value={item.description}
                        onChange={(e) => handleUpdateScaleLabel('ctrl', idx, 'description', e.target.value)}
                        className="w-full bg-white border border-slate-200 p-1 rounded text-slate-500" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM CALCULATIONS & MATRIX VALUES */}
          {activeTab === 'formula' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">Modèles Mathématiques d'Évaluation (Risk Calculation Engine)</h3>
                <p className="text-slate-400 text-[10.5px]">Choisissez la formule algorithmique que le moteur doit exécuter à la volée pendant la cotation d'un risque.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Formulas presets */}
                <div className="p-4 bg-slate-50 hover:bg-slate-100/65 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <strong className="text-slate-800 font-bold">Standard Multiplicatif IFACI 2013</strong>
                    <input 
                      type="radio" 
                      name="formula-select" 
                      checked={selectedFormulaId === 'f1'}
                      onChange={() => handleFormulaUpdate('f1')}
                      className="accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <code className="block bg-slate-800 text-teal-400 font-mono p-1 px-2 rounded text-xs">
                    Risque résiduel = P x I x M
                  </code>
                  <p className="text-slate-500 text-[10.5px]">
                    Sévérité du risque net basée sur l'action de multiplication cumulative standard. Idéal pour les grands groupes bancaires et industriels complexes.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 hover:bg-slate-100/65 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <strong className="text-slate-800 font-bold">Soustractif de Mitigation AeroTech</strong>
                    <input 
                      type="radio" 
                      name="formula-select" 
                      checked={selectedFormulaId === 'f2'}
                      onChange={() => handleFormulaUpdate('f2')}
                      className="accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <code className="block bg-slate-800 text-teal-400 font-mono p-1 px-2 rounded text-xs">
                    Risque net = (P x I) - M
                  </code>
                  <p className="text-slate-500 text-[10.5px]">
                    Sévérité du risque net pondérée à la baisse par déduction exacte de l'indice de maturité du contrôle interne. Échelle plus resserrée.
                  </p>
                </div>
              </div>

              {/* Matrix size configurations */}
              <div className="space-y-3 pt-4 border-t border-slate-105">
                <h4 className="font-bold text-slate-800 text-xs">Dimensionnement de la Matrice d'Impact (Heatmap Layout)</h4>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-medium">Taille de grille configurée :</span>
                  <select
                    value={matrixSize}
                    onChange={(e) => handleMatrixSizeUpdate(Number(e.target.value))}
                    className="bg-slate-100 border border-slate-200 text-indigo-600 rounded p-1.5 font-bold text-xs cursor-pointer"
                  >
                    <option value="3">3 x 3 - Simplifiée</option>
                    <option value="4">4 x 4 - Modèle IFACI 2013 standard</option>
                    <option value="5">5 x 5 - Modèle COSO / Aéronautique</option>
                    <option value="10">10 x 10 - Précision Décimale Avancée</option>
                  </select>
                </div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Modifier la taille de la grille redimensionne dynamiquement les coordonnées du module Matrice ainsi que les calculs de cotations du Risque brut.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: RISK CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800">Catégories de Risque Paramétrables</h3>
                <p className="text-slate-400 text-[10.5px]">Améliorez la classification de vos risques en créant des thématiques sur-mesure.</p>
              </div>

              <form onSubmit={handleAddCategory} className="p-4 bg-slate-50 rounded-xl border border-slate-150 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Intitulé de la catégorie</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex. Risques Climatiques..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-white border border-slate-255 rounded p-1.5 text-xs text-slate-900 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Couleur Thématique</label>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="color" 
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-8 h-8 rounded shrink-0 cursor-pointer border border-slate-200"
                    />
                    <span className="font-mono text-[10px] text-slate-450 uppercase">{newCatColor}</span>
                  </div>
                </div>
                <button
                  type="submit"
                  className="py-2 bg-indigo-600 text-white font-bold rounded shadow hover:bg-indigo-700 text-xs cursor-pointer text-center"
                >
                  Ajouter Thématique
                </button>
              </form>

              {/* Categories list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-80 overflow-y-auto">
                {tenantConfig.categories.map((cat) => (
                  <div 
                    key={cat.id} 
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color }}></span>
                      <div>
                        <strong className="text-slate-800 text-[11px] block leading-none">{cat.name}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCategory(cat.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 cursor-pointer"
                      title="Retirer la catégorie"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FORM BUILDER NO-CODE */}
          {activeTab === 'formbuilder' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-600" />
                    Moteur de Création de Formulaires Sans Code (Form Builder No-Code)
                  </h3>
                  <p className="text-slate-400 text-[10.5px]">
                    Ajoutez des champs personnalisés spécifiques à votre secteur d'activité dans les fiches de Risques, Incidents, Actions ou Audits sans écrire une seule ligne de code.
                  </p>
                </div>
              </div>

              {/* Form to Add New Custom Field */}
              <form onSubmit={handleAddCustomField} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  Ajouter un Nouveau Champ Métier Personnalisé
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Cible du Formulaire</label>
                    <select
                      value={newCfTarget}
                      onChange={(e) => setNewCfTarget(e.target.value as any)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800 font-bold"
                    >
                      <option value="Risque">Fiche Risque</option>
                      <option value="Incident">Déclaration Incident</option>
                      <option value="Action">Plan d'Action</option>
                      <option value="Audit">Mission d'Audit</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Intitulé du Champ (Label)</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex. Référent Assureur..."
                      value={newCfLabel}
                      onChange={(e) => setNewCfLabel(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Code Variable (Optionnel)</label>
                    <input 
                      type="text"
                      placeholder="Ex. VAL_ASSURANCE"
                      value={newCfCode}
                      onChange={(e) => setNewCfCode(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs font-mono text-slate-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Type de Champ</label>
                    <select
                      value={newCfType}
                      onChange={(e) => setNewCfType(e.target.value as any)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800 font-bold"
                    >
                      <option value="Texte">Texte court</option>
                      <option value="Nombre">Nombre / Montant (€)</option>
                      <option value="Liste">Liste Déroulante (Menu)</option>
                      <option value="Date">Date picker</option>
                      <option value="Case à cocher">Case à cocher (Booleen)</option>
                    </select>
                  </div>
                </div>

                {newCfType === 'Liste' && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Options de la Liste (séparées par une virgule)</label>
                    <input 
                      type="text"
                      placeholder="Option 1, Option 2, Option 3..."
                      value={newCfOptions}
                      onChange={(e) => setNewCfOptions(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded p-1.5 text-xs text-slate-800 font-medium"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={newCfReq}
                      onChange={(e) => setNewCfReq(e.target.checked)}
                      className="accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700">Champ Obligatoire pour la saisie</span>
                  </label>

                  <button
                    type="submit"
                    className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Créer le Champ Métier
                  </button>
                </div>
              </form>

              {/* Dynamic Custom Fields Inventory */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 uppercase text-xs">Champs Personnalisés Actifs dans les Formulaires :</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customFields.map((field) => (
                    <div key={field.id} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-start justify-between gap-3 hover:border-indigo-200">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] bg-indigo-50 text-indigo-750 px-1.5 py-0.5 rounded font-bold">
                            {field.code}
                          </span>
                          <span className="text-[8.5px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded border">
                            Formulaire {field.targetObject}
                          </span>
                          {field.required && (
                            <span className="text-[8px] bg-rose-100 text-rose-700 font-bold px-1 py-0.2 rounded">
                              Obligatoire
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-slate-900 text-xs">{field.label}</h5>
                        <p className="text-slate-400 text-[10px]">
                          Type de saisie : <strong className="text-slate-600">{field.type}</strong>
                          {field.options && ` | Options: ${field.options}`}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveCustomField(field.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 cursor-pointer"
                        title="Supprimer le champ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
