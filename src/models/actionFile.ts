import path from 'path'
import { GameType } from '.'
import fs from 'fs'

export interface ActionVersionUpdate {
  gameType: GameType
  oldVersion: string
  newVersion: string
}

export interface ActionVersionFound {
  gameType: GameType | null
  currentVersion: string
  latestVersion: string | null
}

/**
 * Represents a GitHub Action workflow file that may contain WoW game version strings.
 * @class
 * @param {string} fileName The name of the workflow file.
 * @param {string} location The directory path of the workflow file.
 */
export class ActionFile {
  fileName: string
  filePath: string
  relativePath: string
  fileContents: string
  originalContents: string
  versionUpdates: ActionVersionUpdate[] = []
  foundVersions: ActionVersionFound[] = []

  constructor(fileName: string, location: string, workspaceDir: string) {
    this.fileName = fileName
    this.filePath = path.join(location, fileName)
    this.relativePath = path.relative(workspaceDir, this.filePath)
    this.fileContents = fs.readFileSync(this.filePath, 'utf-8')
    this.originalContents = this.fileContents
  }

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
  checkAndUpdateVersions(latestVersions: Map<GameType, string>, versionPattern: string): void {
    const pattern = new RegExp(versionPattern, 'gm')

    for (const regionMatch of [...this.fileContents.matchAll(pattern)]) {
      const originalRegion = regionMatch[0]

      // Extract all individual version strings from within the matched region
      const versionMatches = [...originalRegion.matchAll(/\d+\.\d+\.\d+/g)]
      if (versionMatches.length === 0) continue

      const updatedRegion = versionMatches.reduce((region, versionMatch) => {
        const version = versionMatch[0]
        const gameType = this.findGameTypeForVersion(version, latestVersions)
        const latestVersion = gameType ? (latestVersions.get(gameType) ?? null) : null

        this.foundVersions.push({
          gameType,
          currentVersion: version,
          latestVersion
        })

        if (!gameType) return region

        if (!latestVersion || !ActionFile.isVersionNewer(latestVersion, version)) return region

        this.versionUpdates.push({
          gameType,
          oldVersion: version,
          newVersion: latestVersion
        })

        return region.replace(version, latestVersion)
      }, originalRegion)

      if (updatedRegion !== originalRegion) {
        this.fileContents = this.fileContents.replace(originalRegion, updatedRegion)
      }
    }
  }

  /**
   * Determine which GameType a version string belongs to by matching against
   * the latest known versions from the wiki. Uses major.minor matching first,
   * then falls back to major version matching if unambiguous.
   */
  private findGameTypeForVersion(version: string, latestVersions: Map<GameType, string>): GameType | null {
    const majorMinor = version.split('.').slice(0, 2).join('.')
    const majorVersion = version.split('.')[0]

    // First try exact major.minor match
    for (const [gameType, latestVersion] of [...latestVersions]) {
      const latestMajorMinor = latestVersion.split('.').slice(0, 2).join('.')
      if (latestMajorMinor === majorMinor) return gameType
    }

    // Fallback to major version match (only if unambiguous)
    const majorMatches: GameType[] = []
    for (const [gameType, latestVersion] of [...latestVersions]) {
      if (latestVersion.split('.')[0] === majorVersion) majorMatches.push(gameType)
    }
    if (majorMatches.length === 1) return majorMatches[0]

    return null
  }

  /**
   * Compare two version strings (e.g. "12.0.1" vs "12.0.2").
   * Returns true if newVersion is strictly newer than oldVersion.
   */
  static isVersionNewer(newVersion: string, oldVersion: string): boolean {
    const newParts = newVersion.split('.').map(Number)
    const oldParts = oldVersion.split('.').map(Number)

    for (let i = 0; i < Math.max(newParts.length, oldParts.length); i++) {
      const n = newParts[i] || 0
      const o = oldParts[i] || 0
      if (n > o) return true
      if (n < o) return false
    }
    return false
  }

  get hasUpdates(): boolean {
    return this.versionUpdates.length > 0
  }

  saveUpdatedVersions(): void {
    if (this.hasUpdates) {
      fs.writeFileSync(this.filePath, this.fileContents, 'utf-8')
    }
  }
}
