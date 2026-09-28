// Žitopromet Kikinda — shared behavior, loaded on all 5 pages before any
// page-specific inline <script> (see CLAUDE.md "Architecture" for why: pages
// reference `reduced`/`revealEls`/etc. from this file's shared scope).
const nav = document.getElementById('siteNav');
window.addEventListener('scroll', ()=> nav.classList.toggle('scrolled', window.scrollY > 30));

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealSelectors = '.reveal,.reveal-rotate,.reveal-left,.reveal-right,.clip-reveal,.clip-reveal-r,.pop';
const revealEls = document.querySelectorAll(revealSelectors);
if(reduced){
  revealEls.forEach(el=> el.classList.add('in'));
} else {
  const pendingReveal = new Set(revealEls);
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){ entry.target.classList.add('in'); pendingReveal.delete(entry.target); io.unobserve(entry.target); }
    });
  }, { threshold:0.15, rootMargin:'0px 0px -60px 0px' });
  revealEls.forEach(el=> io.observe(el));

  // safety net: IntersectionObserver has occasionally missed elements using
  // clip-path-based reveals (.clip-reveal/.clip-reveal-r) — recheck on scroll.
  function revealFallback(){
    if(!pendingReveal.size){ window.removeEventListener('scroll', revealFallback); return; }
    pendingReveal.forEach(el=>{
      const r = el.getBoundingClientRect();
      if(r.top < window.innerHeight - 60 && r.bottom > 0){
        el.classList.add('in'); io.unobserve(el); pendingReveal.delete(el);
      }
    });
  }
  window.addEventListener('scroll', revealFallback, { passive:true });
  revealFallback();
}

// ---- language switcher (SR/EN) ----
// Serbian is the source language and lives ONLY in the HTML: each page passes a
// dictionary with just `en: {...}`, and the Serbian text of every tagged element
// is captured from the DOM the first time it is swapped. So editing Serbian copy
// never touches a dictionary — only the English string needs a matching edit.
//   data-i18n="key"                  -> replaces textContent
//   data-i18n-html="key"             -> replaces innerHTML (for text with inline markup)
//   data-i18n-attr="attr:key,..."    -> replaces attributes (aria-label, alt, ...)
// A key missing from the EN dictionary falls back to the Serbian original.
const LANG_STORAGE_KEY = 'zitopromet-lang';
let i18nDict = { en:{} };
let currentLang = 'sr';
const srOriginals = new WeakMap();
let srTitle = null, srDesc = null;

function i18nT(key, srFallback){
  const en = i18nDict.en || {};
  return currentLang === 'en' && en[key] != null ? en[key] : srFallback;
}

function applyLang(lang){
  currentLang = lang;
  const en = lang === 'en' ? (i18nDict.en || {}) : null;
  const orig = (el)=>{ if(!srOriginals.has(el)) srOriginals.set(el, {}); return srOriginals.get(el); };

  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const o = orig(el);
    if(o.text === undefined) o.text = el.textContent;
    const v = en && en[el.dataset.i18n];
    el.textContent = v != null ? v : o.text;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el=>{
    const o = orig(el);
    if(o.html === undefined) o.html = el.innerHTML;
    const v = en && en[el.dataset.i18nHtml];
    el.innerHTML = v != null ? v : o.html;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(el=>{
    const o = orig(el);
    o.attrs = o.attrs || {};
    el.dataset.i18nAttr.split(',').forEach(pair=>{
      const [attr, key] = pair.split(':').map(s=> s.trim());
      if(o.attrs[attr] === undefined) o.attrs[attr] = el.getAttribute(attr);
      const v = en && en[key];
      el.setAttribute(attr, v != null ? v : o.attrs[attr]);
    });
  });

  const descEl = document.querySelector('meta[name="description"]');
  if(srTitle === null){ srTitle = document.title; srDesc = descEl ? descEl.content : null; }
  document.title = (en && en['meta.title']) || srTitle;
  if(descEl && srDesc !== null) descEl.content = (en && en['meta.desc']) || srDesc;

  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(b=> b.classList.toggle('active', b.dataset.lang === lang));
  try{ localStorage.setItem(LANG_STORAGE_KEY, lang); }catch(e){}
  document.dispatchEvent(new CustomEvent('langchange', { detail:{ lang } }));
}

function initLangSwitcher(i18n){
  i18nDict = i18n;
  document.querySelectorAll('.lang-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> applyLang(btn.dataset.lang));
  });
  let saved = null;
  try{ saved = localStorage.getItem(LANG_STORAGE_KEY); }catch(e){}
  if(saved === 'en'){
    // wait for the full document so elements below this script (modal etc.) are included
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=> applyLang('en'));
    else applyLang('en');
  }
}

(function(){
  const navToggle = document.getElementById('navToggle');
  const navLinksEl = document.getElementById('navLinks');
  if(!navToggle || !navLinksEl) return;
  function closeNavMenu(){
    navLinksEl.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleNavMenu(){
    const isOpen = navLinksEl.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  }
  navToggle.addEventListener('click', toggleNavMenu);
  navLinksEl.querySelectorAll('a').forEach(a=> a.addEventListener('click', closeNavMenu));
  document.addEventListener('click', (e)=>{
    if(!navLinksEl.classList.contains('open')) return;
    if(navLinksEl.contains(e.target) || navToggle.contains(e.target)) return;
    closeNavMenu();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && navLinksEl.classList.contains('open')){ closeNavMenu(); navToggle.focus(); }
  });
})();

// deferred to DOMContentLoaded — #backToTopBtn's markup sits after this
// <script src> in every page's document order, so it doesn't exist yet when
// the rest of this file runs synchronously (unlike nav/revealEls/etc. above,
// which are all above this script tag).
document.addEventListener('DOMContentLoaded', function(){
  const btn = document.getElementById('backToTopBtn');
  if(!btn) return;
  function onScroll(){
    if(window.scrollY > 300 || document.documentElement.scrollTop > 300){
      btn.style.opacity = '1'; btn.style.visibility = 'visible'; btn.style.transform = 'translateY(0)';
    } else {
      btn.style.opacity = '0'; btn.style.visibility = 'hidden'; btn.style.transform = 'translateY(10px)';
    }
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  btn.addEventListener('click', function(){ window.scrollTo({ top:0, left:0, behavior:'smooth' }); });
  onScroll();
});
