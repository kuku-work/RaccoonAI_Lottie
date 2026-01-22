# RaccoonAI Lottie Animation Library - 專案開發指南

> 高品質 Lottie 動畫資源庫，提供 CDN 支援與多種打包格式

**最後更新**: 2026-01-22
**版本**: 1.0.0

---

## 📋 專案概述

### 核心目標
提供可直接透過 CDN 使用的 Lottie 動畫資源庫，支援三種使用場景：
1. **原始版本** - 自有網站，圖片外部載入
2. **Bundle 版本** - 第三方網站，圖片 Base64 內嵌
3. **壓縮版本** - 節省流量，最小化檔案

### 設計理念

**資料結構優先**
- 動畫、圖片、元數據分離存放
- 單一來源真相（animations/）→ 衍生格式（dist/）
- metadata.json 作為動畫的結構化描述

**零破壞性**
- 原始檔案永不修改
- 所有處理結果輸出到 dist/
- 完整保留圖片路徑資訊

**簡潔實用**
- 工具腳本各司其職，不做多餘事情
- 驗證 → 打包 → 壓縮 → 索引，流程清晰
- 自動化 CI/CD，減少人為錯誤

---

## 🏗️ 架構設計

### 目錄結構（三層設計）

```
RaccoonAI_lottie/
├── animations/                    # [來源層] 原始動畫檔案
│   └── {animation-name}/
│       ├── animation.json         # Lottie 動畫定義
│       ├── images/                # 外部圖片資源
│       │   ├── img_0.png
│       │   └── img_1.png
│       └── metadata.json          # 動畫元數據（必須）
│
├── dist/                          # [處理層] 打包後的動畫
│   └── {animation-name}/
│       ├── bundle.json            # 圖片 Base64 內嵌版本
│       └── animation.min.json    # 壓縮版本
│
├── scripts/                       # [工具層] 自動化腳本
│   ├── validate.js               # 驗證動畫完整性
│   ├── bundle.js                 # 打包圖片到 JSON
│   ├── optimize.js               # 壓縮動畫檔案
│   └── generate-index.js         # 生成動畫索引
│
└── index.json                     # 動畫索引（自動生成）
```

### 資料流向

```
animations/{name}/
  ├── animation.json ──┐
  ├── images/         │
  └── metadata.json   │
                      │
                      ├─→ [validate.js] 驗證
                      │
                      ├─→ [bundle.js]
                      │     └─→ dist/{name}/bundle.json
                      │
                      ├─→ [optimize.js]
                      │     └─→ dist/{name}/animation.min.json
                      │
                      └─→ [generate-index.js]
                            └─→ index.json
```

---

## 🔧 開發工作流程

### 新增動畫（標準流程）

#### 1. 建立動畫資料夾
```bash
# 使用小寫字母和連字符
mkdir -p animations/new-animation-name
cd animations/new-animation-name
```

#### 2. 放置檔案
```bash
# 必要檔案
animations/new-animation-name/
├── animation.json      # 從 After Effects 匯出的 Lottie JSON
└── metadata.json       # 手動建立（見下方範本）

# 選用檔案（如動畫包含圖片）
└── images/
    ├── img_0.png
    ├── img_1.png
    └── ...
```

#### 3. 建立 metadata.json
```json
{
  "name": "Animation Display Name",
  "id": "new-animation-name",
  "description": "簡短描述動畫內容與用途",
  "version": "1.0.0",
  "author": "RaccoonAI",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "icons|illustrations|brand",
  "hasImages": true,
  "imageCount": 5,
  "dimensions": {
    "width": 1200,
    "height": 1200
  },
  "duration": 10,
  "frameRate": 30,
  "frames": 300,
  "fileSize": {
    "animation": "500KB",
    "images": "estimated",
    "total": "estimated"
  },
  "createdAt": "2026-01-22",
  "updatedAt": "2026-01-22"
}
```

**欄位說明**：
- `id`: 必須與資料夾名稱相同
- `category`: 只能是 `icons`, `illustrations`, `brand` 其中一個
- `hasImages`: 如有 images/ 資料夾設為 `true`
- `imageCount`: 實際圖片數量
- `duration`: 動畫秒數
- `frames`: frameRate × duration

#### 4. 驗證動畫
```bash
npm run validate

# 驗證項目：
# ✓ animation.json 是否存在且為有效 JSON
# ✓ metadata.json 是否存在且符合規範
# ✓ images/ 目錄中的圖片數量是否與 imageCount 一致
# ✓ animation.json 中的圖片引用路徑是否正確
```

#### 5. 建置所有格式
```bash
npm run build

# 等同於依序執行：
# npm run validate         → 驗證
# npm run bundle          → 生成 bundle.json
# npm run optimize        → 生成 animation.min.json
# npm run generate-index  → 更新 index.json
```

#### 6. 提交變更
```bash
git add .
git commit -m "$(cat <<'EOF'
feat(animations): add new-animation-name

Add animation for [用途說明]
- Size: 1200x1200
- Duration: 10s
- Images: 5

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## 📦 工具腳本說明

### validate.js - 驗證動畫完整性

**功能**：
- 檢查 animation.json 和 metadata.json 是否存在
- 驗證 JSON 格式正確性
- 驗證 metadata.json 必要欄位
- 檢查圖片數量與 metadata 是否一致
- 檢查圖片路徑引用正確性

**使用時機**：
- 新增動畫後
- 修改 metadata.json 後
- 提交前
- CI/CD 流程中

**執行**：
```bash
npm run validate
```

**輸出範例**：
```
✓ section-integration: Valid
  - animation.json: ✓
  - metadata.json: ✓
  - images: 20/20
```

---

### bundle.js - 打包圖片到 JSON

**功能**：
- 讀取 animation.json 和外部圖片
- 將圖片轉換為 Base64
- 替換 animation.json 中的圖片路徑為 Base64 dataURL
- 輸出到 dist/{name}/bundle.json

**使用時機**：
- 動畫包含外部圖片
- 需要單一檔案部署
- 第三方網站整合

**執行**：
```bash
npm run bundle
```

**處理邏輯**：
```javascript
// 原始 animation.json
{
  "assets": [{
    "u": "images/",  // 圖片目錄
    "p": "img_0.png" // 圖片檔名
  }]
}

// bundle.json
{
  "assets": [{
    "u": "",
    "p": "data:image/png;base64,iVBORw0KGgo..."
  }]
}
```

---

### optimize.js - 壓縮動畫檔案

**功能**：
- 移除 JSON 中的空白和換行
- 保持圖片路徑不變
- 輸出到 dist/{name}/animation.min.json

**使用時機**：
- 需要最小化檔案大小
- 生產環境部署

**執行**：
```bash
npm run optimize
```

**壓縮效果**：
- 原始檔案：~1.3MB
- 壓縮後：~800KB（減少 ~40%）

---

### generate-index.js - 生成動畫索引

**功能**：
- 掃描 animations/ 目錄
- 讀取每個動畫的 metadata.json
- 生成統一的 index.json
- 按 category 分類

**使用時機**：
- 新增動畫後
- 修改 metadata 後
- 建置流程最後一步

**執行**：
```bash
npm run generate-index
```

**生成的 index.json 結構**：
```json
{
  "version": "1.0.0",
  "generatedAt": "2026-01-22T10:00:00.000Z",
  "totalAnimations": 2,
  "categories": {
    "illustrations": ["section-integration"],
    "icons": ["loading-spinner"]
  },
  "animations": {
    "section-integration": {
      "name": "Section Integration",
      "category": "illustrations",
      "hasImages": true,
      "urls": {
        "original": "https://cdn.jsdelivr.net/.../animation.json",
        "bundle": "https://cdn.jsdelivr.net/.../bundle.json",
        "minified": "https://cdn.jsdelivr.net/.../animation.min.json",
        "metadata": "https://cdn.jsdelivr.net/.../metadata.json"
      },
      "properties": {
        "dimensions": "1200x1200",
        "duration": "15s",
        "frameRate": 30,
        "frames": 450
      }
    }
  }
}
```

---

## 📐 檔案格式規範

### animation.json（Lottie 格式）

**來源**：After Effects 透過 Bodymovin 外掛匯出
**要求**：
- 必須是有效的 JSON 格式
- 包含完整的 Lottie 動畫定義
- 圖片路徑使用相對路徑（`images/img_0.png`）

**檢查要點**：
```json
{
  "v": "5.7.4",          // Lottie 版本
  "fr": 30,              // Frame rate
  "ip": 0,               // In Point
  "op": 450,             // Out Point (frames)
  "w": 1200,             // Width
  "h": 1200,             // Height
  "assets": [            // 資源定義
    {
      "id": "image_0",
      "w": 200,
      "h": 200,
      "u": "images/",    // 圖片目錄
      "p": "img_0.png"   // 圖片檔名
    }
  ],
  "layers": [...]        // 圖層定義
}
```

---

### metadata.json（動畫元數據）

**用途**：結構化描述動畫屬性，用於索引生成與文檔

**必要欄位**：
```json
{
  "name": "string",           // 必須：顯示名稱
  "id": "string",             // 必須：唯一識別碼（同資料夾名）
  "description": "string",    // 必須：動畫描述
  "version": "string",        // 必須：版本號（SemVer）
  "author": "string",         // 必須：作者
  "tags": ["string"],         // 必須：標籤陣列
  "category": "string",       // 必須：類別（icons|illustrations|brand）
  "hasImages": boolean,       // 必須：是否包含圖片
  "imageCount": number,       // 必須：圖片數量（0 如無圖片）
  "dimensions": {             // 必須：尺寸
    "width": number,
    "height": number
  },
  "duration": number,         // 必須：秒數
  "frameRate": number,        // 必須：FPS
  "frames": number,           // 必須：總幀數
  "fileSize": {               // 必須：檔案大小
    "animation": "string",
    "images": "string",
    "total": "string"
  },
  "createdAt": "YYYY-MM-DD",  // 必須：建立日期
  "updatedAt": "YYYY-MM-DD"   // 必須：更新日期
}
```

**選用欄位**：
```json
{
  "license": "string",        // 授權
  "source": "string",         // 來源網址
  "thumbnail": "string",      // 縮圖路徑
  "keywords": ["string"],     // 關鍵字
  "compatibility": {          // 相容性
    "web": boolean,
    "ios": boolean,
    "android": boolean
  }
}
```

**驗證規則**：
- `id` 必須與資料夾名稱完全一致
- `category` 只能是 `icons`, `illustrations`, `brand`
- `imageCount` 必須與實際 images/ 目錄中的檔案數量一致
- `frames` 應等於 `frameRate × duration`
- `version` 必須符合 SemVer 格式（如 `1.0.0`）

---

## 🎯 Git 提交規範

### Commit Message 格式

使用 Conventional Commits，針對動畫庫的特定規範：

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Type 定義

| Type | 使用時機 | 範例 |
|------|---------|------|
| `feat(animations)` | 新增動畫 | `feat(animations): add loading-spinner` |
| `feat(scripts)` | 新增工具功能 | `feat(scripts): add preview server` |
| `fix(animations)` | 修復動畫問題 | `fix(animations): correct section-integration image paths` |
| `fix(scripts)` | 修復工具問題 | `fix(scripts): bundle script handling base64` |
| `docs` | 文檔更新 | `docs: update CDN usage examples` |
| `chore(build)` | 建置流程 | `chore(build): update GitHub Actions workflow` |
| `refactor(animations)` | 重構動畫結構 | `refactor(animations): reorganize to standard structure` |
| `perf(scripts)` | 效能優化 | `perf(scripts): optimize image compression` |

### Commit 範例

#### 新增動畫
```bash
git commit -m "$(cat <<'EOF'
feat(animations): add payment-success animation

Add success animation for payment confirmation
- Size: 800x800
- Duration: 3s
- Images: 8
- Category: icons

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

#### 修復動畫
```bash
git commit -m "$(cat <<'EOF'
fix(animations): correct login-form image references

Fixed incorrect image path in assets definition
- Updated u property from 'img/' to 'images/'
- Regenerated bundle.json

Fixes #15

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

#### 更新工具
```bash
git commit -m "$(cat <<'EOF'
feat(scripts): add image optimization to bundle process

Bundle script now compresses images before Base64 encoding
- Uses sharp library for compression
- Reduces bundle size by ~30%

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

### 提交前檢查清單

- [ ] `npm run validate` 通過
- [ ] `npm run build` 成功
- [ ] dist/ 目錄已包含新的建置檔案
- [ ] index.json 已更新
- [ ] metadata.json 所有必要欄位完整
- [ ] Commit message 符合格式
- [ ] 未包含 node_modules/ 或其他不必要檔案

---

## 🔄 CI/CD 流程

### GitHub Actions 工作流程

專案包含兩個主要 workflow：

#### 1. validate.yml - 驗證動畫
**觸發時機**：
- Push 到任何分支
- Pull Request

**執行步驟**：
```yaml
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run validation (npm run validate)
```

**目的**：確保所有動畫檔案結構正確

---

#### 2. deploy.yml - 建置與部署
**觸發時機**：
- Push 到 main 分支

**執行步驟**：
```yaml
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run full build (npm run build)
   ├─ validate
   ├─ bundle
   ├─ optimize
   └─ generate-index
5. Commit built files
6. Push to main
```

**目的**：自動生成所有打包格式與索引

---

### 本地開發與 CI 的差異

| 操作 | 本地開發 | CI/CD |
|------|---------|-------|
| 驗證 | 手動執行 `npm run validate` | 自動執行（每次 push） |
| 建置 | 手動執行 `npm run build` | 自動執行（main 分支） |
| 提交 | 手動提交 dist/ 變更 | 自動提交建置結果 |

**最佳實踐**：
- 本地開發時，執行 `npm run build` 確保建置成功
- 提交時可選擇性包含 dist/（CI 會重新生成）
- 依賴 CI 確保 index.json 保持最新

---

## ⚡ 效能優化策略

### 三種格式的選擇策略

#### 原始版本（animations/{name}/animation.json）

**優點**：
- 檔案最小（不含 Base64）
- 圖片可單獨快取
- 易於除錯與修改

**缺點**：
- 需要多次 HTTP 請求
- 圖片路徑必須正確
- 不適合第三方嵌入

**適用場景**：
- 自有網站控制完整路徑
- 需要頻繁修改動畫
- 開發與測試階段

**CDN 路徑**：
```
https://cdn.jsdelivr.net/gh/kuku-work/RaccoonAI_lottie@main/animations/{name}/animation.json
```

---

#### Bundle 版本（dist/{name}/bundle.json）

**優點**：
- 單一檔案，零外部依賴
- 適合第三方網站嵌入
- 不需處理圖片路徑

**缺點**：
- 檔案較大（Base64 編碼增加 ~33%）
- 圖片無法單獨快取
- 修改圖片需重新打包

**適用場景**：
- 第三方網站嵌入
- 需要離線使用
- 簡化部署流程

**CDN 路徑**：
```
https://cdn.jsdelivr.net/gh/kuku-work/RaccoonAI_lottie@main/dist/{name}/bundle.json
```

**範例**：
```html
<script>
  lottie.loadAnimation({
    container: document.getElementById('lottie'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    // 單一檔案，無需額外請求
    path: 'https://cdn.jsdelivr.net/gh/kuku-work/RaccoonAI_lottie@main/dist/section-integration/bundle.json'
  });
</script>
```

---

#### 壓縮版本（dist/{name}/animation.min.json）

**優點**：
- 檔案最小（移除空白）
- 減少傳輸時間
- 適合生產環境

**缺點**：
- 不易閱讀與除錯
- 仍需處理圖片路徑
- 需配合原始版本的圖片

**適用場景**：
- 生產環境部署
- 頻寬受限環境
- 大型動畫檔案

**CDN 路徑**：
```
https://cdn.jsdelivr.net/gh/kuku-work/RaccoonAI_lottie@main/dist/{name}/animation.min.json
```

---

### 格式選擇決策樹

```
是否為自有網站？
├─ 是 → 需要最小檔案？
│        ├─ 是 → 使用 animation.min.json（壓縮版）
│        └─ 否 → 使用 animation.json（原始版）
│
└─ 否 → 使用 bundle.json（Bundle 版）
```

---

### 效能最佳實踐

#### 1. 預載動畫資料
```javascript
// 避免重複載入
const animationCache = new Map();

async function loadAnimation(name, format = 'bundle') {
  const cacheKey = `${name}-${format}`;

  if (animationCache.has(cacheKey)) {
    return animationCache.get(cacheKey);
  }

  const url = `https://cdn.jsdelivr.net/gh/kuku-work/RaccoonAI_lottie@main/dist/${name}/${format}.json`;
  const response = await fetch(url);
  const data = await response.json();

  animationCache.set(cacheKey, data);
  return data;
}
```

#### 2. 延遲載入（Lazy Loading）
```javascript
// 使用 Intersection Observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const container = entry.target;
      const animationName = container.dataset.animation;

      loadAnimation(animationName).then(data => {
        lottie.loadAnimation({
          container: container,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: data
        });
      });

      observer.unobserve(container);
    }
  });
}, { rootMargin: '50px' });

// 觀察所有動畫容器
document.querySelectorAll('[data-animation]').forEach(el => {
  observer.observe(el);
});
```

#### 3. 選擇適當的渲染器
```javascript
// 根據動畫複雜度選擇
const renderOptions = {
  simple: 'svg',      // 簡單動畫，支援縮放
  complex: 'canvas',  // 複雜動畫，效能較好
  text: 'html'        // 文字動畫
};

lottie.loadAnimation({
  renderer: renderOptions.complex,  // 根據需求選擇
  // ...
});
```

---

## 🛡️ 安全性與最佳實踐

### 檔案安全
- ❌ 絕不提交 `.env` 或敏感資料
- ✅ 確保 `.gitignore` 包含 `node_modules/`
- ✅ 圖片檔案檢查惡意程式碼

### 路徑安全
- ✅ 使用相對路徑（`images/img_0.png`）
- ❌ 避免絕對路徑（`/absolute/path/img.png`）
- ❌ 避免路徑遍歷（`../../../etc/passwd`）

### JSON 驗證
- ✅ 所有 JSON 必須通過 `JSON.parse()` 驗證
- ✅ 檢查必要欄位存在
- ❌ 不信任使用者輸入的 JSON

---

## 🚀 常見任務快速參考

### 新增動畫
```bash
# 1. 建立資料夾
mkdir -p animations/my-animation

# 2. 放置檔案（animation.json, images/, metadata.json）

# 3. 驗證與建置
npm run build

# 4. 提交
git add .
git commit -m "feat(animations): add my-animation"
git push
```

### 更新現有動畫
```bash
# 1. 修改檔案
# 2. 更新 metadata.json 的 updatedAt 和 version
# 3. 重新建置
npm run build

# 4. 提交
git commit -m "fix(animations): update my-animation v1.1.0"
```

### 驗證所有動畫
```bash
npm run validate
```

### 重新生成索引
```bash
npm run generate-index
```

### 預覽動畫
```bash
npm run preview
# 開啟瀏覽器至 http://localhost:3000
```

---

## 📚 參考資源

### Lottie 相關
- [Lottie 官方文檔](https://airbnb.io/lottie/)
- [lottie-web GitHub](https://github.com/airbnb/lottie-web)
- [Bodymovin After Effects Plugin](https://aescripts.com/bodymovin/)

### CDN
- [jsDelivr 文檔](https://www.jsdelivr.com/)
- [jsDelivr GitHub Integration](https://www.jsdelivr.com/?docs=gh)

### 專案相關
- [RaccoonAI Lottie GitHub](https://github.com/kuku-work/RaccoonAI_lottie)
- [Issues](https://github.com/kuku-work/RaccoonAI_lottie/issues)

---

## 🤔 故障排除

### 驗證失敗
```
❌ animation-name: Invalid
  - animation.json: File not found
```

**解決方案**：
- 確認 `animations/{name}/animation.json` 存在
- 檢查檔名大小寫是否正確

---

### 圖片數量不符
```
❌ animation-name: Image count mismatch
  - Expected: 20
  - Found: 18
```

**解決方案**：
- 檢查 `images/` 目錄中的檔案數量
- 更新 `metadata.json` 的 `imageCount`
- 確認 animation.json 中引用的圖片都存在

---

### Bundle 生成失敗
```
Error: Cannot read image: images/img_0.png
```

**解決方案**：
- 確認圖片路徑正確
- 檢查圖片檔案格式（支援 PNG, JPG, SVG）
- 確認圖片未損壞

---

### CDN 無法載入
```
404 Not Found
```

**解決方案**：
- 確認已 push 到 GitHub
- 等待 jsDelivr 快取更新（最多 12 小時）
- 使用 `@latest` 或特定 commit hash 強制更新

---

## 📝 版本記錄

**v1.0.0** (2026-01-22)
- 初始版本
- 建立專案架構與工具腳本
- 定義開發流程與規範
- 新增 section-integration 動畫

---

**文件維護**: 當專案架構或流程有重大變更時，請更新此文件
**問題回報**: [GitHub Issues](https://github.com/kuku-work/RaccoonAI_lottie/issues)
