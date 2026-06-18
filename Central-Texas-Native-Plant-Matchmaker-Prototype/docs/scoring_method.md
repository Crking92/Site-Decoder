# Scoring method — prototype v0.1

The fit score is a practical ranking score, not a biological law.

## Score pieces

| Piece | Max points | Meaning |
|---|---:|---|
| Base target-zone pool | 10 | Plant is in the uploaded target-zone plant list |
| Light match | 15 | User light choice compared with plant light/habitat fields |
| Soil match | 15 | User soil bucket compared with soil description, habitat, microregion, CaCO3, and fine habitat tags |
| Water match | 15 | User water behavior compared with plant water, moisture, drought, riparian, and wetland clues |
| Stress match | 10 | Deer, mowing, compaction, heat, erosion, traffic, and invasive-pressure clues |
| Goal match | 20 | Wildlife/functional goals compared with interaction counts and plant fields |
| Evidence/locality clues | 15 | Uses uploaded dashboard evidence/locality scores where available |

## Soil buckets

The app currently uses these public-facing buckets:

- Heavy clay / Blackland prairie
- Eroded clay slope
- Thin rocky limestone / karst
- Steep rocky limestone slope
- Chalky calcareous ridge
- Creek / floodplain / bottomland
- Wet swale / drainage / rain garden
- Sandy or gravelly loam
- Disturbed builder soil / roadside / fill

## Why this approach

Hard filters can remove plants that are still useful. A ranking score is better for education because it lets the user see tradeoffs.

Simple explanation: the score asks, “Does this plant fit this place, and does it do the job the person wants?”
