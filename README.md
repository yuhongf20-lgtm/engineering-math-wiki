# Engineering Math Wiki

工程數學模組化筆記庫，為學習工程數學與數值方法的學生提供繁體中文觀念、公式、逐步例題、可複製 MATLAB 教材及 JavaScript 互動計算。每個主題是獨立 JSON，透過同一網站讀取，便於持續新增與維護。

- [公開網站](https://yuhongf20-lgtm.github.io/engineering-math-wiki/)
- [公開 GitHub Repository](https://github.com/yuhongf20-lgtm/engineering-math-wiki)
- [AI 開發規範](AGENTS.md) · [本次驗證紀錄](VALIDATION.md)

目前有四個分類、八份筆記與八個計算器。**八份教材仍標記 draft，尚未完成全面內容與來源查核**；功能測試通過不代表教材已全部 verified。公開版本與尚未上傳的本機修改應分別驗收。

## 現有內容與計算範圍

| 分類 | 筆記／calculator_id | 互動功能 |
| --- | --- | --- |
| 求根方法 root-finding | 二分法 bisection | 輸入異號區間，顯示中點、殘差與保留區間 |
| 求根方法 root-finding | 假位法 false-position | 割線插值、殘差與逐次區間更新 |
| 求根方法 root-finding | 牛頓法 newton-raphson | 輸入初始值，顯示導數及每次更新，處理近零導數與不收斂 |
| 線性方程組 linear-systems | 高斯消去法 gaussian-elimination | 2×2／3×3，部分選主元、消去、回代與原系統殘差 |
| 線性方程組 linear-systems | 高斯－喬登消去法 gauss-jordan | 2×2／3×3，逐步列運算化簡與原系統殘差 |
| 線性方程組 linear-systems | 高斯－賽德法 gauss-seidel | 2×2／3×3，初始向量、逐輪近似解、殘差與收斂提示 |
| 拉普拉斯轉換 laplace-transform | 拉普拉斯轉換 laplace-transform | 固定 1、t、exp(−at)、sin(bt) 的單邊轉換；先驗 ROC，再計算複數值 |
| 傅立葉轉換 fourier-transform | 傅立葉轉換 fourier-transform | 固定 exp(−a\|t\|)、exp(−at²)、矩形脈衝的雙邊角頻率轉換；顯示帶符號結果及幅度 |

三種求根法都使用固定 x²−2、x³−x−2、cos(x)−x，網頁以函數絕對殘差停止；求根與賽德的迭代上限為 1–1000。二分法 MATLAB 教材使用區間半寬的位置誤差停止，與網頁不同；比較時須對齊參數及停止條件，不能只比較迭代次數。線性計算器遇奇異或數值近奇異矩陣不提供假的唯一解。

轉換計算器評估固定解析轉換對並顯示代入步驟，不做任意函數符號積分、反轉換或 FFT。Fourier 採正轉換無係數、反轉換係數 1/(2π) 的慣例，角頻率單位為 rad/s；矩形零頻率直接使用 AT。瀏覽器不執行 MATLAB。

## 技術架構與檔案

純靜態網站，無後端、無大型前端框架，部署不需安裝套件或建置。

| 路徑 | 用途 |
| --- | --- |
| index.html | 共用版型、側欄與 hash 導覽入口 |
| assets/css/style.css | 深色科技風格、手機導覽與公式／表格局部捲動 |
| assets/js/app.js | fetch 索引與資料包、驗證資料、分類、名稱搜尋、筆記及計算器 UI |
| assets/js/calculators.js | 與 DOM 分離的八種計算邏輯，不執行使用者程式碼 |
| assets/js/math-notation.js | 既有介面文字的受控公式轉換 |
| assets/js/math-renderer.js | KaTeX 安全渲染、動態更新、保留原文及失敗提示 |
| assets/vendor/katex/ | 固定 KaTeX 0.19.1、CSS、fonts/、MIT LICENSE；不依賴 CDN |
| data/manifest.json | schema_version 1，分類與資料包的唯一載入索引 |
| data/packs/ | 四個分類目錄下的八份獨立 JSON 教材 |
| scripts/ | 五支純計算 JS 測試、瀏覽器測試頁與兩支 MATLAB 測試 |

公式解析後統一使用行內 `\(...\)`、獨立 `\[...\]`；JSON 檔案須跳脫每個反斜線，例如 `"\\[\\frac{1}{2}\\]"`。新教材直接使用正確 LaTeX，不能依賴文字轉換補救錯誤公式。KaTeX 設為 trust=false，排除 pre/code、MATLAB、輸入欄位與原生選單；解析／載入失敗保留原式與提示。MATLAB 原碼以文字節點顯示與複製，保留換行縮排。

## 本機啟動

需有可用 Python 3，在含 index.html 的專案根目錄執行：

```text
python -m http.server 8000
```

開啟 http://localhost:8000/ 。Windows 也可使用 `py -3 -m http.server 8000`（若已安裝 Python Launcher）。請經 HTTP 開啟，不要使用 file://，否則 fetch 資料可能失敗。此伺服器僅供本機測試，GitHub Pages 不需要它。

## 自動化測試與人工驗收

啟動伺服器後開啟 http://localhost:8000/scripts/calculators.test.html ，重新整理重跑。只有報告最後出現 `ALL TESTS PASSED` 才表示整頁測試通過；`FAIL` 或一直 `RUNNING` 均不能宣稱成功。

測試頁實際載入網站，檢查 JSON 必要欄位、重複 ID、manifest／資料包一致、HTTP 載入、八個計算器 UI、已知答案、無效輸入、分類與中英文名稱搜尋、KaTeX 語法與備援、MATLAB 逐字保留及 390px／1280px 橫向溢出。版面斷言不能取代人工視覺、鍵盤與真實手機驗收。目前沒有 validate_data.py，資料驗證由 app.js 函式及此測試頁提供。

若有 Node.js，可獨立執行五支純計算測試（不需 HTTP，不涵蓋 DOM）：

```text
node scripts/calculators.test.js
node scripts/newton-raphson.test.js
node scripts/extended-calculators.test.js
node scripts/transforms.test.js
node scripts/pack-examples.test.js
```

若有 MATLAB，在專案根目錄執行：

```matlab
addpath('scripts');
test_matlab_packs;
test_matlab_transforms;
```

前者實際執行假位、高斯、喬登、賽德資料包的 MATLAB 原碼；後者執行兩份轉換教材並以數值積分等方式核對。這兩支腳本未涵蓋二分與牛頓 MATLAB，不可稱為八份 MATLAB 全通過。JS 測試核對數值不等於執行 MATLAB。

每次交付記錄命令、環境、結果、修正輪次，區分「實際測試通過／尚未測試／測試失敗」。本次實際證據與限制見 [VALIDATION.md](VALIDATION.md)；不能把舊紀錄視為後續修改的測試結果。

## AGENTS.md、Graph 與 Loop

[AGENTS.md](AGENTS.md) 是 AI Agent 的主要規則來源，包含資料型別、命名、安全、數學／來源查核、視覺規範與完成條件；開始修改前完整閱讀相關文件、程式及測試。

Graph（第 10 節）明列每個階段的輸入、工作與完成條件：讀規則 → 讀 manifest／既有資料包 → 確認主題與來源 → 建 JSON → 核對公式、例題、MATLAB → 更新 manifest → 連接計算器 → 自動測試 → 畫面驗收 → 回報。

Loop（第 11 節）在每次教材／計算器變更後檢查資料、已知答案、原功能及畫面。失敗只修相關問題並重測，初次檢查後最多三輪修正；仍失敗、來源不足或無法驗證時停止並如實回報，禁止捏造來源、結果與測試紀錄。

## 新增教學資料包

1. 依 AGENTS.md 第 6 節的全部必要欄位建立 `data/packs/<category>/<id>.json`；ID、檔名及分類用小寫 kebab-case，ID 不重複。
2. 取得實際來源，寫出完整觀念、公式／符號、條件、步驟、逐步例題、MATLAB、限制與來源；尚未全面核對維持 draft。
3. 在 manifest.categories 登記新分類（若需要），在 manifest.packs 登記 id、category、path、title_zh、title_en，與 JSON 一致；路徑從網站根目錄起算，例如 `./data/packs/root-finding/bisection.json`。
4. 計算邏輯放 calculators.js，UI 放 app.js；只有實際連接與測試後才填 calculator_id，未實作使用 null。共用頁面不複製。
5. 新分類同步 index.html 的固定側欄及筆記數徽章；真正增加數量時更新測試頁的四分類／八份固定斷言並保留原八份回歸，新增算法的已知答案與失敗測試。
6. 執行 Graph／Loop，驗收分類、搜尋、詳細頁、計算與桌面／手機版面，據實回報。

完整假設範例見 **AGENTS.md 第 14 節「AI Agent 如何新增第九份數學筆記」**：以 numerical-integration／trapezoidal-rule 示範 JSON、公式、例題、MATLAB、索引、JS API 與驗證。它只是文件範例，尚未實作梯形法。

## GitHub Pages 部署與公開驗收

專案已有公開 Repository 與上方網站網址；本次維護僅修改本機，不上傳、不執行 git push。維護者取得發布授權並審查差異後，使用 Repository 的 Settings → Pages 設定部署來源；若採分支發布，選擇實際放有 index.html 的來源分支與支援目錄（通常為 main、/ root），或由 Actions 將該靜態目錄發布為 artifact。

**發布來源的根必須直接包含 index.html、assets/、data/**，保留相對結構、大小寫、KaTeX 字型與授權檔。GitHub 網頁上傳時避免多包一層同名資料夾；若 Repository 的入口實際在巢狀目錄，須調整發布 artifact 的根或整理已授權的部署來源，不能僅靠 README 宣稱部署正確。未授權前不要移動遠端檔案或變更設定。

發布完成後實際開啟公開網址，檢查四分類、八份筆記、搜尋、八個計算器、公式、字型與手機版。另確認 manifest、各 JSON、JS、CSS 及字型皆正常載入；只收到首頁 HTTP 200 不等於完整線上驗收。hash 導覽避免依賴後端路由，相對路徑適用 repository 子路徑。勿發布帳密、個資或未獲授權的教材原檔。

## 未來擴充

可依相同資料包與共用元件加入數值積分、內插、常微分方程及向量微積分；也可逐包補齊來源與 MATLAB／畫面驗證。優先維持規則、資料與實作一致，不為擴充單一主題重做網站。梯形法僅是流程範例，不列入目前八份內容。