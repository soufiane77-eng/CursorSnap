# Cursor Inspector v2 — Identification précise de l'élément

Date : 2026-09-16
Statut : Approuvé

## Problème

Le JSON actuel ne contient qu'un sélecteur CSS (parfois non unique, non vérifié) et des positions. Une IA ne peut pas identifier l'élément à 100 % : le sélecteur casse sur les pages dynamiques, ignore le shadow DOM et les iframes, et ne fournit aucune caractéristique de l'élément permettant de recouper.

## Objectif

Fournir à l'IA plusieurs signaux indépendants et vérifiés pour identifier l'élément exactement : sélecteurs multiples, empreinte riche, contexte DOM, signature visuelle.

## Nouveau format JSON

```json
{
  "selectors": {
    "css": "body > div.card:nth-of-type(1) > button.btn:nth-of-type(2)",
    "cssShort": "#btn-submit",
    "xpath": "/html/body/div[1]/button[2]",
    "unique": true,
    "confidence": 0.95
  },
  "element": {
    "tag": "button",
    "id": "btn-submit",
    "classes": ["btn", "btn-primary"],
    "attributes": { "type": "submit", "name": "submit", "data-action": "save" },
    "text": "Enregistrer",
    "role": "button",
    "ariaLabel": "Enregistrer les modifications",
    "name": "submit",
    "href": null, "src": null, "placeholder": null,
    "value": null, "alt": null, "title": null
  },
  "dom": {
    "depth": 4,
    "index": 1,
    "siblings": 3,
    "ancestors": [
      { "tag": "body", "id": null, "classes": [] },
      { "tag": "div", "id": null, "classes": ["card"] },
      { "tag": "form", "id": null, "classes": [] }
    ],
    "shadow": { "inShadowRoot": false, "hostSelector": null },
    "frame": { "isTop": true, "selector": null }
  },
  "visual": {
    "rect": { "top": 192, "left": 155, "width": 85, "height": 35 },
    "display": "inline-block", "visibility": "visible", "position": "static",
    "zIndex": "auto", "color": "rgb(255,255,255)",
    "backgroundColor": "rgb(46,204,113)", "fontSize": "14px",
    "fontFamily": "Arial, sans-serif",
    "cursor": { "x": 214, "y": 219 }
  }
}
```

## Architecture

`content.js` refactoré en fonctions pures :

| Fonction | Rôle |
|---|---|
| `getSelectors(el)` | CSS court + CSS complet + XPath, chacun vérifié unique, score de confiance |
| `getElementFingerprint(el)` | tag, id, classes, attributs, texte tronqué (200 car.), ARIA, name/href/src/... |
| `getDomContext(el)` | profondeur, index parmi les frères, chemin des ancêtres, shadow DOM, frame |
| `getVisualSignature(el)` | rect + styles calculés (display, position, couleurs, police) |
| `deepElementFromPoint(x, y)` | traverse les shadow roots (elementFromPoint ne le fait pas) |
| `buildData(el, x, y)` | assemble le tout |

## Changements annexes

- **manifest.json** : `all_frames: true` → détection aussi dans les iframes (chemin de l'iframe inclus dans `dom.frame`)
- **test.html** : enrichi avec shadow DOM, iframe, éléments dupliqués, attributs riches
- **README.md** : nouveau format JSON documenté
- Hook de debug `window.__cursorInspector` exposé (test + usage IA)

## Définitions précises

- **`cssShort`** : le plus court sélecteur unique trouvé, dans l'ordre de préférence : `#id` unique → classe unique → chemin complet. Si aucun n'est unique, c'est le chemin complet (avec `unique: false`).
- **`confidence`** : 1.0 si `#id` unique ; 0.9 si sélecteur court par classe unique ; 0.8 si seul le chemin complet est unique ; 0.5 si aucun sélecteur n'est unique.
- **`index`** : position 0-based parmi les frères (le 2e bouton → `index: 1`).
- **`ancestors`** : liste des ancêtres du parent jusqu'à `body` inclus, l'élément lui-même exclu.
- **`text`** : `textContent` nettoyé (espaces multiples réduits) et tronqué à 200 caractères.

## Gestion des erreurs

- Sélecteur non unique → `unique: false`, confiance réduite (l'IA sait qu'il faut recouper)
- Élément dans un shadow root → chemin shadow complet inclus
- Texte tronqué à 200 caractères pour garder le JSON lisible

## Test

- `test.html` enrichi + vérification manuelle dans Chrome (hover → click → coller le JSON)