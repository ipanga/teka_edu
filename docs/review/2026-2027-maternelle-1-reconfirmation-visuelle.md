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
Les approbations de **2 leçon(s)** de cette classe ont donc été annulées — pas
re-tamponnées — et ce document vous demande de confirmer que les nouvelles images servent
toujours ce que chaque leçon enseigne (ADR-048).

## La planche avant / après

![Avant / après : chaque image redessinée, aux trois tailles de l’application](media/september-rich-media-rollout-batch-3-comparison.png)

La planche montre chaque image aux trois tailles de l’application : 72 px (une rangée à
compter), 128 px (une carte de mot), 256 px (l’image d’une histoire).

## Les images que cette classe montre — 1

| Image           | Type         | Description avant                                          | Description après                                                                                           | Leçons de cette classe     |
| --------------- | ------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------- |
| `histoire-tika` | illustration | Un enfant qui s’étire dans son lit, le soleil à la fenêtre | Le matin, Tika boit dans une tasse devant son bol ; des cubes et un ballon attendent près de lui pour jouer | 2 — m1-lang-09, m1-lang-21 |

## Séquences des histoires

| Histoire        | Page(s) | Fichier                                            | Description exacte de la scène                                                                              |
| --------------- | ------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `histoire-tika` | 1       | `public/media/illustrations/histoire-tika-01.webp` | Le matin, Tika boit dans une tasse devant son bol ; des cubes et un ballon attendent près de lui pour jouer |
| `histoire-tika` | 2       | `public/media/illustrations/histoire-tika-02.webp` | Le soir, Tika dort paisiblement dans son lit, les yeux fermés                                               |

## Texte approuvé et image montrée, page par page

Ces extraits sont les mots canoniques réellement affichés dans l’application. Ils permettent
de juger chaque scène sans devoir consulter un autre fichier. Une histoire avance par groupes
de 3 lignes ; une comptine tient sur une seule page.

### `histoire-tika` — Tika se lève

- **Page 1 — image :** `public/media/illustrations/histoire-tika-01.webp`
  - Description accessible : Le matin, Tika boit dans une tasse devant son bol ; des cubes et un ballon attendent près de lui pour jouer
  - Texte affiché :
    > Le matin, Tika ouvre les yeux.
    > Tika se lève. Tika met un pied, puis l’autre pied.
    > Tika boit. Tika mange.

- **Page 2 — image :** `public/media/illustrations/histoire-tika-02.webp`
  - Description accessible : Le soir, Tika dort paisiblement dans son lit, les yeux fermés
  - Texte affiché :
    > Puis Tika joue, joue, joue.
    > Le soir, Tika est fatigué.
    > Tika ferme les yeux. Bonne nuit, Tika.

## Résumé

| Mesure                                        | Valeur                          |
| --------------------------------------------- | ------------------------------- |
| Leçons de la classe                           | 88                              |
| Leçons concernées (approbation annulée)       | 2                               |
| Leçons non concernées                         | 86                              |
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
du changement d’empreinte est la ligne « image » : ses octets ont changé, et l’empreinte d’une
approbation couvre les octets de chaque image montrée (ISSUE-026, ADR-048).

### Semaine 2 — 1 leçon(s)

| Jour | Leçon                           | Activité                     | Image           | Rôle                            | Empreinte avant | Empreinte après | Description avant                                          | Description après                                                                                           | Texte enfant | Texte adulte | Objectif / progression |
| ---- | ------------------------------- | ---------------------------- | --------------- | ------------------------------- | --------------- | --------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------ | ------------ | ---------------------- |
| 9    | `m1-lang-09` L’histoire de Tika | `m1-lang-09-a2` Tika se lève | `histoire-tika` | principale — montrée à l’enfant | `c011c87cf0b3`  | `b5df0ae7a105`  | Un enfant qui s’étire dans son lit, le soleil à la fenêtre | Le matin, Tika boit dans une tasse devant son bol ; des cubes et un ballon attendent près de lui pour jouer | inchangé     | inchangé     | inchangés              |

### Semaine 5 — 1 leçon(s)

| Jour | Leçon                    | Activité                     | Image           | Rôle                            | Empreinte avant | Empreinte après | Description avant                                          | Description après                                                                                           | Texte enfant | Texte adulte | Objectif / progression |
| ---- | ------------------------ | ---------------------------- | --------------- | ------------------------------- | --------------- | --------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------ | ------------ | ---------------------- |
| 21   | `m1-lang-21` Encore Tika | `m1-lang-21-a2` Tika se lève | `histoire-tika` | principale — montrée à l’enfant | `c011c87cf0b3`  | `b5df0ae7a105`  | Un enfant qui s’étire dans son lit, le soleil à la fenêtre | Le matin, Tika boit dans une tasse devant son bol ; des cubes et un ballon attendent près de lui pour jouer | inchangé     | inchangé     | inchangés              |

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
