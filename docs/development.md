# 开发指南

## 开发环境设置

```bash
# 克隆仓库
git clone <repository-url>
cd m3u8Downloader

# 启用 Corepack 并安装 pnpm
corepack enable
corepack prepare pnpm@latest --activate

# 安装依赖
pnpm install

# 确保 FFmpeg 已安装
ffmpeg -version
```

## 项目结构

```
m3u8Downloader/
├─ src/
│  ├─ main.ts        # 入口模块 - CLI 解析、m3u8 解析
│  ├─ main.test.ts   # 入口模块测试
│  └─ down.ts        # 下载引擎 - TS 下载、FFmpeg 合并
├─ dist/             # 构建输出
├─ package.json      # 项目配置
├─ tsconfig.json     # TypeScript 配置
├─ tsup.config.ts    # tsup 构建配置
├─ vitest.config.ts  # Vitest 测试配置
├─ docs/             # 文档
└─ pnpm-lock.yaml    # 依赖锁定
```

## 核心依赖

| 依赖 | 用途 |
|------|------|
| `commander` | CLI 参数解析 |
| `ora` | 终端 spinner 进度显示 |
| `typescript` | 类型系统 |
| `tsup` | 构建工具 |
| `tsx` | 开发时直接运行 TS |
| `vitest` | 测试框架 |
| `oxlint` | 代码检查 |
| `oxfmt` | 代码格式化 |

## 开发命令

```bash
# 开发模式运行
pnpm dev --url=<m3u8-url> --finalName=<output-name>

# 构建
pnpm build

# 运行构建产物
pnpm start --url=<m3u8-url> --finalName=<output-name>

# TypeScript 类型检查
pnpm typecheck

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
```

## 代码风格

- ESM 模块系统（`import`/`export`）
- TypeScript 严格模式
- 使用 `node:` 协议导入内置模块
- async/await 异步处理
- 类型安全的函数签名

## 调试技巧

### 添加详细日志

在 `src/down.ts` 中，spinner 支持多种日志级别：

```typescript
spinner.info('信息');
spinner.warn('警告');
spinner.fail('错误');
spinner.succeed('成功');
```

### 测试单个功能

```typescript
// 测试 CLI 参数解析
import { program } from 'commander';
program.parse();
console.log(program.opts());

// 测试 TS 列表解析
body.split('\n').map((line) => {
  console.log('Line:', line);
});
```

### 临时文件检查

下载过程中检查临时目录：

```bash
# 查看临时文件
ls -la ./temp/<uuid>/

# 查看结果文件
ls -la ./result/
```

## 扩展点

### 添加新的输出格式

修改 `src/down.ts` 中的 FFmpeg 命令：

```typescript
// 当前：输出 MP4
await execAsync(`ffmpeg -i input.txt -acodec copy -vcodec copy -absf aac_adtstoasc ${output}.mp4`)

// 扩展：支持 MKV
await execAsync(`ffmpeg -i input.txt -acodec copy -vcodec copy ${output}.mkv`)
```

### 添加并发下载

当前实现为顺序下载，可扩展为并发：

```typescript
// 使用 Promise.all 并发下载
await Promise.all(tsList.map(ts => downloadTs(ts)));
```

注意：需要保证最终合并顺序。

### 添加重试机制

```typescript
async function downloadWithRetry(url: string, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await download(url);
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
    }
  }
}
```

## 已知限制

1. **顺序下载** - 未实现并发，大文件下载较慢
2. **无断点续传** - 下载中断需重新开始
3. **错误处理简单** - 部分错误未捕获
4. **内存占用** - 所有 TS URL 存储在内存中

## 测试

项目使用 Vitest 作为测试框架，配置文件为 `vitest.config.ts`：

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

### 运行测试

```bash
# 运行所有测试（监听模式）
pnpm test

# 运行所有测试（单次）
pnpm test:run

# 运行特定测试文件
pnpm test:run src/down.test.ts

# 监听模式
pnpm test --watch
```

### 编写测试

测试文件使用 `.test.ts` 扩展名，支持 TypeScript 开箱即用：

```typescript
import { expect, test, describe } from 'vitest'

describe('feature', () => {
  test('should work', () => {
    expect(true).toBe(true)
  })
})
```

### 测试建议

1. 使用真实 m3u8 URL 手动测试
2. 测试单分段和多分段场景
3. 测试网络中断情况
4. 测试无效 URL 处理
