import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const scapesFolder = path.resolve(import.meta.dirname, "scapes");
const soundsCacheFolder = path.resolve(import.meta.dirname, "sounds_cache");

// Get all existing sound files
const getExistingSounds = async () => {
    try {
        const files = await readdir(soundsCacheFolder);
        const tags = new Set();
        
        files.forEach(file => {
            if (file.endsWith('.mp3')) {
                // Extract tag from filename (remove _0.mp3, _1.mp3 etc)
                const tag = file.replace(/_\d+\.mp3$/, '');
                tags.add(tag);
            }
        });
        
        return Array.from(tags);
    } catch (error) {
        console.error('Error reading sounds cache:', error);
        return [];
    }
};

// Get all tags from info.json files
const getAllTagsFromInfoFiles = async () => {
    const allTags = new Set();
    
    try {
        const directories = await readdir(scapesFolder);
        
        for (const dir of directories) {
            const infoPath = path.resolve(scapesFolder, dir, 'info.json');
            
            try {
                const infoContent = await readFile(infoPath, 'utf-8');
                const info = JSON.parse(infoContent);
                
                if (info.imageTags && Array.isArray(info.imageTags)) {
                    info.imageTags.forEach(tag => {
                        // Filter out very short words and common stop words
                        if (tag.length > 2 && !['the', 'and', 'with', 'from', 'this', 'that', 'for'].includes(tag.toLowerCase())) {
                            allTags.add(tag.toLowerCase());
                        }
                    });
                }
            } catch (error) {
                // Skip if no info.json or invalid JSON
            }
        }
    } catch (error) {
        console.error('Error reading scapes folder:', error);
    }
    
    return Array.from(allTags);
};

// Main function
const main = async () => {
    console.log('Checking for missing sound files...');
    console.log('---');
    
    // Get existing sounds and all tags
    const existingSounds = await getExistingSounds();
    const allTags = await getAllTagsFromInfoFiles();
    
    console.log(`Found ${existingSounds.length} existing sound categories`);
    console.log(`Found ${allTags.length} unique tags from all soundscapes`);
    
    // Find missing tags
    const missingTags = allTags.filter(tag => !existingSounds.includes(tag));
    
    console.log(`\nMissing sounds for ${missingTags.length} tags:`);
    console.log('---');
    
    // Group tags by category for better organization
    const architecturalTags = [];
    const natureTags = [];
    const materialTags = [];
    const otherTags = [];
    
    missingTags.forEach(tag => {
        if (['cathedral', 'mosque', 'temple', 'church', 'pagoda', 'tower', 'bridge', 'castle', 'monument', 'plaza', 'square', 'steeple', 'altar', 'aisle'].includes(tag)) {
            architecturalTags.push(tag);
        } else if (['forest', 'garden', 'pond', 'water', 'rain', 'birds', 'wind', 'tree', 'river', 'ocean', 'leaves', 'branches'].includes(tag)) {
            natureTags.push(tag);
        } else if (['stone', 'wood', 'glass', 'metal', 'marble', 'concrete', 'brick', 'gravel', 'wooden'].includes(tag)) {
            materialTags.push(tag);
        } else {
            otherTags.push(tag);
        }
    });
    
    if (architecturalTags.length > 0) {
        console.log(`Architectural tags (${architecturalTags.length}):`);
        console.log(architecturalTags.join(', '));
        console.log();
    }
    
    if (natureTags.length > 0) {
        console.log(`Nature tags (${natureTags.length}):`);
        console.log(natureTags.join(', '));
        console.log();
    }
    
    if (materialTags.length > 0) {
        console.log(`Material tags (${materialTags.length}):`);
        console.log(materialTags.join(', '));
        console.log();
    }
    
    if (otherTags.length > 0) {
        console.log(`Other tags (${otherTags.length}):`);
        console.log(otherTags.join(', '));
        console.log();
    }
    
    // Show command to download missing sounds
    if (missingTags.length > 0) {
        console.log('---');
        console.log('To download sounds for these missing tags, run:');
        console.log(`node downloadSounds.js ${missingTags.join(' ')}`);
        
        // Split into chunks if too many tags
        if (missingTags.length > 20) {
            console.log('\nOr in smaller batches:');
            const chunks = [];
            for (let i = 0; i < missingTags.length; i += 15) {
                chunks.push(missingTags.slice(i, i + 15));
            }
            chunks.forEach((chunk, index) => {
                console.log(`Batch ${index + 1}: node downloadSounds.js ${chunk.join(' ')}`);
            });
        }
    } else {
        console.log('✓ All tags have corresponding sound files!');
    }
    
    console.log('\n---');
    console.log('Existing sound categories:');
    console.log(existingSounds.sort().join(', '));
};

// Run the script
main().catch(console.error);