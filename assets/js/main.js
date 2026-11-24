/* Mobile menu burger toggle (from Ghost's shared theme assets) */
(function () {
    var burger = document.querySelector('.gh-burger');
    if (!burger) return;

    burger.addEventListener('click', function () {
        document.body.classList.toggle('is-head-open');
    });
})();

/* Home page cover: size the header to the cover image's aspect ratio and fade in
   the dark overlay (Solo did this in an inline script). */
(function () {
    if (!document.body.classList.contains('has-background-about')) return;

    var about = document.querySelector('.gh-about');
    var image = about && about.querySelector('.gh-about-image');
    if (!image) return;

    function size() {
        if (!image.naturalWidth) return;
        about.style.setProperty('--about-height', image.clientWidth * image.naturalHeight / image.naturalWidth + 'px');
    }

    if (image.complete) size(); else image.addEventListener('load', size);
    window.addEventListener('resize', size);
    about.classList.add('initialized');
})();

/* Search: open a dialog with Pagefind's UI, loading it on first use. */
(function () {
    var dialog = document.getElementById('search-dialog');
    var buttons = document.querySelectorAll('[data-search]');
    if (!dialog || !buttons.length) return;

    var loaded = null;

    function load() {
        if (loaded) return loaded;
        loaded = new Promise(function (resolve, reject) {
            var css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = '/pagefind/pagefind-ui.css';
            document.head.appendChild(css);

            var script = document.createElement('script');
            script.src = '/pagefind/pagefind-ui.js';
            script.onload = function () {
                /* global PagefindUI */
                new PagefindUI({
                    element: '#search',
                    showSubResults: true,
                    showImages: false,
                    resetStyles: false,
                    autofocus: true
                });
                resolve();
            };
            script.onerror = function () {
                document.getElementById('search').textContent =
                    'Search isn\'t available here (the index is built by `npm run build`).';
                reject(new Error('pagefind-ui.js failed to load'));
            };
            document.head.appendChild(script);
        });
        return loaded;
    }

    function open() {
        dialog.showModal();
        load().then(function () {
            var input = dialog.querySelector('input');
            if (input) input.focus();
        }).catch(function () {});
    }

    buttons.forEach(function (b) { b.addEventListener('click', open); });

    dialog.querySelector('[data-search-close]').addEventListener('click', function () {
        dialog.close();
    });

    /* Close when clicking the backdrop. */
    dialog.addEventListener('click', function (e) {
        if (e.target === dialog) dialog.close();
    });

    /* "/" or Ctrl/Cmd+K opens search when not typing in a field. */
    document.addEventListener('keydown', function (e) {
        var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
        if ((e.key === '/' && !typing) || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
            if (!dialog.open) {
                e.preventDefault();
                open();
            }
        }
    });
})();
