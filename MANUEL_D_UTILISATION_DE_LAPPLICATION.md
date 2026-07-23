# Manuel d'Utilisation de l'Application Sogesti GRC

Bienvenue dans le manuel d'utilisation officiel de la plateforme Sogesti GRC. Ce document vous guide à travers l'Espace Démonstration Interactive, l'Espace SuperAdministrateur et l'Espace Client GRC.

---

## 🔑 1. Écran de Connexion & Redirection Automatique

L'application s'ouvre sur le Portail de Connexion Sécurisé :

1. **Saisie des Identifiants** : Renseignez votre adresse email et votre mot de passe (mot de passe initial usine : **`vito`**).
2. **Mécanisme de Redirection** :
   - **Compte SuperAdmin** (ex. `admin@plateforme.com`) : Redirection automatique vers la **Console d'Administration de la Plateforme**.
   - **Compte Client GRC** (ex. `alainpatricknkoumou@gmail.com`) : Redirection instantanée vers l'environnement GRC dédié de votre entreprise (ex. *Sogesti S.A.*).

---

## 🚀 2. Espace Démonstration Interactive (Cas Pratiques Pas-à-Pas)

Pour découvrir les fonctionnalités phares de la plateforme sans configuration préalable, cliquez sur **"Démonstration Interactive"** depuis le portail de connexion.

### Polyvalence des Modes de Déploiement :
1. **🌐 En Ligne (Cloud / SaaS Multi-Tenant)** : Solution hébergée accessible 24h/24 via navigateur web, avec étanchéité physique absolue (*Database-per-Tenant*) et gestion centralisée des souscriptions.
2. **🏢 Réseau d'Entreprise (On-Premise / Intranet Private Cloud)** : Déploiement souverain au sein du réseau d'entreprise, garantissant un contrôle total des flux sans fuite externe et l'intégration aux annuaires internes.
3. **💻 Usage Personnel & Local (Stand-Alone / Localhost)** : Exécution légère sur poste de travail individuel sans dépendance serveur, idéale pour les consultants, PME et audits déconnectés.

### Focus : Module Optionnel 'Serveur Gmail / SMTP Dédié d'Entreprise' :
- **Que fait ce module ?** : Permet à chaque entreprise cliente de configurer son propre canal d'expédition e-mail (Gmail d'entreprise avec mot de passe Google 16 lettres ou serveur SMTP interne). Il déclenche l'envoi d'**alertes automatiques instantanées** sur survenance de Risques Critiques ($\ge 15/25$), les notifications d'assignation de plans d'action et les convocations d'audits.
- **Pourquoi est-il capital de le choisir ?** :
  - **Souveraineté & Confidentialité Multi-Tenant** : Vos clés 16 lettres restent cloisonnées dans votre environnement propre.
  - **Identité de Domaine & Délivrabilité** : Expédition au nom de votre entreprise (`@votre-domaine.com`), évitant le filtrage en indésirables (SPAM).
  - **Réactivité d'Urgence** : Notification immédiate par e-mail sur les smartphones de la Direction et du Risk Manager en cas de crise.
  - **Traçabilité Auditable** : Journal d'audit immuable des e-mails expédiés pour la conformité ISO 27001 et RGPD.

### Les 4 Scénarios Métiers Prêts à l'Emploi :
1. **Scénario 1 : Administrateur de l'Entreprise Client** :
   - *Périmètre* : Configuration de la structure organisationnelle, attribution des rôles utilisateurs, ouverture et clôture officielle des sessions d'exercice annuel.
2. **Scénario 2 : Risk Manager de Sogesti S.A.** :
   - *Périmètre* : Évaluation de la cartographie des risques selon la formule IFACI ($F \times I \times M$), suivi de la matrice 4x4, plans de mitigation et comparatif par exercice fiscal.
3. **Scénario 3 : Analyste d'AeroTech (Terrain)** :
   - *Périmètre* : Signalement d'incidents de calibrage, mise à jour des actions de remédiation et application de la formule mitigée soustraite ($P \times I - M$) sur grille 5x5.
4. **Scénario 4 : Direction Générale & Auditeur Chef** :
   - *Périmètre* : Revue des constats d'audits internes, génération de la liasse de reporting réglementaire et validation de la clôture annuelle.

### Mode de Navigation dans la Démo :
- **Démarrer ce Scénario** : Charge l'environnement du scénario complet avec le profil et les données associées.
- **Lancer cette étape** : Vous emmène directement dans le module cible correspondant à une étape précise du cas pratique pas-à-pas.

---

## 💻 3. Guide de l'Espace SuperAdministrateur (Console Platform)

Accessible aux gestionnaires de la plateforme via la Console centrale :

- **📊 Tableau de Bord (KPIs & Alertes)** : Suivi global des entreprises clientes actives, des modules souscrits et modification du mot de passe SuperAdmin.
- **🔑 Comptes Accès Clients** : Création et attribution initiale des comptes utilisateurs pour les entreprises clientes avec mot de passe temporaire.
- **🏢 Clients & Licences (Gestion des Modules Souscrits)** : Gestion des contrats de souscription, prolongation des abonnements et activation/désactivation dynamique des options de licence (**Cartographie, Plans d'actions, Audit, Conformité, Reporting, Serveur SMTP**).
- **📝 Logs & Audits Système** : Consultation du journal d'audit immuable des accès et interventions d'administration.

---

## 🏢 4. Guide de l'Espace Client GRC

Navigation intuitive via le ruban d'applications supérieur :

### 📊 Tableau de Bord & Comparateur d'Exercices
- Visualisez les indicateurs clés (KRI, taux de couverture des risques, état des plans d'actions).
- Utilisez le sélecteur d'**Exercice Fiscal (ex: 2026 vs 2025)** pour comparer l'évolution annuelle des risques.

### 🗺️ Cartographie des Risques & Cotations
- Déclarez de nouveaux risques, attribuez un code unique (ex: `R-101`) et évaluez la probabilité et l'impact.
- Le moteur GRC calcule la criticité résiduelle en appliquant la méthodologie du client (IFACI ou Mitigée).
- **Avis E-mail d'Urgence Automatique** : La création ou modification d'un risque élevé (Score $\ge 15/25$) déclenche l'envoi immédiat d'une notification par e-mail aux responsables.

### 🔲 Matrice Risques (Heatmap)
- Explorez la représentation graphique en 4x4 ou 5x5. Cliquez sur les cases pour filtrer les risques positionnés.

### 📝 Plans d'Actions & Remédiation
- Suivez l'avancement des mesures correctives sur un tableau Kanban (du statut *À faire* à *Clôturé*).

### 🛡️ Audit Interne & Conformité
- Pilotez les missions d'audit, saisissez les constats (findings) et déclarez les incidents de conformité.

### ⚙️ Administration de l'Entreprise Client
- **👥 Gestion & Cycle de vie des Collaborateurs (Fiches Physiques)** :
  1. *Création & Rattachement* : Enregistrez un nouveau collaborateur physique avec son Nom Complet, Adresse Email et rattachez-le directement à n'importe quelle unité arborescente existante de l'organigramme de l'entreprise.
  2. *Suivi d'Activité (Activation/Suspension)* : Activez ou suspendez (mettez en statut Suspendu) un collaborateur d'un simple clic sur son badge de statut. Un collaborateur suspendu ne peut plus être assigné ou exécuter de tâches GRC.
  3. *Modification & Suppression* : Modifiez les coordonnées ou l'unité d'affectation à tout moment, ou supprimez définitivement la fiche si nécessaire (les administrateurs principaux d'origine sont protégés de la suppression accidentelle).
- **🎭 Gestionnaire de Profils de Droits & RBAC Matriciel** :
  1. *Déclaration de Profil* : Cliquez sur "Déclarer un Profil de Droits" pour définir une nouvelle grille d'habilitation (ex. Auditeur Externe, Correspondant RGPD).
  2. *Configuration de la Portée* : Ajustez la visibilité spatiale (Unité propre, Unité + sous-unités, Toutes les unités de l'entreprise, Unités spécifiques).
  3. *Matrice de Droits par Module* : Configurez de manière chirurgicale pour chacun des modules système (Tableau de Bord, Cartographie, Calcul, Plans d'action, Audits, Conformité, etc.) les droits individuels de **Lecture (L)**, **Écriture (É)**, **Modification (M)**, **Suppression (S)**, **Importation (I)** et **Exportation (X)**.
  4. *Visualisation Rapide* : Un tableau de bord synthétique en grille (L/É/M/S/I/X) affiche instantanément le profil d'accès global de chaque collaborateur pour une vérification de conformité en un coup d'œil.
- **Organisation & Entités** : Modélisez la structure (Filiales, Départements, Divisions).
- **Sessions & Exercices** : Créez une nouvelle session annuelle (ex: Exercice 2026) ou effectuez la **Clôture Officielle** avec rédaction du bilan annuel consolidé.
- **📧 Serveur SMTP / Gmail (Configuration & Tests)** :
  1. *Contrôle du Contrat de Licence* : Si le module n'est pas souscrit, un bouton permet de solliciter son déblocage auprès du SuperAdmin Commercial.
  2. *Saisie des Identifiants* : Saisissez l'hôte (`smtp.gmail.com`), le port (587 ou 465), votre compte Google d'entreprise et le **Mot de Passe d'Application à 16 lettres** généré sur Google Account.
  3. *Test de Connexion Réseau Réel* : Renseignez une adresse email et cliquez sur **🧪 Tester la Connexion SMTP** pour valider l'envoi et recevoir un e-mail de confirmation.
  4. *Journal d'Audit des E-mails* : Consultez l'historique en temps réel des messages expédiés avec horodatage et statuts.

---

## 🔑 5. Modification du Mot de Passe

- **Pour le SuperAdministrateur** : Depuis le Tableau de Bord SuperAdmin, section *Sécurité & Clé SuperAdmin*.
- **Pour un Utilisateur Client** : Cliquez sur votre photo de profil dans le coin supérieur droit &rarr; **🔑 Modifier mon mot de passe**.
