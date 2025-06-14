import express from 'express';
import formidable from 'formidable';

import { randomUUID } from "node:crypto";
import { rename, writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const app = express()
const port = 3000

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // should not be * but okay for prototype
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.send({info: 'Architecture Soundscapes API. See https://github.com/teddyboy999/musicAndAiHackathon/tree/main/backend for more Details.'})
});

const queue = [];
const runQueue = () => {
    if (queue.length > 0) {
        const task = queue.shift();
        task();
    }
}
setInterval(runQueue, 1000);

const scapesFolder = path.resolve(import.meta.filename, "..", "scapes");

const saveInformation = async (uuid, info) => {
    const soundscapeFolder = path.resolve(scapesFolder, uuid);
    const informationJson = path.resolve(soundscapeFolder, "info.json");

    await writeFile(informationJson, JSON.stringify(info, null, 2), { encoding: "utf-8" });
    
    return true;
}

const loadInformation = async (uuid) => {
    const soundscapeFolder = path.resolve(scapesFolder, uuid);
    const informationJson = path.resolve(soundscapeFolder, "info.json");

    const infoText = await readFile(informationJson, { encoding: "utf-8" });

    return JSON.parse(infoText);
}

app.post('/soundscape', async (req, res) => {
    const uuid = randomUUID();

    const soundscapeFolder = path.resolve(scapesFolder, uuid);

    await mkdir(soundscapeFolder, {
        recursive: true,
    })
    
    const form = formidable({});

    try {
        const [fields, files] = await form.parse(req);

        const image = files.image[0];

        const newImagePath = path.resolve(soundscapeFolder, image.originalFilename);

        rename(image.filepath, newImagePath);

        await saveInformation(uuid, {
            uuid,
            imageFilename: image.originalFilename,
            tags: undefined,
            musicFilename: undefined,
        });

        console.log("push parsing to queue");
        queue.push( async () =>  {
            console.log("parsing image");

            await (new Promise((resolve) => { setTimeout(resolve, 2000) }));

            console.log("push generating to queue");
            queue.push(function() {
                console.log("generating music")
            });
        });

        res.json({ uuid });

    } catch (error) {

        res.sendStatus(500);

    }
});

app.get('/soundscape/:uuid', async (req, res) => {
    const uuid = req.params.uuid;

    const info = await loadInformation(uuid);

    res.send(info);
});

app.use('/scapes', express.static('scapes'));

app.get('/mock/predict', (req, res) => {
    return "trees, things, stuff, houses";
})

app.listen(port, () => {
    console.log(`Architecture Soundscapes API listening on port ${port}`)
});
