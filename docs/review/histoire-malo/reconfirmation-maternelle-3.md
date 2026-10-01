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

![Avant / après : chaque image redessinée, aux trois tailles de l’application](media/september-rich-media-rollout-batch-10-comparison.png)

La planche montre chaque image aux trois tailles de l’application : 72 px (une rangée à
compter), 128 px (une carte de mot), 256 px (l’image d’une histoire).

## Les images que cette classe montre — 1

| Image           | Type         | Description avant                                                                               | Description après                                                                                                                                          | Leçons de cette classe                 |
| --------------- | ------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `histoire-malo` | illustration | Malo, un petit chien couché en rond sur son tapis, les yeux fermés, sous la lune et les étoiles | Au coucher du soleil, Malo, petit chien doré aux oreilles brunes, regarde le coq perché sur une branche basse. Ses yeux sont encore ouverts mais fatigués. | 3 — m3-lang-07, m3-lang-16, m3-lang-20 |

## Séquences des histoires

| Histoire        | Page(s) | Fichier                                            | SHA-256                                                                   | Description exacte de la scène                                                                                                                             |
| --------------- | ------- | -------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `histoire-malo` | 1       | `public/media/illustrations/histoire-malo-01.webp` | `sha256:d63aad056d6b5e81693c5806b136909f921d48fd47fa4b80e6647efe3d8cb27d` | Au coucher du soleil, Malo, petit chien doré aux oreilles brunes, regarde le coq perché sur une branche basse. Ses yeux sont encore ouverts mais fatigués. |
| `histoire-malo` | 2       | `public/media/illustrations/histoire-malo-02.webp` | `sha256:e1b22323bf7587364bfc739f647d1340c9df322863df25c6da35c92fdf63900a` | Le coq dort, la tête sous son aile. Après sa tentative sur la branche, Malo est au sol et regarde le poisson dans le seau.                                 |
| `histoire-malo` | 3       | `public/media/illustrations/histoire-malo-03.webp` | `sha256:f660ef33ab0a7a914beffa67e5b8de11e46021fffba1533b8b29af048adf3e20` | Malo met une seule patte dans l’eau du seau et réagit au froid. Le poisson garde son œil ouvert ; le tapis de Malo est visible dans la maison.             |
| `histoire-malo` | 4       | `public/media/illustrations/histoire-malo-04.webp` | `sha256:e863952424ae94b22f474b1a376c1493093920acc89401f35e2368d2a0f3d6bc` | Malo dort en rond sur son tapis, les yeux fermés et le nez posé sur le bout de sa queue. La lune et les étoiles brillent dehors.                           |

L’empreinte d’approbation ne se limite pas au hash principal affiché dans le tableau des
activités : `assetFingerprint` inclut la description et le SHA-256 de **chaque cadre**, puis
la table `pageFrames`. `lessonDigest` reçoit cette empreinte complète pour toute leçon qui
utilise l’image ; modifier n’importe quel cadre annule donc l’approbation.

## Texte approuvé et image montrée, page par page

Ces extraits sont les mots canoniques réellement affichés dans l’application. Ils permettent
de juger chaque scène sans devoir consulter un autre fichier. Une histoire avance par groupes
de 3 lignes ; une comptine tient sur une seule page.

### `histoire-malo` — Malo ne veut pas dormir

- **Page 1 — image :** `public/media/illustrations/histoire-malo-01.webp`
  - Description accessible : Au coucher du soleil, Malo, petit chien doré aux oreilles brunes, regarde le coq perché sur une branche basse. Ses yeux sont encore ouverts mais fatigués.
  - Texte affiché :
    > Le soir tombe. Malo, le petit chien, ne veut pas dormir.
    > « Je n’ai pas sommeil ! » dit Malo. Mais ses yeux, eux, ont sommeil.
    > Il va voir le coq. « Coq, comment tu fais pour dormir ? »

- **Page 2 — image :** `public/media/illustrations/histoire-malo-02.webp`
  - Description accessible : Le coq dort, la tête sous son aile. Après sa tentative sur la branche, Malo est au sol et regarde le poisson dans le seau.
  - Texte affiché :
    > « Moi, dit le coq, je monte sur ma branche et je mets ma tête sous mon aile. »
    > Malo essaie de monter sur la branche. Il tombe. Ça ne marche pas pour un chien.
    > Il va voir le poisson dans le seau. « Poisson, comment tu fais pour dormir ? »

- **Page 3 — image :** `public/media/illustrations/histoire-malo-03.webp`
  - Description accessible : Malo met une seule patte dans l’eau du seau et réagit au froid. Le poisson garde son œil ouvert ; le tapis de Malo est visible dans la maison.
  - Texte affiché :
    > « Moi, dit le poisson, je dors dans l’eau, les yeux ouverts. »
    > Malo met une patte dans l’eau. Elle est froide. Ça ne marche pas non plus.
    > Alors Malo rentre à la maison. Il tourne une fois, deux fois, trois fois.

- **Page 4 — image :** `public/media/illustrations/histoire-malo-04.webp`
  - Description accessible : Malo dort en rond sur son tapis, les yeux fermés et le nez posé sur le bout de sa queue. La lune et les étoiles brillent dehors.
  - Texte affiché :
    > Il se couche en rond, le nez sur la queue.
    > « Ah, dit Malo, moi, c’est comme ça que je dors. »
    > Et il dort.

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

| Jour | Leçon                              | Activité                            | Image           | Rôle                            | Empreinte avant | Empreinte après | Description avant                                                                               | Description après                                                                                                                                          | Texte enfant | Texte adulte | Objectif / progression |
| ---- | ---------------------------------- | ----------------------------------- | --------------- | ------------------------------- | --------------- | --------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------ | ---------------------- |
| 7    | `m3-lang-07` Les mots de la maison | `m3-lang-07-a3` Le temps de lecture | `histoire-malo` | principale — montrée à l’enfant | `1d24cfd5888c`  | `d63aad056d6b`  | Malo, un petit chien couché en rond sur son tapis, les yeux fermés, sous la lune et les étoiles | Au coucher du soleil, Malo, petit chien doré aux oreilles brunes, regarde le coq perché sur une branche basse. Ses yeux sont encore ouverts mais fatigués. | inchangé     | inchangé     | inchangés              |

### Semaine 4 — 1 leçon(s)

| Jour | Leçon                            | Activité                            | Image           | Rôle                            | Empreinte avant | Empreinte après | Description avant                                                                               | Description après                                                                                                                                          | Texte enfant | Texte adulte | Objectif / progression |
| ---- | -------------------------------- | ----------------------------------- | --------------- | ------------------------------- | --------------- | --------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------ | ---------------------- |
| 16   | `m3-lang-16` Les mots qui riment | `m3-lang-16-a3` Le temps de lecture | `histoire-malo` | principale — montrée à l’enfant | `1d24cfd5888c`  | `d63aad056d6b`  | Malo, un petit chien couché en rond sur son tapis, les yeux fermés, sous la lune et les étoiles | Au coucher du soleil, Malo, petit chien doré aux oreilles brunes, regarde le coq perché sur une branche basse. Ses yeux sont encore ouverts mais fatigués. | inchangé     | inchangé     | inchangés              |

### Semaine 5 — 1 leçon(s)

| Jour | Leçon                               | Activité                            | Image           | Rôle                            | Empreinte avant | Empreinte après | Description avant                                                                               | Description après                                                                                                                                          | Texte enfant | Texte adulte | Objectif / progression |
| ---- | ----------------------------------- | ----------------------------------- | --------------- | ------------------------------- | --------------- | --------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------ | ---------------------- |
| 20   | `m3-lang-20` Je présente mon dessin | `m3-lang-20-a3` Le temps de lecture | `histoire-malo` | principale — montrée à l’enfant | `1d24cfd5888c`  | `d63aad056d6b`  | Malo, un petit chien couché en rond sur son tapis, les yeux fermés, sous la lune et les étoiles | Au coucher du soleil, Malo, petit chien doré aux oreilles brunes, regarde le coq perché sur une branche basse. Ses yeux sont encore ouverts mais fatigués. | inchangé     | inchangé     | inchangés              |

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
