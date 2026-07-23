# Sogesti GRC - Plateforme Multi-Tenant & Suite Logicielle GRC

Sogesti GRC est une suite logicielle d'Entreprise de premier plan conçue pour la gestion des Risques, des Audits Internes, des Incidents et de la Conformité Réglementaire. Dotée d'une architecture multi-tenant robuste et étanche, elle garantit l'isolement absolu des données clients tout en offrant une expérience utilisateur fluide, guidée et hautement paramétrable.

---

## 🚀 Fonctionnalités Clés & Modules Métiers

- **Portail de Connexion & Redirection Dynamique** : Authentification centralisée orientant automatiquement les comptes SuperAdmin vers la console centrale et les comptes collaborateurs vers leur environnement d'entreprise dédié.
- **Espace Démonstration Interactive (Cas Pratiques Pas-à-Pas & Multi-Déploiement)** :
  - **Présentation de la Flexibilité de Déploiement** : Utilisation en ligne (Cloud SaaS Multi-Tenant), installation souveraine sur réseau d'entreprise (On-Premise / Intranet) ou usage personnel local (Stand-Alone / Desktop).
  - **Focus Module Optionnel 'Serveur Gmail / SMTP Dédié'** : Panel explicatif détaillé démontrant le rôle du serveur SMTP d'entreprise (alertes automatiques sur risques critiques $\ge 15/25$, traçabilité, branding et souveraineté) et l'importance capitale d'activer cette option dans le contrat de licence.
  - **Scénario 1 : Administrateur de l'Entreprise Client** (Gestion de la structure organisationnelle, des comptes utilisateurs, des habilitations et des sessions d'exercice annuel).
  - **Scénario 2 : Risk Manager de Sogesti S.A.** (Évaluation IFACI $F \times I \times M$, matrice 4x4, plans d'actions et filtres par exercice fiscal).
  - **Scénario 3 : Analyste d'AeroTech (Terrain)** (Formule mitigée soustraite $P \times I - M$, grille 5x5, déclaration d'incidents de calibrage).
  - **Scénario 4 : Direction Générale & Auditeur Chef** (Revue des constats d'audits, rapports de conformité consolidés, clôture officielle d'exercice).
- **Console SuperAdministrateur** :
  - Pilotage des contrats, licences et facturations clients avec gestion dynamique des modules souscrits (Cartographie, Plans d'action, Audit, Conformité, Reporting, **Serveur SMTP**).
  - Gestion des comptes d'accès clients et réinitialisation sécurisée des mots de passe.
  - Surveillance des sauvegardes d'urgence, journal d'audit global et simulation MFA double-facteur.
- **Espace Client GRC (Multi-Tenant)** :
  - **Tableau de Bord & Comparateur d'Exercices** : Pilotage KRI, taux de couverture des risques et filtre dynamique par Exercice Fiscal (2025, 2026, etc.).
  - **Cartographie des Risques & Cotation IFACI / Mitigée** : Identification, cotation brute et résiduelle avec déclenchement automatique d'alertes e-mails d'urgence sur création de Risques Critiques ($\ge 15/25$).
  - **Matrice des Risques (Heatmap)** : Grilles interactives 4x4 et 5x5 avec projection thermique brute/résiduelle.
  - **Plans d'Actions & Remédiation** : Tableau Kanban, assignation de responsables et suivi des échéances avec notifications e-mails.
  - **Audit Interne & Conformité** : Gestion des missions, constats d'audits, référentiels (ISO 27001, RGPD, COSO) et déclaration d'incidents.
  - **Serveur SMTP / Gmail Dédié (Administration)** : Interface de paramétrage du serveur d'envoi e-mail propre à l'entreprise (hôte, port, compte Google, mot de passe d'application 16 lettres, nom d'expéditeur, test de connexion réseau réel et journal d'audit des e-mails expédiés).
  - **Sessions & Exercices Annuels** : Création, gestion et clôture officielle des exercices fiscaux avec génération automatique du bilan consolidé.
  - **Rapports & Audit Trail** : Édition de liasses réglementaires et traçabilité immuable de chaque action.

---

## 🛠️ Stack Technique & Architecture

- **Frontend** : React 18+ orchestré avec Vite et typé en TypeScript strict.
- **Backend & Service d'Expédition E-mail** : Service Express Node.js avec **Nodemailer Multi-Tenant** pour l'isolement strict des configurations SMTP par entreprise (`/api/email/config/:tenantId`, `/api/email/test/:tenantId`, `/api/email/send/:tenantId`).
- **Styling & UX** : Tailwind CSS avec design moderne, palettes sombres et claires ajustées, composants haute densité.
- **Micro-Animations** : `motion` pour des transitions fluides et un guidage visuel élégant.
- **Déploiement Frontend & Backend** : Serveur full-stack unifié (Express + Vite) prêt pour hébergement containerisé (Cloud Run / Vercel Edge).
- **Base de Données** : Architecture "Database-per-Tenant" sur **Supabase (PostgreSQL)** garantissant l'étanchéité physique des données.

---

## 💻 Démarrage en Développement

1. Installez les dépendances du projet :
   ```bash
   npm install
   ```

2. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

3. Accédez à l'application dans votre navigateur : [http://localhost:3000](http://localhost:3000)

---

## 📁 Documentation Associée

Consultez les guides complémentaires pour approfondir chaque dimension de la plateforme :
- `SYNTHESE_ARCHITECTURE_FORMATION.md` : Structure organisationnelle, modèle hiérarchique et étanchéité multi-tenant.
- `CALCULS_DES_FORMULES_UTILISEES.md` : Équations mathématiques (IFACI & Mitigée) et règles de réduction des risques.
- `MANUEL_D_UTILISATION_DE_LAPPLICATION.md` : Guide utilisateur complet pour l'Espace Démonstration, la Console SuperAdmin et l'Espace Client.
