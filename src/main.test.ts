import { expect, test, describe } from "vitest";

// 测试 m3u8 解析逻辑
describe("m3u8 parsing", () => {
  test("should detect DISCONTINUITY markers", () => {
    const content = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXTINF:9.009,
http://example.com/segment1.ts
#EXT-X-DISCONTINUITY
#EXTINF:9.009,
http://example.com/segment2.ts`;

    const tsList: string[][] = [[]];
    let section = 0;

    content.split("\n").map((line) => {
      if (/#EXT-X-DISCONTINUITY/.test(line)) {
        section += 1;
        tsList[section] = [];
      }
      if (line.match(/.ts/)) {
        tsList[section].push(line);
      }
    });

    expect(tsList).toHaveLength(2);
    expect(tsList[0]).toHaveLength(1);
    expect(tsList[1]).toHaveLength(1);
  });

  test("should handle single section playlist", () => {
    const content = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXTINF:9.009,
http://example.com/segment1.ts
#EXTINF:9.009,
http://example.com/segment2.ts`;

    const tsList: string[][] = [[]];
    let section = 0;

    content.split("\n").map((line) => {
      if (/#EXT-X-DISCONTINUITY/.test(line)) {
        section += 1;
        tsList[section] = [];
      }
      if (line.match(/.ts/)) {
        tsList[section].push(line);
      }
    });

    expect(tsList).toHaveLength(1);
    expect(tsList[0]).toHaveLength(2);
  });
});

// 测试 URL 解析
describe("URL parsing", () => {
  test("should extract host from URL", () => {
    const url = "https://example.com/path/to/playlist.m3u8";
    const host = new URL(url).origin;
    expect(host).toBe("https://example.com");
  });

  test("should extract UUID from URL", () => {
    const url = "https://example.com/videos/12345/playlist.m3u8";
    const host = "https://example.com";
    const uuid = url.replace(host, "").match(/([\s\S]+).m3u8/)?.[1] || Date.now().toString();
    expect(uuid).toBe("/videos/12345/playlist");
  });
});
