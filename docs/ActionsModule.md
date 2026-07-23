# MODULE : PLANS DE REMÉDIATION & ACTIONS (ActionsModule)

---

## 1. Description Générale
Le **Module des Plans de Remédiation & Actions** est l'outil opérationnel de traitement des risques. C'est ici que sont définis, assignés, budgétisés et suivis tous les plans d'action correctifs (barrières de maîtrise additionnelles) visant à ramener les risques critiques dans la zone de tolérance acceptable.

---

## 2. Fonctionnement Détaillé

### 2.1 Fiche du Plan d'Action
Chaque plan de remédiation est documenté selon des paramètres rigoureux :
* **ID Unique & Liaison :** Identifiant s'insérant dans la base de données et liaison obligatoire avec un risque spécifique (`riskId`).
* **Responsable Opérationnel :** Attribution nominative d'un pilote responsable de l'exécution (Action Owner).
* **Échéancier :** Date d'échéance contractuelle (`dueDate`) pour la clôture de l'action.
* **Priorité GRC :** Classification de l'urgence de traitement (Basse, Moyenne, Haute, Critique).
* **Statut d'Avancement :** Progression en pourcentage (0% à 100%) et statut d'état (À planifier, En cours, Réalisé, Annulé).

### 2.2 Tableau Kanban et Registre des Actions
Le module propose une interface moderne pour simplifier le pilotage quotidien :
* **Vue Kanban :** Déplacement visuel des fiches d'action entre les colonnes de statuts.
* **Relances Automatisées :** Analyse des échéances pour identifier les actions en retard et alerter les responsables.

---

## 3. Rôle du Module
* **Traitement Opérationnel :** Fournir l'outil de gestion de tâches permettant de réduire concrètement l'exposition aux risques.
* **Responsabilisation :** Engager les directeurs opérationnels et contributeurs en leur confiant le pilotage d'actions d'atténuation datées.
* **Pilotage du Changement :** Mesurer le taux d'exécution des décisions du Comité de Direction en matière de maîtrise des risques.

---

## 4. Interactions avec les Autres Modules

* **RiskMappingModule (Référentiel) :** Les plans d'action se greffent directement sur les menaces identifiées de la cartographie pour former des binômes "Risque / Traitement".
* **EvaluationModule (Scores) :** La clôture d'un plan d'action (passage à 100% et statut "Réalisé") valide le renforcement du système de contrôle de l'entreprise. Cela justifie une amélioration du coefficient d'efficacité de maîtrise (M) lors de la prochaine réévaluation du risque, entraînant une diminution mécanique de la gravité résiduelle.
* **DashboardModule (Synthèse) :** Fournit les statistiques d'avancement des plans d'action pour calculer le KPI du Taux d'Avancement GRC et afficher la liste des remédiations actives dans le panneau de drill-down.
* **AuditModule (Vérification) :** Les auditeurs internes passent en revue le registre d'actions pour vérifier que les engagements de remédiation pris par les opérationnels ont bien été exécutés et validés.
