# 🦝 RaccoonAI Lottie Animation Library

高品質 Lottie 動畫資源庫，提供 CDN 支援，可直接用於網站和應用程式。

[![Validate Animations](https://github.com/kuku-work/RaccoonAI_lottie/actions/workflows/validate.yml/badge.svg)](https://github.com/kuku-work/RaccoonAI_lottie/actions/workflows/validate.yml)
[![Build and Deploy](https://github.com/kuku-work/RaccoonAI_lottie/actions/workflows/deploy.yml/badge.svg)](https://github.com/kuku-work/RaccoonAI_lottie/actions/workflows/deploy.yml)

## ✨ 特色

- 🚀 **CDN 支援** - 透過 jsDelivr CDN 全球快速存取
- 📦 **多種格式** - 原始檔案、Bundle 版本、壓縮版本
- 🖼️ **圖片資源管理** - 完整支援外部圖片和內嵌 Base64
- 🔍 **自動驗證** - GitHub Actions 自動檢查動畫完整性
- 📊 **動畫索引** - 自動生成 JSON 索引，方便程式化存取

## 🎯 快速開始

### CDN 使用方式

所有動畫都可透過 jsDelivr CDN 存取：

```
https://cdn.jsdelivr.net/gh/kuku-work/RaccoonAI_lottie@main/
```

### 基本使用範例

#### 方式 1：使用原始動畫（外部圖片）

適合自有網站，圖片會從相對路徑載入：

```html
<!-- 使用 lottie-web -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<div id="lottie-container"></div>
<script>
  lottie.loadAnimation({
    container: document.getElementById('lottie-container'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'https://cdn.jsdelivr.net/gh/kuku-work/RaccoonAI_lottie@main/animations/section-integration/animation.json'
  });
</script>
```

#### 方式 2：使用 Bundle 版本（圖片內嵌）

適合第三方網站，所有資源打包在單一檔案：

```html
<script>
  lottie.loadAnimation({
    container: document.getElementById('lottie-container'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    // 單一檔案，圖片已 Base64 內嵌
    path: 'https://cdn.jsdelivr.net/gh/kuku-work/RaccoonAI_lottie@main/dist/section-integration/bundle.json'
  });
</script>
```

#### 方式 3：使用 dotlottie-player

```html
<!-- 載入 dotlottie-player -->
<script src="https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs" type="module"></script>

<!-- 使用動畫 -->
<dotlottie-player
  src="https://cdn.jsdelivr.net/gh/kuku-work/RaccoonAI_lottie@main/animations/section-integration/animation.json"
  background="transparent"
  speed="1"
  style="width: 300px; height: 300px;"
  loop
  autoplay>
</dotlottie-player>
```

### React 使用範例

```jsx
import Lottie from 'react-lottie';
import { useEffect, useState } from 'react';

function AnimationComponent() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/gh/kuku-work/RaccoonAI_lottie@main/animations/section-integration/animation.json')
      .then(response => response.json())
      .then(data => setAnimationData(data));
  }, []);

  if (!animationData) return <div>Loading...</div>;

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  return <Lottie options={defaultOptions} height={400} width={400} />;
}
```

## 📁 目錄結構

```
RaccoonAI_lottie/
├── animations/                  # 原始動畫檔案
│   └── {animation-name}/       # 每個動畫獨立資料夾
│       ├── animation.json      # Lottie 動畫檔案
│       ├── images/             # 圖片資源（如有）
│       └── metadata.json       # 動畫元數據
├── dist/                       # 打包後的動畫
│   └── {animation-name}/
│       ├── bundle.json         # 圖片內嵌版本
│       └── animation.min.json  # 壓縮版本
├── scripts/                    # 工具腳本
│   ├── validate.js            # 驗證動畫
│   ├── bundle.js              # 打包動畫
│   ├── optimize.js            # 壓縮動畫
│   └── generate-index.js      # 生成索引
└── index.json                  # 動畫索引
```

## 🔍 動畫索引 API

透過 `index.json` 取得所有可用動畫：

```javascript
fetch('https://cdn.jsdelivr.net/gh/kuku-work/RaccoonAI_lottie@main/index.json')
  .then(response => response.json())
  .then(index => {
    console.log('可用動畫：', index.animations);

    // 取得特定動畫資訊
    const animation = index.animations['section-integration'];
    console.log('動畫 URL：', animation.urls.original);
    console.log('Bundle URL：', animation.urls.bundle);
  });
```

### 索引結構

```json
{
  "version": "1.0.0",
  "totalAnimations": 1,
  "categories": {
    "illustrations": ["section-integration"]
  },
  "animations": {
    "section-integration": {
      "name": "Section Integration",
      "category": "illustrations",
      "hasImages": true,
      "urls": {
        "original": "...",
        "bundle": "...",
        "metadata": "..."
      },
      "properties": {
        "dimensions": "1200x1200",
        "duration": "15s",
        "frameRate": 30
      }
    }
  }
}
```

## 🛠️ 開發者指南

### 新增動畫

1. 在 `animations/` 建立新資料夾
2. 加入 `animation.json` 檔案
3. 如有圖片，放在 `images/` 子資料夾
4. 建立 `metadata.json` 描述檔

### 本地開發

```bash
# 安裝依賴
npm install

# 驗證所有動畫
npm run validate

# 打包動畫（生成 bundle 版本）
npm run bundle

# 壓縮動畫
npm run optimize

# 生成索引
npm run generate-index

# 執行完整建置
npm run build
```

### 檔案格式說明

#### metadata.json

```json
{
  "name": "動畫名稱",
  "id": "animation-id",
  "description": "動畫描述",
  "category": "icons|illustrations|brand",
  "tags": ["tag1", "tag2"],
  "hasImages": true,
  "imageCount": 20,
  "dimensions": {
    "width": 1200,
    "height": 1200
  },
  "duration": 15,
  "frameRate": 30
}
```

## 🔄 版本格式選擇指南

| 格式 | 檔案路徑 | 適用場景 | 優點 | 缺點 |
|------|---------|---------|------|------|
| **原始版** | `/animations/{name}/animation.json` | 自有網站 | 檔案較小、圖片可快取 | 需要多次請求 |
| **Bundle** | `/dist/{name}/bundle.json` | 第三方網站 | 單一檔案、無需額外請求 | 檔案較大（Base64） |
| **壓縮版** | `/dist/{name}/animation.min.json` | 需要節省流量 | 檔案最小 | 需處理圖片路徑 |

## ⚡ 效能建議

1. **使用適當的渲染器**
   - `svg`: 適合大部分場景，支援縮放
   - `canvas`: 適合複雜動畫，效能較好
   - `html`: 適合簡單動畫

2. **預載動畫**
   ```javascript
   // 預先載入動畫資料
   const preloadAnimation = async (url) => {
     const response = await fetch(url);
     return await response.json();
   };
   ```

3. **延遲載入**
   ```javascript
   // 使用 Intersection Observer 延遲載入
   const observer = new IntersectionObserver(entries => {
     entries.forEach(entry => {
       if (entry.isIntersecting) {
         // 載入動畫
       }
     });
   });
   ```

## 📄 授權

MIT License - 可自由使用於商業和非商業專案

## 🤝 貢獻

歡迎提交 Pull Request！請確保：

1. 動畫通過驗證 (`npm run validate`)
2. 包含 metadata.json
3. 圖片檔案經過適當壓縮

## 📞 聯絡

- GitHub: [kuku-work/RaccoonAI_lottie](https://github.com/kuku-work/RaccoonAI_lottie)
- Issues: [回報問題](https://github.com/kuku-work/RaccoonAI_lottie/issues)

---

Made with ❤️ by RaccoonAI Team