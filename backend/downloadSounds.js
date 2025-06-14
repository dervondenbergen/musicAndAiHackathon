import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const soundsCacheFolder = path.resolve(import.meta.dirname, "sounds_cache");

// Function to search and get preview URLs from Freesound
const getFreesoundPreviewUrls = async (tag, limit = 2) => {
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    try {
        console.log(`  Searching for "${tag}" sounds...`);
        
        // Try multiple search strategies
        const searchStrategies = [
            // 1. Loopable ambient sounds (3-60 seconds)
            `${encodeURIComponent(tag)}+loop+ambient&filter=duration:[3+TO+60]`,
            // 2. Just tag with loop (3-60 seconds)  
            `${encodeURIComponent(tag)}+loop&filter=duration:[3+TO+60]`,
            // 3. Tag with ambient (3-30 seconds)
            `${encodeURIComponent(tag)}+ambient&filter=duration:[3+TO+30]`,
            // 4. Just the tag (2-20 seconds)
            `${encodeURIComponent(tag)}&filter=duration:[2+TO+20]`
        ];
        
        for (const searchQuery of searchStrategies) {
            const searchUrl = `https://freesound.org/apiv2/search/text/?query=${searchQuery}&fields=id,name,previews,tags&format=json`;
            
            // Try to get JSON response directly
            const response = await page.goto(searchUrl, { 
                waitUntil: 'networkidle0',
                timeout: 15000 
            });
            
            const content = await response.text();
            
            // Check if we got JSON
            if (content.includes('"results"')) {
                const data = JSON.parse(content);
                const previewUrls = [];
                
                if (data.results && data.results.length > 0) {
                    for (let i = 0; i < Math.min(limit, data.results.length); i++) {
                        const sound = data.results[i];
                        if (sound.previews && sound.previews['preview-lq-mp3']) {
                            previewUrls.push(sound.previews['preview-lq-mp3']);
                        }
                    }
                    
                    if (previewUrls.length > 0) {
                        console.log(`  Found ${previewUrls.length} sounds using strategy: ${searchQuery.split('&')[0]}`);
                        await browser.close();
                        return previewUrls;
                    }
                }
            }
        }
        
        // Fallback: Try web scraping with longer duration and loop preference
        await page.goto(`https://freesound.org/search/?q=${encodeURIComponent(tag)}+loop&f=duration:[3+TO+60]`, { 
            waitUntil: 'networkidle2',
            timeout: 20000 
        });
        
        // Try different selectors
        const previewUrls = await page.evaluate(() => {
            const urls = [];
            
            // Try to find audio elements
            const audioElements = document.querySelectorAll('audio source');
            audioElements.forEach(source => {
                const src = source.getAttribute('src');
                if (src && src.includes('.mp3')) {
                    urls.push(src);
                }
            });
            
            // Try data attributes
            const players = document.querySelectorAll('[data-mp3]');
            players.forEach(player => {
                const mp3 = player.getAttribute('data-mp3');
                if (mp3) urls.push(mp3);
            });
            
            return urls;
        });
        
        await browser.close();
        return previewUrls.slice(0, limit);
        
    } catch (error) {
        console.error(`  Error searching for ${tag}:`, error.message);
        await browser.close();
        return [];
    }
};

// Download a sound file
const downloadSound = async (url, tag, index) => {
    const fileName = `${tag}_${index}.mp3`;
    const filePath = path.resolve(soundsCacheFolder, fileName);
    
    try {
        console.log(`  Downloading ${fileName}...`);
        const response = await fetch(url);
        
        if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            await writeFile(filePath, buffer);
            console.log(`  ✓ Downloaded ${fileName}`);
            return true;
        } else {
            console.error(`  Failed to download ${url}: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error(`  Error downloading ${fileName}:`, error.message);
        return false;
    }
};

// Main function
const main = async () => {
    // Create cache folder
    await mkdir(soundsCacheFolder, { recursive: true });
    
    // Get tags from command line or use defaults
    const args = process.argv.slice(2);
    let tags = [];
    
    if (args.length > 0) {
        tags = args;
    } else {
        // Default architectural/nature tags
        tags = [
            'forest', 'birds', 'water', 'rain', 'wind',
            'city', 'traffic', 'cathedral', 'temple', 'echo',
            'stone', 'garden', 'fountain', 'bells', 'footsteps',
            'crowd', 'market', 'construction', 'ocean', 'fire'
        ];
    }
    
    // Process all tags
    const tagsToProcess = tags;
    
    console.log('Starting Freesound sound downloads...');
    console.log(`Processing ${tagsToProcess.length} tags`);
    console.log(`Tags: ${tagsToProcess.join(', ')}`);
    console.log(`Saving to: ${soundsCacheFolder}`);
    console.log('---');
    
    let totalDownloaded = 0;
    let totalFailed = 0;
    
    // Process each tag
    for (const tag of tagsToProcess) {
        console.log(`\nProcessing tag: "${tag}"`);
        
        // Get preview URLs for this tag
        const urls = await getFreesoundPreviewUrls(tag, 2);
        
        if (urls.length === 0) {
            console.log(`  No sounds found for "${tag}"`);
            continue;
        }
        
        console.log(`  Found ${urls.length} sounds`);
        
        // Download each sound
        for (let i = 0; i < urls.length; i++) {
            const success = await downloadSound(urls[i], tag, i);
            if (success) {
                totalDownloaded++;
            } else {
                totalFailed++;
            }
            
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('\n---');
    console.log(`Download complete!`);
    console.log(`✓ Successfully downloaded: ${totalDownloaded} sounds`);
    console.log(`✗ Failed: ${totalFailed} sounds`);
    
    // All tags processed
};

// Run the downloader
main().catch(console.error);