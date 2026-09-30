# Reconfirmation visuelle — 1ère maternelle, septembre 2026

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
Les approbations de **4 leçon(s)** de cette classe ont donc été annulées — pas
re-tamponnées — et ce document vous demande de confirmer que les nouvelles images servent
toujours ce que chaque leçon enseigne (ADR-048).

## La planche avant / après

![Avant / après : chaque image redessinée, aux trois tailles de l’application](media/september-rich-media-rollout-batch-8-comparison.png)

La planche montre chaque image aux trois tailles de l’application : 72 px (une rangée à
compter), 128 px (une carte de mot), 256 px (l’image d’une histoire).

## Les images que cette classe montre — 1

| Image            | Type         | Description avant                                      | Description après                                                          | Leçons de cette classe                             |
| ---------------- | ------------ | ------------------------------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------- |
| `histoire-pluie` | illustration | La pluie qui tombe d’un nuage sur le toit d’une maison | Tito ferme les yeux et écoute à l’abri pendant que la pluie frappe le toit | 4 — m1-lang-09, m1-lang-10, m1-lang-15, m1-lang-20 |

## Séquences des histoires

| Histoire         | Page(s) | Fichier                                             | SHA-256                                                                   | Description exacte de la scène                                                                       |
| ---------------- | ------- | --------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `histoire-pluie` | 1       | `public/media/illustrations/histoire-pluie-01.webp` | `sha256:d381c358708fb376e2596dd14056f7fa6a14a4abe15a9977a67e47e034740edf` | Tito regarde les premières gouttes depuis la porte ; le ciel est gris et le vent pousse les feuilles |
| `histoire-pluie` | 2       | `public/media/illustrations/histoire-pluie-02.webp` | `sha256:27cd0ce7754ec0f3d45c278f5fcdf6ab1d124f6b921f2ffbb26d9951d3bdd703` | Tito ferme les yeux et écoute à l’abri pendant que la pluie frappe le toit                           |
| `histoire-pluie` | 3       | `public/media/illustrations/histoire-pluie-03.webp` | `sha256:d10cc23fec5b294331e6f3b1bb7967989ba2447d39193202fc57a99a27c6508f` | Après la pluie, l’eau coule entre les cailloux et une goutte brillante reste au bout d’une feuille   |
| `histoire-pluie` | 4       | `public/media/illustrations/histoire-pluie-04.webp` | `sha256:e430c23a7c740cb0796ee18204ae78554f7e33e860319a8967ce5742a0ae5b3c` | Tito est sorti ; son doigt est sous la feuille et la goutte tombe vers sa main ouverte               |

L’empreinte d’approbation ne se limite pas au hash principal affiché dans le tableau des
activités : `assetFingerprint` inclut la description et le SHA-256 de **chaque cadre**, puis
la table `pageFrames`. `lessonDigest` reçoit cette empreinte complète pour toute leçon qui
utilise l’image ; modifier n’importe quel cadre annule donc l’approbation.

## Texte approuvé et image montrée, page par page

Ces extraits sont les mots canoniques réellement affichés dans l’application. Ils permettent
de juger chaque scène sans devoir consulter un autre fichier. Une histoire avance par groupes
de 3 lignes ; une comptine tient sur une seule page.

### `histoire-pluie` — La pluie tombe

- **Page 1 — image :** `public/media/illustrations/histoire-pluie-02.webp`
  - Description accessible : Tito ferme les yeux et écoute à l’abri pendant que la pluie frappe le toit
  - Texte affiché :
    > La pluie tombe sur le toit :
    > plic, plic, plic.
    > La pluie tombe sur ma main :
    > ploc, ploc, ploc.
    > Et puis plus rien. Le soleil revient.

### `histoire-pluie` — La pluie sur le toit

- **Page 1 — image :** `public/media/illustrations/histoire-pluie-01.webp`
  - Description accessible : Tito regarde les premières gouttes depuis la porte ; le ciel est gris et le vent pousse les feuilles
  - Texte affiché :
    > D’abord, le ciel devient gris. Puis le vent pousse les feuilles.
    > Tito regarde par la porte. « Ça va tomber », dit-il.
    > Et ça tombe. Toc. Toc. Toc.

- **Page 2 — image :** `public/media/illustrations/histoire-pluie-02.webp`
  - Description accessible : Tito ferme les yeux et écoute à l’abri pendant que la pluie frappe le toit
  - Texte affiché :
    > La pluie frappe sur le toit : toc, toc, toc, toc, toc.
    > Puis elle frappe plus vite : toctoctoctoctoc.
    > Tito ferme les yeux et il écoute. La pluie fait de la musique sur le toit.

- **Page 3 — image :** `public/media/illustrations/histoire-pluie-03.webp`
  - Description accessible : Après la pluie, l’eau coule entre les cailloux et une goutte brillante reste au bout d’une feuille
  - Texte affiché :
    > Dehors, l’eau court par terre. Elle fait des petites rivières entre les cailloux.
    > Et puis, tout doucement, la pluie s’arrête. Toc… toc… …
    > Il reste une goutte sur une feuille. Elle brille comme une perle.

- **Page 4 — image :** `public/media/illustrations/histoire-pluie-04.webp`
  - Description accessible : Tito est sorti ; son doigt est sous la feuille et la goutte tombe vers sa main ouverte
  - Texte affiché :
    > Tito sort, il met un doigt dessous, et la goutte tombe dans sa main.

## Résumé

| Mesure                                        | Valeur                          |
| --------------------------------------------- | ------------------------------- |
| Leçons de la classe                           | 88                              |
| Leçons concernées (approbation annulée)       | 4                               |
| Leçons non concernées                         | 84                              |
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

| Jour | Leçon                           | Activité                       | Image            | Rôle                            | Empreinte avant | Empreinte après | Description avant                                      | Description après                                                          | Texte enfant | Texte adulte | Objectif / progression |
| ---- | ------------------------------- | ------------------------------ | ---------------- | ------------------------------- | --------------- | --------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- | ------------ | ------------ | ---------------------- |
| 9    | `m1-lang-09` L’histoire de Tika | `m1-lang-09-a3` La pluie tombe | `histoire-pluie` | principale — montrée à l’enfant | `3c1c57d6cc05`  | `27cd0ce7754e`  | La pluie qui tombe d’un nuage sur le toit d’une maison | Tito ferme les yeux et écoute à l’abri pendant que la pluie frappe le toit | inchangé     | inchangé     | inchangés              |

### Semaine 3 — 1 leçon(s)

| Jour | Leçon                            | Activité                       | Image            | Rôle                            | Empreinte avant | Empreinte après | Description avant                                      | Description après                                                          | Texte enfant | Texte adulte | Objectif / progression |
| ---- | -------------------------------- | ------------------------------ | ---------------- | ------------------------------- | --------------- | --------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- | ------------ | ------------ | ---------------------- |
| 10   | `m1-lang-10` J’écoute les bruits | `m1-lang-10-a3` La pluie tombe | `histoire-pluie` | principale — montrée à l’enfant | `3c1c57d6cc05`  | `27cd0ce7754e`  | La pluie qui tombe d’un nuage sur le toit d’une maison | Tito ferme les yeux et écoute à l’abri pendant que la pluie frappe le toit | inchangé     | inchangé     | inchangés              |

### Semaine 4 — 1 leçon(s)

| Jour | Leçon                                  | Activité                       | Image            | Rôle                            | Empreinte avant | Empreinte après | Description avant                                      | Description après                                                          | Texte enfant | Texte adulte | Objectif / progression |
| ---- | -------------------------------------- | ------------------------------ | ---------------- | ------------------------------- | --------------- | --------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- | ------------ | ------------ | ---------------------- |
| 15   | `m1-lang-15` Encore l’histoire du seau | `m1-lang-15-a3` La pluie tombe | `histoire-pluie` | principale — montrée à l’enfant | `3c1c57d6cc05`  | `27cd0ce7754e`  | La pluie qui tombe d’un nuage sur le toit d’une maison | Tito ferme les yeux et écoute à l’abri pendant que la pluie frappe le toit | inchangé     | inchangé     | inchangés              |

### Semaine 5 — 1 leçon(s)

| Jour | Leçon                 | Activité                       | Image            | Rôle                            | Empreinte avant | Empreinte après | Description avant                                      | Description après                                                          | Texte enfant | Texte adulte | Objectif / progression |
| ---- | --------------------- | ------------------------------ | ---------------- | ------------------------------- | --------------- | --------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- | ------------ | ------------ | ---------------------- |
| 20   | `m1-lang-20` Je trace | `m1-lang-20-a3` La pluie tombe | `histoire-pluie` | principale — montrée à l’enfant | `3c1c57d6cc05`  | `27cd0ce7754e`  | La pluie qui tombe d’un nuage sur le toit d’une maison | Tito ferme les yeux et écoute à l’abri pendant que la pluie frappe le toit | inchangé     | inchangé     | inchangés              |

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
décision et votre résumé ; puis `npx tsx scripts/approve-week.ts --level=maternelle-1 --week=<n>` recalcule chaque empreinte sur les images d’aujourd’hui — aucune empreinte
n’est reprise d’avant. Une image à corriger est redessinée dans `tools/media/build.ts`, la
planche est régénérée, et ce document aussi.
