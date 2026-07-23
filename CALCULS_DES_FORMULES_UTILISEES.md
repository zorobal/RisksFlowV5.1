# Formules et Algorithmes de Calcul GRC

Ce document décrit en détail les équations mathématiques et logiques implémentées au sein de la plateforme Sogesti GRC pour évaluer et cartographier les risques d'entreprise.

---

## 1. Criticité Brute du Risque (Gross Risk Score)

La criticité brute évalue l'exposition intrinsèque d'un risque sans considérer l'effet réducteur des dispositifs de contrôle interne.

### Formule Générale :
$$\text{Criticité Brute} (C_B) = \text{Probabilité / Fréquence} (P) \times \text{Impact} (I)$$

- **Probabilité / Fréquence ($P$ ou $F$)** : Note entière de 1 à $N$ évaluant la récurrence de la menace.
- **Impact ($I$)** : Note entière de 1 à $N$ évaluant la sévérité financière, opérationnelle ou réputationnelle.
- **Taille de la Matrice ($N$)** : Égale à **4** (échelle 4x4) ou **5** (échelle 5x5) selon le paramétrage du Tenant.

### Bornes de Criticité Brute ($C_B$) :
- Matrice 4x4 : $C_B \in [1, 16]$
- Matrice 5x5 : $C_B \in [1, 25]$

---

## 2. Formule 1 : Évaluation Réglementaire IFACI (Sogesti S.A.)

La méthode IFACI (Institut Français des Auditeurs et Contrôleurs Internes) s'appuie sur une approche multiplicative modérée par l'indice de maîtrise des contrôles.

### Équations IFACI :
1. **Facteur de Maîtrise ($M$)** :
   $$M = 1 - \frac{\text{Taux de Contrôle } (\%)}{100}$$
   *(Un contrôle efficace à 80% donne un facteur de maîtrise $M = 0.20$)*.

2. **Criticité Résiduelle IFACI ($C_R$)** :
   $$C_R = \text{Fréquence} (F) \times \text{Impact} (I) \times M$$

### Exemple Numérique (Risque Cyber R-101 sur Grille 4x4) :
- Fréquence $F = 4$, Impact $I = 4 \implies C_B = 16$ (Risque Élevé - Rouge).
- Efficacité des contrôles mis en œuvre (MFA, Pare-feu) = $75\% \implies M = 0.25$.
- Criticité Résiduelle : $C_R = 4 \times 4 \times 0.25 = 4.0$ (Risque Faible - Vert).

---

## 3. Formule 2 : Évaluation Mitigée Soustraite (AeroTech)

Pour les secteurs industriels ou aéronautiques nécessitant un calcul additif direct de remédiation, Sogesti GRC propose la formule mitigée soustraite.

### Équation Mitigée :
$$C_R = \max \left( 1, (P \times I) - \text{Valeur de Mitigation} \right)$$

- **Valeur de Mitigation** : Score entier représentant la capacité d'absorption des contrôles et des plans d'actions correctives.
- **Garantie Plancher** : La criticité résiduelle ne peut pas être inférieure à 1.

### Exemple Numérique (Risque Calibrage R-202 sur Grille 5x5) :
- Probabilité $P = 5$, Impact $I = 4 \implies C_B = 20$ (Risque Élevé - Rouge).
- Mitigation apportée par l'étalonnage automatisé = $12$.
- Criticité Résiduelle : $C_R = \max(1, 20 - 12) = 8$ (Risque Modéré - Orange).

---

## 4. Projection des Coordonnées sur la Matrice (Heatmap)

Pour positionner graphiquement les risques sur la grille thermique 4x4 ou 5x5, l'algorithme calcule les coordonnées résiduelles ajustées ($P_{\text{net}}, I_{\text{net}}$) :

1. **Impact Résiduel Ajusté ($I_{\text{net}}$)** :
   $$I_{\text{net}} = \max \left( 1, \text{round} \left( I \times \left(1 - \frac{\text{Contrôle \%}}{100} \times F_{\text{impact}} \right) \right) \right)$$

2. **Probabilité Résiduelle Ajustée ($P_{\text{net}}$)** :
   $$P_{\text{net}} = \max \left( 1, \text{round} \left( P \times \left(1 - \frac{\text{Contrôle \%}}{100} \times F_{\text{freq}} \right) \right) \right)$$

---

## 5. Niveaux de Gravité et Plages de Criticité

Les risques sont automatiquement classifiés selon trois niveaux de sévérité :

### Pour une Matrice 4x4 :
- **🟢 Risque Faible (Vert)** : Score $C_B \text{ ou } C_R \in [1, 4]$
- **🟡 Risque Modéré (Orange)** : Score $C_B \text{ ou } C_R \in [5, 9]$
- **🔴 Risque Élevé (Rouge)** : Score $C_B \text{ ou } C_R \in [10, 16]$ *(Déclenche une alerte prioritaire et requiert un plan d'action d'urgence)*.

### Pour une Matrice 5x5 :
- **🟢 Risque Faible (Vert)** : Score $C_B \text{ ou } C_R \in [1, 6]$
- **🟡 Risque Modéré (Orange)** : Score $C_B \text{ ou } C_R \in [7, 14]$
- **🔴 Risque Élevé (Rouge)** : Score $C_B \text{ ou } C_R \in [15, 25]$ *(Déclenche une alerte prioritaire immédiate expédiée par e-mail au Risk Manager et requiert un plan d'action d'urgence)*.

---

## 6. Règles de Déclenchement des Notifications E-mails Automatiques

Lorsque le module **Serveur SMTP** est activé pour l'entreprise cliente, la plateforme exécute des règles d'expédition automatique :

1. **Alerte Risque Critique** : Expédition instantanée d'un avis d'urgence si Score de Criticité $\ge 15/25$ (ou $\ge 10/16$).
2. **Assignation de Plan d'Action** : Notification transmise au responsable nommé lors de l'attribution d'une tâche de mitigation.
3. **Missions d'Audit** : Envoi automatique des convocations et avis de mission d'audit interne.
4. **Clôture d'Exercice Fiscal** : Diffusion du bilan annuel consolidé lors de la clôture officielle par la Direction.
