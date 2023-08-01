const { parentPort, workerData } = require('worker_threads');
const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");
const readline = require("readline");

const { playlistTitle, videos } = workerData;

for (const video1 of videos) {
    let title = video1.title;
    let videoId = video1.id;

    let fileNameMarks = ["\\", '/', ':', '*', '?', 'a', "<", ">", '|'];
    for (let i = 0; i < fileNameMarks.length; i++) {
        title = title.replaceAll(fileNameMarks[i], "_");
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    if (!fs.existsSync(`./videos/${playlistTitle}/`)) {
        fs.mkdirSync(`./videos/${playlistTitle}/`);
    }
    const output = path.resolve(__dirname, `videos/${playlistTitle}/${title}.mp4`);

    const video = ytdl(url);
    video.pipe(fs.createWriteStream(output));
    video.on('progress', (chunkLength, downloaded, total) => {
        const percent = downloaded / total;
        console.log(`${videoId} ${title} : ${(percent * 100).toFixed(2)}% (${(downloaded / 1024 / 1024).toFixed(2)}MB / ${(total / 1024 / 1024).toFixed(2)}MB)`);
    });
    video.on('end', () => {
        parentPort.postMessage(`OK`);
    });
}