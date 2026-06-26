# 使用指南

## 环境要求

- Node.js >= 18
- FFmpeg（必须在 PATH 中）
- pnpm（通过 Corepack 启用）

## 安装

```bash
# 克隆仓库
git clone <repository-url>
cd m3u8Downloader

# 启用 Corepack 并安装 pnpm
corepack enable
corepack prepare pnpm@latest --activate

# 安装依赖
pnpm install
```

## 基本用法

```bash
node main.js --url=<m3u8-url> --finalName=<output-name>
```

## 参数说明

| 参数 | 必填 | 说明 |
|------|------|------|
| `--url` | 是 | m3u8 播放列表 URL |
| `--finalName` | 是 | 输出文件名（不含扩展名） |
| `--target` | 否 | 最终输出目录路径 |

## 使用示例

### 基本下载

```bash
node main.js \
  --url="https://example.com/video/index.m3u8" \
  --finalName="my-video"
```

输出文件：`./result/my-video.mp4`

### 指定输出目录

```bash
node main.js \
  --url="https://example.com/video/index.m3u8" \
  --finalName="my-video" \
  --target="/Users/me/Videos"
```

输出文件：`/Users/me/Videos/my-video.mp4`

## 输出目录

- `./temp/<uuid>/` - 临时 TS 文件，下载完成后自动删除
- `./result/` - 中间产物，指定 `--target` 时自动删除
- `--target` 目录 - 最终输出位置

## 进度显示

工具使用 Ora spinner 显示进度：

```
✔ Download Completed
ℹ finalName is :my-video
ℹ target is :/Users/me/Videos
ℹ temp folder is :./temp/abc123
Downloading 0 section....
✔ 第0部分下载完成
✔ 合成成功
✔ END
```

## 错误处理

常见错误：

1. **FFmpeg 未安装** - 确保 `ffmpeg` 命令可用
2. **URL 无效** - 检查 m3u8 URL 是否可访问
3. **权限问题** - 确保对输出目录有写权限
4. **网络问题** - 下载失败会显示错误信息
