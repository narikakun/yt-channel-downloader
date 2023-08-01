const readline = require('readline');

function readUserInput(question) {
    const rL = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve, reject) => {
        rL.question(question, (answer) => {
            resolve(answer);
            rL.close();
        });
    });
}

const ytpl = require('ytpl');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
let playlistTitle;

async function main() {
    const playlistUrl = await readUserInput('ダウンロードするチャンネルまたはプレイリストのURLを入力してください\n-> ');
    let videos = [];
    let playlist = await ytpl(playlistUrl, {
        pages: 1,
        gl: "JP",
        hl: "ja"
    });
    playlistTitle = playlist.title;
    let counter = 1;
    while (true) {
        let items = playlist.items;
        console.log("Page: " + counter, items.length);
        for (const item of items) {
            videos.push({
                title: item.title,
                id: item.id,
                duration: item.durationSec,
                isLive: item.isLive,
                isPlayable: item.isPlayable
            })
        }
        await writeVideosJson(videos);
        if (items.length < 100)  {
            await startDownload(videos, playlistTitle);
            break;
        }
        playlist = await ytpl.continueReq(playlist.continuation);
        counter++;
    }
};

async function writeVideosJson (videos) {
    await fs.writeFileSync("./data/videos.json", JSON.stringify(videos));
}

const { Worker } = require('worker_threads');

async function startDownload (videos, playlistTitle) {
    videos = videos.filter(f => f.isPlayable);
    const isLive = await readUserInput('ライブをダウンロードしますか？ [Y/N] ');
    if (isLive.toLowerCase() == "y") {
        console.log("ライブをダウンロードします。");
    } else {
        console.log("ライブはダウンロードしません。");
        videos = videos.filter(f => !f.isLive);
    }
    const dividedArray = [];

    for (let i = 0; i < videos.length; i += 20) {
        dividedArray.push(videos.slice(i, i + 20));
    }
    for (const dAry of dividedArray) {
        const worker = new Worker("./download.js", {
            workerData: { videos: dAry, playlistTitle: playlistTitle  },
        });
    }
}

main();