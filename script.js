/* =============================================================
   ARCHANA SALES – Main JavaScript  (v2)
   Navigation · hero slider · scroll reveal · counters ·
   gallery filter + lightbox · progress bar · back-to-top
   ============================================================= */
(function () {
  'use strict';

  var REDUCED = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- tiny helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); }


  /* =============================================================
     1. PAGE LOADER
     ============================================================= */
  function initPreloader() {
    var pre = $('#preloader');
    if (!pre) return;
    function hide() {
      pre.classList.add('hidden');
      setTimeout(function () { if (pre.parentNode) pre.parentNode.removeChild(pre); }, 600);
    }
    if (document.readyState === 'complete') { setTimeout(hide, 250); }
    else { on(window, 'load', function () { setTimeout(hide, 250); }); }
    // Safety net — never leave the page hidden behind the loader
    setTimeout(hide, 4000);
  }


  /* =============================================================
     2. NAVIGATION  (hamburger, shrink-on-scroll, active link)
     ============================================================= */
  function initNav() {
    var nav       = $('nav');
    var hamburger = $('.hamburger');
    var navLinks  = $('.nav-links');

    if (hamburger && navLinks) {
      hamburger.setAttribute('aria-label', 'Toggle navigation menu');
      hamburger.setAttribute('aria-expanded', 'false');

      function setMenu(open) {
        navLinks.classList.toggle('open', open);
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        var icon = hamburger.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-bars', !open);
          icon.classList.toggle('fa-times', open);
        }
      }

      on(hamburger, 'click', function (e) {
        e.stopPropagation();
        setMenu(!navLinks.classList.contains('open'));
      });
      on(document, 'click', function (e) {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) setMenu(false);
      });
      on(document, 'keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
      // Close after tapping a link on mobile
      $$('a', navLinks).forEach(function (a) { on(a, 'click', function () { setMenu(false); }); });
    }

    /* Dropdown submenus ("Who We Are").
       Desktop opens on hover via CSS; on touch/mobile the caret button
       toggles the panel so the parent link stays tappable. */
    if (navLinks) {
      $$('.has-sub', navLinks).forEach(function (item) {
        var toggle = $('.sub-toggle', item);
        if (!toggle) return;
        function setSub(open) {
          item.classList.toggle('open', open);
          toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        on(toggle, 'click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var willOpen = !item.classList.contains('open');
          $$('.has-sub', navLinks).forEach(function (o) {
            if (o !== item) {
              o.classList.remove('open');
              var t = $('.sub-toggle', o);
              if (t) t.setAttribute('aria-expanded', 'false');
            }
          });
          setSub(willOpen);
        });
        /* Keep the current section's submenu open on load — mobile only,
           where the panel is an accordion rather than a hover dropdown. */
        function syncOpenState() {
          var mobile = getComputedStyle(toggle).display !== 'none';
          if (mobile && item.classList.contains('has-sub-active')) setSub(true);
          else if (!mobile) setSub(false);
        }
        syncOpenState();
        on(window, 'resize', syncOpenState);
      });
      on(document, 'click', function (e) {
        if (navLinks.contains(e.target)) return;
        $$('.has-sub', navLinks).forEach(function (o) {
          o.classList.remove('open');
          var t = $('.sub-toggle', o);
          if (t) t.setAttribute('aria-expanded', 'false');
        });
      });
    }

    /* Active link for the current page */
    var page = window.location.pathname.split('/').pop() || 'index.html';
    $$('.nav-links a').forEach(function (link) {
      var href = (link.getAttribute('href') || '').split('#')[0];
      if (!href) return;
      if (href === page || (page === 'index.html' && href === 'index.html')) {
        link.classList.add('active');
        var parentItem = link.closest ? link.closest('.has-sub') : null;
        if (parentItem) {
          parentItem.classList.add('has-sub-active');
          var pl = $('.sub-parent', parentItem);
          if (pl) pl.classList.add('active');
        }
      }
    });

    /* Shrink + shadow on scroll */
    if (nav) {
      var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 40); };
      on(window, 'scroll', onScroll, { passive: true });
      onScroll();
    }
  }


  /* =============================================================
     3. SCROLL PROGRESS BAR + BACK TO TOP
     ============================================================= */
  function initScrollUI() {
    var bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.appendChild(bar);

    var btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(btn);
    on(btn, 'click', function () {
      window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    });

    var ticking = false;
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = pct + '%';
      btn.classList.toggle('show', window.scrollY > 500);
      ticking = false;
    }
    on(window, 'scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }


  /* =============================================================
     4. SCROLL REVEAL  (staggered, one-shot)
     ============================================================= */
  var REVEAL_MAP = [
    ['.brand-card',      'up'],
    ['.product-card',    'up'],
    ['.why-card',        'up'],
    ['.value-card',      'zoom'],
    ['.team-card',       'up'],
    ['.client-card',     'zoom'],
    ['.testi-card',      'up'],
    ['.gallery-item',    'zoom'],
    ['.job-card',        'up'],
    ['.section-header',  'up'],
    ['.contact-method',  'left'],
    ['.enquiry-form',    'right'],
    ['.about-img-block', 'left'],
    ['.about-text',      'right'],
    ['.story-step',      'up'],
    ['.highlight-item',  'up'],
    ['.stat-item',       'up'],
    ['.map-embed',       'zoom'],
    ['.contact-info-block', 'left']
  ];

  function initReveal() {
    // Tag elements that have not been tagged by hand in the markup
    REVEAL_MAP.forEach(function (pair) {
      $$(pair[0]).forEach(function (el) {
        if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', pair[1]);
      });
    });

    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (REDUCED || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    // Stagger siblings inside the same parent
    var groups = new Map();
    items.forEach(function (el) {
      var p = el.parentNode;
      if (!groups.has(p)) groups.set(p, 0);
      var i = groups.get(p);
      if (!el.style.getPropertyValue('--reveal-delay')) {
        el.style.setProperty('--reveal-delay', Math.min(i, 6) * 80 + 'ms');
      }
      groups.set(p, i + 1);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { io.observe(el); });

    // Anything already above the fold on load
    setTimeout(function () {
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
      });
    }, 60);
  }


  /* =============================================================
     5. HERO SLIDER
     ============================================================= */
  function initSlider() {
    var slider = $('.hero-slider');
    if (!slider) return;
    var slides = $$('.slide', slider);
    var dots   = $$('.slider-dot', slider);
    if (!slides.length) return;

    var DURATION = 6000;                       // still-image slides
    var current = 0, rafId = null, startedAt = 0, elapsed = 0, paused = false;

    /* Progress bar under the slider */
    var prog = $('.slider-progress', slider);
    if (!prog) {
      prog = document.createElement('div');
      prog.className = 'slider-progress';
      slider.appendChild(prog);
    }

    /* ---- video slide wiring ------------------------------------ */
    var video      = $('.slide-video-el', slider);
    var videoSlide = $('[data-video-slide]', slider);
    var soundBtn   = $('.video-sound-toggle', slider);
    var videoOK    = !!(video && videoSlide) && !REDUCED;

    function isVideoSlide(i) { return videoOK && slides[i] === videoSlide; }

    if (!videoOK && soundBtn) soundBtn.style.display = 'none';

    if (videoOK) {
      video.muted = true;                       // required for autoplay
      video.setAttribute('muted', '');
      video.loop = false;

      /* Video finished → advance to the next slide */
      on(video, 'ended', function () { if (isVideoSlide(current)) next(); });

      /* Progress bar follows playback position */
      on(video, 'timeupdate', function () {
        if (!isVideoSlide(current)) return;
        var d = video.duration;
        if (d && isFinite(d) && d > 0) {
          prog.style.width = Math.min(video.currentTime / d, 1) * 100 + '%';
        }
      });

      /* If the file can't load or playback stalls for good, don't strand
         the visitor on a dead slide — fall back to the timed advance. */
      var stallTimer = null;
      function armStallGuard() {
        clearTimeout(stallTimer);
        stallTimer = setTimeout(function () {
          if (isVideoSlide(current) && (video.paused || video.readyState < 2)) next();
        }, 9000);
      }
      function disarmStallGuard() { clearTimeout(stallTimer); }
      on(video, 'playing', disarmStallGuard);
      on(video, 'error',   function () { if (isVideoSlide(current)) next(); });
      on(video, 'stalled', function () { if (isVideoSlide(current)) armStallGuard(); });
      video._armStallGuard = armStallGuard;

      /* Sound toggle */
      if (soundBtn) {
        on(soundBtn, 'click', function (e) {
          e.stopPropagation();
          video.muted = !video.muted;
          var icon = soundBtn.querySelector('i');
          if (icon) icon.className = video.muted ? 'fas fa-volume-xmark' : 'fas fa-volume-high';
          soundBtn.setAttribute('aria-pressed', video.muted ? 'false' : 'true');
          soundBtn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
          soundBtn.setAttribute('title',      video.muted ? 'Unmute video' : 'Mute video');
          if (!video.muted && video.paused) safePlay();
        });
      }
    }

    function safePlay() {
      if (!videoOK) return;
      try {
        var pr = video.play();
        if (pr && typeof pr.catch === 'function') {
          pr.catch(function () {
            /* Autoplay blocked (rare when muted) — keep the poster visible
               and hand the slide over to the normal timer instead. */
            startTimer(DURATION);
          });
        }
      } catch (err) { startTimer(DURATION); }
    }

    slides.forEach(function (s, i) {
      s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });
    dots.forEach(function (d, i) {
      d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      d.setAttribute('type', 'button');
    });

    function show(index) {
      var prevIndex = current;
      current = (index + slides.length) % slides.length;

      slides.forEach(function (s, i) {
        s.classList.toggle('active', i === current);
        s.setAttribute('aria-hidden', i === current ? 'false' : 'true');
      });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });

      /* Leaving the video slide: stop and rewind so it always starts
         from the top the next time round. */
      if (videoOK && isVideoSlide(prevIndex) && prevIndex !== current) {
        try { video.pause(); video.currentTime = 0; } catch (e) {}
      }

      restart();
    }
    function next() { show(current + 1); }
    function prev() { show(current - 1); }

    function stopTimer() {
      if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }
    }

    function tick(now) {
      if (paused) { startedAt = now - elapsed; }
      else {
        elapsed = now - startedAt;
        prog.style.width = Math.min(elapsed / DURATION, 1) * 100 + '%';
        if (elapsed >= DURATION) { next(); return; }
      }
      rafId = window.requestAnimationFrame(tick);
    }

    function startTimer() {
      stopTimer();
      if (REDUCED || slides.length < 2) { prog.style.width = '0%'; return; }
      elapsed = 0;
      startedAt = performance.now();
      rafId = window.requestAnimationFrame(tick);
    }

    function restart() {
      stopTimer();
      prog.style.width = '0%';

      if (isVideoSlide(current)) {
        /* The video drives its own timing — it plays right through and
           advances on `ended`. No hover pause, no auto-timer. */
        try { video.currentTime = 0; } catch (e) {}
        if (video.preload !== 'auto') { video.preload = 'auto'; try { video.load(); } catch (e) {} }
        safePlay();
        if (video._armStallGuard) video._armStallGuard();
        return;
      }
      startTimer();
    }

    dots.forEach(function (d, i) { on(d, 'click', function () { show(i); }); });
    on($('.slider-prev', slider), 'click', prev);
    on($('.slider-next', slider), 'click', next);

    /* Hover pauses the still slides only — the film keeps playing. */
    on(slider, 'mouseenter', function () { paused = true; });
    on(slider, 'mouseleave', function () { paused = false; });

    /* Background tabs: pause everything, resume on return. */
    on(document, 'visibilitychange', function () {
      paused = document.hidden;
      if (!videoOK) return;
      if (document.hidden) { try { video.pause(); } catch (e) {} }
      else if (isVideoSlide(current)) { safePlay(); }
    });

    /* Keyboard */
    on(document, 'keydown', function (e) {
      if (e.target.matches('input, textarea, select')) return;
      var r = slider.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    });

    /* Touch / swipe */
    var tx = 0, ty = 0;
    on(slider, 'touchstart', function (e) {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    }, { passive: true });
    on(slider, 'touchend', function (e) {
      var dx = tx - e.changedTouches[0].clientX;
      var dy = ty - e.changedTouches[0].clientY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { dx > 0 ? next() : prev(); }
    }, { passive: true });

    show(0);
  }


  /* =============================================================
     5b. ASIAN PAINTS PPG SLIDER
     ============================================================= */
  function initPpgSlider() {
    var slider = $('.ppg-slider');
    if (!slider) return;
    var slides = $$('.ppg-slide', slider);
    var dots   = $$('.ppg-dot', slider);
    var prog   = $('.ppg-progress', slider);
    if (slides.length < 1) return;

    var DURATION = 7000;
    var current = 0, rafId = null, startedAt = 0, elapsed = 0, paused = false, visible = true;

    slides.forEach(function (s, i) { s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true'); });

    function show(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        s.classList.toggle('active', n === current);
        s.setAttribute('aria-hidden', n === current ? 'false' : 'true');
      });
      dots.forEach(function (d, n) { d.classList.toggle('active', n === current); });
      restart();
    }
    function next() { show(current + 1); }
    function prev() { show(current - 1); }

    function tick(now) {
      if (paused || !visible) { startedAt = now - elapsed; }
      else {
        elapsed = now - startedAt;
        if (prog) prog.style.width = Math.min(elapsed / DURATION, 1) * 100 + '%';
        if (elapsed >= DURATION) { next(); return; }
      }
      rafId = window.requestAnimationFrame(tick);
    }
    function restart() {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (REDUCED || slides.length < 2) { if (prog) prog.style.width = '0%'; return; }
      elapsed = 0;
      startedAt = performance.now();
      rafId = window.requestAnimationFrame(tick);
    }

    dots.forEach(function (d, i) { on(d, 'click', function () { show(i); }); });
    on($('.ppg-prev', slider), 'click', prev);
    on($('.ppg-next', slider), 'click', next);
    on(slider, 'mouseenter', function () { paused = true; });
    on(slider, 'mouseleave', function () { paused = false; });
    on(document, 'visibilitychange', function () { paused = document.hidden; });

    /* Only run the timer while the section is actually on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.15 }).observe(slider);
    }

    /* Touch / swipe */
    var tx = 0, ty = 0;
    on(slider, 'touchstart', function (e) {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    }, { passive: true });
    on(slider, 'touchend', function (e) {
      var dx = tx - e.changedTouches[0].clientX;
      var dy = ty - e.changedTouches[0].clientY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { dx > 0 ? next() : prev(); }
    }, { passive: true });

    /* "Enquire" buttons are wired globally — see initPpgEnquire(). */
    if (false) $$('.ppg-enquire', slider).forEach(function (btn) {
      on(btn, 'click', function (e) {
        e.preventDefault();
        var want = btn.getAttribute('data-ppg-product') || '';
        var sel  = document.getElementById('enq-product');
        if (sel) {
          var match = Array.prototype.filter.call(sel.options, function (o) {
            return o.text.toLowerCase().indexOf(want.toLowerCase()) > -1;
          })[0];
          if (!match) {
            /* fall back to any Asian Paints PPG option */
            match = Array.prototype.filter.call(sel.options, function (o) {
              return o.text.toLowerCase().indexOf('ppg') > -1;
            })[0];
          }
          if (match) {
            sel.value = match.value;
            if (typeof Event === 'function') sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        var target = document.getElementById('order');
        if (target) {
          var navH = ($('nav') ? $('nav').offsetHeight : 0) + 12;
          var top = target.getBoundingClientRect().top + window.scrollY - navH;
          window.scrollTo({ top: top, behavior: REDUCED ? 'auto' : 'smooth' });
        }
      });
    });

    show(0);
  }


  /* =============================================================
     5c. ASIAN PAINTS PPG — "Enquire" buttons (anywhere on the page)
     ============================================================= */
  function initPpgEnquire() {
    var btns = $$('.ppg-enquire');
    if (!btns.length) return;
    btns.forEach(function (btn) {
      on(btn, 'click', function (e) {
        e.preventDefault();
        var want = btn.getAttribute('data-ppg-product') || '';
        var sel  = document.getElementById('enq-product');
        if (sel) {
          var match = Array.prototype.filter.call(sel.options, function (o) {
            return o.text.toLowerCase().indexOf(want.toLowerCase()) > -1;
          })[0];
          if (!match) {
            match = Array.prototype.filter.call(sel.options, function (o) {
              return o.text.toLowerCase().indexOf('ppg') > -1;
            })[0];
          }
          if (match) {
            sel.value = match.value;
            if (typeof Event === 'function') sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        var target = document.getElementById('order');
        if (target) {
          var navH = ($('nav') ? $('nav').offsetHeight : 0) + 12;
          var top = target.getBoundingClientRect().top + window.scrollY - navH;
          window.scrollTo({ top: top, behavior: REDUCED ? 'auto' : 'smooth' });
        }
      });
    });
  }


  /* =============================================================
     6. COUNTERS  (eased, runs once)
     ============================================================= */
  function initCounters() {
    var nums = $$('.stat-number[data-target]');
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.dataset.target) || 0;
      var suffix = el.dataset.suffix || '';
      if (REDUCED) { el.textContent = target + suffix; return; }
      var dur = 1600, t0 = null;
      function step(now) {
        if (!t0) t0 = now;
        var p = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);           // easeOutCubic
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { el.textContent = '0' + (el.dataset.suffix || ''); io.observe(el); });
  }


  /* =============================================================
     7. GALLERY FILTER
     ============================================================= */
  function initGalleryFilter() {
    var btns  = $$('.filter-btn');
    var items = $$('.gallery-item');
    if (!btns.length || !items.length) return;

    btns.forEach(function (btn) {
      on(btn, 'click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        var filter = btn.dataset.filter;

        items.forEach(function (item) {
          var match = (filter === 'all' || item.dataset.category === filter);
          item.classList.toggle('hide', !match);
          if (match && !REDUCED) {
            item.style.animation = 'none';
            void item.offsetWidth;                     // force reflow
            item.style.animation = 'heroIn .45s var(--ease-out)';
          }
        });
        // Keep the lightbox list in sync with what is visible
        if (window.__rebuildLightbox) window.__rebuildLightbox();
      });
    });
  }


  /* =============================================================
     8. GALLERY LIGHTBOX  (images + legacy icon cards)
     ============================================================= */
  function initLightbox() {
    var lightbox = $('#lightbox');
    if (!lightbox) return;

    var media  = $('#lb-media', lightbox);
    var icon   = $('#lb-icon', lightbox);
    var title  = $('#lb-title', lightbox);
    var desc   = $('#lb-desc', lightbox);
    var count  = $('#lb-count', lightbox);
    var closeB = $('#lightbox-close', lightbox);
    var prevB  = $('.lb-prev', lightbox);
    var nextB  = $('.lb-next', lightbox);

    var list = [], index = 0;

    function rebuild() {
      list = $$('.gallery-item').filter(function (el) { return !el.classList.contains('hide'); });
    }
    window.__rebuildLightbox = rebuild;

    function render() {
      var item = list[index];
      if (!item) return;
      var img = item.querySelector('img');
      if (media) {
        if (img) {
          media.src = img.getAttribute('src');
          media.alt = img.getAttribute('alt') || '';
          media.style.display = '';
          if (icon) icon.style.display = 'none';
        } else {
          media.removeAttribute('src');
          media.style.display = 'none';
          if (icon) { icon.style.display = ''; icon.textContent = item.dataset.icon || '🏢'; }
        }
      }
      if (title) title.textContent = item.dataset.title || (img && img.alt) || '';
      if (desc)  desc.textContent  = item.dataset.desc || '';
      if (count) count.textContent = (index + 1) + ' / ' + list.length;
    }

    function open(item) {
      rebuild();
      index = Math.max(0, list.indexOf(item));
      render();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (closeB) closeB.focus();
    }
    function close() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
    function step(d) {
      if (!list.length) return;
      index = (index + d + list.length) % list.length;
      render();
    }

    $$('.gallery-item').forEach(function (item) {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      on(item, 'click', function () { open(item); });
      on(item, 'keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(item); }
      });
    });

    on(closeB, 'click', close);
    on(prevB, 'click', function (e) { e.stopPropagation(); step(-1); });
    on(nextB, 'click', function (e) { e.stopPropagation(); step(1); });
    on(lightbox, 'click', function (e) { if (e.target === lightbox) close(); });
    on(document, 'keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape')     close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft')  step(-1);
    });

    rebuild();
  }


  /* =============================================================
     9. SMOOTH SCROLL for in-page anchors
        (guards against href="#" which throws in querySelector)
     ============================================================= */
  function initSmoothScroll() {
    on(document, 'click', function (e) {
      var link = e.target.closest && e.target.closest('a[href^="#"]');
      if (!link) return;
      var hash = link.getAttribute('href');
      if (!hash || hash === '#' || hash.length < 2) return;

      var target;
      try { target = document.querySelector(hash); } catch (err) { return; }
      if (!target) return;

      e.preventDefault();
      var navH = ($('nav') ? $('nav').offsetHeight : 0) + 12;
      var top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: top, behavior: REDUCED ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', hash);
    });
  }


  /* =============================================================
     10. SCROLLSPY — highlight the section you are looking at
     ============================================================= */
  function initScrollSpy() {
    var links = $$('.nav-links a[href*="#"]').filter(function (a) {
      var h = a.getAttribute('href');
      return h && h.indexOf('#') > -1 && h.length > 1;
    });
    if (!links.length || !('IntersectionObserver' in window)) return;

    var sections = links.map(function (a) {
      var id = a.getAttribute('href').split('#')[1];
      return id ? document.getElementById(id) : null;
    }).filter(Boolean);
    if (!sections.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          var id = a.getAttribute('href').split('#')[1];
          a.classList.toggle('active', id === entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { io.observe(s); });
  }


  /* =============================================================
     11. BUTTON RIPPLE
     ============================================================= */
  function initRipple() {
    if (REDUCED) return;
    on(document, 'click', function (e) {
      var btn = e.target.closest && e.target.closest('.btn, .btn-sm, .form-submit, .filter-btn');
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var span = document.createElement('span');
      span.className = 'ripple';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (e.clientX - rect.left - size / 2) + 'px';
      span.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
      btn.appendChild(span);
      setTimeout(function () { if (span.parentNode) span.parentNode.removeChild(span); }, 620);
    });
  }


  /* =============================================================
     12. LAZY IMAGE FADE-IN + graceful fallback for missing files
     ============================================================= */
  function initImages() {
    $$('img').forEach(function (img) {
      if (img.getAttribute('loading') === 'lazy') {
        if (img.complete && img.naturalWidth) img.classList.add('img-loaded');
        else on(img, 'load', function () { img.classList.add('img-loaded'); });
      }
      on(img, 'error', function () {
        // Don't leave a broken-image icon on the page
        img.style.visibility = 'hidden';
        console.warn('[Archana Sales] image not found:', img.getAttribute('src'));
      });
    });
  }


  /* =============================================================
     13. CLIENT TICKER — pause on hover / when off-screen
     ============================================================= */
  function initTicker() {
    var wrap = $('.clients-ticker-wrap');
    var track = $('.clients-ticker');
    if (!wrap || !track || REDUCED) return;
    on(wrap, 'mouseenter', function () { track.style.animationPlayState = 'paused'; });
    on(wrap, 'mouseleave', function () { track.style.animationPlayState = 'running'; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        track.style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused';
      }, { threshold: 0 }).observe(wrap);
    }
  }


  /* =============================================================
     14. YEAR STAMP  (any element with data-year)
     ============================================================= */
  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }


  /* ---------- boot ---------- */
  function boot() {
    document.documentElement.classList.remove('no-js');
    initPreloader();
    initNav();
    initScrollUI();
    initSlider();
    initPpgSlider();
    initPpgEnquire();
    initReveal();
    initCounters();
    initGalleryFilter();
    initLightbox();
    initSmoothScroll();
    initScrollSpy();
    initRipple();
    initImages();
    initTicker();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
