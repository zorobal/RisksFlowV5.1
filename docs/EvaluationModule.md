# MODULE : ÉVALUATION & MOTEUR DE COTATION (EvaluationModule)

---

## 1. Description Générale
Le **Module d'Évaluation & de Cotation** est l'organe algorithmique de l'application. C'est ici que sont saisis les critères quantitatifs et qualitatifs permettant de mesurer l'intensité de chaque risque opérationnel. Le module orchestre le calcul des indices bruts et résiduels en s'appuyant sur les barèmes de l'entreprise.

---

## 2. Fonctionnement Détaillé

### 2.1 Saisie des Critères de Cotation
L'utilisateur habilité évalue un risque sélectionné selon trois dimensions clés (conformes aux normes IFACI) :
1. **Fréquence / Probabilité (F) :** Probabilité de survenance du risque (échelle de 1 à N).
2. **Impact / Gravité (I) :** Conséquences financières, réputationnelles ou juridiques de l'événement (échelle de 1 à N).
3. **Efficacité des Dispositifs de Maîtrise (M) :** Qualité et maturité des contrôles mis en place pour atténuer le risque (échelle de 1 à N).

### 2.2 Calcul Automatique des Scores
Le moteur calcule instantanément deux scores critiques :
* **Score Brut (Exposition Initiale) :** 
  $$\text{Score Brut} = \text{Fréquence (F)} \times \text{Impact (I)}$$
  Il représente l'exposition de l'entreprise si aucune mesure de contrôle n'était mise en place.
* **Score Résiduel (Exposition Nette) :** 
  Le moteur applique la formule de cotation active (ex. modèle IFACI ou modèle de mitigation soustraite) :
  $$\text{Score Résiduel} = \text{Score Brut} \times \text{Coefficient de Maîtrise (M)}$$
  Il indique le niveau d'exposition restant à la charge de l'entreprise compte tenu de l'efficacité des barrières existantes.

### 2.3 Suivi Historique des Réévaluations
Toute validation d'une nouvelle cotation enregistre une ligne de d'historique inviolable (`history`) contenant :
* La date exacte de l'évaluation.
* L'identité et le rôle de l'évaluateur.
* Les valeurs numériques choisies.
* Le commentaire justificatif de la cotation.

---

## 3. Rôle du Module
* **Modélisation Quantitative :** Traduire des menaces qualitatives en indicateurs de gravité mesurables.
* **Mesure de l'Efficacité des Contrôles :** Démontrer de manière chiffrée l'apport des barrières de sécurité et des contrôles internes (réduction du score brut vers le score résiduel).
* **Piste d'Audit :** Assurer la traçabilité complète de l'évolution temporelle d'un risque à des fins d'audit de conformité.

---

## 4. Interactions avec les Autres Modules

* **RiskMappingModule (Référentiel) :** Le moteur s'applique directement sur les fiches issues de la cartographie pour y injecter les scores numériques calculés.
* **DashboardModule (Analyse) & MatrixModule (Visualisation) :** Transmet en temps réel les scores calculés pour ajuster le positionnement du risque dans les matrices de criticité et recalculer l'indice de risque moyen.
* **ActionsModule (Plans d'atténuation) :** L'avancement des plans d'action influence positivement le coefficient d'efficacité de maîtrise (M). Une action de remédiation clôturée avec succès permet de réévaluer "M" à la baisse, réduisant ainsi l'exposition résiduelle nette.
* **ConfigModule (Système) :** Le moteur extrait les échelles de cotation et la formule de calcul active (ex: IFACI) définis dans la configuration du locataire (tenant).
