(function () {
  "use strict";
  var L = window.RafLogic;
  var SAVE = "rafvirkja-leikur-v1";
  var META_KEY = "rafvirkja-leikur-meta";
  var S = null;
  var Meta = null;
  var ui = { tab: "markadur", qty: "1", lock: false, jobUid: null, pendingJob: null };
  var gesture = { x: 0, y: 0, moved: false };

  function loadMeta() {
    try {
      var raw = localStorage.getItem(META_KEY);
      if (raw) {
        var m = JSON.parse(raw);
        if (m && typeof m === "object") return m;
      }
    } catch (err) { /* ignore broken meta */ }
    return { best: 0, sound: true, login: null };
  }

  function saveMeta() {
    try { localStorage.setItem(META_KEY, JSON.stringify(Meta)); } catch (err) { /* private mode */ }
  }

  function commit() {
    try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (err) { /* private mode */ }
    var sc = L.score(S);
    if (!Meta.best || sc > Meta.best) {
      Meta.best = sc;
      saveMeta();
    }
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
    }
  }

  function hideOverlay() {
    if (window.RafPuzzles) window.RafPuzzles.destroy();
    var ov = document.getElementById("overlay");
    ov.hidden = true;
    ov.className = "";
    ov.innerHTML = "";
    ui.lock = false;
    ui.jobUid = null;
  }

  function render(opts) {
    opts = opts || {};
    var main = document.querySelector(".main");
    var y = opts.keepScroll && main ? main.scrollTop : 0;
    document.getElementById("app").innerHTML = appHTML(!!opts.pop);
    var main2 = document.querySelector(".main");
    if (opts.keepScroll && main2) main2.scrollTop = y;
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

  function headerHTML(pop) {
    var used = L.usedSpace(S);
    var cap = L.capacity(S);
    var hot = used >= cap ? " hot" : "";
    return '<header class="top">' +
      '<div class="titlebar">' +
      '<div class="title">Rafvirkja Leikur</div>' +
      '<div class="day">' + L.esc(L.dayLabel(S)) + "</div>" +
      (S.combo >= 2 ? '<div class="combo">Röð ' + S.combo + "</div>" : "") +
      '<button type="button" class="iconbtn' + (Meta.sound ? "" : " off") + '" data-act="sound" aria-label="Hljóð">♪</button>' +
      "</div>" +
      '<div class="leds' + (pop ? " pop" : "") + '">' +
      '<div class="led g"><span>PENINGAR</span><b>' + L.formatNum(S.cash) + "</b></div>" +
      '<div class="led g"><span>BANKI</span><b>' + L.formatNum(S.bank) + "</b></div>" +
      '<div class="led r"><span>SKULD</span><b>' + L.formatNum(S.debt) + "</b></div>" +
      '<div class="led y' + hot + '"><span>BÍLL</span><b>' + used + "/" + cap + "</b></div>" +
      "</div>" +
      '<div class="rep"><span>Orðstír</span><div class="repbar"><span style="width:' + S.rep + '%"></span></div></div>' +
      goalHTML() +
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
      '<button type="button" class="' + cls("markadur") + '" data-act="tab" data-id="markadur">Markaður</button>' +
      '<button type="button" class="' + cls("verk") + '" data-act="tab" data-id="verk">Verk</button>' +
      '<button type="button" class="' + cls("hus") + '" data-act="tab" data-id="hus">Hús</button>' +
      '<button type="button" class="' + cls("meira") + '" data-act="tab" data-id="meira">Meira</button>' +
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
        (here ? " disabled" : "") + "><b>" + L.esc(loc.name) + '</b><span class="tip">' + L.esc(loc.tip) + "</span></button>";
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
      return '<div class="good"><div class="ginfo"><div class="gname">' + L.esc(g.name) +
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
      '<div class="goods-col"><div class="toolbar">' +
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
        (job.jackpot ? '<div class="badge">Stórsamningur</div>' : "") +
        '<div class="job-name">' + L.esc(job.name) + "</div>" +
        '<div class="job-pay">' + L.formatKr(job.pay) + "</div>" +
        '<div class="job-meta">' + job.seconds + " sek. " + L.esc(job.blurb) + "</div>" +
        (info.label ? '<div class="job-mat">' + L.esc(info.label) + "</div>" : "") +
        "</button>";
    }).join("");
    if (!cards) cards = '<p class="coach">Engin verk í dag.</p>';
    var locked = L.JOB_TYPES.filter(function (t) { return t.level > level; }).map(function (t) {
      return '<div class="jobcard locked"><div class="job-name">' + L.esc(t.name) + "</div>" +
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
      return '<div class="hcard"><div><b>' + L.esc(h.name) + "</b><div>" + L.esc(h.blurb) + "</div></div>" + action + "</div>";
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
    return '<div class="view house-view">' + houseVisual() +
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
    else if (ui.tab === "meira") view = moreHTML();
    else view = marketHTML(coach);
    return '<div class="shell">' + headerHTML(pop) + '<main class="main">' + view + "</main>" + navHTML(coach) + "</div>";
  }

  function summaryHTML(s) {
    var hero = "";
    if (s.actionCash) {
      hero = '<div class="hero ' + (s.actionCash > 0 ? "good" : "bad") + '">' + L.formatKrSigned(s.actionCash) + '</div><div class="hero-sub">Gróði</div>';
    } else if (s.eventText) hero = '<div class="hero neutral">' + L.esc(s.eventText) + "</div>";
    else hero = '<div class="hero neutral">Nýr dagur</div>';
    var xp = s.actionXp ? '<div class="hero-sub">+' + s.actionXp + " reynsla</div>" : "";
    var bits = "";
    if (s.levelUp) bits += '<div class="banner">Nýtt þrep: ' + L.esc(s.levelUp.title) + "</div>";
    if (s.firmNew) bits += '<div class="banner">Firma: ' + L.esc(s.firmNew) + "</div>";
    (s.unlocked || []).forEach(function (u) {
      bits += '<div class="banner">Nýtt: ' + L.esc(u.name) + "</div>";
    });
    if (s.weekBonus) bits += '<div class="banner">Umbun vikunnar ' + L.formatKr(s.weekBonus) + "</div>";
    if (s.reward && s.reward.speed) bits += '<div class="note good">Hratt</div>';
    if (s.reward && s.reward.matUsed) bits += '<div class="note good">Lager notaður</div>';
    if (S.combo >= 2) bits += '<div class="note good">Röð ' + S.combo + "</div>";
    (s.notes || []).forEach(function (n) {
      var amt = n.amount ? " " + L.formatKrSigned(n.amount) : "";
      bits += '<div class="note ' + (n.kind === "bad" ? "bad" : "good") + '">' + L.esc(n.label) + amt + "</div>";
    });
    if (s.eventText && s.actionCash) bits += '<div class="note">' + L.esc(s.eventText) + "</div>";
    if (s.deal && s.deal.ratio < 0.85) bits += '<div class="note good">Ódýrt: ' + L.esc(s.deal.name) + "</div>";
    var g = L.goals(S)[0];
    var goal = "";
    if (g) {
      var pct = g.need ? Math.max(4, Math.min(100, Math.round((g.have / g.need) * 100))) : 100;
      goal = '<div class="nextgoal"><div class="gbar"><span style="width:' + pct + '%"></span></div><b>' +
        L.esc(g.ready ? ("Tilbúið: " + g.title) : ("Næst: " + g.title)) + "</b><div>" + L.esc(g.detail) + "</div></div>";
    }
    var tease = L.tease(S);
    return '<div class="sheet">' +
      '<div class="kicker">Dagur ' + s.finishedSlot + " búinn</div>" +
      '<div class="where">Þú ert ' + L.esc(s.here) + ".</div>" +
      hero + xp + '<div class="notes">' + bits + "</div>" + goal +
      (tease ? '<div class="tease">' + L.esc(tease) + "</div>" : "") +
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
    reactMorning(summary);
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

  function showBonus() {
    var p = Meta.login && Meta.login.pending;
    if (!p) return;
    ui.lock = true;
    var ov = document.getElementById("overlay");
    ov.hidden = false;
    ov.className = "sheetmode";
    ov.innerHTML = '<div class="sheet bonus">' +
      '<div class="kicker">Dagleg umbun</div>' +
      '<div class="hero good">' + L.formatKr(p.amount) + "</div>" +
      '<div class="hero-sub">' + p.streak + ". dagur í röð</div>" +
      (p.msg ? '<p class="fine">' + L.esc(p.msg) + "</p>" : "") +
      '<button type="button" class="btn-go" data-act="bonus-take">Taka</button>' +
      '<button type="button" data-act="bonus-later">Síðar</button></div>';
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
    window.RafPuzzles.mount(ov.querySelector(".puzzle-root"), job, {
      onDone: function (result) {
        if (ui.jobUid !== job.uid) return;
        ui.jobUid = null;
        var summary = L.completeJob(S, job, result, !!useMat, Math.random);
        commit();
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
    commit();
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
    ui.tab = "markadur";
    ui.qty = "1";
    commit();
    hideOverlay();
    render();
    toast("Nýr leikur", "good");
  }

  function takeBonus() {
    var res = L.claimLogin(S, Meta);
    saveMeta();
    commit();
    hideOverlay();
    render({ pop: true });
    if (res) {
      toast("+" + L.formatKr(res.amount), "gold");
      if (sfx()) sfx().coin();
      celebrate(res);
    }
  }

  function onClick(e) {
    if (gesture.moved) return;
    var b = e.target.closest("[data-act]");
    if (!b) return;
    if (e.target.closest(".puzzle-shell")) return;
    var act = b.getAttribute("data-act");
    var id = b.getAttribute("data-id");
    if (act === "go-on") { hideOverlay(); render(); return; }
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
    if (act === "new") { showConfirm(); }
  }

  function boot() {
    Meta = loadMeta();
    if (typeof Meta.sound !== "boolean") Meta.sound = true;
    S = loadState() || L.createState(Math.random, new Date());
    L.ensureChallenges(S, new Date());
    L.checkLogin(Meta, L.dateStr(new Date()));
    if (sfx()) sfx().setEnabled(Meta.sound);
    saveMeta();
    commit();
    render();
    if (Meta.login && Meta.login.pending) showBonus();
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
