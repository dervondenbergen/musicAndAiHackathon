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
    res.setHeader("Content-Type", "text/plain");
    res.send('Architecture Soundscapes API.\n\nSee https://github.com/dervondenbergen/musicAndAiHackathon/tree/main/backend for more details.')
});

const queue = [];
const addQueue = (taskName, task) => {
    console.info("Adding Task", taskName);
    queue.push({taskName, task});
}
const runQueue = async () => {
    if (queue.length > 0) {
        const { taskName, task } = queue.shift();
        console.group("Running Task", taskName);
        await task();
        console.log("Finished Task", taskName);
        console.groupEnd();
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

const updateInformation = async (uuid, newInfo) => {
    const info = await loadInformation(uuid);
    await saveInformation(uuid, Object.assign(info, newInfo));
}

const getImageTags = async (uuid, newImagePath) =>  {
    const imageBuffer = await readFile(newImagePath);
    
    const aiFormData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    aiFormData.append("image", blob, path.basename(newImagePath));

    const fastAPI = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: aiFormData,
    });

    const imageTagsString = await fastAPI.text();
    const imageTags = imageTagsString.replaceAll('"', '').split(",");

    await updateInformation(uuid, { imageTags });

    addQueue(`generateMusic [${uuid}]`, async () => {
        console.log("$$$ AI TASK $$$");
    });
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
            imageTags: undefined,
            musicFilename: undefined,
        });

        addQueue(`getImageTags [${uuid}]`, async () => {
            await getImageTags(uuid, newImagePath);
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

app.post('/test/soundscape/:uuid/getImageTags', async (req, res) => {
    const uuid = req.params.uuid;

    const info = await loadInformation(uuid);
    const soundscapeFolder = path.resolve(scapesFolder, uuid);
    const newImagePath = path.resolve(soundscapeFolder, info.imageFilename);

    addQueue(`Manual getImageTags [${uuid}]`, async () => {
        await getImageTags(uuid, newImagePath);
    });

    res.sendStatus(200);
});

app.get('/mock/predict', (req, res) => {
    return "trees, things, stuff, houses";
})

app.listen(port, () => {
    console.log(`Architecture Soundscapes API listening on port ${port}`)
});
