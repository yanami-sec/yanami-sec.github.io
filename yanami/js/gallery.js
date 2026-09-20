/* ══════════ 图库 / 灯箱 / 收藏 / 表情包 ══════════ */
window.Gallery = (() => {
  const DATA = window.DATA, Store = window.Store;
  const RAW = (window.GALLERY_DATA || { gallery: [], stickers: [], hero: [] });
  const G = RAW.gallery, S = RAW.stickers, H = RAW.hero;

  const $ = s => document.querySelector(s);
  const wall = $("#galWall"), empty = $("#galEmpty");
  let filter = "all", list = [], lbList = [], lbIdx = 0;

  /* ---- 分类 ---- */
  const has = (it, keys) => (it.tags || "").split(" ").some(t => keys.includes(t));
  function cats(it) {
    const c = [];
    if (it.c) return it.c;
    if (has(it, DATA.galKeys.official)) c.push("official");
    if (has(it, DATA.galKeys.food)) c.push("food");
    if (has(it, DATA.galKeys.cute)) c.push("cute");
    if (!c.length) c.push("fanart");
    return c;
  }

  /* ---- 渲染 ---- */
  function match(it) {
    if (filter === "all") return true;
    if (filter === "fav") return Store.d.favs.includes(it.file);
    return cats(it).includes(filter);
  }
  function render() {
    list = G.filter(match);
    empty.hidden = list.length > 0;
    wall.innerHTML = "";
    const frag = document.createDocumentFragment();
    list.forEach(it => {
      const d = document.createElement("div");
      d.className = "gal-item rv";
      const fav = Store.d.favs.includes(it.file);
      d.innerHTML = `<button class="g-fav ${fav ? "on" : ""}" title="收藏">${fav ? "♥" : "♡"}</button>
        <img loading="lazy" src="${it.file}" style="aspect-ratio:${it.w}/${it.h}" alt="八奈見杏菜插画">`;
      d.querySelector("img").onerror = () => d.remove();
      d.querySelector(".g-fav").onclick = e => { e.stopPropagation(); toggleFav(it, e.target); };
      d.onclick = () => openLB(list.indexOf(it), list);
      frag.appendChild(d);
    });
    wall.appendChild(frag);
    requestAnimationFrame(() => wall.querySelectorAll(".rv").forEach(el => el.classList.add("in")));
    $("#galleryCount").textContent = G.length;
    return list;
  }

  function toggleFav(it, btn) {
    const favs = Store.d.favs;
    const i = favs.indexOf(it.file);
    if (i >= 0) { favs.splice(i, 1); btn.textContent = "♡"; btn.classList.remove("on"); }
    else { favs.push(it.file); btn.textContent = "♥"; btn.classList.add("on");
      window.FX.float("♥", window.FX.center(btn)); window.Sound.guard(window.Sound.pop)(); }
    Store.save();
    window.Main && window.Main.refreshStats();
    if (filter === "fav" && i >= 0) setTimeout(render, 350);
  }

  /* ---- 灯箱 ---- */
  function openLB(idx, from) {
    lbList = from || list; lbIdx = Math.max(0, Math.min(idx, lbList.length - 1));
    if (!lbList.length) return;
    showLB();
    $("#lightbox").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function showLB() {
    const it = lbList[lbIdx];
    const img = $("#lbImg");
    img.style.opacity = 0;
    img.src = it.file;
    img.onload = () => (img.style.opacity = 1);
    $("#lbInfo").textContent = `#${lbIdx + 1} / ${lbList.length} · ${it.w}×${it.h}`;
    const fav = Store.d.favs.includes(it.file);
    $("#lbFav").textContent = fav ? "♥ 已收藏" : "♡ 收藏";
    $("#lbFav").classList.toggle("on", fav);
    $("#lbDownload").onclick = () => {
      const a = document.createElement("a");
      a.href = it.file; a.download = `yanami_anna_${lbIdx}.jpg`; a.click();
    };
    const src = $("#lbSource");
    if (it.src) { src.href = it.src; src.style.display = ""; } else src.style.display = "none";
  }
  function closeLB() {
    $("#lightbox").hidden = true;
    document.body.style.overflow = "";
  }
  function lbNav(d) { if (!$("#lightbox").hidden) { lbIdx = (lbIdx + d + lbList.length) % lbList.length; showLB(); } }

  $("#lightbox").addEventListener("click", e => { if (e.target.id === "lightbox") closeLB(); });
  $(".lb-close").onclick = closeLB;
  $(".lb-prev").onclick = () => lbNav(-1);
  $(".lb-next").onclick = () => lbNav(1);
  $("#lbFav").onclick = e => {
    const it = lbList[lbIdx];
    toggleFav(it, e.target);
    setTimeout(showLB, 60);
  };

  /* ---- 表情包 ---- */
  function renderStickers() {
    const grid = $("#stickerGrid");
    if (!S.length) { $("#stickerEmpty").hidden = false; return; }
    S.forEach(it => {
      const d = document.createElement("div");
      d.className = "sticker";
      d.innerHTML = `<img loading="lazy" src="${it.file}" style="aspect-ratio:${it.w}/${it.h}" alt="八奈见表情包">
        <span class="s-dl">⬇ 保存</span>`;
      d.querySelector("img").onerror = () => d.remove();
      d.onclick = () => { openLB(S.indexOf(it), S); };
      d.querySelector(".s-dl").onclick = e => {
        e.stopPropagation();
        const a = document.createElement("a"); a.href = it.file;
        a.download = `yanami_sticker_${S.indexOf(it)}.jpg`; a.click();
      };
      grid.appendChild(d);
    });
  }

  /* ---- 随机/打乱 ---- */
  function shuffleWall() {
    for (let i = G.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [G[i], G[j]] = [G[j], G[i]];
    }
    render();
  }
  function randomOne() {
    const pool = list.length ? list : G;
    openLB(Math.floor(Math.random() * pool.length), pool);
  }

  /* ---- 首页立绘 / 头图 ---- */
  function pickHero() {
    const hero = $("#heroBg");
    const pool = (H.length ? H : G).filter(it => it.h >= it.w).slice(0, 6);
    const use = pool.length ? pool : G.slice(0, 4);
    use.forEach((it, i) => {
      const img = document.createElement("img");
      img.src = it.file; img.alt = ""; img.loading = i ? "lazy" : "eager";
      if (i === 0) img.classList.add("show");
      hero.appendChild(img);
    });
    if (use.length > 1) {
      let cur = 0;
      setInterval(() => {
        const imgs = hero.querySelectorAll("img");
        imgs[cur].classList.remove("show");
        cur = (cur + 1) % imgs.length;
        imgs[cur].classList.add("show");
      }, 6500);
    }
    // 档案页拍立得：选一张竖图
    const cand = (H.length ? H : G).find(it => it.h > it.w * 1.05) || G[0] || S[0];
    if (cand) $("#profileImg").src = cand.file;
  }

  function init() {
    $("#galleryCount").textContent = G.length;
    $("#galTabs").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      $("#galTabs .on").classList.remove("on");
      b.classList.add("on");
      filter = b.dataset.f;
      window.Sound.guard(window.Sound.pop)();
      render();
    });
    $("#galShuffle").onclick = randomOne;
    $("#galShuffleWall").onclick = shuffleWall;
    render();
    renderStickers();
    pickHero();
  }

  return { init, randomOne, openLB, closeLB, G, S, H, render };
})();
