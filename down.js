const request = require('request');
const fs = require('fs');
const path  = require('path');
const dayjs = require('dayjs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const Ora = require('ora');

//递归的创建文件夹
const mkdirs = (directoryPath) => {
  if (!fs.existsSync(path.dirname(directoryPath))) {
    mkdirs(path.dirname(directoryPath));
  }
  fs.mkdirSync(directoryPath);
}

function createDir(myPath){
    !fs.existsSync(myPath) && mkdirs(myPath);
}

async function remove(myPath){
  if(fs.existsSync(myPath)) {
    spinner.start('开始删除路劲'+myPath);
    await exec(`rm -rf ${myPath}`)
      .then(() => spinner.succeed("删除"+myPath+"成功"))
      .catch((e) => spinner.fail("删除"+myPath+"失败"+e));
  }
}

let section = 0;

const spinner = new Ora({
  discardStdin: false
});

// @ts-ignore
module.exports = ({ tsList = [], host = '', fileType, uuid = dayjs().valueOf(), finalName, target } = {}) => {

    spinner.info(`finalName is :${finalName}`);
    spinner.info(`target is :${target}`);

    const outputName = (index) => `${index}.${fileType}`;
    const tempFolder = path.join(__dirname,`./temp/${uuid}`);
    spinner.info(`temp folder is :${tempFolder}`);

    // 递归创建临时文件
    createDir(tempFolder);
    const resultDirectory = path.join(__dirname, './result/');
    spinner.info("The temp folder has been created");


    // 递归创建资源文件
    createDir(resultDirectory);
    const resultFile = (index) => path.join(resultDirectory, outputName(index));
    spinner.info("The resource folder has been created");


    let localPath = [] ; // 下载到本地的路径
    const content = `完成`;
    spinner.start('Downloading 0 section....');

    load();
    async function load(){
      if(tsList.length > 0){
        if(tsList[0].length === 0) {
          //下载完成
          const content = `第${section}部分下载完成`;
          spinner.succeed(content);
          await final({
            isLast: tsList.length === 1, isSingle: isSingleSection,
            finalName
          });
          section += 1;
          tsList.shift();
          if(tsList.length !== 0) {
            const paragraph = `Downloading ${section} section....`;
            spinner.start(paragraph);
          }
        }
        if(tsList[0]) {
          const tsUrl = tsList[0].shift();
          const fullUrl = host + tsUrl;
          down(fullUrl);
        }
      }
    }


    async function final({
      isLast = false, isSingle, finalName
    }) {
      spinner.info("开始生成配置");

      localPath.unshift("ffconcat version 1.0");
      try{
        fs.writeFileSync(path.join(tempFolder,"./input.txt"), localPath.join("\n"), void 0, 'utf-8');
        // 清空 localPath record
        localPath = [];
      }catch(e){
        spinner.warn("写入配置出错" + e);
        return ;
      }

      const localFileName = isSingle ? finalName : section;

      // 根据 input 中的 file record 进行合成
      spinner.info("开始合成");

      await exec(`cd ${tempFolder} && ffmpeg -i input.txt -acodec copy -vcodec copy -absf aac_adtstoasc ${resultFile(localFileName)}`)
        .then(() => spinner.succeed("合成成功"))
        .catch(e => spinner.fail("合成失败" + e));

      if(isLast) {
        if(isSingle){
          await move(resultFile(finalName))
        }else {
          for(let i = 0; i <= section; i++) {
            await transform(i);
          }
          await merge();
          if (target) {
            await move(path.join(__dirname, `./result/${finalName}.mp4`))
          }
        }

        await remove(tempFolder);
        spinner.succeed("END")
      }
    }

    //下载 ts 文件
    function down(url){
        const params = url.split('?')[0];
        const name = path.parse(params);
        const fullName = name["name"] + name["ext"];
        const realPath = path.join(tempFolder, fullName);

        localPath.push(`file '${fullName}'`); //缓存本地路径，用来合成
        request({
            url: url
        }, (e, response, body) => {
            if (!e && response.statusCode == 200) {
                load();
            }else{
                spinner.fail("错误" + e)
            }
        }).pipe(fs.createWriteStream(realPath));
    }

    async function transform(index) {
      await exec(`cd ${resultDirectory} && ffmpeg -i ${index}.mp4 -vcodec copy -acodec copy -vbsf h264_mp4toannexb ${index}.ts`)
        .then(() => {
          localPath.push(`file ${index}.ts`); //缓存本地路径，用来合成
          spinner.succeed("格式转换成功")
        })
        .catch(e => spinner.fail("格式转换失败" + e));
        return void 0;
    }

    async function merge() {
      try{
        localPath.unshift("ffconcat version 1.0");
        fs.writeFileSync(path.join(resultDirectory, "./input.txt"), localPath.join("\n"), void 0, 'utf-8');
      }catch(e){
        spinner.fail("写入配置出错" + e)
        return ;
      }
      await exec(`cd ${resultDirectory} && ffmpeg -i input.txt -acodec copy -vcodec copy -absf aac_adtstoasc ${finalName}.mp4`)
              .then(() => spinner.succeed("合并成功"))
              .catch(e => spinner.fail("合并失败"+e));
      return
    }

    async function move(resPath) {
      exec(`mv ${resPath} ${target}`)
          .then(() => {
            remove(resPath);
            spinner.succeed("文件移动成功")
          }).catch((e) => spinner.fail("文件移动失败"+e));
    }

}
