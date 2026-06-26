# FFmpeg 集成

## 概述

m3u8Downloader 使用 FFmpeg 进行视频合并和格式转换。FFmpeg 是外部依赖，必须预先安装。

## FFconcat 协议

### 配置文件格式

工具生成 `input.txt` 文件，使用 FFconcat 格式：

```
ffconcat version 1.0
file 'segment001.ts'
file 'segment002.ts'
file 'segment003.ts'
```

### 为什么使用 FFconcat

- 比 concat filter 更稳定
- 支持流式处理，内存占用低
- 自动处理时间戳连续性

## 合并命令

### 单分段合并

```bash
ffmpeg -i input.txt -acodec copy -vcodec copy -absf aac_adtstoasc output.mp4
```

参数说明：
- `-i input.txt` - FFconcat 配置文件
- `-acodec copy` - 音频流直接复制
- `-vcodec copy` - 视频流直接复制
- `-absf aac_adtstoasc` - AAC 音频格式转换（ADTS → ASC）

### 多分段处理

#### 1. 各分段独立合并

```bash
ffmpeg -i section_input.txt -acodec copy -vcodec copy -absf aac_adtstoasc section0.mp4
```

#### 2. MP4 转 TS

```bash
ffmpeg -i section0.mp4 -vcodec copy -acodec copy -vbsf h264_mp4toannexb section0.ts
```

参数说明：
- `-vbsf h264_mp4toannexb` - H.264 转换：MP4 容器 → Annex B 格式

#### 3. 最终合并

```bash
ffmpeg -i final_input.txt -acodec copy -vcodec copy -absf aac_adtstoasc final.mp4
```

## 为什么需要两次合并

当播放列表包含 `#EXT-X-DISCONTINUITY` 时：

1. 各分段可能有不同的编码参数（分辨率、帧率、音频采样率）
2. 直接合并会导致播放问题
3. 独立合并后转换为统一 TS 格式
4. TS 格式支持无缝拼接

## 依赖检查

```bash
# 检查 FFmpeg 是否安装
ffmpeg -version

# 检查 FFprobe（FFmpeg 套件）
ffprobe -version
```

## 常见问题

### 合成失败

1. 检查 FFmpeg 版本（建议 4.0+）
2. 检查 TS 文件是否完整下载
3. 检查磁盘空间

### 音视频不同步

- 尝试更新 FFmpeg 版本
- 检查源视频是否为可变帧率（VBR）

### 格式不支持

- 确保 FFmpeg 编译时包含所需编解码器
- 使用 `ffmpeg -codecs` 查看支持的格式
