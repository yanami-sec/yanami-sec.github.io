/* ══════════ 主控：主题/导航/雷达图/特效/快捷键/彩蛋 ══════════ */
window.Main = (() => {
  const DATA = window.DATA, Store = window.Store;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const seedRand = seed => { let x = Math.sin(seed) * 10000; return x - Math.floor(x); };

  /* ---------- Toast ---------- */
  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2600);
  }

  /* ---------- 特效层 ---------- */
  const FX = {
    float(ch, pos) {
      const el = document.createElement("span");
      el.className = "fx-float"; el.textContent = ch;
      el.style.left = (pos.x - 10) + "px"; el.style.top = (pos.y - 14) + "px";
      $("#fxLayer").appendChild(el);
      setTimeout(() => el.remove(), 1200);
    },
    burst(ch, n = 10) {
      for (let i = 0; i < n; i++) {
        setTimeout(() => this.float(ch, {
          x: innerWidth / 2 + (Math.random() * 260 - 130),
          y: innerHeight * .55 + (Math.random() * 120 - 60),
        }), i * 70);
      }
    },
    rain(ch, n = 26) {
      for (let i = 0; i < n; i++) {
        const el = document.createElement("span");
        el.className = "fx-otter"; el.textContent = ch;
        el.style.left = Math.random() * 100 + "vw";
        el.style.animationDuration = (2.4 + Math.random() * 2.2) + "s";
        el.style.animationDelay = (Math.random() * 1.6) + "s";
        $("#fxLayer").appendChild(el);
        setTimeout(() => el.remove(), 6500);
      }
    },
    center(el) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
  };
  window.FX = FX;

  /* ---------- 主题 ---------- */
  function applyTheme(t) {
    document.body.dataset.theme = t;
    $("#themeIcon").textContent = t === "dark" ? "☀️" : "🌙";
    Store.d.theme = t; Store.save();
    drawRadar(); // 重绘适配新配色
  }
  function toggleTheme() {
    applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
    window.Sound.guard(window.Sound.pop)();
  }

  /* ---------- 雷达图 ---------- */
  const radarData = [
    ["大胃王", 97], ["元气", 88], ["嘴硬", 93], ["治愈", 82], ["败犬力", 99], ["干杯力", 91],
  ];
  let radarAnim = 0;
  function drawRadar(prog = radarAnim) {
    const cv = $("#radar"); if (!cv) return;
    const dpr = devicePixelRatio || 1, W = cv.clientWidth || 360, H = W * .92;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.height = "auto";
    const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    const css = getComputedStyle(document.body);
    const ink = css.getPropertyValue("--ink2").trim(), blue = css.getPropertyValue("--blue").trim();
    const line = css.getPropertyValue("--line").trim();
    const cx = W / 2, cy = H / 2 + 4, R = Math.min(W, H) / 2 - 34;
    const n = radarData.length;
    const pt = (i, r) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    };
    ctx.clearRect(0, 0, W, H);
    // 网格
    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const [x, y] = pt(i % n, R * ring / 4);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
    }
    for (let i = 0; i < n; i++) {
      const [x, y] = pt(i, R);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y);
      ctx.strokeStyle = line; ctx.stroke();
      const [lx, ly] = pt(i, R + 20);
      ctx.fillStyle = ink; ctx.font = "12px " + css.getPropertyValue("--f-body");
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(radarData[i][0], lx, ly);
    }
    // 数据面
    ctx.beginPath();
    radarData.forEach(([_, v], i) => {
      const [x, y] = pt(i, R * (v / 100) * prog);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = blue + "44"; ctx.fill();
    ctx.strokeStyle = blue; ctx.lineWidth = 2; ctx.stroke();
    radarData.forEach(([_, v], i) => {
      const [x, y] = pt(i, R * (v / 100) * prog);
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7);
      ctx.fillStyle = blue; ctx.fill();
    });
  }
  function animateRadar() {
    const start = performance.now();
    const step = t => {
      radarAnim = Math.min(1, (t - start) / 900);
      drawRadar(1 - Math.pow(1 - radarAnim, 3));
      if (radarAnim < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- 统计 ---------- */
  function refreshStats() {
    $("#statImgs").textContent = Gallery.G.length + Gallery.S.length;
    $("#statFavs").textContent = Store.d.favs.length;
    $("#statDays").textContent = Object.keys(Store.d.checkins).length;
    $("#statCheers").textContent = Store.d.cheers;
  }

  /* ---------- 导航 / 滚动 ---------- */
  const SECTIONS = ["hero", "profile", "quotes", "gallery", "stickers", "diary", "letters", "checkin", "game", "about"];
  function spyScroll() {
    const bar = $("#topbar");
    bar.classList.toggle("scrolled", scrollY > 30);
    $("#toTop").classList.toggle("show", scrollY > 700);
    let cur = SECTIONS[0];
    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= innerHeight * .42) cur = id;
    }
    $$("#mainNav a").forEach(a => a.classList.toggle("on", a.hash === "#" + cur));
  }

  /* ---------- 快捷键 & 彩蛋 ---------- */
  const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let kIdx = 0;
  function keys(e) {
    // Konami
    kIdx = (e.key === KONAMI[kIdx]) ? kIdx + 1 : (e.key === KONAMI[0] ? 1 : 0);
    if (kIdx === KONAMI.length) {
      kIdx = 0;
      FX.rain("🦦", 30); FX.burst("🍚", 12);
      toast("暴食海獭模式启动！！🦦🍚");
      window.Sound.guard(window.Sound.win)();
    }
    if (e.target.matches("input,textarea")) return;
    if (!$("#lightbox").hidden) {
      if (e.key === "Escape") Gallery.closeLB();
      if (e.key === "ArrowLeft") $(".lb-prev").click();
      if (e.key === "ArrowRight") $(".lb-next").click();
      return;
    }
    if (e.key === "Escape") { $("#mainNav").classList.remove("open"); return; }
    if (/^[1-9]$/.test(e.key)) {
      const id = SECTIONS[+e.key]; // 1→profile ... 9→about
      id && document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    if (e.key === "t" || e.key === "T") toggleTheme();
    if (e.key === "r" || e.key === "R") { Gallery.randomOne(); }
  }

  /* ---------- 启动 ---------- */
  function boot() {
    // 主题恢复
    applyTheme(Store.d.theme === "light" ? "light" : "dark");
    // 访问信息
    $("#visitInfo").textContent = `这是你第 ${Store.d.visits} 次来食堂蹭饭`;
    // 每日一句（按日期固定）
    const n = new Date();
    const q = DATA.quotes[Math.floor(seedRand(n.getFullYear() * 366 + (n.getMonth() * 31 + n.getDate())) * DATA.quotes.length)];
    $("#dailyQuote").textContent = "今日一句：「" + q.t + "」";
    // 跑马灯
    const mk = DATA.marquee.map(t => `<span>${t}</span>`).join("");
    $("#marqueeTrack").innerHTML = mk + mk;
    // 音效开关状态
    $("#sfxBtn").classList.toggle("off", !Store.d.sfx);
    $("#sfxBtn").textContent = Store.d.sfx ? "🔊" : "🔇";
    $("#bgmBtn").classList.toggle("off", !Store.d.bgm);
    $("#sfxBtn").onclick = () => {
      Store.d.sfx = !Store.d.sfx; Store.save();
      $("#sfxBtn").textContent = Store.d.sfx ? "🔊" : "🔇";
      $("#sfxBtn").classList.toggle("off", !Store.d.sfx);
    };
    $("#bgmBtn").onclick = () => {
      const on = Sound.toggleBgm();
      Store.d.bgm = on; Store.save();
      $("#bgmBtn").classList.toggle("off", !on);
      toast(on ? "食堂BGM 开始营业 🎵" : "BGM 暂停营业");
    };
    $("#themeBtn").onclick = toggleTheme;
    $("#menuBtn").onclick = () => $("#mainNav").classList.toggle("open");
    $$("#mainNav a").forEach(a => a.addEventListener("click", () => $("#mainNav").classList.remove("open")));
    $("#toTop").onclick = () => scrollTo({ top: 0, behavior: "smooth" });

    Gallery.init();
    Features.init();
    refreshStats();

    // 进场动画观察器
    $$("section:not(#hero) .sec-head, section:not(#hero) .card:not(.diary-item), .polaroid, .profile-info, .gal-acts, .quotes-acts, .diary-editor, .letter-input, .letter-replies")
      .forEach(el => el.classList.add("rv"));
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        if (en.target.classList.contains("profile-radar")) animateRadar();
        io.unobserve(en.target);
      }
    }), { threshold: .18 });
    $$(".rv").forEach(el => io.observe(el));
    // 雷达图容器
    $(".profile-radar")?.classList.add("rv");

    // 滚动
    addEventListener("scroll", spyScroll, { passive: true });
    spyScroll();

    // 键盘
    addEventListener("keydown", keys);

    // 点击小心心
    addEventListener("pointerdown", e => {
      if (e.target.closest("button,a")) return;
      FX.float(Math.random() > .5 ? "🐾" : "✨", { x: e.clientX, y: e.clientY });
    });

    // 加载画面
    const tips = DATA.splash;
    let ti = 0;
    const tipTimer = setInterval(() => {
      ti = (ti + 1) % tips.length;
      $("#splashText").textContent = tips[ti];
    }, 420);
    let prog = 0;
    const barTimer = setInterval(() => {
      prog = Math.min(100, prog + 8 + Math.random() * 14);
      $("#splash .splash-bar i").style.width = prog + "%";
      if (prog >= 100) {
        clearInterval(barTimer); clearInterval(tipTimer);
        setTimeout(() => {
          $("#splash").classList.add("done");
          $("#splash").addEventListener("transitionend", () => $("#splash").remove(), { once: true });
          FX.float("🍻", { x: innerWidth / 2, y: innerHeight * .7 });
        }, 250);
      }
    }, 130);
  }

  document.readyState === "loading"
    ? addEventListener("DOMContentLoaded", boot)
    : boot();

  return { toast, refreshStats };
})();
