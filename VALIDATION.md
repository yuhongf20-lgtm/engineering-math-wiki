# 維護驗證紀錄

日期：2026-11-17（Asia/Taipei）。本次目的為文件、規範與現況一致性維護；未上傳 GitHub、未執行 git push、未變更部署或網站樣式。此紀錄只代表當次檔案及測試環境，不代表後續修改已驗證。

## 變更與審查

- AGENTS.md：保留原規範，更新四分類／八筆記／八計算器現況；移除過時階段描述與不存在的 validate_data.py 執行指引；明列實際測試入口、JSON 型別及 manifest 登記規則、安全與數學查核、回歸、Graph／Loop、完成條件。第 14 節提供梯形法假設範例，沒有新增該功能。
- README.md：補專案入口、八種計算範圍、架構、本機啟動、現有測試與涵蓋限制、開發流程、擴充與 Pages 發布／驗收方式。保留八份教材 draft 事實。
- gaussian-elimination.json、gauss-jordan.json：只修正例題中被錯寫為連續分式的增廣列向量；數值分量與既有手算、MATLAB stages 相符。喬登解說的 i 不等於 k 改為正確 LaTeX。
- gauss-seidel.json：修正兩處殘差分式中誤放於分子的等號。
- fourier-transform.json：MATLAB 解說將重複的等號改為數學等號；MATLAB 原碼未動。
- 寫入上述四份 JSON 時，以解析後字串逐份比較 matlab_code，四份均完全相同。所有八份教材 status 仍為 draft，calculator_id 與 id 相同。
- 未修改 manifest、index.html、網站 JS／CSS、既有測試程式或 KaTeX 資源；未刪除筆記或計算器。

完整讀取了 AGENTS、README、manifest、四支網站 JS、HTML／CSS、scripts 測試與八份資料包。現有載入使用相對 fetch 路徑與 hash 導覽，符合靜態部署需求。KaTeX 使用本機固定版本、trust=false、嚴格語法檢查、原文備援及局部捲動；MATLAB 經 textContent 建立 code 節點並排除數學渲染。未發現需修改計算器邏輯的功能錯誤。

## 實際測試通過

| 檢查 | 環境／實際執行方式 | 結果及範圍 |
| --- | --- | --- |
| 既有 MATLAB packs 測試 | MATLAB R2025a，見下方命令 | `ALL FOUR MATLAB PACKS PASSED`；假位六輪、端點與拒絕輸入；高斯與喬登換列、矩陣階段、已知解、奇異／尺寸拒絕；賽德四輪、殘差、失敗分支 |
| 既有 MATLAB transforms 測試 | 同一 MATLAB 命令 | `ALL MATLAB TRANSFORM CHECKS PASSED`；單邊 ROC、複數結果、固定轉換對、Fourier 零／非零頻率及獨立數值積分 |
| 本機完整整站測試 | Edge 無視窗，HTTP `http://localhost:8765/scripts/calculators.test.html` | **576 項 PASS，ALL TESTS PASSED** |
| 本機 repository 子路徑測試 | 同一 HTTP 伺服器將 `/engineering-math-wiki/` 對應專案根；Edge 開啟 `/engineering-math-wiki/scripts/calculators.test.html` | **576 項 PASS，ALL TESTS PASSED**，確認資源與資料包可在子路徑載入 |
| 既有公開版本完整測試 | Edge 開啟 `https://yuhongf20-lgtm.github.io/engineering-math-wiki/scripts/calculators.test.html` | **576 項 PASS，ALL TESTS PASSED**；這是既有線上版本，不含本次未上傳修改 |
| 本機相對參照存在性 | PowerShell 逐一掃描 index.html、測試 HTML 的 src/href、KaTeX CSS url、manifest packs.path，再以 Test-Path 核對 | **81 個參照通過**，包括字型；不包含教材外部參考來源網址 |
| 文件 JSON 範本 | PowerShell 抽出 AGENTS.md 四個 json fenced blocks，逐一 ConvertFrom-Json | **4 個區塊可解析**；不代表梯形法已實作或已全面來源驗證 |
| 現況與 ID | ConvertFrom-Json 讀 manifest 及八份 JSON，加上整站測試的 validateManifest／validatePack | 四分類、八份 JSON、八個對應 calculator_id；全為 draft |
| 公開 HTTP 與 Repository | Invoke-WebRequest 首頁／data/manifest.json；網頁工具讀取公開 Repository | 首頁與 manifest **HTTP 200**，首頁內容為 Engineering Math Wiki，manifest 為 JSON；Repository 顯示 Public |

MATLAB 實際命令（專案根目錄）：

```powershell
& 'C:/Program Files/MATLAB/R2025a/bin/matlab.exe' -batch "addpath('scripts'); test_matlab_packs; test_matlab_transforms;"
```

程序 exit code 0；賽德的預期不收斂案例曾顯示非嚴格對角優勢警告，後續拒絕斷言與整體測試均通過。終端部分繁體中文顯示有編碼亂碼，英文 PASS／數值與結束標記可讀，不將其當成網頁編碼測試。

瀏覽器實際使用的命令形式（每個 URL 使用獨立暫存 profile／輸出檔）：

```powershell
& 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' --headless --disable-gpu --no-first-run --no-default-browser-check --user-data-dir="$taskDir/profile" --virtual-time-budget=60000 --dump-dom http://localhost:8765/scripts/calculators.test.html
```

`$taskDir` 是本次建立的系統暫存目錄；本機使用 PowerShell HttpListener 供應專案檔案，未加入網站後端。從執行後 DOM 的 `pre#report` 計算 PASS 行數並確認末行，沒有把 HTML 原始碼中的成功字串當作執行結果。重現時可依 README 用 Python HTTP Server，對應調整 URL／port。

完整測試頁實際執行五支現有 JS 測試，再檢查中英文名稱搜尋、四分類、八份詳情與所有非空教學欄位、八個 UI 的已知答案與錯誤分支、390px／1280px 溢出、KaTeX 實際渲染、語法、安全及缺載備援、MATLAB 逐字保留。根與轉換答案包含 sqrt(2)、精確分數、線性已知解、0.3−0.1j、1/3、0.4、6、12/π 及獨立積分；不是只確認「按鈕存在」。

## Loop 紀錄

- 第 0 輪審查：發現規範中的過時階段、缺少的 Python 驗證腳本描述、README 公開狀態過時，以及四份教材的局部數學排版錯誤。
- 第 1 輪修正：只修上述文件與公式問題；未改動數值算法。完成後本機、子路徑與公開既有版本的整站測試均通過。文件結構再核對時補列 VALIDATION.md，並明確區分非迭代方法的代入步驟。
- 未進入第 2／3 輪算法修正；沒有未解決的自動測試失敗。不將環境缺少工具或未執行驗收列為通過。

## 尚未測試／人工確認

- 兩支既有 MATLAB 測試未涵蓋二分法與牛頓法 MATLAB 原碼，本次沒有另外執行這兩份；JS 已知答案通過不能替代它們的 MATLAB 執行。
- 沒有 Node.js 可執行檔，未執行 README 的五個 `node` 命令；相同五支測試函式已由 Edge 測試頁實際執行通過。
- 尚未以人工逐頁視覺、真實手機、鍵盤或螢幕閱讀器驗收；390px／1280px 自動版面斷言不能取代這些項目。
- 八份教材的全面數學／來源逐項複核仍未完成，未重新查核所有外部來源連結或課本。資料維持 draft。
- 梯形法是文件範例；只驗證範例 JSON 可解析，未執行其 MATLAB、JS、UI 或來源查核，不列為第九份已實作內容。
- 本機沒有 .git 目錄，且 git 不在 PATH；已嘗試 git status，但無法產生 Git diff／提交狀態。修改依完整讀取的現有檔案局部進行，沒有執行 checkout、reset、commit 或 push。
- 本次修改尚未發布；公開測試通過只驗證既有線上版本。日後若獲授權上傳，需驗收新版本。公開 Repository 頁面可見同名巢狀資料夾，但 Pages 實際根路徑可載入並通過測試；未取得 Pages 設定，不推斷其部署方式，也未更動遠端結構。

## 對老師五項標準的證據

| 標準 | 可檢視證據 | 限制 |
| --- | --- | --- |
| 規則清楚具體 | AGENTS 第 1–9、12–13 節的目的、結構、JSON、數學安全及完成條件 | 仍須維護文件與程式同步 |
| AI 可持續修改 | 第 10 節逐階段輸入／工作／產出，第 11 節 Loop，第 14 節完整擴充範例 | 梯形法是未實作示範 |
| 網站與規則一致 | manifest／八份 JSON、八個 UI 及 KaTeX 回歸，局部錯誤公式已修正 | 全教材來源查核未完成，維持 draft |
| 可重用與延伸 | 獨立資料包、manifest、共用版型、純計算與 UI 分離；新增分類的固定接點有明確說明 | 側欄、數量徽章及數量測試仍需同步更新 |
| 正常瀏覽並公開 GitHub | Public Repository、Pages HTTP 200、公開既有版本 576 項測試通過 | 本次修改未上傳；人工視覺及新版本線上驗收待辦 |

上述是支持高分標準的具體證據，不保證老師評分，也不把未測項宣稱完成。