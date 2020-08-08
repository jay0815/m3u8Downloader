const util = require('util');
const down = require('./down');
const request = util.promisify(require('request'));
const { url, finalName, target } = require('minimist')(process.argv);
const Ora = require('ora');

const host = 'https://xxxx';
const fileType = "mp4";

const tsList = [[]];

let section = 0;

const uuid = url.replace(host, '').match(/([\s\S]+).m3u8/)[1];
// const source = fs.readFileSync("./test.m3u8","utf-8"); //读取 m3u8
// const body = source.split("\n");
// body.split('\n').map((line) => {
//   if(line === 'EXT-X-DISCONTINUITY'){
//     section += 1;
//     tsList[section] = [];
//   }
//   if(line.match(/.ts/)){
//     tsList[section].push(line);
//   }
// })
//

const spinner = new Ora({
  discardStdin: false,
  text: 'Down loading resource files list...'
});

const getTsList = async () => {

  spinner.start();
  const { body } = await request({
    url
  })

  body.split('\n').map((line) => {
    if((/#EXT-X-DISCONTINUITY/).test(line)){
      section += 1;
      tsList[section] = [];
    }
    if(line.match(/.ts/)){
      tsList[section].push(line);
    }
  })
  spinner.text = 'Download Completed';
  spinner.succeed();

  down({
    tsList,
    fileType,
    host,
    uuid,
    finalName,
    target
  })
}

getTsList()
