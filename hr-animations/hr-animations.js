/* Storage contract:
localStorage['ss.animations.v1'] = JSON.stringify(Array(10).fill({
  message:"Go Team", bg:"#0047ab", img:null
}))
Structure per slot: { message: string, bg: "#rrggbb", img: dataURL|null }
*/
const STORAGE_KEY = 'ss.animations.v1';
const DEFAULT_BG = '#0047ab';
const DEFAULT_MESSAGE = 'Go Team';

function getDefaults(){
  return Array.from({length:10}, () => ({
    message: DEFAULT_MESSAGE,
    bg: DEFAULT_BG,
    img: null
  }));
}

function loadAnimations(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return getDefaults();
    const parsed = JSON.parse(raw);
    if(!Array.isArray(parsed) || parsed.length !== 10) return getDefaults();
    // sanitize
    return parsed.map(x => ({
      message: typeof x?.message === 'string' ? x.message : DEFAULT_MESSAGE,
      bg: /^#([0-9a-f]{6})$/i.test(x?.bg||'') ? x.bg : DEFAULT_BG,
      img: typeof x?.img === 'string' && x.img.startsWith('data:image') ? x.img : null
    }));
  }catch{ return getDefaults(); }
}

function saveAnimations(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function contrastText(hex){ // returns '#000' or '#fff'
  const c = hex.replace('#','');
  const r = parseInt(c.slice(0,2),16)/255;
  const g = parseInt(c.slice(2,4),16)/255;
  const b = parseInt(c.slice(4,6),16)/255;
  // Relative luminance
  const srgb = [r,g,b].map(v=> v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4));
  const L = 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
  return L > 0.5 ? '#000000' : '#ffffff';
}

/* Elements */
const gridEl = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');

const editor = document.getElementById('editor');
const editorSlot = document.getElementById('editorSlot');
const livePreview = document.getElementById('livePreview');
const liveText = document.getElementById('liveText');
const liveImage = document.getElementById('liveImage');
const fMessage = document.getElementById('fMessage');
const fBg = document.getElementById('fBg');
const fImage = document.getElementById('fImage');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const btnReset = document.getElementById('btnReset');

let state = loadAnimations();
let editingIndex = null;

/* Render grid */
function render(){
  gridEl.innerHTML = '';
  state.forEach((slot, idx)=>{
    const node = tpl.content.firstElementChild.cloneNode(true);
    const thumb = node.querySelector('.thumb');
    const tText = node.querySelector('.thumb-text');
    const tImg = node.querySelector('.thumb-img');
    const slotLbl = node.querySelector('.slot');
    const btnEdit = node.querySelector('.edit');
    const btnReset = node.querySelector('.reset');

    slotLbl.textContent = `#${idx}`;
    thumb.dataset.slot = String(idx);

    if(slot.img){
      tImg.src = slot.img;
      tImg.style.display = 'block';
      tText.style.display = 'none';
      thumb.style.background = '#111';
    }else{
      tImg.style.display = 'none';
      tText.style.display = 'inline';
      tText.textContent = slot.message || DEFAULT_MESSAGE;
      thumb.style.background = slot.bg || DEFAULT_BG;
      tText.style.color = contrastText(slot.bg || DEFAULT_BG);
    }

    btnEdit.addEventListener('click', ()=> openEditor(idx));
    applyHoldToReset(btnReset, ()=> resetSlot(idx));

    gridEl.appendChild(node);
  });
}

/* Editor open/close */
function openEditor(idx){
  editingIndex = idx;
  const slot = state[idx];

  editorSlot.textContent = `#${idx}`;
  fMessage.value = slot.message;
  fBg.value = slot.bg;
  fImage.value = ''; // clear

  refreshLivePreview(slot);
  editor.showModal();
}

function refreshLivePreview(slot){
  if(slot.img){
    liveImage.src = slot.img;
    liveImage.style.display = 'block';
    livePreview.style.background = '#000';
    liveText.style.display = 'none';
  }else{
    liveImage.style.display = 'none';
    livePreview.style.background = slot.bg;
    liveText.style.display = 'inline';
    liveText.textContent = slot.message || DEFAULT_MESSAGE;
    liveText.style.color = contrastText(slot.bg);
  }
}

/* File -> dataURL */
function fileToDataURL(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onload = ()=> resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* Editor events */
fMessage.addEventListener('input', ()=>{
  if(editingIndex==null) return;
  const draft = { ...state[editingIndex], message: fMessage.value };
  refreshLivePreview(draft);
});
fBg.addEventListener('input', ()=>{
  if(editingIndex==null) return;
  const draft = { ...state[editingIndex], bg: fBg.value };
  refreshLivePreview(draft);
});
fImage.addEventListener('change', async ()=>{
  if(editingIndex==null) return;
  const file = fImage.files?.[0];
  if(!file){ // cleared
    const draft = { ...state[editingIndex], img: null };
    refreshLivePreview(draft);
    return;
  }
  const dataURL = await fileToDataURL(file);
  const draft = { ...state[editingIndex], img: dataURL };
  refreshLivePreview(draft);
});

btnSave.addEventListener('click', (e)=>{
  e.preventDefault();
  if(editingIndex==null) return editor.close();

  const current = state[editingIndex];
  const file = fImage.files?.[0];

  const finalize = (imgData)=>{
    const updated = {
      message: fMessage.value.trim() || DEFAULT_MESSAGE,
      bg: fBg.value || DEFAULT_BG,
      img: imgData ?? current.img
    };
    state[editingIndex] = updated;
    saveAnimations(state);
    render();
    editor.close();
  };

  if(file){
    fileToDataURL(file).then(data=>finalize(data));
  }else{
    finalize(undefined);
  }
});

btnCancel.addEventListener('click', (e)=>{ e.preventDefault(); editor.close(); });
applyHoldToReset(btnReset, ()=>{
  if(editingIndex==null) return;
  resetSlot(editingIndex);
  // refresh editor view to defaults
  const slot = state[editingIndex];
  fMessage.value = slot.message;
  fBg.value = slot.bg;
  fImage.value = '';
  refreshLivePreview(slot);
});

/* Long-press helper */
function applyHoldToReset(el, onConfirm){
  let t = null;
  let progress = 0;
  const HOLD_MS = 900;

  const start = ()=>{
    if(t) return;
    progress = 0;
    t = setInterval(()=>{
      progress += 100;
      if(progress >= HOLD_MS){
        clearInterval(t); t=null;
        onConfirm();
      }
    },100);
  };
  const end = ()=>{
    if(t){ clearInterval(t); t=null; }
  };
  el.addEventListener('mousedown', start);
  el.addEventListener('touchstart', start);
  el.addEventListener('mouseup', end);
  el.addEventListener('mouseleave', end);
  el.addEventListener('touchend', end);
}

/* Reset a slot to defaults */
function resetSlot(idx){
  state[idx] = { message: DEFAULT_MESSAGE, bg: DEFAULT_BG, img: null };
  saveAnimations(state);
  render();
}

/* Init */
render();
