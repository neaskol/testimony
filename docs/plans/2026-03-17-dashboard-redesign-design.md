# Dashboard Redesign — Style "Page de journal"

**Date** : 2026-03-17
**Scope** : Dashboard traducteur + Dashboard admin
**Approche** : Editorial / Magazine avec hierarchie typographique forte

---

## Probleme

Les deux dashboards sont des grilles de chiffres statiques + listes plates.
Pas de hierarchie visuelle, pas de narration, pas d'orientation action. Fonctionnel mais sans personnalite.

## Direction retenue

Style "Page de journal" : le dashboard devient une une editoriale.
Hierarchie via la typographie (Playfair Display + Inter), pas via des bordures et des cartes.
Filets fins horizontaux comme separateurs (style presse).

---

## Dashboard Traducteur

### Hero editorial

- Salutation personnalisee en Playfair Display 3xl bold
- Message contextuel dynamique en Inter lg muted :
  - "X temoignages vous attendent" (assignations non traduites)
  - "Tout est a jour." (rien en attente)
  - "Un planning de lecture approche." (prochain service < 3 jours)
- Lien vers prochain planning en Inter sm, couleur accent dore
- Filet fin horizontal (#E2E8F0) en bas du hero
- Aucune carte, aucune bordure — juste typographie sur fond blanc

### Layout deux colonnes (desktop lg+)

**Colonne principale (2/3)** — "A traduire"
- Titre de section en Playfair Display, filet fin en dessous
- Chaque assignation = un "article" :
  - Nom du temoin : Inter semi-bold
  - Extrait : premiere phrase en italique, guillemets francais
  - Metadonnees : StatusBadge + date relative (formatRelative), separes par point median
  - Fleche discrete a droite
  - Filet fin entre chaque item (pas de border de carte)
  - Item entier cliquable → /translator/testimonies/[id]
- Lien "Tout voir" en bas si > 5 items

**Encadre lateral (1/3)** — Stats + Plannings
- Bordure gauche epaisse 2px accent dore (#B8860B), pas de contour complet
- Trois blocs stats empiles :
  - Chiffre en 2xl bold + label en xs muted
  - Separes par filets fins
  - Assignations / En cours / Terminees
- Section "Plannings" en dessous :
  - Titre de section compact
  - Mini-liste : titre service + date courte + nb temoignages
  - Items cliquables → /translator/plans/[id]

### Mobile (< lg)

Ordre : Hero → Stats inline (3 chiffres horizontaux) → Articles → Plannings
Stats compactes sur une ligne, pas d'encadre lateral.

---

## Dashboard Admin

### Hero admin

- "Bonjour, [nom]." en Playfair Display 3xl bold
- "X temoignages . Y en traduction" en Inter lg muted
- "Prochaine reunion : [date]" en Inter sm accent dore, lien si service existe
- Filet fin horizontal

### Colonne principale — Plannings recents

- Style article identique au traducteur
- Titre du service en semi-bold
- Date + nombre de temoignages en metadonnees
- Filets fins separateurs
- Lien "Tout voir" → /admin/plans

### Encadre lateral — Stats

- Meme style bordure gauche doree
- Temoignages totaux / En traduction / Planifies / Prochain service

### Mobile

Hero → Stats inline → Plannings recents

---

## Composants a creer/modifier

1. `DashboardHero` — hero editorial reutilisable (titre, sous-titre, lien)
2. `StatsSidebar` — encadre lateral avec bordure gauche doree
3. `ArticleList` — liste style journal avec filets
4. `ArticleItem` — item article (nom, extrait, metadonnees, fleche)
5. Modifier les deux pages dashboard existantes

## Elements de design

- Separateurs : `border-t border-border` (filets fins)
- Pas de Card/CardHeader/CardContent dans le hero ni les articles
- Encadre : `border-l-2 border-primary pl-6` (bordure gauche doree)
- Typographie hero : `font-serif text-3xl font-bold tracking-tight`
- Extraits : `italic text-muted-foreground`
- Guillemets francais autour des extraits

## Donnees existantes (pas de nouveau fetch)

- Traducteur : getMyAssignments(), getMyTranslationStats(), getTranslatorPlans()
- Admin : getTestimonies(), getServices(), getPlans()
- Helpers : formatDate(), formatRelative(), cn()
