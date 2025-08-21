/* Storage contract:
localStorage['ss.animations.v1'] = JSON.stringify(Array(10).fill({
  message:"Go Team", bg:"#0047ab", img:null, mode:"message", textAnim:"flash"
}))
*/

const STORAGE_KEY = 'ss.animations.v1';
const DEFAULT_BG = '#0047ab';
const DEFAULT_MESSAGE = 'Go Team';

/* ---------- Utilities ---------- */
function bytesFromDataURL(dataURL) {
  try {
    const i = dataURL.indexOf(',');
    if (i < 0) return NaN;
    return atob(dataURL.slice(i + 1)).length; // decoded bytes
  } catch { return NaN; }
}
function formatKB(bytes) {
  return Number.isFinite(bytes) ? `${Math.round(bytes/1024).toLocaleString()} KB` : '0 KB';
}

function computeStorageTotals() {
  let anim = 0, total = 0;
  for (const s of state) {
    const img = s && s.img;
    if (!img || img === PLACEHOLDER_WHITE_IMG || typeof img !== 'string' || !img.startsWith('data:')) continue;
    const bytes = bytesFromDataURL(img);
    total += bytes;
    if (/^data:(image\/gif|image\/apng|video\/)/i.test(img)) anim += bytes;
  }
  return { anim, total };
}

function updateStorageTotalsUI() {
  const { anim, total } = computeStorageTotals();
  const a = document.getElementById('animTotal');
  const o = document.getElementById('overallTotal');
  if (a) a.textContent = formatKB(anim);
  if (o) o.textContent = formatKB(total);
}



// function makeWhitePNG(){  // 1x1 white pixel
//   const c = document.createElement('canvas'); 
//   c.width = c.height = 1;
//   const ctx = c.getContext('2d'); 
//   ctx.fillStyle = '#ffffff'; 
//   ctx.fillRect(0,0,1,1);
//   return c.toDataURL('image/png');
// }

function makeWhitePNG(){ // now colorful placeholder (4x2) instead of 1x1 white.
  const c = document.createElement('canvas');
  c.width = 4; c.height = 2;
  const ctx = c.getContext('2d');
  const colors = ['#000','#00f','#f0f','#0ff', '#f00','#0f0','#ff0','#fff']; // R,G,B,W,C,M,Y,K
  let i = 0;
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 4; x++) {
      ctx.fillStyle = colors[i++];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c.toDataURL('image/png');
}

function contrastText(hex){
  const c = (hex||'#000').replace('#','');
  const r = parseInt(c.slice(0,2),16)/255;
  const g = parseInt(c.slice(2,4),16)/255;
  const b = parseInt(c.slice(4,6),16)/255;
  const toLin = v=> v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4);
  const L = 0.2126*toLin(r) + 0.7152*toLin(g) + 0.0722*toLin(b);
  return L > 0.5 ? '#000000' : '#ffffff';
}
function setImageIfChanged(imgEl, dataUrl){
  if(imgEl.dataset.src !== (dataUrl||'')){
    imgEl.dataset.src = dataUrl||'';
    if(dataUrl) imgEl.src = dataUrl;
  }
}
// --- GIF hover-only support helpers ---
const STILL_CACHE = new Map();
async function firstFrameFromImage(dataUrl){
  if (STILL_CACHE.has(dataUrl)) return STILL_CACHE.get(dataUrl);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = dataUrl;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || 1; c.height = img.naturalHeight || 1;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const still = c.toDataURL('image/png');
  STILL_CACHE.set(dataUrl, still);
  return still;
}
function isGifDataUrl(s){ return typeof s === 'string' && s.startsWith('data:image/gif'); }

function applyTextAnimClass(textEl, kind){
  textEl.classList.remove('anim-flash','anim-zoom','anim-spin');
  if(kind==='flash') textEl.classList.add('anim-flash');
  else if(kind==='zoom') textEl.classList.add('anim-zoom');
  else if(kind==='spin') textEl.classList.add('anim-spin');
}

/* ---------- State ---------- */
let PLACEHOLDER_WHITE_IMG = makeWhitePNG();

function withDefaults(x){
  const saneImg = (typeof x?.img === 'string' && x.img.startsWith('data:image')) ? x.img : PLACEHOLDER_WHITE_IMG;
  const mode = (x?.mode==='message'||x?.mode==='image'||x?.mode==='both') ? x.mode : (saneImg!==PLACEHOLDER_WHITE_IMG ? 'image' : 'message');
  const textAnim = (['none','flash','zoom','spin'].includes(x?.textAnim)) ? x.textAnim : 'flash';
  return {
    message: typeof x?.message === 'string' ? x.message : DEFAULT_MESSAGE,
    bg: /^#([0-9a-f]{6})$/i.test(x?.bg||'') ? x.bg : DEFAULT_BG,
    img: saneImg,
    mode,
    textAnim
  };
}
function getDefaults(){
  return Array.from({length:10}, () => ({
    message: DEFAULT_MESSAGE, bg: DEFAULT_BG, img: PLACEHOLDER_WHITE_IMG, mode: 'message', textAnim: 'flash'
  }));
}
function loadAnimations(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return getDefaults();
    const arr = JSON.parse(raw);
    if(!Array.isArray(arr) || arr.length!==10) return getDefaults();
    return arr.map(withDefaults);
  }catch{ return getDefaults(); }
}
function saveAnimations(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/* ---------- DOM ---------- */
const gridEl = document.getElementById('grid');
const tpl = document.getElementById('cardTpl');

const editor = document.getElementById('editor');
const editorSlot = document.getElementById('editorSlot');
const dirtyBadge = document.getElementById('dirtyBadge');

const livePreview = document.getElementById('livePreview');
const liveText = document.getElementById('liveText');
const liveImage = document.getElementById('liveImage');
const liveMini = document.getElementById('liveMini');

const fMessage = document.getElementById('fMessage');
const fBg = document.getElementById('fBg');
const fImage = document.getElementById('fImage');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const btnReset = document.getElementById('btnReset');

const modeMessage = document.getElementById('modeMessage');
const modeImage   = document.getElementById('modeImage');
const modeBoth    = document.getElementById('modeBoth');
const fTextAnim   = document.getElementById('fTextAnim');

const fs       = document.getElementById('fsPreview');
const fsStage  = document.getElementById('fsStage');
const fsImg    = document.getElementById('fsImg');
const fsText   = document.getElementById('fsText');


/* ---------- App ---------- */
let state = loadAnimations();
let editingIndex = null;
let originalSlot = null;


/* ----- Render thumbnails grid -----*/
function render(){
  gridEl.innerHTML = '';
  state.forEach((slot, idx)=>{
    const node  = tpl.content.firstElementChild.cloneNode(true);
    const thumb = node.querySelector('.thumb');
    const tText = node.querySelector('.thumb-text');
    const tImg  = node.querySelector('.thumb-img');
    const tMini = node.querySelector('.thumb-mini');

    // Mini thumbnail: ALWAYS static (first frame). Never animates.
    tMini.style.display = 'none'; // default hidden
    const imgSrcTop = slot.img;
    if (imgSrcTop && !isGifDataUrl(imgSrcTop)) {
      setImageIfChanged(tMini, imgSrcTop);
      tMini.style.display = 'block';
    }

    // TEXT animates only on hover
    const hoverTextOn  = () => {
      const s = state[idx];
      if (s.mode === 'message' || s.mode === 'both') applyTextAnimClass(tText, s.textAnim);
    };
    const hoverTextOff = () => applyTextAnimClass(tText, 'none');
    thumb.addEventListener('mouseenter', hoverTextOn);
    thumb.addEventListener('mouseleave', hoverTextOff);
    applyTextAnimClass(tText, 'none'); // idle by default

    // GIFs: show still by default; animate only on hover
    (async () => {
      const imgSrc = state[idx].img;
      if (!imgSrc) return;
      if (isGifDataUrl(imgSrc)) {
        thumb.dataset.animatedSrc = imgSrc;
        const still = await firstFrameFromImage(imgSrc);
        setImageIfChanged(tImg, still);

        // Mini should be static still too
        setImageIfChanged(tMini, still);
        tMini.style.display = 'block';

        const imgHoverOn  = () => setImageIfChanged(tImg, thumb.dataset.animatedSrc);
        const imgHoverOff = () => setImageIfChanged(tImg, still);
        thumb.addEventListener('mouseenter', imgHoverOn);
        thumb.addEventListener('mouseleave', imgHoverOff);
        // two-finger touch ≈ hover
        let twoFingerActive = false;
        thumb.addEventListener('touchstart', (e)=>{
          if (e.touches && e.touches.length >= 2) { twoFingerActive = true; imgHoverOn(); hoverTextOn(); }
        }, {passive:true});
        thumb.addEventListener('touchend', ()=>{
          if (twoFingerActive) { twoFingerActive = false; imgHoverOff(); hoverTextOff(); }
        }, {passive:true});
        thumb.addEventListener('touchcancel', ()=>{
          if (twoFingerActive) { twoFingerActive = false; imgHoverOff(); hoverTextOff(); }
        }, {passive:true});
      } else {
        setImageIfChanged(tImg, imgSrc);
      }
    })();

    // data attributes for CSS badge and bookkeeping
    thumb.dataset.slot = String(idx);
    thumb.dataset.slotnum = `#${idx}`;

    // Long-press to preview (no ghost-click)
    function applyHoldToPreview(el, onConfirm){
      let t = null, fired = false;
      const HOLD_MS = 550;
      function suppressOnce(e){
        document.removeEventListener('click', suppressOnce, true);
        if (fired) { e.preventDefault(); e.stopPropagation(); }
        fired = false;
      }
      const start = () => {
        if (t) return;
        fired = false;
        t = setTimeout(() => {
          t = null;
          fired = true;
          document.addEventListener('click', suppressOnce, true);
          onConfirm();
        }, HOLD_MS);
      };
      const end = () => { if (t) { clearTimeout(t); t = null; } };
      el.addEventListener('pointerdown', start);
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('pointerleave', end);
    }

    // tap = edit, hold/right-click = fullscreen preview
    thumb.addEventListener('click', ()=> openEditor(idx));
    applyHoldToPreview(thumb, ()=> openFullscreenPreview(state[idx]));
    thumb.addEventListener('contextmenu', e=>{ e.preventDefault(); openFullscreenPreview(state[idx]); });

// --- image + mini + background (always show something) ---
const showMsg = (slot.mode==='message' || slot.mode==='both');
const showImg = (slot.mode==='image'   || slot.mode==='both');

// Always assign an image (real or placeholder) to both main and mini
const imgSrc = (slot.img && typeof slot.img === 'string') ? slot.img : PLACEHOLDER_WHITE_IMG;
setImageIfChanged(tImg,  imgSrc);
tImg.style.display = showImg ? 'block' : 'none';

setImageIfChanged(tMini, imgSrc);
tMini.style.display = 'block';

// Background: dark behind images, slot.bg otherwise
thumb.style.background = showImg ? '#111' : (slot.bg || DEFAULT_BG);

// text overlay
tText.textContent = slot.message || DEFAULT_MESSAGE;
tText.style.color = contrastText(slot.bg || DEFAULT_BG);
tText.style.display = showMsg ? 'flex' : 'none';
tText.classList.toggle('over-image', showImg && showMsg);

    // --- File-size badge (bottom-left) on the card thumbnail ---
    let sizeBytes = NaN;
    if (slot.img && slot.img !== PLACEHOLDER_WHITE_IMG) {
      sizeBytes = bytesFromDataURL(slot.img);
    }
    const sizeBadge = document.createElement('div');
    sizeBadge.className = 'thumb-size-badge';
    sizeBadge.textContent = formatKB(sizeBytes);
    thumb.appendChild(sizeBadge);
    gridEl.appendChild(node);
  });
  updateStorageTotalsUI();
}

let pendingImage = null; // holds unsaved image while editing

/* Editor open */
function openEditor(idx){
  editingIndex = idx;
  const slot = state[idx];
  pendingImage = slot.img;       
  originalSlot = JSON.parse(JSON.stringify(state[editingIndex])); // new baseline
  pendingImage = state[editingIndex].img;                         // keep session in sync

  editorSlot.textContent = `#${idx}`;
  fMessage.value = slot.message;
  fBg.value = slot.bg;
  fImage.value = '';

  modeMessage.checked = (slot.mode==='message');
  modeImage.checked   = (slot.mode==='image');
  modeBoth.checked    = (slot.mode==='both');

  fTextAnim.value = slot.textAnim;

  setDirty(false);
  refreshLivePreview(slot);
  clearDirty();
  editor.showModal();

}

let isDirty = false;

function markDirty() {
  if (!isDirty) {
    isDirty = true;
    document.getElementById('dirtyBadge').hidden = false;
  }
}
function clearDirty() {
  isDirty = false;
  document.getElementById('dirtyBadge').hidden = true;
}

function setDirty(isDirty){ dirtyBadge.hidden = !isDirty; }

function currentDraftFromFields(){
  const mode = modeMessage.checked ? 'message' : modeImage.checked ? 'image' : 'both';
  return {
    message: fMessage.value.trim() || DEFAULT_MESSAGE,
    bg: fBg.value || DEFAULT_BG,
    img: pendingImage ?? state[editingIndex]?.img ?? PLACEHOLDER_WHITE_IMG, // <-- key line
    mode,
    textAnim: fTextAnim.value
  };
}

function isDifferent(a, b){
  const sameImg = (a.img || '') === (b.img || '');
  return (
    a.message !== b.message ||
    a.bg      !== b.bg      ||
    a.mode    !== b.mode    ||
    a.textAnim!== b.textAnim ||
    !sameImg                                // <- new: track image changes
  );
}

/* Live preview */
function refreshLivePreview(slot){
  const showMsg = (slot.mode === 'message' || slot.mode === 'both');
  const showImg = (slot.mode === 'image'   || slot.mode === 'both');
  const isPlaceholder = !!slot.img && slot.img === PLACEHOLDER_WHITE_IMG;
  
  // 1) Set the big preview image and the mini preview
  setImageIfChanged(liveImage, slot.img || PLACEHOLDER_WHITE_IMG);
  if (liveMini) liveMini.src = slot.img || PLACEHOLDER_WHITE_IMG;
  
  // 2) Visibility: allow placeholder to be visible in the editor
  liveImage.style.display = showImg ? 'block' : 'none';
  liveText.style.display  = showMsg ? 'flex' : 'none';
  liveText.classList.toggle('over-image', showImg && showMsg);
  
  // ... inside refreshLivePreview(slot)    This is for Edit mode
const sizeEl = document.getElementById('editorFileSize');
if (sizeEl) {
  const hasRealImg = !!slot.img && slot.img !== PLACEHOLDER_WHITE_IMG;
  if (hasRealImg) {
    const bytes = bytesFromDataURL(slot.img);
    sizeEl.textContent = formatKB(bytes);
  } else {
    // sizeEl.textContent = '–';
    sizeEl.textContent = '0 KB';
  }
}

  // 3) Background + text styling
  livePreview.style.background = slot.bg;
  liveText.textContent = slot.message || DEFAULT_MESSAGE;
  liveText.style.color = contrastText(slot.bg);
  applyTextAnimClass(liveText, slot.textAnim);
}

/* Long-press helper */
function applyHoldToReset(el, onConfirm){
  let t = null;
  const HOLD_MS = 900;
  const start = () => {
    if (t) return;
    t = setTimeout(() => {
      t = null;
      // mark this element as having triggered a long-press
      el.dataset.longpress = '1';
      onConfirm();
      // clear the marker shortly after to allow future normal clicks
      setTimeout(() => { delete el.dataset.longpress; }, 300);
    }, HOLD_MS);
  };
  const end = () => { if (t) { clearTimeout(t); t = null; } };
  el.addEventListener('mousedown', start);
  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('mouseup', end);
  el.addEventListener('mouseleave', end);
  el.addEventListener('touchend', end);
  el.addEventListener('touchcancel', end);
}

/* File -> dataURL */
function fileToDataURL(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file);
  });
}

/* Listeners (now that all elements are defined) */
[fMessage, fBg, fTextAnim, modeMessage, modeImage, modeBoth].forEach(el=>{
  const onAny = ()=>{
    if (editingIndex == null) return;
    // keep your existing draft/preview logic if you have it:
    const draft = currentDraftFromFields();        // this still includes pendingImage
    refreshLivePreview({ ...state[editingIndex], ...draft });
    markDirty();                                   // <-- just mark dirty
  };
  el.addEventListener('input', onAny);
  el.addEventListener('change', onAny);
});

fImage.addEventListener('change', async ()=>{
  if (editingIndex == null) return;
  const file = fImage.files?.[0];

  if (!file) {
    pendingImage = PLACEHOLDER_WHITE_IMG;                 // <-- track cleared file
    const draft = { ...state[editingIndex], ...currentDraftFromFields(), img: pendingImage };
    setDirty(true);
    refreshLivePreview(draft);
    return;
  }

  const dataURL = await fileToDataURL(file);
  pendingImage = dataURL;                                 // <-- track new file
  // Auto-switch to "Show Image" for convenience
  modeImage.checked = true; modeMessage.checked = false; modeBoth.checked = false;

  const draft = { ...state[editingIndex], ...currentDraftFromFields(), img: pendingImage, mode: 'image' };
  setDirty(true);
  refreshLivePreview(draft);
});


/* Save / Cancel / Reset (editor) */
btnSave.addEventListener('click', (e)=>{
  e.preventDefault();
  if(editingIndex==null) return editor.close();

  const current = state[editingIndex];
  const file = fImage.files?.[0];
  const mode = modeMessage.checked ? 'message' : modeImage.checked ? 'image' : 'both';

  const finalize = (imgData)=>{
    state[editingIndex] = {
      message: fMessage.value.trim() || DEFAULT_MESSAGE,
      bg: fBg.value || DEFAULT_BG,
      img: pendingImage || imgData || current.img || PLACEHOLDER_WHITE_IMG, // <-- use pending image
      mode,
      textAnim: fTextAnim.value
    };
    saveAnimations(state);
    render();
    clearDirty();
    setDirty(false);
    editor.close();
  };

  if(file){ fileToDataURL(file).then(data=>finalize(data)); }
  else { finalize(undefined); }
});

btnCancel.addEventListener('click', (e)=>{ e.preventDefault(); editor.close(); });
applyHoldToReset(btnReset, ()=>{
  if(editingIndex==null) return;
  resetSlot(editingIndex);
  const slot = state[editingIndex];  
  pendingImage = slot.img;                      // <-- reset session image
  fMessage.value = slot.message;
  fBg.value = slot.bg;
  fImage.value = '';
  modeMessage.checked=true; modeImage.checked=false; modeBoth.checked=false;
  fTextAnim.value = slot.textAnim;
  markDirty();
  setDirty(false);
  refreshLivePreview(slot);
});

/* Reset a slot to defaults (used by card + editor) */
function resetSlot(idx){
  state[idx] = {
    message: DEFAULT_MESSAGE,
    bg: DEFAULT_BG,
    img: PLACEHOLDER_WHITE_IMG,
    mode: 'message',
    textAnim: 'flash'
  };
  saveAnimations(state);
  render();
  clearDirty();

}

/* Boot */
render();


// Fit the 10 cards to the viewport (tablet-first). Allows one vertical scroll on narrow screens.
(function(){
  const grid = document.getElementById('grid');
  const container = document.querySelector('.container');
  const COUNT = 10;

  function px(v){ return parseFloat(v) || 0; }

  function layoutGrid(){
    if (!grid || !container) return;

    const ccs = getComputedStyle(container);
    const gcs = getComputedStyle(grid);
    const padX = px(ccs.paddingLeft) + px(ccs.paddingRight);
    const padY = px(ccs.paddingTop)  + px(ccs.paddingBottom);
    const gap  = px(gcs.gap);

    const availW = container.clientWidth  - padX;
    const availH = container.clientHeight - padY;

    // If screen is narrow (e.g., phone landscape), allow one vertical scroll:
    const allowVerticalScroll = window.innerWidth < 800;

    let best = { cols: 1, width: 0, rows: COUNT };

    for (let cols = 1; cols <= COUNT; cols++) {
      const rows = Math.ceil(COUNT / cols);

      // width constraint
      const widthFit = (availW - gap * (cols - 1)) / cols;

      // height constraint (convert max cell height to width via 16:9)
      const maxCellH = (availH - gap * (rows - 1)) / rows;
      const heightFitWidth = allowVerticalScroll ? widthFit : maxCellH * (16/9);

      const cellW = Math.min(widthFit, heightFitWidth);
      if (cellW > best.width) best = { cols, width: Math.max(120, cellW), rows };
    }

    grid.style.gridTemplateColumns = `repeat(${best.cols}, ${best.width}px)`;
    // If we’re allowing vertical scroll, let container scroll; otherwise hide it.
    container.style.overflow = allowVerticalScroll ? 'auto' : 'hidden';
  }

  window.addEventListener('resize', layoutGrid);

  // Call after your existing render()
  const _render = render;
  render = function(){ _render(); layoutGrid(); };
  layoutGrid();
})();

// --- Function ---
  function openFullscreenPreview(slot){
  const showMsg = (slot.mode === 'message' || slot.mode === 'both');
  const showImg = (slot.mode === 'image'   || slot.mode === 'both');
  const imgSrc  = (slot.img && typeof slot.img === 'string') ? slot.img : PLACEHOLDER_WHITE_IMG;

  // background behind everything
  fsStage.style.background = showImg ? '#000' : (slot.bg || DEFAULT_BG);

  // image
  if (showImg) {
    if (fsImg.dataset.src !== imgSrc) { fsImg.dataset.src = imgSrc; fsImg.src = imgSrc; }
    fsImg.style.display = 'block';
  } else {
    fsImg.style.display = 'none';
  }

  // text
  fsText.textContent = slot.message || DEFAULT_MESSAGE;
  fsText.style.display = showMsg ? 'flex' : 'none';
  fsText.classList.toggle('over-image', showImg && showMsg);

  applyTextAnimClass(fsText, slot.textAnim);
  fs.classList.add('show');

  const onKey = (e)=>{ if(e.key === 'Escape') closeFullscreenPreview(); };
  window.addEventListener('keydown', onKey, { once:true });
  fs.onclick = closeFullscreenPreview;
}


function closeFullscreenPreview(){
  fs.classList.remove('show');
  fs.onclick = null;
}

(function(){
  const OVERLAY_MIN_W = 1024;
  const OVERLAY_MIN_H = 600;
  const overlay = document.getElementById('specOverlay');

  function checkSpec(){
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isLandscape = w >= h;
    const ok = isLandscape && (w >= OVERLAY_MIN_W) && (h >= OVERLAY_MIN_H);
    overlay.style.display = ok ? 'none' : 'flex';
  }

  window.addEventListener('resize', checkSpec);
  checkSpec();
})();

// // Format bytes -> "123 KB"   This is for Thumbnails page.
// function formatKB(bytes) {
//   return Number.isFinite(bytes) ? `${Math.round(bytes / 1024).toLocaleString()} KB` : '0 KB';
// }

// function bytesFromDataURL(dataURL) {
//   try {
//     const i = dataURL.indexOf(',');
//     if (i < 0) return NaN;
//     return atob(dataURL.slice(i + 1)).length; // decoded bytes
//   } catch { return NaN; }
// }

// function bytesFromDataURL(dataURL) {
//   try { const i = dataURL.indexOf(','); if (i < 0) return NaN; return atob(dataURL.slice(i+1)).length; }
//   catch { return NaN; }
// }
// function formatKB(bytes) {
//   return Number.isFinite(bytes) ? `${Math.round(bytes/1024).toLocaleString()} KB` : '0 KB';
// }
// function computeStorageTotals(slotsArr) {
//   let anim = 0, total = 0;
//   for (const s of (slotsArr || [])) {
//     const img = s && s.img;
//     if (!img || img === PLACEHOLDER_WHITE_IMG || typeof img !== 'string' || !img.startsWith('data:')) continue;
//     const bytes = bytesFromDataURL(img);
//     total += bytes;
//     if (/^data:(image\/gif|image\/apng|video\/)/i.test(img)) anim += bytes;
//   }
//   return { anim, total };
// }
// function updateStorageTotalsUI() {
//   const { anim, total } = computeStorageTotals(slots);
//   const a = document.getElementById('animTotal');
//   const o = document.getElementById('overallTotal');
//   if (a) a.textContent = formatKB(anim);
//   if (o) o.textContent = formatKB(total);
// }
