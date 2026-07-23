# Formules, Échelles et Algorithmes de Calcul GRC (Sogesti GRC Engine)

Ce document décrit en détail les équations mathématiques, les modes de cotation et les algorithmes logiques de calcul implémentés au sein de la plateforme Sogesti GRC pour évaluer et cartographier les risques d'entreprise.

---

## 1. Choix du Mode de Cotation de la Sévérité Brut

Sogesti GRC permet au Administrateurs Tenant de choisir la terminologie et la formule de cotation intrinsèque :

1. **Mode Fréquence × Impact ($F \times I$)** : Recommandé pour l'audit opérationnel et les contrôles récurrents.
2. **Mode Probabilité × Impact ($P \times I$)** : Standard COSO / ISO 31000 privilégié pour la gestion des risques stratégiques et projets.

### Formule Générale du Score Brut ($S_B$) :
$$S_B = \text{Dimension } 1 (F \text{ ou } P) \times \text{Dimension } 2 (I)$$

---

## 2. Dimensionnement Paramétrable de la Matrice (Heatmap Layout)

La dimension de la grille de criticité ($N \times N$) est entièrement paramétrable de $N = 3$ à $N = 10$ :

| Dimensions | Usage Principal | Score Brut Max ($N^2$) |
| :--- | :--- | :--- |
| **3 × 3** | Grille Simplifiée TPE / PME | **9** |
| **4 × 4** | Standard IFACI 2013 | **16** |
| **5 × 5** | Standard COSO / Aéronautique / ISO 31000 | **25** |
| **6 × 6** | Grille Avancée Granulaire | **36** |
| **7 × 7** | Grille Très Haute Résolution | **49** |
| **10 × 10**| Précision Décimale Avancée | **100** |

---

## 3. Algorithmes de Calcul du Score Net (Atténuation / Maîtrise)

Le moteur de calcul (`calculateRiskScores`) supporte 4 modèles algorithmiques de pondération du contrôle interne ($M$) :

### Modèle 1 : Standard Multiplicatif IFACI (`IFACI_MULTIPLICATIVE`)
$$\text{Score Net } (S_N) = \text{round}\left(S_B \times \frac{M}{N}\right)$$
*Exemple : Sur grille 5x5 ($N=5$), un risque $S_B = 20$ avec un contrôle de niveau $M = 2 \implies S_N = \text{round}(20 \times 0.4) = 8$.*

### Modèle 2 : Soustractif de Mitigation AeroTech (`AERO_SUBTRACTIVE`)
$$\text{Score Net } (S_N) = \max\left(1, S_B - M\right)$$
*Exemple : Un risque $S_B = 20$ déduit d'un indice de mitigation $M = 12 \implies S_N = \max(1, 20 - 12) = 8$.*

### Modèle 3 : Divisionnaire Proportionnel (`DIVISIONAL`)
$$\text{Score Net } (S_N) = \max\left(1, \text{round}\left(\frac{S_B}{M}\right)\right)$$
*Exemple : Un risque $S_B = 20$ divisé par la maturité $M = 4 \implies S_N = 5$.*

### Modèle 4 : Direct Sans Maîtrise (`DIRECT_BRUT`)
$$\text{Score Net } (S_N) = S_B$$

---

## 4. Consolidation Arborescente et Périmètres Hiérarchiques / Matriciels

La plateforme Sogesti GRC permet de structurer les entités selon une arborescence multi-niveaux personnalisée :

### Hiérarchisation des Types d'Unités (`UnitTypeConfig`) :
- **Niveau 1** : Groupe / Siège / Direction Générale (`GRP`)
- **Niveau 2** : Filiales / Succursales Référencées (`FIL`)
- **Niveau 3** : Directions Opérationnelles (`DIR`)
- **Niveau 4** : Départements / Divisions (`DEP` / `DIV`)
- **Niveau 5** : Services / Sections (`SRV`)
- **Niveau 6** : Sites / Bureaux Localisés (`SIT` / `BUR`)

### Algorithme de Traversée Récursive des Enfants (`getDescendantEntityIds`) :
Lors de la sélection d'une entité cliente (ex: une Direction), l'algorithme extrait récursivement l'ensemble des identifiants descendants. Ainsi, visualiser la cartographie d'une Direction inclut automatiquement les risques de tous ses départements, services et bureaux rattachés.

### Support du Double-Rattachement Matriciel :
En mode **Consolidation Matricielle**, le système agrège également les entités ayant un rattachement fonctionnel secondaire (`rattachementsSecondaires`), assurant une vision à 360° des risques transverses.

---

## 5. Règles de Déclenchement des Notifications E-mails Automatiques

Lorsque le module **Serveur SMTP** est activé, la plateforme exécute les règles suivantes :

1. **Alerte Risque Critique** : Expédition instantanée d'un avis d'urgence si Score de Criticité atteint la zone rouge.
2. **Assignation de Plan d'Action** : Notification transmise au responsable nommé lors de l'attribution d'une tâche de mitigation.
3. **Missions d'Audit** : Envoi automatique des convocations et avis de mission d'audit interne.
4. **Clôture d'Exercice Fiscal** : Diffusion du bilan annuel consolidé lors de la clôture officielle par la Direction.
