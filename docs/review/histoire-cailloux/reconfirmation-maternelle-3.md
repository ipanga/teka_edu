# Reconfirmation visuelle — 3ème maternelle, septembre 2026

`SEPTEMBER_RICH_MEDIA_BATCH_FROZEN_FOR_REVIEW` — les images de ce lot sont figées ;
leurs fichiers, dimensions et empreintes exactes sont consignés dans
`docs/september-rich-media-audit.json` jusqu’à la décision du propriétaire.

> **Ce document est généré** (`npm run review:visual`). Il ne demande pas une relecture
> complète : les mots lus à l’enfant et à l’adulte, les objectifs, les durées et le matériel
> sont **identiques, octet pour octet**, à la version que vous aviez acceptée — le script qui
> écrit ce document le vérifie avant d’écrire, et refuse d’écrire si ce n’est pas vrai. Seules
> **les images** ont changé.

## Ce qui s’est passé

1 image(s) de septembre ont été remplacées localement par des illustrations
WebP plus chaleureuses, expressives et proches d’un album préscolaire. Une histoire peut utiliser
une courte séquence alignée sur ses pages existantes. Aucun texte n’a été réécrit ; les personnages,
objets, quantités, actions et décors doivent être jugés contre le texte approuvé.
Les 50 autres images, dont toutes les formes géométriques, n’ont pas bougé.

L’empreinte d’une approbation couvre les octets de chaque image montrée à l’enfant (ISSUE-026).
Les approbations de **3 leçon(s)** de cette classe ont donc été annulées — pas
re-tamponnées — et ce document vous demande de confirmer que les nouvelles images servent
toujours ce que chaque leçon enseigne (ADR-048).

## La planche avant / après

![Avant / après : chaque image redessinée, aux trois tailles de l’application](media/september-rich-media-rollout-batch-9-comparison.png)

La planche montre chaque image aux trois tailles de l’application : 72 px (une rangée à
compter), 128 px (une carte de mot), 256 px (l’image d’une histoire).

## Les images que cette classe montre — 1

| Image               | Type         | Description avant                                         | Description après                                                              | Leçons de cette classe                 |
| ------------------- | ------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------- |
| `histoire-cailloux` | illustration | Trois cailloux différents : un rond, un plat et un pointu | Tito regarde les trois cailloux dans sa poche : un rond, un plat et un pointu. | 3 — m3-lang-08, m3-lang-14, m3-lang-18 |

## Séquences des histoires

| Histoire            | Page(s) | Fichier                                                | SHA-256                                                                   | Description exacte de la scène                                                                                                                      |
| ------------------- | ------- | ------------------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `histoire-cailloux` | 1       | `public/media/illustrations/histoire-cailloux-01.webp` | `sha256:71061965c6d18961065baf6b1fba1ec11f21991552f3d0d720fdd73be12b2905` | Tito regarde les trois cailloux dans sa poche : un rond, un plat et un pointu.                                                                      |
| `histoire-cailloux` | 2       | `public/media/illustrations/histoire-cailloux-02.webp` | `sha256:6a84c8e998deb63e1d1b921fe369e1a596d0e8dba678e60c56461a0a6aff2621` | Deux cailloux restent sur la table, le rond et le plat. La grande sœur de Tito cache le pointu derrière son dos.                                    |
| `histoire-cailloux` | 3       | `public/media/illustrations/histoire-cailloux-03.webp` | `sha256:afa77e4ef630e065c49859a321f51d52e74c74809132dfa75b14df169e73ee45` | Tito compte les deux cailloux sur la table et montre le plat. Le rond est là aussi ; le pointu reste caché derrière le dos de sa sœur.              |
| `histoire-cailloux` | 4       | `public/media/illustrations/histoire-cailloux-04.webp` | `sha256:d47b00e2ced5dd7bf13023bc9afb024ef415cfdf0c35361aec30ff866bcdb238` | La sœur de Tito ouvre sa main après avoir remis le caillou pointu. Les trois cailloux, le rond, le plat et le pointu, sont de nouveau sur la table. |

L’empreinte d’approbation ne se limite pas au hash principal affiché dans le tableau des
activités : `assetFingerprint` inclut la description et le SHA-256 de **chaque cadre**, puis
la table `pageFrames`. `lessonDigest` reçoit cette empreinte complète pour toute leçon qui
utilise l’image ; modifier n’importe quel cadre annule donc l’approbation.

## Texte approuvé et image montrée, page par page

Ces extraits sont les mots canoniques réellement affichés dans l’application. Ils permettent
de juger chaque scène sans devoir consulter un autre fichier. Une histoire avance par groupes
de 3 lignes ; une comptine tient sur une seule page.

### `histoire-cailloux` — Les trois cailloux de Tito

- **Page 1 — image :** `public/media/illustrations/histoire-cailloux-01.webp`
  - Description accessible : Tito regarde les trois cailloux dans sa poche : un rond, un plat et un pointu.
  - Texte affiché :
    > Tito ramasse un caillou rond. Il le met dans sa poche.
    > Il ramasse un caillou plat. Il le met dans sa poche.
    > Il ramasse un caillou pointu. Il le met dans sa poche. Ça fait trois.

- **Page 2 — image :** `public/media/illustrations/histoire-cailloux-02.webp`
  - Description accessible : Deux cailloux restent sur la table, le rond et le plat. La grande sœur de Tito cache le pointu derrière son dos.
  - Texte affiché :
    > À la maison, il pose ses trois cailloux sur la table : le rond, le plat, le pointu.
    > Sa grande sœur en prend un et le cache derrière son dos.
    > « Il en reste combien ? » demande-t-elle.

- **Page 3 — image :** `public/media/illustrations/histoire-cailloux-03.webp`
  - Description accessible : Tito compte les deux cailloux sur la table et montre le plat. Le rond est là aussi ; le pointu reste caché derrière le dos de sa sœur.
  - Texte affiché :
    > Tito compte : un, deux. « Deux ! »
    > « Et qu’est-ce qui manque ? »
    > Tito regarde bien. Le rond est là. Le plat est là. « Le pointu ! »

- **Page 4 — image :** `public/media/illustrations/histoire-cailloux-04.webp`
  - Description accessible : La sœur de Tito ouvre sa main après avoir remis le caillou pointu. Les trois cailloux, le rond, le plat et le pointu, sont de nouveau sur la table.
  - Texte affiché :
    > Sa sœur ouvre la main : c’est bien le caillou pointu.
    > Il y avait trois cailloux. Sa sœur en cache un : il en reste deux. Quand elle le remet, les trois sont de nouveau là.

## Résumé

| Mesure                                        | Valeur                          |
| --------------------------------------------- | ------------------------------- |
| Leçons de la classe                           | 88                              |
| Leçons concernées (approbation annulée)       | 3                               |
| Leçons non concernées                         | 85                              |
| Images modifiées (toutes classes)             | 1                               |
| Images inchangées (toutes classes)            | 50                              |
| Texte pédagogique modifié (enfant ou adulte)  | **0** — vérifié champ par champ |
| Objectifs modifiés                            | **0** — vérifié                 |
| Progression, programme, calendrier modifiés   | **0** — vérifié                 |
| Associations image / activité corrigées       | 0                               |
| Seuls les images, leur description ont changé | **oui**                         |

## Chaque activité concernée, semaine par semaine

Pour chaque ligne : aucun texte lu à l’enfant, aucun texte lu à l’adulte, aucun objectif et
aucune progression n’a changé (vérifié avant l’écriture de ce document). **La seule raison**
du changement d’empreinte est la présentation visuelle : les octets des images, leurs descriptions
accessibles et, pour une séquence, sa table page-cadre participent à l’empreinte couverte par
l’approbation (ISSUE-026, ADR-048).
Pour une séquence, les colonnes « empreinte » ci-dessous abrègent le hash du cadre principal ;
la section « Séquences des histoires » donne tous les SHA-256 et explique l’empreinte complète.

### Semaine 2 — 1 leçon(s)

| Jour | Leçon                        | Activité                            | Image               | Rôle                            | Empreinte avant | Empreinte après | Description avant                                         | Description après                                                              | Texte enfant | Texte adulte | Objectif / progression |
| ---- | ---------------------------- | ----------------------------------- | ------------------- | ------------------------------- | --------------- | --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------ | ------------ | ---------------------- |
| 8    | `m3-lang-08` Qui fait quoi ? | `m3-lang-08-a3` Le temps de lecture | `histoire-cailloux` | principale — montrée à l’enfant | `df6458f051a0`  | `71061965c6d1`  | Trois cailloux différents : un rond, un plat et un pointu | Tito regarde les trois cailloux dans sa poche : un rond, un plat et un pointu. | inchangé     | inchangé     | inchangés              |

### Semaine 3 — 1 leçon(s)

| Jour | Leçon                             | Activité                            | Image               | Rôle                            | Empreinte avant | Empreinte après | Description avant                                         | Description après                                                              | Texte enfant | Texte adulte | Objectif / progression |
| ---- | --------------------------------- | ----------------------------------- | ------------------- | ------------------------------- | --------------- | --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------ | ------------ | ---------------------- |
| 14   | `m3-lang-14` Je tape les syllabes | `m3-lang-14-a3` Le temps de lecture | `histoire-cailloux` | principale — montrée à l’enfant | `df6458f051a0`  | `71061965c6d1`  | Trois cailloux différents : un rond, un plat et un pointu | Tito regarde les trois cailloux dans sa poche : un rond, un plat et un pointu. | inchangé     | inchangé     | inchangés              |

### Semaine 4 — 1 leçon(s)

| Jour | Leçon                                | Activité                            | Image               | Rôle                            | Empreinte avant | Empreinte après | Description avant                                         | Description après                                                              | Texte enfant | Texte adulte | Objectif / progression |
| ---- | ------------------------------------ | ----------------------------------- | ------------------- | ------------------------------- | --------------- | --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------ | ------------ | ---------------------- |
| 18   | `m3-lang-18` Je raconte dans l’ordre | `m3-lang-18-a3` Le temps de lecture | `histoire-cailloux` | principale — montrée à l’enfant | `df6458f051a0`  | `71061965c6d1`  | Trois cailloux différents : un rond, un plat et un pointu | Tito regarde les trois cailloux dans sa poche : un rond, un plat et un pointu. | inchangé     | inchangé     | inchangés              |

## Ce que l’on vous demande

Pour chaque image de la planche, et en pensant à l’enfant qui la regarde pendant l’activité :

1. l’image montre-t-elle bien **la chose, le geste ou la scène que la leçon nomme**, sans détail
   contradictoire ou distrayant ?
2. est-elle **lisible à 72 px** quand elle est répétée dans une rangée à compter ?
3. la description (`alt`, lue par une synthèse vocale à une famille francophone) dit-elle ce
   que l’image montre ?
4. voyez-vous une image qui **contredit** ce qu’une leçon dit — geste, quantité, personnage,
   objet, émotion, lieu ou ordre temporel ?
5. dans chaque histoire, l’identité, l’âge, la peau et les vêtements des personnages restent-ils
   cohérents, et chaque scène correspond-elle vraiment aux lignes de sa page ?

Répondez **`accepted`** (les images conviennent), ou **`accepted-with-modifications`** en
nommant l’image et ce qui doit changer.

## Comment le résultat est enregistré

Une entrée `full-review` par semaine dans `content/reviews/history.json`, avec la date, la
décision et votre résumé ; puis `npx tsx scripts/approve-week.ts --level=maternelle-3 --week=<n>` recalcule chaque empreinte sur les images d’aujourd’hui — aucune empreinte
n’est reprise d’avant. Une image à corriger est redessinée dans `tools/media/build.ts`, la
planche est régénérée, et ce document aussi.
