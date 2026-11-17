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

目前已實作四個分類、八個獨立資料包及八個 JavaScript 互動計算器；八份教材仍為 draft，功能實作不等於全面內容及來源驗證：

| 分類 ID | 類別 | 第一版資料包 |
| --- | --- | --- |
| `root-finding` | 求根方法 Root Finding | `bisection.json`、`false-position.json`、`newton-raphson.json` |
| `linear-systems` | 線性方程組 Linear Systems | `gaussian-elimination.json`、`gauss-jordan.json`、`gauss-seidel.json` |
| `laplace-transform` | 拉普拉斯轉換 Laplace Transform | `laplace-transform.json` |
| `fourier-transform` | 傅立葉轉換 Fourier Transform | `fourier-transform.json` |

- 首頁、分類瀏覽、搜尋及筆記詳情頁均需能正常使用。
- 現有八份筆記皆有對應計算器。未來新增但尚未實作的功能須保持 `calculator_id = null`，不得顯示假的執行按鈕。是否達到第一版完成條件，仍須依第 13 節的實際驗收證據判定。
- 之後可新增內插、數值積分、常微分方程、向量微積分等分類，但不可因此破壞現有資料格式。

## 3. 技術選型與部署

- 使用原生 HTML、CSS、JavaScript（不必引入大型前端框架）。
- 網站必須可部署到 **GitHub Pages**；不得依賴必須長期運作的後端伺服器。
- 用 `fetch()` 載入 JSON；測試時使用本機 HTTP Server，不要依賴直接以 `file://` 開啟網頁。
- 資源路徑使用相對路徑，確保網站部署在 `https://<username>.github.io/<repository>/` 的子路徑下仍能正常運作。
- MATLAB 程式碼是**展示、學習與複製**用的教材；網頁互動計算必須以 JavaScript 實作，不能聲稱瀏覽器可直接執行 MATLAB。
- 不使用 `eval()` 或 `new Function()` 直接執行使用者輸入的數學式。第一版採受控的函數選單或明確的安全解析方式。

## 4. 現有專案結構

```text
engineering-math-wiki/
├── AGENTS.md
├── README.md
├── VALIDATION.md
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── vendor/katex/             # 固定版本 JS、CSS、fonts/ 與 LICENSE
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
│       ├── laplace-transform/
│       │   └── laplace-transform.json
│       └── fourier-transform/
│           └── fourier-transform.json
└── scripts/
    ├── calculators.test.html
    ├── calculators.test.js
    ├── newton-raphson.test.js
    ├── extended-calculators.test.js
    ├── transforms.test.js
    ├── pack-examples.test.js
    ├── test_matlab_packs.m
    └── test_matlab_transforms.m
```

- `AGENTS.md`：專案唯一主要規則文件。
- `README.md`：專案簡介、如何本機啟動、如何新增資料包及如何部署。
- `index.html`：網站入口與共用版型。
- `style.css`：共用視覺樣式及響應式設計。
- `app.js`：載入索引與資料包、分類、搜尋、頁面切換與錯誤提示。
- `calculators.js`：瀏覽器端數值計算邏輯；計算與 UI 分離。
- `manifest.json`：分類及資料包路徑清單；**新增資料包必須登記**。
- `data/packs/`：每個概念或演算法一份 JSON。
- `math-notation.js`：將既有介面的受控文字轉為公式表示，不執行數學輸入；新教材仍須直接寫正確 LaTeX。
- `math-renderer.js`：安全渲染、原文保留、動態更新與失敗備援。
- `assets/vendor/katex/`：KaTeX 0.19.1 與字型、授權；不依賴 CDN。
- `scripts/calculators.test.html`：透過 HTTP 載入實際網站，呼叫 app.js 的 `validateManifest`、`validatePack`，並檢查八份教材、ID、分類、搜尋、UI、公式與版面。
- 五支 `.test.js`：純數值邏輯與已知答案核對，可用 Node.js 獨立執行，也由測試頁執行。
- 兩支 `.m`：實際讀取並執行資料包中的 MATLAB 原碼；packs 測試涵蓋假位、高斯、喬登、賽德，transforms 測試涵蓋兩種轉換，未涵蓋二分與牛頓 MATLAB。
- `VALIDATION.md`：本次維護的驗證紀錄與限制；後續交付需記錄當次證據，不得沿用舊紀錄冒充新測試。

目前沒有 `validate_data.py`，不得將不存在的腳本列為已執行。各項命令與環境需求見 README。

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

`manifest.json` 使用 `schema_version: 1`，包含 `categories` 與 `packs` 陣列。分類項為 `{id, title_zh, title_en}`；筆記項為 `{id, category, path, title_zh, title_en}`，名稱、ID 與分類必須和資料包一致。分類 ID 在分類中唯一，筆記 ID 在所有資料包中唯一；兩者可相同（如 laplace-transform）。檔名採 `<id>.json`，路徑採 `./data/packs/<category>/<id>.json`，相對網站根目錄，不可含上層跳脫或外部 URL。網站只從索引載入資料包，不掃描目錄。

上方範本的全部頂層欄位均為必要欄位。文字欄位為字串；`prerequisites`、`formulas`、`conditions`、`steps`、`matlab_explanation`、`advantages`、`limitations`、`common_mistakes` 為字串陣列；`symbols` 每項須有字串 `symbol`、`meaning`、`unit`。`example` 須有字串 `problem`、`answer` 與字串陣列 `given`、`solution_steps`。`sources` 每項須有字串 `title`、`author`、`sections`、`note` 與字串或 null 的 `url`。缺資料可保留空字串／空陣列，不能省略欄位；只有允許 null 的欄位才用 null。

`calculator_id` 為 null 或已實作的穩定 ID。現有八份均與筆記 ID 相同；必須同時確認 calculators.js 的純函式、app.js 的 UI 連接及已知答案測試，僅填入 ID 不算實作。

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

- 現有計算器 ID 為 `bisection`、`false-position`、`newton-raphson`、`gaussian-elimination`、`gauss-jordan`、`gauss-seidel`、`laplace-transform`、`fourier-transform`；各自範圍見 README。
- 三種求根法均使用三個固定連續函數，網頁採函數殘差停止，迭代上限 1–1000。二分法 MATLAB 教材另外示範位置半寬停止，不能要求其最終迭代次數與網頁相同；應在相同條件下核對共同迭代列並解釋差異。
- 三種線性方法 UI 僅支援 2×2／3×3；MATLAB 教材可處理相容的非奇異方陣，但數值保護門檻不完全相同。不可宣稱網頁有任意維度或通用秩不足求解功能。
- Laplace 只評估四個固定單邊轉換對，先檢查 ROC；Fourier 只評估三個固定雙邊角頻率轉換對，反轉換慣例係數為 1/(2π)。兩者顯示代入步驟，不是迭代演算法，不提供任意符號積分、反轉換或 FFT。
- 互動計算必須能讓使用者輸入必要參數，執行計算並顯示結果與逐次迭代資訊；非迭代的轉換方法顯示解析代入步驟。
- 必須驗證數值輸入、迭代次數、容許誤差及演算法前提。
- 二分法須檢查初始區間及函數在區間上的適用條件；端點異號條件不符時提示錯誤。
- 牛頓法須處理導數接近零、不收斂、非有限數值與超出迭代上限等情況。
- 必須設定最大迭代次數，避免無限迴圈；錯誤時顯示清楚提示，不能假裝算出正確答案。
- 顯示的公式、MATLAB 範例及 JavaScript 計算結果應在相同測試條件下互相核對。
- 禁止將使用者輸入直接拼成 JavaScript 程式碼執行。

## 10. AI 新增內容的固定工作流程（Graph）

依序執行下列有向流程；每階段的產出是下一階段的輸入。修改既有功能也須先讀規則與受影響檔案，再從相應階段進入；錯誤依第 11 節回到相關節點，不重做網站。

| 階段 | 輸入 | 工作內容 | 完成條件／產出 |
| --- | --- | --- | --- |
| 1 讀規則 | AGENTS.md、任務 | 確認範圍、限制、完成條件；檢查 Git 狀態 | 記錄允許修改的範圍與既有修改 |
| 2 讀現況 | manifest、同類 JSON、相關程式及測試 | 比對 schema、命名、UI、計算 API 與測試接點 | 確認唯一 ID、分類及可重用元件 |
| 3 確認主題與來源 | 需求、實際取得的教材 | 確認定義、符號、適用條件、引用及計算範圍 | 來源可追溯；不足時詢問並停在此階段，不猜補 |
| 4 建立 JSON | 第 6 節格式、主題與來源 | 建立獨立資料包、完整教學章節；先標 draft | JSON 可解析、必要欄位及型別完整 |
| 5 驗證教學 | JSON、獨立已知答案 | 核對公式意義、KaTeX、例題逐步結果與 MATLAB；實際可執行才記通過 | 記錄核對結果與未測項；失敗回第 4 階段 |
| 6 登記索引 | 合格資料包、manifest | 新分類加入 categories；新筆記加入 packs | ID、分類、標題一致，安全相對路徑可載入 |
| 7 連接計算器 | 數學規格、計算 API、UI | calculators.js 寫純函式，app.js 接 UI；處理輸入與失敗 | 有可用表單、步驟與結果才填 calculator_id；未實作為 null |
| 8 自動測試 | 資料、程式、現有測試 | 執行 README 命令與第 11 節檢查；新算法加已知答案測試 | 保存命令、環境、結果；失敗進 Loop |
| 9 畫面驗收 | 本機 HTTP 網站及測試頁 | 分類、中英文名稱搜尋、詳情、計算、桌面／手機、公式及 MATLAB 格式 | 記錄實際驗收；無瀏覽器時列尚未測試，不能宣稱完成畫面驗收 |
| 10 回報 | 變更清單、測試輸出 | 說明修改理由、測試狀態、限制與待確認項 | 依第 13 節逐項確認；未達條件不得宣稱全部完成 |

新增分類時，首頁卡片由 manifest 產生，但 `index.html` 側欄連結與筆記數徽章目前為固定內容，需同步局部更新。測試頁目前有四分類／八筆記的固定斷言，真正擴充時須更新預期數量並保留原八份回歸測試。不為單篇筆記複製 HTML 或改寫共用架構。

## 11. Loop：檢查、修正與停止規則

每次新增或修改資料包／計算器均須執行對應測試；共用程式改動需跑完整回歸。文件維護也需核對命令、結構與現況。

1. **初次檢查（第 0 輪）**：JSON 解析、必要欄位及型別、manifest 路徑存在且可經 HTTP 載入、分類與筆記 ID 唯一、資料包與索引一致、calculator_id 有純函式與 UI。使用既有測試頁的驗證函式，不只目視檔名。
2. **數學與安全檢查**：以獨立手算、精確答案或另一種數值方法比較結果、殘差、逐輪資料及停止條件；測無效輸入、上限與失敗分支。KaTeX 語法通過仍須審查數學意義，尤其矩陣分量與分式作用範圍。MATLAB 實際執行結果與靜態閱讀分開記錄。
3. **回歸與畫面**：確認原有八份筆記、中英文名稱搜尋、四分類、八個計算器正常；檢查 390px／1280px 版面、公式局部捲動、MATLAB 逐字保留與相對路徑。發布時另驗收公開網址，本機通過不能取代線上驗收。
4. **修正第 1–3 輪**：每輪列出失敗項、原因與最小修正；回 Graph 對應節點，只改相關問題。修正後重跑失敗測試及受影響回歸，不能為通過而刪除斷言或降低數學標準。
5. **停止**：檢查全過即可交付，最多三輪修正。第三輪後仍失敗、來源不足、需求矛盾或無法驗證時停止相關工作並回報，保留診斷資訊；不可猜測補完或宣稱成功。環境無法執行不是通過，也不應無限重試。
6. **紀錄**：每項標示「實際測試通過」、「尚未測試」或「測試失敗」，附命令／網址、環境、預期與實際摘要、輪次。預期拒絕無效輸入且斷言成功屬通過；沒有執行、僅閱讀程式或沿用他人紀錄屬尚未測試。禁止捏造測試數量、成功輸出、公式、計算結果及來源。

## 12. Git 與變更管理

- 修改前先執行 `git status`（若專案已初始化 Git）。
- 如果有來源不明的未提交修改，先告知使用者，不要直接覆蓋。
- 只修改本次任務需要的檔案；不要任意重構其他部分。
- 交付以小範圍、可理解的變更供審查；只有任務授權時才提交或發布。若無 Git 或 .git，明確回報限制，保留原檔內容及變更範圍。本次任務禁止上傳與 git push。
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
7. 回報實際執行的命令、結果、修正輪次及尚未測試／失敗項。缺少必要驗收時，交付可審查成果但不得宣稱該項完成。

**第一版網站完成**，須另外滿足：四個分類、八個可瀏覽的資料包、八份筆記對應且可使用的互動計算器、桌面／手機基本排版、GitHub 公開 Repository、GitHub Pages 可實際瀏覽。

---

本文件是專案的長期規則。未來擴充新章節時，優先重用資料格式與共用元件；只有在確實需要時才修改架構，並說明理由與相容性影響。

## 14. 可重複使用範例：AI Agent 如何新增第九份數學筆記

**以下全為假設擴充規格，尚未建立 numerical-integration 分類、梯形法資料包或計算器；本次維護不實作此功能。** 其他主題可替換數學內容，沿用相同 Graph／Loop。以下數值是可獨立推導的預期答案，不是已執行的測試紀錄。

### 14.1 讀規則、現況與來源（Graph 1–3）

先讀 AGENTS.md、README、manifest、同為演算法的 bisection.json、calculators.js、app.js 與 scripts 測試。確認 `numerical-integration`、`trapezoidal-rule` 尚未被使用，再確定要教的是「等距複合梯形法」，不是自適應積分。取得實際教材的公式、誤差條件與可引用位置；若未取得，詢問使用者，停在來源確認階段。自編例題明確標為自編，不能編造課本頁碼。

### 14.2 建立資料包與核對教材（Graph 4–5）

計畫路徑 `data/packs/numerical-integration/trapezoidal-rule.json`，沿用第 6 節全部欄位。下列 JSON 是可解析的教學草稿範本；sources 留空表示仍須補實際來源，calculator_id 為 null 表示尚未連接，不可直接當成完成品。

```json
{
  "id": "trapezoidal-rule",
  "category": "numerical-integration",
  "type": "algorithm",
  "title_zh": "梯形法",
  "title_en": "Trapezoidal Rule",
  "summary": "以等距小區間上的梯形面積近似定積分。",
  "prerequisites": ["定積分", "等距分點與加總"],
  "concept": "用相鄰取樣點的直線代替曲線；複合梯形法是各小區間梯形面積的總和。",
  "formulas": [
    "分點：\\[h=\\frac{b-a}{n},\\qquad x_i=a+ih,\\quad i=0,\\ldots,n.\\]",
    "近似：\\[T_n=h\\left[\\frac{f(a)+f(b)}{2}+\\sum_{i=1}^{n-1}f(x_i)\\right].\\]",
    "若二階導數連續且有界：\\[\\lvert I-T_n\\rvert\\le\\frac{(b-a)^3}{12n^2}\\max_{x\\in[a,b]}\\lvert f''(x)\\rvert.\\]"
  ],
  "symbols": [
    {"symbol":"\\(a,b\\)","meaning":"積分下、上限","unit":"與自變數相同"},
    {"symbol":"\\(n,h,x_i,i\\)","meaning":"正整數分段數、步長、分點與索引","unit":"n、i 無單位；h、x_i 與自變數相同"},
    {"symbol":"\\(f,f'',I,T_n\\)","meaning":"被積函數、二階導數、真實積分及梯形近似","unit":"I、T_n 為函數單位乘自變數單位"}
  ],
  "conditions": ["有限實數 a < b，n 為正整數；所有取樣函數值須有限。", "誤差界另要求二階導數連續且有界；不保證奇點積分適用。"],
  "steps": ["驗證參數。", "算步長與 n+1 個分點。", "端點權重各 1/2，內點權重為 1。", "加總乘 h，檢查有限值，顯示貢獻表。"],
  "example": {
    "problem": "自編例題：近似積分 \\(I=\\int_0^1 x^2\\,\\mathrm{d}x\\)，固定 n=4。",
    "given": ["\\(a=0,b=1,n=4,h=1/4\\)，無單位。", "固定四段後停止；未使用 tolerance 或自適應加密。"],
    "solution_steps": [
      "分點 0、1/4、1/2、3/4、1；函數值 0、1/16、1/4、9/16、1。",
      "端點貢獻為 1/2；內點和為 7/8。",
      "乘步長得 \\(T_4=(1/4)(1/2+7/8)=11/32=0.34375\\)。",
      "精確積分為 1/3，絕對誤差為 1/96；二階導數為 2，理論界亦為 1/96。"
    ],
    "answer": "\\(T_4=0.34375\\) 是近似值；真值為 \\(1/3\\)。"
  },
  "matlab_code": "% 自編四段梯形法例題\nf = @(x) x.^2;\na = 0; b = 1; n = 4;\nvalidateattributes(a,{'double'},{'scalar','real','finite'});\nvalidateattributes(b,{'double'},{'scalar','real','finite','>',a});\nvalidateattributes(n,{'double'},{'scalar','integer','>=',1,'<=',10000});\nh = (b-a)/n;\nx = linspace(a,b,n+1);\ny = f(x);\nassert(all(isfinite(y)));\nw = ones(size(y)); w([1,end]) = 0.5;\nT = h*sum(w.*y);\nassert(isfinite(T));\ndisp([x(:),y(:),w(:),h*w(:).*y(:)]); % 分點、函數值、權重、貢獻\nassert(abs(T-11/32)<1e-12);\nfprintf('T = %.12g\\n',T);\n",
  "matlab_explanation": ["逐元素平方保留向量運算。", "端點半權重；輸出表格便於逐項核對。", "此為文件範例，尚未實際執行。"],
  "advantages": ["規則簡單，可累加各區間貢獻。"],
  "limitations": ["曲率大時可能需更多分段；奇點可能使方法失效。"],
  "common_mistakes": ["端點重複加權。", "把 n 段誤認為只有 n 個分點。", "把近似值當成精確積分。"],
  "calculator_id": null,
  "sources": [],
  "status": "draft"
}
```

JSON 原文 `\\frac` 解析後是 `\frac`；不要再次跳脫解析後內容。誤差界與數學定義須對實際來源核對；MATLAB 須在 MATLAB 環境執行後才能將程式測試列為通過。上述固定 n 方法沒有迭代容許值，不應加入假的「收斂成功」狀態。

### 14.3 登記分類與資料包（Graph 6）

在 manifest 的 `categories` **追加**下列物件，保留原四分類：

```json
{"id":"numerical-integration","title_zh":"數值積分","title_en":"Numerical Integration"}
```

在 `packs` **追加**下列物件，保留原八份：

```json
{"id":"trapezoidal-rule","category":"numerical-integration","path":"./data/packs/numerical-integration/trapezoidal-rule.json","title_zh":"梯形法","title_en":"Trapezoidal Rule"}
```

在 index.html 側欄追加 `href="#category/numerical-integration"`、`data-route="numerical-integration"` 連結，將筆記數徽章改為九份；首頁卡片由 manifest 自動產生。測試頁原本四分類／八份的固定預期要更新成五分類／九份，不能移除原八份測試。以上都只在真正獲授權實作時才修改。

### 14.4 新增 JavaScript 計算與 UI（Graph 7）

計畫在 calculators.js 內新增純函式 `trapezoidalRule({functionId,a,b,n})`，匯出到既有 `MathCalculators` API；不複製其他算法整套頁面。第一個受控選項可為 `quadratic` 對應 x²，不能誤用現有求根選單 quadratic 的 x²−2，應用獨立的積分函數清單。

函式規格：驗證 functionId、a、b 為有限值、a < b、n 為 1–10000 正整數；逐點檢查函數值、步長、貢獻及總和是否有限。回傳 `{value, h, samples}`，samples 每項含 `{i,x,fx,weight,contribution}`。最後樣本直接使用 b 避免端點累積誤差；超上限與溢位要明確報錯，不猜答案。這是建議的擴充 API，現有程式沒有此函式。

app.js 加入對應 UI 分支，使用共用 element／section 元件建立有標籤的函數選單、上下限、分段數及結果表，輸入變更清除舊結果，錯誤以文字提示。新增筆記及計算結果後沿用 MathDisplay；表格局部捲動，保持深色樣式。純函式、UI 及測試均就緒後，才將資料包 calculator_id 從 null 改為 trapezoidal-rule。

### 14.5 已知答案、Graph 驗收與 Loop（Graph 8–10）

真正實作時可新增 `scripts/trapezoidal-rule.test.js` 並接入既有瀏覽器測試頁，再於 README 補命令。測試須含：x² 在 [0,1]、n=4 的 11/32，n=1 的 1/2，以及 n=8 的 43/128（誤差 1/384）；以解析積分 1/3 獨立核對，不用呼叫同一算法產生預期值。若另支援常數／一次函數，驗證其精確積分。測 n=0、負數、非整數、超上限、NaN／Infinity、a≥b 與未知 functionId，並確認輸入沒有被修改。

由第 0 輪開始跑 JSON、manifest、ID、KaTeX 及數值檢查；例如發現端點權重錯誤，第 1 輪只修權重並重跑新測試與原五支純計算測試。最多三輪修正，仍失敗就回報失敗，不能把預期答案列成已測結果。

透過 HTTP 開啟測試頁與網站，驗收五個分類、九份詳情、中英文名稱搜尋、新表單錯誤與結果、390px／1280px 版面、MATLAB 換行，以及原八個計算器與公式。比對變更清單，確認原八份 JSON 未被無關修改。交付時列實際命令與三種測試狀態；來源未全面查核仍為 draft，缺畫面或 MATLAB 驗收需明列。未經發布授權不推送；若另獲授權發布，再實際驗收公開網址。