# 架构说明

## 系统概览

m3u8Downloader 采用两阶段处理流程：

1. **解析阶段** (`src/main.ts`) - 获取播放列表，解析 TS 分段
2. **下载合并阶段** (`src/down.ts`) - 下载分片，FFmpeg 合并输出

## 模块职责

### src/main.ts - 入口模块

**职责：**
- CLI 参数解析（commander）
- m3u8 播放列表获取（原生 fetch）
- TS 分段按 `#EXT-X-DISCONTINUITY` 分组
- 调用下载引擎

**数据流：**
```
CLI args → URL 获取 → m3u8 解析 → TS 分组 → download()
```

**关键逻辑：**
- 使用正则 `/#EXT-X-DISCONTINUITY/` 检测分段边界
- TS URL 通过 `line.match(/.ts/)` 提取
- 生成 UUID 用于临时目录命名

### src/down.ts - 下载引擎

**职责：**
- TS 文件顺序下载（原生 fetch）
- 临时目录管理
- FFmpeg 合并调度
- 结果文件处理

**数据流：**
```
TS 列表 → 顺序下载 → ffconcat 配置 → FFmpeg 合成 → 输出 MP4
```

## 处理流程

### 单分段播放列表

```
m3u8 → [ts1, ts2, ts3, ...] → 下载 → ffconcat → output.mp4
```

### 多分段播放列表（含 DISCONTINUITY）

```
m3u8 → [section0: ts1,ts2], [section1: ts3,ts4], ...
     → 各分段独立下载
     → 各分段独立合并为 section0.mp4, section1.mp4, ...
     → 转换为 TS 格式
     → 二次合并为 output.mp4
```

## 目录结构

```
m3u8Downloader/
├─ src/
│  ├─ main.ts        # 入口模块
│  └─ down.ts        # 下载引擎
├─ dist/             # 构建输出（gitignore）
├─ package.json      # 项目配置
├─ tsconfig.json     # TypeScript 配置
├─ temp/             # 临时文件（运行时生成）
│  └─ <uuid>/        # 每次下载的临时目录
├─ result/           # 中间产物（运行时生成）
└─ docs/             # 文档
```

## 技术栈

| 组件 | 技术 | 用途 |
|------|------|------|
| 运行时 | Node.js >=18.0.0 | JavaScript 运行环境 |
| 包管理器 | pnpm 10.32.1 | 依赖管理 |
| 模块系统 | ESM | 现代模块系统 |
| 类型系统 | TypeScript 6.0.3 | 类型安全 |
| CLI 框架 | commander 15.0.0 | 命令行参数解析 |
| 进度显示 | ora 9.4.1 | 终端 spinner |
| HTTP 客户端 | 原生 fetch | 网络请求 |
| 构建工具 | tsup 8.5.1 | TypeScript 构建 |
| 开发工具 | tsx 4.22.4 | 直接运行 TS |
| 测试框架 | vitest 4.1.9 | 单元测试 |
| Lint | oxlint 1.71.0 | 代码检查 |
| Format | oxfmt 0.56.0 | 代码格式化 |
| 外部依赖 | FFmpeg | 视频处理 |

## 关键设计决策

1. **顺序下载** - 保证 TS 分片顺序，避免并发导致的顺序问题
2. **FFconcat 协议** - 使用 `ffconcat version 1.0` 格式，比 concat filter 更稳定
3. **多分段独立处理** - 每个 DISCONTINUITY 分段独立合并，避免跨分段编码问题
4. **UUID 临时目录** - 支持并发下载不同视频，避免文件冲突
5. **原生 fetch** - 零依赖 HTTP 客户端，Node.js 18+ 内置
6. **ESM 模块系统** - 现代 JavaScript 标准，支持顶层 await
