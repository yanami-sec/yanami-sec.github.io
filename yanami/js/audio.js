/* ══════════ WebAudio：轻量音效 + 食堂小曲（无需任何外部音频文件） ══════════ */
window.Sound = (() => {
  let ctx = null;
  const ac = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());

  function note(freq, t0, dur, type = "triangle", vol = .16) {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime + t0);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + t0 + .02);
    g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + .05);
  }

  /* 「干杯」叮当 */
  function cheers() {
    note(1318, 0, .18, "sine", .2); note(1760, .06, .3, "sine", .16);
    note(2637, .12, .35, "sine", .08);
  }
  /* 气泡 pop */
  function pop() {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(420, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(880, c.currentTime + .09);
    g.gain.setValueAtTime(.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .12);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + .15);
  }
  /* 成功小滑音 */
  function win() {
    [523, 659, 784, 1047].forEach((f, i) => note(f, i * .09, .22, "triangle", .14));
  }

  /* 食堂小曲：轻松的五声音阶循环（默认关闭，按钮开启） */
  let bgmTimer = null, bgmOn = false;
  const MEL = [
    [0,72],[0.5,76],[1,79],[1.5,76],[2,74],[2.5,72],[3,74],[3.5,76],
    [4,72],[4.5,79],[5,81],[5.5,79],[6,76],[6.5,74],[7,72],[7.5,0],
  ];
  function bgmLoop() {
    if (!bgmOn) return;
    MEL.forEach(([beat, m]) => {
      if (m) note(440 * Math.pow(2, (m - 69) / 12), beat * .42, .38, "triangle", .05);
    });
    [48, 55].forEach((m, i) => note(440 * Math.pow(2, (m - 69) / 12), (i * 4) * .42, 1.6, "sine", .04));
    bgmTimer = setTimeout(bgmLoop, 8 * .42 * 1000);
  }
  function toggleBgm(force) {
    bgmOn = force !== undefined ? force : !bgmOn;
    clearTimeout(bgmTimer);
    if (bgmOn) { ac().resume && ac().resume(); bgmLoop(); }
    return bgmOn;
  }

  return {
    cheers, pop, win,
    toggleBgm,
    guard(fn) { return (...a) => { if (Store.d.sfx) try { fn(...a); } catch (e) {} }; },
  };
})();
