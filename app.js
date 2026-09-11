export const modes = {
  novel: { label: 'Novel', hint: 'Write immersive prose, one scene at a time.' },
  screenplay: { label: 'Screenplay', hint: 'Scene headings, action and dialogue in screenplay rhythm.' },
  graphic: { label: 'Graphic novel', hint: 'Compose panel descriptions, captions and dialogue.' }
};

export const initialProject = {
  mode: 'novel', activeScene: 'signal',
  tags: [
    { id:'mara', name:'Mara Vale', type:'Character', color:'#b35f67', icon:'M' },
    { id:'lighthouse', name:'Northpoint Lighthouse', type:'Place', color:'#6388ad', icon:'⌂' },
    { id:'radio', name:'Shortwave radio', type:'Object', color:'#d29142', icon:'◇' },
    { id:'signal', name:'The number signal', type:'Music / sound', color:'#9274ad', icon:'♫' }
  ],
  acts: [
    { title:'ACT I · THE SHORE', chapters:[
      { title:'Chapter 1 — Low tide', scenes:[{id:'arrival',title:'A train to Northpoint',words:1240,color:'#6388ad'},{id:'letter',title:'The unopened letter',words:682,color:'#e3ae47'}]},
      { title:'Chapter 2 — Static', scenes:[{id:'signal',title:'The signal in the fog',words:846,color:'#db6b4f'},{id:'cliffs',title:'Footprints on the cliffs',words:1105,color:'#9274ad'}]}
    ]},
    { title:'ACT II · THE DEEP', chapters:[
      { title:'Chapter 3 — Undertow', scenes:[{id:'below',title:'What waits below',words:0,color:'#6d9c7c'},{id:'keeper',title:"The keeper's room",words:0,color:'#6388ad'}]},
      { title:'Chapter 4 — The storm', scenes:[{id:'blackout',title:'Blackout',words:0,color:'#db6b4f'}]}
    ]},
    { title:'ACT III · THE LIGHT', chapters:[] }
  ],
  sceneContent: {
    signal: `<p>The fog came in before dusk, erasing the horizon and turning every window in Northpoint into a square of dull, reflected light.</p><p>Mara sat at the kitchen table with her father's shortwave radio between her hands. The wood casing was salt-bleached and cold. It had not worked in fifteen years.</p><p>At 11:42, the speaker crackled.</p><blockquote>Seven. Three. Seven. North by northeast. Come home.</blockquote><p>She stopped breathing. Outside, somewhere past the sleeping harbor, the lighthouse answered with one long pulse of white.</p><p>Mara reached for the tuning dial. The voice returned—soft beneath the static, familiar in a way she could not yet name.</p>`
  }
};

export function countWords(text) { return (text.trim().match(/\b[\w’'-]+\b/g) || []).length; }
export function projectProgress(words, target=72000) { return Math.min(100, Math.round(words / target * 100)); }

if (typeof document !== 'undefined') {
  let project = loadProject();
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const editor = $('#editor');

  function loadProject(){ try { return {...structuredClone(initialProject), ...JSON.parse(localStorage.getItem('novelist-project') || '{}')}; } catch { return structuredClone(initialProject); } }
  function save(show=false){ project.sceneContent[project.activeScene] = editor.innerHTML; localStorage.setItem('novelist-project', JSON.stringify(project)); $('#statusText').textContent='Draft · Autosaved just now'; if(show) toast('Project saved'); }
  function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1600); }

  function renderOutline(){
    $('#outlineTree').innerHTML = project.acts.map((act,ai)=>`<section class="outline-group"><div class="group-header"><button class="chevron">▼</button>${act.title}</div><div class="group-content">${act.chapters.map((ch,ci)=>`<div class="chapter"><div class="chapter-header"><button class="chevron">▼</button>${ch.title}</div><div class="scene-list">${ch.scenes.map(s=>`<div class="scene-item ${s.id===project.activeScene?'active':''}" data-scene="${s.id}" data-act="${ai}" data-chapter="${ci}" style="--scene-color:${s.color}"><span class="scene-name">${s.title}</span><span class="scene-count">${s.words||'—'}</span></div>`).join('')}</div></div>`).join('')}</div></section>`).join('');
    $$('.group-header,.chapter-header').forEach(el=>el.addEventListener('click',()=>{el.parentElement.classList.toggle('collapsed');el.querySelector('.chevron').textContent=el.parentElement.classList.contains('collapsed')?'▶':'▼'}));
    $$('.scene-item').forEach(el=>el.addEventListener('click',()=>selectScene(el.dataset.scene,+el.dataset.act,+el.dataset.chapter)));
  }
  function selectScene(id,ai,ci){ save(); project.activeScene=id; const scene=project.acts[ai].chapters[ci].scenes.find(s=>s.id===id); $('#sceneTitle').value=scene.title; $('#breadcrumb').innerHTML=`${project.acts[ai].title.split(' · ')[0]} <span>/</span> CHAPTER ${ci+1}`; editor.innerHTML=project.sceneContent[id]||`<p>Begin writing <em>${scene.title}</em>…</p>`; renderOutline(); updateWords(); save(); }
  function renderTags(){
    const colors={Character:'#b35f67',Place:'#6388ad',Object:'#d29142','Music / sound':'#9274ad'};
    $('#tagLibrary').innerHTML=project.tags.map(t=>`<button class="element-row" data-tag="${t.id}" style="--tag:${t.color||colors[t.type]}"><span class="element-icon">${t.icon||'◆'}</span><span class="element-copy"><strong>${t.name}</strong><span>${t.type}</span></span><span>＋</span></button>`).join('');
    $('#activeTags').innerHTML=project.tags.slice(0,3).map(t=>`<button class="tag" style="--tag:${t.color}"><i></i>${t.name}</button>`).join('');
    $$('.element-row').forEach(btn=>btn.addEventListener('click',()=>{const t=project.tags.find(x=>x.id===btn.dataset.tag);if(!$('#activeTags').textContent.includes(t.name))$('#activeTags').insertAdjacentHTML('beforeend',`<button class="tag" style="--tag:${t.color}"><i></i>${t.name}</button>`);toast(`${t.name} tagged`)}));
  }
  function updateWords(){ const n=countWords(editor.innerText); $('#sceneWords').textContent=`${n} words`; const total=23834+n; $('#wordCountSidebar').textContent=total.toLocaleString(); const p=projectProgress(total);$('#progressPercent').textContent=p+'%';$('#progressBar').style.width=p+'%'; }
  function setMode(mode){ project.mode=mode; document.body.classList.remove('screenplay-mode','graphic-mode');if(mode!=='novel')document.body.classList.add(`${mode}-mode`);$$('.mode-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));$('#textStyle').innerHTML=mode==='screenplay'?'<option>Action</option><option>Scene heading</option><option>Character</option><option>Dialogue</option><option>Parenthetical</option>':mode==='graphic'?'<option>Panel description</option><option>Caption</option><option>Dialogue</option><option>Sound effect</option>':'<option value="body">Body text</option><option value="heading">Heading</option><option value="quote">Block quote</option><option value="note">Author note</option>';toast(`${modes[mode].label} mode`);save(); }
  function addScene(){ const ch=project.acts[0].chapters.at(-1); const id='scene-'+Date.now();ch.scenes.push({id,title:'Untitled scene',words:0,color:'#6d9c7c'});project.sceneContent[id]='<p>Begin your new scene…</p>';renderOutline();selectScene(id,0,project.acts[0].chapters.length-1);$('#sceneTitle').focus();$('#sceneTitle').select(); }
  function download(type){ const title=$('#sceneTitle').value;const content=type==='txt'?editor.innerText:`<!doctype html><meta charset="utf-8"><title>${title}</title><style>body{max-width:42em;margin:4em auto;font:18px/1.8 Georgia}</style><h1>${title}</h1>${editor.innerHTML}`;const blob=new Blob([content],{type:type==='txt'?'text/plain':'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${title.toLowerCase().replace(/\W+/g,'-')}.${type}`;a.click();URL.revokeObjectURL(a.href);$('#exportDialog').close();toast('Export ready'); }

  $('#projectTitle').value=project.title||'The Last Lighthouse'; $('#sceneTitle').value='The signal in the fog'; editor.innerHTML=project.sceneContent[project.activeScene]||initialProject.sceneContent.signal;renderOutline();renderTags();setMode(project.mode);updateWords();
  editor.addEventListener('input',()=>{updateWords();$('#statusText').textContent='Draft · Saving…';clearTimeout(window.saveTimer);window.saveTimer=setTimeout(()=>save(),600)});
  $('#sceneTitle').addEventListener('input',e=>{const scene=project.acts.flatMap(a=>a.chapters).flatMap(c=>c.scenes).find(s=>s.id===project.activeScene);if(scene){scene.title=e.target.value;renderOutline()}save()});
  $('#projectTitle').addEventListener('change',e=>{project.title=e.target.value;save(true)});
  $$('.mode-tab').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  $$('.view-actions button').forEach(b=>b.addEventListener('click',()=>{$$('.view-actions button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.body.classList.toggle('focus-mode',b.dataset.layout==='focus')}));
  $$('.format-toolbar [data-command]').forEach(b=>b.addEventListener('click',()=>document.execCommand(b.dataset.command,false,b.dataset.value||null)));
  $('#textStyle').addEventListener('change',e=>{const map={heading:'h2',quote:'blockquote',note:'pre',body:'p'};document.execCommand('formatBlock',false,map[e.target.value]||'p');editor.focus()});
  $('#themeButton').addEventListener('click',()=>document.body.classList.toggle('dark'));
  $('#newSceneTop').addEventListener('click',addScene);
  $('#addChapter').addEventListener('click',()=>{project.acts[0].chapters.push({title:`Chapter ${project.acts[0].chapters.length+1} — Untitled`,scenes:[]});renderOutline();save(true)});
  $('#addAct').addEventListener('click',()=>{project.acts.push({title:`ACT ${project.acts.length+1} · UNTITLED`,chapters:[]});renderOutline();save(true)});
  $('#collapseAll').addEventListener('click',()=>$$('.outline-group').forEach(x=>x.classList.toggle('collapsed')));
  $('#closeDetails').addEventListener('click',()=>{$('.details-panel').style.display='none';$('.workspace').style.gridTemplateColumns='286px 1fr'});
  $('#exportButton').addEventListener('click',()=>$('#exportDialog').showModal());
  $$('dialog .dialog-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  $$('[data-export]').forEach(b=>b.addEventListener('click',()=>download(b.dataset.export)));
  $('#addTag').addEventListener('click',()=>$('#tagDialog').showModal());
  $('#confirmTag').addEventListener('click',()=>{const name=$('#tagName').value.trim();if(!name)return;const type=$('#tagType').value;const colors={Character:'#b35f67',Place:'#6388ad',Object:'#d29142','Music / sound':'#9274ad'};project.tags.push({id:'tag-'+Date.now(),name,type,color:colors[type],icon:type==='Music / sound'?'♫':'◆'});renderTags();save();$('#tagDialog').close();$('#tagName').value='';toast('Story element added')});
  $('#tension').addEventListener('input',e=>$('#tensionValue').textContent=e.target.value);
  $$('#sceneColors button').forEach(b=>b.addEventListener('click',()=>{$$('#sceneColors button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');const scene=project.acts.flatMap(a=>a.chapters).flatMap(c=>c.scenes).find(s=>s.id===project.activeScene);scene.color=b.dataset.color;renderOutline();save()}));
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='s'){e.preventDefault();save(true)}});
}
