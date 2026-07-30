import { GameType } from '.';
export interface ActionVersionUpdate {
    gameType: GameType;
    oldVersion: string;
    newVersion: string;
}
export interface ActionVersionFound {
    gameType: GameType | null;
    currentVersion: string;
    latestVersion: string | null;
}
/**
 * Represents a GitHub Action workflow file that may contain WoW game version strings.
 * @class
 * @param {string} fileName The name of the workflow file.
 * @param {string} location The directory path of the workflow file.
 */
export declare class ActionFile {
    fileName: string;
    filePath: string;
    relativePath: string;
    fileContents: string;
    originalContents: string;
    versionUpdates: ActionVersionUpdate[];
    foundVersions: ActionVersionFound[];
    constructor(fileName: string, location: string, workspaceDir: string);
    /**
     * Find game version strings in the file and update any outdated versions.
     *
     * The versionPattern regex defines what a "region containing game versions" looks like.
     * Within each match of that pattern, individual version strings (X.Y.Z) are extracted,
     * looked up against the wiki, and replaced if outdated.
     *
     * @param latestVersions Map of GameType to latest version string from the wiki.
     * @param versionPattern Regex string that matches the region containing game versions.
     *                       Individual X.Y.Z versions are extracted from within each match.
     */
    checkAndUpdateVersions(latestVersions: Map<GameType, string>, versionPattern: string): void;
    /**
     * Determine which GameType a version string belongs to by matching against
     * the latest known versions from the wiki. Uses major.minor matching first,
     * then falls back to major version matching if unambiguous.
     */
    private findGameTypeForVersion;
    /**
     * Compare two version strings (e.g. "12.0.1" vs "12.0.2").
     * Returns true if newVersion is strictly newer than oldVersion.
     */
    static isVersionNewer(newVersion: string, oldVersion: string): boolean;
    get hasUpdates(): boolean;
    saveUpdatedVersions(): void;
}
