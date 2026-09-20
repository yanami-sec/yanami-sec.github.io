/* ══════════ 互动功能：语录/日记/纸条/打卡/运势/游戏/数据管理 ══════════ */
window.Features = (() => {
  const DATA = window.DATA, Store = window.Store;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const seedRand = seed => { let x = Math.sin(seed) * 10000; return x - Math.floor(x); };
  const today = () => Store.today();

  /* ---------- 语录墙 ---------- */
  function renderQuotes() {
    const wall = $("#quoteWall");
    const favQ = Store.d.favQuotes;
    wall.innerHTML = "";
    DATA.quotes.forEach((q, i) => {
      const d = document.createElement("div");
      d.className = "quote-card rv";
      d.innerHTML = `<p class="quote-txt">「${q.t}」</p>
        <div class="quote-meta"><span class="quote-tag">— ${q.tag}</span>
        <button class="fav-btn ${favQ.includes(i) ? "on" : ""}">${favQ.includes(i) ? "♥" : "♡"}</button></div>`;
      d.querySelector(".fav-btn").onclick = e => {
        const btn = e.target, k = favQ.indexOf(i);
        if (k >= 0) { favQ.splice(k, 1); btn.textContent = "♡"; btn.classList.remove("on"); }
        else { favQ.push(i); btn.textContent = "♥"; btn.classList.add("on");
          window.FX.float("♥", window.FX.center(btn)); window.Sound.guard(window.Sound.pop)(); }
        btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
        Store.save();
      };
      wall.appendChild(d);
    });
  }

  /* ---------- 便当日记 ---------- */
  let mood = "🍱";
  function renderDiary() {
    const list = $("#diaryList");
    list.innerHTML = "";
    const items = [...Store.d.diary].sort((a, b) => b.t - a.t);
    $("#diaryCount").textContent = items.length ? `已收好 ${items.length} 份便当` : "";
    items.forEach(it => {
      const d = document.createElement("div");
      d.className = "diary-item card";
      d.innerHTML = `<div class="d-head"><span class="d-mood">${it.m}</span>
        <span class="d-title">${esc(it.title || "无题便当")}</span>
        <span class="d-date">${it.date}</span></div>
        <p class="d-body">${esc(it.text)}</p>
        <div class="d-ops"><button class="edit">✎ 编辑</button><button class="del">🗑 删除</button></div>`;
      d.querySelector(".del").onclick = () => {
        if (!confirm("这盒便当要倒掉吗？（不可恢复）")) return;
        Store.d.diary = Store.d.diary.filter(x => x.id !== it.id);
        Store.save(); renderDiary(); toast("便当已处理 🗑");
      };
      d.querySelector(".edit").onclick = () => {
        $("#diaryTitle").value = it.title; $("#diaryText").value = it.text; mood = it.m;
        $$("#moodPick button").forEach(b => b.classList.toggle("on", b.dataset.mood === mood));
        Store.d.diary = Store.d.diary.filter(x => x.id !== it.id);
        Store.save(); renderDiary();
        $("#diaryTitle").focus();
      };
      list.appendChild(d);
    });
  }
  function saveDiary() {
    const text = $("#diaryText").value.trim();
    if (!text) return toast("便当是空的，写点东西再装盒呀 🍱");
    Store.d.diary.push({ id: Date.now(), t: Date.now(), date: today(),
      title: $("#diaryTitle").value.trim(), text, m: mood });
    Store.save();
    $("#diaryTitle").value = ""; $("#diaryText").value = "";
    renderDiary(); toast("便当已收进盒里 🍱");
    window.Sound.guard(window.Sound.pop)();
    window.FX.float("🍱", { x: innerWidth / 2, y: innerHeight / 2 });
  }

  /* ---------- 传话小纸条 ---------- */
  const NOTE_COLORS = ["#ffe9a8", "#ffd1dc", "#c9e7ff", "#d7ffd9", "#e8d9ff", "#ffe0c2"];
  function renderLetters() {
    const wall = $("#letterWall");
    wall.innerHTML = "";
    [...Store.d.letters].sort((a, b) => b.t - a.t).forEach(it => {
      const d = document.createElement("div");
      d.className = "letter-note";
      d.style.background = it.bg;
      d.style.transform = `rotate(${(it.r || 0).toFixed(1)}deg)`;
      d.innerHTML = `${esc(it.text)}<span class="l-date">${it.date}</span><button class="l-del" title="撕掉">✕</button>`;
      d.querySelector(".l-del").onclick = () => {
        Store.d.letters = Store.d.letters.filter(x => x.id !== it.id);
        Store.save(); renderLetters(); toast("纸条已撕掉");
      };
      wall.appendChild(d);
    });
  }
  function sendLetter() {
    const text = $("#letterText").value.trim();
    if (!text) return toast("先写点想对她说的话嘛～");
    const bg = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    Store.d.letters.push({ id: Date.now(), t: Date.now(), date: today(),
      text, bg, r: (Math.random() * 4 - 2) });
    Store.save();
    $("#letterText").value = "";
    renderLetters();
    window.Sound.guard(window.Sound.cheers)();
    // 她的回信（延迟出现更有感觉）
    setTimeout(() => {
      const box = $("#letterReplies");
      const rep = document.createElement("div");
      rep.className = "letter-reply";
      rep.innerHTML = `<b>八奈見杏菜 回信道：</b>${DATA.replies[Math.floor(Math.random() * DATA.replies.length)]}`;
      box.prepend(rep);
      while (box.children.length > 3) box.lastChild.remove();
    }, 900);
    window.FX.float("💌", { x: innerWidth / 2, y: innerHeight / 2 });
  }

  /* ---------- 打卡 + 热度图 ---------- */
  function renderCheckin() {
    const d = Store.d.checkins, td = today();
    const done = !!d[td];
    $("#checkinBtnTxt").textContent = done ? "今日已打卡 ✓" : "今日打卡";
    $("#checkinBtn").classList.toggle("done", done);
    // 连续天数
    let streak = 0;
    const dt = new Date();
    if (!done) dt.setDate(dt.getDate() - 1); // 今天没打，从昨天起算
    for (;;) {
      const key = fmt(dt);
      if (d[key]) { streak++; dt.setDate(dt.getDate() - 1); } else break;
    }
    $("#ciStreak").textContent = streak;
    $("#ciTotal").textContent = Object.keys(d).length;
    // 本月出勤率
    const now = new Date(), ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const days = Object.keys(d).filter(k => k.startsWith(ym)).length;
    $("#ciPercent").textContent = Math.round(days / now.getDate() * 100) + "%";
    $("#checkinTip").textContent = done ? "（想再打一次的话，右边自由干杯区欢迎你）" : "";
    renderHeatmap();
  }
  const fmt = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  function renderHeatmap() {
    const hm = $("#heatmap");
    hm.innerHTML = "";
    const d = Store.d.checkins;
    const end = new Date();
    const start = new Date(); start.setDate(end.getDate() - 7 * 15 + 1);
    start.setDate(start.getDate() - start.getDay()); // 对齐到周日
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const key = fmt(dt);
      const i = document.createElement("i");
      if (dt > end) { /* noop */ }
      const c = (d[key] || {}).c || 0;
      i.className = c >= 3 ? "h3" : c === 2 ? "h2" : c === 1 ? "h1" : "";
      i.title = `${key}${c ? ` · 打卡 ${c} 次` : ""}`;
      hm.appendChild(i);
    }
  }
  function checkin() {
    const td = today();
    if (Store.d.checkins[td]) { toast("今天已经打过卡啦，明天再来 🍻"); return; }
    Store.d.checkins[td] = { c: 1, t: Date.now() };
    Store.save(); renderCheckin();
    window.Sound.guard(window.Sound.cheers)();
    window.FX.burst("🍻", 10);
    toast(DATA.checkinTips[Math.floor(Math.random() * DATA.checkinTips.length)]);
    window.Main && window.Main.refreshStats();
  }

  /* ---------- 自由干杯 ---------- */
  function cheer() {
    Store.d.cheers++;
    Store.save();
    $("#cheerCount").textContent = Store.d.cheers;
    window.Sound.guard(window.Sound.cheers)();
    window.FX.float("🍻", { x: innerWidth / 2 + (Math.random() * 160 - 80), y: innerHeight * .55 });
    window.Main && window.Main.refreshStats();
  }

  /* ---------- 每日运势（按日期固定） ---------- */
  function renderFortune() {
    const n = new Date();
    const seed = n.getFullYear() * 10000 + (n.getMonth() + 1) * 100 + n.getDate();
    const f = DATA.fortunes[Math.floor(seedRand(seed) * DATA.fortunes.length)];
    $("#fortuneResult").textContent = f.r;
    $("#fortuneSub").textContent = f.s;
    $("#fortuneDate").textContent = `${n.getMonth() + 1}月${n.getDate()}日`;
    $("#heroMood").textContent = ["元气满满", "想吃炒饭", "微微饿", "干饭之魂燃烧", "想被请客"][seed % 5];
  }

  /* ---------- 大胃王小游戏 ---------- */
  let gTimer = null, gSpawn = null, gLeft = 10, gScore = 0;
  function gameStart() {
    clearInterval(gTimer); clearInterval(gSpawn);
    gLeft = 10.0; gScore = 0;
    $("#gTime").textContent = "10.0"; $("#gScore").textContent = "0";
    $("#gameStart").hidden = true; $("#gameHint").hidden = true;
    $("#gameStage").style.display = "block";
    gTimer = setInterval(() => {
      gLeft -= .1;
      $("#gTime").textContent = Math.max(0, gLeft).toFixed(1);
      if (gLeft <= 0) gameEnd();
    }, 100);
    gSpawn = setInterval(spawnRice, 340);
    spawnRice(); spawnRice(); spawnRice();
  }
  function spawnRice() {
    if (gLeft <= 0) return;
    const stage = $("#gameStage"), rect = stage.getBoundingClientRect();
    const b = document.createElement("button");
    b.className = "rice"; b.textContent = "🍚";
    b.style.left = 20 + Math.random() * (rect.width - 70) + "px";
    b.style.top = 14 + Math.random() * (rect.height - 80) + "px";
    b.onclick = e => {
      e.stopPropagation();
      if (b.classList.contains("eaten")) return;
      b.classList.add("eaten");
      gScore++; $("#gScore").textContent = gScore;
      window.Sound.guard(window.Sound.pop)();
      setTimeout(() => b.remove(), 280);
      spawnRice();
    };
    stage.appendChild(b);
    setTimeout(() => b.remove(), 1800); // 没吃到的会凉
  }
  function gameEnd() {
    clearInterval(gTimer); clearInterval(gSpawn);
    $("#gameStage").querySelectorAll(".rice").forEach(r => r.remove());
    $("#gameStart").hidden = false; $("#gameHint").hidden = false;
    $("#gameHint").textContent = `本局炫了 ${gScore} 碗！再来一次？`;
    const best = Store.d.gameBest;
    if (gScore > best) {
      Store.d.gameBest = gScore; Store.save();
      $("#gameHint").textContent = `新纪录！${gScore} 碗 🎉（上一纪录 ${best}）`;
      window.Sound.guard(window.Sound.win)();
      window.FX.burst("🍙", 14);
    }
    $("#gBest").textContent = Store.d.gameBest;
    const rank = DATA.gameRanks.filter(r => gScore >= r[0]).pop();
    $("#gameRank").textContent = rank ? rank[1] : "";
  }

  /* ---------- 生日倒计时 ---------- */
  function renderBirthday() {
    const now = new Date();
    let bd = new Date(now.getFullYear(), 10, 29); // 11月29日
    if (bd < now) bd = new Date(now.getFullYear() + 1, 10, 29);
    const days = Math.ceil((bd - now) / 86400000);
    $("#bdDays").textContent = days + " 天";
    $("#bdBtn").onclick = () => toast(`距离八奈见的生日（11.29）还有 ${days} 天，记得来打卡祝她生日快乐 🎂`);
  }

  /* ---------- 数据管理 ---------- */
  function toast(msg) { window.Main.toast(msg); }
  function esc(s) { return String(s).replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c])); }
  function bind() {
    $("#quoteShuffle").onclick = () => {
      const wall = $("#quoteWall");
      [...wall.children].sort(() => Math.random() - .5).forEach(el => wall.appendChild(el));
      window.Sound.guard(window.Sound.pop)();
    };
    $("#moodPick").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      $("#moodPick .on").classList.remove("on"); b.classList.add("on");
      mood = b.dataset.mood;
    });
    $("#diarySave").onclick = saveDiary;
    $("#diaryText").addEventListener("keydown", e => { if (e.key === "Enter" && e.ctrlKey) saveDiary(); });
    $("#letterSend").onclick = sendLetter;
    $("#letterText").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendLetter(); } });
    $("#checkinBtn").onclick = checkin;
    $("#cheerBtn").onclick = cheer;
    $("#gameStart").onclick = gameStart;
    $("#exportBtn").onclick = () => {
      const blob = new Blob([Store.export()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `yanami_diner_backup_${today()}.json`;
      a.click(); URL.revokeObjectURL(a.href);
      toast("备份已导出 ⬇");
    };
    $("#importBtn").onclick = () => $("#importFile").click();
    $("#importFile").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          Store.import(r.result);
          location.reload();
        } catch (err) { toast("导入失败：文件格式不对"); }
      };
      r.readAsText(f);
    };
    $("#resetBtn").onclick = () => {
      if (confirm("确定清空全部个人数据吗？（日记、纸条、收藏、打卡…）此操作不可恢复！") &&
          confirm("真的要清空吗？最后确认一次！")) {
        Store.reset(); location.reload();
      }
    };
  }

  function init() {
    renderQuotes(); renderDiary(); renderLetters();
    renderCheckin(); renderFortune(); renderBirthday(); bind();
    $("#cheerCount").textContent = Store.d.cheers;
    $("#gBest").textContent = Store.d.gameBest;
  }

  return { init };
})();
