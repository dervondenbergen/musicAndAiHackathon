import express from 'express';
import formidable from 'formidable';
import puppeteer from 'puppeteer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

import { randomUUID } from "node:crypto";
import { rename, writeFile, mkdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { constants } from 'node:fs';

ffmpeg.setFfmpegPath(ffmpegPath.path);

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
const soundsCacheFolder = path.resolve(import.meta.filename, "..", "sounds_cache");

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

    const imageInfo = await fastAPI.json();
    const imageTags = imageInfo.tags.split(",").map(s => s.trim());
    const caption = imageInfo.caption;

    await updateInformation(uuid, { imageTags, caption });

    addQueue(`generateCombinedSound [${uuid}]`, async () => {
        // await generateCombinedSound(uuid, imageTags);
        await generateMusic(uuid, imageTags);
    });
}

// Helper function to check if file exists
const fileExists = async (filePath) => {
    try {
        await access(filePath, constants.F_OK);
        return true;
    } catch {
        return false;
    }
};

// Generate combined ambient sound from tags
const generateCombinedSound = async (uuid, temporaryTags) => {
    const soundFiles = [];
    
    // Look for cached sounds for each tag
    for (const tag of temporaryTags.slice(0, 4)) { // Limit to 4 tags
        // Check if we have cached sounds for this tag
        for (let i = 0; i < 2; i++) {
            const cachedPath = path.resolve(soundsCacheFolder, `${tag}_${i}.mp3`);
            if (await fileExists(cachedPath)) {
                soundFiles.push(cachedPath);
                console.log(`Using cached sound: ${tag}_${i}.mp3`);
                break; // Only use one sound per tag to avoid too many layers
            }
        }
    }
    
    // If we couldn't get any sounds, create a descriptive silent file
    if (soundFiles.length === 0) {
        console.log("No sounds found for tags:", temporaryTags.join(', '));
        const tagSubset = temporaryTags.slice(0, 3).join("_").replace(/\s+/g, "_");
        const musicFilename = `NO_SOUNDS_FOR_${tagSubset}.mp3`;
        
        // Update the information with a placeholder
        await updateInformation(uuid, { musicFilename });
        return;
    }
    
    console.log(`Mixing ${soundFiles.length} sounds for tags: ${temporaryTags.join(', ')}`);
    
    // Extract the actual sound names used
    const usedSoundNames = soundFiles.map(filePath => {
        const fileName = path.basename(filePath, '.mp3');
        return fileName.replace(/_\d+$/, ''); // Remove _0, _1 suffix
    });
    
    // Mix the sounds together - filename shows which sounds were actually used
    const usedSoundsString = usedSoundNames.join("_");
    const musicFilename = `${usedSoundsString}_mixed.mp3`;
    const soundscapeFolder = path.resolve(scapesFolder, uuid);
    const outputPath = path.resolve(soundscapeFolder, musicFilename);
    
    return new Promise((resolve, reject) => {
        const command = ffmpeg();
        
        // Add all input files
        soundFiles.forEach(file => {
            command.input(file);
        });
        
        // Create filter complex for mixing with variations
        const filters = [];
        const processedInputs = [];
        
        // Add variation to each sound
        soundFiles.forEach((_, i) => {
            // Apply different effects to each sound
            if (i === 0) {
                // First sound: base layer with slight reverb
                filters.push(`[${i}:a]volume=0.8,aecho=0.8:0.88:40:0.4[a${i}]`);
            } else if (i === 1) {
                // Second sound: slightly delayed and panned
                filters.push(`[${i}:a]volume=0.6,adelay=3000|3000,aecho=0.8:0.88:20:0.3[a${i}]`);
            } else if (i === 2) {
                // Third sound: more delayed, lower volume
                filters.push(`[${i}:a]volume=0.4,adelay=7000|7000[a${i}]`);
            } else {
                // Fourth sound: background layer
                filters.push(`[${i}:a]volume=0.3,adelay=11000|11000[a${i}]`);
            }
            processedInputs.push(`[a${i}]`);
        });
        
        // Mix all processed inputs
        filters.push(`${processedInputs.join('')}amix=inputs=${soundFiles.length}:duration=longest:dropout_transition=2,volume=0.8[out]`);
        
        command.complexFilter(filters);
        
        command
            .outputOptions(['-map', '[out]'])
            .audioCodec('libmp3lame')
            .audioBitrate('192k')
            .duration(45) // Increase to 45 seconds for longer ambient soundscapes
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                reject(err);
            })
            .on('end', async () => {
                await updateInformation(uuid, { musicFilename });
                resolve();
            })
            .save(outputPath);
    });
};

const generateMusic = async (uuid, temporaryTags) => { // could be also caption, if caption results in better results
    // Fetch the mock music file
    const response = await fetch(`http://localhost:8000/generateMusic?keywordString=${temporaryTags.join(',')}`, {
        method: "POST",
    });
    
    if (!response.ok) {
        throw new Error(`Failed to generate music: ${response.status}`);
    }
    
    // Create filename based on tags (limit to first 3 tags for reasonable filename length)
    const tagSubset = temporaryTags.slice(0, 3).join("_").replace(/\s+/g, "_");
    const musicFilename = `${tagSubset}.mp3`;
    
    // Save the music file to the soundscape folder
    const soundscapeFolder = path.resolve(scapesFolder, uuid);
    const musicPath = path.resolve(soundscapeFolder, musicFilename);
    
    // Write the response directly to file
    await writeFile(musicPath, Buffer.from(await response.arrayBuffer()));
    
    // Update the information with the music filename
    await updateInformation(uuid, { musicFilename });
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

app.post('/test/soundscape/:uuid/generateCombinedSound', async (req, res) => {
    const uuid = req.params.uuid;

    try {
        const info = await loadInformation(uuid);
        
        if (!info.imageTags) {
            return res.status(400).json({ error: 'No image tags found for this UUID' });
        }

        addQueue(`Manual generateCombinedSound [${uuid}]`, async () => {
            // await generateCombinedSound(uuid, info.imageTags);
            await generateMusic(uuid, imageTags);
        });

        res.json({ message: 'Sound generation queued', uuid, tags: info.imageTags });
    } catch (error) {
        console.error('Error queuing sound generation:', error);
        res.status(500).json({ error: 'Failed to queue sound generation' });
    }
});

app.get('/mock/generateMusic', (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, "test_sound.mp3"));
})

app.listen(port, () => {
    console.log(`Architecture Soundscapes API listening on port ${port}`)
});
