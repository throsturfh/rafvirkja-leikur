(function () {
  "use strict";
  var L = window.RafLogic;

  var RARITY = {
    common: { name: "Algeng", color: "#9fb2d8" },
    rare: { name: "Sjaldgæf", color: "#3aa0ff" },
    epic: { name: "Epísk", color: "#c05cff" },
    legendary: { name: "Goðsagnakennd", color: "#ffb100" }
  };
  var RORDER = ["common", "rare", "epic", "legendary"];

  var TOOLS = [
    { id: "skrufjarn", name: "Skrúfjárn", icon: "\ud83d\udd27", r: "common", b: { pay: 0.02 } },
    { id: "viratong", name: "Víratöng", icon: "\u2702\ufe0f", r: "common", b: { time: 0.04 } },
    { id: "vasaljos", name: "Vasaljós", icon: "\ud83d\udd26", r: "common", b: { cap: 2 } },
    { id: "malband", name: "Málband", icon: "\ud83d\udccf", r: "common", b: { sell: 0.01 } },
    { id: "penni", name: "Merkipenni", icon: "\u270f\ufe0f", r: "common", b: { buy: 0.01 } },
    { id: "silfurskruf", name: "Silfur skrúfjárn", icon: "\ud83d\udd29", r: "rare", b: { pay: 0.05 } },
    { id: "snjalltong", name: "Snjalltöng", icon: "\ud83d\udee0\ufe0f", r: "rare", b: { time: 0.08 } },
    { id: "kista", name: "Verkfærakista", icon: "\ud83e\uddf0", r: "rare", b: { cap: 5 } },
    { id: "borvel", name: "Hleðsluborvél", icon: "\ud83d\udd0b", r: "rare", b: { sell: 0.03 } },
    { id: "gullskruf", name: "Gull skrúfjárn", icon: "\u2699\ufe0f", r: "epic", b: { pay: 0.1 } },
    { id: "leysir", name: "Leysimælir", icon: "\ud83d\udce1", r: "epic", b: { time: 0.14 } },
    { id: "sendibill", name: "Stór sendibíll", icon: "\ud83d\ude9a", r: "epic", b: { cap: 10 } },
    { id: "verdsja", name: "Verðsjá", icon: "\ud83d\udd2e", r: "epic", b: { buy: 0.05 } },
    { id: "fjolmaelir", name: "Goðsagnakenndur fjölmælir", icon: "\ud83d\udcdf", r: "legendary", b: { pay: 0.2 } },
    { id: "thorshamar", name: "Þórshamar", icon: "\u26a1", r: "legendary", b: { time: 0.25 } },
    { id: "demantstong", name: "Demantstöng", icon: "\ud83d\udc8e", r: "legendary", b: { sell: 0.1, buy: 0.05 } },
    { id: "gulliviri", name: "Gullni vírinn", icon: "\ud83d\udc51", r: "legendary", b: { cap: 20 } }
  ];
  var SETS = {
    common: { pay: 0.04 },
    rare: { time: 0.08 },
    epic: { sell: 0.06, buy: 0.03 },
    legendary: { pay: 0.15, cap: 10 }
  };
  var DUPE = { common: 2500, rare: 9000, epic: 30000, legendary: 120000 };

  function toolById(id) {
    for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].id === id) return TOOLS[i];
    return null;
  }
  function toolsOf(r) { return TOOLS.filter(function (t) { return t.r === r; }); }

  function add(into, b) {
    for (var k in b) if (Object.prototype.hasOwnProperty.call(b, k)) into[k] = (into[k] || 0) + b[k];
  }

  function setDone(owned, r) {
    var l = toolsOf(r);
    for (var i = 0; i < l.length; i++) if (!owned[l[i].id]) return false;
    return true;
  }

  function bonuses(owned) {
    var out = { pay: 0, time: 0, sell: 0, buy: 0, cap: 0 };
    owned = owned || {};
    TOOLS.forEach(function (t) { if (owned[t.id]) add(out, t.b); });
    RORDER.forEach(function (r) { if (setDone(owned, r)) add(out, SETS[r]); });
    return out;
  }

  function bonusText(b) {
    var p = [];
    if (b.pay) p.push("+" + Math.round(b.pay * 100) + "% laun");
    if (b.time) p.push("+" + Math.round(b.time * 100) + "% tími");
    if (b.cap) p.push("+" + b.cap + " pláss");
    if (b.sell) p.push("+" + Math.round(b.sell * 100) + "% sala");
    if (b.buy) p.push("-" + Math.round(b.buy * 100) + "% kaup");
    return p.join(", ");
  }

  /* ---------- crates ---------- */
  var QUALITY = [
    { name: "Bronskassi", icon: "\ud83d\udce6", color: "#cd7f32" },
    { name: "Silfurkassi", icon: "\ud83d\udce6", color: "#cfd8f0" },
    { name: "Gullkassi", icon: "\ud83c\udf81", color: "#ffd21f" },
    { name: "Demantskassi", icon: "\ud83d\udc8e", color: "#22e6ff" }
  ];

  function unit(level) { return Math.max(500, Math.round(1000 * (1 + (level - 1) * 0.45) / 100) * 100); }

  function wpick(rng, items) {
    var sum = 0;
    items.forEach(function (i) { sum += i.w; });
    var r = rng() * sum;
    for (var i = 0; i < items.length; i++) {
      r -= items[i].w;
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  function pickTool(rng, owned, rarity) {
    var list = toolsOf(rarity);
    var open = list.filter(function (t) { return !owned[t.id]; });
    if (open.length) return { tool: open[Math.floor(rng() * open.length)], dupe: false };
    return { tool: list[Math.floor(rng() * list.length)], dupe: true };
  }

  function rollToolReward(rng, owned, q, minRarity) {
    var ws = [
      { r: "common", w: 62 - q * 12 },
      { r: "rare", w: 28 + q * 3 },
      { r: "epic", w: 8 + q * 6 },
      { r: "legendary", w: 2 + q * 3 }
    ];
    if (minRarity) ws = ws.filter(function (x) { return RORDER.indexOf(x.r) >= RORDER.indexOf(minRarity); });
    var r = wpick(rng, ws).r;
    var got = pickTool(rng, owned, r);
    if (got.dupe) {
      var u = null;
      for (var i = 0; i < RORDER.length && !u; i++) {
        var g = pickTool(rng, owned, RORDER[i]);
        if (!g.dupe) u = g;
      }
      if (u) got = u;
    }
    if (got.dupe) return { kind: "coins", tier: "mid", amount: DUPE[got.tool.r], icon: got.tool.icon, label: "Afrit: " + got.tool.name, dupe: true };
    return { kind: "tool", tool: got.tool, tier: got.tool.r, label: got.tool.name, icon: got.tool.icon };
  }

  function rollCrate(q, level, meta, rng, opts) {
    opts = opts || {};
    var u = unit(level);
    var owned = meta.tools || {};
    var pity = meta.pity || 0;
    if (opts.forceTool) return rollToolReward(rng, owned, q, opts.minRarity);
    var freezeOk = !meta.login || (meta.login.freezes || 0) < 3;
    var items = [
      { k: "small", w: 46 - q * 8 },
      { k: "mid", w: 26 },
      { k: "big", w: 7 + q * 3 },
      { k: "tool", w: pity >= 6 ? 400 : 7 + q * 5 },
      { k: "xp", w: 8 },
      { k: "spin", w: 6 },
      { k: "freeze", w: freezeOk ? 1.5 : 0 },
      { k: "jackpot", w: 0.4 + q * 0.35 },
      { k: "voucher", w: opts.S && L.vehicleOf(opts.S).tier < 5 ? 1.2 + q * 0.4 : 0 }
    ];
    var it = wpick(rng, items).k;
    if (it === "small") return { kind: "coins", tier: "small", amount: Math.round(u * (0.6 + rng()) / 100) * 100, icon: "\ud83d\udcb0", label: "Smáaurar" };
    if (it === "mid") return { kind: "coins", tier: "mid", amount: Math.round(u * (3 + rng() * 3) / 100) * 100, icon: "\ud83d\udcb0", label: "Peningar" };
    if (it === "big") return { kind: "coins", tier: "big", amount: Math.round(u * (10 + rng() * 8) / 100) * 100, icon: "\ud83e\udd11", label: "Stórfé" };
    if (it === "jackpot") return { kind: "coins", tier: "jackpot", amount: Math.round(u * 60 / 100) * 100, icon: "\ud83d\udc8e", label: "STÓRVINNINGUR" };
    if (it === "xp") return { kind: "xp", tier: "mid", amount: 15 + level * 5 + q * 10, icon: "\u2b50", label: "Reynsla" };
    if (it === "spin") return { kind: "spin", tier: "mid", amount: 1, icon: "\ud83c\udfa1", label: "Frítt hjól" };
    if (it === "freeze") return { kind: "freeze", tier: "epic", amount: 1, icon: "\u2744\ufe0f", label: "Frystir fyrir röðina" };
    if (it === "voucher") return { kind: "voucher", tier: "epic", amount: 1, icon: "\ud83c\udf9f\ufe0f", label: "Bílamiði" };
    return rollToolReward(rng, owned, q);
  }

  /* wheel: 8 segments, jackpot at 6 */
  var WHEEL = [
    { k: "small", icon: "\ud83d\udcb0", color: "#1f9d62" },
    { k: "xp", icon: "\u2b50", color: "#2a6cff" },
    { k: "mid", icon: "\ud83d\udcb5", color: "#18a8c4" },
    { k: "tool", icon: "\ud83e\uddf0", color: "#8b4dff" },
    { k: "small", icon: "\ud83d\udcb0", color: "#1f9d62" },
    { k: "spin", icon: "\ud83c\udfa1", color: "#ff7a3d" },
    { k: "jackpot", icon: "\ud83d\udc8e", color: "#ffb100" },
    { k: "small", icon: "\ud83d\udcb0", color: "#1f9d62" }
  ];
  function wheelRoll(rng) {
    var r = rng() * 100;
    var idx;
    if (r < 3) idx = 6;
    else if (r < 15) idx = 3;
    else if (r < 25) idx = 5;
    else if (r < 40) idx = 1;
    else if (r < 55) idx = 2;
    else idx = [0, 4, 7][Math.floor(rng() * 3)];
    return idx;
  }
  function wheelReward(idx, level, meta, rng) {
    var k = WHEEL[idx].k;
    var u = unit(level);
    if (k === "small") return { kind: "coins", tier: "small", amount: Math.round(u * (1.5 + rng()) / 100) * 100, icon: "\ud83d\udcb0", label: "Peningar" };
    if (k === "mid") return { kind: "coins", tier: "mid", amount: Math.round(u * (5 + rng() * 4) / 100) * 100, icon: "\ud83d\udcb5", label: "Stórar upphæðir" };
    if (k === "jackpot") return { kind: "coins", tier: "jackpot", amount: Math.round(u * 80 / 100) * 100, icon: "\ud83d\udc8e", label: "STÓRVINNINGUR" };
    if (k === "xp") return { kind: "xp", tier: "mid", amount: 25 + level * 6, icon: "\u2b50", label: "Reynsla" };
    if (k === "spin") return { kind: "spin", tier: "mid", amount: 1, icon: "\ud83c\udfa1", label: "Annað hjól" };
    return rollToolReward(rng, meta.tools || {}, 2);
  }

  /* apply a reward; returns { rank } extra */
  function applyReward(S, meta, rw, rng) {
    var extra = {};
    if (rw.kind === "coins") {
      S.cash += rw.amount;
      S.today.cash += rw.amount;
      meta.pity = (meta.pity || 0) + 1;
    } else if (rw.kind === "xp") {
      extra.rank = L.grantXp(S, rw.amount, rng);
      meta.pity = (meta.pity || 0) + 1;
    } else if (rw.kind === "spin") {
      S.spins = (S.spins || 0) + 1;
      meta.pity = (meta.pity || 0) + 1;
    } else if (rw.kind === "voucher") {
      S.voucher = (S.voucher || 0) + 1;
    } else if (rw.kind === "freeze") {
      if (!meta.login) meta.login = { last: null, streak: 0, forgive: false, claimedDate: null, pending: null };
      meta.login.freezes = (meta.login.freezes || 0) + 1;
    } else if (rw.kind === "tool") {
      if (!meta.tools) meta.tools = {};
      meta.tools[rw.tool.id] = 1;
      meta.pity = 0;
      extra.newTool = true;
    }
    return extra;
  }

  /* ---------- micro goals ---------- */
  function mscale(S) { return unit(L.levelOf(S.xp).current.level); }

  function makeGoal(S, kind, rng) {
    var u = mscale(S);
    var n;
    var g = { id: "g" + Math.floor(rng() * 1e9).toString(36), k: kind, have: 0, cash: 0, icon: "", label: "", need: 1 };
    if (kind === "sell") { n = 4 + Math.floor(rng() * 4); g.need = n; g.label = "Seldu " + n + " vörur"; g.icon = "\ud83d\udcb8"; g.cash = u * 1.2; }
    else if (kind === "buy") { n = 4 + Math.floor(rng() * 4); g.need = n; g.label = "Keyptu " + n + " vörur"; g.icon = "\ud83d\uded2"; g.cash = u * 1.0; }
    else if (kind === "profit") { n = Math.max(1000, Math.round(u * 1.5 / 500) * 500); g.need = n; g.label = "Græddu " + L.formatNum(n) + " kr."; g.icon = "\ud83d\udcc8"; g.cash = u * 1.6; }
    else if (kind === "job") { g.need = 1; g.label = "Kláraðu verk"; g.icon = "\ud83d\udd27"; g.cash = u * 1.2; }
    else if (kind === "fast") { g.need = 1; g.limit = 14; g.label = "Verk á undir 14 sek."; g.icon = "\u26a1"; g.cash = u * 2.2; }
    else if (kind === "perfect") { g.need = 1; g.label = "Fullkomið verk"; g.icon = "\ud83c\udfaf"; g.cash = u * 2.0; }
    else if (kind === "space") { g.need = 1; g.label = "Keyptu meira pláss"; g.icon = "\ud83d\ude90"; g.cash = u * 3; }
    else if (kind === "travel") { g.need = 1; g.label = "Farðu í annan bæ"; g.icon = "\ud83d\ude90"; g.cash = u * 1.0; }
    g.cash = Math.round(g.cash / 100) * 100;
    return g;
  }

  var KINDS = ["sell", "buy", "profit", "job", "fast", "perfect", "travel", "space"];

  function fillGoals(S, rng) {
    if (!S.micro) S.micro = [];
    var guard = 0;
    while (S.micro.length < 3 && guard++ < 30) {
      var used = S.micro.map(function (g) { return g.k; });
      var pool = KINDS.filter(function (k) { return used.indexOf(k) < 0; });
      if (!S.stats || !S.stats.jobs) pool = pool.filter(function (k) { return k !== "fast" && k !== "perfect"; });
      var ns = L.nextSpace(S);
      if (!ns || ns.locked || S.cash < ns.cost * 0.35 || S.cash > ns.cost * 3) pool = pool.filter(function (k) { return k !== "space"; });
      if (!pool.length) pool = KINDS;
      var kind = pool[Math.floor(rng() * pool.length)];
      S.micro.push(makeGoal(S, kind, rng));
    }
  }

  function firstGoals(S, rng) {
    S.micro = [makeGoal(S, "job", rng), makeGoal(S, "buy", rng), makeGoal(S, "sell", rng)];
    S.micro[0].cash = 3000;
    S.micro[1].need = 2; S.micro[1].label = "Keyptu 2 vörur"; S.micro[1].cash = 2000;
    S.micro[2].need = 2; S.micro[2].label = "Seldu 2 vörur"; S.micro[2].cash = 2500;
  }

  /* returns list of completed goals (reward applied, goal replaced) */
  function microEvent(S, kind, amount, info, rng) {
    if (!S.micro) return [];
    var done = [];
    for (var i = 0; i < S.micro.length; i++) {
      var g = S.micro[i];
      var add1 = 0;
      if (g.k === kind) {
        if (kind === "job" || kind === "travel") add1 = 1;
        else add1 = amount;
      } else if (kind === "job" && info) {
        if (g.k === "perfect" && info.perfect) add1 = 1;
        if (g.k === "fast" && info.ratio >= 0.67 && info.timeUsed != null && info.timeUsed <= (g.limit || 14)) add1 = 1;
      }
      if (add1 <= 0) continue;
      g.have = Math.min(g.need, g.have + add1);
      if (g.have >= g.need) {
        S.cash += g.cash;
        S.today.cash += g.cash;
        done.push({ label: g.label, cash: g.cash, icon: g.icon });
        S.micro.splice(i, 1);
        i--;
        S.microDone = (S.microDone || 0) + 1;
      }
    }
    if (done.length) fillGoals(S, rng);
    return done;
  }

  /* ---------- crew (passive income) ---------- */
  var CREW = [
    { id: "nemi", name: "Nemi", icon: "\ud83d\udd27", rate: 150, cost: 15000, lvl: 2 },
    { id: "sveinn", name: "Sveinn", icon: "\ud83d\udc77", rate: 700, cost: 80000, lvl: 4 },
    { id: "meistari", name: "Meistari", icon: "\ud83c\udfd7\ufe0f", rate: 2800, cost: 350000, lvl: 6 }
  ];
  var CAPH = [2, 4, 6, 8];
  var CAPCOST = [60000, 250000, 800000];

  function crewInit(S, now) {
    if (!S.crew) S.crew = { nemi: 0, sveinn: 0, meistari: 0, cap: 0, last: now, bank: 0 };
    if (!S.crew.last) S.crew.last = now;
    if (!S.crew.bank) S.crew.bank = 0;
    return S.crew;
  }
  function crewCost(c, n) { return Math.round(c.cost * Math.pow(1.18, n) / 100) * 100; }
  function crewRate(S) {
    var r = 0;
    CREW.forEach(function (c) { r += (S.crew && S.crew[c.id] || 0) * c.rate; });
    return r;
  }
  function crewCapH(S) { return CAPH[Math.min(CAPH.length - 1, (S.crew && S.crew.cap) || 0)]; }
  function crewMax(S) { return Math.floor(crewRate(S) * crewCapH(S) * 60 / 60); }
  function crewPending(S, now) {
    if (!S.crew) return 0;
    var rate = crewRate(S);
    var mins = Math.max(0, (now - S.crew.last) / 60000);
    var cap = crewCapH(S) * 60;
    return Math.floor((S.crew.bank || 0) + rate * Math.min(mins, cap));
  }
  function crewSettle(S, now) {
    S.crew.bank = Math.min(crewPending(S, now), crewMax(S));
    S.crew.last = now;
  }
  function crewCollect(S, now) {
    var n = Math.min(crewPending(S, now), crewMax(S));
    S.crew.bank = 0;
    S.crew.last = now;
    S.cash += n;
    S.today.cash += n;
    return n;
  }
  function crewHire(S, id, now) {
    var c = CREW.filter(function (x) { return x.id === id; })[0];
    if (!c) return { ok: false };
    if (L.levelOf(S.xp).current.level < c.lvl) return { ok: false, reason: "lvl" };
    var cost = crewCost(c, S.crew[id] || 0);
    if (S.cash < cost) return { ok: false, reason: "cash" };
    crewSettle(S, now);
    S.cash -= cost;
    S.crew[id] = (S.crew[id] || 0) + 1;
    return { ok: true, cost: cost };
  }
  function crewCapUp(S, now) {
    var lvl = S.crew.cap || 0;
    if (lvl >= CAPCOST.length) return { ok: false, reason: "max" };
    if (S.cash < CAPCOST[lvl]) return { ok: false, reason: "cash" };
    crewSettle(S, now);
    S.cash -= CAPCOST[lvl];
    S.crew.cap = lvl + 1;
    return { ok: true, cost: CAPCOST[lvl] };
  }

  /* ---------- league ---------- */
  var TIERS = [
    { id: "Brons", icon: "\ud83e\udd49", min: 0, color: "#cd7f32" },
    { id: "Silfur", icon: "\ud83e\udd48", min: 1500, color: "#cfd8f0" },
    { id: "Gull", icon: "\ud83e\udd47", min: 6000, color: "#ffd21f" },
    { id: "Demantur", icon: "\ud83d\udc8e", min: 20000, color: "#22e6ff" }
  ];
  function tierIdx(score) {
    var t = 0;
    for (var i = 0; i < TIERS.length; i++) if (score >= TIERS[i].min) t = i;
    return t;
  }
  function weekReset(meta, now) {
    var id = L.weekStr(now);
    var prev = null;
    if (!meta.week || typeof meta.week !== "object") meta.week = { id: id, score: 0, tier: 0 };
    else if (meta.week.id !== id) {
      prev = { id: meta.week.id, score: meta.week.score || 0, tier: meta.week.tier || 0 };
      meta.week = { id: id, score: 0, tier: 0 };
    }
    return prev;
  }
  /* add earnings in kr; returns new tier index if promoted else -1 */
  function gain(meta, kr) {
    if (!meta.week) return -1;
    var pts = Math.max(0, Math.round(kr / 100));
    if (!pts) return -1;
    meta.week.score += pts;
    var t = tierIdx(meta.week.score);
    if (t > (meta.week.tier || 0)) { meta.week.tier = t; return t; }
    return -1;
  }
  function computeLeague(rows, myId, myScore, myName) {
    var list = (rows || []).filter(function (r) { return r.player_id !== myId; }).map(function (r) {
      return { id: r.player_id, name: r.name, score: Number(r.week_score) || 0, league: r.league };
    });
    list.push({ id: myId, name: myName, score: myScore, me: true });
    list.sort(function (a, b) { return b.score - a.score || (a.me ? -1 : 1); });
    var idx = 0;
    list.forEach(function (r, i) { if (r.me) idx = i; });
    return {
      rank: idx + 1,
      total: list.length,
      rows: list,
      above: idx > 0 ? { id: list[idx - 1].id, name: list[idx - 1].name, diff: list[idx - 1].score - myScore } : null,
      below: idx < list.length - 1 ? list[idx + 1] : null,
      aboveIds: list.slice(0, idx).map(function (r) { return r.id; })
    };
  }

  /* ---------- streak calendar ---------- */
  var DAY_ICON = ["\ud83d\udcb0", "\ud83d\udcb0", "\ud83d\udce6", "\ud83d\udcb0", "\ud83c\udfa1", "\ud83d\udcb0", "\ud83d\udc51"];

  var CALLOUTS = [
    { t: "Rafmagnslaust á Landspítalanum!", i: "\ud83c\udfe5" },
    { t: "Sjálfvarinn sló út í Hörpu!", i: "\ud83c\udfb6" },
    { t: "Myrkur á Laugardalsvelli!", i: "\u26bd" },
    { t: "Bilun í frystihúsi á Ísafirði!", i: "\ud83d\udc1f" },
    { t: "Neyðarljósin dóu í Kringlunni!", i: "\ud83d\udecd\ufe0f" },
    { t: "Hleðslustöð brennur yfir í Keflavík!", i: "\ud83d\udd25" },
    { t: "Slökkt á umferðarljósunum!", i: "\ud83d\udea6" }
  ];

  window.RafFun = {
    RARITY: RARITY, RORDER: RORDER, TOOLS: TOOLS, SETS: SETS, QUALITY: QUALITY, WHEEL: WHEEL, CREW: CREW, CAPH: CAPH, CAPCOST: CAPCOST,
    TIERS: TIERS, DAY_ICON: DAY_ICON, CALLOUTS: CALLOUTS,
    toolById: toolById, toolsOf: toolsOf, setDone: setDone, bonuses: bonuses, bonusText: bonusText,
    rollCrate: rollCrate, rollToolReward: rollToolReward, wheelRoll: wheelRoll, wheelReward: wheelReward, applyReward: applyReward, unit: unit,
    fillGoals: fillGoals, firstGoals: firstGoals, microEvent: microEvent,
    crewInit: crewInit, crewCost: crewCost, crewRate: crewRate, crewCapH: crewCapH, crewMax: crewMax, crewPending: crewPending,
    crewCollect: crewCollect, crewHire: crewHire, crewCapUp: crewCapUp,
    tierIdx: tierIdx, weekReset: weekReset, gain: gain, computeLeague: computeLeague
  };
})();
