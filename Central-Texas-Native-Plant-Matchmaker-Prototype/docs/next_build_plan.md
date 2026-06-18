# Next build plan

## Build 0.2 — data cleanup

1. Reconcile target plant count mismatch between the plant-list repo and interaction dashboard.
2. Create a stable `plant_id` crosswalk where scientific name is primary but duplicate scientific names have explicit row IDs.
3. Normalize commercial availability into one field:
   - yes
   - likely available
   - seed only
   - nursery only
   - restoration-only
   - unavailable / unknown
4. Add caution classes:
   - toxic / poisonous
   - aggressive/spreading
   - thorny/spiny
   - too large for small yards
   - restoration-only
   - wet-site specialist

## Build 0.3 — SSURGO map help

1. Convert SSURGO map-unit polygons to a simplified GeoJSON layer.
2. Keep GeoJSON under GitHub file limits by simplifying geometry and/or splitting by county/tile.
3. Add a click-map workflow:
   - user clicks a point
   - app finds map unit
   - app suggests soil bucket
   - user can override it
4. Add explanation text: “Mapped soil is a good clue, but your yard may be disturbed.”

## Build 0.4 — recipe builder

Add recipe outputs for:

- sunny dry limestone bed
- Blackland clay pocket prairie
- rain garden / swale
- shady woodland edge
- erosion slope
- lawn replacement patch
- 0.25–5 acre meadow
- large-property restoration zone

## Build 0.5 — public education layer

Add two display modes:

- beginner mode: simple words and “why it works”
- science mode: microregion, soil chemistry, evidence grade, interaction provenance
