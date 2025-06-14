import { readdir } from 'node:fs/promises';
import path from 'node:path';

const scapesFolder = path.resolve(import.meta.dirname, "scapes");

// Get all UUIDs from scapes folder
const getAllUUIDs = async () => {
    try {
        const directories = await readdir(scapesFolder);
        return directories.filter(dir => {
            // Basic UUID format check
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dir);
        });
    } catch (error) {
        console.error('Error reading scapes folder:', error);
        return [];
    }
};

// Trigger sound generation for a UUID
const triggerSoundGeneration = async (uuid) => {
    try {
        const response = await fetch(`http://localhost:3000/test/soundscape/${uuid}/generateCombinedSound`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✓ Queued sound generation for ${uuid}: ${data.tags.join(', ')}`);
            return true;
        } else {
            const error = await response.text();
            console.log(`✗ Failed to queue ${uuid}: ${error}`);
            return false;
        }
    } catch (error) {
        console.log(`✗ Error with ${uuid}: ${error.message}`);
        return false;
    }
};

// Main function
const main = async () => {
    console.log('Regenerating sounds for all existing soundscapes...');
    console.log('---');
    
    const uuids = await getAllUUIDs();
    console.log(`Found ${uuids.length} soundscapes`);
    
    if (uuids.length === 0) {
        console.log('No soundscapes found!');
        return;
    }
    
    let successful = 0;
    let failed = 0;
    
    // Process each UUID
    for (const uuid of uuids) {
        const success = await triggerSoundGeneration(uuid);
        if (success) {
            successful++;
        } else {
            failed++;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n---');
    console.log(`Regeneration complete!`);
    console.log(`✓ Successfully queued: ${successful} soundscapes`);
    console.log(`✗ Failed: ${failed} soundscapes`);
    console.log('\nCheck the backend console for progress...');
};

// Run the script
main().catch(console.error);