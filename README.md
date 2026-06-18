# Central Texas Native Plant Matchmaker — Prototype v0.1.1 fixed

Static prototype for matching Central Texas / Hays County native plants to site conditions and wildlife goals.

## Open locally

Recommended quick test:

1. Unzip the package.
2. Open `index-standalone.html` first. This file has the CSS, data, and JavaScript embedded in one file.
3. If that works, `index.html` should also work as long as the `css/`, `data/`, and `js/` folders stay beside it.

## GitHub Pages upload

Upload the contents of this folder to the repository root, not the folder itself. The repository root should contain:

- `index.html`
- `index-standalone.html`
- `css/`
- `data/`
- `js/`
- `docs/`

If GitHub Pages is blank, first open `index-standalone.html`. If that works, the issue is usually a missing folder/path during upload.

## Data included

- 315 target-zone plant rows
- 22,922 target-zone interaction rows summarized by plant
- SSURGO TX604 soil map-unit summary for Comal/Hays as a future soil-suggestion layer

## Prototype note

Scores are advisory. They combine plant traits, site filters, wildlife interaction counts, evidence/locality clues, and stress-tolerance hints. Field observation should override the score when a yard has construction fill, compaction, irrigation, or unusual drainage.
