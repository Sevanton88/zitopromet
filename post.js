// Article pages (post-*.html): share links, copy-link button and the reading
// progress bar. Loaded after script.js (needs i18nT) and after the markup it
// targets, at the end of <body>. Page-specific EN strings stay in each page's
// own i18n dictionary.
(function(){
  var pageUrl = encodeURIComponent(window.location.href);
  var fb = document.querySelector('.share-fb');
  var li = document.querySelector('.share-li');
  var x = document.querySelector('.share-x');
  var wa = document.querySelector('.share-wa');
  var copyBtn = document.querySelector('.share-copy');
  if(fb) fb.href = 'https://www.facebook.com/sharer/sharer.php?u=' + pageUrl;
  if(li) li.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + pageUrl;
  function setTitleLinks(){
    var pageTitle = encodeURIComponent(document.title);
    if(x) x.href = 'https://twitter.com/intent/tweet?url=' + pageUrl + '&text=' + pageTitle;
    if(wa) wa.href = 'https://wa.me/?text=' + pageTitle + '%20' + pageUrl;
  }
  setTitleLinks();
  document.addEventListener('langchange', setTitleLinks);
  if(copyBtn){
    copyBtn.addEventListener('click', function(){
      navigator.clipboard.writeText(window.location.href).then(function(){
        var tip = copyBtn.querySelector('.copied-tip');
        if(tip){ tip.classList.add('show'); }
        copyBtn.setAttribute('aria-label', i18nT('share.copied', 'Kopirano!'));
        setTimeout(function(){
          if(tip){ tip.classList.remove('show'); }
          copyBtn.setAttribute('aria-label', i18nT('share.copy', 'Kopiraj link'));
        }, 1600);
      });
    });
  }
})();

(function(){
  var bar = document.querySelector('.read-progress');
  var body = document.querySelector('.post-body');
  if(!bar || !body) return;
  function update(){
    var rect = body.getBoundingClientRect();
    var pct = (window.innerHeight - rect.top) / (rect.height + window.innerHeight) * 100;
    bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
  }
  window.addEventListener('scroll', update, { passive:true });
  update();
})();
