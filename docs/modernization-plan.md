# 现代化升级路线

## 升级完成状态

| 阶段 | 状态 | 完成日期 |
|------|------|----------|
| 阶段一：基础现代化 | ✅ 已完成 | 2026-06-26 |
| 阶段二：ESM 迁移 | ✅ 已完成 | 2026-06-26 |
| 阶段三：CLI 现代化 | ✅ 已完成 | 2026-06-26 |
| 阶段四：TypeScript 迁移 | ✅ 已完成 | 2026-06-26 |
| 阶段五：代码质量 | ✅ 已完成 | 2026-06-26 |

## 当前技术栈（升级后）

| 组件 | 版本 | 状态 |
|------|------|------|
| Node.js | v22.22.1 | ✅ 现代 |
| 包管理器 | pnpm 10.32.1 | ✅ 现代 |
| 模块系统 | ESM | ✅ 现代 |
| HTTP 客户端 | 原生 fetch | ✅ 现代 |
| CLI 解析 | commander 15.0.0 | ✅ 现代 |
| 进度显示 | ora 9.4.1 | ✅ 现代 |
| TypeScript | 6.0.3 | ✅ 现代 |
| 测试框架 | vitest 4.1.9 | ✅ 现代 |
| Lint | oxlint 1.71.0 | ✅ 现代 |
| Format | oxfmt 0.56.0 | ✅ 现代 |
| 构建工具 | tsup 8.5.1 + tsx 4.22.4 | ✅ 现代 |

## 原始技术栈分析

| 组件 | 当前版本 | 问题 |
|------|----------|------|
| Node.js | 未指定 | 应明确最低版本要求 |
| 包管理器 | yarn | 应迁移到 pnpm |
| 模块系统 | CommonJS | 过时，应迁移到 ESM |
| HTTP 客户端 | `request` | **已废弃**（2020年2月） |
| CLI 解析 | `minimist` | 功能简单，缺乏验证 |
| 进度显示 | `ora` v5 | 可接受，但有更新版本 |
| TypeScript | 无 | 缺乏类型安全 |
| 测试框架 | 无 | 无测试覆盖 |
| 代码规范 | 无 | 无 lint/format |
| 构建工具 | 无 | 直接运行 JS |

## 升级阶段

### 阶段一：基础现代化（低风险）

**目标：** 更新依赖，明确运行环境，迁移到 pnpm

1. **明确 Node.js 版本要求**
   ```json
   {
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

2. **迁移到 pnpm**

   pnpm 更快、更节省磁盘空间，且与 Node.js Corepack 集成良好。

   ```bash
   # 启用 Corepack（Node.js 16.13+）
   corepack enable

   # 安装 pnpm
   corepack prepare pnpm@latest --activate

   # 删除 yarn.lock，生成 pnpm-lock.yaml
   rm yarn.lock
   pnpm install
   ```

   在 `package.json` 中指定包管理器：
   ```json
   {
     "packageManager": "pnpm@9.0.0"
   }
   ```

3. **替换废弃的 `request` 库**

   | 选项 | 优点 | 缺点 |
   |------|------|------|
   | 原生 `fetch()` | 零依赖，Node 18+ 内置 | 流式处理 API 不同 |
   | `got` | 功能丰富，重试机制 | 包体积较大 |
   | `axios` | API 与 request 相似 | 额外依赖 |

   **推荐：** 原生 `fetch()` — 零依赖，现代标准

3. **更新 `ora` 到最新版本**

### 阶段二：ESM 迁移（中风险）

**目标：** 迁移到 ES Modules

1. **启用 ESM**
   ```json
   {
     "type": "module"
   }
   ```

2. **转换语法**
   ```javascript
   // 旧：CommonJS
   const fs = require('fs');
   module.exports = {};

   // 新：ESM
   import fs from 'node:fs';
   export default {};
   ```

3. **使用 `node:` 协议**
   ```javascript
   import fs from 'node:fs';
   import path from 'node:path';
   import { exec } from 'node:child_process';
   ```

### 阶段三：CLI 现代化（中风险）

**目标：** 改进 CLI 体验

| 选项 | 特点 |
|------|------|
| `commander` | 最流行，简单直观 |
| `yargs` | 功能丰富，自动帮助生成 |
| `cac` | 轻量级，Vite 生态使用 |

**推荐：** `commander` — 简单直观，社区活跃

```javascript
import { program } from 'commander';

program
  .name('m3u8-downloader')
  .description('Download m3u8 streaming video')
  .requiredOption('--url <url>', 'm3u8 playlist URL')
  .requiredOption('--finalName <name>', 'output filename')
  .option('--target <path>', 'output directory')
  .parse();
```

### 阶段四：TypeScript 迁移（高风险）

**目标：** 添加类型安全

1. **安装 TypeScript**
   ```bash
   pnpm add -D typescript @types/node
   ```

2. **创建 `tsconfig.json`**
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "Node16",
       "moduleResolution": "Node16",
       "strict": true,
       "esModuleInterop": true,
       "outDir": "./dist",
       "rootDir": "./src"
     },
     "include": ["src/**/*"]
   }
   ```

3. **目录结构调整**
   ```
   m3u8Downloader/
   ├─ src/
   │  ├─ main.ts
   │  └─ down.ts
   ├─ dist/           # 编译输出
   └─ package.json
   ```

4. **构建工具选择**

   | 工具 | 特点 |
   |------|------|
   | `tsc` | 官方，稳定 |
   | `tsup` | 基于 esbuild，快速，支持 ESM/CJS 双输出 |
   | `tsx` | 开发时直接运行 TS，无需编译 |

   **推荐：** `tsx` 开发 + `tsup` 构建

### 阶段五：代码质量（低风险）

**目标：** 添加 lint 和格式化

1. **Lint 工具：oxlint**

   [oxlint](https://oxc-project.github.io/docs/guide/usage/linter) 是基于 Rust 实现的超快 linter，比 ESLint 快 50-100 倍。

   ```bash
   # 安装
   pnpm add -D oxlint

   # 运行
   pnpm oxlint src/

   # 自动修复
   pnpm oxlint --fix src/
   ```

   配置文件 `.oxlintrc.json`：
   ```json
   {
     "rules": {
       "no-unused-vars": "error",
       "no-undef": "error",
       "eqeqeq": "warn"
     }
   }
   ```

2. **格式化工具：oxfmt**

   [oxfmt](https://oxc-project.github.io/docs/guide/usage/formatter) 是基于 Rust 实现的超快格式化工具，比 Prettier 快 20-30 倍。

   ```bash
   # 安装
   pnpm add -D oxfmt

   # 运行
   pnpm oxfmt src/

   # 检查格式（不修改）
   pnpm oxfmt --check src/
   ```

3. **添加测试框架**

   | 框架 | 特点 |
   |------|------|
   | `vitest` | 现代，ESM 原生支持（推荐） |
   | `node:test` | Node.js 内置，零依赖 |
   | `jest` | 生态丰富，但 ESM 支持较弱 |

### 阶段六：高级功能（可选）

1. **并发下载** — 使用 `Promise.all` 并行下载 TS 分片
2. **断点续传** — 记录下载进度，支持恢复
3. **进度条** — 使用 `cli-progress` 显示下载进度百分比
4. **配置文件** — 支持 `m3u8-downloader.config.js`
5. **日志系统** — 使用 `pino` 或 `winston` 替代 console.log

## 推荐升级顺序

```
阶段一（基础）→ 阶段二（ESM）→ 阶段五（代码质量）→ 阶段三（CLI）→ 阶段四（TypeScript）
```

**理由：**
- 先解决废弃依赖（紧急）
- ESM 迁移是后续所有现代化的基础
- 代码质量工具帮助保证重构安全
- CLI 和 TypeScript 可以并行进行

## 快速升级方案（最小改动）

如果希望最小改动，只做以下更新：

1. 迁移到 pnpm
2. 替换 `request` 为原生 `fetch`
3. 添加 Node.js 版本要求
4. 更新 `ora` 到最新版本

```bash
# 迁移到 pnpm
corepack enable
corepack prepare pnpm@latest --activate
rm yarn.lock
pnpm install

# 移除废弃依赖
pnpm remove request

# 更新 ora
pnpm add ora@latest

# 添加 Node.js 版本要求和 packageManager 到 package.json
```

## 完整升级方案（目标状态）

```json
{
  "name": "m3u8-downloader",
  "version": "2.0.0",
  "type": "module",
  "packageManager": "pnpm@10.32.1",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "dev": "tsx src/main.ts",
    "build": "tsup src/main.ts --format esm",
    "start": "node dist/main.js",
    "lint": "oxlint src/",
    "lint:fix": "oxlint --fix src/",
    "format": "oxfmt src/",
    "format:check": "oxfmt --check src/",
    "test": "vitest"
  },
  "dependencies": {
    "commander": "^15.0.0",
    "ora": "^9.4.1"
  },
  "devDependencies": {
    "typescript": "^6.0.3",
    "@types/node": "^26.0.1",
    "tsup": "^8.5.1",
    "tsx": "^4.22.4",
    "vitest": "^4.1.9",
    "oxlint": "^1.71.0",
    "oxfmt": "^0.56.0"
  }
}
```

## 参考资源

- [pnpm 文档](https://pnpm.io/)
- [Node.js Corepack](https://nodejs.org/api/corepack.html)
- [Node.js Fetch API 文档](https://nodejs.org/api/globals.html#fetch)
- [Commander.js GitHub](https://github.com/tj/commander.js)
- [TypeScript Node.js 指南](https://www.typescriptlang.org/docs/handbook/esm-node.html)
- [oxlint 文档](https://oxc-project.github.io/docs/guide/usage/linter)
- [oxfmt 文档](https://oxc-project.github.io/docs/guide/usage/formatter)
- [Vitest 测试框架](https://vitest.dev/)
