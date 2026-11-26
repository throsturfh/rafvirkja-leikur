(function () {
  "use strict";
  var L = window.RafLogic;
  var SAVE = "rafvirkja-leikur-v1";
  var META_KEY = "rafvirkja-leikur-meta";
  var S = null;
  var Meta = null;
  var ui = { tab: "markadur", qty: "1", lock: false, jobUid: null, pendingJob: null, queue: [], nextCall: Date.now() + 60000, boardTab: "week", league: null, leagueRows: null };
  var gesture = { x: 0, y: 0, moved: false };
  var C = window.RafCloud;
  var F = window.RafFun;
  var prevLed = {};
  var GOOD_ICON = {
    innstunga: "\ud83d\udd0c", rofi: "\ud83d\udca1", lekavardi: "\ud83d\udee1\ufe0f", sjalfvari: "\ud83d\udd18",
    tafla: "\ud83c\udf9b\ufe0f", kapall15: "\u27b0", kapall25: "\u27b0", kapall510: "\ud83e\uddf5", ror: "\ud83d\udd29",
    led: "\ud83d\udd06", hledsla: "\ud83d\udd0b", pumpa: "\u2668\ufe0f", maelitaki: "\ud83d\udcdf", solar: "\u2600\ufe0f", snertill: "\ud83e\uddf2"
  };
  var LOC_ICON = {
    reykjavik: "\ud83c\udfd9\ufe0f", hafnarfjordur: "\u2693", kopavogur: "\ud83c\udfe2", akureyri: "\u26f0\ufe0f",
    selfoss: "\ud83c\udf3e", keflavik: "\u2708\ufe0f", egilsstadir: "\ud83c\udf32", isafjordur: "\u2744\ufe0f"
  };
  var JOB_ICON = {
    litir: "\ud83c\udfa8", nod: "\ud83d\udea8", bilun: "\ud83d\udd0d", heimili: "\ud83c\udfe0", idnadur: "\ud83c\udfed",
    fasar: "\ud83d\udd00", leidsla: "\ud83e\udded", hledsla: "\ud83d\udd0c", pumpa: "\u2668\ufe0f", virkjun: "\u26a1"
  };
  var HOUSE_ICON = { kjallari: "\ud83d\udeaa", ibud: "\ud83c\udfe2", radhus: "\ud83c\udfd8\ufe0f", einbyli: "\ud83c\udfe1", villa: "\ud83c\udff0" };
  function ico(map, id, fallback) { return '<span class="ico" aria-hidden="true">' + (map[id] || fallback) + "</span>"; }
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function loadMeta() {
    try {
      var raw = localStorage.getItem(META_KEY);
      if (raw) {
        var m = JSON.parse(raw);
        if (m && typeof m === "object") return m;
      }
    } catch (err) { /* ignore broken meta */ }
    return { best: 0, sound: true, login: null, tools: {}, week: null, pity: 0, crates: 0 };
  }

  function saveMeta() {
    try { localStorage.setItem(META_KEY, JSON.stringify(Meta)); } catch (err) { /* private mode */ }
  }

  function commit() {
    try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (err) { /* private mode */ }
    var sc = L.score(S);
    if (!Meta.best || sc > Meta.best) Meta.best = sc;
    S.bonus = F.bonuses(Meta.tools);
    saveMeta();
  }

  function repair(s) {
    if (!s.inv) s.inv = {};
    if (!s.upgrades) s.upgrades = [];
    if (!s.achievements) s.achievements = [];
    if (!s.stats) {
      s.stats = {
        bought: 0, boughtQty: 0, sold: 0, soldQty: 0, profitSales: 0, jobs: 0, perfect: 0,
        speed: 0, bestCombo: 0, jackpots: 0, earned: 0, travels: 0, visited: [s.loc || "reykjavik"],
        houses: 0, paidDebt: 0, plantWins: 0, loginStreak: 0, byType: {}
      };
    }
    if (!s.stats.byType) s.stats.byType = {};
    if (!s.stats.visited) s.stats.visited = [s.loc || "reykjavik"];
    if (typeof s.weekPerfect !== "number") s.weekPerfect = 0;
    if (typeof s.combo !== "number") s.combo = 0;
    if (typeof s.rep !== "number") s.rep = 42;
    if (!s.today) s.today = { cash: 0, xp: 0 };
    if (!s.loc) s.loc = "reykjavik";
    if (!s.prices) s.prices = L.rollPrices(s.loc, Math.random);
    L.ensureChallenges(s, new Date());
    if (!s.jobs || !s.jobs.length) s.jobs = L.makeJobs(s, Math.random);
    ensureExtras(s);
    return s;
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(SAVE);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || s.v !== 1 || typeof s.cash !== "number") return null;
      return repair(s);
    } catch (err) {
      return null;
    }
  }

  function clearToasts() {
    var box = document.getElementById("toasts");
    if (box) box.innerHTML = "";
  }

  function toast(msg, kind) {
    var box = document.getElementById("toasts");
    if (!box) return;
    var el = document.createElement("div");
    el.className = "toast " + (kind || "");
    el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 4) box.removeChild(box.firstChild);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1500);
  }

  function sfx() { return window.RafSfx; }

  function celebrate(res) {
    if (!res) return;
    (res.gained || []).forEach(function (a) { toast("Afrek: " + a.name, "gold"); });
    (res.challenges || []).forEach(function (c) { toast("Áskorun. " + c.label, "gold"); });
    if ((res.gained && res.gained.length) || (res.challenges && res.challenges.length)) {
      if (sfx()) sfx().win();
      cloudSync(false);
    }
  }

  function hideOverlay() {
    if (ui.crate && !ui.crate.done) resolveCrate();
    if (window.RafPuzzles) window.RafPuzzles.destroy();
    var ov = document.getElementById("overlay");
    ov.hidden = true;
    ov.className = "";
    ov.innerHTML = "";
    ui.lock = false;
    ui.jobUid = null;
    ui.spinning = false;
    if (ui.queue.length) setTimeout(runQueue, 160);
  }

  function runQueue() {
    if (ui.lock || !ui.queue.length) return;
    var f = ui.queue.shift();
    f();
  }
  function render(opts) {
    opts = opts || {};
    var main = document.querySelector(".main");
    var y = opts.keepScroll && main ? main.scrollTop : 0;
    document.getElementById("app").innerHTML = appHTML(!!opts.pop);
    var main2 = document.querySelector(".main");
    if (opts.keepScroll && main2) main2.scrollTop = y;
    tickLeds();
  }

  function tween(el, from, to, fmt) {
    if (reduceMotion || from === to) { el.textContent = fmt(to); return; }
    var t0 = performance.now();
    var dur = 520;
    function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(from + (to - from) * e));
      if (k < 1 && el.isConnected) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function tickLeds() {
    var els = document.querySelectorAll("[data-led]");
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute("data-led");
      var to = Number(els[i].getAttribute("data-v"));
      var from = typeof prevLed[key] === "number" ? prevLed[key] : to;
      prevLed[key] = to;
      if (from !== to) {
        els[i].classList.add(to > from ? "up" : "down");
        tween(els[i], from, to, L.formatNum);
      }
    }
  }

  function countUps(root) {
    var els = root.querySelectorAll("[data-count]");
    for (var i = 0; i < els.length; i++) {
      var to = Number(els[i].getAttribute("data-count"));
      var mode = els[i].getAttribute("data-mode");
      var fmt = mode === "xp" ? function (n) { return "+" + n + " reynsla"; } : (mode === "krs" ? L.formatKrSigned : L.formatKr);
      tween(els[i], 0, to, fmt);
    }
  }

  function burst(host) {
    if (reduceMotion || !host) return;
    var box = document.createElement("div");
    box.className = "burst";
    var colors = ["#ffe14a", "#22e6ff", "#ff4fd8", "#7dff7a", "#ffffff"];
    for (var i = 0; i < 28; i++) {
      var p = document.createElement("i");
      var ang = (i / 28) * Math.PI * 2 + Math.random() * 0.4;
      var dist = 90 + Math.random() * 120;
      p.style.setProperty("--dx", Math.round(Math.cos(ang) * dist) + "px");
      p.style.setProperty("--dy", Math.round(Math.sin(ang) * dist - 30) + "px");
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.08) + "s";
      box.appendChild(p);
    }
    host.appendChild(box);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 1400);
  }

  function cloudSync(now) {
    if (C) C.sync(S, Meta, L, !!now);
  }

  function goalHTML() {
    var gs = L.goals(S);
    var g = gs[0];
    var tease = L.tease(S);
    var pct = g && g.need ? Math.max(4, Math.min(100, Math.round((g.have / g.need) * 100))) : 100;
    var label = "Haltu áfram";
    if (g) label = g.ready ? ("Tilbúið: " + g.title) : ("Næst: " + g.title + "  " + g.detail);
    var dots = "";
    if (S.challenges && S.challenges.daily) {
      S.challenges.daily.forEach(function (c) { dots += '<i class="' + (c.done ? "on" : "") + '"></i>'; });
    }
    return '<button type="button" class="goal" data-act="goal" data-id="' + (g ? g.tab : "meira") + '">' +
      '<div class="goal-top"><div class="gbar"><span style="width:' + pct + '%"></span></div><span class="pips">' + dots + "</span></div>" +
      '<div class="goal-title">' + L.esc(label) + "</div>" +
      (tease ? '<div class="goal-tease">' + L.esc(tease) + "</div>" : "") +
      "</button>";
  }

  function ledHTML(key, cls, label, val) {
    return '<div class="led ' + cls + '"><span>' + label + '</span><b data-led="' + key + '" data-v="' + val + '">' + L.formatNum(val) + "</b></div>";
  }

  function microHTML() {
    return '<div class="micro">' + (S.micro || []).map(function (g) {
      var pct = Math.max(4, Math.round(g.have / g.need * 100));
      return '<div class="mg' + (g.have > 0 ? " go" : "") + '"><div class="mg-t"><i>' + g.icon + "</i><span>" + L.esc(g.label) + "</span></div>" +
        '<div class="mbar"><span style="width:' + pct + '%"></span></div><div class="mg-r">+' + L.formatNum(g.cash) + "</div></div>";
    }).join("") + "</div>";
  }

  function headerHTML(pop) {
    var used = L.usedSpace(S);
    var cap = L.capacity(S);
    var hot = used >= cap ? " hot" : "";
    var lv = L.levelOf(S.xp);
    var xpPct = lv.next ? Math.max(3, Math.min(100, Math.round(((S.xp - lv.current.xp) / (lv.next.xp - lv.current.xp)) * 100))) : 100;
    return '<header class="top">' +
      '<div class="titlebar">' +
      '<div class="lvl" title="Þrep"><b>' + lv.current.level + '</b></div>' +
      '<div class="who"><div class="title">' + L.esc(lv.current.title) + '</div>' +
      '<div class="xpbar"><span style="width:' + xpPct + '%"></span></div></div>' +
      '<div class="day">' + L.esc(L.dayLabel(S)) + "</div>" +
      (S.combo >= 2 ? '<div class="combo">\ud83d\udd25 ' + S.combo + "</div>" : "") +
      ((S.spins || 0) > 0 ? '<button type="button" class="iconbtn spin" data-act="wheel-open" aria-label="Hjól">\ud83c\udfa1<b>' + S.spins + "</b></button>" : "") +
      '<button type="button" class="iconbtn' + (Meta.sound ? "" : " off") + '" data-act="sound" aria-label="Hljóð">\u266a</button>' +
      "</div>" +
      '<div class="leds' + (pop ? " pop" : "") + '">' +
      ledHTML("cash", "g", "PENINGAR", S.cash) +
      ledHTML("bank", "g", "BANKI", S.bank) +
      ledHTML("debt", "r", "SKULD", S.debt) +
      '<div class="led y tap' + hot + '" data-act="garage"><span>' + L.esc(L.vehicleOf(S).short.toUpperCase()) + '</span><b>' + L.vehicleOf(S).icon + " " + used + "/" + cap + "</b></div>" +
      "</div>" +
      '<button type="button" class="league" id="leaguechip" data-act="board">' + leagueChipHTML() + "</button>" +
      microHTML() +
      "</header>";
  }
  function navHTML(coach) {
    function cls(id) {
      var c = ui.tab === id ? "on" : "";
      if (id === "verk" && coach === "job" && ui.tab !== "verk") c += " pulse";
      if (id === "hus" && coach === "house" && ui.tab !== "hus") c += " pulse";
      return c;
    }
    return '<nav class="nav">' +
      '<button type="button" class="' + cls("markadur") + '" data-act="tab" data-id="markadur"><i>\ud83d\uded2</i>Markaður</button>' +
      '<button type="button" class="' + cls("verk") + '" data-act="tab" data-id="verk"><i>\ud83d\udd27</i>Verk</button>' +
      '<button type="button" class="' + cls("hus") + '" data-act="tab" data-id="hus"><i>\ud83c\udfe0</i>Hús</button>' +
      '<button type="button" class="' + cls("teymi") + '" data-act="tab" data-id="teymi"><i>\ud83d\udc77</i>Teymi<u class="ndot" hidden></u></button>' +
      '<button type="button" class="' + cls("meira") + '" data-act="tab" data-id="meira"><i>\u2b50</i>Meira</button>' +
      "</nav>";
  }

  function coachLine(coach) {
    if (coach === "buy") return "Kauptu ódýrt. Seldu dýrt.";
    if (coach === "travel") return "Farðu á annan stað.";
    if (coach === "job") return "Taktu verk. Það borgar.";
    if (coach === "house") return "Húsið er nálægt.";
    return "";
  }

  function marketHTML(coach) {
    var line = coachLine(coach);
    var cities = L.LOCS.map(function (loc) {
      var here = loc.id === S.loc;
      var pulse = coach === "travel" && !here ? " pulse" : "";
      return '<button type="button" class="city' + (here ? " here" : "") + pulse + '" data-act="go" data-id="' + loc.id + '"' +
        (here ? " disabled" : "") + ">" + ico(LOC_ICON, loc.id, "\ud83d\udccd") + "<b>" + L.esc(loc.name) + '</b><span class="tip">' + L.esc(loc.tip) + "</span></button>";
    }).join("");
    var qtys = ["1", "5", "allt"].map(function (q) {
      var label = q === "allt" ? "Allt" : q;
      return '<button type="button" data-act="qty" data-id="' + q + '"' + (ui.qty === q ? ' class="on"' : "") + ">" + label + "</button>";
    }).join("");
    var rows = L.sortedGoods(S);
    var stock = 0;
    rows.forEach(function (r) { stock += r.owned * r.price; });
    var used = L.usedSpace(S);
    var cap = L.capacity(S);
    var pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
    var goods = rows.map(function (row, idx) {
      var g = row.good;
      var tag = "";
      var tagCls = "";
      if (row.sellNow) { tag = "Selja"; tagCls = "selltag"; }
      else if (row.ratio <= 0.82) { tag = "Ódýrt"; tagCls = "cheap"; }
      else if (row.ratio >= 1.22) { tag = "Dýrt"; tagCls = "pricey"; }
      var buyN = L.tradeQty(S, g.id, ui.qty, "buy");
      var sellN = L.tradeQty(S, g.id, ui.qty, "sell");
      var pulse = coach === "buy" && idx === 0 ? " pulse" : "";
      var diff = "";
      if (row.owned) {
        var d = row.price - row.avg;
        diff = '<div class="gdiff ' + (d >= 0 ? "cheap" : "pricey") + '">' + L.formatKrSigned(d) + "</div>";
      }
      return '<div class="good">' + ico(GOOD_ICON, g.id, "\ud83d\udd27") + '<div class="ginfo"><div class="gname">' + L.esc(g.name) +
        (tag ? ' <em class="tag ' + tagCls + '">' + tag + "</em>" : "") +
        '</div><div class="gprice ' + tagCls + '">' + L.formatKr(row.price) + "</div>" +
        '<div class="gmeta">Á lager ' + row.owned + "</div>" + diff +
        '</div><div class="gact">' +
        '<button type="button" class="buy' + pulse + (buyN < 1 ? " dim" : "") + '" data-act="buy" data-id="' + g.id + '">Kaupa' + (buyN > 0 ? " " + buyN : "") + "</button>" +
        '<button type="button" class="sell' + (sellN < 1 ? " dim" : "") + '" data-act="sell" data-id="' + g.id + '">Selja' + (sellN > 0 ? " " + sellN : "") + "</button>" +
        "</div></div>";
    }).join("");
    var bonus = "";
    if (Meta.login && Meta.login.pending) {
      bonus = '<button type="button" class="bonus-chip" data-act="bonus-open">Taka ' + L.formatKr(Meta.login.pending.amount) + "</button>";
    }
    return '<div class="view view-markadur">' +
      '<div class="cities">' + cities + "</div>" +
      '<div class="goods-col"><div class="toolbar">' + goalHTML() + spaceTeaserHTML() +
      '<div class="qty"><span>Magn</span>' + qtys + "</div>" +
      bonus +
      (line ? '<div class="coach">' + L.esc(line) + "</div>" : "") +
      '<div class="cap"><span>Lager ' + L.formatKr(stock) + '</span><div class="gbar"><span style="width:' + pct + '%"></span></div></div>' +
      '</div><div class="panel goods">' + goods + "</div></div></div>";
  }

  function jobsHTML() {
    var level = L.levelOf(S.xp).current.level;
    var cards = (S.jobs || []).map(function (job) {
      var info = L.matInfo(S, job);
      return '<button type="button" class="jobcard' + (job.jackpot ? " jack" : "") + '" data-act="job" data-id="' + L.esc(job.uid) + '">' +
        (job.jackpot ? '<div class="badge">\u2605 Stórsamningur</div>' : "") +
        ico(JOB_ICON, job.type || job.id, "\ud83d\udd27") +
        '<div class="job-name">' + L.esc(job.name) + "</div>" +
        '<div class="job-pay">' + L.formatKr(job.pay) + "</div>" +
        '<div class="job-meta">' + job.seconds + " sek. " + L.esc(job.blurb) + "</div>" +
        (info.label ? '<div class="job-mat">' + L.esc(info.label) + "</div>" : "") +
        "</button>";
    }).join("");
    if (!cards) cards = '<p class="coach">Engin verk í dag.</p>';
    var locked = L.JOB_TYPES.filter(function (t) { return t.level > level; }).map(function (t) {
      return '<div class="jobcard locked">' + ico(JOB_ICON, t.id, "\ud83d\udd12") + '<div class="job-name">\ud83d\udd12 ' + L.esc(t.name) + "</div>" +
        '<div class="job-meta">Opnast á þrepi ' + t.level + "</div></div>";
    }).join("");
    return '<div class="view"><div class="jobs">' + cards + locked + "</div></div>";
  }

  function houseVisual() {
    if (!S.house) return '<div class="lot road"><div class="van" aria-hidden="true"></div><p>Þú sefur í bílnum.</p></div>';
    var h = L.houseById(S.house);
    var rooms = (L.ROOMS[h.tier] || []).map(function (r) {
      return '<div class="room">' + L.esc(r) + "</div>";
    }).join("");
    var badges = S.upgrades.map(function (id) {
      var u = L.upgradeById(id);
      return '<span class="ubadge">' + L.esc(u ? u.name : id) + "</span>";
    }).join("");
    return '<div class="lot tier-' + h.tier + '"><div class="rooms n' + (L.ROOMS[h.tier] || []).length + '">' + rooms + "</div>" +
      (badges ? '<div class="ubadges">' + badges + "</div>" : "") + "</div>";
  }

  function houseHTML() {
    var daily = L.dailyIncome(S);
    var houses = L.HOUSES.map(function (h) {
      var mine = S.house === h.id;
      var quote = L.houseCost(S, h);
      var action = "";
      if (mine) action = '<div class="mine">Þitt hús</div>';
      else if (!quote) action = '<div class="mine">Eldra</div>';
      else {
        var afford = S.cash >= quote.cost;
        action = '<button type="button" class="' + (afford ? "" : "dim") + '" data-act="house" data-id="' + h.id + '">' +
          (S.house ? "Færa " : "Kaupa ") + L.formatKr(quote.cost) + "</button>";
        if (quote.refund) action += '<div class="fine">Gamla húsið gefur ' + L.formatKr(quote.refund) + "</div>";
      }
      return '<div class="hcard">' + ico(HOUSE_ICON, h.id, "\ud83c\udfe0") + '<div class="hbody"><b>' + L.esc(h.name) + "</b><div>" + L.esc(h.blurb) + "</div></div>" + action + "</div>";
    }).join("");
    var ups = L.UPGRADES.map(function (u) {
      var owned = S.upgrades.indexOf(u.id) >= 0;
      var tierOk = L.houseTier(S) >= u.need;
      var body = "<div><b>" + L.esc(u.name) + "</b><div>" + L.esc(u.blurb) + "</div>";
      if (u.daily) body += '<div class="fine">+' + L.formatKr(u.daily) + " á dag</div>";
      if (u.cap) body += '<div class="fine">+' + u.cap + " pláss</div>";
      if (u.pay) body += '<div class="fine">+' + Math.round(u.pay * 100) + "% laun</div>";
      body += "</div>";
      if (owned) return '<div class="hcard">' + body + '<div class="mine">Tilbúið</div></div>';
      if (!tierOk) {
        var needHouse = null;
        for (var i = 0; i < L.HOUSES.length; i++) if (L.HOUSES[i].tier === u.need) needHouse = L.HOUSES[i];
        return '<div class="hcard dim">' + body + '<div class="fine">Þarf: ' + L.esc(needHouse ? needHouse.name : "hús") + "</div></div>";
      }
      var afford = S.cash >= u.price;
      return '<div class="hcard">' + body + '<button type="button" class="' + (afford ? "" : "dim") + '" data-act="upgrade" data-id="' + u.id + '">Kaupa ' + L.formatKr(u.price) + "</button></div>";
    }).join("");
    return '<div class="view house-view">' + spaceTeaserHTML() + houseVisual() +
      '<p class="daily">' + (daily ? ("Á dag: " + L.formatKr(daily)) : "Engin dagleg inneign enn.") + "</p>" +
      '<h2>Hús</h2><div class="stack">' + houses + "</div>" +
      '<h2>Uppfærslur</h2><div class="stack">' + ups + "</div></div>";
  }

  function moneyRow(act, label, amounts, can) {
    var buttons = amounts.map(function (a) {
      var id = a === "allt" ? "allt" : String(a);
      var text = a === "allt" ? "Allt" : L.formatNum(a);
      var ok = can(a);
      return '<button type="button" class="' + (ok ? "" : "dim") + '" data-act="' + act + '" data-id="' + id + '">' + text + "</button>";
    }).join("");
    return '<div class="fin"><div class="fin-label">' + label + '</div><div class="rowbtns">' + buttons + "</div></div>";
  }

  function moreHTML() {
    var lv = L.levelOf(S.xp);
    var xpLine = lv.next
      ? ((S.xp - lv.current.xp) + "/" + (lv.next.xp - lv.current.xp) + " til " + lv.next.title)
      : "Toppur";
    var chals = "";
    if (S.challenges) {
      chals = S.challenges.daily.map(chalBlock).join("") + chalBlock(S.challenges.weekly);
    }
    var ach = L.ACHIEVEMENTS.map(function (a) {
      var on = S.achievements.indexOf(a.id) >= 0;
      return '<div class="ach' + (on ? " on" : "") + '"><b>' + L.esc(a.name) + "</b><span>" + L.esc(a.desc) + "</span></div>";
    }).join("");
    return '<div class="view more-view">' +
      '<div class="bigbtns"><button type="button" class="btn-board" data-act="board">\ud83c\udfc6<span>Deild</span></button>' +
      '<button type="button" class="btn-tools" data-act="tools-open">\ud83e\uddf0<span>Verkfæri ' + F.TOOLS.filter(function (t) { return Meta.tools[t.id]; }).length + "/" + F.TOOLS.length + "</span></button>" +
      '<button type="button" class="btn-car" data-act="garage">' + L.vehicleOf(S).icon + '<span>Bílasala</span></button>' +
      '<button type="button" class="btn-wheel2' + ((S.spins || 0) > 0 ? " pulse" : "") + '" data-act="wheel-open">\ud83c\udfa1<span>Hjól ' + (S.spins || 0) + "</span></button></div>" +
      '<div class="streakbox"><div class="kicker">\ud83d\udd25 Röð: ' + ((Meta.login && Meta.login.streak) || 0) + ' dagar' + (Meta.login && Meta.login.freezes ? " \u2744\ufe0f x" + Meta.login.freezes : "") + "</div>" +
      calendarHTML((Meta.login && Meta.login.streak) || 1, !!(Meta.login && Meta.login.claimedDate === L.dateStr(new Date()))) + "</div>" +
      '<div class="scorebox"><div class="score">' + L.formatNum(L.score(S)) + '</div><div>Stig. Besta ' + L.formatNum(Meta.best || 0) + "</div>" +
      '<div class="fine">Nettó ' + L.formatKr(L.netWorth(S)) + "</div></div>" +
      '<div class="rank"><b>' + L.esc(lv.current.title) + "</b><div>" + L.esc(xpLine) + "</div>" +
      (S.firm ? '<div class="firm">' + L.esc(S.firm) + "</div>" : "") +
      '<div class="fine">Dagar ' + S.day + ". Vika " + S.week + ".</div></div>" +
      "<h2>Fjármál</h2>" +
      '<p class="fine">Glóðarlán. 3% á dag. Banki 2%. Bankinn er öruggur.</p>' +
      '<p class="fine">Vextir á morgun: ' + L.formatKr(L.interestDue(S)) + ". Banki borgar " + L.formatKr(L.bankDue(S)) + ".</p>" +
      moneyRow("debt", "Borga skuld", [10000, 50000, "allt"], function (a) {
        var have = Math.min(S.cash, S.debt);
        return a === "allt" ? have > 0 : have >= a;
      }) +
      moneyRow("in", "Leggja inn", [10000, 50000, "allt"], function (a) {
        return a === "allt" ? S.cash > 0 : S.cash >= a;
      }) +
      moneyRow("out", "Taka út", [10000, 50000, "allt"], function (a) {
        return a === "allt" ? S.bank > 0 : S.bank >= a;
      }) +
      "<h2>Áskoranir</h2><div class=\"stack\">" + chals + "</div>" +
      "<h2>Afrek</h2><div class=\"achs\">" + ach + "</div>" +
      '<div class="footer-actions">' +
      '<button type="button" data-act="sound">' + (Meta.sound ? "Hljóð: kveikt" : "Hljóð: slökkt") + "</button>" +
      '<button type="button" data-act="rename">Breyta nafni: ' + L.esc(C ? C.name() : "") + "</button>" +
      '<button type="button" data-act="new">Nýr leikur</button>' +
      '<p class="fine">Vistast hér í tækinu.</p></div></div>';
  }

  function chalBlock(c) {
    if (!c) return "";
    var pct = c.need ? Math.round((c.have / c.need) * 100) : 0;
    return '<div class="chal' + (c.done ? " done" : "") + '"><div class="chal-top"><span>' + L.esc(c.label) + "</span><b>" +
      c.have + "/" + c.need + '</b></div><div class="gbar"><span style="width:' + pct + '%"></span></div><div class="fine">' +
      (c.done ? "Búið" : L.formatKr(c.reward)) + "</div></div>";
  }

  function appHTML(pop) {
    var coach = L.coach(S);
    var view = "";
    if (ui.tab === "verk") view = jobsHTML();
    else if (ui.tab === "hus") view = houseHTML();
    else if (ui.tab === "teymi") view = crewHTML();
    else if (ui.tab === "meira") view = moreHTML();
    else view = marketHTML(coach);
    return '<div class="shell">' + headerHTML(pop) + '<main class="main">' + view + "</main>" + navHTML(coach) + "</div>";
  }

  function crateQuality(s) {
    var r = s.reward;
    if (!r) return -1;
    var q = r.ratio >= 0.67 ? 1 : 0;
    if (r.perfect) q = 2;
    if (r.perfect && r.speed) q = 3;
    if (s.callout && r.ratio >= 0.67) q = Math.max(q, 2);
    if (s.levelUp) q = 3;
    return q;
  }

  function summaryHTML(s) {
    var hero = "";
    if (s.actionCash) {
      hero = '<div class="hero ' + (s.actionCash > 0 ? "good" : "bad") + '" data-count="' + s.actionCash + '" data-mode="krs">' + L.formatKrSigned(s.actionCash) + '</div>';
    } else if (s.eventText) hero = '<div class="hero neutral">' + L.esc(s.eventText) + "</div>";
    else hero = '<div class="hero neutral">Nýr dagur</div>';
    var xp = s.actionXp ? '<div class="hero-sub xpgain" data-count="' + s.actionXp + '" data-mode="xp">+' + s.actionXp + " reynsla</div>" : "";
    var bits = "";
    if (s.callout) bits += '<div class="banner">\ud83d\udea8 Neyðarútkall 3x</div>';
    if (s.levelUp) bits += '<div class="levelup"><div class="lu-star">\u26a1</div><div class="lu-k">NÝTT ÞREP</div><div class="lu-n">' + s.levelUp.level + '</div><div class="lu-t">' + L.esc(s.levelUp.title) + "</div></div>";
    if (s.firmNew) bits += '<div class="banner">Firma: ' + L.esc(s.firmNew) + "</div>";
    (s.unlocked || []).forEach(function (u) {
      bits += '<div class="banner">Nýtt: ' + L.esc(u.name) + "</div>";
    });
    (s.micro || []).forEach(function (m) {
      bits += '<div class="note good">\u2705 ' + L.esc(m.label) + " +" + L.formatNum(m.cash) + "</div>";
    });
    if (s.weekBonus) bits += '<div class="banner">Umbun vikunnar ' + L.formatKr(s.weekBonus) + "</div>";
    if (s.reward && s.reward.speed) bits += '<div class="note good">\u26a1 Hratt</div>';
    if (s.reward && s.reward.matUsed) bits += '<div class="note good">Lager notaður</div>';
    if (S.combo >= 2) bits += '<div class="note good">\ud83d\udd25 Röð ' + S.combo + "</div>";
    (s.notes || []).forEach(function (n) {
      var amt = n.amount ? " " + L.formatKrSigned(n.amount) : "";
      bits += '<div class="note ' + (n.kind === "bad" ? "bad" : "good") + '">' + L.esc(n.label) + amt + "</div>";
    });
    if (s.deal && s.deal.ratio < 0.85) bits += '<div class="note good">Ódýrt: ' + L.esc(s.deal.name) + "</div>";
    var q = crateQuality(s);
    return '<div class="sheet">' +
      '<div class="kicker">Dagur ' + s.finishedSlot + " búinn</div>" +
      hero + xp + (q >= 0 ? crateHTML(q) : "") + '<div class="notes">' + bits + "</div>" +
      '<button type="button" class="btn-wheel pulse" data-act="wheel-open"' + ((S.spins || 0) > 0 ? "" : " hidden") + '>\ud83c\udfa1 Snúa hjólinu (' + (S.spins || 0) + ")</button>" +
      '<button type="button" class="btn-go" data-act="go-on">Áfram</button></div>';
  }
  function presentMorning(summary) {
    ui.lock = true;
    render();
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = summaryHTML(summary);
    var go = ov.querySelector("[data-act='go-on']");
    if (go) go.focus();
    countUps(ov);
    if (summary.levelUp) burst(ov.querySelector(".sheet"));
    reactMorning(summary);
    var q = crateQuality(summary);
    if (q >= 0) startCrate(q, {});
    cloudSync(true);
  }
  function reactMorning(summary) {
    var r = summary.reward;
    if (r) {
      if (r.perfect && r.speed) toast("Fullkomið og hratt", "gold");
      else if (r.perfect) toast("Fullkomið", "gold");
      else if (r.ratio >= 0.67) toast("Vel gert", "good");
      else toast("Ekki nóg", "bad");
      if (r.perfect) { if (sfx()) sfx().win(); }
      else if (r.ratio >= 0.67) { if (sfx()) sfx().ok(); }
      else if (sfx()) sfx().bad();
    }
    if (summary.levelUp) {
      toast("Nýtt þrep: " + summary.levelUp.title, "gold");
      if (sfx()) sfx().level();
    }
    if (summary.firmNew) toast("Firma: " + summary.firmNew, "gold");
    (summary.unlocked || []).forEach(function (u) { toast("Nýtt: " + u.name, "gold"); });
    (summary.gained || []).forEach(function (a) { toast("Afrek: " + a.name, "gold"); });
    (summary.challenges || []).forEach(function (c) { toast("Áskorun. " + c.label, "gold"); });
    if (summary.weekBonus) toast("Umbun vikunnar " + L.formatKr(summary.weekBonus), "gold");
  }

  function showConfirm() {
    ui.lock = true;
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = '<div class="sheet"><div class="kicker">Nýr leikur?</div><p>Vistun eyðist.</p>' +
      '<button type="button" class="btn-go" data-act="confirm-yes">Byrja</button>' +
      '<button type="button" data-act="confirm-no">Hætta við</button></div>';
  }

  function showChoice(question) {
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = '<div class="sheet"><p class="ask">' + L.esc(question) + "</p>" +
      '<button type="button" class="btn-go" data-act="mat-yes">Nota</button>' +
      '<button type="button" data-act="mat-no">Halda</button></div>';
  }

  function showNamePrompt(rename) {
    ui.lock = true;
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = '<div class="sheet namebox"><div class="kicker">' + (rename ? "Breyta nafni" : "Velkominn") + '</div>' +
      '<p class="ask">Hvað heitir þú?</p>' +
      '<input id="pname" type="text" maxlength="16" autocomplete="nickname" autocapitalize="words" enterkeyhint="go" placeholder="Nafn" value="' + L.esc(rename && C ? C.name() : "") + '">' +
      '<button type="button" class="btn-go" data-act="name-ok" data-id="' + (rename ? "r" : "n") + '">' + (rename ? "Vista" : "Byrja") + "</button></div>";
    var inp = document.getElementById("pname");
    if (inp) {
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); submitName(rename); }
      });
      setTimeout(function () { inp.focus(); inp.select(); }, 60);
    }
  }

  function submitName(rename) {
    var inp = document.getElementById("pname");
    if (C) C.setName(inp ? inp.value : "");
    if (rename) {
      hideOverlay();
      render();
      cloudSync(true);
      return;
    }
    var amt = Meta.login && Meta.login.pending ? Meta.login.pending.amount : 0;
    var res = L.claimLogin(S, Meta);
    commit();
    hideOverlay();
    ui.afterWelcome = true;
    render({ pop: true });
    if (res) earn(res.amount);
    ui.lock = true;
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = '<div class="sheet cratesheet"><div class="kicker">\ud83c\udf89 Velkomin(n), ' + L.esc(C.name()) + '!</div>' +
      '<div class="hero good" data-count="' + amt + '" data-mode="krs">+' + L.formatNum(amt) + ' kr</div><div class="hero-sub">Velkomingjöf</div>' + crateHTML(2) +
      '<button type="button" class="btn-go" data-act="go-on">Fyrsta verk!</button></div>';
    countUps(ov);
    if (sfx()) sfx().win();
    startCrate(2, { forceTool: true });
    cloudSync(true);
  }
  /* ================= extras: crates, wheel, tools, crew, league, callouts ================= */

  function ensureExtras(s) {
    if (typeof s.spins !== "number") s.spins = 0;
    if (typeof s.jobsSinceSpin !== "number") s.jobsSinceSpin = 0;
    if (!s.vehicle) s.vehicle = "smabill";
    if (typeof s.storage !== "number") s.storage = 0;
    if (typeof s.voucher !== "number") s.voucher = 0;
    F.crewInit(s, Date.now());
    if (!s.micro || !s.micro.length) {
      if (!s.stats || !s.stats.jobs) F.firstGoals(s, Math.random);
      else F.fillGoals(s, Math.random);
    }
    s.bonus = F.bonuses(Meta ? Meta.tools : {});
    return s;
  }

  function queueSheet(fn) {
    if (ui.lock) ui.queue.push(fn);
    else fn();
  }

  function earn(kr) {
    if (!kr || kr <= 0 || !Meta || !Meta.week) return;
    var t = F.gain(Meta, kr);
    updateLeague();
    if (t >= 0) promote(t);
  }

  function promote(t) {
    var tier = F.TIERS[t];
    var lv = L.levelOf(S.xp).current.level;
    var bonus = F.unit(lv) * 5 * t;
    S.cash += bonus;
    S.spins = (S.spins || 0) + 1;
    commit();
    queueSheet(function () { showPromo(t, bonus); });
  }

  function showPromo(t, bonus) {
    var tier = F.TIERS[t];
    ui.lock = true;
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = '<div class="sheet promo tier' + t + '"><div class="kicker">UPPFÆRSLA</div>' +
      '<div class="pr-ico">' + tier.icon + '</div><div class="pr-t">' + L.esc(tier.id.toUpperCase()) + 'DEILD!</div>' +
      '<div class="hero good" data-count="' + bonus + '" data-mode="krs">+' + L.formatNum(bonus) + ' kr</div>' +
      '<div class="hero-sub">og frítt hjól \ud83c\udfa1</div>' +
      '<button type="button" class="btn-go" data-act="go-on">Áfram</button></div>';
    countUps(ov);
    burst(ov.querySelector(".sheet"));
    render({ keepScroll: true });
    if (sfx()) sfx().level();
    cloudSync(true);
  }

  function showWeekEnd(prev) {
    var tier = F.TIERS[prev.tier || 0];
    var lv = L.levelOf(S.xp).current.level;
    var bonus = F.unit(lv) * 3 * (1 + (prev.tier || 0));
    S.cash += bonus;
    commit();
    ui.lock = true;
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = '<div class="sheet promo tier' + (prev.tier || 0) + '"><div class="kicker">NÝ VIKA</div>' +
      '<div class="pr-ico">' + tier.icon + '</div><div class="pr-t">Síðasta vika: ' + L.esc(tier.id) + '</div>' +
      '<div class="hero-sub">' + L.formatNum(prev.score) + ' stig</div>' +
      '<div class="hero good" data-count="' + bonus + '" data-mode="krs">+' + L.formatNum(bonus) + ' kr</div>' +
      '<div class="hero-sub">Nýtt kapphlaup er hafið!</div>' +
      '<button type="button" class="btn-go" data-act="go-on">Áfram</button></div>';
    countUps(ov);
    burst(ov.querySelector(".sheet"));
    render({ keepScroll: true });
    if (sfx()) sfx().win();
  }

  /* ---------- garage: vehicles and storage ---------- */
  function spaceTeaserHTML() {
    var sp = L.nextSpace(S);
    if (!sp) return "";
    var pct = Math.max(4, Math.min(100, Math.round(Math.min(S.cash, sp.cost) / sp.cost * 100)));
    var ready = !sp.locked && S.cash >= sp.cost;
    var line = sp.locked ? "Opnast á þrepi " + sp.lvl : (ready ? "Tilbúið! Tappaðu" : "vantar " + L.formatKr(sp.cost - S.cash));
    return '<button type="button" class="teaser' + (ready ? " ready" : "") + '" data-act="garage"><span class="ico">' + sp.icon + "</span>" +
      '<span class="tz-b"><b>' + L.esc(sp.name) + " <em>+" + sp.extra + ' pláss</em></b><span class="mbar"><span style="width:' + pct + '%"></span></span>' +
      '<small>' + line + "</small></span></button>";
  }

  function perkChips(v) {
    var c = [];
    if (v.theft < 1) c.push("\ud83d\udee1\ufe0f -" + Math.round((1 - v.theft) * 100) + "% þjófnaður");
    if (v.brk < 1) c.push("\ud83d\udd27 -" + Math.round((1 - v.brk) * 100) + "% bilanir");
    if (v.pay) c.push("\ud83d\udcb0 +" + Math.round(v.pay * 100) + "% laun");
    return c.map(function (x) { return "<i>" + x + "</i>"; }).join("");
  }

  function garageHTML() {
    var cur = L.vehicleOf(S);
    var used = L.usedSpace(S);
    var cap = L.capacity(S);
    var pct = cap ? Math.min(100, Math.round(used / cap * 100)) : 0;
    var h = '<div class="sheet garage"><div class="kicker">\ud83d\ude90 Bílasala</div>' +
      '<div class="g-cur"><div class="g-ico">' + cur.icon + '</div><div class="g-t"><b>' + L.esc(cur.name) + '</b><div class="gbar"><span style="width:' + pct + '%"></span></div>' +
      '<div class="fine">' + used + "/" + cap + " pláss. Innskipti " + L.formatKr(cur.resale) + "</div></div></div>";
    if (S.voucher > 0) h += '<div class="vouch">\ud83c\udf9f\ufe0f Bílamiði x' + S.voucher + ": -25% á næsta bíl</div>";
    h += '<div class="vlist">';
    L.VEHICLES.forEach(function (v) {
      if (v.id === cur.id) {
        h += '<div class="vcard cur"><span class="vi">' + v.icon + '</span><div class="vb"><b>' + L.esc(v.name) + '</b><div class="chips"><i>' + v.cap + " pláss</i>" + perkChips(v) + '</div></div><div class="mine">Núna</div></div>';
        return;
      }
      if (v.tier < cur.tier) {
        h += '<div class="vcard old"><span class="vi">' + v.icon + '</span><div class="vb"><b>' + L.esc(v.name) + '</b></div><div class="fine">Eldra</div></div>';
        return;
      }
      var q = L.vehicleCost(S, v);
      var next = v.tier === cur.tier + 1;
      var act;
      if (!q.lvlOk) act = '<div class="fine">\ud83d\udd12 Þrep ' + v.lvl + "</div>";
      else {
        var ok = S.cash >= q.cost;
        act = '<button type="button" class="' + (ok ? "good pulse" : "dim") + '" data-act="veh-buy" data-id="' + v.id + '">Kaupa ' + L.formatNum(q.cost) + " kr</button>";
        if (!ok) act += '<div class="mbar"><span style="width:' + Math.max(3, Math.round(S.cash / q.cost * 100)) + '%"></span></div><div class="fine">vantar ' + L.formatKr(q.cost - S.cash) + "</div>";
      }
      h += '<div class="vcard' + (v.legend ? " legend" : "") + (next ? " next" : "") + '"><span class="vi">' + v.icon + '</span><div class="vb"><b>' + L.esc(v.name) + '</b><div class="chips"><i>' + v.cap + " pláss</i>" + perkChips(v) + '</div></div><div class="va">' + act + "</div></div>";
    });
    h += "</div><h2>Geymsla</h2><div class=\"vlist\">";
    var lvl = L.storageLvl(S);
    L.STORAGES.forEach(function (st) {
      if (st.lvl <= lvl) {
        h += '<div class="vcard cur"><span class="vi">' + st.icon + '</span><div class="vb"><b>' + L.esc(st.name) + '</b><div class="chips"><i>+' + st.cap + ' pláss</i></div></div><div class="mine">\u2705</div></div>';
      } else if (st.lvl === lvl + 1) {
        var lock = L.levelOf(S.xp).current.level < st.need;
        var okc = S.cash >= st.price;
        var act2 = lock ? '<div class="fine">\ud83d\udd12 Þrep ' + st.need + "</div>" :
          '<button type="button" class="' + (okc ? "good pulse" : "dim") + '" data-act="store-buy">Kaupa ' + L.formatNum(st.price) + " kr</button>" +
          (okc ? "" : '<div class="mbar"><span style="width:' + Math.max(3, Math.round(S.cash / st.price * 100)) + '%"></span></div><div class="fine">vantar ' + L.formatKr(st.price - S.cash) + "</div>");
        h += '<div class="vcard next"><span class="vi">' + st.icon + '</span><div class="vb"><b>' + L.esc(st.name) + '</b><div class="chips"><i>+' + st.cap + ' pláss</i></div></div><div class="va">' + act2 + "</div></div>";
      } else {
        h += '<div class="vcard old"><span class="vi">' + st.icon + '</span><div class="vb"><b>' + L.esc(st.name) + '</b><div class="chips"><i>+' + st.cap + ' pláss</i></div></div><div class="fine">\ud83d\udd12 Þrep ' + st.need + "</div></div>";
      }
    });
    return h + '</div><button type="button" class="btn-go" data-act="go-on">Loka</button></div>';
  }

  function showGarage(celebrate) {
    if (ui.lock && !document.querySelector(".sheet.garage")) return;
    ui.lock = true;
    var ov = document.getElementById("overlay");
    var keep = document.querySelector(".sheet.garage");
    var y = keep ? keep.scrollTop : 0;
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = garageHTML();
    var sh = ov.querySelector(".sheet");
    if (sh && keep) sh.scrollTop = y;
    if (celebrate && sh) {
      burst(sh);
      var gi = sh.querySelector(".g-ico");
      if (gi) gi.classList.add("zoom");
    }
  }

  function afterSpaceBuy(res, msg) {
    commit();
    celebrate(res);
    microDone(F.microEvent(S, "space", 1, null, Math.random));
    render({ keepScroll: true, pop: true });
    toast(msg, "gold");
    if (sfx()) sfx().level();
    showGarage(true);
    cloudSync(true);
  }

  function doVehicle(id) {
    var res = L.buyVehicle(S, id);
    if (!res.ok) {
      toast(res.reason === "cash" ? "Vantar fé" : (res.reason === "lvl" ? "Þarf hærra þrep" : "Ekki hægt"), "bad");
      if (sfx()) sfx().bad();
      return;
    }
    var gain = res.vehicle.cap;
    afterSpaceBuy(res, res.vehicle.icon + " " + res.name + "! " + gain + " pláss");
  }

  function doStorage() {
    var res = L.buyStorage(S);
    if (!res.ok) {
      toast(res.reason === "cash" ? "Vantar fé" : (res.reason === "lvl" ? "Þarf hærra þrep" : "Ekki hægt"), "bad");
      if (sfx()) sfx().bad();
      return;
    }
    afterSpaceBuy(res, res.storage.icon + " " + res.name + "! +" + res.storage.cap + " pláss");
  }

  /* ---------- crates ---------- */
  function crateHTML(q) {
    var Q = F.QUALITY[q];
    return '<div class="crate q' + q + '" id="crate"><div class="crate-k">' + Q.name + '</div><div class="crate-box">' + Q.icon + '</div><div class="crate-out"></div></div>';
  }

  function startCrate(q, opts) {
    var host = document.getElementById("crate");
    if (!host) return;
    var c = { q: q, opts: opts || {}, done: false, host: host };
    ui.crate = c;
    c.t1 = setTimeout(function () { host.classList.add("shake"); if (sfx()) sfx().tick(); }, 300);
    c.t2 = setTimeout(function () { openCrate(true); }, 1100);
  }

  function rewardCardHTML(rw, extra) {
    var cls = "rw tier-" + rw.tier;
    var body;
    if (rw.kind === "tool") {
      var R = F.RARITY[rw.tool.r];
      cls += " r-" + rw.tool.r;
      body = '<div class="rw-new">NÝTT VERKFÆRI!</div><div class="rw-i">' + rw.icon + '</div><div class="rw-n">' + L.esc(rw.tool.name) + '</div>' +
        '<div class="rw-r" style="color:' + R.color + '">' + R.name + '</div><div class="rw-b">' + L.esc(F.bonusText(rw.tool.b)) + "</div>";
    } else if (rw.kind === "coins") {
      body = '<div class="rw-i">' + rw.icon + '</div><div class="rw-n">' + L.esc(rw.label) + '</div><div class="rw-a" data-count="' + rw.amount + '" data-mode="krs">+' + L.formatNum(rw.amount) + " kr</div>";
    } else if (rw.kind === "xp") {
      body = '<div class="rw-i">' + rw.icon + '</div><div class="rw-n">Reynsla</div><div class="rw-a xp" data-count="' + rw.amount + '" data-mode="xp">+' + rw.amount + " reynsla</div>";
    } else if (rw.kind === "voucher") {
      body = '<div class="rw-i">' + rw.icon + '</div><div class="rw-n">Bílamiði!</div><div class="rw-b">-25% á næsta bíl</div>';
    } else if (rw.kind === "spin") {
      body = '<div class="rw-i">' + rw.icon + '</div><div class="rw-n">Frítt hjól!</div><div class="rw-b">Snúðu því strax</div>';
    } else {
      body = '<div class="rw-i">' + rw.icon + '</div><div class="rw-n">Frystir</div><div class="rw-b">Bjargar röðinni þinni</div>';
    }
    return '<div class="' + cls + '">' + body + "</div>";
  }

  function afterReward(rw, extra, host) {
    if (rw.kind === "coins") earn(rw.amount);
    if (extra && extra.rank && extra.rank.levelUp) toast("Nýtt þrep: " + extra.rank.levelUp.title, "gold");
    S.bonus = F.bonuses(Meta.tools);
    commit();
    render({ keepScroll: true });
    var big = rw.tier === "jackpot" || rw.tier === "legendary" || rw.tier === "epic" || rw.tier === "big";
    if (sfx()) { if (big) sfx().level(); else sfx().win(); }
    if (host && (big || rw.kind === "tool")) burst(host);
    cloudSync(false);
  }

  function openCrate(animate) {
    var c = ui.crate;
    if (!c || c.done) return;
    c.done = true;
    clearTimeout(c.t1);
    clearTimeout(c.t2);
    var lv = L.levelOf(S.xp).current.level;
    var ro = { S: S };
    for (var ok in c.opts) if (Object.prototype.hasOwnProperty.call(c.opts, ok)) ro[ok] = c.opts[ok];
    var rw = F.rollCrate(c.q, lv, Meta, Math.random, ro);
    var extra = F.applyReward(S, Meta, rw, Math.random);
    Meta.crates = (Meta.crates || 0) + 1;
    var host = c.host;
    var live = animate && host && host.isConnected;
    if (!live) { afterReward(rw, extra, null); return; }
    var box = host.querySelector(".crate-box");
    var frames = ["\ud83d\udcb0", "\ud83c\udf81", "\ud83d\udc8e", "\u2b50", "\ud83e\uddf0", "\ud83d\udc51"];
    var n = 0;
    var tease = rw.tier === "small" && Math.random() < 0.6 ? "\ud83d\udc51" : rw.icon;
    var iv = setInterval(function () {
      n += 1;
      if (!host.isConnected) { clearInterval(iv); return; }
      box.textContent = n >= 4 ? tease : frames[Math.floor(Math.random() * frames.length)];
      if (sfx()) sfx().tick();
      if (n >= 5) {
        clearInterval(iv);
        host.classList.remove("shake");
        host.classList.add("open");
        box.textContent = rw.icon;
        host.querySelector(".crate-out").innerHTML = rewardCardHTML(rw, extra);
        countUps(host);
        afterReward(rw, extra, host);
      }
    }, 110);
  }

  function resolveCrate() {
    if (ui.crate && !ui.crate.done) openCrate(false);
  }

  function showCrateSheet(q, opts, title, sub) {
    ui.lock = true;
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = '<div class="sheet cratesheet"><div class="kicker">' + L.esc(title) + "</div>" + (sub || "") + crateHTML(q) +
      '<button type="button" class="btn-go" data-act="go-on">Áfram</button></div>';
    startCrate(q, opts);
  }

  /* ---------- wheel ---------- */
  function showWheel() {
    ui.lock = true;
    var segs = F.WHEEL.map(function (w, i) { return w.color + " " + (i * 45) + "deg " + ((i + 1) * 45) + "deg"; }).join(",");
    var icons = F.WHEEL.map(function (w, i) {
      return '<span style="transform:rotate(' + (i * 45) + 'deg) translateY(-98px)"><i style="transform:rotate(' + (-i * 45) + 'deg)">' + w.icon + "</i></span>";
    }).join("");
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = '<div class="sheet wheelbox"><div class="kicker">\ud83c\udfa1 Lukkuhjól</div>' +
      '<div class="wheel-wrap"><div class="pointer">\u25bc</div><div class="wheel" id="wheel" style="background:conic-gradient(from -22.5deg,' + segs + ')">' + icons + '<div class="hub"></div></div></div>' +
      '<div class="wheel-out" id="wheelout"></div>' +
      '<button type="button" class="btn-go" id="wheelbtn" data-act="wheel-spin"></button>' +
      '<button type="button" data-act="go-on">Loka</button></div>';
    wheelBtn();
  }

  function wheelBtn() {
    var b = document.getElementById("wheelbtn");
    if (!b) return;
    var n = S.spins || 0;
    b.textContent = n > 0 ? "Snúa (" + n + ")" : "Ekkert hjól í bili";
    b.classList.toggle("dim", n < 1 || ui.spinning);
  }

  function spinWheel() {
    if (ui.spinning || (S.spins || 0) < 1) return;
    ui.spinning = true;
    S.spins -= 1;
    var idx = F.wheelRoll(Math.random);
    var d = (Math.random() - 0.5) * 30;
    var near = false;
    if (idx === 5 && Math.random() < 0.65) { d = 19; near = true; }
    else if (idx === 7 && Math.random() < 0.65) { d = -19; near = true; }
    var angle = 360 * 6 + 360 - (idx * 45 + d);
    var w = document.getElementById("wheel");
    document.getElementById("wheelout").innerHTML = "";
    wheelBtn();
    w.style.transition = reduceMotion ? "none" : "transform 3.8s cubic-bezier(0.1, 0.75, 0.12, 1)";
    w.style.transform = "rotate(" + angle + "deg)";
    var ticks = 0;
    var iv = setInterval(function () {
      ticks += 1;
      if (sfx()) sfx().tick();
      if (ticks > 26) clearInterval(iv);
    }, 110 + 0);
    setTimeout(function () {
      clearInterval(iv);
      var lv = L.levelOf(S.xp).current.level;
      var rw = F.wheelReward(idx, lv, Meta, Math.random);
      var extra = F.applyReward(S, Meta, rw, Math.random);
      ui.spinning = false;
      var out = document.getElementById("wheelout");
      if (!out) { afterReward(rw, extra, null); return; }
      out.innerHTML = (near ? '<div class="near">Næstum því stórvinningur! \ud83d\ude31</div>' : "") + rewardCardHTML(rw, extra);
      countUps(out);
      afterReward(rw, extra, document.querySelector(".wheelbox"));
      wheelBtn();
      w.style.transition = "none";
      w.style.transform = "rotate(" + (angle % 360) + "deg)";
    }, reduceMotion ? 50 : 3900);
  }

  /* ---------- tools collection ---------- */
  function showTools() {
    ui.lock = true;
    var own = Meta.tools || {};
    var b = F.bonuses(own);
    var have = F.TOOLS.filter(function (t) { return own[t.id]; }).length;
    var html = '<div class="sheet toolsbox"><div class="kicker">\ud83e\uddf0 Verkfærasafn ' + have + "/" + F.TOOLS.length + "</div>" +
      '<div class="tb-sum">' + (F.bonusText(b) ? L.esc(F.bonusText(b)) : "Opnaðu kassa til að finna verkfæri") + "</div>";
    F.RORDER.forEach(function (r) {
      var list = F.toolsOf(r);
      var n = list.filter(function (t) { return own[t.id]; }).length;
      var done = F.setDone(own, r);
      html += '<div class="tset r-' + r + (done ? " done" : "") + '"><div class="tset-h"><b style="color:' + F.RARITY[r].color + '">' + F.RARITY[r].name + "</b><span>" + n + "/" + list.length + '</span></div>' +
        '<div class="gbar"><span style="width:' + Math.round((n / list.length) * 100) + '%"></span></div>' +
        '<div class="setb">' + (done ? "\u2705 " : "\ud83c\udf81 Safn: ") + L.esc(F.bonusText(F.SETS[r])) + "</div>" +
        '<div class="tgrid">' + list.map(function (t) {
          return own[t.id]
            ? '<div class="tool on r-' + r + '"><i>' + t.icon + "</i><b>" + L.esc(t.name) + "</b><small>" + L.esc(F.bonusText(t.b)) + "</small></div>"
            : '<div class="tool miss"><i>' + t.icon + "</i><b>???</b><small>Vantar</small></div>";
        }).join("") + "</div></div>";
    });
    html += '<button type="button" class="btn-go" data-act="go-on">Loka</button></div>';
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = html;
  }

  /* ---------- crew ---------- */
  function crewHTML() {
    var lv = L.levelOf(S.xp).current.level;
    var now = Date.now();
    var pend = F.crewPending(S, now);
    var max = F.crewMax(S);
    var rate = F.crewRate(S);
    var capH = F.crewCapH(S);
    var pct = max ? Math.min(100, Math.round(pend / max * 100)) : 0;
    var capLvl = S.crew.cap || 0;
    var capBtn = capLvl >= F.CAPCOST.length ? '<div class="mine">Hámark</div>'
      : '<button type="button" class="' + (S.cash >= F.CAPCOST[capLvl] ? "" : "dim") + '" data-act="crewcap">Geymsla ' + F.CAPH[capLvl + 1] + " klst. " + L.formatNum(F.CAPCOST[capLvl]) + " kr</button>";
    var cards = F.CREW.map(function (c) {
      var n = S.crew[c.id] || 0;
      if (lv < c.lvl) return '<div class="hcard dim"><span class="ico">\ud83d\udd12</span><div class="hbody"><b>' + c.name + '</b><div>Opnast á þrepi ' + c.lvl + "</div></div></div>";
      var cost = F.crewCost(c, n);
      return '<div class="hcard"><span class="ico">' + c.icon + '</span><div class="hbody"><b>' + c.name + " x" + n + "</b><div>+" + L.formatNum(c.rate) + ' kr á mín.</div></div>' +
        '<button type="button" class="' + (S.cash >= cost ? "" : "dim") + '" data-act="hire" data-id="' + c.id + '">Ráða ' + L.formatNum(cost) + " kr</button></div>";
    }).join("");
    return '<div class="view crew-view">' +
      '<div class="collect"><div class="kicker">Teymið vinnur fyrir þig</div>' +
      '<div class="cl-amt" data-crew-live="amt">' + L.formatNum(pend) + ' kr</div>' +
      '<div class="gbar"><span data-crew-live="bar" style="width:' + pct + '%"></span></div>' +
      '<div class="fine" data-crew-live="note">' + (rate ? (L.formatNum(rate) + " kr á mín. Hámark " + capH + " klst.") : "Ráddu fyrsta starfsmanninn") + "</div>" +
      '<button type="button" class="btn-go' + (pend > 0 ? " pulse" : " dim") + '" data-act="collect" data-crew-live="btn">\ud83d\udcb0 Sæktu</button></div>' +
      '<div class="stack">' + cards + "</div>" +
      '<h2>Geymsla</h2><div class="stack"><div class="hcard"><span class="ico">\u23f1\ufe0f</span><div class="hbody"><b>' + capH + ' klst. geymsla</b><div>Teymið vinnur líka þegar þú ert í burtu</div></div>' + capBtn + "</div></div></div>";
  }

  function coinRain() {
    if (reduceMotion) return;
    var box = document.createElement("div");
    box.className = "rain";
    var em = ["\ud83e\ude99", "\ud83d\udcb0", "\ud83d\udcb5", "\u2728"];
    for (var i = 0; i < 34; i++) {
      var s = document.createElement("i");
      s.textContent = em[i % em.length];
      s.style.left = Math.round(Math.random() * 96) + "%";
      s.style.animationDelay = (Math.random() * 0.7) + "s";
      s.style.animationDuration = (0.9 + Math.random() * 0.8) + "s";
      s.style.fontSize = (18 + Math.round(Math.random() * 16)) + "px";
      box.appendChild(s);
    }
    document.body.appendChild(box);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 2200);
  }

  function collectCrew() {
    var n = F.crewCollect(S, Date.now());
    if (n <= 0) { toast("Ekkert að sækja enn", "bad"); return 0; }
    earn(n);
    commit();
    coinRain();
    toast("+" + L.formatKr(n), "gold");
    if (sfx()) sfx().level();
    var m = F.microEvent(S, "crew", n, null, Math.random);
    render({ keepScroll: true, pop: true });
    cloudSync(false);
    return n;
  }

  function showCrewSheet() {
    ui.lock = true;
    var pend = F.crewPending(S, Date.now());
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = '<div class="sheet collectsheet"><div class="kicker">\ud83d\udc77 Teymið er búið að vinna</div>' +
      '<div class="hero good" id="cs-amt" data-count="' + pend + '" data-mode="kr">' + L.formatNum(pend) + ' kr</div>' +
      '<button type="button" class="btn-go pulse" data-act="collect-sheet">\ud83d\udcb0 Sæktu</button></div>';
    countUps(ov);
  }

  function crewNeedsSheet() {
    return F.crewRate(S) > 0 && F.crewPending(S, Date.now()) >= 800;
  }

  /* ---------- league ---------- */
  function leagueChipHTML() {
    var t = F.TIERS[Meta.week.tier || 0];
    var lg = ui.league;
    var line;
    if (lg && lg.above) line = '<span class="lg-up">\u2b06 ' + L.esc(lg.above.name) + " er " + L.formatNum(lg.above.diff) + " stig á undan þér</span>";
    else if (lg && lg.total > 1) line = '<span class="lg-lead">\ud83d\udc51 Þú ert efst/ur!</span>';
    else line = '<span class="lg-up">Bjóddu vinum í deildina</span>';
    return '<span class="lg-t">' + t.icon + ' <b data-led="wk" data-v="' + Meta.week.score + '">' + L.formatNum(Meta.week.score) + "</b></span>" + line +
      (lg && lg.rank ? '<span class="lg-r">#' + lg.rank + "</span>" : "");
  }

  function updateLeague() {
    if (!Meta || !Meta.week || !C) return;
    var res = F.computeLeague(ui.leagueRows || [], C.id(), Meta.week.score, C.name() || "Þú");
    var prev = ui.league;
    ui.league = res;
    if (prev && prev.aboveIds && ui.leagueRows) {
      res.aboveIds.forEach(function (id) {
        if (prev.aboveIds.indexOf(id) < 0 && id !== C.id()) {
          var who = res.rows.filter(function (r) { return r.id === id; })[0];
          toast("\ud83d\ude31 " + (who ? who.name : "Einhver") + " fór fram úr þér!", "bad");
          if (sfx()) sfx().bad();
          var chip0 = document.getElementById("leaguechip");
          if (chip0) { chip0.classList.remove("flash"); void chip0.offsetWidth; chip0.classList.add("flash"); }
        }
      });
      prev.aboveIds.forEach(function (id) {
        if (res.aboveIds.indexOf(id) < 0) {
          var who2 = res.rows.filter(function (r) { return r.id === id; })[0];
          toast("\ud83c\udf89 Þú fórst fram úr " + (who2 ? who2.name : "einhverjum") + "!", "gold");
          if (sfx()) sfx().win();
        }
      });
    }
    var chip = document.getElementById("leaguechip");
    if (chip) chip.innerHTML = leagueChipHTML();
  }

  function refreshLeague(cb) {
    if (!C || !C.hasName() || !Meta.week) { if (cb) cb(); return; }
    C.week(Meta.week.id, function (rows) {
      if (rows) ui.leagueRows = rows;
      updateLeague();
      if (cb) cb(!!rows);
    });
  }

  function weekLeft() {
    var d = new Date();
    var dow = d.getUTCDay() || 7;
    var next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + (8 - dow));
    var ms = Math.max(0, next - d.getTime());
    var days = Math.floor(ms / 86400000);
    var hrs = Math.floor((ms % 86400000) / 3600000);
    return days + " d. " + hrs + " klst.";
  }

  function boardTabsHTML() {
    return '<div class="tabs2"><button type="button" class="' + (ui.boardTab === "week" ? "on" : "") + '" data-act="board-tab" data-id="week">Vikan</button>' +
      '<button type="button" class="' + (ui.boardTab === "all" ? "on" : "") + '" data-act="board-tab" data-id="all">Allir tímar</button></div>';
  }

  function drawBoard(allRows) {
    var host = document.getElementById("boardbody");
    if (!host) return;
    var tabs = document.getElementById("boardtabs");
    if (tabs) tabs.innerHTML = boardTabsHTML();
    var me = C ? C.id() : "";
    if (ui.boardTab === "all") {
      if (!allRows) { host.innerHTML = '<p class="fine">Hleð...</p>'; return; }
      if (allRows === "err") { host.innerHTML = '<p class="fine">Ekkert samband.</p>'; return; }
      var html = '<div class="brow bhead"><span>#</span><span>Nafn</span><span>Þrep</span><span>Eignir</span></div>';
      allRows.forEach(function (r, i) {
        var medal = i === 0 ? "\ud83e\udd47" : (i === 1 ? "\ud83e\udd48" : (i === 2 ? "\ud83e\udd49" : String(i + 1)));
        html += '<div class="brow' + (r.player_id === me ? " me" : "") + (i < 3 ? " top3" : "") + '"><span class="rk">' + medal + '</span>' +
          '<span class="nm"><b>' + L.esc(r.name) + "</b><em>" + L.esc(r.title) + "</em></span>" +
          '<span class="lv">' + L.esc(String(r.level)) + '</span><span class="nw">' + L.formatNum(Number(r.net_worth) || 0) + "</span></div>";
      });
      host.innerHTML = html;
      return;
    }
    var lg = ui.league || F.computeLeague([], me, Meta.week.score, C ? C.name() : "Þú");
    var t = Meta.week.tier || 0;
    var tier = F.TIERS[t];
    var next = F.TIERS[t + 1];
    var pct = next ? Math.min(100, Math.round((Meta.week.score - tier.min) / (next.min - tier.min) * 100)) : 100;
    var h = '<div class="lg-head"><div class="lg-ico">' + tier.icon + '</div><div><b>' + tier.id + 'deild</b><div class="fine">' + L.formatNum(Meta.week.score) + " stig. Ný vika eftir " + weekLeft() + '</div></div></div>' +
      '<div class="gbar big"><span style="width:' + pct + '%"></span></div>' +
      '<div class="fine">' + (next ? (L.formatNum(next.min - Meta.week.score) + " stig í " + next.icon + " " + next.id) : "Hæsta deild!") + "</div>";
    if (lg.above) h += '<div class="lg-banner up">\u2b06 ' + L.esc(lg.above.name) + " er " + L.formatNum(lg.above.diff) + " stig á undan þér</div>";
    else if (lg.total > 1) h += '<div class="lg-banner lead">\ud83d\udc51 Þú ert efst/ur!</div>';
    else h += '<div class="lg-banner">Sendu vinum hlekkinn og keppið!</div>';
    h += '<div class="brow bhead lg"><span>#</span><span>Nafn</span><span>Munur</span><span>Stig</span></div>';
    lg.rows.forEach(function (r, i) {
      var medal = i === 0 ? "\ud83e\udd47" : (i === 1 ? "\ud83e\udd48" : (i === 2 ? "\ud83e\udd49" : String(i + 1)));
      var diff = r.me ? "" : (r.score > Meta.week.score ? '<b class="dn">+' + L.formatNum(r.score - Meta.week.score) + "</b>" : '<b class="upc">-' + L.formatNum(Meta.week.score - r.score) + "</b>");
      var isAbove = lg.above && lg.above.id === r.id;
      var ti = F.TIERS[F.tierIdx(r.score)];
      h += '<div class="brow lg' + (r.me ? " me" : "") + (isAbove ? " target" : "") + (i < 3 ? " top3" : "") + '"><span class="rk">' + medal + '</span>' +
        '<span class="nm"><b>' + L.esc(r.name) + (r.me ? " (þú)" : "") + "</b><em>" + ti.icon + " " + ti.id + "</em></span>" +
        '<span class="df">' + diff + '</span><span class="nw">' + L.formatNum(r.score) + "</span></div>";
    });
    host.innerHTML = h;
  }

  function showBoard() {
    ui.lock = true;
    ui.boardTab = ui.boardTab || "week";
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = '<div class="sheet board"><div class="kicker">\ud83c\udfc6 Stigatafla</div><div id="boardtabs"></div>' +
      '<div class="rows" id="boardbody"><p class="fine">Hleð...</p></div>' +
      '<button type="button" class="btn-go" data-act="go-on">Loka</button></div>';
    loadBoard();
  }

  function loadBoard() {
    drawBoard(null);
    cloudSync(true);
    if (ui.boardTab === "all") {
      if (!C) return;
      setTimeout(function () {
        C.top(function (rows) { drawBoard(rows || "err"); });
      }, 0);
    } else {
      drawBoard(null);
      setTimeout(function () { refreshLeague(function () { drawBoard(null); }); }, 400);
    }
  }

  /* ---------- streak calendar ---------- */
  function calendarHTML(streak, claimedToday) {
    var day = ((Math.max(1, streak) - 1) % 7) + 1;
    var out = '<div class="cal">';
    for (var d = 1; d <= 7; d++) {
      var st = d < day || (d === day && claimedToday) ? "done" : (d === day ? "today" : "");
      out += '<div class="cd ' + st + (d === 7 ? " big" : "") + '"><small>Dagur ' + d + "</small><i>" + (st === "done" ? "\u2705" : F.DAY_ICON[d - 1]) + "</i></div>";
    }
    return out + "</div>";
  }

  function showBonus() {
    var p = Meta.login && Meta.login.pending;
    if (!p) return;
    ui.lock = true;
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    var extra = p.day === 3 ? " + kassi" : (p.day === 5 ? " + kassi og hjól" : (p.day === 7 ? " + STÓR kassi" : ""));
    ov.innerHTML = '<div class="sheet bonus">' +
      '<div class="kicker">Dagleg umbun \ud83d\udd25 ' + p.streak + " dagar í röð</div>" +
      calendarHTML(p.streak, false) +
      '<div class="hero good" data-count="' + p.amount + '" data-mode="kr">' + L.formatKr(p.amount) + "</div>" +
      '<div class="hero-sub">' + (extra ? "Dagur " + p.day + extra : "Dagur " + p.day) + "</div>" +
      (Meta.login.freezes ? '<div class="fine ctr">\u2744\ufe0f Frystir: ' + Meta.login.freezes + "</div>" : "") +
      (p.msg ? '<p class="fine ctr">' + L.esc(p.msg) + "</p>" : "") +
      '<button type="button" class="btn-go pulse" data-act="bonus-take">Taka</button>' +
      '<button type="button" data-act="bonus-later">Síðar</button></div>';
    countUps(ov);
  }

  function takeBonus() {
    var pend = Meta.login && Meta.login.pending;
    var day = pend ? pend.day : 0;
    var res = L.claimLogin(S, Meta);
    if (res) {
      if (day === 3) ui.queue.unshift(function () { showCrateSheet(1, {}, "Dagur 3: kassi!"); });
      else if (day === 5) { S.spins = (S.spins || 0) + 1; ui.queue.unshift(function () { showCrateSheet(2, {}, "Dagur 5: kassi og hjól!"); }); }
      else if (day === 7) ui.queue.unshift(function () { showCrateSheet(3, { forceTool: true, minRarity: "epic" }, "Dagur 7: STÓR KASSI!"); });
    }
    saveMeta();
    commit();
    hideOverlay();
    render({ pop: true });
    if (!res) return;
    earn(res.amount);
    toast("+" + L.formatKr(res.amount), "gold");
    if (sfx()) sfx().coin();
    celebrate(res);
    cloudSync(false);
  }

  /* ---------- call-outs ---------- */
  function calloutEl() {
    var el = document.getElementById("callout");
    if (!el) {
      el = document.createElement("div");
      el.id = "callout";
      el.hidden = true;
      document.body.appendChild(el);
    }
    return el;
  }

  function spawnCallout() {
    var lv = L.levelOf(S.xp).current.level;
    var ids = ["litir", "bilun"];
    if (lv >= 2) ids.push("nod");
    var tid = ids[Math.floor(Math.random() * ids.length)];
    var t = L.JOB_TYPES.filter(function (x) { return x.id === tid; })[0];
    var info = F.CALLOUTS[Math.floor(Math.random() * F.CALLOUTS.length)];
    var pay = Math.round(t.pay * (1 + (lv - 1) * 0.16) * 3 / 100) * 100;
    var job = {
      uid: "c" + Math.floor(Math.random() * 1e9).toString(36), type: tid, name: "Neyðarútkall", blurb: t.blurb,
      seconds: Math.min(t.seconds, 18), pay: pay, xp: t.xp * 2, jackpot: false, mat: null, callout: true,
      data: t.make(Math.random, S, 0)
    };
    ui.callout = { state: "live", job: job, info: info, deadline: Date.now() + 22000, total: 22000 };
    var el = calloutEl();
    el.hidden = false;
    el.className = "live";
    el.innerHTML = '<button type="button" data-act="callout"><span class="co-i">\ud83d\udea8</span><span class="co-b"><b>' + L.esc(info.t) + '</b><em>3x laun: ' + L.formatKr(pay) + ' \u2022 Tapp!</em></span><span class="co-t" id="cotime">22</span></button><div class="co-bar"><span id="cobar"></span></div>';
    if (sfx()) { sfx().bad(); setTimeout(function () { if (sfx()) sfx().ok(); }, 160); sfx().buzz(40); }
  }

  function hideCallout() {
    var el = calloutEl();
    el.hidden = true;
    el.innerHTML = "";
    ui.callout = null;
    ui.nextCall = Date.now() + 70000 + Math.random() * 60000;
  }

  function acceptCallout() {
    var co = ui.callout;
    if (!co || co.state !== "live" || ui.lock) return;
    var job = co.job;
    hideCallout();
    ui.pendingCallout = job;
    beginJob(job, false);
  }

  function tick() {
    var now = Date.now();
    if (!S || !Meta) return;
    var co = ui.callout;
    if (co) {
      var el = calloutEl();
      if (co.state === "live") {
        if (ui.lock) co.deadline += 1000;
        var left = (co.deadline - now) / 1000;
        if (left <= 0) {
          var lost = co.job.pay;
          co.state = "missed";
          co.hide = now + 4500;
          el.className = "missed";
          el.innerHTML = '<div class="co-miss"><span class="co-i">\ud83d\ude22</span><span class="co-b"><b>Misstir af ' + L.formatKr(lost) + '</b><em>' + L.esc(co.info.t) + "</em></span></div>";
          if (sfx()) sfx().bad();
          S.missed = (S.missed || 0) + lost;
        } else {
          var t1 = document.getElementById("cotime");
          var b1 = document.getElementById("cobar");
          if (t1) t1.textContent = String(Math.ceil(left));
          if (b1) b1.style.width = Math.max(0, left * 1000 / co.total * 100) + "%";
          el.classList.toggle("urgent", left < 7);
        }
      } else if (now > co.hide) hideCallout();
    } else if (!ui.lock && !document.hidden && C && C.hasName() && S.stats && S.stats.jobs >= 1 && now >= ui.nextCall) {
      spawnCallout();
    }
    // crew live
    var live = document.querySelector("[data-crew-live=amt]");
    var pend = F.crewPending(S, now);
    var max = F.crewMax(S);
    if (live) {
      live.textContent = L.formatNum(Math.min(pend, max)) + " kr";
      var bar = document.querySelector("[data-crew-live=bar]");
      if (bar) bar.style.width = (max ? Math.min(100, pend / max * 100) : 0) + "%";
      var note = document.querySelector("[data-crew-live=note]");
      if (note && max && pend >= max) note.textContent = "Fullt! Sæktu núna";
      var btn = document.querySelector("[data-crew-live=btn]");
      if (btn) { btn.classList.toggle("dim", pend <= 0); btn.classList.toggle("pulse", pend > 0); }
    }
    var dot = document.querySelector(".ndot");
    if (dot) dot.hidden = !(F.crewRate(S) > 0 && pend >= Math.max(800, max * 0.4));
  }

  function microDone(list) {
    if (!list || !list.length) return;
    var tot = 0;
    list.forEach(function (m, i) {
      tot += m.cash;
      setTimeout(function () { toast("\u2705 " + m.label + " +" + L.formatNum(m.cash), "gold"); }, i * 260);
    });
    earn(tot);
    commit();
    render({ keepScroll: true, pop: true });
    var mg = document.querySelector(".micro");
    if (mg) { mg.classList.remove("flash"); void mg.offsetWidth; mg.classList.add("flash"); }
    if (sfx()) sfx().win();
  }

  function findJob(uid) {
    for (var i = 0; i < S.jobs.length; i++) if (S.jobs[i].uid === uid) return S.jobs[i];
    return null;
  }

  function beginJob(job, useMat) {
    clearToasts();
    ui.lock = true;
    ui.jobUid = job.uid;
    if (window.RafPuzzles) window.RafPuzzles.destroy();
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "full";
    ov.innerHTML = '<div class="puzzle-root"></div>';
    var tb = S.bonus && S.bonus.time ? S.bonus.time : 0;
    var run = job;
    if (tb && !job.callout) {
      run = {};
      for (var k in job) if (Object.prototype.hasOwnProperty.call(job, k)) run[k] = job[k];
      run.seconds = Math.round(job.seconds * (1 + tb));
    }
    window.RafPuzzles.mount(ov.querySelector(".puzzle-root"), run, {
      onDone: function (result) {
        if (ui.jobUid !== job.uid) return;
        ui.jobUid = null;
        var summary = L.completeJob(S, job, result, !!useMat, Math.random);
        if (job.callout) summary.callout = true;
        var r = summary.reward || {};
        summary.micro = F.microEvent(S, "job", 1, { perfect: r.perfect, ratio: r.ratio, timeUsed: result.timeUsed }, Math.random);
        S.jobsSinceSpin = (S.jobsSinceSpin || 0) + 1;
        if (S.jobsSinceSpin >= 3 || summary.levelUp) { S.jobsSinceSpin = 0; S.spins = (S.spins || 0) + 1; }
        var pts = (r.pay || 0) + 5000;
        summary.micro.forEach(function (m) { pts += m.cash; });
        commit();
        earn(pts);
        presentMorning(summary);
      }
    });
  }
  function doBuy(id) {
    var qty = L.tradeQty(S, id, ui.qty, "buy");
    if (qty < 1) {
      toast(S.cash < (S.prices[id] || 0) ? "Vantar fé" : "Bíllinn er fullur", "bad");
      if (sfx()) sfx().bad();
      return;
    }
    var res = L.buy(S, id, qty);
    if (!res.ok) {
      toast("Ekki hægt", "bad");
      return;
    }
    commit();
    render({ keepScroll: true, pop: true });
    toast("Keypt " + res.qty + " " + res.name, "good");
    if (sfx()) sfx().coin();
    celebrate(res);
    microDone(F.microEvent(S, "buy", res.qty, null, Math.random));
  }

  function doSell(id) {
    var qty = L.tradeQty(S, id, ui.qty, "sell");
    if (qty < 1) {
      toast("Ekkert á lager", "bad");
      if (sfx()) sfx().bad();
      return;
    }
    var res = L.sell(S, id, qty);
    commit();
    render({ keepScroll: true, pop: true });
    var msg = "Selt " + res.qty + " " + res.name;
    if (res.profit) msg += ". " + L.formatKrSigned(res.profit);
    toast(msg, res.profit >= 0 ? "good" : "bad");
    if (sfx()) sfx().coin();
    celebrate(res);
    var md = F.microEvent(S, "sell", res.qty, null, Math.random);
    if (res.profit > 0) {
      earn(res.profit);
      md = md.concat(F.microEvent(S, "profit", res.profit, null, Math.random));
    }
    microDone(md);
    cloudSync(false);
  }

  function doHouse(id) {
    var res = L.buyHouse(S, id);
    if (!res.ok) {
      toast(res.reason === "cash" ? "Vantar fé" : "Ekki hægt", "bad");
      if (sfx()) sfx().bad();
      return;
    }
    commit();
    render({ pop: true });
    toast(res.name, "gold");
    if (sfx()) sfx().level();
    celebrate(res);
    cloudSync(false);
  }

  function doUpgrade(id) {
    var res = L.buyUpgrade(S, id);
    if (!res.ok) {
      toast(res.reason === "cash" ? "Vantar fé" : (res.reason === "tier" ? "Þarf stærra hús" : "Ekki hægt"), "bad");
      if (sfx()) sfx().bad();
      return;
    }
    commit();
    render({ pop: true });
    toast(res.name, "gold");
    if (sfx()) sfx().win();
    celebrate(res);
    cloudSync(false);
  }

  function doMoney(kind, id) {
    var n = id === "allt" ? 1e15 : Number(id);
    var res = kind === "debt" ? L.payDebt(S, n) : (kind === "in" ? L.deposit(S, n) : L.withdraw(S, n));
    if (!res || !res.ok) {
      toast("Ekki hægt", "bad");
      if (sfx()) sfx().bad();
      return;
    }
    commit();
    render({ pop: true });
    if (sfx()) sfx().coin();
    celebrate(res);
  }

  function doTravel(id) {
    if (ui.lock || id === S.loc) return;
    ui.lock = true;
    var summary = L.travel(S, id, Math.random);
    if (!summary) {
      ui.lock = false;
      return;
    }
    summary.micro = F.microEvent(S, "travel", 1, null, Math.random);
    var tp = 0;
    summary.micro.forEach(function (m) { tp += m.cash; });
    commit();
    earn(tp);
    presentMorning(summary);
  }

  function doJob(uid) {
    if (ui.lock) return;
    var job = findJob(uid);
    if (!job) return;
    var info = L.matInfo(S, job);
    if (info.mode === "choice") {
      ui.lock = true;
      ui.pendingJob = uid;
      showChoice(info.question);
      return;
    }
    beginJob(job, info.mode === "auto" || info.mode === "tool");
  }

  function fresh() {
    S = L.createState(Math.random, new Date());
    ensureExtras(S);
    ui.tab = "markadur";
    ui.qty = "1";
    commit();
    hideOverlay();
    render();
    toast("Nýr leikur", "good");
    cloudSync(true);
  }

  function onClick(e) {
    if (gesture.moved) return;
    var b = e.target.closest("[data-act]");
    if (!b) return;
    if (e.target.closest(".puzzle-shell")) return;
    var act = b.getAttribute("data-act");
    var id = b.getAttribute("data-id");
    if (act === "go-on") {
      hideOverlay();
      if (ui.afterWelcome) { ui.afterWelcome = false; ui.tab = "verk"; toast("Taktu fyrsta verkið!", "gold"); }
      render();
      return;
    }
    if (act === "callout") { acceptCallout(); return; }
    if (act === "veh-buy") { doVehicle(id); return; }
    if (act === "store-buy") { doStorage(); return; }
    if (act === "wheel-open") { if (ui.crate && !ui.crate.done) resolveCrate(); if (!ui.spinning) showWheel(); return; }
    if (act === "wheel-spin") { spinWheel(); return; }
    if (act === "tools-open") { showTools(); return; }
    if (act === "board-tab") { ui.boardTab = id; loadBoard(); return; }
    if (act === "collect-sheet") {
      collectCrew();
      var csb = b;
      csb.setAttribute("data-act", "go-on");
      csb.textContent = "Áfram";
      csb.classList.remove("pulse");
      return;
    }
    if (act === "name-ok") { submitName(id === "r"); return; }
    if (act === "bonus-take") { takeBonus(); return; }
    if (act === "bonus-later") { hideOverlay(); toast("Umbun bíður", "good"); return; }
    if (act === "bonus-open") { showBonus(); return; }
    if (act === "confirm-yes") { fresh(); return; }
    if (act === "confirm-no") { hideOverlay(); render(); return; }
    if (act === "mat-yes" || act === "mat-no") {
      var job = findJob(ui.pendingJob);
      ui.pendingJob = null;
      if (!job) { hideOverlay(); return; }
      beginJob(job, act === "mat-yes");
      return;
    }
    if (ui.lock) return;
    if (act === "goal" && id === "garage") { showGarage(false); return; }
    if (act === "tab" || act === "goal") {
      ui.tab = id || "markadur";
      render();
      return;
    }
    if (act === "qty") { ui.qty = id; render({ keepScroll: true }); return; }
    if (act === "sound") {
      Meta.sound = !Meta.sound;
      if (sfx()) sfx().setEnabled(Meta.sound);
      saveMeta();
      render({ keepScroll: true });
      if (sfx()) sfx().tick();
      return;
    }
    if (act === "buy") { doBuy(id); return; }
    if (act === "sell") { doSell(id); return; }
    if (act === "go") { doTravel(id); return; }
    if (act === "job") { doJob(id); return; }
    if (act === "house") { doHouse(id); return; }
    if (act === "upgrade") { doUpgrade(id); return; }
    if (act === "debt" || act === "in" || act === "out") { doMoney(act, id); return; }
    if (act === "board") { showBoard(); return; }
    if (act === "garage") { showGarage(false); return; }
    if (act === "collect") { collectCrew(); return; }
    if (act === "hire") {
      var hr = F.crewHire(S, id, Date.now());
      if (!hr.ok) { toast(hr.reason === "cash" ? "Vantar fé" : "Ekki hægt", "bad"); if (sfx()) sfx().bad(); return; }
      commit(); render({ keepScroll: true, pop: true });
      toast("Ráðinn!", "gold"); if (sfx()) sfx().level(); cloudSync(false);
      return;
    }
    if (act === "crewcap") {
      var cr = F.crewCapUp(S, Date.now());
      if (!cr.ok) { toast(cr.reason === "cash" ? "Vantar fé" : "Ekki hægt", "bad"); if (sfx()) sfx().bad(); return; }
      commit(); render({ keepScroll: true, pop: true }); toast("Meiri geymsla!", "gold"); if (sfx()) sfx().win();
      return;
    }
    if (act === "rename") { showNamePrompt(true); return; }
    if (act === "new") { showConfirm(); }
  }

  function boot() {
    Meta = loadMeta();
    if (typeof Meta.sound !== "boolean") Meta.sound = true;
    if (!Meta.tools) Meta.tools = {};
    var prevWeek = F.weekReset(Meta, new Date());
    S = loadState() || L.createState(Math.random, new Date());
    ensureExtras(S);
    L.ensureChallenges(S, new Date());
    L.checkLogin(Meta, L.dateStr(new Date()));
    if (sfx()) sfx().setEnabled(Meta.sound);
    saveMeta();
    commit();
    render();
    if (C && !C.hasName()) {
      showNamePrompt(false);
    } else {
      if (Meta.login && Meta.login.pending) ui.queue.push(showBonus);
      if (prevWeek && prevWeek.score > 0) ui.queue.push(function () { showWeekEnd(prevWeek); });
      if (crewNeedsSheet()) ui.queue.push(showCrewSheet);
      runQueue();
      cloudSync(false);
      setTimeout(refreshLeague, 1200);
    }
    setInterval(tick, 1000);
    setInterval(function () { if (!document.hidden) refreshLeague(); }, 30000);
    document.addEventListener("pointerdown", function (e) {
      gesture.x = e.clientX;
      gesture.y = e.clientY;
      gesture.moved = false;
      if (sfx()) sfx().unlock();
    }, { passive: true });
    document.addEventListener("pointermove", function (e) {
      if (Math.abs(e.clientX - gesture.x) > 18 || Math.abs(e.clientY - gesture.y) > 18) gesture.moved = true;
    }, { passive: true });
    document.addEventListener("click", onClick);
  }

  boot();
})();
