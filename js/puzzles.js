(function () {
  "use strict";
  var L = window.RafLogic;
  var active = { timer: null, later: null };

  function clearActive() {
    if (active.timer) clearInterval(active.timer);
    if (active.later) clearTimeout(active.later);
    active.timer = null;
    active.later = null;
  }

  function sfxOk() { if (window.RafSfx) window.RafSfx.ok(); }
  function sfxBad() { if (window.RafSfx) window.RafSfx.bad(); }
  function sfxTick() { if (window.RafSfx) window.RafSfx.tick(); }

  function mountChrome(root, opts) {
    clearActive();
    var stopped = false;
    var usedHint = false;
    var left = opts.seconds;
    var jack = opts.jackpot ? '<div class="jackline">Stórsamningur</div>' : "";
    root.innerHTML =
      '<div class="puzzle-shell">' +
      '<div class="pz-top"><div class="pz-title">' + L.esc(opts.title) + "</div>" +
      '<div class="pz-time">' + opts.seconds + "</div></div>" +
      '<div class="pz-track"><div class="pz-bar"></div></div>' +
      jack +
      '<div class="pz-rule">' + L.esc(opts.rule || "") + "</div>" +
      '<div class="pz-extra"></div>' +
      '<div class="pz-body"></div>' +
      '<div class="pz-actions">' +
      '<button type="button" class="pz-hint">Ábending</button>' +
      '<button type="button" class="btn-go pz-done">Ljúka</button>' +
      "</div></div>";
    var shell = root.querySelector(".puzzle-shell");
    var body = shell.querySelector(".pz-body");
    var extra = shell.querySelector(".pz-extra");
    var bar = shell.querySelector(".pz-bar");
    var timeEl = shell.querySelector(".pz-time");
    var api = {
      requestFinish: function () {
        if (stopped || active.later) return;
        active.later = setTimeout(finish, 200);
      }
    };
    function finish() {
      if (stopped) return;
      stopped = true;
      clearActive();
      var graded = opts.grade() || { ratio: 0, wrong: 0 };
      opts.onDone({
        ratio: graded.ratio || 0,
        wrong: graded.wrong || 0,
        usedHint: usedHint,
        timeUsed: opts.seconds - Math.max(0, left)
      });
    }
    active.timer = setInterval(function () {
      left -= 0.1;
      var p = Math.max(0, left / opts.seconds);
      bar.style.width = (p * 100) + "%";
      bar.classList.toggle("urgent", p < 0.25);
      timeEl.textContent = String(Math.max(0, Math.ceil(left)));
      if (left <= 0) finish();
    }, 100);
    shell.querySelector(".pz-done").addEventListener("click", finish);
    shell.querySelector(".pz-hint").addEventListener("click", function () {
      usedHint = true;
      shell.querySelector(".pz-hint").classList.add("used");
      if (opts.onHint) opts.onHint();
      sfxTick();
    });
    opts.paint(body, extra, api);
    return api;
  }

  function choiceButtons(row, locked) {
    var cols = row.options.length === 3 ? "c3" : (row.options.length > 4 ? "c2" : "c2");
    if (row.options.length === 4) cols = "c2";
    var html = '<div class="qrow"><div class="qlabel">' + L.esc(row.label) + '</div><div class="choices ' + cols + '">';
    for (var i = 0; i < row.options.length; i++) {
      var opt = row.options[i];
      var cls = locked && opt.id === row.answer ? "good" : "";
      html += '<button type="button" class="' + cls + '" data-row="' + L.esc(row.id) + '" data-opt="' + L.esc(opt.id) + '"' +
        (locked ? " disabled" : "") + ">" + L.esc(opt.label) + "</button>";
    }
    return html + "</div></div>";
  }

  function mountRows(root, job, hooks, rows, rule) {
    var locked = {};
    var wrong = 0;
    var box = null;
    var chrome = null;
    function allLocked() {
      for (var i = 0; i < rows.length; i++) if (!locked[rows[i].id]) return false;
      return true;
    }
    function draw() {
      if (!box) return;
      var html = '<div class="slots">';
      for (var s = 0; s < rows.length; s++) html += '<i class="' + (locked[rows[s].id] ? "on" : "") + '"></i>';
      html += "</div>";
      for (var r = 0; r < rows.length; r++) html += choiceButtons(rows[r], !!locked[rows[r].id]);
      box.innerHTML = html;
    }
    chrome = mountChrome(root, {
      title: job.name,
      seconds: job.seconds,
      rule: rule,
      jackpot: job.jackpot,
      grade: function () {
        return { ratio: L.gradeRows(rows, locked).ratio, wrong: wrong };
      },
      onHint: function () {
        for (var i = 0; i < rows.length; i++) {
          if (!locked[rows[i].id]) {
            locked[rows[i].id] = true;
            draw();
            if (allLocked()) chrome.requestFinish();
            return;
          }
        }
      },
      onDone: hooks.onDone,
      paint: function (body) {
        box = body;
        draw();
        body.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b || !b.dataset.opt) return;
          var row = null;
          for (var i = 0; i < rows.length; i++) if (rows[i].id === b.dataset.row) row = rows[i];
          if (!row || locked[row.id]) return;
          if (b.dataset.opt === String(row.answer)) {
            locked[row.id] = true;
            sfxOk();
            draw();
            if (allLocked()) chrome.requestFinish();
          } else {
            wrong += 1;
            sfxBad();
            b.classList.remove("shake");
            void b.offsetWidth;
            b.classList.add("shake");
          }
        });
      }
    });
  }

  function mountLitir(root, job, hooks) {
    var wires = job.data.wires;
    var index = 0;
    var correct = 0;
    var combo = 0;
    var best = 0;
    var glow = "";
    var box = null;
    var chrome = null;
    function draw() {
      if (!box) return;
      var wire = wires[Math.min(index, wires.length - 1)];
      var dots = "";
      for (var i = 0; i < wires.length; i++) {
        dots += '<i class="' + (i < index ? "on" : "") + '"></i>';
      }
      box.innerHTML =
        '<div class="dots">' + dots + "</div>" +
        (combo >= 2 ? '<div class="combo-pop">x' + combo + "</div>" : "") +
        '<div class="swatch ' + wire.swatch + '"></div>' +
        '<div class="wire-name">' + L.esc(wire.name) + "</div>" +
        '<div class="choices c3 big">' +
        '<button type="button" class="' + (glow === "fasi" ? "glow" : "") + '" data-kind="fasi">Fasi</button>' +
        '<button type="button" class="' + (glow === "null" ? "glow" : "") + '" data-kind="null">Núll</button>' +
        '<button type="button" class="' + (glow === "jord" ? "glow" : "") + '" data-kind="jord">Jörð</button>' +
        "</div>";
    }
    chrome = mountChrome(root, {
      title: job.name,
      seconds: job.seconds,
      rule: job.data.rule,
      jackpot: job.jackpot,
      grade: function () {
        return { ratio: wires.length ? correct / wires.length : 0, wrong: 0 };
      },
      onHint: function () {
        if (index < wires.length) {
          glow = wires[index].kind;
          draw();
        }
      },
      onDone: hooks.onDone,
      paint: function (body) {
        box = body;
        draw();
        body.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b || index >= wires.length) return;
          var wire = wires[index];
          if (b.dataset.kind === wire.kind) {
            correct += 1;
            combo += 1;
            if (combo > best) best = combo;
            sfxOk();
          } else {
            combo = 0;
            sfxBad();
          }
          glow = "";
          index += 1;
          if (index >= wires.length) chrome.requestFinish();
          else draw();
        });
      }
    });
  }

  function mountFault(root, job, hooks) {
    var fault = job.data.fault;
    var options = job.data.options;
    var read = {};
    var last = "---";
    var wrong = 0;
    var solved = false;
    var dead = {};
    var glow = "";
    var box = null;
    var chrome = null;
    function draw() {
      if (!box) return;
      var html = '<div class="clue">' + L.esc(fault.clue) + "</div>" +
        '<div class="meter-screen">' + L.esc(last) + "</div>" +
        '<div class="choices c3">';
      html += '<button type="button" data-read="v">Spenna</button>';
      html += '<button type="button" data-read="ohm">Samfella</button>';
      html += '<button type="button" data-read="pe">Jörð</button>';
      html += '</div><div class="choices c2 diag">';
      for (var i = 0; i < options.length; i++) {
        var o = options[i];
        var cls = (glow === o.id ? "glow " : "") + (solved && o.id === fault.id ? "good" : "");
        html += '<button type="button" class="' + cls + '" data-fault="' + L.esc(o.id) + '"' +
          (dead[o.id] || solved ? " disabled" : "") + ">" + L.esc(o.label) + "</button>";
      }
      html += "</div>";
      if (read.v && read.ohm && read.pe && fault.note) html += '<div class="clue">' + L.esc(fault.note) + "</div>";
      box.innerHTML = html;
    }
    chrome = mountChrome(root, {
      title: job.name,
      seconds: job.seconds,
      rule: job.data.rule,
      jackpot: job.jackpot,
      grade: function () {
        var measured = read.v || read.ohm || read.pe;
        return { ratio: solved ? 1 : (measured ? 0.2 : 0), wrong: wrong };
      },
      onHint: function () {
        glow = fault.id;
        if (!read.v) { read.v = true; last = fault.v; }
        draw();
      },
      onDone: hooks.onDone,
      paint: function (body) {
        box = body;
        draw();
        body.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b || solved) return;
          if (b.dataset.read) {
            read[b.dataset.read] = true;
            if (b.dataset.read === "v") last = fault.v;
            if (b.dataset.read === "ohm") last = fault.ohm;
            if (b.dataset.read === "pe") last = fault.pe;
            sfxTick();
            draw();
            return;
          }
          if (!b.dataset.fault) return;
          if (b.dataset.fault === fault.id) {
            solved = true;
            sfxOk();
            draw();
            chrome.requestFinish();
          } else {
            wrong += 1;
            dead[b.dataset.fault] = true;
            sfxBad();
            draw();
          }
        });
      }
    });
  }

  function mountFasar(root, job, hooks) {
    var loads = job.data.loads;
    var assign = loads.map(function () { return null; });
    var box = null;
    var extra = null;
    var chrome = null;
    function sums() {
      var s = [0, 0, 0];
      for (var i = 0; i < loads.length; i++) if (assign[i] != null) s[assign[i]] += loads[i].amps;
      return s;
    }
    function placedCount() {
      var n = 0;
      for (var i = 0; i < assign.length; i++) if (assign[i] != null) n++;
      return n;
    }
    function draw() {
      if (!box) return;
      var s = sums();
      var spread = Math.max(s[0], s[1], s[2]) - Math.min(s[0], s[1], s[2]);
      var full = placedCount() === loads.length;
      var html = "";
      for (var i = 0; i < loads.length; i++) {
        html += '<div class="qrow"><div class="qlabel">' + L.esc(loads[i].name) + " " + loads[i].amps + 'A</div><div class="choices c3">';
        for (var p = 0; p < 3; p++) {
          var on = assign[i] === p ? " on" : "";
          html += '<button type="button" class="' + on + '" data-load="' + i + '" data-phase="' + p + '">L' + (p + 1) + "</button>";
        }
        html += "</div></div>";
      }
      box.innerHTML = html;
      if (extra) {
        var bits = "";
        for (var k = 0; k < 3; k++) {
          var cls = "mid";
          if (full && spread <= job.data.bestSpread) cls = "ok";
          else if (s[k] === Math.max(s[0], s[1], s[2]) && spread > 0) cls = "hi";
          else if (s[k] === Math.min(s[0], s[1], s[2]) && spread > 0) cls = "lo";
          bits += '<div class="' + cls + '">L' + (k + 1) + "<b>" + s[k] + "</b></div>";
        }
        extra.innerHTML = '<div class="sums">' + bits + "</div>";
      }
    }
    chrome = mountChrome(root, {
      title: job.name,
      seconds: job.seconds,
      rule: job.data.rule,
      jackpot: job.jackpot,
      grade: function () {
        var amps = loads.map(function (ld) { return ld.amps; });
        return { ratio: L.gradePhase(assign, amps, job.data.bestSpread).ratio, wrong: 0 };
      },
      onHint: function () {
        for (var i = 0; i < job.data.solution.length; i++) {
          if (assign[i] == null) {
            assign[i] = job.data.solution[i];
            draw();
            maybeFinish();
            return;
          }
        }
        for (var j = 0; j < job.data.solution.length; j++) {
          if (assign[j] !== job.data.solution[j]) {
            assign[j] = job.data.solution[j];
            draw();
            maybeFinish();
            return;
          }
        }
      },
      onDone: hooks.onDone,
      paint: function (body, ex) {
        box = body;
        extra = ex;
        draw();
        body.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b || b.dataset.load == null) return;
          assign[Number(b.dataset.load)] = Number(b.dataset.phase);
          sfxTick();
          draw();
          maybeFinish();
        });
      }
    });
    function maybeFinish() {
      if (placedCount() < loads.length) return;
      var s = sums();
      var spread = Math.max(s[0], s[1], s[2]) - Math.min(s[0], s[1], s[2]);
      if (spread <= job.data.bestSpread) {
        sfxOk();
        chrome.requestFinish();
      }
    }
  }

  function mountRoute(root, job, hooks) {
    var route = job.data;
    var path = [{ x: route.start.x, y: route.start.y }];
    var illegal = 0;
    var glow = null;
    var box = null;
    var chrome = null;
    function head() { return path[path.length - 1]; }
    function onPath(x, y) {
      for (var i = 0; i < path.length; i++) if (path[i].x === x && path[i].y === y) return i;
      return -1;
    }
    function draw() {
      if (!box) return;
      var h = head();
      var html = '<div class="route">';
      for (var y = 0; y < route.h; y++) {
        for (var x = 0; x < route.w; x++) {
          var cls = "cell";
          if (route.walls[y][x]) cls += " wall";
          if (x === route.start.x && y === route.start.y) cls += " start";
          if (x === route.goal.x && y === route.goal.y) cls += " goal";
          var idx = onPath(x, y);
          if (idx >= 0) cls += " on";
          if (h.x === x && h.y === y) cls += " head";
          if (glow && glow.x === x && glow.y === y) cls += " glow";
          var label = "";
          if (x === route.start.x && y === route.start.y) label = "Tafla";
          else if (x === route.goal.x && y === route.goal.y) label = "Lampi";
          html += '<button type="button" class="' + cls + '" data-x="' + x + '" data-y="' + y + '">' + label + "</button>";
        }
      }
      html += "</div>";
      box.innerHTML = html;
    }
    chrome = mountChrome(root, {
      title: job.name,
      seconds: job.seconds,
      rule: route.rule,
      jackpot: job.jackpot,
      grade: function () {
        return L.gradeRoute(path, route, illegal);
      },
      onHint: function () {
        var step = L.bfs(head(), route.goal, route.walls, route.w, route.h);
        glow = step && step.length > 1 ? step[1] : null;
        draw();
      },
      onDone: hooks.onDone,
      paint: function (body) {
        box = body;
        draw();
        body.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b || b.dataset.x == null) return;
          var x = Number(b.dataset.x);
          var y = Number(b.dataset.y);
          var h = head();
          if (x === h.x && y === h.y) {
            if (path.length > 1) {
              path.pop();
              glow = null;
              sfxTick();
              draw();
            }
            return;
          }
          var prev = path.length > 1 ? path[path.length - 2] : null;
          if (prev && prev.x === x && prev.y === y) {
            path.pop();
            glow = null;
            sfxTick();
            draw();
            return;
          }
          var dist = Math.abs(x - h.x) + Math.abs(y - h.y);
          if (route.walls[y][x] || dist !== 1 || onPath(x, y) >= 0) {
            illegal += 1;
            sfxBad();
            b.classList.remove("shake");
            void b.offsetWidth;
            b.classList.add("shake");
            return;
          }
          path.push({ x: x, y: y });
          glow = null;
          sfxOk();
          draw();
          if (x === route.goal.x && y === route.goal.y) chrome.requestFinish();
        });
      }
    });
  }

  function mountNod(root, job, hooks) {
    var order = job.data.order;
    var buttons = job.data.buttons;
    var step = 0;
    var wrong = 0;
    var glow = "";
    var box = null;
    var chrome = null;
    function draw() {
      if (!box) return;
      var html = '<div class="choices c2 big">';
      for (var i = 0; i < buttons.length; i++) {
        var b = buttons[i];
        var done = order.indexOf(b.id) < step;
        var cls = (done ? "good " : "") + (glow === b.id ? "glow" : "");
        html += '<button type="button" class="' + cls + '" data-id="' + L.esc(b.id) + '"' +
          (done ? " disabled" : "") + ">" + L.esc(b.label) + "</button>";
      }
      html += "</div>";
      box.innerHTML = html;
    }
    chrome = mountChrome(root, {
      title: job.name,
      seconds: job.seconds,
      rule: job.data.rule,
      jackpot: job.jackpot,
      grade: function () {
        return { ratio: step / order.length, wrong: wrong };
      },
      onHint: function () {
        if (step < order.length) {
          glow = order[step];
          draw();
        }
      },
      onDone: hooks.onDone,
      paint: function (body) {
        box = body;
        draw();
        body.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b || !b.dataset.id || step >= order.length) return;
          if (b.dataset.id === order[step]) {
            step += 1;
            glow = "";
            sfxOk();
            draw();
            if (step >= order.length) chrome.requestFinish();
          } else {
            wrong += 1;
            sfxBad();
            b.classList.remove("shake");
            void b.offsetWidth;
            b.classList.add("shake");
          }
        });
      }
    });
  }

  function mountVirkjun(root, job, hooks) {
    var stages = job.data.stages;
    var stage = 0;
    var wrong = 0;
    var locked0 = {};
    var locked2 = {};
    var wireI = 0;
    var wireOk = 0;
    var glow = "";
    var box = null;
    var extra = null;
    var chrome = null;

    function bag() { return stage === 0 ? locked0 : locked2; }

    function rowsDone(rows, map) {
      for (var i = 0; i < rows.length; i++) if (!map[rows[i].id]) return false;
      return true;
    }

    function draw() {
      if (!box) return;
      var st = stages[stage];
      var html = "";
      if (st.type === "rows") {
        var map = bag();
        for (var r = 0; r < st.rows.length; r++) html += choiceButtons(st.rows[r], !!map[st.rows[r].id]);
      } else {
        var wire = st.wires[Math.min(wireI, st.wires.length - 1)];
        html =
          '<div class="swatch ' + wire.swatch + '"></div>' +
          '<div class="wire-name">' + L.esc(wire.name) + "</div>" +
          '<div class="choices c3 big">' +
          '<button type="button" class="' + (glow === "fasi" ? "glow" : "") + '" data-kind="fasi">Fasi</button>' +
          '<button type="button" class="' + (glow === "null" ? "glow" : "") + '" data-kind="null">Núll</button>' +
          '<button type="button" class="' + (glow === "jord" ? "glow" : "") + '" data-kind="jord">Jörð</button>' +
          "</div>";
      }
      box.innerHTML = html;
      if (extra) extra.innerHTML = '<div class="steps">Skref ' + (stage + 1) + "/3</div>";
    }

    function nextStage() {
      if (stage < stages.length - 1) {
        stage += 1;
        glow = "";
        draw();
      } else chrome.requestFinish();
    }

    chrome = mountChrome(root, {
      title: job.name,
      seconds: job.seconds,
      rule: job.data.rule,
      jackpot: job.jackpot,
      grade: function () {
        var r0 = L.gradeRows(stages[0].rows, locked0).ratio;
        var wires = stages[1].wires;
        var r1 = wires.length ? wireOk / wires.length : 0;
        var r2 = L.gradeRows(stages[2].rows, locked2).ratio;
        return { ratio: (r0 + r1 + r2) / 3, wrong: wrong };
      },
      onHint: function () {
        var st = stages[stage];
        if (st.type === "rows") {
          var map = bag();
          for (var i = 0; i < st.rows.length; i++) {
            if (!map[st.rows[i].id]) {
              map[st.rows[i].id] = true;
              draw();
              if (rowsDone(st.rows, map)) nextStage();
              return;
            }
          }
        } else if (wireI < st.wires.length) {
          glow = st.wires[wireI].kind;
          draw();
        }
      },
      onDone: hooks.onDone,
      paint: function (body, ex) {
        box = body;
        extra = ex;
        draw();
        body.addEventListener("click", function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          var st = stages[stage];
          if (st.type === "rows") {
            if (!b.dataset.opt) return;
            var map = bag();
            var row = null;
            for (var i = 0; i < st.rows.length; i++) if (st.rows[i].id === b.dataset.row) row = st.rows[i];
            if (!row || map[row.id]) return;
            if (b.dataset.opt === String(row.answer)) {
              map[row.id] = true;
              sfxOk();
              draw();
              if (rowsDone(st.rows, map)) nextStage();
            } else {
              wrong += 1;
              sfxBad();
              b.classList.remove("shake");
              void b.offsetWidth;
              b.classList.add("shake");
            }
          } else if (b.dataset.kind && wireI < st.wires.length) {
            if (b.dataset.kind === st.wires[wireI].kind) {
              wireOk += 1;
              sfxOk();
            } else sfxBad();
            glow = "";
            wireI += 1;
            if (wireI >= st.wires.length) nextStage();
            else draw();
          }
        });
      }
    });
  }

  function mount(root, job, hooks) {
    var t = job.type;
    if (t === "heimili" || t === "idnadur" || t === "hledsla" || t === "pumpa") {
      mountRows(root, job, hooks, job.data.rows, job.data.rule);
    } else if (t === "litir") mountLitir(root, job, hooks);
    else if (t === "bilun") mountFault(root, job, hooks);
    else if (t === "fasar") mountFasar(root, job, hooks);
    else if (t === "leidsla") mountRoute(root, job, hooks);
    else if (t === "nod") mountNod(root, job, hooks);
    else if (t === "virkjun") mountVirkjun(root, job, hooks);
    else hooks.onDone({ ratio: 0, wrong: 0, usedHint: false, timeUsed: 0 });
  }

  window.RafPuzzles = { mount: mount, destroy: clearActive };
})();
