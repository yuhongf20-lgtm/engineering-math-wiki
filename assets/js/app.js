"use strict";

const state = { manifest: null, error: false };
const search = document.querySelector("#search");
const notes = document.querySelector("#notes");
const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");

function closeMenu() {
  navigation.classList.remove("is-open");
  menu.setAttribute("aria-expanded", "false");
  menu.textContent = "開啟分類導覽";
}

menu.addEventListener("click", () => {
  const open = navigation.classList.toggle("is-open");
  menu.setAttribute("aria-expanded", String(open));
  menu.textContent = open ? "收合分類導覽" : "開啟分類導覽";
});
navigation.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    menu.focus();
  }
});
document.querySelectorAll("nav a, .brand").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

function validateManifest(data) {
  if (!data || !Array.isArray(data.categories) || !Array.isArray(data.packs)) {
    throw new Error("索引必須包含 categories 與 packs 陣列。");
  }
  const ids = new Set();
  for (const category of data.categories) {
    if (!category || typeof category.id !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.id) ||
        ids.has(category.id) ||
        typeof category.title_zh !== "string" || !category.title_zh.trim() ||
        typeof category.title_en !== "string" || !category.title_en.trim()) {
      throw new Error("分類欄位不完整或 ID 重複。");
    }
    ids.add(category.id);
  }
  const packIds = new Set();
  for (const pack of data.packs) {
    if (!pack || typeof pack.id !== "string" || !pack.id.trim() ||
        packIds.has(pack.id) || !ids.has(pack.category) || !validPackPath(pack) ||
        typeof pack.path !== "string" || !pack.path.startsWith("./data/packs/") ||
        typeof pack.title_zh !== "string" || typeof pack.title_en !== "string") {
      throw new Error("資料包索引欄位不完整或 ID 重複。");
    }
    packIds.add(pack.id);
  }
}

function renderCards() {
  const container = document.querySelector("#category-cards");
  container.replaceChildren();
  state.manifest.categories.forEach((category, index) => {
    const card = document.createElement("a");
    card.className = "category-card";
    card.href = "#category/" + category.id;
    const number = document.createElement("span");
    number.className = "card-number";
    number.textContent = String(index + 1).padStart(2, "0") + " / CATEGORY";
    const title = document.createElement("h3");
    title.textContent = category.title_en;
    const subtitle = document.createElement("p");
    subtitle.textContent = category.title_zh;
    const footer = document.createElement("div");
    footer.className = "card-footer";
    const count = document.createElement("span");
    count.textContent = state.manifest.packs.filter((pack) => pack.category === category.id).length + " 篇筆記";
    const arrow = document.createElement("span");
    arrow.textContent = "瀏覽分類 →";
    footer.append(count, arrow);
    card.append(number, title, subtitle, footer);
    card.addEventListener("click", closeMenu);
    container.append(card);
  });
}


const detail = document.querySelector("#note-detail");
let renderVersion = 0;
let pendingRequest = null;
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function link(text, href) {
  const node = element("a", text);
  node.href = href;
  return node;
}

function validPackPath(pack) {
  // Only project-relative JSON paths, with no traversal, encoding or URL schemes.
  return idPattern.test(pack.id) && idPattern.test(pack.category) &&
    typeof pack.path === "string" &&
    new RegExp("^\\./data/packs/" + pack.category + "/[a-z0-9]+(?:-[a-z0-9]+)*\\.json$").test(pack.path);
}

function validatePack(pack, entry) {
  if (!pack || typeof pack !== "object" || Array.isArray(pack)) throw new Error("資料包必須是 JSON 物件。");
  const strings = ["id", "category", "type", "title_zh", "title_en", "summary", "concept", "matlab_code", "status"];
  for (const key of strings) {
    if (typeof pack[key] !== "string") throw new Error("必要欄位缺少或格式錯誤：" + key);
  }
  for (const key of ["id", "category", "title_zh", "title_en"]) {
    if (pack[key] !== entry[key]) throw new Error("資料包與索引不一致：" + key);
  }
  if (!["algorithm", "concept"].includes(pack.type) || !["draft", "verified"].includes(pack.status)) {
    throw new Error("type 或 status 不受支援。");
  }
  if (!Object.hasOwn(pack, "calculator_id") || !(pack.calculator_id === null || typeof pack.calculator_id === "string")) {
    throw new Error("calculator_id 缺少或格式錯誤。");
  }
  for (const key of ["prerequisites", "formulas", "conditions", "steps", "matlab_explanation", "advantages", "limitations", "common_mistakes"]) {
    if (!Array.isArray(pack[key]) || !pack[key].every((value) => typeof value === "string")) {
      throw new Error("必要欄位必須為文字陣列：" + key);
    }
  }
  if (!Array.isArray(pack.symbols) || !pack.symbols.every((s) =>
    s && ["symbol", "meaning", "unit"].every((key) => typeof s[key] === "string"))) {
    throw new Error("symbols 必須包含 symbol、meaning 與 unit 文字。");
  }
  const example = pack.example;
  if (!example || typeof example.problem !== "string" || typeof example.answer !== "string" ||
      !["given", "solution_steps"].every((key) => Array.isArray(example[key]) && example[key].every((v) => typeof v === "string"))) {
    throw new Error("example 必要欄位缺少或格式錯誤。");
  }
  if (!Array.isArray(pack.sources) || !pack.sources.every((source) =>
    source && typeof source === "object" && !Array.isArray(source) &&
    ["title", "author", "sections", "note"].every((key) => typeof source[key] === "string") &&
    (source.url === null || typeof source.url === "string"))) {
    throw new Error("sources 必須包含 title、author、url、sections 與 note。");
  }
}

function addText(parent, text, className) {
  if (text.trim()) parent.append(element("p", text, className));
}

function addList(parent, values, ordered = false, className) {
  if (!values.some((text) => text.trim())) return;
  const list = element(ordered ? "ol" : "ul", undefined, className);
  values.filter((text) => text.trim()).forEach((text) => list.append(element("li", text)));
  parent.append(list);
}

function section(title) {
  const node = element("section", undefined, "note-section");
  node.append(element("h3", title));
  detail.append(node);
  return node;
}

function detailShell(entry) {
  detail.replaceChildren();
  const back = element("div", undefined, "note-back");
  back.append(link("← 返回首頁", "#home"));
  if (entry) back.append(link("返回分類", "#category/" + entry.category));
  detail.append(back);
  const title = element("h2", entry ? entry.title_zh + " / " + entry.title_en : "找不到筆記");
  title.id = "detail-title";
  title.tabIndex = -1;
  detail.append(title);
  return title;
}

async function copyCode(code, button, status) {
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(code);
    status.textContent = "已複製 MATLAB 程式碼。";
  } catch {
    status.textContent = "無法自動複製，請選取下方程式碼後手動複製。";
  } finally {
    button.disabled = false;
  }
}

function renderPack(pack, entry) {
  detailShell(entry);
  const category = state.manifest.categories.find((item) => item.id === pack.category);
  detail.append(element("p", category.title_zh + " / " + category.title_en + " · " +
    (pack.type === "algorithm" ? "演算法" : "概念") + " · " +
    (pack.status === "draft" ? "draft · 草稿，尚未完成全面查核" : "verified · 已查核"), "badge note-meta"));
  addText(detail, pack.summary);
  let block = section("基本概念與先備知識");
  addText(block, pack.concept);
  addList(block, pack.prerequisites);
  block = section("公式與符號說明");
  addList(block, pack.formulas, false, "formula-list");
  if (pack.symbols.length) {
    const wrapper = element("div", undefined, "table-scroll");
    wrapper.tabIndex = 0;
    wrapper.setAttribute("role", "region");
    wrapper.setAttribute("aria-label", "符號說明表，可水平捲動");
    const table = element("table");
    const caption = element("caption", "符號、意義與單位");
    const head = element("thead");
    const row = element("tr");
    ["符號", "意義", "單位"].forEach((text) => {
      const th = element("th", text);
      th.scope = "col";
      row.append(th);
    });
    head.append(row);
    const body = element("tbody");
    pack.symbols.forEach((symbol) => {
      const tr = element("tr");
      ["symbol", "meaning", "unit"].forEach((key) => tr.append(element("td", symbol[key])));
      body.append(tr);
    });
    table.append(caption, head, body);
    wrapper.append(table);
    block.append(wrapper);
  }
  block = section("適用條件");
  addList(block, pack.conditions);
  block = section("演算法步驟");
  addList(block, pack.steps, true);
  block = section("完整計算例題");
  addText(block, pack.example.problem);
  block.append(element("h4", "已知條件"));
  addList(block, pack.example.given);
  block.append(element("h4", "逐步計算"));
  addList(block, pack.example.solution_steps, true);
  addText(block, pack.example.answer, "example-answer");
  block = section("MATLAB 程式碼與解說");
  addText(block, "程式碼供 MATLAB 學習與執行；網頁不會執行此程式。", "muted");
  if (pack.matlab_code.trim()) {
    const button = element("button", "複製 MATLAB 程式碼", "copy-button");
    button.type = "button";
    const status = element("p", "", "muted");
    status.setAttribute("role", "status");
    const pre = element("pre");
    pre.tabIndex = 0;
    pre.setAttribute("aria-label", "MATLAB 程式碼，可水平捲動");
    pre.append(element("code", pack.matlab_code));
    button.addEventListener("click", () => {
      button.disabled = true;
      copyCode(pack.matlab_code, button, status);
    });
    block.append(button, status, pre);
  }
  addList(block, pack.matlab_explanation, true);
  block = section("優點、缺點與常見錯誤");
  for (const [title, values] of [["優點", pack.advantages], ["缺點與限制", pack.limitations], ["常見錯誤", pack.common_mistakes]]) {
    block.append(element("h4", title));
    addList(block, values);
  }
  block = section("參考來源與查核狀態");
  addText(block, pack.status === "draft" ? "draft：草稿，尚未完成全面內容與來源查核。" : "verified：已完成內容與來源查核。");
  pack.sources.forEach((source) => {
    const item = element("div", undefined, "source-item");
    addText(item, source.title);
    addText(item, source.author);
    addText(item, source.sections);
    addText(item, source.note);
    if (source.url) {
      let safe = false;
      try { safe = ["https:", "http:"].includes(new URL(source.url).protocol); } catch { /* Render as text. */ }
      item.append(safe ? link(source.url, source.url) : element("p", source.url));
    }
    block.append(item);
  });
  renderCalculator(pack);
  globalThis.MathDisplay?.renderTree(detail);
}

async function renderDetail(entry, version) {
  const title = detailShell(entry);
  title.focus();
  if (!entry) {
    const error = element("p", "此筆記未登記於索引，請返回首頁或分類選擇筆記。", "error");
    error.setAttribute("role", "alert");
    detail.append(error);
    return;
  }
  const loading = element("p", "正在載入筆記…", "muted");
  loading.setAttribute("role", "status");
  detail.append(loading);
  detail.setAttribute("aria-busy", "true");
  pendingRequest = new AbortController();
  try {
    if (!validPackPath(entry)) throw new Error("索引的資料包路徑不安全。");
    const response = await fetch(entry.path, { signal: pendingRequest.signal, redirect: "error" });
    if (!response.ok) throw new Error("HTTP " + response.status + "：資料包不存在或無法取得。");
    let pack;
    try { pack = await response.json(); } catch { throw new Error("資料包不是合法 JSON。"); }
    validatePack(pack, entry);
    if (version !== renderVersion) return;
    renderPack(pack, entry);
    document.querySelector("#detail-title").focus();
  } catch (error) {
    if (version !== renderVersion || error.name === "AbortError") return;
    detailShell(entry);
    const message = element("p", "筆記載入失敗：" + error.message + " 可重新整理重試，或返回分類。", "error");
    message.setAttribute("role", "alert");
    detail.append(message);
  } finally {
    if (version === renderVersion) detail.setAttribute("aria-busy", "false");
  }
}

function render() {
  if (!state.manifest) return;
  const version = ++renderVersion;
  if (pendingRequest) pendingRequest.abort();
  detail.setAttribute("aria-busy", "false");
  const route = location.hash.slice(1) || "home";
  // The skip link targets the main landmark rather than an application route.
  const home = route === "home" || route === "main";
  const isNote = route.startsWith("note/");
  const entry = isNote ? state.manifest.packs.find((item) => route === "note/" + item.id) : null;
  const category = state.manifest.categories.find((item) => route === "category/" + item.id ||
    (entry && entry.category === item.id));
  const validRoute = home || Boolean(category);
  document.querySelector(".hero").hidden = isNote;
  document.querySelector(".search-panel").hidden = isNote;
  notes.closest("section").hidden = isNote;
  document.querySelector("#categories-section").hidden = !home;
  detail.hidden = !isNote;
  document.querySelectorAll("[data-route]").forEach((item) => {
    const active = validRoute && item.dataset.route === (category ? category.id : "home");
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  document.title = (entry ? entry.title_zh + " / " + entry.title_en : category ? category.title_zh : "Engineering Math Wiki") + "｜工程數學模組化筆記庫";
  if (isNote) {
    renderDetail(entry, version);
    return;
  }
  document.querySelector("#notes-title").textContent = category ? category.title_zh + " / " + category.title_en : validRoute ? "所有筆記" : "找不到頁面";
  const query = search.value.trim().toLocaleLowerCase();
  const results = validRoute ? state.manifest.packs.filter((pack) =>
    (!category || pack.category === category.id) &&
    (pack.title_zh + " " + pack.title_en).toLocaleLowerCase().includes(query)
  ) : [];
  document.querySelector("#note-count").textContent = results.length + " 篇筆記";
  notes.replaceChildren();
  notes.setAttribute("aria-busy", "false");
  if (results.length) {
    const list = element("ul", undefined, "note-list");
    results.forEach((pack) => {
      const item = element("li");
      const anchor = link(pack.title_zh + " / " + pack.title_en + " →", "#note/" + pack.id);
      anchor.addEventListener("click", closeMenu);
      item.append(anchor);
      list.append(item);
    });
    notes.append(list);
  } else {
    const text = !validRoute ? "找不到此頁面，請使用分類導覽返回首頁。" :
      query ? "找不到符合「" + search.value.trim() + "」的筆記，請嘗試其他名稱。" :
      category ? "此分類尚無筆記，內容將逐步新增。" : "尚無筆記，內容將逐步新增。";
    notes.append(element("p", text, "empty"));
  }
}

async function loadManifest() {
  try {
    const response = await fetch("./data/manifest.json");
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();
    validateManifest(data);
    state.manifest = data;
    renderCards();
    render();
  } catch (error) {
    state.error = true;
    const alert = document.querySelector("#load-error");
    alert.hidden = false;
    alert.textContent = "載入筆記索引失敗：" + error.message + " 請確認 data/manifest.json 存在且格式正確，並透過 HTTP 伺服器開啟網站後重新整理。";
    notes.setAttribute("aria-busy", "false");
    notes.textContent = "索引無法載入，目前無法顯示筆記或搜尋結果。";
    document.querySelector("#note-count").textContent = "載入失敗";
    search.disabled = true;
  }
}

search.addEventListener("input", render);
window.addEventListener("hashchange", render);
loadManifest();
function renderCalculator(pack) {
  if (["laplace-transform","fourier-transform"].includes(pack.id)) { renderTransformCalculator(pack); return; }
  const api = globalThis.MathCalculators;
  if (["gaussian-elimination","gauss-jordan","gauss-seidel"].includes(pack.id)) {
    renderMatrixCalculator(pack); return;
  }
  const isFalse = pack.id === "false-position" && pack.calculator_id === "false-position";
  const isNewton = pack.id === "newton-raphson" && pack.calculator_id === "newton-raphson";
  if (!isNewton && !isFalse && !(pack.id === "bisection" && pack.calculator_id === "bisection")) return;
  const method = isNewton ? "newtonRaphson" : isFalse ? "falsePosition" : "bisection";
  const choices = api ? (isNewton ? api.newtonFunctions : api.functions) : [];
  const block = section(isNewton ? "牛頓法互動計算" : isFalse ? "假位法互動計算" : "二分法互動計算");
  block.classList.add("calculator");
  if (!api || typeof api[method] !== "function") {
    addText(block, "計算器程式載入失敗，請重新整理。", "error");
    return;
  }
  const explanation = element("p", isNewton ?
    "停止條件為函數殘差 |f(x)| <= tolerance，不是相對近似誤差，也不直接保證根的位置誤差。初始值已達標時為 0 次更新。導數絕對值 <= 1e-12 時停止；此門檻為本教材固定尺度的保護值。牛頓法不保證所有初始值收斂。迭代表顯示更新前 x、f(x)、f'(x) 及 x_next；最終殘差在更新後檢查。浮點計算值為零仍可能有捨入誤差。" :
    "本互動計算器以函數殘差 |f(xr)| <= tolerance 作為停止條件，不是相對近似誤差，也不直接保證根的位置誤差。原教材與 MATLAB 使用區間半寬的位置誤差準則，兩者不同。三個固定函數均為連續實函數。浮點計算值為零仍可能有捨入誤差。");
  if (isFalse) explanation.textContent = "使用 xr = xu - f(xu)*(xl-xu)/(f(xl)-f(xu))，以 |f(xr)| <= tolerance 為函數殘差停止條件，不是位置誤差或相對近似誤差。三個固定函數均連續。保留端點異號區間；端點可能長期停滯，不能套用二分法半寬誤差界。分母保護門檻為 8*Number.EPSILON*max(1,|f(xl)|,|f(xu)|)。";
  explanation.id = "calculator-help";
  block.append(explanation);
  const form = element("form", undefined, "calculator-form");
  form.noValidate = true; // Use one consistent, accessible error display for every invalid input.
  form.setAttribute("aria-describedby", explanation.id);
  const inputs = {};
  const fields = isNewton ? [
    ["functionId", "函數與導數選擇", "select", "quadratic"],
    ["x0", "初始值 x0", "number", "1.5"],
    ["tolerance", "容許誤差 tolerance（函數殘差）", "number", "0.0001"],
    ["maxIterations", "最大迭代次數 maxIterations（1–1000）", "number", "50"]
  ] : [
    ["functionId", "函數選擇", "select", "quadratic"],
    ["xl", "初始下界 xl", "number", "1"],
    ["xu", "初始上界 xu", "number", "2"],
    ["tolerance", "容許誤差 tolerance（函數殘差）", "number", "0.0001"],
    ["maxIterations", "最大迭代次數 maxIterations（1–1000）", "number", "50"]
  ];
  for (const [name, title, type, value] of fields) {
    const wrapper = element("div", undefined, "calculator-field");
    const label = element("label", title);
    label.htmlFor = "calc-" + name;
    const input = element(type === "select" ? "select" : "input");
    input.id = label.htmlFor;
    input.name = name;
    input.required = true;
    if (type === "select") {
      choices.forEach((item) => {
        const option = element("option", isNewton ? item.label + "；" + item.derivativeLabel : item.label);
        option.value = item.id;
        input.append(option);
      });
    } else {
      input.type = "number";
      input.step = name === "maxIterations" ? "1" : "any";
      if (name === "maxIterations") { input.min = "1"; input.max = String(api.MAX_ITERATIONS); }
    }
    input.value = value;
    inputs[name] = input;
    wrapper.append(label, input);
    form.append(wrapper);
  }
  const submit = element("button", "開始計算", "copy-button");
  submit.type = "submit";
  form.append(submit);
  const output = element("div", undefined, "calculator-output");
  const status = element("p", "", "calculator-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  block.append(form, status, output);
  form.addEventListener("input", () => {
    if (output.childNodes.length || status.textContent) {
      output.replaceChildren();
      status.className = "calculator-status";
      status.textContent = "參數已變更，請重新開始計算。";
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    output.replaceChildren();
    status.textContent = "";
    try {
      const parameters = { functionId: inputs.functionId.value };
      for (const name of (isNewton ? ["x0", "tolerance", "maxIterations"] : ["xl", "xu", "tolerance", "maxIterations"])) {
        if (!inputs[name].value.trim()) throw new Error(inputs[name].labels[0].textContent + "：請輸入有限數值，不可留白。");
        parameters[name] = inputs[name].valueAsNumber;
      }
      const result = api[method](parameters);
      status.className = "calculator-status " + (result.converged ? "calculator-success" : "calculator-warning");
      if (isNewton) {
        status.textContent = result.converged ? "已達到停止條件：|f(x)| <= tolerance。" + result.message :
          "尚未收斂至指定條件：" + result.message;
      } else status.textContent = result.converged ?
        (result.reason === "endpoint" ? "已達到停止條件：端點函數計算值為 0，無需迭代。" : "已達到停止條件：|f(xr)| <= tolerance。") :
        result.reason === "precision" ? "尚未收斂至指定條件：已達浮點數精度限制，插值或中點無法再前進。" :
          "尚未收斂至指定條件：已達最大迭代次數。";
      const summary = element("dl", undefined, "calculator-summary");
      for (const [title, value] of [
        ["函數", choices.find((item) => item.id === parameters.functionId).label],
        ["近似根", String(result.xr)], [isNewton ? "f(x)" : "f(xr)", Number.isFinite(result.fr) ? String(result.fr) : "無法取得有限函數值"],
        ["實際迭代次數", String(result.iterations)], ["tolerance", String(parameters.tolerance)],
        ["是否達到停止條件", result.converged ? "是" : "否"]
      ]) {
        summary.append(element("dt", title), element("dd", value));
      }
      output.append(summary);
      if (!result.history.length) {
        addText(output, isNewton ? "本次未完成牛頓更新，沒有迭代紀錄；請參閱上方停止原因。" : "本次直接採用端點根，沒有中點迭代紀錄。");
        return;
      }
      const wrapper = element("div", undefined, "table-scroll");
      wrapper.tabIndex = 0;
      wrapper.setAttribute("role", "region");
      wrapper.setAttribute("aria-label", (isNewton ? "牛頓法" : isFalse ? "假位法" : "二分法") + "逐次迭代表，可水平捲動");
      const table = element("table", undefined, "iteration-table");
      const caption = element("caption", isNewton ? "每列為一次完成的牛頓更新：由 x 計算 x_next；最終結果採最後的 x_next。" : "每列 xl、xu 為本次更新前區間；判斷欄說明下一個區間。");
      const head = element("thead");
      const header = element("tr");
      (isNewton ? ["次數", "x", "f(x)", "f'(x)", "x_next"] : ["次數", "xl", "xu", "xr", "f(xr)", "更新區間的判斷"]).forEach((title) => {
        const cell = element("th", title);
        cell.scope = "col";
        header.append(cell);
      });
      head.append(header);
      const body = element("tbody");
      result.history.forEach((row) => {
        const tr = element("tr");
        for (const value of (isNewton ? [row.iteration, row.x, row.fx, row.dfx, row.xNext] : [row.iteration, row.xl, row.xu, row.xr, row.fr, row.decision])) {
          tr.append(element("td", String(value)));
        }
        body.append(tr);
      });
      table.append(caption, head, body);
      wrapper.append(table);
      output.append(wrapper);
    } catch (error) {
      status.className = "calculator-status error";
      status.textContent = "輸入或計算錯誤：" + error.message;
    }
  });
}

function renderMatrixCalculator(pack) {
  const methods = {
    "gaussian-elimination": ["gaussianElimination", "高斯消去法互動計算"],
    "gauss-jordan": ["gaussJordan", "高斯－喬登互動計算"],
    "gauss-seidel": ["gaussSeidel", "高斯－賽德互動計算"]
  };
  if (!Object.hasOwn(methods,pack.id) || pack.calculator_id!==pack.id) return;
  const [method,title]=methods[pack.id],api=globalThis.MathCalculators;
  const block=section(title);
  block.classList.add("calculator");
  if (!api || typeof api[method]!=="function") { addText(block,"計算器載入失敗，請重新整理。","error"); return; }
  const iterative=method==="gaussSeidel";
  const help=element("p",iterative ?
    "以 norm(b-A*x,inf) <= tolerance 為停止條件，這是各方程絕對殘差的最大值，不是相對近似誤差。已更新分量立即使用。嚴格列對角優勢是收斂充分條件；不符合者仍可能收斂。殘差連續快速增長時會觸發疑似發散保護，並非一般性證明。" :
    "使用部分選主元；每次列運算都包含右側常數。主元過小或無法判定唯一解時不提供唯一答案。顯示原始系統殘差；殘差小不直接保證病態系統的解誤差小。");
  help.id="matrix-help";
  const form=element("form",undefined,"calculator-form matrix-form");
  form.noValidate=true; form.setAttribute("aria-describedby",help.id);
  const sizeLabel=element("label","矩陣大小");
  sizeLabel.htmlFor="matrix-size";
  const size=element("select");size.id="matrix-size";
  [2,3].forEach(n=>{const option=element("option",n+"×"+n);option.value=String(n);size.append(option);});
  const sizeField=element("div",undefined,"calculator-field");sizeField.append(sizeLabel,size);
  const hint=element("p","切換大小會載入該尺寸的示範值；可直接編輯每個數字。","muted full-width");
  const fields=element("fieldset",undefined,"full-width matrix-fields");
  fields.append(element("legend","增廣矩陣 [A | b]"));
  const grid=element("div",undefined,"matrix-grid");
  fields.append(grid);
  const guesses=element("fieldset",undefined,"full-width matrix-fields");
  guesses.append(element("legend","初始猜測 x0"));
  const guessGrid=element("div",undefined,"guess-grid");guesses.append(guessGrid);
  const numbers={};
  const numberField=(labelText,id,value)=>{
    const wrapper=element("div",undefined,"matrix-cell");
    const label=element("label",labelText);label.htmlFor=id;
    const input=element("input");input.type="number";input.step="any";input.id=id;input.required=true;input.value=String(value);
    wrapper.append(label,input);
    return {wrapper,input};
  };
  if(iterative) {
    for(const [name,label,val] of [["tolerance","容許誤差（絕對殘差）",.0001],["maxIterations","最大迭代次數（1–1000）",50]]) {
      const f=numberField(label,"matrix-"+name,val);f.wrapper.classList.add("calculator-field");
      if(name==="maxIterations"){f.input.step="1";f.input.min="1";f.input.max="1000";}
      numbers[name]=f.input;
      form.append(f.wrapper);
    }
  }
  const submit=element("button","開始計算","copy-button");submit.type="submit";
  const status=element("p","","calculator-status");status.setAttribute("role","status");
  const output=element("div",undefined,"calculator-output");
  let matrixInputs=[],bInputs=[],xInputs=[];
  const clear=()=>{output.replaceChildren();status.className="calculator-status";status.textContent="參數已變更，請重新開始計算。";};
  const rebuild=()=>{
    const n=Number(size.value);
    const A=n===2?[[4,1],[1,3]]:iterative?[[4,1,0],[1,4,1],[0,1,3]]:[[0,2,1],[2,1,1],[1,1,3]];
    const b=n===2?[9,7]:iterative?[6,12,11]:[7,7,12];
    grid.replaceChildren();guessGrid.replaceChildren();
    grid.style.gridTemplateColumns="repeat("+(n+1)+", minmax(0,1fr))";
    guessGrid.style.gridTemplateColumns="repeat("+n+", minmax(0,1fr))";
    matrixInputs=[];bInputs=[];xInputs=[];
    for(let i=0;i<n;i++){
      matrixInputs[i]=[];
      for(let j=0;j<n;j++){
        const f=numberField("A"+(i+1)+","+(j+1),"matrix-a-"+i+"-"+j,A[i][j]);
        matrixInputs[i].push(f.input);grid.append(f.wrapper);
      }
      const f=numberField("b"+(i+1),"matrix-b-"+i,b[i]);bInputs.push(f.input);
      f.wrapper.classList.add("constant-cell");grid.append(f.wrapper);
      if(iterative){const g=numberField("x"+(i+1)+" 初始","matrix-x0-"+i,0);xInputs.push(g.input);guessGrid.append(g.wrapper);}
    }
  };
  size.addEventListener("change",()=>{rebuild();clear();});
  form.prepend(sizeField,hint,fields);
  if(iterative)form.append(guesses);
  form.append(submit);
  block.append(help,form,status,output);
  rebuild();
  form.addEventListener("input",clear);
  const read=(input)=>{
    if(!input.value.trim() || !Number.isFinite(input.valueAsNumber))throw new Error(input.labels[0].textContent+" 必須輸入有限數值，不可留白。");
    return input.valueAsNumber;
  };
  const showSummary=(x,residual)=>{
    const list=element("dl",undefined,"calculator-summary");
    if(x)x.forEach((v,i)=>list.append(element("dt","x"+(i+1)),element("dd",String(v))));
    if(residual){
      list.append(element("dt","殘差 b-A*x"),element("dd","["+residual.vector.join(", ")+"]"));
      list.append(element("dt","殘差無窮範數"),element("dd",String(residual.norm)));
    }
    output.append(list);
  };
  form.addEventListener("submit",(event)=>{
    event.preventDefault();output.replaceChildren();status.className="calculator-status";status.textContent="";
    try{
      const params={A:matrixInputs.map(row=>row.map(read)),b:bInputs.map(read)};
      if(iterative){params.x0=xInputs.map(read);params.tolerance=read(numbers.tolerance);params.maxIterations=read(numbers.maxIterations);}
      const result=api[method](params);
      if(iterative){
        status.classList.add(result.converged?"calculator-success":"calculator-warning");
        status.textContent=(result.converged?"已符合停止條件。":"尚未收斂至指定條件。")+result.message;
        addText(output,result.diagonallyDominant?"此矩陣具有嚴格列對角優勢，符合收斂充分條件。":"未具有嚴格列對角優勢；仍可能收斂，不能僅據此斷言發散。","convergence-hint");
        addText(output,"實際迭代次數："+result.iterations+"；是否符合停止條件："+(result.converged?"是":"否"));
        if(result.reason!=="singular"){
          addText(output,result.converged?"最終近似解":"最後有限近似值（尚未達標）");
          showSummary(result.x,result.residual);
        }
        const wrap=element("div",undefined,"table-scroll");wrap.tabIndex=0;
        wrap.setAttribute("role","region");wrap.setAttribute("aria-label","Gauss-Seidel 迭代表，可水平捲動");
        const table=element("table",undefined,"linear-iteration-table");
        const head=element("thead"),tr=element("tr");
        ["次數",...params.b.map((_,i)=>"x"+(i+1)),"殘差無窮範數"].forEach(t=>{const th=element("th",t);th.scope="col";tr.append(th);});
        head.append(tr);
        const body=element("tbody");
        result.history.forEach(row=>{const tr=element("tr");[row.iteration,...row.x,row.residual].forEach(v=>tr.append(element("td",String(v))));body.append(tr);});
        table.append(head,body);wrap.append(table);output.append(wrap);
      }else{
        status.classList.add(result.success?"calculator-success":"calculator-warning");status.textContent=result.message;
        if(result.success)showSummary(result.x,result.residual);
        output.append(element("h4",method==="gaussJordan"?"逐步列運算與化簡":"向前消去過程"));
        const list=element("ol",undefined,"matrix-steps");
        result.steps.forEach(step=>{
          const item=element("li");item.append(element("p",step.description));
          const pre=globalThis.MathDisplay ? MathDisplay.matrix(step.matrix,true) : element("pre",step.matrix.map(row=>row.map(v=>String(v)).join("  ")).join("\n"));
          pre.tabIndex=0;pre.setAttribute("aria-label","本步增廣矩陣，可水平捲動");
          item.append(pre);list.append(item);
        });
        output.append(list);
        if(method==="gaussianElimination"&&result.success){output.append(element("h4","向後代入過程"));addList(output,result.backSubstitution.map(row=>row.description),true);}
      }
    }catch(error){status.className="calculator-status error";status.textContent="輸入或計算錯誤："+error.message;}
  });
}

function renderTransformCalculator(pack) {
  const isLaplace=pack.id==="laplace-transform";
  if(!["laplace-transform","fourier-transform"].includes(pack.id)||pack.calculator_id!==pack.id)return;
  const api=globalThis.MathCalculators,method=isLaplace?"laplaceTransform":"fourierTransform";
  const block=section(isLaplace?"拉普拉斯轉換互動計算":"傅立葉轉換互動計算");
  block.classList.add("calculator");
  if(!api||typeof api[method]!=="function"){addText(block,"計算器載入失敗，請重新整理。","error");return;}
  const help=element("p",isLaplace?
    "單邊 F(s)=∫[0,∞] f(t)e^(-st)dt，s=σ+jω。先檢查 ROC；區域外即使解析式有值，也不能當作有效積分結果。" :
    "雙邊 F(ω)=∫[-∞,∞] f(t)e^(-jωt)dt；反轉換係數為 1/(2π)。ω 單位 rad/s，普通頻率 ν 的單位為 Hz，ω=2πν。");
  help.id="transform-help";
  const form=element("form",undefined,"calculator-form transform-form");form.noValidate=true;form.setAttribute("aria-describedby",help.id);
  const fields={},wrappers={};
  const configs=[
    ["functionId","固定時域函數","select",isLaplace?"exponential":"exponential"],
    ["a",isLaplace?"a（有限實數；可為負）":"a（必須大於 0）","number",isLaplace?2:1],
    ...(isLaplace?[["b","正弦參數 b（rad/s，必須大於 0）","number",2],["sigma","s 的實部 σ（1/s）","number",1]]:
      [["A","矩形振幅 A（有限實數）","number",2],["T","矩形全寬 T（秒，必須大於 0）","number",3]]),
    ["omega",isLaplace?"s 的虛部 ω（rad/s）":"角頻率 ω（rad/s）","number",isLaplace?1:0]
  ];
  for(const [name,title,type,value]of configs){
    const wrapper=element("div",undefined,"calculator-field");
    const label=element("label",title);label.htmlFor="transform-"+name;
    const input=element(type==="select"?"select":"input");input.id=label.htmlFor;input.name=name;input.required=true;
    if(type==="select"){
      (isLaplace?api.laplaceFunctions:api.fourierFunctions).forEach(item=>{const option=element("option",item.label);option.value=item.id;input.append(option);});
    }else{input.type="number";input.step="any";}
    input.value=String(value);wrapper.append(label,input);form.append(wrapper);fields[name]=input;wrappers[name]=wrapper;
  }
  const button=element("button","開始計算","copy-button");button.type="submit";form.append(button);
  const status=element("p","","calculator-status");status.setAttribute("role","status");
  const output=element("div",undefined,"calculator-output transform-output");
  const clear=()=>{output.replaceChildren();status.className="calculator-status";status.textContent="參數已變更，請重新開始計算。";};
  const showParameters=()=>{
    const choice=fields.functionId.value;
    for(const name of ["a","b","A","T"]){
      if(!fields[name])continue;
      const active=isLaplace?(name==="a"?choice==="exponential":name==="b"&&choice==="sine"):
        (name==="a"?choice!=="rectangle":choice==="rectangle");
      wrappers[name].hidden=!active;fields[name].disabled=!active;
    }
  };
  showParameters();
  fields.functionId.addEventListener("change",()=>{showParameters();clear();});
  form.addEventListener("input",clear);
  form.addEventListener("submit",event=>{
    event.preventDefault();output.replaceChildren();status.textContent="";status.className="calculator-status";
    try{
      const parameters={functionId:fields.functionId.value};
      for(const [name,input]of Object.entries(fields)){
        if(name==="functionId"||input.disabled)continue;
        if(!input.value.trim()||!Number.isFinite(input.valueAsNumber))throw new Error(input.labels[0].textContent+" 必須是有限數值，不可留白。");
        parameters[name]=input.valueAsNumber;
      }
      const result=api[method](parameters);
      status.classList.add(result.valid?"calculator-success":"calculator-warning");
      status.textContent=result.valid?"已完成固定解析轉換對的數值評估。":"拉普拉斯積分不收斂：s 不在 ROC；不提供有效轉換數值。";
      const summary=element("dl",undefined,"calculator-summary");
      const pairs=[["時域函數",result.functionText],["解析公式",result.formula],...(isLaplace?[["ROC",result.roc]]:[["適用條件",result.conditions]]),["參數代入",result.substitution]];
      if(result.valid){
        if(isLaplace)pairs.push(["F(s) 實部",String(result.real)],["F(s) 虛部",String(result.imag)],["複數結果",result.complex]);
        else pairs.push(["F(ω)",String(result.value)],["幅度 |F(ω)|",String(result.magnitude)],["虛部","0（本選單為實偶函數）"]);
      }
      pairs.forEach(([title,value])=>summary.append(element("dt",title),element("dd",value)));
      output.append(summary,element("h4","計算過程"));
      addList(output,result.steps,true);
    }catch(error){status.className="calculator-status error";status.textContent="輸入或數值計算錯誤："+error.message;}
  });
  block.append(help,form,status,output);
  addText(block,"僅支援選單中的固定解析轉換對；不提供任意函數符號積分、反拉普拉斯或反傅立葉轉換。","muted");
}
