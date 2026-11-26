(function () {
  "use strict";
  var URL_BASE = "https://dvmufututcxyanfovikm.supabase.co/rest/v1/rl_players";
  var KEY = "sb_publishable_SLYw8G5BqYlbUgB793AXfA_jEXCmX93";
  var PKEY = "rafvirkja-leikur-player";
  var MIN_GAP = 12000;
  var player = null;
  var lastSent = 0;
  var timer = null;
  var latest = null;

  function rid() {
    var s = "";
    try {
      var a = new Uint8Array(16);
      window.crypto.getRandomValues(a);
      for (var i = 0; i < a.length; i++) s += (a[i] + 256).toString(16).slice(1);
    } catch (err) {
      for (var j = 0; j < 32; j++) s += Math.floor(Math.random() * 16).toString(16);
    }
    return "p" + s;
  }

  function load() {
    if (player) return player;
    try {
      var raw = localStorage.getItem(PKEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p.id === "string" && p.id.length >= 8) { player = p; return player; }
      }
    } catch (err) { /* ignore */ }
    player = { id: rid(), name: "" };
    return player;
  }

  function save() {
    try { localStorage.setItem(PKEY, JSON.stringify(player)); } catch (err) { /* private mode */ }
  }

  function cleanName(n) {
    n = String(n || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim();
    return n.slice(0, 16);
  }

  function name() { return load().name; }

  function setName(n) {
    load();
    player.name = cleanName(n) || ("Rafvirki " + (100 + Math.floor(Math.random() * 900)));
    save();
    return player.name;
  }

  function id() { return load().id; }

  function buildRow(S, meta, L) {
    var lv = L.levelOf(S.xp).current;
    var best = Math.max(meta && meta.best ? meta.best : 0, L.score(S));
    return {
      player_id: load().id,
      name: load().name || "Rafvirki",
      title: lv.title,
      level: lv.level,
      xp: Math.max(0, Math.round(S.xp)),
      cash: Math.round(S.cash),
      net_worth: Math.round(L.netWorth(S)),
      days_played: S.day,
      best_score: Math.max(0, Math.round(best)),
      house: S.house ? L.houseById(S.house).name : "",
      achievements: S.achievements.length,
      jobs_done: S.stats ? S.stats.jobs : 0
    };
  }

  function post(row, keep) {
    if (typeof fetch !== "function") return;
    try {
      fetch(URL_BASE + "?on_conflict=player_id", {
        method: "POST",
        headers: {
          "apikey": KEY,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify(row),
        keepalive: !!keep
      }).catch(function () { /* offline: ignore */ });
    } catch (err) { /* ignore */ }
  }

  function flush(keep) {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!latest || !load().name) return;
    lastSent = Date.now();
    var row = latest;
    latest = null;
    post(row, keep);
  }

  function sync(S, meta, L, now) {
    try {
      if (!load().name) return;
      latest = buildRow(S, meta, L);
      var wait = MIN_GAP - (Date.now() - lastSent);
      if (now || wait <= 0) { flush(false); return; }
      if (!timer) timer = setTimeout(function () { timer = null; flush(false); }, wait);
    } catch (err) { /* never break the game */ }
  }

  function top(cb) {
    if (typeof fetch !== "function") { cb(null); return; }
    var q = "?select=player_id,name,title,level,net_worth,best_score&order=best_score.desc&limit=25";
    fetch(URL_BASE + q, { headers: { "apikey": KEY } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) { cb(Array.isArray(rows) ? rows : null); })
      .catch(function () { cb(null); });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush(true);
  });

  window.RafCloud = { id: id, name: name, setName: setName, sync: sync, top: top, hasName: function () { return !!load().name; } };
})();
