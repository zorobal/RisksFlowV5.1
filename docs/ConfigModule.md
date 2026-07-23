# MODULE : CONFIGURATION SYSTÈME & PARAMÉTRAGES (ConfigModule)

---

## 1. Description Générale
Le **Module de Configuration Système & Paramétrages** est le centre d'ingénierie GRC de l'application. Il permet de configurer le "cerveau" et les règles d'évaluation du logiciel. C'est ici que sont modifiés la taille des matrices, les libellés de cotation, les formules mathématiques et les seuils d'alerte critique.

---

## 2. Fonctionnement Détaillé

### 2.1 Moteur de Cotation Personnalisable (Scales)
Le module permet de paramétrer les dimensions d'évaluation :
* **Taille de la Matrice (3x3 à 10x10) :** Choix de la finesse d'évaluation.
* **Échelles Linéaires :** Personnalisation des libellés et des poids pour la Fréquence, l'Impact et la Maîtrise.
* **Formules d'Évaluation :** Sélection de la formule mathématique active (modèle d'exposition multiplication brute, modèle d'atténuation coefficientée, etc.).

### 2.2 Seuils de Criticité & Codes Couleur (Thresholds)
Le locataire définit ses propres grilles de tolérance au risque :
* **Plages de Scores :** Association d'un score minimum et d'un score maximum à un niveau de criticité.
* **Esthétique Graphique :** Choix des codes de couleur hexadécimaux et des textes d'alerte pour chaque seuil, se répercutant instantanément sur toutes les heatmaps et rapports du système.

### 2.3 Workflow Steps & Règles d'Habilitation
Définition des étapes requises pour valider un risque ou une action, et assignation des rôles validants associés à chaque jalon.

---

## 3. Rôle du Module
* **Flexibilité d'Adaptation :** Permettre à chaque entreprise d'adapter la plateforme GRC à son secteur d'activité, à sa méthodologie interne de gestion des risques et à sa culture de tolérance au risque.
* **Mise à l'Échelle :** Ajuster la complexité de l'outil à mesure que la maturité GRC de l'organisation grandit (ex. passer d'une matrice simple 4x4 à une matrice détaillée 5x5 ou 10x10).
* **Standardisation des Règles :** Garantir que tous les utilisateurs de l'entreprise s'appuient sur la même formule et les mêmes seuils lors de leurs saisies opérationnelles.

---

## 4. Interactions avec les Autres Modules

* **EvaluationModule (Moteur de calcul) :** Le moteur d'évaluation interroge directement la configuration pour extraire les échelles actives, les poids et la formule à exécuter.
* **MatrixModule (Heatmaps) :** Les heatmaps se dessinent dynamiquement en interrogeant la taille (Size) et les échelons de couleur définis dans ce module.
* **DashboardModule (Rapports décisionnels) :** Le Dashboard utilise les seuils configurés pour regrouper les risques par niveau de criticité et formater ses progress-bars et indicateurs visuels.
* **AdminModule (Données d'organisation) :** Les règles de workflow s'appuient sur l'organigramme (unités et fonctions) géré dans l'administration pour acheminer les demandes de validation vers les bonnes personnes.
