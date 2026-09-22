(function () {
  'use strict';

  var doc = document;

  function getMenu(btn) {
    return btn.parentNode.querySelector('.dropdown-menu');
  }

  function openMenu(btn, menu) {
    var btnRect = btn.getBoundingClientRect();
    var margin = 8;
    var menuWidth = menu.offsetWidth || 190;
    var menuHeight = menu.offsetHeight || 200;
    var viewportW = window.innerWidth || doc.documentElement.clientWidth;
    var viewportH = window.innerHeight || doc.documentElement.clientHeight;

    var left = btnRect.right;
    if (left + menuWidth > viewportW - margin) {
      left = btnRect.left - menuWidth;
    }
    if (left < margin) {
      left = btnRect.right;
    }

    var top = btnRect.top;
    if (top + menuHeight > viewportH - margin) {
      top = Math.max(margin, btnRect.bottom - menuHeight);
    }
    if (top < margin) {
      top = margin;
    }

    menu.style.position = 'fixed';
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
    menu.style.display = 'block';
    menu.style.zIndex = '1080';
    btn.closest('.dropdown').setAttribute('data-fd-open', '1');
  }

  function closeMenu(dropdown) {
    var menu = dropdown.querySelector('.dropdown-menu');
    if (!menu) return;
    menu.style.position = '';
    menu.style.top = '';
    menu.style.left = '';
    menu.style.display = '';
    menu.style.zIndex = '';
    dropdown.removeAttribute('data-fd-open');
  }

  function closeAll(exceptDropdown) {
    var open = doc.querySelectorAll('.dropdown[data-fd-open]');
    for (var i = 0; i < open.length; i++) {
      if (open[i] !== exceptDropdown) {
        closeMenu(open[i]);
      }
    }
  }

  function findFunctionButton(target) {
    if (!target || !target.closest) return null;
    var btn = target.closest('.dropdown > button');
    if (!btn) return null;
    if (btn.hasAttribute('data-bs-toggle')) return null;
    if (btn.classList.contains('tc-function-btn')) return null;
    if (!btn.querySelector('.ti.tabler-dots-vertical')) return null;
    return btn;
  }

  doc.addEventListener('click', function (e) {
    var btn = findFunctionButton(e.target);
    if (btn) {
      e.preventDefault();
      var dropdown = btn.closest('.dropdown');
      if (dropdown.hasAttribute('data-fd-open')) {
        closeAll(null);
      }
      else {
        closeAll(null);
        openMenu(btn, getMenu(btn));
      }
      return;
    }
    closeAll(null);
  });

  doc.addEventListener('keydown', function (e) {
    if (e.which === 27 || e.key === 'Escape') {
      closeAll(null);
    }
  });
})();
