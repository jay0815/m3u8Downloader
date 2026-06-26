# m3u8Downloader 文档

m3u8Downloader 是一个 Node.js CLI 工具，用于下载 m3u8 流媒体视频并处理 `#EXT-X-DISCONTINUITY` 分段问题。

## 文档目录

- [架构说明](./architecture.md) - 系统架构、模块职责、数据流
- [使用指南](./usage.md) - 安装、运行、参数说明
- [FFmpeg 集成](./ffmpeg.md) - FFmpeg 命令、concat 协议、格式转换
- [开发指南](./development.md) - 本地开发、调试、扩展
- [现代化升级路线](./modernization-plan.md) - 技术栈升级规划

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm dev --url=<m3u8-url> --finalName=<output-name> [--target=<destination-path>]

# 构建并运行
pnpm build
pnpm start --url=<m3u8-url> --finalName=<output-name> [--target=<destination-path>]
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

## 核心特性

- 自动解析 m3u8 播放列表
- 处理 `#EXT-X-DISCONTINUITY` 分段
- 顺序下载 TS 分片
- 使用 FFconcat 协议合并视频
- 支持多分段独立合并后二次合并
- 终端进度显示（Ora spinner）
- TypeScript 类型安全
- 现代 ESM 模块系统
