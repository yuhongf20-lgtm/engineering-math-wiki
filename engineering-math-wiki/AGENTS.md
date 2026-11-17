# AGENTS.md — Engineering Math Wiki

> 本文件是 Engineering Math Wiki 專案的主要 AI 開發規範。任何 AI Coding Agent 在建立、修改或新增內容前，必須先閱讀本文件。

## 1. 專案目標與讀者

- 專案名稱：**Engineering Math Wiki（工程數學模組化筆記庫）**。
- 目的：將工程數學概念、公式、例題、數值演算法與 MATLAB 程式整理成可重複使用的獨立資料包，透過統一的網站介面供學習、查詢與複習。
- 主要讀者：正在學習工程數學、數值方法的學生；以初學者也能逐步理解為原則。
- 語言：繁體中文為主，保留標準英文專有名詞。
- 筆記風格：**綜合型、完整教學型**，同時提供觀念、公式、計算範例、MATLAB 程式與適用時的互動計算。
- 第一版的重點是「規則可重用」，不是一次填滿所有章節。內容必須可持續擴充。

## 2. 第一版範圍與優先順序

第一版規劃四個分類、八個獨立資料包；八份筆記均須具備互動計算器。本階段先完成既有六份的計算器，Laplace 與 Fourier 留待下一階段：

| 分類 ID | 類別 | 第一版資料包 |
| --- | --- | --- |
| `root-finding` | 求根方法 Root Finding | `bisection.json`、`false-position.json`、`newton-raphson.json` |
| `linear-systems` | 線性方程組 Linear Systems | `gaussian-elimination.json`、`gauss-jordan.json`、`gauss-seidel.json` |
| `laplace-transform` | 拉普拉斯轉換 Laplace Transform | `laplace-transform.json`（下一階段） |
| `fourier-transform` | 傅立葉轉換 Fourier Transform | `fourier-transform.json`（下一階段） |

- 首頁、分類瀏覽、搜尋及筆記詳情頁均需能正常使用。
- **第一版八份筆記均須完成互動計算器**；本階段支援三種求根法與三種線性方程組方法，下一階段完成 Laplace Transform 與 Fourier Transform。尚未實作的功能保持 calculator_id = null，不得偽裝為可使用；未完成八份前不得宣稱第一版全部完成。
- 之後可新增內插、數值積分、常微分方程、向量微積分等分類，但不可因此破壞現有資料格式。

## 3. 技術選型與部署

- 使用原生 HTML、CSS、JavaScript（不必引入大型前端框架）。
- 網站必須可部署到 **GitHub Pages**；不得依賴必須長期運作的後端伺服器。
- 用 `fetch()` 載入 JSON；測試時使用本機 HTTP Server，不要依賴直接以 `file://` 開啟網頁。
- 資源路徑使用相對路徑，確保網站部署在 `https://<username>.github.io/<repository>/` 的子路徑下仍能正常運作。
- MATLAB 程式碼是**展示、學習與複製**用的教材；網頁互動計算必須以 JavaScript 實作，不能聲稱瀏覽器可直接執行 MATLAB。
- 不使用 `eval()` 或 `new Function()` 直接執行使用者輸入的數學式。第一版採受控的函數選單或明確的安全解析方式。

## 4. 預定專案結構

```text
engineering-math-wiki/
├── AGENTS.md
├── README.md
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── calculators.js
│       ├── math-notation.js
│       └── math-renderer.js
├── data/
│   ├── manifest.json
│   └── packs/
│       ├── root-finding/
│       │   ├── bisection.json
│       │   ├── false-position.json
│       │   └── newton-raphson.json
│       ├── linear-systems/
│       │   ├── gaussian-elimination.json
│       │   ├── gauss-jordan.json
│       │   └── gauss-seidel.json
│       ├── laplace-transform/          # 下一階段規劃
│       │   └── laplace-transform.json
│       └── fourier-transform/          # 下一階段規劃
│           └── fourier-transform.json
└── scripts/
    └── validate_data.py
```

- `AGENTS.md`：專案唯一主要規則文件。
- `README.md`：專案簡介、如何本機啟動、如何新增資料包及如何部署。
- `index.html`：網站入口與共用版型。
- `style.css`：共用視覺樣式及響應式設計。
- `app.js`：載入索引與資料包、分類、搜尋、頁面切換與錯誤提示。
- `calculators.js`：瀏覽器端數值計算邏輯；計算與 UI 分離。
- `manifest.json`：分類及資料包路徑清單；**新增資料包必須登記**。
- `data/packs/`：每個概念或演算法一份 JSON。
- `validate_data.py`：驗證 JSON 格式、必要欄位、唯一 ID 與索引路徑。

## 5. 命名與資料管理規則

- 檔案及資料夾名稱使用英文小寫 `kebab-case`，例如 `newton-raphson.json`。
- 一個主題對應一份資料包，避免在 HTML 中硬編寫筆記內容。
- 每個資料包必須有不重複的 `id`，與 `manifest.json` 對應。
- 所有資料包使用一致的 JSON 欄位；若擴充格式，需同時更新載入程式、範例與驗證腳本。
- 不得為新增一篇筆記而複製整套 HTML、CSS、JavaScript。
- 資料包應以 JSON 純文字儲存，確保 Git 可追蹤內容變更。

## 6. 資料包結構

每個資料包至少包含以下欄位，無資料時使用空陣列、空字串或 `null`，不可捏造內容：

```json
{
  "id": "bisection",
  "category": "root-finding",
  "type": "algorithm",
  "title_zh": "二分法",
  "title_en": "Bisection Method",
  "summary": "",
  "prerequisites": [],
  "concept": "",
  "formulas": [],
  "symbols": [],
  "conditions": [],
  "steps": [],
  "example": {
    "problem": "",
    "given": [],
    "solution_steps": [],
    "answer": ""
  },
  "matlab_code": "",
  "matlab_explanation": [],
  "advantages": [],
  "limitations": [],
  "common_mistakes": [],
  "calculator_id": "bisection",
  "sources": [],
  "status": "draft"
}
```

欄位解釋：
- `type`：`algorithm` 或 `concept`；一般概念型筆記可不提供可執行計算；第一版規劃的八份筆記仍須有互動計算器。
- `formulas`：公式與用途；每條公式需能對應符號解釋。
- `symbols`：符號、意義、單位（若適用）。
- `steps`：依序列出計算或演算法步驟。
- `example`：題目、已知條件、逐步代入與結果；不得只列答案。
- `matlab_code`：可複製的 MATLAB 程式；適用時提供。
- `matlab_explanation`：程式邏輯或關鍵行說明。
- `calculator_id`：對應 `calculators.js` 中已實作的計算器；尚未實作時必須是 `null`，網站不得顯示假的執行按鈕。
- `sources`：來源標題、作者或機構、章節／頁碼／網址（以實際取得資訊為準）。
- `status`：`draft` 或 `verified`。只有經過內容與來源查核才可標記 `verified`。

`manifest.json` 的索引須使用穩定 ID、分類與相對路徑；網站只從索引載入資料包，不掃描目錄。

## 7. 筆記撰寫與數學正確性

- 按照「基本觀念 → 公式與符號 → 使用條件 → 演算法步驟 → 完整例題 → MATLAB → 優缺點與常見錯誤 → 來源」順序呈現。
- 所有數學公式統一使用正確 LaTeX，由網站 KaTeX 正式渲染；保留繁體中文解釋，避免只包分隔符卻仍使用純文字分式、矩陣或積分。
- 行內公式統一使用 `\(...\)`，獨立公式統一使用 `\[...\]`；以上為解析後文字，JSON 檔案需再跳脫反斜線。禁止混用美元符號分隔。
- JSON 字串每個 LaTeX 反斜線須跳脫成兩個反斜線。正確 JSON 範例：`{"formulas":["\\[x_{n+1}=x_n-\\frac{f(x_n)}{f'(x_n)}\\]"]}`。解析後公式只含單反斜線；以 JSON 解析與 KaTeX 語法測試確認。
- MATLAB 程式碼與所有 pre/code 區塊必須保留原本換行、縮排與字元，禁止當成 LaTeX 渲染；輸入欄位與原生下拉選單也不直接渲染，必要時另設公式預覽。
- KaTeX 使用專案內固定版本的靜態資源與字型；動態載入筆記及更新計算結果後須重新渲染。保持 trust=false，不得透過 LaTeX 執行程式或注入 HTML。
- 長公式與矩陣須能在手機局部水平捲動；KaTeX 載入或公式解析失敗時顯示原始公式及清楚提示，不能阻止筆記與計算器使用。
- 未來 AI 新增或修改筆記與計算器時，必須沿用相同分隔符、JSON 跳脫及安全規範，並驗證 KaTeX 語法、數學意義與桌面／手機版面。
- 例題必須交代初始值、精度或停止條件、每一步的計算與最終結果；適用時標示單位。
- 數值方法須說明適用條件、收斂限制、停止準則與常見失敗情況；不得宣稱所有初始值都能收斂。
- MATLAB 範例須與筆記中的數學方法一致，包含必要的繁體中文註解；不能將未測試程式標為已驗證。
- 優先使用使用者提供的課本、講義及可信來源。來源不足時應明確標示待補，**不可虛構引用、課本頁碼、公式來源或計算結果**。
- 如果不同資料來源互相矛盾，保留差異並請使用者確認，不可無說明地合併。

## 8. 視覺設計：深色科技風格

- 主題：黑灰色背景、深色卡片、藍／青色重點色；保持高對比、乾淨、專業。
- 版型：桌面版採側邊分類導覽＋主內容區；手機版導覽可收合，內容單欄呈現。
- 首頁：專案名稱、簡短介紹、分類卡片、搜尋欄及資料包清單。
- 筆記頁：標題、分類標籤、固定章節標題、公式區塊、程式碼區塊及互動計算面板。
- 公式、程式碼與互動輸入區要有清楚的視覺區分；不要只靠顏色傳達狀態。
- 使用一致的字體大小、間距、按鈕樣式與卡片樣式；避免過度動畫。
- 確保桌面與手機閱讀體驗、鍵盤可操作性與表單標籤。

## 9. 互動計算規範

- 第一版須完成八份筆記對應的計算器；本階段為 `bisection`、`false-position`、`newton-raphson`、`gaussian-elimination`、`gauss-jordan`、`gauss-seidel`，下一階段為 `laplace-transform` 與 `fourier-transform`。
- 互動計算必須能讓使用者輸入必要參數，執行計算並顯示結果與逐次迭代資訊。
- 必須驗證數值輸入、迭代次數、容許誤差及演算法前提。
- 二分法須檢查初始區間及函數在區間上的適用條件；端點異號條件不符時提示錯誤。
- 牛頓法須處理導數接近零、不收斂、非有限數值與超出迭代上限等情況。
- 必須設定最大迭代次數，避免無限迴圈；錯誤時顯示清楚提示，不能假裝算出正確答案。
- 顯示的公式、MATLAB 範例及 JavaScript 計算結果應在相同測試條件下互相核對。
- 禁止將使用者輸入直接拼成 JavaScript 程式碼執行。

## 10. AI 新增內容的固定工作流程（Graph）

1. **讀取規則**：閱讀本文件、`manifest.json` 與同類既有資料包。
2. **確認需求與來源**：確認主題、分類、教材依據及是否需要互動計算；來源不足先詢問。
3. **建立資料包**：按第 6 節格式新增 JSON，不重寫既有頁面。
4. **內容檢查**：核對公式、條件、例題、MATLAB 與來源；若錯誤，退回第 3 步修正。
5. **登記索引**：在 `manifest.json` 新增路徑及分類資訊。
6. **互動實作（適用時）**：新增對應 JavaScript 計算器，未實作則 `calculator_id = null`。
7. **程式驗證**：執行資料驗證與計算測試；若失敗，退回出錯的資料包或計算器。
8. **畫面驗收**：測試分類、搜尋、筆記載入、桌面／手機顯示；若排版有問題，只修相關 UI。
9. **回報結果**：列出新增或修改檔案、已通過測試、尚待確認事項。

不要因單一資料包出錯而重做整個網站。

## 11. Loop：檢查、修正與停止規則

- 觸發：每次新增或修改資料包／計算器後。
- 目標：資料完整、內容有根據、網站功能正常。
- 自動檢查：JSON 語法、必要欄位、重複 ID、索引路徑、計算器 ID、基本計算測試。
- 人工／AI 內容審查：公式是否正確、來源是否支持、例題是否一致、解說是否適合初學者。
- 修正：每輪只修檢查報告指出的問題，**最多三輪**。
- 停止：檢查全過即可交付；達三輪仍失敗、資料來源不足、需求矛盾或無法驗證時，停止並回報，不可猜測補完。
- 不可只說「已檢查」；必須報告實際執行了哪些檢查及其結果。

## 12. Git 與變更管理

- 修改前先執行 `git status`（若專案已初始化 Git）。
- 如果有來源不明的未提交修改，先告知使用者，不要直接覆蓋。
- 只修改本次任務需要的檔案；不要任意重構其他部分。
- 以小範圍、可理解的提交記錄每次功能或資料包變更。
- 不上傳個資、帳密、API Key 或未經授權公開的課本／講義原始檔。
- GitHub Pages 發布後，必須實際開啟公開網址確認網站正常。

## 13. 完成定義（Definition of Done）

**新增一份資料包完成**，須同時滿足：

1. JSON 可解析，必填欄位齊全、ID 唯一。
2. `manifest.json` 已正確登記且路徑存在。
3. 公式、例題與 MATLAB 內容已檢查；未核實者維持 `draft`。
4. 網站分類、搜尋及詳情頁能載入該筆記。
5. 若宣稱有互動計算，必須能輸入、計算、處理錯誤並顯示正確結果。
6. 原有資料包與功能未受破壞。
7. 回報驗證結果及任何尚未完成項目。

**第一版網站完成**，須另外滿足：四個分類、八個可瀏覽的資料包、八份筆記對應且可使用的互動計算器、桌面／手機基本排版、GitHub 公開 Repository、GitHub Pages 可實際瀏覽。

---

本文件是專案的長期規則。未來擴充新章節時，優先重用資料格式與共用元件；只有在確實需要時才修改架構，並說明理由與相容性影響。
