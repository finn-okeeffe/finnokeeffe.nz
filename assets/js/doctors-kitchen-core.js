/* The Doctor's Kitchen dashboard: data logic (no DOM), shared by the page script
   and scripts/test-doctors-kitchen.mjs. Reproduces the original Streamlit app's SQL. */
var DKCore = (function () {
    'use strict';

    var MEALS = ['Dinner', 'Lunch', 'Breakfast', 'Snack'];
    var DIETS = ['Vegan', 'Vegetarian', 'Pescatarian'];
    var UNSPECIFIED_MEALS = 'Unspecified Meals';
    var NO_DIET = 'No diet';
    var MAX_SEARCH_CHARS = 200;
    var MAX_SEARCH_TERMS = 8;

    /* Recipes matching the selected tags. A recipe matches if one of its meals is selected
       (or it has none and "Unspecified Meals" is selected) and its diet is selected
       ("No diet" covers the diet called "None" and a missing diet). */
    function filterRecipes(recipes, tags) {
        var selected = {};
        tags.forEach(function (t) { selected[t] = true; });
        var unspecifiedMeals = !!selected[UNSPECIFIED_MEALS];
        var noDiet = !!selected[NO_DIET];
        return recipes.filter(function (r) {
            var mealOk = r.m.length === 0 ? unspecifiedMeals : r.m.some(function (m) { return selected[m]; });
            var dietOk = (r.d === null || r.d === 'None') ? noDiet : !!selected[r.d];
            return mealOk && dietOk;
        });
    }

    /* Most frequent names among the recipes' ingredient (key "i") or equipment (key "e") lines.
       Counts lines, like the SQL's COUNT over the join; ties are broken alphabetically. */
    function topCounts(recipes, key, names, n) {
        var counts = {};
        recipes.forEach(function (r) {
            r[key].forEach(function (idx) { counts[idx] = (counts[idx] || 0) + 1; });
        });
        return Object.keys(counts)
            .map(function (idx) { return { name: names[idx], count: counts[idx] }; })
            .sort(function (a, b) { return b.count - a.count || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0); })
            .slice(0, n);
    }

    /* Vega's "nice" binning (vega-statistics bin, maxbins 10), as Altair's bin=True used. */
    function binParams(min, max, maxbins) {
        maxbins = maxbins || 10;
        var base = 10, logb = Math.log(base), div = [5, 2];
        var span = (max - min) || Math.abs(min) || 1;
        var level = Math.ceil(Math.log(maxbins) / logb);
        var step = Math.pow(base, Math.round(Math.log(span) / logb) - level);
        while (Math.ceil(span / step) > maxbins) step *= base;
        for (var i = 0; i < div.length; i++) {
            var v = step / div[i];
            if (span / v <= maxbins) step = v;
        }
        var lv = Math.log(step);
        var precision = lv >= 0 ? 0 : ~~(-lv / logb) + 1;
        var eps = Math.pow(base, -precision - 1);
        var start = Math.floor(min / step + eps) * step;
        start = min < start ? start - step : start;
        var stop = Math.ceil(max / step) * step;
        return { start: start, stop: stop === start ? start + step : stop, step: step };
    }

    /* Histogram of values. With an extent, values outside it are left out (as in Vega-Lite). */
    function histogram(values, extent) {
        var vals = values.filter(function (v) { return v !== null && v !== undefined; });
        var lo = extent ? extent[0] : Math.min.apply(null, vals);
        var hi = extent ? extent[1] : Math.max.apply(null, vals);
        var outside = 0;
        if (extent) {
            var inside = vals.filter(function (v) { return v >= lo && v <= hi; });
            outside = vals.length - inside.length;
            vals = inside;
        }
        if (!vals.length) return { bins: [], outside: outside };
        var p = binParams(lo, hi, 10);
        var n = Math.round((p.stop - p.start) / p.step);
        var bins = [];
        for (var i = 0; i < n; i++) bins.push({ x0: p.start + i * p.step, x1: p.start + (i + 1) * p.step, count: 0 });
        vals.forEach(function (v) {
            var k = Math.floor((Math.min(v, p.stop - p.step) - p.start) / p.step + 1e-9);
            bins[Math.max(0, Math.min(n - 1, k))].count++;
        });
        return { bins: bins, outside: outside };
    }

    /* Comma-separated search terms, lower-cased; at most 8 terms and 200 characters. */
    function searchTerms(text) {
        var terms = String(text || '').slice(0, MAX_SEARCH_CHARS).split(',')
            .map(function (t) { return t.trim().toLowerCase(); })
            .filter(function (t) { return t; })
            .slice(0, MAX_SEARCH_TERMS);
        return terms.length ? terms : [''];
    }

    /* Recipes where every term is part of at least one ingredient name, sorted by title.
       An empty search matches every recipe that has an ingredient. Ignores the tag filter,
       like the original. */
    function search(recipes, ingredientNames, text) {
        var terms = searchTerms(text);
        return recipes.filter(function (r) {
            return r.i.length > 0 && terms.every(function (term) {
                return r.i.some(function (idx) { return ingredientNames[idx].toLowerCase().indexOf(term) !== -1; });
            });
        }).sort(function (a, b) { return a.t.localeCompare(b.t); });
    }

    /* Only plain http(s) links are made clickable. */
    function safeUrl(url) {
        return /^https?:\/\/[^\s"'<>\\()]+$/.test(String(url)) ? String(url) : null;
    }

    return {
        MEALS: MEALS, DIETS: DIETS, UNSPECIFIED_MEALS: UNSPECIFIED_MEALS, NO_DIET: NO_DIET,
        filterRecipes: filterRecipes, topCounts: topCounts, binParams: binParams,
        histogram: histogram, searchTerms: searchTerms, search: search, safeUrl: safeUrl
    };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = DKCore;
