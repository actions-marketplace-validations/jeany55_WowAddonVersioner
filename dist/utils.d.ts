import { TocFile } from './models/tocFile';
import { ActionFile } from './models/actionFile';
import Table from 'cli-table3';
import { GameType } from './models';
/**
 * Fetches the content of a webpage.
 * @param url The URL of the webpage to fetch.
 * @returns A promise that resolves to the content of the webpage as a string, or rejects if the fetch fails.
 */
export declare function fetchWebpage(url: string): Promise<string>;
/**
 * Parses command-line arguments into a key-value map.
 * @returns An object mapping argument names to their values.
 */
export declare function getScriptParameters(): Record<string, string>;
/**
 * Reads all .toc files from the specified directory.
 * @param directory The directory to read .toc files from.
 * @returns An array of TocFile objects representing the .toc files in the directory.
 */
export declare function readTocFilesFromDirectory(directory: string): TocFile[];
type TableOptions = Partial<Record<Table.CharName, string>>;
export declare const TABLE_STYLE_DOUBLE_LINED: TableOptions;
/**
 * Convert an object as a formatted table to a string, ready to print to standard output.
 * @param obj The object to print.
 * @returns {string} The formatted table as a string.
 */
export declare function convertDataToHorizontalTable(data: any[], headers?: string[], chars?: TableOptions): string;
/**
 * Convert data to a markdown table string. First row is headers, the rest are data rows.
 * @param data
 */
export declare function convertDataToMarkdownTable(data: string[][]): string;
/**
 * Apply smooth rainbow gradient coloring to each character of the logo
 */
export declare function createColorLogo(logo: string): string;
/**
 * Extract interface number for a specific game type from the HTML
 * The table format is: Game type | Expansion | Version | Number | Date | Interface
 * Looks for an exact match of the game type in a <td> tag
 * @param html The HTML content to search.
 * @param gameType The game type to find the interface number for.
 * @returns The interface number as a string, or null if not found.
 */
export declare function getInterfaceFromHtml(html: string, gameType: GameType): string | null;
export declare function createFileAndWriteContents(filePath: string, contents: string): void;
/**
 * Extract the game version string (e.g. "12.0.1") for a specific game type from the wiki HTML.
 * The table format is: Game type | Expansion | Version | Number | Date | Interface
 * Targets the Version column (3rd column) after matching the game type.
 * @param html The HTML content to search.
 * @param gameType The game type to find the version for.
 * @returns The version string, or null if not found.
 */
export declare function getVersionFromHtml(html: string, gameType: GameType): string | null;
/**
 * Extract all game version strings from the wiki HTML, returning a map of GameType to version.
 * @param html The HTML content to search.
 * @returns A map of GameType to latest version string.
 */
export declare function getAllVersionsFromHtml(html: string): Map<GameType, string>;
/**
 * Reads all GitHub Action workflow files (.yml/.yaml) from the .github/workflows directory.
 * @param workspaceDir The repository root directory.
 * @returns An array of ActionFile objects.
 */
export declare function readActionFilesFromDirectory(workspaceDir: string): ActionFile[];
export {};
