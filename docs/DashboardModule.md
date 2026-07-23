# MODULE : TABLEAU DE BORD DÉCISIONNEL GRC (DashboardModule)

---

## 1. Description Générale
Le **Module Tableau de Bord Décisionnel** est l'interface analytique de haut niveau conçue spécifiquement pour la **Direction Générale** et les **Décideurs Stratégiques**. Il consolide en temps réel toutes les données issues de la cartographie des risques, de l'évaluation, des plans d'action et des audits. Il offre une vision macro-économique et opérationnelle de l'état d'exposition de l'organisation.

---

## 2. Fonctionnement Détaillé

### 2.1 Consolidation et Filtrage Dynamique
Le tableau de bord permet de filtrer l'ensemble des indicateurs de manière interactive selon plusieurs axes :
* **Périmètre Organisationnel :** Possibilité de sélectionner une entité spécifique (Filiale, Département, Service, Site).
* **Mode de Consolidation (Hiérarchique vs. Matriciel) :**
  * **Mode Hiérarchique (Strict) :** Analyse les risques de l'entité sélectionnée et de sa descendance stricte (selon l'organigramme).
  * **Mode Matriciel (Transverse) :** Incorpore également les risques liés de manière transversale via les double-rattachements opérationnels (`rattachementsSecondaires`).
* **Filtres Temporels :** Analyse par Exercice (Année), et par sous-périodes (Mensuel, Trimestriel).
* **Filtre Thématique :** Tri par catégorie de risques.

### 2.2 Matrice Décisionnelle des Risques (Heatmap)
La matrice de risques s'adapte dynamiquement en fonction des filtres sélectionnés. Elle propose deux affichages :
1. **Matrice de Criticité Brute :** Croise la Fréquence (Probabilité) et l'Impact.
2. **Matrice de Criticité Résiduelle (Nette) :** Croise la Gravité Brute Équivalente et le Coefficient d'Efficacité des Contrôles (Maîtrise).
Chaque cellule indique le volume de risques actifs. Un clic sur une cellule filtre instantanément les risques correspondants pour une exploration ciblée.

### 2.3 Drill-down Multi-niveau & Piste d'Audit
En cliquant sur un risque dans la liste consolidée ou dans la cellule de la matrice, un panneau d'évaluation avancée s'ouvre :
* **Informations de Cotation :** Détail des composantes de la formule de calcul (Fréquence, Impact, Maîtrise, Brut, Résiduel).
* **Statut d'Initiation & Workflow :** Un stepper visuel montre l'évolution du cycle de vie du risque (Brouillon ➔ Identifié ➔ Évalué ➔ Validé ➔ Sous-contrôle).
* **Historique des Évaluations (Piste d'Audit) :** Liste chronologique certifiée de toutes les réévaluations, changements de statuts, auteurs et motifs associés.
* **Maîtrise Active :** Statut et taux d'avancement des plans d'action de remédiation rattachés à ce risque.

### 2.4 Exportation de Synthèse au format Markdown (.md)
Un bouton d'exportation compile l'ensemble des métriques, analyses temporelles comparatives, répartition thématique, détails des risques d'alerte rouge et recommandations opérationnelles dans un rapport formaté en Markdown (`.md`) téléchargeable pour les conseils d'administration.

---

## 3. Rôle du Module
* **Surveillance d'Exposition :** Alerter instantanément la Direction Générale en cas d'augmentation de l'indice de risque net ou d'apparition de risques en zone critique rouge.
* **Pilotage de l'Efficacité GRC :** Suivre le taux d'avancement global du plan de remédiation pour s'assurer que les barrières de maîtrise soient appliquées dans les temps.
* **Aide à la Décision :** Permettre l'arbitrage budgétaire et l'allocation des ressources sur les menaces prioritaires.

---

## 4. Interactions avec les Autres Modules

* **RiskMappingModule (Identification des risques) :** Le Dashboard consomme directement les risques créés et identifiés dans la cartographie globale pour mettre à jour ses indicateurs de volume et de répartition thématique.
* **EvaluationModule (Moteur de cotation) :** Le Dashboard récupère les scores bruts et résiduels recalculés par le moteur de cotation pour repositionner les risques sur la matrice dynamique et recalculer l'Exposition Net Moyenne.
* **ActionsModule (Plans de remédiation) :** Le Dashboard analyse les plans d'action rattachés à chaque risque pour calculer le Taux d'Avancement GRC et afficher le taux d'avancement individuel dans le panneau de drill-down.
* **ConfigModule (Seuils & Paramétrages) :** Le Dashboard s'appuie sur la taille de la matrice, les échelles de cotation (Fréquence, Impact, Maîtrise) et les couleurs de seuil définis dans la configuration pour formater ses graphiques et sa matrice.
* **AdminModule (Données d'identité) :** Le Dashboard utilise les paramètres de l'entreprise (nom, logo) pour personnaliser l'en-tête du tableau de bord et des rapports exportés.
