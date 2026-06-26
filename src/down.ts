import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import ora from "ora";

const execAsync = promisify(exec);

interface DownloadOptions {
  tsList: string[][];
  host: string;
  fileType: string;
  uuid: string;
  finalName: string;
  target?: string;
}

const spinner = ora({
  discardStdin: false,
});

// 递归创建文件夹
const mkdirs = (directoryPath: string): void => {
  if (!fs.existsSync(path.dirname(directoryPath))) {
    mkdirs(path.dirname(directoryPath));
  }
  fs.mkdirSync(directoryPath);
};

const createDir = (myPath: string): void => {
  if (!fs.existsSync(myPath)) {
    mkdirs(myPath);
  }
};

const remove = async (myPath: string): Promise<void> => {
  if (fs.existsSync(myPath)) {
    spinner.start(`Deleting ${myPath}`);
    try {
      await execAsync(`rm -rf ${myPath}`);
      spinner.succeed(`Deleted ${myPath}`);
    } catch (e) {
      spinner.fail(`Failed to delete ${myPath}: ${e}`);
    }
  }
};

export const download = async ({
  tsList = [],
  host = "",
  fileType,
  uuid = Date.now().toString(),
  finalName,
  target,
}: DownloadOptions): Promise<void> => {
  let section = 0;
  let localPath: string[] = [];

  spinner.info(`finalName is: ${finalName}`);
  spinner.info(`target is: ${target}`);

  const outputName = (index: number | string): string => `${index}.${fileType}`;
  const tempFolder = path.join(process.cwd(), `./temp/${uuid}`);
  spinner.info(`temp folder is: ${tempFolder}`);

  // 递归创建临时文件
  createDir(tempFolder);
  const resultDirectory = path.join(process.cwd(), "./result/");
  spinner.info("The temp folder has been created");

  // 递归创建资源文件
  createDir(resultDirectory);
  const resultFile = (index: number | string): string =>
    path.join(resultDirectory, outputName(index));
  spinner.info("The resource folder has been created");

  // 不存在 #EXT-X-DISCONTINUITY 时，对 tempFolder 的 clean
  const isSingleSection = tsList.length === 1;
  spinner.info(`${isSingleSection ? "not" : ""} exist EXT-X-DISCONTINUITY`);
  if (!isSingleSection) {
    spinner.info(`there is ${tsList.length} part of sections`);
  }

  spinner.start("Downloading 0 section....");

  const load = async (): Promise<void> => {
    if (tsList.length > 0) {
      if (tsList[0].length === 0) {
        // 下载完成
        const content = `Part ${section} download completed`;
        spinner.succeed(content);
        await final({
          isLast: tsList.length === 1,
          isSingle: isSingleSection,
          finalName,
        });
        section += 1;
        tsList.shift();
        if (tsList.length !== 0) {
          const paragraph = `Downloading ${section} section....`;
          spinner.start(paragraph);
        }
      }
      if (tsList[0]) {
        const tsUrl = tsList[0].shift();
        if (tsUrl) {
          const fullUrl = host + tsUrl;
          await downloadTs(fullUrl);
        }
      }
    }
  };

  const final = async ({
    isLast = false,
    isSingle,
    finalName,
  }: {
    isLast: boolean;
    isSingle: boolean;
    finalName: string;
  }): Promise<void> => {
    spinner.info("Generating configuration");

    localPath.unshift("ffconcat version 1.0");
    try {
      fs.writeFileSync(path.join(tempFolder, "./input.txt"), localPath.join("\n"), "utf-8");
      // 清空 localPath record
      localPath = [];
    } catch (e) {
      spinner.warn(`Configuration write error: ${e}`);
      return;
    }

    const localFileName = isSingle ? finalName : section;

    // 根据 input 中的 file record 进行合成
    spinner.info("Starting merge");

    try {
      await execAsync(
        `cd ${tempFolder} && ffmpeg -i input.txt -acodec copy -vcodec copy -absf aac_adtstoasc ${resultFile(localFileName)}`,
      );
      spinner.succeed("Merge successful");
    } catch (e) {
      spinner.fail(`Merge failed: ${e}`);
    }

    if (isLast) {
      if (isSingle) {
        await move(resultFile(finalName));
      } else {
        for (let i = 0; i <= section; i++) {
          await transform(i);
        }
        await merge();
        if (target) {
          await move(path.join(process.cwd(), `./result/${finalName}.mp4`));
          await remove(path.join(process.cwd(), "./result/"));
        }
      }

      await remove(tempFolder);
      spinner.succeed("END");
    }
  };

  // 下载 ts 文件
  const downloadTs = async (url: string): Promise<void> => {
    const params = url.split("?")[0];
    const name = path.parse(params);
    const fullName = name.name + name.ext;
    const realPath = path.join(tempFolder, fullName);

    localPath.push(`file '${fullName}'`); // 缓存本地路径，用来合成
    console.log(url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      fs.writeFileSync(realPath, Buffer.from(buffer));
      await load();
    } catch (e) {
      spinner.fail(`Download error: ${e}`);
    }
  };

  const transform = async (index: number): Promise<void> => {
    try {
      await execAsync(
        `cd ${resultDirectory} && ffmpeg -i ${index}.mp4 -vcodec copy -acodec copy -vbsf h264_mp4toannexb ${index}.ts`,
      );
      localPath.push(`file ${index}.ts`); // 缓存本地路径，用来合成
      spinner.succeed("Format conversion successful");
    } catch (e) {
      spinner.fail(`Format conversion failed: ${e}`);
    }
  };

  const merge = async (): Promise<void> => {
    try {
      localPath.unshift("ffconcat version 1.0");
      fs.writeFileSync(path.join(resultDirectory, "./input.txt"), localPath.join("\n"), "utf-8");
    } catch (e) {
      spinner.fail(`Configuration write error: ${e}`);
      return;
    }

    try {
      await execAsync(
        `cd ${resultDirectory} && ffmpeg -i input.txt -acodec copy -vcodec copy -absf aac_adtstoasc ${finalName}.mp4`,
      );
      spinner.succeed("Merge successful");
    } catch (e) {
      spinner.fail(`Merge failed: ${e}`);
    }
  };

  const move = async (resPath: string): Promise<void> => {
    try {
      await execAsync(`mv ${resPath} ${target}`);
      await remove(resPath);
      spinner.succeed("File moved successfully");
    } catch (e) {
      spinner.fail(`File move failed: ${e}`);
    }
  };

  await load();
};
