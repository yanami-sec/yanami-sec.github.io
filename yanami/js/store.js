/* ══════════ 本地存储封装：所有个人数据只存在浏览器 ══════════ */
window.Store = (() => {
  const KEY = "yanami_diner_v1";
  const def = () => ({
    favs: [],          // 收藏的图片 index
    favQuotes: [],     // 收藏语录 index
    diary: [],         // 便当日记
    letters: [],       // 小纸条
    checkins: {},      // { '2026-09-08': {c:次数, t:时间} }
    cheers: 0,         // 自由干杯次数
    gameBest: 0,       // 小游戏最高分
    theme: "dark",     // 主题
    sfx: true, bgm: false,
    visits: 0, lastVisit: "",
  });
  let data = def();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(def(), JSON.parse(raw));
  } catch (e) { console.warn("读取存档失败，已重置", e); }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };
  const api = {
    get d() { return data; },
    save,
    export() { return JSON.stringify(data, null, 1); },
    import(json) {
      const obj = JSON.parse(json);
      data = Object.assign(def(), obj);
      save();
    },
    reset() { data = def(); save(); },
    today() {
      const t = new Date();
      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    },
  };
  // 访问计数（按天）
  const td = api.today();
  if (data.lastVisit !== td) { data.visits++; data.lastVisit = td; save(); }
  return api;
})();
