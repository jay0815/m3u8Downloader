import { program } from "commander";
import ora from "ora";
import { download } from "./down.js";

interface DownloadOptions {
  url: string;
  finalName: string;
  target?: string;
}

program
  .name("m3u8-downloader")
  .description("Download m3u8 streaming video")
  .requiredOption("--url <url>", "m3u8 playlist URL")
  .requiredOption("--finalName <name>", "output filename")
  .option("--target <path>", "output directory")
  .parse();

const options = program.opts() as DownloadOptions;
const { url, finalName, target } = options;

const host = new URL(url).origin;
const fileType = "mp4";

const tsList: string[][] = [[]];
let section = 0;

const uuid = url.replace(host, "").match(/([\s\S]+).m3u8/)?.[1] || Date.now().toString();

const spinner = ora({
  discardStdin: false,
  text: "Downloading resource files list...",
});

const getTsList = async () => {
  spinner.start();

  const response = await fetch(url);
  const body = await response.text();

  body.split("\n").map((line) => {
    if (/#EXT-X-DISCONTINUITY/.test(line)) {
      section += 1;
      tsList[section] = [];
    }
    if (line.match(/.ts/)) {
      tsList[section].push(line);
    }
  });

  spinner.text = "Download Completed";
  spinner.succeed();

  download({
    tsList,
    fileType,
    host,
    uuid,
    finalName,
    target,
  });
};

getTsList();
