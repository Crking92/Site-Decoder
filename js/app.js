(function(){
  'use strict';

  const FALLBACK_DATA = {
    meta: {
      project: 'Central Texas Native Plant Matchmaker prototype',
      prototype_version: '0.1.1-fixed',
      plant_rows_from_uploaded_target_zone_list: 0,
      target_zone_interaction_rows_used: 0
    },
    soil_buckets: [{id:'unknown', label:'I do not know / let the plant traits decide'}],
    plants: []
  };

  const DATA = window.PLANT_MATCHER_DATA || FALLBACK_DATA;
  let currentResults = [];

  const el = (id) => document.getElementById(id);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const logScore = (count, maxPts) => count > 0 ? Math.min(maxPts, Math.log10(count + 1) / 2.2 * maxPts) : 0;
  const textHas = (text, terms) => terms.some(t => String(text || '').toLowerCase().includes(t));

  function showStatus(message, level){
    const box = el('appStatus');
    if(!box) return;
    box.textContent = message;
    box.className = 'status ' + (level || 'info');
  }

  function populateSoils(){
    const soil = el('soil');
    if(!soil) return;
    soil.innerHTML = '';
    const buckets = (DATA.soil_buckets && DATA.soil_buckets.length) ? DATA.soil_buckets : FALLBACK_DATA.soil_buckets;
    buckets.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.label;
      soil.appendChild(opt);
    });
  }

  function checkedValues(name){
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(x => x.value);
  }

  function lightScore(p, light){
    const f = p.flags || {};
    if(light === 'unknown') return 8;
    if(light === 'full_sun') return f.sun ? 15 : (f.part_shade ? 7 : 1);
    if(light === 'part_sun') return (f.part_shade ? 15 : 0) + (f.sun ? 5 : 0) + (f.shade ? 4 : 0);
    if(light === 'shade') return f.shade ? 15 : (f.part_shade ? 10 : 1);
    return 8;
  }

  function soilScore(p, soil){
    const f = p.flags || {};
    if(soil === 'unknown') return 8;
    const m = {
      blackland_clay: (f.clay ? 12 : 0) + (f.prairie ? 4 : 0),
      eroded_clay_slope: (f.clay ? 9 : 0) + (f.prairie ? 3 : 0) + (f.rocky ? 2 : 0),
      thin_limestone: (f.limestone ? 13 : 0) + (f.rocky ? 4 : 0),
      steep_rocky_slope: (f.rocky ? 10 : 0) + (f.limestone ? 6 : 0) + (f.dry ? 3 : 0),
      chalky_ridge: (f.limestone ? 12 : 0) + (String(p.caco3_tolerance).toLowerCase()==='high' ? 4 : 0),
      floodplain_bottomland: (f.floodplain ? 14 : 0) + (f.wet ? 3 : 0),
      wet_swale: (f.wet ? 14 : 0) + (f.floodplain ? 4 : 0),
      sandy_gravelly_loam: (f.sandy ? 12 : 0) + (f.loam ? 4 : 0) + (f.rocky ? 2 : 0),
      disturbed_urban: (f.disturbed ? 14 : 0) + (f.dry ? 2 : 0) + (f.groundcover ? 2 : 0),
    };
    return clamp(m[soil] || 0, 0, 15);
  }

  function waterScore(p, water){
    const f = p.flags || {};
    const drought = String(p.drought_tolerance || '').toLowerCase();
    if(water === 'unknown') return 8;
    if(water === 'very_dry') return (f.dry ? 12 : 0) + (drought === 'high' ? 5 : drought === 'medium' ? 2 : 0);
    if(water === 'dry') return (f.dry ? 12 : 0) + (f.average ? 3 : 0) + (drought === 'high' ? 3 : 0);
    if(water === 'average') return (f.average ? 13 : 0) + (f.dry ? 4 : 0) + (f.wet ? 3 : 0);
    if(water === 'wet_after_rain') return (f.wet ? 10 : 0) + (f.average ? 8 : 0) + (f.floodplain ? 5 : 0);
    if(water === 'wet') return (f.wet ? 15 : 0) + (f.floodplain ? 5 : 0);
    if(water === 'irrigated') return (f.average ? 11 : 0) + (f.wet ? 6 : 0) + (f.dry ? 4 : 0);
    return 8;
  }

  function stressScore(p, stresses){
    if(!stresses.length) return 5;
    const f = p.flags || {};
    let score = 0;
    const possible = stresses.length * 5;
    const deer = String(p.deer_resistant || '').toLowerCase();
    for(const s of stresses){
      if(s === 'deer') score += deer.includes('high') ? 5 : deer.includes('moderate') ? 3 : 0;
      if(s === 'mowing') score += (f.grass_sedge || f.groundcover || (p.height_max_ft && p.height_max_ft <= 2)) ? 4 : 1;
      if(s === 'compaction') score += (f.disturbed || f.grass_sedge || f.groundcover) ? 4 : 1;
      if(s === 'heat') score += (f.sun && f.dry) ? 5 : f.dry ? 3 : 0;
      if(s === 'erosion') score += (f.grass_sedge || f.groundcover || textHas(p.root_type, ['fibrous','rhizome','rhizomatous'])) ? 5 : (f.shrub_tree ? 3 : 1);
      if(s === 'foot_traffic') score += (f.groundcover || f.grass_sedge) ? 4 : 1;
      if(s === 'invasives') score += (f.prairie || f.grass_sedge || f.groundcover || f.disturbed) ? 3 : 1;
    }
    return possible ? (score / possible) * 10 : 5;
  }

  function goalScore(p, goals){
    if(!goals.length) return 8;
    const g = p.goal_counts || {};
    const f = p.flags || {};
    const ds = p.dashboard_scores || {};
    let score = 0;
    const possible = goals.length * 10;
    for(const goal of goals){
      if(goal === 'bees') score += logScore(g.native_bees || g.bees || 0, 10) + (textHas(p.attracts_raw, ['bee']) ? 2 : 0);
      if(goal === 'butterflies_moths') score += logScore(g.butterflies_moths || 0, 10) + (textHas(p.attracts_raw, ['butterfl']) ? 2 : 0);
      if(goal === 'caterpillars') score += logScore(g.host_records || 0, 10) + (p.larval_host_raw ? 2 : 0);
      if(goal === 'birds') score += logScore(g.birds || 0, 10) + (textHas(p.attracts_raw + ' ' + p.use_wildlife, ['bird']) ? 2 : 0) + Math.min(2, (ds.bird || 0)/50);
      if(goal === 'hummingbirds') score += logScore(g.hummingbirds || 0, 10) + (textHas(p.attracts_raw, ['hummingbird']) ? 4 : 0);
      if(goal === 'mammals') score += logScore(g.mammals || 0, 10) + Math.min(3, (ds.mammal || 0)/30);
      if(goal === 'beneficial_insects') score += logScore((g.other_insects || 0) + (g.pollinator_records || 0), 10) + (textHas(p.use_wildlife + ' ' + p.attracts_raw, ['beneficial','insect']) ? 2 : 0);
      if(goal === 'erosion') score += (f.grass_sedge || f.groundcover ? 8 : 0) + (textHas(p.root_type, ['fibrous','rhizome']) ? 2 : 0);
      if(goal === 'low_water') score += (f.dry ? 6 : 0) + (String(p.drought_tolerance).toLowerCase()==='high' ? 4 : 0);
      if(goal === 'shade_garden') score += (f.shade || f.part_shade || f.woodland ? 10 : 0);
      if(goal === 'meadow') score += (f.prairie ? 5 : 0) + (f.grass_sedge ? 3 : 0) + (String(p.growth_habit).toLowerCase().includes('herb') ? 2 : 0);
      if(goal === 'restoration') score += Math.min(10, ((ds.balanced || 0) / 10)) + (f.prairie || f.floodplain || f.limestone ? 2 : 0);
    }
    return possible ? clamp((score / possible) * 20, 0, 20) : 8;
  }

  function heightPass(p, height){
    if(height === 'any') return true;
    const h = p.height_max_ft;
    if(!h) return true;
    if(height === 'under2') return h <= 2;
    if(height === 'two_to_five') return h > 2 && h <= 5;
    if(height === 'over5') return h > 5;
    return true;
  }

  function explainFit(p, opts){
    const pieces = [];
    const lightSelect = el('light');
    if(opts.light !== 'unknown' && lightSelect?.selectedOptions?.[0]) pieces.push(`matches ${lightSelect.selectedOptions[0].textContent.toLowerCase()}`);
    if(opts.soil !== 'unknown') pieces.push('fits the selected soil bucket when its habitat/soil notes line up');
    if(opts.water !== 'unknown') pieces.push('fits the selected water pattern');
    const gc = p.goal_counts || {};
    const attract = [];
    if(gc.native_bees) attract.push(`${gc.native_bees} native-bee record${gc.native_bees===1?'':'s'}`);
    if(gc.butterflies_moths) attract.push(`${gc.butterflies_moths} butterfly/moth record${gc.butterflies_moths===1?'':'s'}`);
    if(gc.birds) attract.push(`${gc.birds} bird record${gc.birds===1?'':'s'}`);
    if(gc.other_insects) attract.push(`${gc.other_insects} other-insect record${gc.other_insects===1?'':'s'}`);
    if(attract.length) pieces.push(`wildlife records: ${attract.slice(0,3).join(', ')}`);
    return pieces.length ? pieces.join('; ') + '.' : 'This plant stayed in the list because it is in the target-zone plant pool and did not fail the selected filters.';
  }

  function kidExplain(p){
    const f = p.flags || {};
    const place = f.wet ? 'a wetter spot' : f.dry ? 'a dry spot' : f.woodland ? 'a shadier edge' : 'this kind of yard';
    const job = f.grass_sedge || f.groundcover ? 'covers and holds the soil' : f.shrub_tree ? 'adds structure and shelter' : 'adds flowers and food';
    const gc = p.goal_counts || {};
    const animals = gc.native_bees ? 'bees' : gc.butterflies_moths ? 'butterflies and moths' : gc.birds ? 'birds' : 'wildlife';
    return `Think of this plant as a helper. It can live in ${place}, ${job}, and gives ${animals} something useful.`;
  }

  function scorePlant(p, opts){
    if(!heightPass(p, opts.height)) return null;
    const ls = lightScore(p, opts.light);
    const ss = soilScore(p, opts.soil);
    const ws = waterScore(p, opts.water);
    const st = stressScore(p, opts.stresses);
    const gs = goalScore(p, opts.goals);
    const evidence = Math.min(10, ((p.dashboard_scores?.evidence || 0) / 10));
    const locality = Math.min(5, ((p.dashboard_scores?.locality || 0) / 20));
    const total = clamp(ls + ss + ws + st + gs + evidence + locality + 10, 0, 100);
    return {total, parts:{light:ls, soil:ss, water:ws, stress:st, goals:gs, evidence, locality}};
  }

  function getOptions(){
    return {
      projectSize: el('projectSize')?.value || 'yard',
      light: el('light')?.value || 'unknown',
      soil: el('soil')?.value || 'unknown',
      water: el('water')?.value || 'unknown',
      height: el('height')?.value || 'any',
      search: (el('search')?.value || '').trim().toLowerCase(),
      stresses: checkedValues('stress'),
      goals: checkedValues('goal')
    };
  }

  function runMatcher(){
    const opts = getOptions();
    currentResults = [];
    for(const p of (DATA.plants || [])){
      if(opts.search){
        const hay = `${p.scientific_name} ${p.common_name} ${p.family} ${p.primary_microregion}`.toLowerCase();
        if(!hay.includes(opts.search)) continue;
      }
      const sc = scorePlant(p, opts);
      if(!sc) continue;
      currentResults.push({plant:p, score:sc.total, parts:sc.parts, explain:explainFit(p, opts)});
    }
    currentResults.sort((a,b) => b.score - a.score || (b.plant.goal_counts?.host_records||0) - (a.plant.goal_counts?.host_records||0));
    renderResults(opts);
  }

  function topWildlifeText(p){
    const gc = p.goal_counts || {};
    const bits = [];
    if(gc.native_bees) bits.push(`Native bees: ${gc.native_bees}`);
    if(gc.butterflies_moths) bits.push(`Butterflies/moths: ${gc.butterflies_moths}`);
    if(gc.host_records) bits.push(`Host records: ${gc.host_records}`);
    if(gc.birds) bits.push(`Birds: ${gc.birds}`);
    if(gc.other_insects) bits.push(`Other insects: ${gc.other_insects}`);
    if(gc.hummingbirds) bits.push(`Hummingbirds: ${gc.hummingbirds}`);
    if(gc.mammals) bits.push(`Mammals: ${gc.mammals}`);
    return bits;
  }

  function escapeHtml(s){
    return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }

  function wildlifeDetails(p){
    const top = p.interaction_summary?.top_by_group || {};
    const order = ['Native bees','Butterflies & moths','Birds','Other insects','Beetles','True bugs','Wasps & ants','Flower flies & other flies','Hummingbirds','Mammals','Honey bees (non-native)'];
    const groups = order.filter(g => top[g]?.length).concat(Object.keys(top).filter(g => !order.includes(g) && top[g]?.length));
    if(!groups.length) return '<p class="small">No direct interaction examples are currently aggregated for this plant in the uploaded interaction file.</p>';
    return `<div class="animals">${groups.slice(0,7).map(g => {
      const examples = top[g].slice(0,4).map(x => `<span title="${escapeHtml(x.evidence)} | ${escapeHtml(x.scope)}">${escapeHtml(x.animal)}${x.common ? ` (${escapeHtml(x.common)})` : ''}</span>`).join(', ');
      const count = p.interaction_summary?.group_counts?.[g] || top[g].length;
      return `<div class="animal-group"><b>${escapeHtml(g)} <span class="small">(${count} records)</span></b><div>${examples}</div></div>`;
    }).join('')}</div>`;
  }

  function renderResults(opts){
    const summary = el('resultSummary');
    const cards = el('cards');
    if(!summary || !cards) return;

    if(!DATA.plants || !DATA.plants.length){
      showStatus('The page loaded, but the plant data file did not load. Check that data/plant_matcher_data.js is in the repository.', 'error');
      summary.innerHTML = '<b>No plant data loaded.</b> The app shell is working, but the data file is missing or blocked.';
      cards.innerHTML = '';
      return;
    }

    const total = currentResults.length;
    const shown = currentResults.slice(0, 30);
    const soilLabel = el('soil')?.selectedOptions?.[0]?.textContent || 'unknown';
    summary.innerHTML = `<b>${total}</b> plant matches found. Showing the top <b>${shown.length}</b>. Soil choice: <b>${escapeHtml(soilLabel)}</b>. This is a ranking tool, not a hard truth machine; local yard disturbance can change the real answer.`;
    cards.innerHTML = shown.map(({plant:p, score, parts, explain}) => {
      const chips = [p.growth_habit, p.primary_microregion, p.water_req, p.light_raw, p.deer_resistant ? `Deer: ${p.deer_resistant}` : '', p.warning ? 'Caution/warning' : ''].filter(Boolean);
      const wildlifeBits = topWildlifeText(p);
      return `<article class="card">
        <div class="card-head">
          <div class="score"><b>${Math.round(score)}</b><span>fit score</span></div>
          <div>
            <h3><i>${escapeHtml(p.scientific_name)}</i></h3>
            <div class="common">${escapeHtml(p.common_name || 'Common name not listed')}</div>
            <div class="chips">${chips.slice(0,8).map(c => `<span class="chip ${String(c).includes('Caution')?'warn':''}">${escapeHtml(c)}</span>`).join('')}</div>
            <div class="why"><b>Why this came up:</b> ${escapeHtml(explain)}</div>
            <div class="kids">${escapeHtml(kidExplain(p))}</div>
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail"><b>Site notes</b>${escapeHtml(p.soil_description || p.native_habitat || 'No site note loaded.')}</div>
          <div class="detail"><b>Wildlife summary</b>${wildlifeBits.length ? escapeHtml(wildlifeBits.join(' | ')) : escapeHtml(p.attracts_raw || p.use_wildlife || 'No wildlife summary loaded.')}</div>
          <div class="detail"><b>Bloom / size</b>${escapeHtml(p.bloom_time || 'Bloom not listed')} · ${escapeHtml(p.height_raw || 'height not listed')} ft</div>
          <div class="detail"><b>Data confidence clues</b>Evidence ${Math.round(parts.evidence || 0)}/10 · locality ${Math.round(parts.locality || 0)}/5 · interaction rows ${p.interaction_summary?.total_records || 0}</div>
        </div>
        <details><summary>Show example wildlife relationships</summary>${wildlifeDetails(p)}</details>
        <details><summary>Show scoring pieces</summary><div class="detail-grid">${Object.entries(parts).map(([k,v]) => `<div class="detail"><b>${escapeHtml(k)}</b>${Math.round(v*10)/10}</div>`).join('')}</div></details>
      </article>`;
    }).join('');
    showStatus(`Loaded ${DATA.plants.length} target-zone plants and ${Number(DATA.meta?.target_zone_interaction_rows_used || 0).toLocaleString()} interaction rows.`, 'ok');
  }

  function downloadResults(){
    const rows = currentResults.map(r => {
      const p = r.plant;
      return {
        fit_score: Math.round(r.score), scientific_name: p.scientific_name, common_name: p.common_short || p.common_name,
        growth_habit: p.growth_habit, primary_microregion: p.primary_microregion, light: p.light_raw, water: p.water_req,
        soil_moisture: p.soil_moisture, bloom_time: p.bloom_time, height_ft: p.height_raw,
        native_bee_records: p.goal_counts?.native_bees || 0, butterfly_moth_records: p.goal_counts?.butterflies_moths || 0,
        host_records: p.goal_counts?.host_records || 0, bird_records: p.goal_counts?.birds || 0, other_insect_records: p.goal_counts?.other_insects || 0,
        warning: p.warning, why: r.explain
      };
    });
    const headers = Object.keys(rows[0] || {fit_score:'', scientific_name:''});
    const csv = [headers.join(',')].concat(rows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plant_matchmaker_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetWizard(){
    if(el('projectSize')) el('projectSize').value = 'yard';
    if(el('light')) el('light').value = 'full_sun';
    if(el('soil')) el('soil').value = 'unknown';
    if(el('water')) el('water').value = 'dry';
    if(el('height')) el('height').value = 'any';
    if(el('search')) el('search').value = '';
    document.querySelectorAll('input[type="checkbox"]').forEach(x => x.checked = false);
    const bee = document.querySelector('input[name="goal"][value="bees"]');
    const moth = document.querySelector('input[name="goal"][value="butterflies_moths"]');
    if(bee) bee.checked = true;
    if(moth) moth.checked = true;
    runMatcher();
  }

  function init(){
    try{
      populateSoils();
      if(el('metaPlants')) el('metaPlants').textContent = `${DATA.meta?.plant_rows_from_uploaded_target_zone_list || DATA.plants?.length || 0} target-zone plant rows`;
      if(el('metaInteractions')) el('metaInteractions').textContent = `${Number(DATA.meta?.target_zone_interaction_rows_used || 0).toLocaleString()} target-zone interaction rows`;
      if(el('metaVersion')) el('metaVersion').textContent = `prototype ${DATA.meta?.prototype_version || 'v0.1.1'}`;
      if(el('run')) el('run').addEventListener('click', runMatcher);
      if(el('reset')) el('reset').addEventListener('click', resetWizard);
      if(el('download')) el('download').addEventListener('click', downloadResults);
      document.querySelectorAll('select,input').forEach(x => x.addEventListener('change', runMatcher));
      if(el('search')) el('search').addEventListener('input', () => {
        window.clearTimeout(window.__searchTimer);
        window.__searchTimer = window.setTimeout(runMatcher, 120);
      });
      window.setTimeout(resetWizard, 0);
    } catch(err){
      console.error(err);
      showStatus(`Startup error: ${err.message}`, 'error');
      const summary = el('resultSummary');
      if(summary) summary.innerHTML = `<b>Startup error:</b> ${escapeHtml(err.message)}. The app shell loaded, but JavaScript stopped during setup.`;
    }
  }

  window.addEventListener('error', function(event){
    showStatus(`Script error: ${event.message}`, 'error');
  });

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
