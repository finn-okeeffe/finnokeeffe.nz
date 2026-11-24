/* The Doctor's Kitchen dashboard: controls, SVG charts and search (logic in doctors-kitchen-core.js). */
/* global DKCore */
(function () {
    'use strict';

    var SVG = 'http://www.w3.org/2000/svg';
    var PAGE_SIZE = 10;
    var DIET_CLASS = { Vegan: 'vegan', Vegetarian: 'vegetarian', Pescatarian: 'pescatarian' };

    document.querySelectorAll('.dk[data-src]').forEach(function (root) {
        fetch(root.getAttribute('data-src'), { credentials: 'same-origin' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) { setup(root, data); })
            .catch(function () {
                root.querySelector('.dk-count').textContent = 'Sorry, the recipe data couldn\'t be loaded.';
            });
    });

    function el(name, attrs, text) {
        var node = document.createElementNS(SVG, name);
        Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

    /* Lighter blue for bigger values, like the original Altair charts. */
    function shade(t) {
        var lo = [44, 100, 160], hi = [168, 210, 255];
        return 'rgb(' + lo.map(function (c, i) { return Math.round(c + (hi[i] - c) * t); }).join(',') + ')';
    }

    function niceStep(max, ticks) {
        var raw = Math.max(1, max) / ticks, mag = Math.pow(10, Math.floor(Math.log10(raw)));
        var norm = raw / mag;
        return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
    }

    function empty(box, message) {
        box.textContent = '';
        var p = document.createElement('p');
        p.className = 'dk-empty';
        p.textContent = message;
        box.appendChild(p);
    }

    /* Horizontal bar chart of {name, count} rows. */
    function barChart(box, rows, width, unit) {
        if (!rows.length) return empty(box, 'No recipes match the selected tags.');
        var rowH = 30, top = 4, labelW = Math.min(200, Math.round(width * 0.42)), right = 40;
        var plotW = Math.max(40, width - labelW - right);
        var height = top + rows.length * rowH;
        var max = rows[0].count;
        var maxChars = Math.max(6, Math.floor((labelW - 12) / 7));
        var svg = el('svg', { width: width, height: height, viewBox: '0 0 ' + width + ' ' + height, role: 'img',
            'aria-label': rows.map(function (r) { return r.name + ' ' + r.count; }).join(', ') });
        rows.forEach(function (r, i) {
            var y = top + i * rowH, w = Math.max(2, Math.round(plotW * r.count / max));
            var g = el('g');
            g.appendChild(el('title', {}, r.name + ': in ' + plural(r.count, 'recipe', 'recipes') + (unit ? ' (' + unit + ')' : '')));
            var name = r.name.length > maxChars ? r.name.slice(0, maxChars - 1) + '…' : r.name;
            g.appendChild(el('text', { x: labelW - 10, y: y + rowH / 2, 'text-anchor': 'end', 'dominant-baseline': 'central', class: 'dk-label' }, name));
            g.appendChild(el('rect', { x: labelW, y: y + 4, width: w, height: rowH - 8, rx: 2, fill: shade(r.count / max) }));
            g.appendChild(el('text', { x: labelW + w + 6, y: y + rowH / 2, 'dominant-baseline': 'central', class: 'dk-value' }, String(r.count)));
            svg.appendChild(g);
        });
        box.textContent = '';
        box.appendChild(svg);
    }

    /* Histogram from DKCore.histogram(). */
    function histChart(box, hist, width) {
        var bins = hist.bins;
        if (!bins.length) return empty(box, 'No recipes match the selected tags.');
        var left = 36, right = 10, top = 10, bottom = 40, height = 220;
        var plotW = width - left - right, plotH = height - top - bottom;
        var max = Math.max.apply(null, bins.map(function (b) { return b.count; })) || 1;
        var step = niceStep(max, 4), yMax = Math.ceil(max / step) * step;
        var bw = plotW / bins.length;
        var svg = el('svg', { width: width, height: height, viewBox: '0 0 ' + width + ' ' + height, role: 'img',
            'aria-label': bins.map(function (b) { return b.x0 + '–' + b.x1 + ' min: ' + b.count; }).join(', ') });
        for (var v = 0; v <= yMax; v += step) {
            var gy = top + plotH - plotH * v / yMax;
            svg.appendChild(el('line', { x1: left, x2: width - right, y1: gy, y2: gy, class: 'dk-grid' }));
            svg.appendChild(el('text', { x: left - 6, y: gy, 'text-anchor': 'end', 'dominant-baseline': 'central', class: 'dk-tick' }, String(v)));
        }
        bins.forEach(function (b, i) {
            var h = plotH * b.count / yMax, x = left + i * bw;
            var g = el('g');
            g.appendChild(el('title', {}, b.x0 + '–' + b.x1 + ' minutes: ' + plural(b.count, 'recipe', 'recipes')));
            g.appendChild(el('rect', { x: x + 1, y: top + plotH - h, width: Math.max(1, bw - 2), height: h, fill: shade(0.55) }));
            svg.appendChild(g);
        });
        var every = bw < 28 ? 2 : 1;
        for (var k = 0; k <= bins.length; k += every) {
            var value = k < bins.length ? bins[k].x0 : bins[bins.length - 1].x1;
            svg.appendChild(el('text', { x: left + k * bw, y: top + plotH + 14, 'text-anchor': 'middle', class: 'dk-tick' }, String(value)));
        }
        svg.appendChild(el('text', { x: left + plotW / 2, y: height - 6, 'text-anchor': 'middle', class: 'dk-axis' }, 'minutes'));
        box.textContent = '';
        box.appendChild(svg);
    }

    function setup(root, data) {
        var recipes = data.recipes;
        var boxes = [].slice.call(root.querySelectorAll('.dk-tags input[type=checkbox]'));
        var count = root.querySelector('.dk-count');
        var plots = {};
        root.querySelectorAll('.dk-plot').forEach(function (p) { plots[p.getAttribute('data-chart')] = p; });
        var cookNote = root.querySelector('[data-note=cook]');
        var app = root.querySelector('.dk-app');
        var selected = recipes;

        function width() { return Math.max(260, app.clientWidth); }

        function draw() {
            var w = width();
            barChart(plots.ingredients, DKCore.topCounts(selected, 'i', data.ingredients, 8), w);
            barChart(plots.equipment, DKCore.topCounts(selected, 'e', data.equipment, 8), w);
            var cols = w >= 600 ? 2 : 1, hw = cols === 2 ? Math.floor((w - 24) / 2) : w;
            histChart(plots.prep, DKCore.histogram(selected.map(function (r) { return r.p; })), hw);
            var cook = DKCore.histogram(selected.map(function (r) { return r.c; }), [0, 100]);
            histChart(plots.cook, cook, hw);
            cookNote.textContent = cook.outside
                ? plural(cook.outside, 'recipe', 'recipes') + ' with a cooking time over 100 minutes ' + (cook.outside === 1 ? 'isn\'t' : 'aren\'t') + ' shown.'
                : '';
        }

        function update() {
            var tags = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
            selected = DKCore.filterRecipes(recipes, tags);
            count.innerHTML = '';
            var strong = document.createElement('strong');
            strong.textContent = String(selected.length);
            count.appendChild(strong);
            count.appendChild(document.createTextNode(selected.length === 1 ? ' recipe selected' : ' recipes selected'));
            draw();
        }
        boxes.forEach(function (b) { b.addEventListener('change', update); });

        /* Tabs (arrow keys move between them). */
        var tabs = [].slice.call(root.querySelectorAll('[role=tab]'));
        function selectTab(tab, focus) {
            tabs.forEach(function (t) {
                var on = t === tab;
                t.setAttribute('aria-selected', on ? 'true' : 'false');
                t.tabIndex = on ? 0 : -1;
                document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
            });
            if (focus) tab.focus();
        }
        tabs.forEach(function (t, i) {
            t.addEventListener('click', function () { selectTab(t); });
            t.addEventListener('keydown', function (e) {
                var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], true); }
            });
        });

        /* Ingredient search, 10 results a page. */
        var input = root.querySelector('.dk-search');
        var resultsCount = root.querySelector('.dk-results-count');
        var list = root.querySelector('.dk-results');
        var pager = root.querySelector('.dk-pager');
        var results = [], page = 0, timer = null;

        function renderResults() {
            var pages = Math.ceil(results.length / PAGE_SIZE);
            resultsCount.textContent = results.length
                ? plural(results.length, 'result', 'results') + ' found'
                : 'No results found, try a different combination of ingredients.';
            list.textContent = '';
            list.start = page * PAGE_SIZE + 1;
            results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).forEach(function (r) {
                var li = document.createElement('li');
                var url = DKCore.safeUrl(r.u);
                var title = document.createElement(url ? 'a' : 'span');
                title.textContent = r.t;
                if (url) { title.href = url; title.target = '_blank'; title.rel = 'noopener noreferrer'; }
                li.appendChild(title);
                if (DIET_CLASS[r.d]) {
                    var diet = document.createElement('span');
                    diet.className = 'dk-diet dk-diet-' + DIET_CLASS[r.d];
                    diet.textContent = r.d;
                    li.appendChild(document.createTextNode(' '));
                    li.appendChild(diet);
                }
                list.appendChild(li);
            });
            pager.textContent = '';
            if (pages > 1) {
                for (var i = 0; i < pages; i++) {
                    var b = document.createElement('button');
                    b.type = 'button';
                    b.textContent = String(i + 1);
                    b.setAttribute('aria-label', 'Page ' + (i + 1));
                    if (i === page) b.setAttribute('aria-current', 'page');
                    b.addEventListener('click', (function (n) { return function () { page = n; renderResults(); }; })(i));
                    pager.appendChild(b);
                }
            }
        }
        function runSearch() {
            results = DKCore.search(recipes, data.ingredients, input.value);
            page = 0;
            renderResults();
        }
        input.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(runSearch, 150);
        });

        /* Redraw when the width changes. */
        var lastWidth = width();
        window.addEventListener('resize', function () {
            if (Math.abs(width() - lastWidth) > 4) { lastWidth = width(); draw(); }
        });

        update();
        runSearch();
    }
})();
