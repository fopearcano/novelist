export const modes = {
  novel: { label: 'Novel', styles: ['Body text', 'Heading', 'Block quote', 'Author note'] },
  screenplay: { label: 'Screenplay', styles: ['Action', 'Scene heading', 'Character', 'Dialogue', 'Parenthetical', 'Transition'] },
  graphic: { label: 'Graphic novel', styles: ['Panel description', 'Caption', 'Character', 'Dialogue', 'Sound effect'] }
};

const sample = `<p>The fog came in before dusk, erasing the horizon and turning every window in Northpoint into a square of dull, reflected light.</p><p>Mara sat at the kitchen table with her father's shortwave radio between her hands. The wood casing was salt-bleached and cold. It had not worked in fifteen years.</p><p>At 11:42, the speaker crackled.</p><blockquote>Seven. Three. Seven. North by northeast. Come home.</blockquote><p>She stopped breathing. Outside, somewhere past the sleeping harbor, the lighthouse answered with one long pulse of white.</p><p>Mara reached for the tuning dial. The voice returned—soft beneath the static, familiar in a way she could not yet name.</p>`;
const scene = (id, title, words, color, tags = []) => ({ id, title, words, color, tags, content: id === 'signal' ? sample : '', summary: '', status: 'Draft', pov: 'Mara Vale', tension: 5 });

export const initialProject = {
  title: 'The Last Lighthouse', mode: 'novel', theme: 'light', activeScene: 'signal', target: 72000,
  view: { font: 'literary', width: 'medium', size: 18, lineHeight: 1.8, typewriter: false, paragraphFocus: false },
  tags: [
    { id: 'mara', name: 'Mara Vale', type: 'Character', color: '#b35f67', icon: 'M' },
    { id: 'lighthouse', name: 'Northpoint Lighthouse', type: 'Place', color: '#6388ad', icon: '⌂' },
    { id: 'radio', name: 'Shortwave radio', type: 'Object', color: '#d29142', icon: '◇' },
    { id: 'signal-tag', name: 'The number signal', type: 'Music / sound', color: '#9274ad', icon: '♫' }
  ],
  acts: [
    { title: 'ACT I · THE SHORE', chapters: [
      { title: 'Chapter 1 — Low tide', scenes: [scene('arrival', 'A train to Northpoint', 1240, '#6388ad'), scene('letter', 'The unopened letter', 682, '#e3ae47')] },
      { title: 'Chapter 2 — Static', scenes: [scene('signal', 'The signal in the fog', 846, '#db6b4f', ['mara', 'lighthouse', 'radio']), scene('cliffs', 'Footprints on the cliffs', 1105, '#9274ad')] }
    ] },
    { title: 'ACT II · THE DEEP', chapters: [
      { title: 'Chapter 3 — Undertow', scenes: [scene('below', 'What waits below', 0, '#6d9c7c'), scene('keeper', "The keeper's room", 0, '#6388ad')] },
      { title: 'Chapter 4 — The storm', scenes: [scene('blackout', 'Blackout', 0, '#db6b4f')] }
    ] },
    { title: 'ACT III · THE LIGHT', chapters: [] }
  ]
};

export function countWords(text) { return (text.trim().match(/\b[\w’'-]+\b/g) || []).length; }
export function projectProgress(words, target = 72000) { return Math.min(100, Math.round(words / target * 100)); }
export function allScenes(project) { return project.acts.flatMap(act => act.chapters.flatMap(chapter => chapter.scenes)); }
export function migrateProject(raw) {
  const fresh = structuredClone(initialProject);
  if (!raw || typeof raw !== 'object') return fresh;
  const merged = { ...fresh, ...raw, view: { ...fresh.view, ...(raw.view || {}) } };
  // Migrate the first prototype's separate sceneContent object into scene records.
  allScenes(merged).forEach(item => {
    item.tags ??= [];
    item.summary ??= '';
    item.status ??= 'Draft';
    item.pov ??= 'Mara Vale';
    item.tension ??= 5;
    item.content ??= raw.sceneContent?.[item.id] || (item.id === 'signal' ? sample : '');
  });
  delete merged.sceneContent;
  return merged;
}

if (typeof document !== 'undefined') {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  let project;
  try { project = migrateProject(JSON.parse(localStorage.getItem('novelist-project'))); } catch { project = migrateProject(); }
  let filterTag = null;
  let saveTimer;
  const editor = $('#editor');
  const currentScene = () => allScenes(project).find(item => item.id === project.activeScene) || allScenes(project)[0];
  const locateScene = id => { for (let ai = 0; ai < project.acts.length; ai++) for (let ci = 0; ci < project.acts[ai].chapters.length; ci++) { const item = project.acts[ai].chapters[ci].scenes.find(value => value.id === id); if (item) return { item, ai, ci }; } return null; };

  function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 1500); }
  function persist(show = false) { localStorage.setItem('novelist-project', JSON.stringify(project)); $('#statusText').textContent = 'Draft · Autosaved just now'; if (show) toast('Project saved'); }
  function captureScene() {
    const item = currentScene(); if (!item) return;
    item.content = editor.innerHTML; item.title = $('#sceneTitle').value; item.words = countWords(editor.innerText);
    item.summary = $('#sceneSummary').value; item.status = $('#statusSelect').value; item.pov = $('#povSelect').value; item.tension = Number($('#tension').value);
  }
  function scheduleSave() { $('#statusText').textContent = 'Draft · Saving…'; clearTimeout(saveTimer); saveTimer = setTimeout(() => { captureScene(); persist(); renderOutline(); }, 450); }

  function renderOutline() {
    $('#outlineTree').innerHTML = project.acts.map((act, ai) => `<section class="outline-group"><div class="group-header"><button class="chevron" aria-label="Toggle act">▼</button>${escapeHTML(act.title)}</div><div class="group-content">${act.chapters.map((chapter, ci) => `<div class="chapter"><div class="chapter-header"><button class="chevron" aria-label="Toggle chapter">▼</button>${escapeHTML(chapter.title)}</div><div class="scene-list">${chapter.scenes.map(item => `<button class="scene-item ${item.id === project.activeScene ? 'active' : ''} ${filterTag && !item.tags.includes(filterTag) ? 'filtered' : ''}" data-scene="${item.id}" style="--scene-color:${item.color}"><span class="scene-name">${escapeHTML(item.title)}</span><span class="scene-count">${item.words || '—'}</span></button>`).join('')}</div></div>`).join('')}</div></section>`).join('');
    $$('.group-header,.chapter-header').forEach(header => header.addEventListener('click', () => { header.parentElement.classList.toggle('collapsed'); header.querySelector('.chevron').textContent = header.parentElement.classList.contains('collapsed') ? '▶' : '▼'; }));
    $$('.scene-item').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); openScene(button.dataset.scene); }));
  }
  function openScene(id) {
    captureScene(); const found = locateScene(id); if (!found) return;
    project.activeScene = id; const { item, ai, ci } = found;
    $('#sceneTitle').value = item.title; $('#breadcrumb').innerHTML = `${escapeHTML(project.acts[ai].title.split(' · ')[0])} <span>/</span> CHAPTER ${ci + 1}`;
    editor.innerHTML = item.content || `<p>Begin writing <em>${escapeHTML(item.title)}</em>…</p>`;
    $('#sceneSummary').value = item.summary; $('#statusSelect').value = item.status; $('#povSelect').value = item.pov; $('#tension').value = item.tension; $('#tensionValue').textContent = item.tension;
    renderOutline(); renderTags(); updateWords(); persist();
  }
  function renderTags() {
    const item = currentScene();
    $('#tagLibrary').innerHTML = project.tags.map(tag => `<button class="element-row ${item.tags.includes(tag.id) ? 'tagged' : ''}" data-tag="${tag.id}" style="--tag:${tag.color}"><span class="element-icon">${escapeHTML(tag.icon)}</span><span class="element-copy"><strong>${escapeHTML(tag.name)}</strong><span>${escapeHTML(tag.type)}</span></span><span>${item.tags.includes(tag.id) ? '✓' : '＋'}</span></button>`).join('');
    $('#activeTags').innerHTML = item.tags.map(id => project.tags.find(tag => tag.id === id)).filter(Boolean).map(tag => `<button class="tag" data-tag="${tag.id}" title="Remove tag" style="--tag:${tag.color}"><i></i>${escapeHTML(tag.name)} ×</button>`).join('');
    $$('.element-row').forEach(button => button.addEventListener('click', () => toggleTag(button.dataset.tag)));
    $$('#activeTags .tag').forEach(button => button.addEventListener('click', () => toggleTag(button.dataset.tag)));
  }
  function toggleTag(id) { const tags = currentScene().tags; const index = tags.indexOf(id); index < 0 ? tags.push(id) : tags.splice(index, 1); renderTags(); renderOutline(); persist(); }
  function updateWords() { const count = countWords(editor.innerText); currentScene().words = count; $('#sceneWords').textContent = `${count} words`; const total = allScenes(project).reduce((sum, item) => sum + item.words, 0); const progress = projectProgress(total, project.target); $('#wordCountSidebar').textContent = total.toLocaleString(); $('#progressPercent').textContent = `${progress}%`; $('#progressBar').style.width = `${progress}%`; }

  function applyMode(mode) {
    project.mode = mode; document.body.classList.remove('screenplay-mode', 'graphic-mode'); if (mode !== 'novel') document.body.classList.add(`${mode}-mode`);
    $$('.mode-tab').forEach(tab => { const active = tab.dataset.mode === mode; tab.classList.toggle('active', active); tab.setAttribute('aria-selected', active); });
    $('#textStyle').innerHTML = modes[mode].styles.map(style => `<option value="${style.toLowerCase().replaceAll(' ', '-')}">${style}</option>`).join(''); persist();
  }
  function applyView() {
    const fonts = { literary: "'Literata',serif", sans: "'DM Sans',sans-serif", mono: "'DM Mono',monospace", dyslexic: "Verdana,sans-serif" };
    document.documentElement.style.setProperty('--editor-font', fonts[project.view.font]); document.documentElement.style.setProperty('--editor-size', `${project.view.size}px`); document.documentElement.style.setProperty('--editor-leading', project.view.lineHeight);
    editor.classList.toggle('typewriter', project.view.typewriter); editor.classList.toggle('paragraph-focus', project.view.paragraphFocus); editor.dataset.width = project.view.width;
    $('#fontChoice').value = project.view.font; $('#widthChoice').value = project.view.width; $('#fontSize').value = project.view.size; $('#fontSizeValue').textContent = `${project.view.size}px`; $('#lineHeight').value = Math.round(project.view.lineHeight * 10); $('#lineHeightValue').textContent = project.view.lineHeight; $('#typewriterToggle').checked = project.view.typewriter; $('#paragraphFocus').checked = project.view.paragraphFocus;
  }
  function applyTheme(theme) { project.theme = theme; document.body.classList.remove('dark', 'midnight'); if (theme !== 'light') document.body.classList.add(theme); $('#themeButton').textContent = theme === 'light' ? '◐' : theme === 'dark' ? '●' : '◑'; persist(); }
  function addScene() { let chapter = project.acts[0].chapters.at(-1); if (!chapter) { chapter = { title: 'Chapter 1 — Untitled', scenes: [] }; project.acts[0].chapters.push(chapter); } const item = scene(`scene-${Date.now()}`, 'Untitled scene', 0, '#6d9c7c'); chapter.scenes.push(item); openScene(item.id); $('#sceneTitle').select(); }
  function duplicateScene() { captureScene(); const found = locateScene(project.activeScene); const copy = structuredClone(found.item); copy.id = `scene-${Date.now()}`; copy.title += ' — Copy'; project.acts[found.ai].chapters[found.ci].scenes.splice(project.acts[found.ai].chapters[found.ci].scenes.indexOf(found.item) + 1, 0, copy); $('#sceneDialog').close(); openScene(copy.id); toast('Scene duplicated'); }
  function deleteScene() { const found = locateScene(project.activeScene); if (!found || allScenes(project).length === 1) return toast('A project needs at least one scene'); if (!confirm(`Delete “${found.item.title}”?`)) return; const list = project.acts[found.ai].chapters[found.ci].scenes; list.splice(list.indexOf(found.item), 1); $('#sceneDialog').close(); const next = allScenes(project)[0]; project.activeScene = next.id; openScene(next.id); toast('Scene deleted'); }
  function exportScene(type) { captureScene(); const item = currentScene(); const body = type === 'txt' ? editor.innerText : `<!doctype html><meta charset="utf-8"><title>${escapeHTML(item.title)}</title><style>body{max-width:42em;margin:4em auto;font:18px/1.8 Georgia}</style><h1>${escapeHTML(item.title)}</h1>${item.content}`; const url = URL.createObjectURL(new Blob([body], { type: type === 'txt' ? 'text/plain' : 'text/html' })); const link = Object.assign(document.createElement('a'), { href: url, download: `${item.title.toLowerCase().replace(/\W+/g, '-')}.${type}` }); link.click(); setTimeout(() => URL.revokeObjectURL(url), 0); $('#exportDialog').close(); }
  function applyTextStyle(value) { const formats = { 'body-text': 'p', heading: 'h2', 'block-quote': 'blockquote', 'author-note': 'pre' }; document.execCommand('formatBlock', false, formats[value] || 'p'); const block = getSelection()?.anchorNode?.parentElement?.closest('p,h1,h2,h3,blockquote,pre'); if (block && !formats[value]) block.dataset.scriptStyle = value; editor.focus(); }

  $('#projectTitle').value = project.title; renderOutline(); applyMode(project.mode); applyTheme(project.theme); applyView(); openScene(project.activeScene);
  editor.addEventListener('input', () => { updateWords(); scheduleSave(); });
  $('#sceneTitle').addEventListener('input', () => { currentScene().title = $('#sceneTitle').value; renderOutline(); scheduleSave(); });
  $('#projectTitle').addEventListener('input', event => { project.title = event.target.value; scheduleSave(); });
  ['sceneSummary', 'statusSelect', 'povSelect', 'tension'].forEach(id => $(`#${id}`).addEventListener('input', event => { if (id === 'tension') $('#tensionValue').textContent = event.target.value; scheduleSave(); }));
  $$('.mode-tab').forEach(tab => tab.addEventListener('click', () => { captureScene(); applyMode(tab.dataset.mode); toast(`${modes[tab.dataset.mode].label} mode`); }));
  $$('.view-actions button').forEach(button => button.addEventListener('click', () => { $$('.view-actions button').forEach(item => item.classList.remove('active')); button.classList.add('active'); document.body.classList.toggle('focus-mode', button.dataset.layout === 'focus'); }));
  $$('.format-toolbar [data-command]').forEach(button => button.addEventListener('mousedown', event => { event.preventDefault(); document.execCommand(button.dataset.command, false, button.dataset.value || null); editor.focus(); }));
  $('#textStyle').addEventListener('change', event => applyTextStyle(event.target.value));
  $('#themeButton').addEventListener('click', () => { const themes = ['light', 'dark', 'midnight']; applyTheme(themes[(themes.indexOf(project.theme) + 1) % themes.length]); toast(`${project.theme} theme`); });
  $('#newSceneTop').addEventListener('click', addScene);
  $('#addChapter').addEventListener('click', () => { project.acts[0].chapters.push({ title: `Chapter ${project.acts[0].chapters.length + 1} — Untitled`, scenes: [] }); renderOutline(); persist(true); });
  $('#addAct').addEventListener('click', () => { project.acts.push({ title: `ACT ${project.acts.length + 1} · UNTITLED`, chapters: [] }); renderOutline(); persist(true); });
  $('#collapseAll').addEventListener('click', () => { const collapse = $$('.outline-group:not(.collapsed)').length > 0; $$('.outline-group,.chapter').forEach(group => group.classList.toggle('collapsed', collapse)); $$('.chevron').forEach(icon => { icon.textContent = collapse ? '▶' : '▼'; }); });
  $('#tagFilter').addEventListener('click', () => { $('#filterOptions').innerHTML = project.tags.map(tag => `<button data-filter="${tag.id}" style="--tag:${tag.color}"><i></i>${escapeHTML(tag.name)}</button>`).join(''); $$('[data-filter]').forEach(button => button.addEventListener('click', () => { filterTag = button.dataset.filter; renderOutline(); $('#filterDialog').close(); })); $('#filterDialog').showModal(); });
  $('#clearFilter').addEventListener('click', () => { filterTag = null; renderOutline(); $('#filterDialog').close(); });
  $('#closeDetails').addEventListener('click', () => document.body.classList.toggle('details-hidden'));
  $('#exportButton').addEventListener('click', () => $('#exportDialog').showModal()); $$('[data-export]').forEach(button => button.addEventListener('click', () => exportScene(button.dataset.export)));
  $('#sceneMenuButton').addEventListener('click', () => $('#sceneDialog').showModal()); $('#duplicateScene').addEventListener('click', duplicateScene); $('#deleteScene').addEventListener('click', deleteScene);
  $('#addTag').addEventListener('click', () => $('#tagDialog').showModal());
  $('#confirmTag').addEventListener('click', () => { const name = $('#tagName').value.trim(); if (!name) return; const type = $('#tagType').value; const colors = { Character: '#b35f67', Place: '#6388ad', Object: '#d29142', 'Music / sound': '#9274ad' }; const tag = { id: `tag-${Date.now()}`, name, type, color: colors[type], icon: type === 'Music / sound' ? '♫' : '◆' }; project.tags.push(tag); currentScene().tags.push(tag.id); $('#tagName').value = ''; $('#tagDialog').close(); renderTags(); persist(true); });
  $$('#sceneColors button').forEach(button => button.addEventListener('click', () => { currentScene().color = button.dataset.color; $$('#sceneColors button').forEach(item => item.classList.toggle('selected', item === button)); renderOutline(); persist(); }));
  $('#viewSettings').addEventListener('click', () => $('#viewDialog').showModal());
  $('#fontChoice').addEventListener('change', event => { project.view.font = event.target.value; applyView(); persist(); }); $('#widthChoice').addEventListener('change', event => { project.view.width = event.target.value; applyView(); persist(); });
  $('#fontSize').addEventListener('input', event => { project.view.size = Number(event.target.value); applyView(); persist(); }); $('#lineHeight').addEventListener('input', event => { project.view.lineHeight = Number(event.target.value) / 10; applyView(); persist(); });
  $('#typewriterToggle').addEventListener('change', event => { project.view.typewriter = event.target.checked; applyView(); persist(); }); $('#paragraphFocus').addEventListener('change', event => { project.view.paragraphFocus = event.target.checked; applyView(); persist(); });
  $('#resetView').addEventListener('click', () => { project.view = structuredClone(initialProject.view); applyView(); persist(); });
  $('#findButton').addEventListener('click', () => { const query = prompt('Find in this scene'); if (!query) return; const selection = window.find(query, false, false, true); toast(selection ? `Found “${query}”` : 'No match found'); });
  $('#fullscreenButton').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else $('.editor-panel').requestFullscreen(); });
  $$('dialog .dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); captureScene(); persist(true); } });
  window.addEventListener('beforeunload', captureScene);
}
