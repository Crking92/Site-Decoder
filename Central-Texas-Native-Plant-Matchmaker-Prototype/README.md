# Central Texas Native Plant Matchmaker — Prototype v0.1

This is a first static prototype for a Hays County / Central Texas native plant recommendation wizard.

## What it does

The app asks for simple site conditions:

- light
- soil / landform bucket
- water behavior after rain
- stress factors such as deer, mowing, compaction, heat, erosion, and foot traffic
- ecosystem goals such as native bees, butterflies/moths, caterpillars, birds, hummingbirds, mammals, beneficial insects, erosion control, low water, meadow, shade garden, and restoration

Then it ranks target-zone native plants and summarizes uploaded wildlife relationships.

## Data used

Built from uploaded project files:

- `Target-Zone-Plant-List-alphabetized(1).zip`
  - `data/processed/plants.csv`
- `Central-Texas-Plant-Interactions-main(2).zip`
  - `data/dashboard_plants_v0_3.csv`
  - `data/dashboard_interactions_v0_3.csv`
- `tabular(2).zip`
  - SSURGO TX604 tabular files, summarized into `data/soil_mapunit_summary_tx604.csv`

## Current build counts

- Target-zone plant rows used in the app: **315**
- Target-zone dashboard plant rows found in interactions package: **316**
- Target-zone interaction rows used for wildlife summaries: **22922**

## How to test

Open `index.html` in a browser. This prototype embeds data as JavaScript, so it should work directly from a folder and on GitHub Pages.

## Main files

```text
index.html
css/style.css
js/app.js
data/plant_matcher_data.js
data/plant_matcher_data.json
data/interaction_summary_by_plant.csv
data/soil_mapunit_summary_tx604.csv
docs/scoring_method.md
docs/next_build_plan.md
```

## Important limitations

1. The tool currently uses user-selected soil buckets, not a live map or address lookup.
2. SSURGO soil data are summarized, but not yet connected to map clicking.
3. Wildlife relationships are aggregated from existing interaction rows. Some are stronger than others, so the app displays evidence/locality clues.
4. The scoring system is intentionally simple and should be tuned after field review.
5. The uploaded target plant list has 315 processed plant rows, while the interaction dashboard has 316 target-zone PLT rows. The extra/mismatch appears to be due to duplicate PLT entries for a few scientific names and one plant in the plant list without a matching dashboard PLT row. This should be cleaned in the next data pass.
