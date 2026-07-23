# MODULE : SUPER ADMINISTRATION MULTI-LOCATAIRE (SuperAdminModule)

---

## 1. Description Générale
Le **Module de Super Administration Multi-Locataire** est l'interface souveraine de la plateforme, accessible uniquement aux Super-Admins de l'éditeur de logiciel (Sogesti GRC). Il permet de piloter le modèle SaaS : création de locataires (entreprises clientes), gestion des formules d'abonnements, facturation, supervision technique et contrôle des clés de licence.

---

## 2. Fonctionnement Détaillé

### 2.1 Provisionnement d'Entreprises Clientes (Tenants)
* **Création instantanée :** Ajout d'un nouveau locataire dans la base de données, avec initialisation automatique de son espace isolé et de ses données de référence par défaut.
* **Fiche Abonnement :** Liaison contractuelle entre l'entreprise cliente, sa formule d'abonnement (Standard, Premium, Enterprise) et le tarif récurrent associé.

### 2.2 Gestion des Licences d'Exploitation (Licencing)
Le Super-Admin génère et contrôle les licences qui régissent l'usage de l'application :
* **Clé de Licence unique :** Chaîne de caractères chiffrée ou scellée.
* **Contrôles Contractuels :** Définition de la date d'expiration de la licence, du nombre maximal d'utilisateurs autorisés et du nombre maximal de succursales ou d'entités organisationnelles autorisées.
* **Blocage Automatique :** En cas d'expiration de la licence ou de dépassement des limites, le système restreint l'accès ou l'écriture pour le locataire concerné.

### 2.3 Console de Supervision Multi-Tenant
Supervision de l'état de santé global du système SaaS :
* Tableau de bord consolidé du chiffre d'affaires mensuel récurrent (MRR).
* Nombre de locataires actifs, d'utilisateurs cumulés et de risques totaux hébergés sur la plateforme.

---

## 3. Rôle du Module
* **Modèle SaaS & Monétisation :** Assurer la gestion commerciale des clients de la plateforme de gestion des risques.
* **Sécurité & Cloisonnement (Multi-Tenancy) :** Garantir que les données de chaque entreprise cliente soient hermétiquement isolées et inaccessibles pour les autres locataires.
* **Contrôle Contractuel :** Veiller au respect des conditions de vente en limitant l'utilisation du logiciel aux termes prévus par la licence achetée.

---

## 4. Interactions avec les Autres Modules

* **App.tsx (Sélecteur de Locataire) :** Au démarrage de l'application, `App.tsx` interroge le référentiel des locataires et des licences gérés par le Super-Admin pour charger l'identité de l'entreprise cliente active, configurer son interface et valider sa clé de licence.
* **AdminModule (Limites) :** L'AdminModule interroge la licence active pour empêcher la création de nouveaux utilisateurs ou de nouvelles entités organisationnelles si le plafond prévu par l'abonnement est atteint.
* **Tous les Modules de Travail (Cloisonnement) :** Tous les modules (Dashboard, Mapping, Évaluation, Actions, Audit, Conformité) filtrent systématiquement leurs données par `tenantId` pour s'assurer qu'aucun mélange d'informations n'ait lieu entre les clients de la plateforme.
