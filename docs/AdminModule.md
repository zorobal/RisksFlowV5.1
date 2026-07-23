# MODULE : ADMINISTRATION DU COMPTE ENTREPRISE (AdminModule)

---

## 1. Description Générale
Le **Module d'Administration du Compte Entreprise** est réservé aux administrateurs locaux du locataire (tenant). C'est le centre de gestion des utilisateurs, des habilitations opérationnelles, des paramètres d'entreprise, du serveur de messagerie SMTP et des sessions d'exercices annuels.

---

## 2. Fonctionnement Détaillé

### 2.1 Fiche d'Identité de l'Entreprise & Logo (Max 2 Mo)
* **Informations Légales :** Raison sociale, adresse, téléphone, email de contact, ville et pays.
* **Uploader de Logo Haute Sécurité :** Zone de glisser-déposer de fichier d'image. Elle intègre une double validation automatique :
  * Validation du type mime (images uniquement).
  * Validation stricte de la taille du fichier (maximum 2 Mo) avec rejet et alerte en cas de dépassement.
  * Lecture locale instantanée via `FileReader` au format Base64 pour persister l'image dans la configuration de l'entreprise.

### 2.2 Gestion des Comptes & Profils d'Habilitations
L'administrateur gère les fiches des collaborateurs de l'entreprise :
* **Création / Désactivation :** Ajout de comptes et blocage temporaire d'accès.
* **Attribution des Rôles GRC :** Choix des privilèges d'accès (Administrateur, Risk Manager, Auditeur, Compliance Officer, Validateur, Lecteur simple).
* **Portée d'Habilitation d'Unité :** Définition du périmètre de données auquel l'utilisateur a droit (Unité propre uniquement, Unité et sous-unités, Toutes unités).

### 2.3 Configuration SMTP pour Relances par Mail
L'administrateur peut connecter le serveur de messagerie de son choix (SMTP Host, Port, Sécurité SSL/TLS, Authentification) pour automatiser l'envoi de mails de notifications de validation ou de relances de plans d'action en retard.

### 2.4 Sessions d'Exercice GRC
Permet de piloter le lancement et la clôture des campagnes annuelles ou trimestrielles de réévaluation des risques (ex. Exercice 2026).

---

## 3. Rôle du Module
* **Sécurité & Contrôle d'Accès :** Assurer qu'aucun utilisateur non autorisé ne puisse accéder aux données sensibles de l'entreprise, et cloisonner les informations selon les fonctions de chacun.
* **Personnalisation de Marque :** Injecter le logo de l'entreprise et ses coordonnées dans le système pour personnaliser l'application et les rapports d'audits officiels destinés à la Direction Générale et aux investisseurs.
* **Gouvernance de Campagne :** Initier les périodes d'évaluation pour coordonner l'action des Risk Managers de l'entreprise.

---

## 4. Interactions avec les Autres Modules

* **OdooNavbar & App.tsx (Habilitations de Navigation) :** L'OdooNavbar interroge les habilitations de l'utilisateur actif définies dans ce module pour afficher ou masquer dynamiquement les onglets applicatifs (ex. masquer l'onglet "Administration" aux simples utilisateurs).
* **DashboardModule & MatrixModule (Données Légales & Logos) :** Fournit le nom légal de l'entreprise et l'image Base64 du logo pour les insérer automatiquement dans les en-têtes d'applications et les exports imprimés en format paysage.
* **ActionsModule & RiskMappingModule (Relances & Alertes) :** Utilise la configuration SMTP paramétrée dans l'administration pour acheminer les emails de relances pour les tâches approchant de l'échéance.
