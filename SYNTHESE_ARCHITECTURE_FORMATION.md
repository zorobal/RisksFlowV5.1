# Synthèse de l'Architecture & Structure GRC Multi-Tenant

Ce document détaille les fondements architecturaux, le modèle d'organisation d'entreprise, la gestion du cycle de vie des exercices annuels et les politiques d'habilitation de la plateforme Sogesti GRC.

---

## 1. Modèle d'Organisation Hiérarchique (Sogesti Org Model)

La plateforme supporte une structure d'entreprise arborescente et granulaire. Chaque client (Tenant) modélise son organisation selon la hiérarchie suivante :

```
[Entreprise Cliente / Tenant]
       │
       └──► [Unité de l'Organigramme] (Filiales, Directions, Départements, Services, Sites Locaux)
                 │
                 ├──► [Unité de Rattachement Secondaire] (Rapports fonctionnels/matriciels additionnels)
                 │
                 └──► [Collaborateur / Personne Physique] (Fiche physique avec cycle de vie Actif/Suspendu)
                           │
                           └──► [Fonction Administrative / Rôle] ◄──► [Profil de Droits RBAC]
```

### 🏢 L'Entreprise Cliente (Tenant)
- Représente l'entité juridique de haut niveau détenant le contrat de licence.
- Possède un identifiant de tenant unique (`tenantId`) garantissant son étanchéité logique et physique absolue.

### 📂 Les Unités de l'Organigramme
- L'arborescence supporte des niveaux illimités ou plafonnés contractuellement par le contrat de licence (Filiales, Directions, Départements, Services, Sites locaux).
- **Structure matricielle** : Un collaborateur ou une unité peut déclarer des **Rattachements Secondaires** pour refléter fidèlement les rapports fonctionnels transversaux.
- Chaque collaborateur créé par l'administrateur est rattaché à une unité au choix parmi l'organigramme arborescent de son entreprise cliente.

### 👥 Cycle de vie des Collaborateurs (Fiches Physiques)
- Les collaborateurs physiques font l'objet d'un suivi rigoureux et autonome dans l'onglet des nominations administratives.
- L'administrateur peut à tout moment : **Activer**, **Désactiver (Suspendre)**, **Modifier** et **Supprimer** les fiches de collaborateurs.
- Lors de l'affectation d'une personne physique à une fonction, le système filtre automatiquement pour n'afficher que les collaborateurs créés pour l'entreprise cliente courante (étanchéité multi-tenant).

---

## 2. Gestion du Cycle de Vie des Exercices Annuels (Sessions & Exercices)

Pour permettre une traçabilité pluriannuelle et des comparatifs d'exposition dans le temps, la plateforme gère les **Sessions d'Exercice Annuel** :

```
┌─────────────────────────────────────────────────────────────┐
│                   SESSION D'EXERCICE ANNUEL                 │
│   (ex: Exercice Fiscal 2026 - Du 01/01/2026 au 31/12/2026)  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
    [ Statut : Ouverte ]            [ Statut : Clôturée ]
   - Saisie des risques            - Verrouillage immuable
   - Évaluation IFACI / Mitigée    - Bilan annuel consolidé
   - Mises à jour des plans        - Consultation / Archivage
```

- **Sessions Ouvertes** : Permettent l'évaluation continue, la mise à jour des fiches de risques et la planification des actions de remédiation.
- **Clôture Officielle d'Exercice** : Effectuée par l'Administrateur de l'Entreprise ou la Direction Générale. La clôture génère un bilan annuel consolidé et verrouille l'historique de l'exercice.
- **Filtrage Pluriannuel** : Le Tableau de Bord et la Cartographie permettent de basculer instantanément d'un exercice à l'autre (ex: 2025 vs 2026) pour analyser l'évolution du profil de risque.

---

## 3. Étanchéité Multi-Tenant (Vercel, Express Backend & Supabase)

Sogesti GRC applique un modèle d'isolation strict à trois niveaux :

```
                  ┌──────────────────────┐
                  │   Navigateur Client  │
                  └──────────┬───────────┘
                             │ (https://tenant.sogesti-grc.com)
                             ▼
                ┌──────────────────────────┐
                │ Frontend Edge (Vercel)   │ (Routage dynamique par sous-domaine/tenant)
                └────────────┬─────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│ Supabase DB (Client A)│         │ Supabase DB (Client B)│ (Bases PostgreSQL physiques isolées)
│  - Risques Client A   │         │  - Risques Client B   │
│  - Utilisateurs A     │         │  - Utilisateurs B     │
└───────────────────────┘         └───────────────────────┘
            │                                 │
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│ Service SMTP Client A │         │ Service SMTP Client B │ (Serveurs Gmail / SMTP isolés par tenant)
│  - smtp.sogesti@...   │         │  - smtp.aerotech@...  │
│  - Logs emails A      │         │  - Logs emails B      │
└───────────────────────┘         └───────────────────────┘
```

1. **Isolation Frontend (Vercel Edge)** : Le middleware identifie le tenant via le sous-domaine ou le jeton de session.
2. **Database-per-Tenant (Supabase)** : Chaque client dispose d'une base PostgreSQL dédiée, éliminant tout risque de fuite inter-entreprises.
3. **Isolation des Serveurs SMTP & Identifiants d'Expédition (Express Backend)** : Le moteur Express gère un dictionnaire de configurations et de transports Nodemailer étanches par `tenantId` (`tenantSmtpConfigs[tenantId]`), garantissant que les mots de passe Google 16 lettres et le journal des e-mails expédiés sont cloisonnés.

---

## 4. Matrice des Rôles, Profils de Droits (RBAC) et Habilitations Modulaires

Sogesti GRC propose une gestion d'habilitations avancée et granulaire. Les droits ne sont plus figés par rôle global, mais définis au sein de **Profils de Droits (Habilitations)** configurables par l'Administrateur du Tenant de manière matricielle pour chaque module fonctionnel.

### ⚙️ Le CRUD des Profils de Droits (RBAC)
L'administrateur de l'entreprise cliente dispose d'un contrôle total (Création, Lecture, Modification, Suppression) sur ces profils d'accès. Pour chaque profil, les droits d'action suivants sont assignables pour chacun des modules du système :
- **Lecture** : Consultation des fiches et statistiques.
- **Écriture (Création)** : Ajout de nouveaux éléments (risques, incidents, plans).
- **Modification** : Altération d'un objet existant ou passage d'étape de workflow.
- **Suppression** : Retrait définitif d'un enregistrement du système.
- **Importation** : Intégration de données en masse via fichiers externes.
- **Exportation** : Génération et téléchargement de livrables (Matrices PNG, rapports PDF, extractions Excel).

### 📐 Portée des Profils
Pour s'ajuster aux organisations complexes, chaque profil dispose d'une portée d'unité ajustable :
1. **Unité propre** : Habilite l'utilisateur uniquement sur l'entité de l'organigramme à laquelle sa fonction administrative est rattachée.
2. **Unité + sous-unités** : Habilite l'utilisateur sur son entité et toutes ses entités descendantes.
3. **Toutes unités** : Habilite l'utilisateur à l'échelle de l'ensemble de l'entreprise cliente (Portée globale).
4. **Unités spécifiques** : Définition manuelle des mailles organisationnelles autorisées.

---

## 5. Scénarios de Démonstration Interactive

Le module de démonstration interactive propose 5 scénarios guidés avec cas pratiques pas-à-pas :

1. **Scénario 1 : Administrateur de l'Entreprise Client** (Habilitations, organisation, sessions et clôture d'exercice).
2. **Scénario 2 : Risk Manager de Sogesti S.A.** (Cotation IFACI 4x4 $F \times I \times M$, plans de mitigation, filtres d'exercice fiscal).
3. **Scénario 3 : Analyste d'AeroTech (Terrain)** (Formule mitigée soustraite $P \times I - M$ sur grille 5x5, incidents de calibrage).
4. **Scénario 4 : Direction Générale & Auditeur Chef** (Constats d'audits internes, liasse de reporting et approbation stratégique).
5. **Scénario 5 : SuperAdmin Commercial & Serveur Gmail SMTP Dédié** (Activation de l'option de licence SMTP, paramétrage du serveur d'envoi d'entreprise avec clé Google 16 lettres, test de connexion en direct et traçabilité des alertes).
