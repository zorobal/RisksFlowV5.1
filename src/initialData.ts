/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

// Preset Users
export const PRESET_USERS: User[] = [
  { id: 'u1', name: 'Alain-Patrick Nkoumou', email: 'alainpatricknkoumou@gmail.com', role: 'Risk Manager', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80', password: 'vito' },
  { id: 'u2', name: 'Marie-Thérèse Atangana', email: 'mt.atangana@enterprise.com', role: 'Direction', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&fit=crop&q=80', password: 'vito' },
  { id: 'u3', name: 'Jean-Pierre Ndzana', email: 'jp.ndzana@enterprise.com', role: 'Responsable', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80', password: 'vito' },
  { id: 'u4', name: 'Dieudonné Mbarga', email: 'd.mbarga@enterprise.com', role: 'Analyste', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80', password: 'vito' },
  { id: 'u5', name: 'SuperAdmin Kouam', email: 'admin@plateforme.com', role: 'SuperAdmin', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80', password: 'vito' },
];

// Preset Tenant 1: Sogesti S.A. (follows exactly the IFACI 2013 Annex 1)
export const SOGESTI_CONFIG: TenantConfig = {
  id: 'tenant1',
  companyName: 'Sogesti Cameroun S.A.',
  logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&fit=crop&q=80',
  matrixSize: 4, // 4x4 for P * I and 4x4 for Control
  scales: {
    frequency: [
      { value: 1, label: 'Exceptionnel', description: 'Occurrence quasi nulle (<1%) sur 2 ans' },
      { value: 2, label: 'Rare', description: 'Occurrence possible mais peu probable (1 à 10%) sur 2 ans' },
      { value: 3, label: 'Probable', description: 'Occurrence plausible (10 à 50%) sur 2 ans' },
      { value: 4, label: 'Très probable', description: 'Occurrence très probable (>50%) sur 2 ans' },
    ],
    impact: [
      { value: 1, label: 'Limité', description: '<5 % du résultat annuel. Attention de tiers ou observation des autorités.' },
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
    expression: 'P * I * M', // Frequency * Impact * Maîtrise
    variables: [
      { name: 'P', label: 'Probabilité/Fréquence', min: 1, max: 4 },
      { name: 'I', label: 'Impact', min: 1, max: 4 },
      { name: 'M', label: 'Maîtrise/Contrôle', min: 1, max: 4 },
    ],
    description: 'Calcul par produit simple du score brut (P x I) puis risque net (Brut x Maîtrise). Échelle de 1 à 64.',
  },
  matrixThresholds: [
    { label: 'Risque faible', minScore: 0, maxScore: 6, color: 'bg-green-100 text-green-800 border-green-200', textColor: '#15803d', description: 'L\'impact sur l\'atteinte des objectifs n\'est pas préoccupant, le risque est sous contrôle.' },
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
    { id: 'e1', name: 'Direction Générale (Yaoundé)', type: 'Direction' },
    { id: 'e1_1', name: 'Département Finance & Comptabilité', type: 'Département', parentId: 'e1' },
    { id: 'e1_2', name: 'Département Technologie & DSI', type: 'Département', parentId: 'e1' },
    { id: 'e1_3', name: 'Département Juridique & Compliance (ANTIC / MINPOSTEL)', type: 'Département', parentId: 'e1' },
    { id: 'e1_4', name: 'Département Opérations & Logistique', type: 'Département', parentId: 'e1' },
    { id: 'e2', name: 'Filiale Côte d\'Ivoire (Abidjan)', type: 'Filiale', parentId: 'e1' },
    { id: 'e3', name: 'Filiale Gabon (Libreville)', type: 'Filiale', parentId: 'e1' },
    { id: 'e3_1', name: 'Site Logistique Port de Douala', type: 'Site', parentId: 'e1' },
  ]
};

// Preset Tenant 2: AeroTech SAS (alternative 5x5 layout)
export const AEROTECH_CONFIG: TenantConfig = {
  id: 'tenant2',
  companyName: 'AeroTech Cameroun SAS (Aéronautique)',
  logoUrl: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=80&fit=crop&q=80',
  matrixSize: 5, // 5x5 rating engine
  scales: {
    frequency: [
      { value: 1, label: 'Pratiquement impossible', description: 'Une fois par décennie' },
      { value: 2, label: 'Improbable', description: 'Une fois tous les 5 ans' },
      { value: 3, label: 'Occasionnel', description: 'Une fois par an' },
      { value: 4, label: 'Fréquent', description: 'Plusieurs fois par an' },
      { value: 5, label: 'Quasi permanent', description: 'Toutes les semaines' },
    ],
    impact: [
      { value: 1, label: 'Négligeable', description: 'Aucune conséquence opérationnelle notable' },
      { value: 2, label: 'Mineur', description: 'Perturbations légères, retard mineur' },
      { value: 3, label: 'Modéré', description: 'Impact significatif sur une ligne de production' },
      { value: 4, label: 'Critique', description: 'Danger humain ou arrêt total d\'un programme de vol' },
      { value: 5, label: 'Catastrophique', description: 'Faillite d\'entreprise ou décès de passagers / personnels.' },
    ],
    control: [
      { value: 1, label: 'Optimisé', description: 'Contrôle proactif, audits tri-annuels automatisés' },
      { value: 2, label: 'Maîtrisé', description: 'Règles bien appliquées et formalisées' },
      { value: 3, label: 'Partiel', description: 'Règles orales mais appliquées la plupart du temps' },
      { value: 4, label: 'Insuffisant', description: 'Contrôles aléatoires, failles évidentes' },
      { value: 5, label: 'Inexistant', description: 'Aucun contrôle appliqué' },
    ],
  },
  formula: {
    id: 'f2',
    name: 'Formule Aéronautique P * I - M',
    expression: '(P * I) - M', // alternate formula formula interpretation
    variables: [
      { name: 'P', label: 'Probabilité/Fréquence', min: 1, max: 5 },
      { name: 'I', label: 'Impact', min: 1, max: 5 },
      { name: 'M', label: 'Maîtrise/Contrôle', min: 1, max: 5 },
    ],
    description: 'Score Brut = P x I (max 25). Score Net = (P x I) - M (échelle de 0 à 24 pour intégrer la mitigation soustractive).',
  },
  matrixThresholds: [
    { label: 'Risque Mineur', minScore: 0, maxScore: 5, color: 'bg-green-100 text-green-800 border-green-200', textColor: '#15803d', description: 'Risques acceptables sans correction indispensable.' },
    { label: 'Risque Modéré', minScore: 5.1, maxScore: 12, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', textColor: '#a16207', description: 'Nécessite une surveillance périodique.' },
    { label: 'Risque Critique', minScore: 12.1, maxScore: 20, color: 'bg-orange-100 text-orange-800 border-orange-200', textColor: '#c2410c', description: 'Rapports réguliers à la Direction Technique requis.' },
    { label: 'Risque Catastrophique', minScore: 20.1, maxScore: 25, color: 'bg-red-100 text-red-800 border-red-200', textColor: '#b91c1c', description: 'Arrêt Immédiat requis de la ligne de production.' },
  ],
  workflowSteps: [
    { id: 'w_brouillon', name: '📊 Brouillon', color: 'bg-gray-100 text-gray-800', order: 1 },
    { id: 'w_validation', name: '⏳ Validation Responsable', color: 'bg-amber-100 text-amber-800', order: 2 },
    { id: 'w_approuve', name: '✅ Approuvé GRC', color: 'bg-green-100 text-green-800', order: 3 },
  ],
  categories: [
    { id: 'cat_prod', name: 'Production & Assemblage', color: '#14b8a6', description: 'Erreurs de calibrage, ruptures d\'approvisionnement matières.' },
    { id: 'cat_secu', name: 'Sécurité des Vols', color: '#f43f5e', description: 'Incident en altitude, défaut de fabrication de pièces critiques.' },
    { id: 'cat_it', name: 'Systèmes de Vol (Avionique)', color: '#6366f1', description: 'Bugs de code pilote automatique, perte de liaisons satellites.' },
    { id: 'cat_admin', name: 'Juridique & Financier', color: '#f59e0b', description: 'Retards de livraison sur pénalités financières.' },
  ],
  entities: [
    { id: 'e1', name: 'Direction Aérospatiale Camerounaise', type: 'Direction' },
    { id: 'e1_1', name: 'Bureau d\'Études Avionique de Yaoundé', type: 'Département', parentId: 'e1' },
    { id: 'e1_2', name: 'Usine Assemblage Garoua', type: 'Site', parentId: 'e1' },
    { id: 'e1_3', name: 'Direction Qualité Globale - Douala', type: 'Département', parentId: 'e1' },
  ]
};

// Default Risks for Tenant 1 (Sogesti)
export const SOGESTI_RISKS: Risk[] = [
  {
    id: 'R-101',
    title: 'Cyberattaque par Ransomware et blocage du SI comptable à Yaoundé',
    description: 'Cryptage de l\'ensemble des bases de données comptables par un logiciel malveillant via un e-mail de phishing ciblé.',
    categoryId: 'cat_it',
    entityId: 'e1_2', // Technologie & DSI
    createdBy: 'Alain-Patrick Nkoumou',
    createdAt: '2026-03-12',
    statusId: 'w_approuve',
    frequencyValue: 3, // Probable
    impactValue: 4, // Critique
    controlValue: 2, // Acceptable (Procédures écrites de sauvegarde de secours, mais pas d\'audits fréquents)
    scoreBrut: 12, // 3 * 4
    scoreResiduel: 24, // 12 * 2 (Risque significatif en échelle IFACI ]18-32])
    history: [
      { date: '2026-03-12', user: 'Dieudonné Mbarga', action: 'Création du risque à l\'état de Brouillon' },
      { date: '2026-04-01', user: 'Alain-Patrick Nkoumou', action: 'Cotation effectuée' },
      { date: '2026-04-05', user: 'Marie-Thérèse Atangana', action: 'Approbation finale GRC du risque' }
    ]
  },
  {
    id: 'R-102',
    title: 'Non-conformité ANTIC (Cameroun) sur la gestion des données clients',
    description: 'Absence de consentement explicite recueilli sur le site web applicatif suite aux évolutions réglementaires, risque de mise en cause de l\'ANTIC.',
    categoryId: 'cat_regulatory',
    entityId: 'e1_3', // Juridique & Compliance
    createdBy: 'Marie-Thérèse Atangana',
    createdAt: '2026-04-10',
    statusId: 'w_validation',
    frequencyValue: 4, // Très probable
    impactValue: 2, // Significatif
    controlValue: 3, // Insuffisant (Règles orales, pas de registre de traitement à jour)
    scoreBrut: 8, // 4 * 2
    scoreResiduel: 24, // 8 * 3 (Risque significatif)
    history: [
      { date: '2026-04-10', user: 'Marie-Thérèse Atangana', action: 'Création du risque et affectation au département juridique' },
      { date: '2026-05-01', user: 'Dieudonné Mbarga', action: 'Mise à jour des éléments d\'évaluation' }
    ]
  },
  {
    id: 'R-103',
    title: 'Fraude au Président sur virement bancaire international (Alerte Yaoundé)',
    description: 'Phishing ou ingénierie sociale se faisant passer pour le Président afin d\'obtenir de l\'équipe financière un virement monétaire exceptionnel.',
    categoryId: 'cat_finance',
    entityId: 'e1_1', // Finance & Comptabilité
    createdBy: 'Alain-Patrick Nkoumou',
    createdAt: '2026-01-15',
    statusId: 'w_approuve',
    frequencyValue: 2, // Rare
    impactValue: 3, // Majeur
    controlValue: 1, // Maîtrisé (Double validation systématique et process strict de rappel)
    scoreBrut: 6, // 2 * 3
    scoreResiduel: 6, // 6 * 1 (Risque faible sous contrôle [0-6])
    history: [
      { date: '2026-01-15', user: 'Alain-Patrick Nkoumou', action: 'Détection et enregistrement du risque' },
      { date: '2026-02-01', user: 'Jean-Pierre Ndzana', action: 'Mise en place de la procédure de double validation des virements bancaires' }
    ]
  },
  {
    id: 'R-104',
    title: 'Incendie majeur sur l\'entrepôt logistique du Port de Douala',
    description: 'Déclenchement d\'un court-circuit ou sinistre causant la perte irréversible du stock matériel et provoquant un arrêt d\'activité.',
    categoryId: 'cat_operational',
    entityId: 'e3_1', // Site Logistique Port de Douala
    createdBy: 'Marie-Thérèse Atangana',
    createdAt: '2026-05-20',
    statusId: 'w_evaluation',
    frequencyValue: 1, // Exceptionnel
    impactValue: 4, // Critique
    controlValue: 4, // Faible (Absence de système anti-incendie certifié à jour sur le site)
    scoreBrut: 4, // 1 * 4
    scoreResiduel: 16, // 4 * 4 (Risque modéré ]6-18])
    history: [
      { date: '2026-05-20', user: 'Marie-Thérèse Atangana', action: 'Initiation de la fiche de risque suite au rapport de sécurité' }
    ]
  },
  {
    id: 'R-105',
    title: 'Démission simultanée d\'ingénieurs de développement clés à Yaoundé',
    description: 'Fuite massive de compétences et de savoir-faire technique suite aux doutes sur le plan de restructuration stratégique annuel.',
    categoryId: 'cat_human',
    entityId: 'e1_2', // Technologie & DSI
    createdBy: 'Jean-Pierre Ndzana',
    createdAt: '2026-06-01',
    statusId: 'w_validation',
    frequencyValue: 3, // Probable
    impactValue: 3, // Majeur
    controlValue: 4, // Faible (Aucune fidélisation, absence de documentation technique)
    scoreBrut: 9, // 3 * 3
    scoreResiduel: 36, // 9 * 4 (Risque élevé ]32-64] - ALERTE DIRECTION)
    history: [
      { date: '2026-06-01', user: 'Jean-Pierre Ndzana', action: 'Enregistrement de la fiche' }
    ]
  }
];

// Default Risks for Tenant 2 (AeroTech - (P * I) - Control)
export const AEROTECH_RISKS: Risk[] = [
  {
    id: 'R-201',
    title: 'Fissure micro-structurelle de l\'empennage en fonderie à Garoua',
    description: 'Défaut de chauffage du moule de fonderie provoquant des faiblesses structurelles invisibles à l\'œil nu sur le modèle d\'empennage des ailes à l\'usine de Garoua.',
    categoryId: 'cat_secu',
    entityId: 'e1_2', // Usine Garoua
    createdBy: 'Marie-Thérèse Atangana',
    createdAt: '2026-02-14',
    statusId: 'w_approuve',
    frequencyValue: 2, // Improbable
    impactValue: 5, // Catastrophique
    controlValue: 4, // Insuffisant (Équipement radiographique de contrôle ancien)
    scoreBrut: 10, // 2 * 5
    scoreResiduel: 6, // (2 * 5) - 4 = 6 (Risque Modéré: 5.1 à 12)
    history: [
      { date: '2026-02-14', user: 'Marie-Thérèse Atangana', action: 'Création de la fiche avec audit qualité' }
    ]
  },
  {
    id: 'R-202',
    title: 'Bug critique du logiciel de pilotage du stabilisateur',
    description: 'Exception non gérée en vol de nuit en cas de givre simultané des trois sondes Pitot menant à la mise en piqué de l\'appareil.',
    categoryId: 'cat_it',
    entityId: 'e1_1', // Bureau Avionique Yaoundé
    createdBy: 'Alain-Patrick Nkoumou',
    createdAt: '2026-05-18',
    statusId: 'w_validation',
    frequencyValue: 1, // Pratiquement impossible
    impactValue: 5, // Catastrophique
    controlValue: 5, // Inexistant (Absence de simulation de test de givre sur ce module)
    scoreBrut: 5, // 1 * 5
    scoreResiduel: 0, // (1 * 5) - 5 = 0 (Risque Mineur: sous contrôle maximal par redondance logique)
    history: [
      { date: '2026-05-18', user: 'Alain-Patrick Nkoumou', action: 'Ajout de la revue de bug réglementaire' }
    ]
  }
];

// Actions pre-loaded
export const PRESET_ACTIONS: ActionPlan[] = [
  {
    id: 'a1',
    riskId: 'R-101',
    title: 'Mettre en place un outil d\'EDR (Endpoint Detection & Response)',
    description: 'Déploiement d\'un agent de détection avancé sur l\'ensemble des serveurs et postes administratifs.',
    ownerName: 'Marie-Thérèse Atangana',
    dueDate: '2026-07-30',
    priority: 'Critique',
    status: 'En cours',
    progress: 40
  },
  {
    id: 'a2',
    riskId: 'R-101',
    title: 'Planifier un exercice de restauration de sauvegarde offline',
    description: 'Vérifier la validité et la vitesse de rechargement des copies comptables mensuelles déconnectées.',
    ownerName: 'Marie-Thérèse Atangana',
    dueDate: '2026-06-25',
    priority: 'Haute',
    status: 'En cours',
    progress: 75
  },
  {
    id: 'a3',
    riskId: 'R-102',
    title: 'Rédiger le registre officiel de traitement des activités',
    description: 'Recenser toutes les activités manipulant des données nominatives de clients et désigner un DPO.',
    ownerName: 'Dieudonné Mbarga',
    dueDate: '2026-08-15',
    priority: 'Moyenne',
    status: 'À planifier',
    progress: 0
  },
  {
    id: 'a4',
    riskId: 'R-103',
    title: 'Réaliser une session de sensibilisation au phishing pour la DAF',
    description: 'Former l\'ensemble des équipes comptables à la détection de fraudes et mails d\'arnaque au président.',
    ownerName: 'Alain-Patrick Nkoumou',
    dueDate: '2026-05-10',
    priority: 'Moyenne',
    status: 'Réalisé',
    progress: 100
  },
  {
    id: 'a5',
    riskId: 'R-105',
    title: 'Procéder à des entretiens de fidélisation individuels',
    description: 'Offrir une revalorisation salariale et plan de carrière clair pour le noyau dur des ingénieurs clés.',
    ownerName: 'Jean-Pierre Ndzana',
    dueDate: '2026-06-20',
    priority: 'Critique',
    status: 'En cours',
    progress: 50
  },
  {
    id: 'a6',
    riskId: 'R-201',
    title: 'Acheter un capteur radiographique thermique 4K à Garoua',
    description: 'Remplacement du vieux tube par de l\'imagerie certifiée haute résolution d\'usine.',
    ownerName: 'Jean-Pierre Ndzana',
    dueDate: '2026-09-01',
    priority: 'Haute',
    status: 'À planifier',
    progress: 10
  }
];

// Audit trail preset logs
export const PRESET_AUDIT_LOGS: AuditLog[] = [
  { id: 'l1', timestamp: '2026-06-15T09:12:00Z', userId: 'u1', userName: 'Alain-Patrick Nkoumou', userRole: 'Risk Manager', action: 'Export Rapport PDF', details: 'Rapport complet consolidé trimestriel généré avec succès en format PDF imprimable.', tenantId: 'tenant1' },
  { id: 'l2', timestamp: '2026-06-14T14:22:05Z', userId: 'u2', userName: 'Marie-Thérèse Atangana', userRole: 'Direction', action: 'Mise à jour Paramètres', details: 'Modification de l\'échelle de Maîtrise: ajout des tooltips explicatifs IFACI 2013.', tenantId: 'tenant1' },
  { id: 'l3', timestamp: '2026-06-13T10:45:12Z', userId: 'u1', userName: 'Alain-Patrick Nkoumou', userRole: 'Risk Manager', action: 'Simulation', details: 'Simulation active effectuée sur la réduction de l\'impact du risque R-105.', tenantId: 'tenant1' },
  { id: 'l4', timestamp: '2026-06-12T08:30:00Z', userId: 'u3', userName: 'Jean-Pierre Ndzana', userRole: 'Responsable', action: 'Création Plan Action', details: 'Création du plan d\'action a5: Entretiens de fidélisation individuels sous le risque R-105.', tenantId: 'tenant1' },
  { id: 'l5', timestamp: '2026-06-11T16:15:30Z', userId: 'u1', userName: 'Alain-Patrick Nkoumou', userRole: 'Risk Manager', action: 'Validation Risque', details: 'Passage du risque R-101 de l\'étape Évaluation à l\'étape Approuvé GRC.', tenantId: 'tenant1' },
  { id: 'l6', timestamp: '2026-06-10T11:00:10Z', userId: 'u4', userName: 'Dieudonné Mbarga', userRole: 'Analyste', action: 'Création Risque', details: 'Enregistrement de la fiche descriptive du risque RGPD R-102.', tenantId: 'tenant1' },
];

// ACCESS PROFILES (Section 2.2.5)
export const PRESET_ACCESS_PROFILES: AccessProfile[] = [
  {
    id: 'ap1',
    libelle: 'Contrôle Interne / CRO',
    portee: 'Toutes unités',
    droits: { lecture: true, creation: true, modification: true, validation: true, cloture: true, export: true }
  },
  {
    id: 'ap2',
    libelle: 'Auditeur Interne',
    portee: 'Toutes unités',
    droits: { lecture: true, creation: true, modification: true, validation: false, cloture: false, export: true }
  },
  {
    id: 'ap3',
    libelle: 'Responsable d\'Unité',
    portee: 'Unité + sous-unités',
    droits: { lecture: true, creation: true, modification: true, validation: true, cloture: false, export: false }
  },
  {
    id: 'ap4',
    libelle: 'Contributeur Métier',
    portee: 'Unité propre',
    droits: { lecture: true, creation: true, modification: false, validation: false, cloture: false, export: false }
  }
];

// FONCTIONS (Section 2.1.4)
export const PRESET_FONCTIONS: Fonction[] = [
  { id: 'f_cro', libelle: 'Chief Risk Officer (CRO) Groupe', entityId: 'e1', habilitationProfileId: 'ap1' },
  { id: 'f_audit', libelle: 'Auditeur Interne Senior', entityId: 'e1_1', habilitationProfileId: 'ap2' },
  { id: 'f_rm_local', libelle: 'Risk Manager Filiale', entityId: 'e2', habilitationProfileId: 'ap3' },
  { id: 'f_analyst', libelle: 'Analyste Risques Junior', entityId: 'e1_2', habilitationProfileId: 'ap4' },
  { id: 'f_legal', libelle: 'Responsable de la Compliance', entityId: 'e1_3', habilitationProfileId: 'ap3' }
];

// AFFECTATIONS PERSONNE / FONCTION (Section 2.1.4)
export const PRESET_AFFECTATIONS: Affectation[] = [
  { id: 'aff1', userId: 'u1', fonctionId: 'f_cro', dateDebut: '2025-01-01', statut: 'Actif' },
  { id: 'aff2', userId: 'u2', fonctionId: 'f_rm_local', dateDebut: '2025-06-01', statut: 'Actif' },
  { id: 'aff3', userId: 'u3', fonctionId: 'f_audit', dateDebut: '2024-09-15', statut: 'Actif' },
  { id: 'aff4', userId: 'u4', fonctionId: 'f_analyst', dateDebut: '2026-01-10', statut: 'Actif' },
  { id: 'aff5', userId: 'u4', fonctionId: 'f_rm_local', dateDebut: '2023-01-01', dateFin: '2025-12-31', statut: 'Historique' }
];

// RULES ENGINE CONFIGURATION (Section 2.2.1)
export const PRESET_RULES: Rule[] = [
  {
    id: 'r_rule_1',
    libelle: 'Alerte et escalade automatique si criticité financière élevée',
    typeRegle: 'Workflow',
    objetCible: 'Risque',
    condition: {
      operateur: 'ET',
      regles: [
        { champ: 'scoreBrut', operateur: '>=', valeur: 12 },
        { champ: 'categoryId', operateur: '=', valeur: 'cat_finance' }
      ]
    },
    action: {
      type: 'ESCALADE_VALIDATION',
      parametres: {
        niveau_requis: 'Comite_Audit',
        delai_jours: 15,
        notifier: ['Chief Risk Officer (CRO) Groupe', 'Auditeur Interne Senior']
      }
    },
    priorite: 1,
    statut: 'Active'
  },
  {
    id: 'r_rule_2',
    libelle: 'Notification automatique des risques IT critiques',
    typeRegle: 'Reporting',
    objetCible: 'Risque',
    condition: {
      operateur: 'ET',
      regles: [
        { champ: 'scoreResiduel', operateur: '>=', valeur: 24 },
        { champ: 'categoryId', operateur: '=', valeur: 'cat_it' }
      ]
    },
    action: {
      type: 'NOTIFY_ROLE',
      parametres: {
        notifier: ['Chief Risk Officer (CRO) Groupe', 'Responsable de la Compliance']
      }
    },
    priorite: 2,
    statut: 'Active'
  }
];

// AUDIT MISSIONS (Section 3.4)
export const PRESET_AUDIT_MISSIONS: AuditMission[] = [
  {
    id: 'm1',
    titre: 'Audit de la Sécurité Informatique et Cybersécurité',
    description: 'Vérification de l\'application des plans de remédiation contre les attaques par Ransomware et résistance générale de l\'infrastructure.',
    type: 'Annuelle',
    status: 'En cours',
    dateDebut: '2026-06-01',
    dateFin: '2026-07-15',
    piloteFonctionId: 'f_audit'
  },
  {
    id: 'm2',
    titre: 'Revue de la Conformité RGPD & CNIL',
    description: 'Vérification du registre de traitement et de la légalité du recueil de consentement client.',
    type: 'Cyclique',
    status: 'Planifiée',
    dateDebut: '2026-09-01',
    dateFin: '2026-09-30',
    piloteFonctionId: 'f_audit'
  }
];

export const PRESET_AUDIT_FINDINGS: AuditFinding[] = [
  {
    id: 'f_1',
    missionId: 'm1',
    titre: 'Absence de pare-feu applicatif (WAF) mis à jour',
    description: 'Les serveurs exposés à Internet n\'utilisent pas de filtrage WAF moderne. Risque élevé de déni de service et d\'injection.',
    gravite: 'Élevée',
    recommandation: 'Déployer immédiatement un WAF cloud sur la passerelle d\'accès principale.',
    statut: 'En remédiation',
    planRemediationId: 'a1'
  },
  {
    id: 'f_2',
    missionId: 'm1',
    titre: 'Politique de mots de passe non contraignante',
    description: 'Certains anciens comptes administrateurs n\'ont pas de complexité renforcée ni d\'obligation MFA.',
    gravite: 'Critique',
    recommandation: 'Forcer l\'activation MFA globale sur toutes les consoles de management.',
    statut: 'Ouvert'
  }
];

// COMPLIANCE FRAMEWORKS & OBLIGATIONS (Section 3.5)
export const PRESET_COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  { id: 'cf_rgpd', nom: 'Règlement Général sur la Protection des Données (RGPD)', version: '2018/679', secteur: 'Transverse / Numérique' },
  { id: 'cf_iso27001', nom: 'ISO/IEC 27001 - Management de la sécurité des SI', version: '2022', secteur: 'Sécurité de l\'Information' }
];

export const PRESET_COMPLIANCE_OBLIGATIONS: ComplianceObligation[] = [
  {
    id: 'co_1',
    frameworkId: 'cf_rgpd',
    titre: 'Registre des Activités de Traitement (Article 30)',
    description: 'Tenir un registre détaillé des traitements de données à caractère personnel sous la responsabilité de la structure.',
    statut: 'Partiel',
    responsableFonctionId: 'f_legal',
    derniereRevue: '2026-05-10'
  },
  {
    id: 'co_2',
    frameworkId: 'cf_rgpd',
    titre: 'Désignation d\'un Délégué à la Protection des Données (DPO)',
    description: 'Nommer officiellement un DPO et déclarer ses coordonnées à l\'autorité de contrôle.',
    statut: 'Conforme',
    responsableFonctionId: 'f_legal',
    derniereRevue: '2026-06-01'
  },
  {
    id: 'co_3',
    frameworkId: 'cf_iso27001',
    titre: 'A.8.1 Inventaire des Actifs informatiques',
    description: 'Les actifs associés à l\'information et aux installations de traitement de l\'information doivent être identifiés et répertoriés.',
    statut: 'Non conforme',
    responsableFonctionId: 'f_cro',
    derniereRevue: '2026-04-15'
  }
];

export const PRESET_COMPLIANCE_INCIDENTS: ComplianceIncident[] = [
  {
    id: 'inc_1',
    dateOccurrence: '2026-05-20',
    titre: 'Tentative d\'intrusion par phishing suspecté',
    description: 'Un e-mail frauduleux a tenté d\'usurper l\'identité de la DAF. Le compte d\'un comptable a été bloqué préventivement.',
    impactFinancier: 0,
    statutDeclaration: 'Résolu',
    mesuresPrises: 'Réinitialisation immédiate du mot de passe et formation flash de l\'équipe.'
  },
  {
    id: 'inc_2',
    dateOccurrence: '2026-06-22',
    titre: 'Fuite de données restreintes suite à un partage public inapproprié',
    description: 'Un fichier contenant 120 adresses e-mails de prospects a été partagé par erreur via un lien cloud public.',
    impactFinancier: 1200,
    statutDeclaration: 'Déclaré CNIL',
    mesuresPrises: 'Révocation immédiate du lien de partage public et notification des 120 destinataires.'
  }
];

export const PRESET_ENTREPRISES: EntrepriseCliente[] = [
  {
    id: 'tenant1',
    raisonSociale: 'Sogesti Cameroun S.A.',
    secteurActivite: 'Services Financiers & Technologies GRC',
    dateCreationCompte: '2025-01-10',
    statutCompte: 'Actif',
    regionHebergement: 'Afrique Centrale (Yaoundé / Douala)',
    idContactPrincipal: 'Alain-Patrick Nkoumou',
    maxSuccursales: 8,
    succursalesActives: true,
    depassementQuotaMode: 'blocage'
  },
  {
    id: 'tenant2',
    raisonSociale: 'AeroTech Cameroun SAS',
    secteurActivite: 'Aéronautique & Maintenance Garoua',
    dateCreationCompte: '2025-03-15',
    statutCompte: 'Actif',
    regionHebergement: 'Afrique Centrale (Yaoundé)',
    idContactPrincipal: 'Marie-Thérèse Atangana',
    maxSuccursales: 5,
    succursalesActives: true,
    depassementQuotaMode: 'inactif'
  },
  {
    id: 'tenant3',
    raisonSociale: 'Pharmacie du Centre Yaoundé S.A.',
    secteurActivite: 'Pharmacie & Distribution de Santé',
    dateCreationCompte: '2026-06-01',
    statutCompte: 'Essai',
    regionHebergement: 'Afrique Centrale (Douala)',
    idContactPrincipal: 'Jean-Pierre Ndzana',
    maxSuccursales: 3,
    succursalesActives: false,
    depassementQuotaMode: 'blocage'
  },
  {
    id: 'tenant4',
    raisonSociale: 'AfriCorp Distribution S.A.',
    secteurActivite: 'Grande Distribution & Import-Export',
    dateCreationCompte: '2024-11-20',
    statutCompte: 'Suspendu',
    regionHebergement: 'Afrique de l\'Ouest (Abidjan)',
    idContactPrincipal: 'Dieudonné Mbarga',
    maxSuccursales: 10,
    succursalesActives: true,
    depassementQuotaMode: 'blocage'
  }
];

export const PRESET_LICENCES: Licence[] = [
  {
    id: 'lic1',
    entrepriseId: 'tenant1',
    typeAbonnement: 'Annuel',
    nombreUtilisateursMax: 50,
    nombreUtilisateursActuel: 4,
    modulesActives: ['Cartographie', 'Plans d\'action', 'Audit', 'Conformité', 'Reporting', 'Serveur SMTP'],
    dateDebut: '2026-01-10',
    dateFin: '2027-01-09',
    statutLicence: 'Active',
    nombre_succursales_max: 8,
    nombre_succursales_actuel: 0,
    depassementQuotaMode: 'blocage',
    succursalesActives: true
  },
  {
    id: 'lic2',
    entrepriseId: 'tenant2',
    typeAbonnement: 'Mensuel',
    nombreUtilisateursMax: 10,
    nombreUtilisateursActuel: 2,
    modulesActives: ['Cartographie', 'Plans d\'action', 'Reporting'],
    dateDebut: '2026-06-15',
    dateFin: '2026-07-14',
    statutLicence: 'Active',
    nombre_succursales_max: 5,
    nombre_succursales_actuel: 0,
    depassementQuotaMode: 'inactif',
    succursalesActives: true
  },
  {
    id: 'lic3',
    entrepriseId: 'tenant3',
    typeAbonnement: 'Mensuel',
    nombreUtilisateursMax: 5,
    nombreUtilisateursActuel: 1,
    modulesActives: ['Cartographie', 'Plans d\'action', 'Audit'],
    dateDebut: '2026-06-01',
    dateFin: '2026-07-01',
    statutLicence: 'En période d\'essai',
    nombre_succursales_max: 3,
    nombre_succursales_actuel: 0,
    depassementQuotaMode: 'blocage',
    succursalesActives: false
  },
  {
    id: 'lic4',
    entrepriseId: 'tenant4',
    typeAbonnement: 'Annuel',
    nombreUtilisateursMax: 100,
    nombreUtilisateursActuel: 25,
    modulesActives: ['Cartographie', 'Plans d\'action', 'Audit', 'Conformité', 'Reporting'],
    dateDebut: '2025-11-20',
    dateFin: '2026-11-19',
    statutLicence: 'Suspendue',
    nombre_succursales_max: 10,
    nombre_succursales_actuel: 0,
    depassementQuotaMode: 'blocage',
    succursalesActives: true
  }
];

export const PRESET_HISTORIQUE_LICENCES: HistoriqueLicence[] = [
  {
    id: 'hist1',
    licenceId: 'lic1',
    typeChangement: 'Renouvellement',
    dateChangement: '2026-01-10',
    effectuePar: 'SuperAdmin Technique',
    details: 'Renouvellement annuel effectué de l\'abonnement standard.'
  },
  {
    id: 'hist2',
    licenceId: 'lic2',
    typeChangement: 'Ajout de module',
    dateChangement: '2026-06-18',
    effectuePar: 'SuperAdmin Commercial',
    details: 'Activation du module Plans d\'action demandé par le CRO local.'
  },
  {
    id: 'hist3',
    licenceId: 'lic4',
    typeChangement: 'Suspension',
    dateChangement: '2026-05-15',
    effectuePar: 'SuperAdmin Commercial',
    details: 'Compte suspendu temporairement pour cause de défaut de paiement récurrent.'
  }
];

export const PRESET_SESSIONS: SessionExercice[] = [
  {
    id: 'sess1',
    annee: 2025,
    dateDebut: '2025-01-01',
    dateFin: '2025-12-31',
    statut: 'Clôturée',
    dateCloture: '2025-12-28',
    bilanAnnuel: "Bilan d'exercice 2025 : Clôture effectuée avec 85% des actions de traitement de risques clôturées. Le niveau d'exposition globale aux risques a diminué de 12%."
  },
  {
    id: 'sess2',
    annee: 2026,
    dateDebut: '2026-01-01',
    dateFin: '2026-12-31',
    statut: 'Ouverte'
  }
];

