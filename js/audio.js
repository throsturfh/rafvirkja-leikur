(function () {
  "use strict";
  var sfx = {
    enabled: true,
    _ctx: null,
    _ready: false,
    setEnabled: function (on) { this.enabled = !!on; },
    unlock: function () {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!this._ctx) this._ctx = new AC();
      if (this._ctx.state === "suspended") this._ctx.resume();
      this._ready = true;
    },
    tone: function (freq, dur, type, gain) {
      if (!this.enabled || !this._ready || !this._ctx) return;
      var c = this._ctx;
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = type || "square";
      o.frequency.value = freq;
      g.gain.setValueAtTime(gain || 0.045, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    },
    seq: function (notes, step) {
      var self = this;
      notes.forEach(function (n, i) {
        setTimeout(function () { self.tone(n[0], n[1], n[2] || "square", n[3] || 0.045); }, i * step);
      });
    },
    buzz: function (ms) {
      if (!this.enabled || !navigator.vibrate) return;
      try { navigator.vibrate(ms); } catch (err) { /* some browsers block vibrate */ }
    },
    tick: function () { this.tone(520, 0.03, "square", 0.03); },
    ok: function () { this.tone(880, 0.05, "square", 0.04); },
    bad: function () { this.tone(140, 0.09, "sawtooth", 0.035); },
    coin: function () {
      this.seq([[660, 0.06], [990, 0.09]], 70);
    },
    win: function () {
      this.seq([[523, 0.08], [659, 0.08], [784, 0.08], [1046, 0.14]], 75);
      this.buzz(18);
    },
    level: function () {
      this.seq([[523, 0.08], [659, 0.08], [784, 0.08], [1046, 0.1], [784, 0.06], [1046, 0.16]], 80);
      this.buzz(30);
    }
  };
  window.RafSfx = sfx;
})();
