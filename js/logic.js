(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.RafLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var GOODS = [
    { id: "innstunga", name: "Innstungur", one: "innstungu", many: "innstungur", base: 900, size: 1 },
    { id: "rofi", name: "Rofar", one: "rofa", many: "rofa", base: 700, size: 1 },
    { id: "lekavardi", name: "Lekaliðar", one: "lekaliða", many: "lekaliða", base: 4400, size: 1 },
    { id: "sjalfvari", name: "Sjálfvarar", one: "sjálfvara", many: "sjálfvara", base: 1900, size: 1 },
    { id: "tafla", name: "Töflur", one: "töflu", many: "töflur", base: 32000, size: 4 },
    { id: "kapall15", name: "Kapall 3x1,5", one: "kapal 3x1,5", many: "kapla 3x1,5", base: 3800, size: 2 },
    { id: "kapall25", name: "Kapall 3x2,5", one: "kapal 3x2,5", many: "kapla 3x2,5", base: 5600, size: 2 },
    { id: "kapall510", name: "Kapall 5x10", one: "kapal 5x10", many: "kapla 5x10", base: 21000, size: 3 },
    { id: "ror", name: "Ídráttarrör", one: "ídráttarrör", many: "ídráttarrör", base: 1400, size: 2 },
    { id: "led", name: "LED ljós", one: "LED ljós", many: "LED ljós", base: 2800, size: 1 },
    { id: "hledsla", name: "Hleðslustöðvar", one: "hleðslustöð", many: "hleðslustöðvar", base: 89000, size: 6 },
    { id: "pumpa", name: "Varmadælur", one: "varmadælu", many: "varmadælur", base: 165000, size: 8 },
    { id: "maelitaki", name: "Mælitæki", one: "mælitæki", many: "mælitæki", base: 22000, size: 2 },
    { id: "solar", name: "Sólarplötur", one: "sólarplötu", many: "sólarplötur", base: 74000, size: 5 },
    { id: "snertill", name: "Snertlar", one: "snertil", many: "snertla", base: 7800, size: 1 }
  ];

  var LOCS = [
    { id: "reykjavik", name: "Reykjavík", here: "í Reykjavík", tip: "Venjulegt verð", all: 1, mods: {}, wild: 0.09 },
    { id: "hafnarfjordur", name: "Hafnarfjörður", here: "í Hafnarfirði", tip: "Ódýrir kaplar", all: 1, mods: { kapall15: 0.7, kapall25: 0.7, kapall510: 0.74, tafla: 1.22 }, wild: 0.09 },
    { id: "kopavogur", name: "Kópavogur", here: "í Kópavogi", tip: "Ódýr LED", all: 1, mods: { led: 0.68, innstunga: 0.82, rofi: 0.84, pumpa: 1.28 }, wild: 0.09 },
    { id: "akureyri", name: "Akureyri", here: "á Akureyri", tip: "Ódýrar dælur", all: 1, mods: { pumpa: 0.64, hledsla: 1.3, solar: 1.12 }, wild: 0.1 },
    { id: "selfoss", name: "Selfoss", here: "á Selfossi", tip: "Ódýr rör", all: 1, mods: { ror: 0.66, sjalfvari: 0.78, lekavardi: 0.8 }, wild: 0.09 },
    { id: "keflavik", name: "Keflavík", here: "í Keflavík", tip: "Hleðsla sveiflast", all: 1, mods: { hledsla: 0.92 }, wild: 0.1 },
    { id: "egilsstadir", name: "Egilsstaðir", here: "á Egilsstöðum", tip: "Ódýrar sólir", all: 1, mods: { solar: 0.58, led: 1.18, maelitaki: 0.85 }, wild: 0.1 },
    { id: "isafjordur", name: "Ísafjörður", here: "á Ísafirði", tip: "Dýrt, stórgróði", all: 1.32, mods: {}, wild: 0.2 }
  ];

  var LEVELS = [
    { level: 1, xp: 0, title: "Rafvirkjanemi" },
    { level: 2, xp: 40, title: "Nemi" },
    { level: 3, xp: 100, title: "Sveinn" },
    { level: 4, xp: 190, title: "Rafvirki" },
    { level: 5, xp: 310, title: "Meistari" },
    { level: 6, xp: 470, title: "Verktaki" },
    { level: 7, xp: 680, title: "Firmaeigandi" },
    { level: 8, xp: 940, title: "Iðnmeistari" },
    { level: 9, xp: 1260, title: "Orkumeistari" },
    { level: 10, xp: 1650, title: "Rafvirkjakóngur" }
  ];

  var HOUSES = [
    { id: "kjallari", name: "Kjallaraherbergi", price: 65000, tier: 1, blurb: "Út úr bílnum.", cap: 6, rep: 4 },
    { id: "ibud", name: "Lítil íbúð", price: 240000, tier: 2, blurb: "Eigið eldhús.", cap: 8, rep: 6 },
    { id: "radhus", name: "Raðhús", price: 680000, tier: 3, blurb: "Meira pláss.", cap: 10, rep: 8 },
    { id: "einbyli", name: "Einbýlishús", price: 1500000, tier: 4, blurb: "Garður og þak.", cap: 14, rep: 10 },
    { id: "villa", name: "Villa", price: 3600000, tier: 5, blurb: "Útsýni og stórt þak.", cap: 18, rep: 12 }
  ];

  var ROOMS = {
    1: ["Stofa", "Svefn"],
    2: ["Stofa", "Eldhús", "Svefn", "Bað"],
    3: ["Stofa", "Eldhús", "Svefn", "Bað", "Herbergi"],
    4: ["Stofa", "Eldhús", "Svefn", "Bað", "Herbergi", "Garður"],
    5: ["Stofa", "Eldhús", "Svefn", "Bað", "Skrifstofa", "Garður", "Verkstæði", "Þak"]
  };

  var UPGRADES = [
    { id: "ledhus", name: "LED lýsing", price: 12000, need: 1, rep: 2, daily: 1500, cap: 0, pay: 0, blurb: "Lægri reikningur." },
    { id: "husgon", name: "Húsgögn", price: 18000, need: 1, rep: 5, daily: 0, cap: 0, pay: 0, blurb: "Sófi og rúm." },
    { id: "verkstadi", name: "Verkstæði", price: 48000, need: 1, rep: 3, daily: 0, cap: 24, pay: 0.1, blurb: "Meira í bílinn og hærri laun." },
    { id: "gardur", name: "Garður", price: 20000, need: 2, rep: 4, daily: 0, cap: 0, pay: 0, blurb: "Friður og orðstír." },
    { id: "herbergi", name: "Útleiga", price: 70000, need: 2, rep: 4, daily: 3000, cap: 4, pay: 0, blurb: "Herbergi í útleigu." },
    { id: "pumpa", name: "Varmadæla", price: 90000, need: 2, rep: 3, daily: 7000, cap: 0, pay: 0, blurb: "Hlýja og inneign." },
    { id: "hledsla", name: "Hleðslustöð", price: 80000, need: 3, rep: 5, daily: 8000, cap: 0, pay: 0.05, blurb: "Nágrannar borga fyrir hleðslu." },
    { id: "solar", name: "Sólarþak", price: 130000, need: 3, rep: 4, daily: 12000, cap: 0, pay: 0, blurb: "Orkan borgar sér." }
  ];

  var FIRMS = [
    "Straumur ehf.",
    "Glóð og félagar",
    "Fasar þrír ehf.",
    "Björt leiðsla ehf.",
    "Ljómandi ehf.",
    "Jörðin ehf.",
    "Næsti fasi ehf.",
    "Volt og vinir"
  ];

  var HOME_CIRCUITS = [
    { id: "ljos", name: "Ljós", a: "10", cable: "1,5" },
    { id: "inn", name: "Innstungur", a: "16", cable: "2,5" },
    { id: "eld", name: "Eldhús", a: "20", cable: "2,5" },
    { id: "ofn", name: "Ofn", a: "20", cable: "2,5" },
    { id: "thvott", name: "Þvottavél", a: "16", cable: "2,5" },
    { id: "hit", name: "Hitari", a: "25", cable: "4" }
  ];

  var HOME_OPTIONS = [
    { id: "10|1,5", label: "10A, 1,5" },
    { id: "16|2,5", label: "16A, 2,5" },
    { id: "20|2,5", label: "20A, 2,5" },
    { id: "25|4", label: "25A, 4" }
  ];

  var COLOUR_WIRES = [
    { id: "brun", name: "Brúnn", kind: "fasi", swatch: "brun" },
    { id: "svart", name: "Svartur", kind: "fasi", swatch: "svart" },
    { id: "gra", name: "Grár", kind: "fasi", swatch: "gra" },
    { id: "bla", name: "Blár", kind: "null", swatch: "bla" },
    { id: "gg", name: "Gul-grænn", kind: "jord", swatch: "gg" }
  ];

  var MOTORS = [
    { kw: "4", amps: 8 },
    { kw: "5,5", amps: 11 },
    { kw: "7,5", amps: 15 },
    { kw: "11", amps: 22 },
    { kw: "15", amps: 30 }
  ];

  var PHASE_SETS = [
    [10, 10, 10, 16, 16, 16],
    [8, 8, 8, 12, 12, 12],
    [10, 20, 30, 10, 20, 30],
    [5, 5, 10, 10, 15, 15],
    [6, 6, 12, 12, 18, 18]
  ];

  var LOAD_NAMES = ["Ofn", "Dæla", "Ljós", "Hleðsla", "Eldhús", "Verkstæði", "Tölvur", "Hitari"];

  var FAULTS = [
    { id: "short", clue: "Sjálfvarinn slær út strax", v: "0 V", ohm: "0 Ω", pe: "Í lagi", note: "", choice: "Skammhlaup" },
    { id: "openN", clue: "Dautt, sjálfvari inni", v: "0 V", ohm: "Opin", pe: "Í lagi", note: "", choice: "Núll rofið" },
    { id: "earth", clue: "Spenna til, lekaliði slær", v: "230 V", ohm: "Í lagi", pe: "Opin", note: "", choice: "Jörð laus" },
    { id: "small", clue: "Ofn slær út", v: "230 V", ohm: "Í lagi", pe: "Í lagi", note: "10A á ofni", choice: "Of lítið sjálfvari" },
    { id: "leak", clue: "Lekaliði slær við snertingu", v: "230 V", ohm: "Í lagi", pe: "Leki", note: "", choice: "Leki til jarðar" }
  ];

  function good(id) {
    for (var i = 0; i < GOODS.length; i++) if (GOODS[i].id === id) return GOODS[i];
    return null;
  }
  function locById(id) {
    for (var i = 0; i < LOCS.length; i++) if (LOCS[i].id === id) return LOCS[i];
    return LOCS[0];
  }
  function houseById(id) {
    for (var i = 0; i < HOUSES.length; i++) if (HOUSES[i].id === id) return HOUSES[i];
    return null;
  }
  function upgradeById(id) {
    for (var i = 0; i < UPGRADES.length; i++) if (UPGRADES[i].id === id) return UPGRADES[i];
    return null;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function randInt(rng, a, b) {
    return a + Math.floor(rng() * (b - a + 1));
  }

  function formatNum(n) {
    var sign = n < 0 ? "-" : "";
    var v = Math.abs(Math.round(n));
    return sign + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function formatKr(n) {
    return formatNum(n) + " kr";
  }

  function formatKrSigned(n) {
    var sign = n > 0 ? "+" : "";
    return sign + formatKr(n);
  }

  function dateStr(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function dayDiff(a, b) {
    var da = Date.parse(a + "T00:00:00");
    var db = Date.parse(b + "T00:00:00");
    return Math.round((db - da) / 86400000);
  }

  function weekStr(d) {
    var date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return date.getUTCFullYear() + "-W" + String(weekNo).padStart(2, "0");
  }

  function levelOf(xp) {
    var current = LEVELS[0];
    var next = LEVELS[1] || null;
    for (var i = 0; i < LEVELS.length; i++) {
      if (xp >= LEVELS[i].xp) {
        current = LEVELS[i];
        next = LEVELS[i + 1] || null;
      }
    }
    return { current: current, next: next };
  }

  function houseTier(state) {
    if (!state.house) return 0;
    var h = houseById(state.house);
    return h ? h.tier : 0;
  }

  function capacity(state) {
    var c = 36;
    if (state.house) c += houseById(state.house).cap;
    for (var i = 0; i < state.upgrades.length; i++) c += upgradeById(state.upgrades[i]).cap || 0;
    if (state.bonus && state.bonus.cap) c += state.bonus.cap;
    return c;
  }

  function usedSpace(state) {
    var n = 0;
    for (var i = 0; i < GOODS.length; i++) {
      var q = state.inv[GOODS[i].id] ? state.inv[GOODS[i].id].qty : 0;
      n += q * GOODS[i].size;
    }
    return n;
  }

  function dailyIncome(state) {
    var n = 0;
    for (var i = 0; i < state.upgrades.length; i++) n += upgradeById(state.upgrades[i]).daily || 0;
    return n;
  }

  function payMul(state) {
    var m = 1;
    for (var i = 0; i < state.upgrades.length; i++) m += upgradeById(state.upgrades[i]).pay || 0;
    if (state.bonus && state.bonus.pay) m += state.bonus.pay;
    return m;
  }

  function repFactor(rep) {
    return 0.85 + (clamp(rep, 0, 100) / 100) * 0.4;
  }

  function invValue(state) {
    var n = 0;
    for (var i = 0; i < GOODS.length; i++) {
      var q = state.inv[GOODS[i].id] ? state.inv[GOODS[i].id].qty : 0;
      var price = state.prices && state.prices[GOODS[i].id] ? state.prices[GOODS[i].id] : GOODS[i].base;
      n += q * price;
    }
    return n;
  }

  function netWorth(state) {
    var v = state.cash + state.bank - state.debt + invValue(state);
    if (state.house) v += houseById(state.house).price;
    for (var i = 0; i < state.upgrades.length; i++) v += Math.round(upgradeById(state.upgrades[i]).price * 0.5);
    return v;
  }

  function score(state) {
    return Math.max(0, Math.round(netWorth(state) + state.xp * 40 + state.achievements.length * 5000 + state.rep * 100));
  }

  function roundPrice(g, raw) {
    var step = g.base >= 20000 ? 500 : g.base >= 5000 ? 100 : 10;
    return Math.max(step, Math.round(raw / step) * step);
  }

  function locMod(loc, g) {
    var specific = loc.mods && loc.mods[g.id] != null ? loc.mods[g.id] : 1;
    return specific * (loc.all || 1);
  }

  function priceOf(g, loc, rng) {
    var swing = 0.84 + rng() * 0.32;
    var wild = loc.wild || 0.09;
    var r = rng();
    if (r < wild) swing = 1.5 + rng() * 0.4;
    else if (r < wild * 2) swing = 0.5 + rng() * 0.16;
    if (loc.id === "keflavik" && g.id === "hledsla") swing *= rng() < 0.5 ? 0.62 : 1.55;
    return roundPrice(g, g.base * locMod(loc, g) * swing);
  }

  function rollPrices(locId, rng) {
    var loc = locById(locId);
    var prices = {};
    for (var i = 0; i < GOODS.length; i++) prices[GOODS[i].id] = priceOf(GOODS[i], loc, rng);
    return prices;
  }

  function forceDeal(prices, locId) {
    var loc = locById(locId);
    var best = GOODS[0];
    var bestMod = 99;
    for (var i = 0; i < GOODS.length; i++) {
      var m = locMod(loc, GOODS[i]);
      if (m < bestMod) {
        bestMod = m;
        best = GOODS[i];
      }
    }
    if (bestMod >= 0.98) best = good("innstunga");
    prices[best.id] = roundPrice(best, best.base * locMod(loc, best) * 0.6);
    return best.id;
  }

  function bestDeal(state) {
    var best = null;
    for (var i = 0; i < GOODS.length; i++) {
      var g = GOODS[i];
      var price = state.prices[g.id];
      var ratio = price / g.base;
      if (!best || ratio < best.ratio) best = { id: g.id, name: g.name, price: price, ratio: ratio };
    }
    return best;
  }

  function addInv(state, id, qty, price) {
    var cur = state.inv[id] || { qty: 0, avg: 0 };
    var nq = cur.qty + qty;
    var avg = Math.round((cur.avg * cur.qty + price * qty) / nq);
    state.inv[id] = { qty: nq, avg: avg };
  }

  function removeInv(state, id, qty) {
    var cur = state.inv[id];
    if (!cur || cur.qty < qty) return false;
    cur.qty -= qty;
    if (cur.qty <= 0) delete state.inv[id];
    return true;
  }

  function buyPrice(state, goodId) {
    var p = state.prices[goodId];
    if (!p) return p;
    var b = state.bonus && state.bonus.buy ? state.bonus.buy : 0;
    return b ? Math.max(1, Math.round(p * (1 - b))) : p;
  }

  function sellPrice(state, goodId) {
    var p = state.prices[goodId];
    if (!p) return p;
    var b = state.bonus && state.bonus.sell ? state.bonus.sell : 0;
    return b ? Math.round(p * (1 + b)) : p;
  }

  function grantXp(state, n, rng) {
    var before = levelOf(state.xp).current.level;
    state.xp += n;
    state.today.xp += n;
    return syncRank(state, before, rng || Math.random);
  }

  function maxAffordable(state, goodId) {
    var g = good(goodId);
    var price = buyPrice(state, goodId);
    if (!g || !price) return 0;
    var space = capacity(state) - usedSpace(state);
    var bySpace = Math.floor(space / g.size);
    var byCash = Math.floor(state.cash / price);
    return Math.max(0, Math.min(bySpace, byCash));
  }

  function tradeQty(state, goodId, mode, side) {
    if (side === "buy") {
      var max = maxAffordable(state, goodId);
      if (mode === "allt") return max;
      return Math.min(Number(mode) || 1, max);
    }
    var owned = state.inv[goodId] ? state.inv[goodId].qty : 0;
    if (mode === "allt") return owned;
    return Math.min(Number(mode) || 1, owned);
  }

  function unitName(g, n) {
    return n === 1 ? g.one : g.many;
  }

  var ACHIEVEMENTS = [
    { id: "buy1", name: "Fyrsta kaup", desc: "Keyptu vöru.", test: function (s) { return s.stats.bought >= 1; } },
    { id: "sell1", name: "Fyrsta sala", desc: "Seldu vöru.", test: function (s) { return s.stats.sold >= 1; } },
    { id: "profit1", name: "Fyrsti gróði", desc: "Seldu með hagnaði.", test: function (s) { return s.stats.profitSales >= 1; } },
    { id: "job1", name: "Fyrsta verk", desc: "Kláraðu verk.", test: function (s) { return s.stats.jobs >= 1; } },
    { id: "perfect1", name: "Fullkomið", desc: "Verk án villu.", test: function (s) { return s.stats.perfect >= 1; } },
    { id: "combo3", name: "Þrenna", desc: "Þrjú fullkomin í röð.", test: function (s) { return s.stats.bestCombo >= 3; } },
    { id: "speed1", name: "Hratt", desc: "Fullkomið og hratt.", test: function (s) { return s.stats.speed >= 1; } },
    { id: "debtHalf", name: "Skuld minnkar", desc: "Skuld undir 50.000 kr.", test: function (s) { return s.debt < 50000 && s.stats.paidDebt > 0; } },
    { id: "debt0", name: "Skuldlaus", desc: "Borgaðu Glóðarlán.", test: function (s) { return s.debt <= 0; } },
    { id: "house1", name: "Eigið hús", desc: "Keyptu hús.", test: function (s) { return !!s.house; } },
    { id: "shop", name: "Verkstæði", desc: "Settu upp verkstæði.", test: function (s) { return s.upgrades.indexOf("verkstadi") >= 0; } },
    { id: "solar", name: "Sólarþak", desc: "Settu upp sólarþak.", test: function (s) { return s.upgrades.indexOf("solar") >= 0; } },
    { id: "lvl3", name: "Sveinn", desc: "Náðu sveinsþrepi.", test: function (s) { return levelOf(s.xp).current.level >= 3; } },
    { id: "lvl6", name: "Verktaki", desc: "Stofnaðu firma.", test: function (s) { return levelOf(s.xp).current.level >= 6; } },
    { id: "lvl10", name: "Kóngur", desc: "Vertu rafvirkjakóngur.", test: function (s) { return levelOf(s.xp).current.level >= 10; } },
    { id: "million", name: "Milljón", desc: "Nettó eign yfir milljón.", test: function (s) { return netWorth(s) >= 1000000; } },
    { id: "allcities", name: "Landið um kring", desc: "Heimsæktu alla staði.", test: function (s) { return s.stats.visited.length >= LOCS.length; } },
    { id: "streak7", name: "Vika í röð", desc: "Mættu 7 daga í röð.", test: function (s) { return s.stats.loginStreak >= 7; } },
    { id: "jackpot", name: "Stórsamningur", desc: "Kláraðu stórsamning.", test: function (s) { return s.stats.jackpots >= 1; } },
    { id: "fullvan", name: "Fullur bíll", desc: "Fylltu bílinn.", test: function (s) { return usedSpace(s) >= capacity(s); } },
    { id: "sold50", name: "Sölumaður", desc: "Seldu 50 einingar.", test: function (s) { return s.stats.soldQty >= 50; } },
    { id: "plant", name: "Virkjun", desc: "Kláraðu virkjunarverkefni.", test: function (s) { return s.stats.plantWins >= 1; } }
  ];

  function earnAchievement(state) {
    var gained = [];
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var a = ACHIEVEMENTS[i];
      if (state.achievements.indexOf(a.id) >= 0) continue;
      if (a.test(state)) {
        state.achievements.push(a.id);
        gained.push({ id: a.id, name: a.name, desc: a.desc });
      }
    }
    return gained;
  }

  function freshWeekly() {
    return { id: "perfect", have: 0, need: 4, reward: 45000, xp: 40, label: "4 fullkomin verk", done: false };
  }

  function freshChallenges(date, week) {
    return {
      date: date,
      week: week,
      daily: [
        { id: "travel", have: 0, need: 3, reward: 8000, xp: 18, label: "Ferðastu 3 sinnum", done: false },
        { id: "jobs", have: 0, need: 2, reward: 12000, xp: 22, label: "Kláraðu 2 verk", done: false },
        { id: "earn", have: 0, need: 25000, reward: 10000, xp: 18, label: "Fáðu 25.000 kr", done: false }
      ],
      weekly: freshWeekly()
    };
  }

  function ensureChallenges(state, now) {
    var date = dateStr(now);
    var week = weekStr(now);
    if (!state.challenges) {
      state.challenges = freshChallenges(date, week);
      return;
    }
    if (state.challenges.date !== date) {
      var keep = state.challenges.week === week ? state.challenges.weekly : null;
      state.challenges = freshChallenges(date, week);
      if (keep) state.challenges.weekly = keep;
    } else if (state.challenges.week !== week) {
      state.challenges.week = week;
      state.challenges.weekly = freshWeekly();
    }
  }

  function bump(state, id, n) {
    if (!state.challenges || !n) return [];
    var done = [];
    var list = state.challenges.daily.concat([state.challenges.weekly]);
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.id !== id || c.done) continue;
      c.have = Math.min(c.need, c.have + n);
      if (c.have >= c.need) {
        c.done = true;
        state.cash += c.reward;
        state.xp += c.xp;
        state.today.cash += c.reward;
        state.today.xp += c.xp;
        done.push(c);
      }
    }
    return done;
  }

  function streakBonus(streak) {
    var table = [6000, 9000, 13000, 18000, 25000, 35000, 60000];
    if (streak <= 7) return table[Math.max(0, streak - 1)];
    return Math.min(200000, 60000 + (streak - 7) * 8000);
  }

  function checkLogin(meta, today) {
    if (!meta.login) meta.login = { last: null, streak: 0, forgive: false, claimedDate: null, pending: null };
    if (meta.login.claimedDate === today) {
      meta.login.pending = null;
      return meta.login;
    }
    if (meta.login.pending && meta.login.pending.date === today) return meta.login;
    var last = meta.login.last;
    var streak = meta.login.streak || 0;
    var msg = "";
    if (!last) streak = 1;
    else {
      var diff = dayDiff(last, today);
      if (diff <= 0) streak = Math.max(1, streak);
      else if (diff === 1) streak += 1;
      else if (diff === 2 && !meta.login.forgive) {
        meta.login.forgive = true;
        streak += 1;
        msg = "Þú misstir af einum degi. Röðin helst.";
      } else if (diff >= 2 && (meta.login.freezes || 0) >= diff - 1) {
        meta.login.freezes -= diff - 1;
        streak += 1;
        msg = "Frystir bjargaði röðinni! \u2744\ufe0f";
      } else {
        streak = 1;
        meta.login.forgive = false;
      }
    }
    meta.login.streak = streak;
    meta.login.last = today;
    meta.login.pending = { date: today, amount: streakBonus(streak), streak: streak, msg: msg, day: ((streak - 1) % 7) + 1 };
    return meta.login;
  }

  function claimLogin(state, meta) {
    var p = meta.login && meta.login.pending;
    if (!p) return null;
    state.cash += p.amount;
    state.today.cash += p.amount;
    state.stats.loginStreak = p.streak;
    meta.login.claimedDate = p.date;
    meta.login.pending = null;
    return { amount: p.amount, streak: p.streak, gained: earnAchievement(state) };
  }

  function cableForAmps(amps) {
    if (amps <= 10) return "1,5";
    if (amps <= 16) return "2,5";
    if (amps <= 25) return "4";
    if (amps <= 32) return "6";
    return "10";
  }

  function breakerForAmps(amps) {
    var sizes = [10, 16, 20, 25, 32, 40, 63];
    for (var i = 0; i < sizes.length; i++) if (sizes[i] >= amps) return String(sizes[i]);
    return "63";
  }

  function withDecoys(correct, pool, rng, count) {
    var opts = [correct];
    var rest = shuffle(pool.filter(function (x) { return x !== correct; }), rng);
    for (var i = 0; i < rest.length && opts.length < count; i++) opts.push(rest[i]);
    return shuffle(opts, rng);
  }

  function makeHeimili(rng) {
    var chosen = shuffle(HOME_CIRCUITS, rng).slice(0, 3);
    var rows = chosen.map(function (c) {
      return {
        id: c.id,
        label: c.name,
        answer: c.a + "|" + c.cable,
        options: HOME_OPTIONS
      };
    });
    rows.push({
      id: "fasi",
      label: "Fasi",
      answer: "brun",
      options: [
        { id: "brun", label: "Brúnn" },
        { id: "bla", label: "Blár" },
        { id: "gg", label: "Gul-grænn" }
      ]
    });
    rows.push({
      id: "rcd",
      label: "Bað á lekaliða",
      answer: "ja",
      options: [
        { id: "ja", label: "Já" },
        { id: "nei", label: "Nei" }
      ]
    });
    return {
      rows: rows,
      rule: "10A ljós. 16A innstungur og þvottavél. 20A eldhús og ofn. 25A hitari. Fasi brúnn. Bað á lekaliða."
    };
  }

  function makeWires(rng, count) {
    var out = COLOUR_WIRES.slice();
    while (out.length < count) out.push(pick(rng, COLOUR_WIRES));
    return shuffle(out, rng).slice(0, count).map(function (w, i) {
      return { id: w.id + "-" + i, name: w.name, kind: w.kind, swatch: w.swatch };
    });
  }

  function makeLitir(rng, seen) {
    return {
      wires: makeWires(rng, 8),
      rule: seen < 2
        ? "Brúnn, svartur, grár: fasi. Blár: núll. Gul-grænn: jörð."
        : "Fasi, núll, jörð."
    };
  }

  function makeFault(rng) {
    var f = pick(rng, FAULTS);
    return {
      fault: f,
      options: FAULTS.map(function (x) { return { id: x.id, label: x.choice }; }),
      rule: "Mældu fyrst. Veldu svo bilunina."
    };
  }

  function solvePhases(amps) {
    var n = amps.length;
    var bestSpread = Infinity;
    var best = new Array(n).fill(0);
    var assign = new Array(n);
    var sums = [0, 0, 0];
    function rec(i) {
      if (i === n) {
        var spread = Math.max(sums[0], sums[1], sums[2]) - Math.min(sums[0], sums[1], sums[2]);
        if (spread < bestSpread) {
          bestSpread = spread;
          for (var k = 0; k < n; k++) best[k] = assign[k];
        }
        return;
      }
      for (var p = 0; p < 3; p++) {
        assign[i] = p;
        sums[p] += amps[i];
        rec(i + 1);
        sums[p] -= amps[i];
      }
    }
    rec(0);
    return { assign: best, spread: bestSpread };
  }

  function makeFasar(rng) {
    var amps = pick(rng, PHASE_SETS).slice();
    var names = shuffle(LOAD_NAMES, rng);
    var solved = solvePhases(amps);
    var loads = amps.map(function (a, i) {
      return { id: "l" + i, name: names[i % names.length], amps: a };
    });
    return {
      loads: loads,
      solution: solved.assign,
      bestSpread: solved.spread,
      rule: "Settu álag á L1, L2 og L3. Gerðu sumurnar jafnar."
    };
  }

  function bfs(start, goal, walls, w, h) {
    var key = function (x, y) { return x + "," + y; };
    var q = [[start.x, start.y]];
    var prev = new Map();
    prev.set(key(start.x, start.y), null);
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (q.length) {
      var cur = q.shift();
      if (cur[0] === goal.x && cur[1] === goal.y) break;
      for (var i = 0; i < dirs.length; i++) {
        var nx = cur[0] + dirs[i][0];
        var ny = cur[1] + dirs[i][1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (walls[ny][nx]) continue;
        var k = key(nx, ny);
        if (prev.has(k)) continue;
        prev.set(k, cur);
        q.push([nx, ny]);
      }
    }
    if (!prev.has(key(goal.x, goal.y))) return null;
    var path = [];
    var walk = [goal.x, goal.y];
    while (walk) {
      path.push({ x: walk[0], y: walk[1] });
      walk = prev.get(key(walk[0], walk[1]));
    }
    path.reverse();
    return path;
  }

  function makeRoute(rng) {
    var w = 5;
    var h = 5;
    var walls = [];
    for (var y = 0; y < h; y++) {
      walls[y] = [];
      for (var x = 0; x < w; x++) walls[y][x] = false;
    }
    var start = { x: 0, y: 0 };
    var goal = { x: w - 1, y: h - 1 };
    for (var t = 0; t < 8; t++) {
      var sx = randInt(rng, 0, w - 1);
      var sy = randInt(rng, 0, h - 1);
      var gx = randInt(rng, 0, w - 1);
      var gy = randInt(rng, 0, h - 1);
      if (Math.abs(sx - gx) + Math.abs(sy - gy) >= 4) {
        start = { x: sx, y: sy };
        goal = { x: gx, y: gy };
        break;
      }
    }
    var added = 0;
    var guard = 0;
    while (added < 5 && guard < 40) {
      guard++;
      var wx = randInt(rng, 0, w - 1);
      var wy = randInt(rng, 0, h - 1);
      if ((wx === start.x && wy === start.y) || (wx === goal.x && wy === goal.y) || walls[wy][wx]) continue;
      walls[wy][wx] = true;
      if (!bfs(start, goal, walls, w, h)) {
        walls[wy][wx] = false;
        continue;
      }
      added++;
    }
    var path = bfs(start, goal, walls, w, h);
    return {
      w: w,
      h: h,
      start: start,
      goal: goal,
      walls: walls,
      shortest: path.length - 1,
      rule: "Tafla til lampa. Forðastu veggi. Ýttu á hausinn til að bakka."
    };
  }

  function makeIdnadur(rng) {
    var motor = pick(rng, MOTORS);
    var br = breakerForAmps(motor.amps);
    var cable = cableForAmps(motor.amps);
    var over = String(motor.amps);
    var breakerOpts = withDecoys(br, ["10", "16", "20", "25", "32", "40"], rng, 4).map(function (id) {
      return { id: id, label: id + "A" };
    });
    var cableOpts = withDecoys(cable, ["1,5", "2,5", "4", "6", "10"], rng, 4).map(function (id) {
      return { id: id, label: id };
    });
    var overPool = ["6", "8", "11", "15", "22", "30", "40"];
    var overOpts = withDecoys(over, overPool, rng, 4).map(function (id) {
      return { id: id, label: id + "A" };
    });
    return {
      kw: motor.kw,
      rows: [
        { id: "snertill", label: "Snertill", answer: "ja", options: [{ id: "ja", label: "Já" }, { id: "nei", label: "Nei" }] },
        { id: "breaker", label: "Sjálfvari", answer: br, options: breakerOpts },
        { id: "cable", label: "Kapall", answer: cable, options: cableOpts },
        { id: "over", label: "Yfirálag", answer: over, options: overOpts }
      ],
      rule: "Mótor " + motor.kw + " kW. Straumur ≈ kW × 2. Sjálfvari næst fyrir ofan. Yfirálag = straumur. Kapall: 1,5 til 10A, 2,5 til 16A, 4 til 25A, 6 til 32A, annars 10. Alltaf snertill."
    };
  }

  function makeHledsla(rng) {
    var variants = [
      { title: "11 kW, þrír fasar", breaker: "20", cable: "4" },
      { title: "7 kW, einn fasi", breaker: "40", cable: "10" }
    ];
    var v = pick(rng, variants);
    return {
      title: v.title,
      rows: [
        {
          id: "breaker",
          label: "Sjálfvari",
          answer: v.breaker,
          options: withDecoys(v.breaker, ["10", "16", "20", "25", "32", "40"], rng, 4).map(function (id) {
            return { id: id, label: id + "A" };
          })
        },
        {
          id: "cable",
          label: "Kapall",
          answer: v.cable,
          options: withDecoys(v.cable, ["1,5", "2,5", "4", "6", "10"], rng, 4).map(function (id) {
            return { id: id, label: id };
          })
        },
        {
          id: "rcd",
          label: "Lekaliði",
          answer: "B",
          options: [
            { id: "A", label: "Týpa A" },
            { id: "B", label: "Týpa B" },
            { id: "AC", label: "Týpa AC" }
          ]
        }
      ],
      rule: v.title + ". Þrífasa A ≈ kW × 1,5. Einfasa A ≈ kW × 5. Sjálfvari næst fyrir ofan. Kapall: 4 til 25A, 6 til 32A, annars 10. Alltaf týpa B."
    };
  }

  function makePumpa() {
    return {
      rows: [
        {
          id: "place",
          label: "Staðsetning",
          answer: "bilskur",
          options: [
            { id: "gluggi", label: "Undir svefnglugga" },
            { id: "bilskur", label: "Við bílskúr" },
            { id: "geymsla", label: "Inni í geymslu" }
          ]
        },
        {
          id: "breaker",
          label: "Sjálfvari",
          answer: "16",
          options: [
            { id: "10", label: "10A" },
            { id: "16", label: "16A" },
            { id: "32", label: "32A" },
            { id: "63", label: "63A" }
          ]
        },
        {
          id: "cable",
          label: "Kapall",
          answer: "2,5",
          options: [
            { id: "1,5", label: "1,5" },
            { id: "2,5", label: "2,5" },
            { id: "6", label: "6" },
            { id: "10", label: "10" }
          ]
        }
      ],
      rule: "Úti, ekki við svefnherbergi, ekki inni. 16A og 2,5."
    };
  }

  function makeNod(seen) {
    return {
      order: ["lek", "adal", "ljos", "inn"],
      buttons: shuffleIds([
        { id: "lek", label: "Lekaliði" },
        { id: "adal", label: "Aðalrofi" },
        { id: "ljos", label: "Ljós" },
        { id: "inn", label: "Innstungur" }
      ]),
      rule: seen < 2 ? "Lekaliði, aðalrofi, ljós, innstungur." : "Öryggi fyrst."
    };
  }

  function shuffleIds(arr) {
    return shuffle(arr, Math.random);
  }

  function makeVirkjun(rng) {
    var circuits = shuffle(HOME_CIRCUITS, rng).slice(0, 2).map(function (c) {
      return {
        id: c.id,
        label: c.name,
        answer: c.a + "|" + c.cable,
        options: HOME_OPTIONS
      };
    });
    var feederBr = "40";
    var feederCable = "10";
    return {
      stages: [
        { type: "rows", rows: circuits },
        { type: "wires", wires: makeWires(rng, 4) },
        {
          type: "rows",
          rows: [
            {
              id: "breaker",
              label: "Aðaltaug 25 kW",
              answer: feederBr,
              options: withDecoys(feederBr, ["25", "32", "40", "63"], rng, 4).map(function (id) {
                return { id: id, label: id + "A" };
              })
            },
            {
              id: "cable",
              label: "Kapall aðaltaugar",
              answer: feederCable,
              options: withDecoys(feederCable, ["4", "6", "10", "16"], rng, 4).map(function (id) {
                return { id: id, label: id };
              })
            }
          ]
        }
      ],
      rule: "Þrjú skref. Tafla, litir, aðaltaug. 25 kW þrífasa, A ≈ kW × 1,5. Sjálfvari næst fyrir ofan. Kapall 10 ef yfir 32A."
    };
  }

  var JOB_TYPES = [
    { id: "litir", name: "Litir og vírar", blurb: "Fasi, núll, jörð", seconds: 22, pay: 9000, xp: 16, level: 1, pace: "fast", mat: null, make: function (rng, state, seen) { return makeLitir(rng, seen); } },
    { id: "nod", name: "Neyðarviðgerð", blurb: "Rétt röð, hratt", seconds: 16, pay: 10000, xp: 16, level: 2, pace: "fast", mat: null, make: function (rng, state, seen) { return makeNod(seen); } },
    { id: "bilun", name: "Bilunarleit", blurb: "Mælirinn segir til", seconds: 24, pay: 13000, xp: 22, level: 1, pace: "fast", mat: { good: "maelitaki", qty: 0, bonus: 0.2 }, make: function (rng) { return makeFault(rng); } },
    { id: "heimili", name: "Heimilistafla", blurb: "Sjálfvarar og litir", seconds: 32, pay: 15000, xp: 24, level: 1, pace: "mid", mat: { good: "sjalfvari", qty: 1, bonus: 0.25 }, make: function (rng) { return makeHeimili(rng); } },
    { id: "idnadur", name: "Iðnaðartafla", blurb: "Mótor og kapall", seconds: 28, pay: 17000, xp: 24, level: 1, pace: "mid", mat: { good: "snertill", qty: 1, bonus: 0.3 }, make: function (rng) { return makeIdnadur(rng); } },
    { id: "fasar", name: "Þriggja fasa tafla", blurb: "Jafnaðu L1, L2, L3", seconds: 30, pay: 16000, xp: 24, level: 1, pace: "slow", mat: { good: "sjalfvari", qty: 1, bonus: 0.2 }, make: function (rng) { return makeFasar(rng); } },
    { id: "leidsla", name: "Leggja leiðslu", blurb: "Stysta leið í plani", seconds: 26, pay: 15000, xp: 22, level: 1, pace: "slow", mat: { good: "kapall25", qty: 1, bonus: 0.25 }, make: function (rng) { return makeRoute(rng); } },
    { id: "hledsla", name: "Hleðslustöð", blurb: "Straumur og lekaliði", seconds: 24, pay: 24000, xp: 28, level: 3, pace: "mid", mat: { good: "hledsla", qty: 1, bonus: 0.75 }, make: function (rng) { return makeHledsla(rng); } },
    { id: "pumpa", name: "Varmadæla", blurb: "Staðsettu og tengdu", seconds: 24, pay: 26000, xp: 28, level: 4, pace: "mid", mat: { good: "pumpa", qty: 1, bonus: 0.8 }, make: function () { return makePumpa(); } },
    { id: "virkjun", name: "Virkjunarverkefni", blurb: "Þrjú skref, stór laun", seconds: 40, pay: 45000, xp: 40, level: 6, pace: "slow", mat: { good: "tafla", qty: 1, bonus: 0.45 }, make: function (rng) { return makeVirkjun(rng); } }
  ];

  function jobType(id) {
    for (var i = 0; i < JOB_TYPES.length; i++) if (JOB_TYPES[i].id === id) return JOB_TYPES[i];
    return null;
  }

  function buildJob(type, state, rng, jackpot) {
    var level = levelOf(state.xp).current.level;
    var pay = Math.round(type.pay * (1 + (level - 1) * 0.16) / 100) * 100;
    if (jackpot) pay *= 4;
    var seen = state.stats.byType[type.id] || 0;
    return {
      uid: "j" + Math.floor(rng() * 1e9).toString(36),
      type: type.id,
      name: type.name,
      blurb: type.blurb,
      seconds: type.seconds,
      pay: pay,
      xp: type.xp,
      jackpot: !!jackpot,
      mat: type.mat || null,
      data: type.make(rng, state, seen)
    };
  }

  function makeJobs(state, rng) {
    var level = levelOf(state.xp).current.level;
    var open = JOB_TYPES.filter(function (t) { return t.level <= level; });
    var picked = [];
    function take(pool) {
      var avail = pool.filter(function (t) { return picked.indexOf(t) < 0; });
      if (!avail.length) return;
      picked.push(avail[Math.floor(rng() * avail.length)]);
    }
    var fast = open.filter(function (t) { return t.pace === "fast"; });
    var other = open.filter(function (t) { return t.pace !== "fast"; });
    take(fast.length ? fast : open);
    take(other.length ? other : open);
    take(open);
    var jackIndex = rng() < 0.12 ? Math.floor(rng() * picked.length) : -1;
    var jobs = picked.map(function (t, i) { return buildJob(t, state, rng, i === jackIndex); });
    return shuffle(jobs, rng);
  }

  function forceJackpot(jobs) {
    if (!jobs.length) return;
    if (jobs[0].jackpot) return;
    jobs[0].jackpot = true;
    jobs[0].pay *= 4;
  }

  function blankStats() {
    return {
      bought: 0,
      boughtQty: 0,
      sold: 0,
      soldQty: 0,
      profitSales: 0,
      jobs: 0,
      perfect: 0,
      speed: 0,
      bestCombo: 0,
      jackpots: 0,
      earned: 0,
      travels: 0,
      visited: ["reykjavik"],
      houses: 0,
      paidDebt: 0,
      plantWins: 0,
      loginStreak: 0,
      byType: {}
    };
  }

  function createState(rng, now) {
    rng = rng || Math.random;
    now = now || new Date();
    var state = {
      v: 1,
      day: 1,
      week: 1,
      dayInWeek: 1,
      cash: 45000,
      bank: 0,
      debt: 100000,
      rep: 42,
      xp: 0,
      loc: "reykjavik",
      inv: {},
      house: null,
      upgrades: [],
      achievements: [],
      firm: null,
      combo: 0,
      prices: {},
      jobs: [],
      today: { cash: 0, xp: 0 },
      challenges: null,
      weekPerfect: 0,
      stats: blankStats()
    };
    ensureChallenges(state, now);
    state.prices = rollPrices(state.loc, rng);
    forceDeal(state.prices, state.loc);
    state.jobs = makeJobs(state, rng);
    return state;
  }

  function buy(state, goodId, qty) {
    var g = good(goodId);
    qty = Math.min(qty, maxAffordable(state, goodId));
    if (!g || qty < 1) return { ok: false, reason: state.cash < (buyPrice(state, goodId) || 0) ? "cash" : "space" };
    var price = buyPrice(state, goodId);
    state.cash -= price * qty;
    addInv(state, goodId, qty, price);
    state.stats.bought += 1;
    state.stats.boughtQty += qty;
    return { ok: true, qty: qty, name: unitName(g, qty), gained: earnAchievement(state) };
  }

  function sell(state, goodId, qty) {
    var g = good(goodId);
    var owned = state.inv[goodId] ? state.inv[goodId].qty : 0;
    qty = Math.min(qty, owned);
    if (!g || qty < 1) return { ok: false, reason: "none" };
    var avg = state.inv[goodId].avg;
    var price = sellPrice(state, goodId);
    var profit = (price - avg) * qty;
    state.cash += price * qty;
    removeInv(state, goodId, qty);
    state.stats.sold += 1;
    state.stats.soldQty += qty;
    var challenges = [];
    if (profit > 0) {
      state.stats.profitSales += 1;
      state.stats.earned += profit;
      state.today.cash += profit;
      challenges = bump(state, "earn", profit);
    } else if (profit < 0) {
      state.today.cash += profit;
    }
    return { ok: true, qty: qty, name: unitName(g, qty), profit: profit, gained: earnAchievement(state), challenges: challenges };
  }

  function payDebt(state, amount) {
    var pay = Math.min(state.cash, state.debt, amount);
    if (pay <= 0) return { ok: false };
    state.cash -= pay;
    state.debt -= pay;
    state.stats.paidDebt += pay;
    return { ok: true, pay: pay, gained: earnAchievement(state) };
  }

  function deposit(state, amount) {
    var n = Math.min(state.cash, amount);
    if (n <= 0) return { ok: false };
    state.cash -= n;
    state.bank += n;
    return { ok: true, n: n };
  }

  function withdraw(state, amount) {
    var n = Math.min(state.bank, amount);
    if (n <= 0) return { ok: false };
    state.bank -= n;
    state.cash += n;
    return { ok: true, n: n };
  }

  function houseCost(state, house) {
    if (!house) return null;
    var refund = 0;
    if (state.house) {
      var cur = houseById(state.house);
      if (!cur || house.tier <= cur.tier) return null;
      refund = Math.round(cur.price * 0.7);
    }
    return { cost: house.price - refund, refund: refund };
  }

  function buyHouse(state, id) {
    var h = houseById(id);
    var quote = houseCost(state, h);
    if (!quote) return { ok: false, reason: "no" };
    if (state.cash < quote.cost) return { ok: false, reason: "cash", cost: quote.cost };
    state.cash -= quote.cost;
    state.house = h.id;
    state.rep = clamp(state.rep + h.rep, 0, 100);
    state.stats.houses += 1;
    return { ok: true, cost: quote.cost, name: h.name, gained: earnAchievement(state) };
  }

  function buyUpgrade(state, id) {
    var u = upgradeById(id);
    if (!u || state.upgrades.indexOf(id) >= 0) return { ok: false, reason: "no" };
    if (houseTier(state) < u.need) return { ok: false, reason: "tier" };
    if (state.cash < u.price) return { ok: false, reason: "cash" };
    state.cash -= u.price;
    state.upgrades.push(id);
    state.rep = clamp(state.rep + (u.rep || 0), 0, 100);
    return { ok: true, name: u.name, gained: earnAchievement(state) };
  }

  function matInfo(state, job) {
    if (!job.mat) return { mode: "none" };
    var m = job.mat;
    var g = good(m.good);
    var owned = state.inv[m.good] ? state.inv[m.good].qty : 0;
    if (m.qty === 0) {
      if (owned < 1) return { mode: "none" };
      return { mode: "tool", label: g.name + " hjálpar" };
    }
    if (owned < m.qty) return { mode: "none" };
    var pct = Math.round(m.bonus * 100);
    var label = "Nota 1 " + g.one + ", +" + pct + "%";
    if (g.base >= 20000) return { mode: "choice", label: label, question: "Nota 1 " + g.one + " af lager? Laun +" + pct + "%." };
    return { mode: "auto", label: label };
  }

  function syncRank(state, beforeLevel, rng) {
    var after = levelOf(state.xp);
    if (after.current.level <= beforeLevel) return { levelUp: null, unlocked: [], firmNew: null };
    var firmNew = null;
    if (after.current.level >= 6 && !state.firm) {
      state.firm = pick(rng, FIRMS);
      firmNew = state.firm;
    }
    var unlocked = JOB_TYPES.filter(function (t) { return t.level > beforeLevel && t.level <= after.current.level; })
      .map(function (t) { return { id: t.id, name: t.name, level: t.level }; });
    return { levelUp: after.current, unlocked: unlocked, firmNew: firmNew };
  }

  function applyReward(state, job, result, useMat, rng) {
    var before = levelOf(state.xp).current.level;
    var raw = clamp(result.ratio || 0, 0, 1);
    var usedHint = !!result.usedHint;
    var wrong = result.wrong || 0;
    var perfect = raw >= 0.999 && !usedHint && wrong === 0;
    var ratio = wrong > 0 ? Math.max(0.25, raw - wrong * 0.07) : raw;
    var speed = perfect && result.timeUsed != null && result.timeUsed <= job.seconds * 0.55;
    var challenges = [];
    var pay = Math.round(job.pay * ratio);
    if (perfect) pay = Math.round(pay * 1.5);
    if (speed) pay = Math.round(pay * 1.25);
    var matUsed = false;
    if (useMat && job.mat && ratio >= 0.5) {
      var owned = state.inv[job.mat.good] ? state.inv[job.mat.good].qty : 0;
      var need = job.mat.qty === 0 ? 1 : job.mat.qty;
      if (owned >= need) {
        if (job.mat.qty > 0) removeInv(state, job.mat.good, job.mat.qty);
        pay = Math.round(pay * (1 + job.mat.bonus));
        matUsed = true;
      }
    }
    pay = Math.round(pay * repFactor(state.rep) * payMul(state));
    if (perfect && state.combo >= 1) {
      var comboExtra = Math.round(pay * Math.min(0.5, state.combo * 0.1));
      pay += comboExtra;
    }
    if (ratio > 0) {
      state.cash += pay;
      state.today.cash += pay;
      state.stats.earned += pay;
      challenges = challenges.concat(bump(state, "earn", pay));
    } else pay = 0;
    var xpGain = Math.round(job.xp * Math.max(0.25, ratio) * (perfect ? 2 : 1) + (speed ? 10 : 0));
    state.xp += xpGain;
    state.today.xp += xpGain;
    state.stats.jobs += 1;
    state.stats.byType[job.type] = (state.stats.byType[job.type] || 0) + 1;
    challenges = challenges.concat(bump(state, "jobs", 1));
    if (perfect) {
      state.combo += 1;
      state.stats.perfect += 1;
      state.weekPerfect += 1;
      if (state.combo > state.stats.bestCombo) state.stats.bestCombo = state.combo;
      challenges = challenges.concat(bump(state, "perfect", 1));
      state.rep = clamp(state.rep + 6, 0, 100);
    } else if (ratio >= 0.67) {
      state.combo = 0;
      state.rep = clamp(state.rep + 3, 0, 100);
    } else {
      state.combo = 0;
      state.rep = clamp(state.rep - 4, 0, 100);
    }
    if (speed) state.stats.speed += 1;
    if (job.jackpot && ratio >= 0.67) state.stats.jackpots += 1;
    if (job.type === "virkjun" && ratio >= 0.67) state.stats.plantWins += 1;
    var rank = syncRank(state, before, rng);
    return {
      pay: pay,
      xp: xpGain,
      ratio: ratio,
      perfect: perfect,
      speed: speed,
      matUsed: matUsed,
      levelUp: rank.levelUp,
      unlocked: rank.unlocked,
      firmNew: rank.firmNew,
      challenges: challenges
    };
  }

  function applyEvent(state, event) {
    if (event.cash) {
      if (event.cash > 0) {
        state.cash += event.cash;
        event.noteAmount = event.cash;
      } else {
        var need = -event.cash;
        if (state.cash >= need) {
          state.cash -= need;
          event.noteAmount = event.cash;
        } else {
          var rest = need - state.cash;
          state.cash = 0;
          state.debt += rest;
          event.noteAmount = -need;
        }
      }
    }
    if (event.xp) state.xp += event.xp;
    if (event.rep) state.rep = clamp(state.rep + event.rep, 0, 100);
    if (event.mul) {
      for (var i = 0; i < event.mul.ids.length; i++) {
        var id = event.mul.ids[i];
        var g = good(id);
        state.prices[id] = roundPrice(g, state.prices[id] * event.mul.factor);
      }
    }
    if (event.theft) {
      var removed = stealSmall(state);
      if (!removed) event.text = "Þjófurinn fann ekkert í bílnum.";
    }
    if (event.grant) {
      var gg = good(event.grant.id);
      var space = capacity(state) - usedSpace(state);
      var n = Math.min(event.grant.qty, Math.floor(space / gg.size));
      if (n > 0) addInv(state, gg.id, n, state.prices[gg.id] || gg.base);
      else {
        state.cash += 8000;
        event.noteAmount = 8000;
        event.text = "Lagerinn fullur. Þú fékkst pening í staðinn.";
      }
    }
  }

  function stealSmall(state) {
    var items = [];
    Object.keys(state.inv).forEach(function (id) {
      items.push({ id: id, size: good(id).size, qty: state.inv[id].qty });
    });
    items.sort(function (a, b) { return a.size - b.size; });
    var removed = 0;
    for (var i = 0; i < items.length && removed < 3; i++) {
      var n = Math.min(items[i].qty, 3 - removed);
      if (n > 0 && removeInv(state, items[i].id, n)) removed += n;
    }
    return removed;
  }

  function rollEvent(state, rng) {
    if (rng() > 0.6) return null;
    var pool = [
      { w: 8, make: function () { return { text: "Vinnueftirlitið sektaði þig.", short: "Sekt", cash: -randInt(rng, 8000, 16000), rep: -6, bad: true }; } },
      { w: 8, when: function (s) { return usedSpace(s) > 0; }, make: function () { return { text: "Verkfæri hurfu úr bílnum.", short: "Þjófnaður", theft: true, bad: true }; } },
      { w: 8, make: function () { return { text: "Útsala. Kaplar á hrakvirði.", short: "Útsala", mul: { ids: ["kapall15", "kapall25", "kapall510"], factor: 0.62 } }; } },
      { w: 8, make: function () { return { text: "LED ljós hækka í verði.", short: "Verðhækkun", mul: { ids: ["led"], factor: 1.7 } }; } },
      { w: 8, make: function () { return { text: "Viðskiptavinur greiddi reikning.", short: "Reikningur", cash: randInt(rng, 4, 8) * 4000 }; } },
      { w: 2, make: function () { return { text: "Happdrætti. Þú vannst.", short: "Happdrætti", cash: randInt(rng, 14, 24) * 5000 }; } },
      { w: 8, make: function () { return { text: "Þú kenndir nema.", short: "Kennsla", xp: 22, rep: 4 }; } },
      { w: 8, make: function () { return { text: "Bíllinn bilaði.", short: "Viðgerð", cash: -randInt(rng, 6000, 14000), bad: true }; } },
      { w: 8, make: function () { return { text: "Þú fannst kapalbút.", short: "Fundur", grant: { id: "kapall25", qty: randInt(rng, 1, 3) } }; } },
      { w: 4, make: function () { return { text: "Stórsamningur bíður í verkum.", short: "Samningur", forceJackpot: true }; } },
      { w: 8, make: function () { return { text: "Nágranni gaf þjórfé.", short: "Þjórfé", cash: randInt(rng, 5, 12) * 1000, rep: 1 }; } },
      { w: 6, make: function () { return { text: "Ofgreiddur reikningur skilaðist.", short: "Endurgreiðsla", cash: randInt(rng, 8, 18) * 1000 }; } },
      { w: 8, make: function () { return { text: "Afsláttur af sjálfvörum.", short: "Afsláttur", mul: { ids: ["sjalfvari", "lekavardi"], factor: 0.7 } }; } },
      { w: 6, make: function () { return { text: "Rok. Aukaútkall borgar vel.", short: "Rok", cash: 15000, xp: 10 }; } }
    ];
    var open = pool.filter(function (e) { return !e.when || e.when(state); });
    var total = 0;
    for (var i = 0; i < open.length; i++) total += open[i].w;
    var r = rng() * total;
    for (var j = 0; j < open.length; j++) {
      r -= open[j].w;
      if (r <= 0) return open[j].make();
    }
    return open.length ? open[0].make() : null;
  }

  function advance(state, reason, rng, locId) {
    var actionCash = state.today.cash;
    var actionXp = state.today.xp;
    var notes = [];
    var interest = Math.round(state.debt * 0.03);
    if (interest > 0) {
      state.debt += interest;
      notes.push({ kind: "bad", label: "Vextir", amount: -interest });
    }
    var bankGain = Math.round(state.bank * 0.02);
    if (bankGain > 0) {
      state.bank += bankGain;
      notes.push({ kind: "good", label: "Bankavextir", amount: bankGain });
    }
    var housePay = dailyIncome(state);
    if (housePay > 0) {
      state.cash += housePay;
      notes.push({ kind: "good", label: "Hús", amount: housePay });
    }
    if (reason === "travel" && locId) state.loc = locId;
    state.prices = rollPrices(state.loc, rng);
    var levelBeforeEvent = levelOf(state.xp).current.level;
    var event = rollEvent(state, rng);
    var eventText = null;
    if (event) {
      applyEvent(state, event);
      eventText = event.text;
      notes.push({ kind: event.bad ? "bad" : "good", label: event.short, amount: event.noteAmount || 0 });
    }
    var rank = syncRank(state, levelBeforeEvent, rng);
    var finishedDay = state.day;
    var finishedSlot = state.dayInWeek;
    state.day += 1;
    state.dayInWeek += 1;
    var weekBonus = 0;
    if (state.dayInWeek > 7) {
      weekBonus = 18000 + state.week * 3000 + state.weekPerfect * 2500;
      state.cash += weekBonus;
      state.dayInWeek = 1;
      state.week += 1;
      state.weekPerfect = 0;
    }
    state.today = { cash: 0, xp: 0 };
    state.jobs = makeJobs(state, rng);
    if (event && event.forceJackpot) forceJackpot(state.jobs);
    var deal = bestDeal(state);
    return {
      reason: reason,
      actionCash: actionCash,
      actionXp: actionXp,
      notes: notes,
      eventText: eventText,
      weekBonus: weekBonus,
      deal: deal,
      gained: earnAchievement(state),
      loc: state.loc,
      here: locById(state.loc).here,
      day: state.day,
      week: state.week,
      finishedDay: finishedDay,
      finishedSlot: finishedSlot,
      levelUp: rank.levelUp,
      unlocked: rank.unlocked,
      firmNew: rank.firmNew
    };
  }

  function travel(state, locId, rng) {
    if (!locId || locId === state.loc) return null;
    var before = levelOf(state.xp).current.level;
    state.stats.travels += 1;
    if (state.stats.visited.indexOf(locId) < 0) state.stats.visited.push(locId);
    var challenges = bump(state, "travel", 1);
    var morning = advance(state, "travel", rng, locId);
    morning.challenges = challenges;
    var rank = syncRank(state, before, rng);
    if (rank.levelUp) morning.levelUp = rank.levelUp;
    morning.firmNew = morning.firmNew || rank.firmNew;
    morning.unlocked = mergeUnlocks(morning.unlocked, rank.unlocked);
    return morning;
  }

  function mergeUnlocks(a, b) {
    var out = [];
    var seen = {};
    var list = (a || []).concat(b || []);
    for (var i = 0; i < list.length; i++) {
      if (seen[list[i].id]) continue;
      seen[list[i].id] = true;
      out.push(list[i]);
    }
    return out;
  }

  function completeJob(state, job, result, useMat, rng) {
    var reward = applyReward(state, job, result, useMat, rng);
    var gainedEarly = earnAchievement(state);
    var morning = advance(state, "job", rng);
    var seen = {};
    morning.gained = gainedEarly.concat(morning.gained).filter(function (g) {
      if (seen[g.id]) return false;
      seen[g.id] = true;
      return true;
    });
    morning.reward = reward;
    morning.challenges = reward.challenges || [];
    if (reward.levelUp && (!morning.levelUp || reward.levelUp.level > morning.levelUp.level)) {
      morning.levelUp = reward.levelUp;
    }
    morning.levelUp = morning.levelUp || reward.levelUp;
    morning.firmNew = morning.firmNew || reward.firmNew;
    morning.unlocked = mergeUnlocks(reward.unlocked, morning.unlocked);
    return morning;
  }

  function tease(state) {
    var level = levelOf(state.xp).current.level;
    var nxt = null;
    for (var i = 0; i < JOB_TYPES.length; i++) {
      var t = JOB_TYPES[i];
      if (t.level > level && (!nxt || t.level < nxt.level)) nxt = t;
    }
    if (!nxt) return "";
    return "Opnast á þrepi " + nxt.level + ": " + nxt.name;
  }

  function nextHouse(state) {
    var tier = houseTier(state);
    var best = null;
    for (var i = 0; i < HOUSES.length; i++) {
      if (HOUSES[i].tier > tier && (!best || HOUSES[i].tier < best.tier)) best = HOUSES[i];
    }
    return best;
  }

  function nextUpgrade(state) {
    var tier = houseTier(state);
    var best = null;
    for (var i = 0; i < UPGRADES.length; i++) {
      var u = UPGRADES[i];
      if (state.upgrades.indexOf(u.id) >= 0) continue;
      if (tier < u.need) continue;
      if (!best || u.price < best.price) best = u;
    }
    return best;
  }

  function goals(state) {
    var out = [];
    var lv = levelOf(state.xp);
    if (lv.next) {
      var have = state.xp - lv.current.xp;
      var need = lv.next.xp - lv.current.xp;
      out.push({ id: "xp", title: lv.next.title, have: have, need: need, detail: have + "/" + need, ready: false, tab: "meira" });
    }
    var nh = nextHouse(state);
    if (nh) {
      var q = houseCost(state, nh);
      var haveCash = Math.min(state.cash, q.cost);
      out.push({
        id: "house",
        title: nh.name,
        have: haveCash,
        need: q.cost,
        detail: state.cash >= q.cost ? "tilbúið" : ("vantar " + formatKr(q.cost - state.cash)),
        ready: state.cash >= q.cost,
        tab: "hus"
      });
    }
    var up = nextUpgrade(state);
    if (up) {
      out.push({
        id: "up",
        title: up.name,
        have: Math.min(state.cash, up.price),
        need: up.price,
        detail: state.cash >= up.price ? "tilbúið" : ("vantar " + formatKr(up.price - state.cash)),
        ready: state.cash >= up.price,
        tab: "hus"
      });
    }
    out.sort(function (a, b) {
      if (a.ready !== b.ready) return a.ready ? -1 : 1;
      var ra = a.need ? a.have / a.need : 0;
      var rb = b.need ? b.have / b.need : 0;
      return rb - ra;
    });
    return out;
  }

  function coach(state) {
    if (state.stats.bought === 0) return "buy";
    if (state.stats.travels === 0) return "travel";
    if (state.stats.jobs === 0) return "job";
    if (!state.house && state.cash >= 30000) return "house";
    return "";
  }

  function sortedGoods(state) {
    var free = capacity(state) - usedSpace(state);
    var list = GOODS.map(function (g) {
      var raw = state.prices[g.id] || g.base;
      var price = buyPrice(state, g.id) || raw;
      var sp = sellPrice(state, g.id) || raw;
      var slot = state.inv[g.id];
      var owned = slot ? slot.qty : 0;
      var avg = slot ? slot.avg : 0;
      var ratio = raw / g.base;
      var sellNow = owned > 0 && sp >= avg * 1.12 && sp > avg + 40;
      var canBuy = price <= state.cash && g.size <= free;
      return { good: g, price: price, sellPrice: sp, ratio: ratio, owned: owned, avg: avg, sellNow: sellNow, canBuy: canBuy };
    });
    list.sort(function (a, b) {
      if (a.sellNow !== b.sellNow) return a.sellNow ? -1 : 1;
      if (a.canBuy !== b.canBuy) return a.canBuy ? -1 : 1;
      return a.ratio - b.ratio;
    });
    return list;
  }

  function gradeRows(rows, locked) {
    var ok = 0;
    for (var i = 0; i < rows.length; i++) if (locked[rows[i].id]) ok++;
    return { ok: ok, total: rows.length, ratio: rows.length ? ok / rows.length : 0 };
  }

  function gradePhase(assign, amps, bestSpread) {
    var placed = 0;
    for (var i = 0; i < assign.length; i++) if (assign[i] != null) placed++;
    if (placed < amps.length) return { ratio: amps.length ? (placed / amps.length) * 0.4 : 0 };
    var sums = [0, 0, 0];
    for (var k = 0; k < amps.length; k++) sums[assign[k]] += amps[k];
    var spread = Math.max(sums[0], sums[1], sums[2]) - Math.min(sums[0], sums[1], sums[2]);
    var ratio = 0.45;
    if (spread <= bestSpread) ratio = 1;
    else if (spread <= bestSpread + 8) ratio = 0.75;
    return { ratio: ratio, spread: spread };
  }

  function gradeRoute(path, route, illegal) {
    if (!path || !path.length) return { ratio: 0 };
    var reached = path[path.length - 1].x === route.goal.x && path[path.length - 1].y === route.goal.y;
    var steps = path.length - 1;
    if (!reached) return { ratio: steps > 0 ? 0.2 : 0, wrong: illegal || 0 };
    var ratio = 0.7;
    if (steps <= route.shortest) ratio = 1;
    else if (steps <= route.shortest + 2) ratio = 0.82;
    return { ratio: ratio, wrong: illegal || 0 };
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function dayLabel(state) {
    var prefix = state.week > 1 ? ("Vika " + state.week + ", ") : "";
    return prefix + "Dagur " + state.dayInWeek + "/7";
  }

  function interestDue(state) {
    return Math.round(state.debt * 0.03);
  }

  function bankDue(state) {
    return Math.round(state.bank * 0.02);
  }

  return {
    GOODS: GOODS,
    LOCS: LOCS,
    LEVELS: LEVELS,
    HOUSES: HOUSES,
    ROOMS: ROOMS,
    UPGRADES: UPGRADES,
    ACHIEVEMENTS: ACHIEVEMENTS,
    JOB_TYPES: JOB_TYPES,
    FIRMS: FIRMS,
    FAULTS: FAULTS,
    good: good,
    locById: locById,
    houseById: houseById,
    upgradeById: upgradeById,
    jobType: jobType,
    esc: esc,
    clamp: clamp,
    shuffle: shuffle,
    formatNum: formatNum,
    formatKr: formatKr,
    formatKrSigned: formatKrSigned,
    dateStr: dateStr,
    weekStr: weekStr,
    dayDiff: dayDiff,
    levelOf: levelOf,
    houseTier: houseTier,
    capacity: capacity,
    usedSpace: usedSpace,
    dailyIncome: dailyIncome,
    payMul: payMul,
    repFactor: repFactor,
    netWorth: netWorth,
    score: score,
    rollPrices: rollPrices,
    forceDeal: forceDeal,
    bestDeal: bestDeal,
    createState: createState,
    ensureChallenges: ensureChallenges,
    tradeQty: tradeQty,
    maxAffordable: maxAffordable,
    buy: buy,
    sell: sell,
    buyPrice: buyPrice,
    sellPrice: sellPrice,
    grantXp: grantXp,
    payDebt: payDebt,
    deposit: deposit,
    withdraw: withdraw,
    houseCost: houseCost,
    buyHouse: buyHouse,
    buyUpgrade: buyUpgrade,
    matInfo: matInfo,
    travel: travel,
    completeJob: completeJob,
    tease: tease,
    goals: goals,
    coach: coach,
    sortedGoods: sortedGoods,
    nextHouse: nextHouse,
    nextUpgrade: nextUpgrade,
    solvePhases: solvePhases,
    bfs: bfs,
    makeRoute: makeRoute,
    gradeRows: gradeRows,
    gradePhase: gradePhase,
    gradeRoute: gradeRoute,
    cableForAmps: cableForAmps,
    breakerForAmps: breakerForAmps,
    checkLogin: checkLogin,
    claimLogin: claimLogin,
    streakBonus: streakBonus,
    earnAchievement: earnAchievement,
    mulberry32: mulberry32,
    dayLabel: dayLabel,
    interestDue: interestDue,
    bankDue: bankDue,
    unitName: unitName,
    makeJobs: makeJobs,
    bump: bump
  };
});
