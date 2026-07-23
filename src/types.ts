/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'Analyste' | 'Responsable' | 'Risk Manager' | 'Direction' | 'SuperAdmin' | 'Administrateur';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  password?: string;
  tenantId?: string;
  roles?: Role[];
  isActive?: boolean;
  allowedModules?: string[];
  entityId?: string; // Attached organizational unit (Section 2.1)
}

export interface OrgEntity {
  id: string;
  name: string;
  type: 'Entreprise' | 'Filiale' | 'Département' | 'Division' | 'Direction' | 'Service' | 'Site';
  parentId?: string; // For tree structure
  code?: string; // Section 2.1.1
  statut?: 'Actif' | 'Inactif' | 'Fusionné' | 'Archivé';
  id_unite_fusion_cible?: string;
  rattachementsSecondaires?: string[]; // Multiple reporting/matriciel lines (Section 2.1.3)
  est_succursale?: boolean; // Marqueur contractuel pour la licence (Section 2.1.1)
  sousOrganigrammeMode?: 'heritage' | 'propre'; // Choix d'organisation de la succursale
  ville?: string;
  pays?: string;
  adresse?: string;
}

export interface Fonction { // Section 2.1.4
  id: string;
  libelle: string; // e.g. "Risk Manager", "CRO", "Auditeur Interne"
  entityId: string; // Unit to which it is attached
  habilitationProfileId: string; // Access Profile Id
  tenantId?: string;
}

export interface Affectation { // Section 2.1.4
  id: string;
  userId: string; // Person
  fonctionId: string; // Fonction
  dateDebut: string;
  dateFin?: string; // For history
  statut: 'Actif' | 'Historique';
  tenantId?: string;
}

export interface Rule { // Section 2.2.1
  id: string;
  libelle: string;
  typeRegle: 'Calcul' | 'Seuil' | 'Workflow' | 'Accès' | 'Périodicité' | 'Reporting';
  objetCible: 'Risque' | 'Plan d\'action' | 'Audit' | 'Conformité';
  condition: {
    operateur: 'ET' | 'OU';
    regles: { champ: string; operateur: string; valeur: any }[];
  };
  action: {
    type: 'ESCALADE_VALIDATION' | 'NOTIFY_ROLE' | 'BLOCK_ACCESS' | 'SET_FREQUENCY';
    parametres: {
      niveau_requis?: string;
      delai_jours?: number;
      notifier?: string[];
    };
  };
  priorite: number;
  statut: 'Active' | 'Inactive' | 'Brouillon';
  entityId?: string; // Unit restriction if any
  tenantId?: string;
}

export interface WorkflowConfig { // Section 2.2.4
  id: string;
  nom: string;
  declencheurRuleId?: string;
  steps: WorkflowStepConfig[];
}

export interface WorkflowStepConfig {
  id: string;
  ordre: number;
  fonctionValidatriceId: string; // Role required
  delaiMaxJours: number;
  actionSiRefus: 'Retour' | 'Clôture' | 'Escalade';
  actionSiTimeout: 'Escalade' | 'Relance' | 'Validation tacite';
}

export interface AccessProfile { // Section 2.2.5
  id: string;
  libelle: string;
  portee: 'Unité propre' | 'Unité + sous-unités' | 'Toutes unités' | 'Unités spécifiques';
  droits: {
    lecture: boolean;
    creation: boolean;
    modification: boolean;
    validation: boolean;
    cloture: boolean;
    export: boolean;
  };
  moduleDroits?: {
    [moduleId: string]: {
      lecture: boolean;
      ecriture: boolean;
      modification: boolean;
      suppression: boolean;
      importation: boolean;
      exportation: boolean;
    }
  };
  tenantId?: string;
}

// Module 4 — Audit Interne (Section 3.4)
export interface AuditMission {
  id: string;
  titre: string;
  description: string;
  type: 'Annuelle' | 'Cyclique' | 'Ad-hoc';
  status: 'Planifiée' | 'En cours' | 'Clôturée';
  dateDebut: string;
  dateFin: string;
  piloteFonctionId: string; // Function ID responsible
  tenantId?: string;
}

export interface AuditFinding {
  id: string;
  missionId: string;
  titre: string;
  description: string;
  gravite: 'Faible' | 'Moyenne' | 'Élevée' | 'Critique';
  recommandation: string;
  statut: 'Ouvert' | 'En remédiation' | 'Résolu';
  planRemediationId?: string; // Link to ActionPlan if configured
  tenantId?: string;
}

// Module 5 — Conformité réglementaire (Section 3.5)
export interface ComplianceFramework {
  id: string;
  nom: string;
  version: string;
  secteur: string;
  tenantId?: string;
}

export interface ComplianceObligation {
  id: string;
  frameworkId: string;
  titre: string;
  description: string;
  statut: 'Conforme' | 'Partiel' | 'Non conforme' | 'Non applicable';
  responsableFonctionId: string; // Function ID responsible
  derniereRevue: string;
  tenantId?: string;
}

export interface ComplianceIncident {
  id: string;
  dateOccurrence: string;
  titre: string;
  description: string;
  impactFinancier?: number;
  statutDeclaration: 'Brouillon' | 'Déclaré CNIL' | 'Déclaré Autorités' | 'Résolu';
  mesuresPrises: string;
  tenantId?: string;
}

export interface RiskCategory {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface ScaleItem {
  value: number; // e.g., 1, 2, 3, 4
  label: string; // e.g., "Rare", "Majeur", "Maîtrisé"
  description: string; // Detail description
  color?: string;
}

export interface FormulaConfig {
  id: string;
  name: string;
  expression: string; // e.g. "P * I * M" or "P * I" or "(P * I) * M"
  variables: { name: string; label: string; min: number; max: number }[];
  description: string;
}

export interface MatrixThreshold {
  label: string; // e.g., "Risque faible", "Risque modéré"
  minScore: number;
  maxScore: number;
  color: string; // e.g. bg-green-100 text-green-800
  textColor: string;
  description: string;
}

export interface TenantConfig {
  id: string;
  companyName: string;
  logoUrl?: string;
  scales: {
    frequency: ScaleItem[];
    impact: ScaleItem[];
    control: ScaleItem[];
  };
  formula: FormulaConfig;
  matrixSize: number; // e.g. 4 for 4x4 or 5 for 5x5
  matrixThresholds: MatrixThreshold[];
  workflowSteps: { id: string; name: string; color: string; order: number }[];
  categories: RiskCategory[];
  entities: OrgEntity[];
  showWorkflowFilter?: boolean;
}

export interface ActionPlan {
  id: string;
  riskId: string;
  title: string;
  description: string;
  ownerName: string;
  dueDate: string;
  priority: 'Basse' | 'Moyenne' | 'Haute' | 'Critique';
  status: 'À planifier' | 'En cours' | 'Réalisé' | 'Annulé';
  progress: number; // 0 to 100
  tenantId?: string;
}

export interface Risk {
  id: string; // e.g. "R-001"
  title: string;
  description: string;
  categoryId: string;
  entityId: string;
  createdBy: string;
  createdAt: string;
  statusId: string; // workflow step id
  tenantId?: string;
  
  // Rating values
  frequencyValue: number; // e.g. 1-4
  impactValue: number; // e.g. 1-4
  controlValue: number; // e.g. 1-4 (maîtrise)
  
  // Calculated Scores
  scoreBrut: number; // frequency * impact
  scoreResiduel: number; // scoreBrut * controlValue
  
  history: {
    date: string;
    user: string;
    action: string;
    comment?: string;
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  tenantId: string;
}

// Section 10.2: Modèle de données SuperAdministrateur
export interface EntrepriseCliente {
  id: string;
  raisonSociale: string;
  secteurActivite: string;
  specificationSecteur?: string; // Spécification descriptive sur l'activité
  dateCreationCompte: string;
  statutCompte: 'Essai' | 'Actif' | 'Suspendu' | 'Résilié' | 'Archivé';
  regionHebergement: string;
  idContactPrincipal: string; // Linked to a user ID or contact name
  maxSuccursales?: number; // Authorized subsidiaries/succursales the client can add
  maxDirections?: number;
  maxDepartements?: number;
  maxServices?: number;
  maxSitesLocaux?: number;
  maxFiliales?: number;
  succursalesActives?: boolean; // Section 10.2.2 Option active/inactive
  depassementQuotaMode?: 'blocage' | 'inactif'; // Section 10.2.2 Gestion dépassement
  
  // Extra Company details
  pays?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;

  // Contact Administrateur details
  contactNom?: string;
  contactPrenom?: string;
  contactTitre?: string;
  contactTelephone?: string;
  contactEmail?: string;
}

export interface Licence {
  id: string;
  entrepriseId: string;
  typeAbonnement: 'Mensuel' | 'Annuel' | 'Sur devis';
  nombreUtilisateursMax: number;
  nombreUtilisateursActuel: number;
  modulesActives: ('Cartographie' | 'Plans d\'action' | 'Audit' | 'Conformité' | 'Reporting' | 'Serveur SMTP' | 'SMTP')[];
  dateDebut: string;
  dateFin: string;
  statutLicence: 'Active' | 'En période d\'essai' | 'Expirée' | 'Suspendue';
  nombre_succursales_max?: number; // Plafond contractuel (Section 10.2.2)
  nombre_succursales_actuel?: number; // Compteur calculé en temps réel (Section 10.2.2)
  depassementQuotaMode?: 'blocage' | 'inactif'; // Mode de dépassement de quota (Section 10.2.2)
  succursalesActives?: boolean; // Fonctionnalité succursales activée (Section 10.2.2)
  demandeValidationSmtp?: boolean; // Demande d'activation transmise au SuperAdmin Commercial
  dateDemandeSmtp?: string; // Horodatage de la soumission contractuelle
  motifDemandeSmtp?: string; // Motif ou note transmise par le client
}

export interface HistoriqueLicence {
  id: string;
  licenceId: string;
  typeChangement: 'Création' | 'Renouvellement' | 'Changement de palier' | 'Ajout de module' | 'Suspension' | 'Résiliation';
  dateChangement: string;
  effectuePar: string; // SuperAdmin user
  details: string;
}

export type SuperAdminRole = 'SuperAdministrateur technique' | 'SuperAdministrateur commercial / contractuel' | 'Support niveau 2';

export interface SessionExercice {
  id: string;
  annee: number;
  dateDebut: string;
  dateFin: string;
  statut: 'Ouverte' | 'Clôturée';
  dateCloture?: string;
  bilanAnnuel?: string;
}

