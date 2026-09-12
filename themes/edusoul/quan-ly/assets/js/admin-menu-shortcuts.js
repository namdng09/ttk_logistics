(function () {
  'use strict';

  var flushCacheSelector = 'a.admin-menu-destination[href*="/admin_menu/flush-cache"]';

  document.addEventListener('keydown', function (event) {
    var isFlushShortcut = event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey &&
      (event.code === 'KeyU' || String(event.key || '').toLowerCase() === 'u');

    if (!isFlushShortcut || event.repeat) return;

    var flushCacheLink = document.querySelector(flushCacheSelector);
    if (!flushCacheLink) return;

    // Chặn menu File của trình duyệt trước khi kích hoạt đúng link Admin Menu.
    event.preventDefault();
    event.stopImmediatePropagation();
    flushCacheLink.click();
  }, true);
})();
