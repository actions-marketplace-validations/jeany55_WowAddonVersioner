// #!/usr/bin/env node

// const fs = require('fs');
// const path = require('path');

// // Game type prefixes (interface number with last 4 digits removed)
// const PREFIX_TO_GAME_TYPE = {
//     '1': 'Vanilla',
//     '2': 'TBC',
//     '3': 'Wrath',
//     '4': 'Cata',
//     '5': 'Mists',
//     '11': 'Mainline',
//     '12': 'Mainline'
// };

// /**
//  * Fetch the webpage HTML content
//  */
// async function fetchWebpage(url) {
//     const response = await fetch(url);
//     if (!response.ok) {
//         throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
//     }
//     return response.text();
// }

// /**
//  * Extract interface number for a specific game type from the HTML
//  * The table format is: Game type | Expansion | Version | Number | Date | Interface
//  * We look for an exact match of the game type in a <td> tag
//  */
// function getInterfaceFromHtml(html, gameType) {
//     // Match rows that contain exactly <td>GameType</td> followed by interface in <code> tags
//     const regex = new RegExp(`<td>${gameType}</td>[\\s\\S]*?<code>(\\d+)</code>`, 'g');
//     const match = regex.exec(html);
//     return match ? match[1] : null;
// }

// /**
//  * Get current interface version from a TOC file
//  */
// function getTocInterface(tocContent) {
//     const match = tocContent.match(/## Interface: (\d+)/);
//     return match ? match[1] : null;
// }

// /**
//  * Update interface version in TOC file content
//  */
// function updateTocInterface(tocContent, newVersion) {
//     return tocContent.replace(/## Interface: \d+/, `## Interface: ${newVersion}`);
// }

// /**
//  * Get game type from interface number prefix
//  */
// function getGameTypeFromPrefix(prefix) {
//     return PREFIX_TO_GAME_TYPE[prefix] || null;
// }

// /**
//  * Find all .toc files in the specified directory (non-recursive)
//  */
// function findTocFiles(directory) {
//     const files = fs.readdirSync(directory);
//     return files
//         .filter(file => file.endsWith('.toc'))
//         .map(file => path.join(directory, file));
// }

// /**
//  * Process a single TOC file and determine if it needs updating
//  */
// function processTocFile(tocFile, html) {
//     const filename = path.basename(tocFile);
//     const content = fs.readFileSync(tocFile, 'utf-8');
//     const currentVersion = getTocInterface(content);

//     if (!currentVersion) {
//         console.log(`  ${filename}: No interface version found, skipping`);
//         return null;
//     }

//     // Remove last 4 digits to get the prefix
//     const prefix = currentVersion.slice(0, -4);
//     const gameType = getGameTypeFromPrefix(prefix);

//     if (!gameType) {
//         console.log(`  ${filename}: Unknown prefix '${prefix}', skipping`);
//         return null;
//     }

//     const wikiVersion = getInterfaceFromHtml(html, gameType);

//     if (!wikiVersion) {
//         console.log(`  ${filename}: Could not fetch wiki version for ${gameType}, skipping`);
//         return null;
//     }

//     if (wikiVersion !== currentVersion) {
//         console.log(`  ${filename}: ${currentVersion} -> ${wikiVersion} (update needed)`);
//         return { tocFile, content, newVersion: wikiVersion, filename };
//     }

//     console.log(`  ${filename}: ${currentVersion} (up to date)`);
//     return null;
// }

// /**
//  * Update a TOC file with a new interface version
//  */
// function updateTocFile(tocFile, content, newVersion) {
//     const updatedContent = updateTocInterface(content, newVersion);
//     fs.writeFileSync(tocFile, updatedContent, 'utf-8');
// }

// /**
//  * Main function
//  */
// async function main() {
//     const [url, scriptDir] = process.argv.slice(2);

//     if (!url || !scriptDir) {
//         console.error('Usage: node addonVersioner.js <url> <directory>');
//         process.exit(1);
//     }

//     // Fetch the webpage
//     const html = await fetchWebpage(url);

//     // Find all .toc files in the directory
//     const tocFiles = findTocFiles(scriptDir);

//     if (tocFiles.length === 0) {
//         console.log('No .toc files found in repository root.');
//         process.exit(0);
//     }

//     console.log('Checking TOC files for updates...');

//     // Process each TOC file and collect those needing updates
//     const filesToUpdate = tocFiles
//         .map(tocFile => processTocFile(tocFile, html))
//         .filter(result => result !== null);

//     console.log('');

//     // If no changes needed, exit
//     if (filesToUpdate.length === 0) {
//         console.log('All interface versions are up to date. No changes needed.');
//         process.exit(0);
//     }

//     // Update the TOC files
//     console.log('');
//     console.log('Updating TOC files...');

//     for (const { tocFile, content, newVersion, filename } of filesToUpdate) {
//         updateTocFile(tocFile, content, newVersion);
//         console.log(`  Updated ${filename} to interface version ${newVersion}`);
//     }
// }

// main().catch(error => {
//     console.error('Error:', error.message);
//     process.exit(1);
// });
