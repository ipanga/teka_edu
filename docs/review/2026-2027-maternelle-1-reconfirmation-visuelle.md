# Reconfirmation visuelle — 1ère maternelle, septembre 2026

`SEPTEMBER_RICH_MEDIA_PILOT_FROZEN_FOR_REVIEW` — les cinq images du pilote sont figées ;
leurs fichiers, dimensions et empreintes exactes sont consignés dans
`docs/september-rich-media-audit.json` jusqu’à la décision du propriétaire.

> **Ce document est généré** (`npm run review:visual`). Il ne demande pas une relecture
> complète : les mots lus à l’enfant et à l’adulte, les objectifs, les durées et le matériel
> sont **identiques, octet pour octet**, à la version que vous aviez acceptée — le script qui
> écrit ce document le vérifie avant d’écrire, et refuse d’écrire si ce n’est pas vrai. Seules
> **les images** ont changé.

## Ce qui s’est passé

Cinq images représentatives de septembre ont été remplacées localement par des illustrations
WebP plus chaleureuses, expressives et proches d’un album préscolaire. Deux histoires utilisent
désormais une courte séquence alignée sur leurs pages existantes. Aucun texte n’a été réécrit ;
les personnages, objets, quantités, actions et décors doivent être jugés contre le texte approuvé.
Les 46 autres images, dont toutes les formes géométriques, n’ont pas bougé.

L’empreinte d’une approbation couvre les octets de chaque image montrée à l’enfant (ISSUE-026).
Les approbations de **8 leçon(s)** de cette classe ont donc été annulées — pas
re-tamponnées — et ce document vous demande de confirmer que les nouvelles images servent
toujours ce que chaque leçon enseigne (ADR-048).

## La planche avant / après

![Avant / après : chaque image redessinée, aux trois tailles de l’application](media/september-rich-media-pilot-comparison.png)

La planche montre chaque image aux trois tailles de l’application : 72 px (une rangée à
compter), 128 px (une carte de mot), 256 px (l’image d’une histoire).

## Les images que cette classe montre — 2

| Image              | Type         | Description avant                                                         | Description après                                                                                         | Leçons de cette classe                                           |
| ------------------ | ------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `corps-tete`       | object       | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire        | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire                                        | 5 — m1-lang-13, m1-lang-18, m1-lang-22, m1-world-08, m1-world-20 |
| `comptine-bonjour` | illustration | Le soleil qui se lève derrière la colline, et deux mains qui font bonjour | Un enfant qui fait bonjour de la main et lève un pied, devant le soleil qui se lève derrière les collines | 4 — m1-lang-01, m1-lang-03, m1-lang-13, m1-lang-19               |

## Texte approuvé et image montrée, page par page

Ces extraits sont les mots canoniques réellement affichés dans l’application. Ils permettent
de juger chaque scène sans devoir consulter un autre fichier. Une histoire avance par groupes
de 3 lignes ; une comptine tient sur une seule page.

### `comptine-bonjour` — Bonjour, petit

- **Page 1 — image :** `public/media/illustrations/comptine-bonjour.webp`
  - Description accessible : Un enfant qui fait bonjour de la main et lève un pied, devant le soleil qui se lève derrière les collines
  - Texte affiché :
    > Bonjour, bonjour, petit bonjour.
    > Je dis bonjour à qui est là.
    > Bonjour la main, bonjour le pied,
    > bonjour, bonjour, et me voilà.

### `comptine-bonjour` — Bonjour, bonjour

- **Page 1 — image :** `public/media/illustrations/comptine-bonjour.webp`
  - Description accessible : Un enfant qui fait bonjour de la main et lève un pied, devant le soleil qui se lève derrière les collines
  - Texte affiché :
    > Bonjour, bonjour,
    > le soleil est levé.
    > Bonjour, bonjour,
    > la journée peut commencer.
    > Je dis bonjour à toi,
    > tu dis bonjour à moi,
    > et on se donne la main,
    > une fois, deux fois, trois !

## Résumé

| Mesure                                        | Valeur                          |
| --------------------------------------------- | ------------------------------- |
| Leçons de la classe                           | 88                              |
| Leçons concernées (approbation annulée)       | 8                               |
| Leçons non concernées                         | 80                              |
| Images modifiées (toutes classes)             | 5                               |
| Images inchangées (toutes classes)            | 46                              |
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

### Semaine 1 — 2 leçon(s)

| Jour | Leçon                            | Activité                       | Image              | Rôle                            | Empreinte avant | Empreinte après | Description avant                                                         | Description après                                                                                         | Texte enfant | Texte adulte | Objectif / progression |
| ---- | -------------------------------- | ------------------------------ | ------------------ | ------------------------------- | --------------- | --------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------ | ------------ | ---------------------- |
| 1    | `m1-lang-01` Bonjour, je suis là | `m1-lang-01-a3` Bonjour, petit | `comptine-bonjour` | principale — montrée à l’enfant | `01ec06b85bdc`  | `2d1ad0c5d999`  | Le soleil qui se lève derrière la colline, et deux mains qui font bonjour | Un enfant qui fait bonjour de la main et lève un pied, devant le soleil qui se lève derrière les collines | inchangé     | inchangé     | inchangés              |
| 3    | `m1-lang-03` L’histoire du seau  | `m1-lang-03-a3` Bonjour, petit | `comptine-bonjour` | principale — montrée à l’enfant | `01ec06b85bdc`  | `2d1ad0c5d999`  | Le soleil qui se lève derrière la colline, et deux mains qui font bonjour | Un enfant qui fait bonjour de la main et lève un pied, devant le soleil qui se lève derrière les collines | inchangé     | inchangé     | inchangés              |

### Semaine 2 — 1 leçon(s)

| Jour | Leçon                             | Activité                             | Image        | Rôle                            | Empreinte avant | Empreinte après | Description avant                                                  | Description après                                                  | Texte enfant | Texte adulte | Objectif / progression |
| ---- | --------------------------------- | ------------------------------------ | ------------ | ------------------------------- | --------------- | --------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------ | ------------ | ---------------------- |
| 8    | `m1-world-08` Ma tête, mon ventre | `m1-world-08-a1` Ma tête, mon ventre | `corps-tete` | principale — montrée à l’enfant | `2aa04c3b557d`  | `ea479dea64fd`  | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire | inchangé     | inchangé     | inchangés              |

### Semaine 3 — 1 leçon(s)

| Jour | Leçon                            | Activité                              | Image              | Rôle                            | Empreinte avant | Empreinte après | Description avant                                                         | Description après                                                                                         | Texte enfant | Texte adulte | Objectif / progression |
| ---- | -------------------------------- | ------------------------------------- | ------------------ | ------------------------------- | --------------- | --------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------ | ------------ | ---------------------- |
| 13   | `m1-lang-13` Ma tête, mon ventre | `m1-lang-13-a2` Les mots de mon corps | `corps-tete`       | principale — montrée à l’enfant | `2aa04c3b557d`  | `ea479dea64fd`  | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire        | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire                                        | inchangé     | inchangé     | inchangés              |
| 13   | `m1-lang-13` Ma tête, mon ventre | `m1-lang-13-a3` Bonjour, petit        | `comptine-bonjour` | principale — montrée à l’enfant | `01ec06b85bdc`  | `2d1ad0c5d999`  | Le soleil qui se lève derrière la colline, et deux mains qui font bonjour | Un enfant qui fait bonjour de la main et lève un pied, devant le soleil qui se lève derrière les collines | inchangé     | inchangé     | inchangés              |

### Semaine 4 — 2 leçon(s)

| Jour | Leçon                              | Activité                                     | Image              | Rôle                            | Empreinte avant | Empreinte après | Description avant                                                         | Description après                                                                                         | Texte enfant | Texte adulte | Objectif / progression |
| ---- | ---------------------------------- | -------------------------------------------- | ------------------ | ------------------------------- | --------------- | --------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------ | ------------ | ---------------------- |
| 18   | `m1-lang-18` Les mots de mon corps | `m1-lang-18-a2` Les quatre mots de mon corps | `corps-tete`       | principale — montrée à l’enfant | `2aa04c3b557d`  | `ea479dea64fd`  | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire        | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire                                        | inchangé     | inchangé     | inchangés              |
| 19   | `m1-lang-19` Je dis ce que je fais | `m1-lang-19-a3` Bonjour, petit               | `comptine-bonjour` | principale — montrée à l’enfant | `01ec06b85bdc`  | `2d1ad0c5d999`  | Le soleil qui se lève derrière la colline, et deux mains qui font bonjour | Un enfant qui fait bonjour de la main et lève un pied, devant le soleil qui se lève derrière les collines | inchangé     | inchangé     | inchangés              |

### Semaine 5 — 2 leçon(s)

| Jour | Leçon                                 | Activité                              | Image        | Rôle                            | Empreinte avant | Empreinte après | Description avant                                                  | Description après                                                  | Texte enfant | Texte adulte | Objectif / progression |
| ---- | ------------------------------------- | ------------------------------------- | ------------ | ------------------------------- | --------------- | --------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------ | ------------ | ---------------------- |
| 20   | `m1-world-20` Tout mon corps          | `m1-world-20-a1` Tout mon corps       | `corps-tete` | principale — montrée à l’enfant | `2aa04c3b557d`  | `ea479dea64fd`  | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire | inchangé     | inchangé     | inchangés              |
| 22   | `m1-lang-22` Tout ce que je sais dire | `m1-lang-22-a2` Tous les mots du mois | `corps-tete` | principale — montrée à l’enfant | `2aa04c3b557d`  | `ea479dea64fd`  | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire | La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire | inchangé     | inchangé     | inchangés              |

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
