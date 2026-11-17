# Engineering Math Wiki

工程數學模組化筆記庫，使用原生 HTML、CSS、JavaScript 與 JSON。現有四個分類、八份教學筆記及八個瀏覽器端計算器；教材維持 draft，仍待全面內容及來源複核。

## 本機開啟

在專案根目錄以可用的 Python 執行：

```text
python -m http.server 8000
```

開啟 http://localhost:8000/ 。請透過 HTTP 使用網站，不要直接以 file:// 開啟，因為資料包由 fetch() 載入。

## 測試

開啟 [完整自動化測試頁](scripts/calculators.test.html)，重新整理即可重跑八份筆記、分類、搜尋、計算器與響應式版型檢查。

若有 Node.js，可獨立執行純計算測試：

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

## 新增筆記

先閱讀 [AGENTS.md](AGENTS.md)。依既有 JSON 格式建立獨立資料包，在 data/manifest.json 登記分類、穩定 ID、名稱與相對路徑，並通過資料及畫面檢查。未完成查核保持 draft；未實作的計算器以 calculator_id: null 表示。擴充計算器時將數值邏輯放在 calculators.js，畫面放在 app.js。

## GitHub Pages 部署

網站是純靜態檔案，不需要後端、套件安裝或前端建置。部署來源選本專案根目錄，保留 index.html、assets/ 與 data/ 的相對結構。首頁及筆記使用 hash 導覽，資源與資料包路徑皆為相對路徑，適用 https://使用者.github.io/儲存庫/ 形式的子路徑。

啟用 GitHub Pages 後，必須實際開啟公開網址驗證。此工作區尚未由本任務上傳或發布；本機子目錄測試不能取代公開網址驗收。發布前請勿放入機密資訊或未授權教材原始檔。

## 轉換計算器範圍

- 拉普拉斯：四個固定單邊轉換對，先驗證 ROC，再計算複數結果。
- 傅立葉：三個固定雙邊角頻率轉換對，反轉換慣例係數 1/(2π)；矩形零頻率用 AT。
- 不提供任意函數符號積分、反轉換或 FFT；MATLAB 為可複製教材，網頁計算由 JavaScript 執行。

## 數學排版

使用專案內固定版本 KaTeX 0.19.1（MIT License），資源位於 assets/vendor/katex/，包含字型與 LICENSE，不依賴外部 CDN。行內使用 \(...\)，獨立公式使用 \[...\]（這裡示意 JSON 的跳脫寫法），解析後分別為單反斜線分隔符。

JSON 必須以序列化工具正確處理反斜線；分數使用 LaTeX frac、矩陣使用 bmatrix/array、聯立式使用 cases。math-renderer.js 以安全 DOM 節點與 KaTeX trust=false 渲染，排除 MATLAB、pre/code、輸入及原生選單。數學原文另保留於節點資料屬性，供備援及自動測試讀取；數值計算仍由原 calculators.js 執行。

KaTeX 載入失敗會顯示原始公式與提示；實際發布後仍須確認字型、公式捲動與公開網址。