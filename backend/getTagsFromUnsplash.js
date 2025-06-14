import { writeFile, mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const tempImagesFolder = path.resolve(import.meta.dirname, "temp_images");
const tagsOutputFile = path.resolve(import.meta.dirname, "architectural_tags.json");
const scapesFolder = path.resolve(import.meta.dirname, "scapes");

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY; // Replace with your API key
const UNSPLASH_API_BASE = 'https://api.unsplash.com';

// Search queries for architectural images
const searchQueries = [
    'pagoda architecture',
    'cathedral',
    'temple',
    'skyscraper',
    'mosque',
    'church interior',
    'bridge architecture',
    'monument',
    'plaza square',
    'zen garden',
    'modern building',
    'ancient architecture',
    'urban architecture',
    'gothic architecture'
];

// Search Unsplash for images
const searchUnsplash = async (query, perPage = 3) => {
    try {
        const url = `${UNSPLASH_API_BASE}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        });
        
        if (!response.ok) {
            console.error(`Unsplash API error: ${response.status} ${response.statusText}`);
            return [];
        }
        
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error(`Error searching Unsplash:`, error.message);
        return [];
    }
};

// Download image from URL
const downloadImage = async (url, filename) => {
    const filePath = path.resolve(tempImagesFolder, filename);
    
    try {
        console.log(`Downloading ${filename}...`);
        const response = await fetch(url);
        
        if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            await writeFile(filePath, buffer);
            console.log(`✓ Downloaded ${filename}`);
            return filePath;
        }
    } catch (error) {
        console.error(`Error downloading ${filename}:`, error.message);
    }
    return null;
};

// Upload image to our backend
const uploadImage = async (imagePath, index) => {
    try {
        console.log(`Uploading image ${index + 1}...`);
        
        // Use curl to upload the file
        const curlCommand = `curl -s -X POST -F "image=@${imagePath}" http://localhost:3000/soundscape`;
        const { stdout, stderr } = await execAsync(curlCommand);
        
        if (stderr) {
            console.error(`Error uploading: ${stderr}`);
            return null;
        }
        
        const data = JSON.parse(stdout);
        console.log(`✓ Uploaded with UUID: ${data.uuid}`);
        return data.uuid;
    } catch (error) {
        console.error(`Error uploading image ${index}:`, error.message);
    }
    return null;
};

// Collect all tags from scapes folder
const collectAllTags = async () => {
    const allTags = new Set();
    const results = [];
    
    try {
        // Read all directories in scapes folder
        const directories = await readdir(scapesFolder);
        
        for (const dir of directories) {
            const infoPath = path.resolve(scapesFolder, dir, 'info.json');
            
            try {
                const infoContent = await readFile(infoPath, 'utf-8');
                const info = JSON.parse(infoContent);
                
                if (info.imageTags && info.imageTags.length > 0) {
                    results.push({
                        uuid: info.uuid,
                        caption: info.caption,
                        tags: info.imageTags
                    });
                    
                    info.imageTags.forEach(tag => allTags.add(tag));
                    
                    console.log(`Found tags for ${dir}: ${info.imageTags.join(', ')}`);
                }
            } catch (error) {
                // Skip if no info.json or invalid JSON
            }
        }
    } catch (error) {
        console.error('Error reading scapes folder:', error);
    }
    
    return { allTags: Array.from(allTags), results };
};

// Main function
const main = async () => {
    if (UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
        console.error('Please set your Unsplash API key in the script!');
        console.log('Get your API key from: https://unsplash.com/developers');
        return;
    }
    
    // Create temp folder
    await mkdir(tempImagesFolder, { recursive: true });
    
    console.log('Searching for architectural images on Unsplash...');
    console.log(`Using ${searchQueries.length} search queries, 3 images each`);
    console.log('---');
    
    const uploadedUUIDs = [];
    let imageIndex = 0;
    
    // Search and download images for each query
    for (const query of searchQueries) {
        console.log(`\nSearching for: "${query}"`);
        
        const images = await searchUnsplash(query, 3);
        console.log(`Found ${images.length} images`);
        
        for (const image of images) {
            const filename = `unsplash_${query.replace(/\s+/g, '_')}_${imageIndex}.jpg`;
            const imagePath = await downloadImage(image.urls.regular || image.urls.full, filename);
            
            if (imagePath) {
                const uuid = await uploadImage(imagePath, imageIndex);
                if (uuid) {
                    uploadedUUIDs.push(uuid);
                }
                imageIndex++;
            }
            
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Delay between API calls to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n---');
    console.log(`Uploaded ${uploadedUUIDs.length} images`);
    console.log('Waiting 60 seconds for AI processing...');
    
    // Wait for AI processing
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    console.log('\nCollecting tags from all soundscapes...');
    const { allTags, results } = await collectAllTags();
    
    // Save results
    const output = {
        totalImages: results.length,
        uniqueTags: allTags.sort(),
        allResults: results
    };
    
    await writeFile(tagsOutputFile, JSON.stringify(output, null, 2));
    
    console.log('\n---');
    console.log(`Analysis complete!`);
    console.log(`Found ${results.length} processed images`);
    console.log(`Found ${allTags.length} unique tags`);
    console.log(`\nUnique tags found:`);
    console.log(allTags.join(', '));
    console.log(`\nResults saved to: ${tagsOutputFile}`);
    
    // Now download sounds for the discovered tags
    console.log('\n---');
    console.log('Ready to download sounds for these tags!');
    console.log(`Run: node downloadSounds.js ${allTags.slice(0, 20).join(' ')}`);
};

// Run the script
main().catch(console.error);