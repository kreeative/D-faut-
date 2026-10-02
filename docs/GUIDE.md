# Guide : modifier tes sites et les mettre en ligne toi-même

Ce guide explique comment ton site est rangé, comment le modifier (avec moi, dans ton navigateur ou sur ton ordinateur) et comment chaque changement part en ligne. Il reprend aussi, étape par étape, tout ce qui a été fait pour le concept gouv.ci, avec les outils pour le refaire sur un autre projet.

> **L'idée à retenir.** Un site n'est pas un fichier Figma : c'est un dossier de fichiers texte (le code) qu'un service publie sur une adresse web. Pour le modifier, tu modifies ces fichiers. Pour qu'il change en ligne, le service de publication doit voir la nouvelle version.

---

## 1. Où se trouve quoi

| Quoi | Où | Lien |
| --- | --- | --- |
| Les fichiers du site (le code) | GitHub, dépôt `kreeative/D-faut-`, branche `gouv-ci-concept` | https://github.com/kreeative/D-faut-/tree/gouv-ci-concept |
| Le site en ligne | Vercel, projet `concept-portail-citoyen-ci` (équipe « management-7548's projects ») | https://concept-portail-citoyen-ci.vercel.app |
| Le tableau de bord de publication | Vercel | https://vercel.com/management-7548s-projects/concept-portail-citoyen-ci |
| La maquette Figma | Ton Figma (fichier créé, à remplir : voir section 4) | https://www.figma.com/design/qk6GCxDbofyXuG0khTetyv |

**Traduction pour une designer :**

- **GitHub**, c'est ton Drive pour le code, avec un historique complet des versions (comme l'historique de versions de Figma). Chaque enregistrement s'appelle un **commit**.
- Une **branche**, c'est une variante du projet. Ton dépôt `D-faut-` contient plusieurs sites, un par branche : `gouv-ci-concept` pour ce concept, `claude/kind-hamilton-ba68qk` pour le site VANTÉ, et une branche par autre projet.
- **Vercel**, c'est le bouton « Publier » : il prend les fichiers d'une branche GitHub et les met en ligne sur une adresse.

---

## 2. À faire une seule fois : la publication automatique (2 minutes)

Aujourd'hui, Vercel ne surveille pas encore GitHub : le site a été publié « à la main ». Pour que **chaque modification parte en ligne toute seule**, il faut relier les deux une fois. Je n'ai pas pu le faire à ta place : l'outil dont je dispose ne sait pas relier un projet déjà créé.

1. Connecte-toi sur https://vercel.com avec le compte Vercel de ce projet (celui de l'équipe « management-7548's projects »).
2. Ouvre le projet **concept-portail-citoyen-ci**, puis **Settings**, puis **Git**.
3. Clique sur **Connect Git Repository**, choisis **GitHub**, puis le dépôt **kreeative/D-faut-**, et valide.
4. Toujours dans **Settings**, ouvre **Environments**, puis **Production**. Dans la partie **Branch Tracking** (la branche de production), remplace la branche proposée par **`gouv-ci-concept`** et enregistre.

L'étape 4 est importante. Sans elle, Vercel publierait la branche par défaut du dépôt, qui est celle du site VANTÉ.

Ensuite, chaque commit sur la branche `gouv-ci-concept` met le site à jour en ligne en 30 à 60 secondes. Tu peux suivre chaque publication dans l'onglet **Deployments** de Vercel. Dis-moi quand c'est fait : je pousse une petite modification pour vérifier que tout s'enchaîne.

> Les commits sur les autres branches du dépôt créeront des « previews » dans ce projet, sans toucher au site en ligne. Tu peux les ignorer.

---

## 3. Modifier le site : trois façons

### A. Me le demander (le plus rapide)

C'est ce que tu fais déjà. Décris le changement comme à un développeur : « remplace le titre du hero par … », « mets cette photo à la place de celle du drapeau », « le vert un peu plus clair ». Une capture d'écran avec une flèche aide beaucoup. Je modifie, je vérifie sur mobile et ordinateur, puis je publie.

### B. Toi-même dans le navigateur, sur GitHub (textes, couleurs, photos)

Rien à installer. Fais-le de préférence sur ordinateur ; sur téléphone, ouvre github.com dans le navigateur plutôt que dans l'application GitHub.

**Changer un texte**

1. Ouvre la page à modifier :
   - Accueil : https://github.com/kreeative/D-faut-/edit/gouv-ci-concept/index.html
   - À propos : https://github.com/kreeative/D-faut-/edit/gouv-ci-concept/a-propos.html
   - Page de démarche : https://github.com/kreeative/D-faut-/edit/gouv-ci-concept/demarche.html
2. Cherche ton texte avec **Ctrl + F** (ou **Cmd + F** sur Mac).
3. Modifie uniquement les mots entre les balises. Exemple : dans `<h1 …>Vos démarches, <em>simplement.</em></h1>`, change « Vos démarches », pas `<h1>` ni `<em>`.
4. Clique sur **Commit changes…**, écris une phrase qui décrit le changement, puis **Commit changes**.

**Changer une couleur, une police, une taille**

Tout le style est dans un seul fichier : https://github.com/kreeative/D-faut-/edit/gouv-ci-concept/assets/css/styles.css

En haut du fichier, la partie `:root` contient tes « styles Figma » sous forme de variables :

```css
:root {
  --cream: #f6f1e7;    /* fond papier */
  --forest: #0a3323;   /* vert forêt : sections sombres, boutons */
  --orange: #f77f00;   /* orange du drapeau : accents */
  --gold: #f0c36a;     /* or : italiques sur fond sombre */
  --f-display: "Fraunces Variable", …;         /* police des titres */
  --f-sans: "Instrument Sans Variable", …;     /* police du texte */
  --t-h1: clamp(2.75rem, 1.8rem + 4.4vw, 5.75rem); /* taille du grand titre */
}
```

Change une valeur ici, et elle change partout sur le site, comme un style de couleur dans Figma. Garde un contraste suffisant pour le texte : vérifie tes paires de couleurs sur https://webaim.org/resources/contrastchecker/ (4,5:1 minimum pour le texte courant).

**Remplacer une photo**

Le plus simple : remplacer le fichier en gardant **exactement le même nom**.

1. Prépare ton image au même format que l'actuelle (par exemple `hero-drapeau-1600.jpg` fait 1600 × 900 px) et compresse-la sur https://squoosh.app (JPEG, qualité 75 à 80).
2. Va sur https://github.com/kreeative/D-faut-/upload/gouv-ci-concept/assets/img et dépose le fichier renommé.
3. Clique sur **Commit changes**. Le fichier existant est remplacé.

| Photo sur le site | Fichier(s) | Format |
| --- | --- | --- |
| Hero (drapeau) | `hero-drapeau-1600.jpg` (ordinateur), `hero-drapeau-960.jpg` (mobile) | 1600 × 900 et 960 × 1280 |
| Bande lagune | `interlude-lagune-1600.jpg`, `interlude-lagune-960.jpg` | 1600 × 800 et 960 × 1000 |
| Une des actualités | `news-pyramide-960.jpg` | 960 × 720 |
| Photos des districts | `district-<nom>-800.jpg` | 800 × 450 |
| Galerie | `gallery-*.jpg` | 600 × 900, 1000 × 500 ou 600 × 600 |
| En-tête de la page À propos | `apropos-taxis-1600.jpg`, `apropos-taxis-960.jpg` | 1600 × 720 et 960 × 640 |

**Astuce :** sur la page du dépôt, appuie sur la touche **`.`** (point). GitHub ouvre un éditeur complet dans le navigateur, avec la recherche dans tous les fichiers.

**Annuler une erreur :** rien n'est jamais perdu. Dans GitHub, chaque fichier a un bouton **History**. Côté Vercel, l'onglet **Deployments** permet de remettre en ligne une version précédente (**Instant Rollback** ou **Promote**). Tu peux aussi simplement me demander d'annuler.

### C. Sur ton ordinateur (pour aller plus loin)

C'est la façon de travailler des développeurs. C'est aussi la plus proche de Figma, parce que tu vois le résultat à chaque sauvegarde.

1. Installe **GitHub Desktop** (https://desktop.github.com) et **VS Code** (https://code.visualstudio.com).
2. Dans GitHub Desktop, choisis **Clone repository**, puis `kreeative/D-faut-`, puis la branche `gouv-ci-concept`.
3. Ouvre le dossier dans VS Code et installe l'extension **Live Server**. Fais un clic droit sur `index.html`, puis **Open with Live Server** : le site s'ouvre et se recharge à chaque sauvegarde.
4. Quand tu es contente du résultat, ouvre GitHub Desktop, écris un message, clique sur **Commit to gouv-ci-concept** puis sur **Push origin**. Une fois la section 2 faite, c'est en ligne en une minute.

---

## 4. Et Figma dans tout ça ?

**Ce qu'il faut savoir :** modifier une maquette Figma ne modifie pas le site, et Figma ne publie pas ce code. Le site, c'est le code. Figma sert à **explorer** visuellement avant de modifier le code.

**Avoir le site en calques dans Figma.** J'ai créé le fichier « Concept portail citoyen CI — site (import du code) » dans ton Figma : https://www.figma.com/design/qk6GCxDbofyXuG0khTetyv. Je n'ai pas pu y importer le site : ton forfait Figma gratuit limite les outils de l'assistant à 20 appels par mois, et la limite du mois est atteinte. Deux façons de le remplir :

- **Toi-même, tout de suite :** dans ce fichier, ouvre **Plugins**, cherche **html.to.design**, colle l'adresse `https://concept-portail-citoyen-ci.vercel.app` et choisis deux largeurs, 1440 (ordinateur) et 390 (mobile). Le plugin crée des calques modifiables. Sa version gratuite limite le nombre d'imports par mois.
- **Avec moi, le mois prochain :** le script `docs/figma/export-pour-figma.py` prépare une version du site lisible par Figma, avec les deux planches. Dès que la limite Figma se réinitialise, je l'importe directement dans ton fichier.

**L'aller-retour Figma → site :**

1. Tu fais tes modifications dans Figma : couleurs, textes, mise en page, nouvelles sections.
2. Tu m'envoies le lien de la frame : clic droit sur la frame, puis **Copy link to selection**. Ou bien une capture.
3. Je reporte les changements dans le code, je vérifie, je publie.

**Si tu veux « dessiner = publier » sans code** pour de futurs projets (portfolio, page de lancement, site vitrine), regarde **Framer**. C'est l'outil le plus proche de Figma : il a un plugin d'import depuis Figma et publie en un clic. **Webflow** et **Figma Sites** sont d'autres options, selon ton forfait. Pour un site sur mesure comme ce concept, GitHub + Vercel reste la bonne base.

---

## 5. Petit dictionnaire Figma → web

| Dans Figma | Sur le web | Dans ce projet |
| --- | --- | --- |
| Frame, section | Balise `<section>`, `<div>` | `index.html` |
| Auto layout | Flexbox, Grid (CSS) | `display: flex` ou `display: grid` dans `styles.css` |
| Styles de couleur | Variables CSS | `--forest`, `--orange`… dans `:root` |
| Styles de texte | Variables de taille, familles | `--t-h1`, `--f-display` |
| Composant | Classe CSS réutilisée | `.bento__item`, `.btn`, `.tag` |
| Variante | Classe « modificatrice » | `.bento__item--xl`, `.btn--accent` |
| Frames mobile / ordinateur | Media queries | `@media (min-width: 64em) { … }` |
| Prototype, interactions | JavaScript | `assets/js/main.js` (menu, recherche, carte, assistant) |
| Export des images | Dossier d'images | `assets/img/` |
| Historique des versions | Commits Git | Onglet **History** sur GitHub |
| Publier, partager le lien | Déploiement Vercel | https://concept-portail-citoyen-ci.vercel.app |

---

## 6. Ce qui a été fait pour ce concept, étape par étape

1. **Comprendre l'existant.** Lecture du code source de gouv.ci : sections, liens, nombre d'images et de scripts, absence de recherche et de lien d'évitement, poids de la page. **Outil pour toi :** dans Chrome, clic droit puis **Inspecter**, onglet **Lighthouse**, qui note la performance et l'accessibilité d'une page.
2. **Benchmark.** Portails publics de référence (GOV.UK, service-public.fr, ms.gov, ta capture) : recherche visible, démarches d'abord, compte citoyen, assistant.
3. **Direction artistique.** Palette tirée du drapeau (orange, vert, fond crème, vert forêt profond), typographie Fraunces (titres) et Instrument Sans (texte), motif géométrique discret. **Outils :** https://fonts.google.com pour tester les polices, et https://fontsource.org pour télécharger les fichiers `.woff2` hébergés avec le site.
4. **Structure (wireframe).** Ordre des sections : recherche, flash infos, démarches, thèmes, carte des districts, actualités, galerie, gouvernement, avis.
5. **Code.** Trois fichiers principaux : `index.html` (contenu et structure), `styles.css` (tout le style), `main.js` (menu, recherche avec suggestions, carte, assistant Akwaba, apparitions au défilement). Pas de framework : c'est le plus simple à comprendre et à modifier.
6. **Mobile d'abord.** Conçu à 390 px puis élargi. Tests à 320, 390, 820 et 1280 px. **Outil pour toi :** dans Chrome, **Inspecter**, puis l'icône téléphone (Device Toolbar) pour voir le site à toutes les tailles.
7. **Accessibilité.** Contrastes vérifiés, navigation au clavier, lien « Aller au contenu », textes alternatifs, un seul grand titre par page, animations coupées pour qui les désactive.
8. **Contenus et droits.** Tes photos, crédits indiqués sur la page À propos. Carte des districts dessinée à partir des données libres geoBoundaries. Titres d'actualité repris de gouv.ci avec la source. **Outil :** https://commons.wikimedia.org pour des photos libres (vérifie la licence et crédite l'auteur).
9. **Optimisation des images.** Deux tailles par photo (ordinateur, mobile), JPEG compressé. **Outil :** https://squoosh.app
10. **Publication.** Les fichiers sur GitHub, mis en ligne par Vercel sur une adresse sans « gouv » dedans, avec une balise `noindex` pour ne pas apparaître dans Google à côté du site officiel.
11. **Vidéo TikTok.** Générée automatiquement par un script (`docs/video/record.js`) qui fait défiler le site dans un cadre de téléphone. **Pour toi, plus simple :** l'enregistrement d'écran de ton téléphone sur le site en ligne, puis le montage dans CapCut.
12. **Prise de contact.** Email au CICG (`docs/email-cicg.md`), avec les adresses publiées sur cicg.gouv.ci et le lien du concept.

---

## 7. Checklist pour ton prochain site

- [ ] Objectif en une phrase, et les 3 actions que le visiteur doit pouvoir faire.
- [ ] Références (3 à 5 sites) et ce que tu en retiens.
- [ ] Maquette Figma en mobile (390) et ordinateur (1440), avec styles de couleur et de texte.
- [ ] Photos avec droits clairs, exportées en deux tailles et compressées.
- [ ] Code : soit tu me confies la maquette, soit Framer pour un site simple sans code.
- [ ] Un dépôt GitHub par site, avec une branche `main`.
- [ ] Un projet Vercel relié au dépôt, branche de production `main` : publication automatique.
- [ ] Tests sur ton téléphone, contrastes, Lighthouse.
- [ ] Nom de domaine si besoin (dans Vercel : **Settings**, puis **Domains**).

---

## 8. En cas de souci

- **Le site ne change pas après une modification.** Attends une minute, puis force le rechargement : **Ctrl + Maj + R** sur PC, **Cmd + Maj + R** sur Mac. Regarde l'onglet **Deployments** sur Vercel : une ligne rouge veut dire que la publication a échoué, clique dessus pour lire le message.
- **Rien ne se publie après un commit.** Vérifie la section 2 : dépôt relié, branche de production `gouv-ci-concept`.
- **Une page s'affiche mal après une modification.** Une balise a probablement été coupée, par exemple un `</p>` effacé. Regarde la différence dans **History** sur GitHub, ou demande-moi.
- **Une image n'apparaît pas.** Le nom du fichier doit être identique, majuscules et extension comprises : `.jpg` et `.JPG` sont deux noms différents.
