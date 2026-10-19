
(function () {
  'use strict';
  if (!window.SWEET_PREVIEW) return;

  var code = new URLSearchParams(window.location.search).get('code') || 'builder';
  var KEY = 'DG_SWEET_PREVIEW_' + code;

  function assetUrl(value) {
    value = String(value || '').trim();
    if (!value) return '';
    if (/^(?:blob:|data:|https?:\/\/|\/)/i.test(value)) return value;
    try { return new URL('../' + value.replace(/^\.\//, ''), window.location.href).href; }
    catch (e) { return '../' + value; }
  }

  function split(value, re) {
    return String(value || '').split(re).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function fromBuilder(p) {
    p = p || {};
    var base = window.SWEET_DATA || { intro: {}, book: { pages: [] }, final: {} };
    var photos = (Array.isArray(p.photos) ? p.photos : []).filter(Boolean).map(assetUrl).slice(0, 10);
    var texts = Array.isArray(p.sweet_pages)
      ? p.sweet_pages.map(function (t) { return String(t || '').trim(); })
      : split(p.message, /\r\n|\r|\n/);
    if (Array.isArray(p.sweet_pages) && photos.length) texts = texts.slice(0, photos.length);
    var count = Math.min(10, Math.max(texts.length, photos.length, 1));
    var pages = [];
    for (var i = 0; i < count; i++) {
      var page = { pageNumber: i + 1, text: texts[i] || '' };
      if (photos[i]) page.image = photos[i];
      pages.push(page);
    }
    if (!texts.filter(Boolean).length && !photos.length) pages = base.book.pages;
    var wishes = split(p.wishes, /[·\n\r|]+/);
    return {
      intro: {
        topic: String(p.popup_title || '').trim() || 'Happy Valentine',
        recipientName: String(p.recipient_name || '').trim(),
        backgroundMusic: { type: 'file', url: assetUrl(p.music_url) || (base.intro.backgroundMusic || {}).url }
      },
      book: { pages: pages },
      final: { enabled: base.final.enabled !== false, wishes: wishes.length ? wishes.slice(0, 12) : base.final.wishes }
    };
  }

  try {
    var saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (saved && saved.intro) window.SWEET_DATA = saved;
  } catch (e) {}

  var timer = 0;
  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin || !event.data || event.data.type !== 'DG_LIVE_PREVIEW_UPDATE') return;
    var serialized = JSON.stringify(fromBuilder(event.data.payload));
    try { if (sessionStorage.getItem(KEY) === serialized) return; } catch (e) {}
    clearTimeout(timer);
    timer = setTimeout(function () {
      try { sessionStorage.setItem(KEY, serialized); } catch (e) {}
      window.location.reload();
    }, 500);
  });

  if (window.parent && window.parent !== window) {
    setTimeout(function () {
      window.parent.postMessage({ type: 'DG_PREVIEW_READY' }, window.location.origin);
    }, 0);
  }
})();
