# MODULE : ANALYSE & MATRICES DE CRITICITÉ (MatrixModule)

---

## 1. Description Générale
Le **Module d'Analyse & Matrices de Criticité** est l'espace visuel d'aide à la décision. Il prend le registre brut des risques évalués et le projette sur des représentations graphiques bidimensionnelles (Heatmaps ou Matrices de Chaleur). Ce module permet de ségréguer instantanément les risques acceptables des risques inacceptables.

---

## 2. Fonctionnement Détaillé

### 2.1 Double Cartographie Visuelle
Le module propose deux types de projections graphiques distinctes :
1. **La Matrice Brute (Inhérente) :**
   * **Axe Y :** Fréquence / Probabilité.
   * **Axe X :** Impact de la menace.
   * **But :** Montrer le niveau de danger initial sans aucune barrière de contrôle.
2. **La Matrice Résiduelle (Nette) :**
   * **Axe Y :** Tranches de Gravité Brute.
   * **Axe X :** Niveau d'Efficacité des Contrôles (Maîtrise).
   * **But :** Montrer le niveau de danger réel après prise en compte des processus de contrôle interne.

### 2.2 Seuils de Criticité Personnalisables
Les cellules des matrices sont colorées dynamiquement selon des seuils de criticité définis par l'entreprise :
* **Zone Verte (Risque Mineur) :** Sous contrôle, ne nécessite pas d'action corrective immédiate.
* **Zone Jaune (Risque Modéré) :** À surveiller, nécessite la planification d'un plan d'action périodique.
* **Zone Rouge (Risque Critique) :** Alerte majeure, nécessite un plan de traitement immédiat validé en Comité de Direction.

### 2.3 Fonctionnalités d'Exportation Professionnelle
* **Export PDF / Impression d'Entreprise :** Formatage optimisé pour le format paysage avec en-tête d'entreprise, date de production, nom du locataire et logo d'entreprise.
* **Export Image PNG :** Permet d'extraire la matrice sous format d'image haute définition pour l'insérer facilement dans des présentations d'affaires.

---

## 3. Rôle du Module
* **Vulgarisation Visuelle :** Permettre aux équipes opérationnelles et aux décideurs d'appréhender d'un seul coup d'œil le profil de menaces de l'organisation.
* **Priorisation Opérationnelle :** Identifier visuellement les risques situés dans la "Zone Rouge" de la heatmap afin de mobiliser immédiatement les ressources sur leur traitement.
* **Communication de Gouvernance :** Produire des documents graphiques officiels, certifiés et chartés pour les rapports annuels d'audit.

---

## 4. Interactions avec les Autres Modules

* **EvaluationModule (Calculs) :** Le module de matrice dépend entièrement des scores numériques (F, I, M) calculés par le moteur d'évaluation pour placer précisément chaque risque dans la bonne cellule.
* **DashboardModule (Pilote) :** Le Dashboard intègre une version simplifiée et interactive de cette matrice décisionnelle pour offrir une expérience analytique compacte à la Direction.
* **AdminModule (En-tête) :** La matrice extrait le logo d'entreprise (Base64/URL) et le nom légal enregistrés dans les paramètres d'administration pour les inclure au sommet de chaque rapport exporté ou imprimé.
* **ConfigModule (Seuils) :** Extrait les palettes de couleurs, les plages de scores par palier et la taille globale de la matrice (4x4, 5x5, etc.) pour dessiner l'infrastructure graphique.
