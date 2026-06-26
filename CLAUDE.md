# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

m3u8Downloader 是一个 Node.js CLI 工具，用于下载 m3u8 流媒体视频并处理 `#EXT-X-DISCONTINUITY` 分段问题。使用 FFmpeg 将 TS 分片合并为 MP4。

## 事实来源

- `package.json` 是项目依赖和脚本的唯一事实来源。
  - 执行安装或运行前，先读取 `dependencies` 和 `scripts`。
  - 不要自行猜测依赖版本或项目命令。

- `docs/` 是项目文档入口。
  - 修改架构、使用方式或 FFmpeg 集成前，先阅读相关文档。
  - 本文件不承载完整说明；缺失细节时不得自行脑补。

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm dev --url=<m3u8-url> --finalName=<output-name> [--target=<destination-path>]

# 构建
pnpm build

# 运行构建产物
pnpm start --url=<m3u8-url> --finalName=<output-name> [--target=<destination-path>]

# 代码检查
pnpm lint

# 自动修复 lint 问题
pnpm lint:fix

# 代码格式化
pnpm format

# 检查格式
pnpm format:check

# 运行测试（监听模式）
pnpm test

# 运行测试（单次）
pnpm test:run

# TypeScript 类型检查
pnpm typecheck

# 检查 FFmpeg 是否可用
ffmpeg -version
```

## 架构边界

- **src/main.ts**：入口模块，负责 CLI 解析（commander）和 m3u8 播放列表解析。
- **src/down.ts**：下载引擎，负责 TS 下载（原生 fetch）、FFmpeg 合并、临时文件管理。
- **FFmpeg**：外部依赖，负责视频合并和格式转换。

## 模块职责

### src/main.ts - 入口模块

- CLI 参数解析（`commander`：`--url`, `--finalName`, `--target`）
- 获取 m3u8 播放列表（原生 `fetch`）
- 按 `#EXT-X-DISCONTINUITY` 标记分组 TS 分段
- 调用下载引擎

### src/down.ts - 下载引擎

- 顺序下载 TS 文件到 `./temp/<uuid>/`
- 单分段：直接 FFconcat 合并
- 多分段：各分段独立合并 → 转 TS → 二次合并
- 使用 `./result/` 作为中间产物目录

## 处理流程

```
单分段: m3u8 → [ts1, ts2, ...] → 下载 → ffconcat → output.mp4

多分段: m3u8 → [section0], [section1], ...
             → 各分段独立下载合并为 MP4
             → 转换为 TS 格式
             → 二次合并为 output.mp4
```

## 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js | >=18.0.0 |
| 包管理器 | pnpm | 10.32.1 |
| 模块系统 | ESM | - |
| 类型系统 | TypeScript | 6.0.3 |
| CLI 框架 | commander | 15.0.0 |
| 进度显示 | ora | 9.4.1 |
| HTTP 客户端 | 原生 fetch | - |
| 构建工具 | tsup | 8.5.1 |
| 开发工具 | tsx | 4.22.4 |
| 测试框架 | vitest | 4.1.9 |
| Lint | oxlint | 1.71.0 |
| Format | oxfmt | 0.56.0 |
| 外部依赖 | FFmpeg | - |

## 目录结构

```
m3u8Downloader/
├─ src/
│  ├─ main.ts        # 入口模块
│  ├─ main.test.ts   # 入口模块测试
│  └─ down.ts        # 下载引擎
├─ dist/             # 构建输出（gitignore）
├─ docs/             # 项目文档
├─ package.json      # 项目配置
├─ tsconfig.json     # TypeScript 配置
├─ tsup.config.ts    # tsup 构建配置
├─ vitest.config.ts  # Vitest 测试配置
├─ temp/             # 临时文件（运行时生成，自动删除）
└─ result/           # 中间产物（运行时生成）
```

## 不可突破的规则

- FFmpeg 是必需的外部依赖，必须在 PATH 中可用。
- 临时目录 `./temp/<uuid>/` 在下载完成后自动删除，不要手动修改。
- TS 分片必须按顺序下载和合并，否则会导致播放问题。
- 多分段播放列表必须独立处理每个 DISCONTINUITY 分段。
- 使用 ESM 模块系统，所有导入必须使用 `import` 语法。
- 使用 `node:` 协议导入 Node.js 内置模块。

## 工作方式

- 优先实现最小但完整的方案，不为了未来可能需求提前扩展。
- 修改 FFmpeg 命令前，先理解 concat 协议和格式转换的必要性。
- 临时文件管理必须保证清理，避免磁盘空间泄漏。
- 当实现与文档存在冲突时，必须明确指出冲突；在冲突会影响正确性时，先与用户确认。
- 代码必须通过 `pnpm lint` 和 `pnpm format:check` 检查。

## 事实与决策原则

- 以仓库文件、命令输出、FFmpeg 文档为事实依据。
- 不要盲猜、补全或臆想不存在的需求、约束或接口行为。
- 无法确认的内容必须明确标记为假设或待确认项，不得包装为事实。
- 当可以通过阅读代码、文档或执行只读检查获得事实时，优先自行验证。

## 详细文档

完整文档位于 `docs/` 目录：

- [文档入口](./docs/README.md) - 文档目录和快速开始
- [架构说明](./docs/architecture.md) - 系统架构、模块职责、数据流
- [使用指南](./docs/usage.md) - 安装、运行、参数说明
- [FFmpeg 集成](./docs/ffmpeg.md) - FFmpeg 命令、concat 协议、格式转换
- [开发指南](./docs/development.md) - 本地开发、调试、扩展
- [现代化升级路线](./docs/modernization-plan.md) - 技术栈升级规划
