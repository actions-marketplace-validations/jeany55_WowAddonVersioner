import path from 'path'
import fs from 'fs'
import * as core from '@actions/core'

import { TocFile } from './models/tocFile'
import { ActionFile } from './models/actionFile'
import Table, { VerticalTableRow } from 'cli-table3'
import { GameType } from './models'
// import asTable from "as-table";

/**
 * Fetches the content of a webpage.
 * @param url The URL of the webpage to fetch.
 * @returns A promise that resolves to the content of the webpage as a string, or rejects if the fetch fails.
 */
export async function fetchWebpage(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
  }
  return response.text()
}

/**
 * Parses command-line arguments into a key-value map.
 * @returns An object mapping argument names to their values.
 */
export function getScriptParameters(): Record<string, string> {
  const params: Record<string, string> = {}
  const args = process.argv.slice(2) // Skip the first two arguments (node and script path)

  args.forEach((arg) => {
    const [key, value] = arg.split('=')
    if (key && value) {
      params[key] = value
    }
  })

  return params
}

/**
 * Reads all .toc files from the specified directory.
 * @param directory The directory to read .toc files from.
 * @returns An array of TocFile objects representing the .toc files in the directory.
 */
export function readTocFilesFromDirectory(directory: string): TocFile[] {
  const tocFiles: TocFile[] = []
  const files = fs.readdirSync(directory)

  return files.filter((file) => file.endsWith('.toc')).map((file) => new TocFile(file, directory))
}

type TableOptions = Partial<Record<Table.CharName, string>>

export const TABLE_STYLE_DOUBLE_LINED: TableOptions = {
  top: '═',
  'top-mid': '╤',
  'top-left': '╔',
  'top-right': '╗',
  bottom: '═',
  'bottom-mid': '╧',
  'bottom-left': '╚',
  'bottom-right': '╝',
  left: '║',
  'left-mid': '╟',
  mid: '─',
  'mid-mid': '┼',
  right: '║',
  'right-mid': '╢',
  middle: '│'
}

/**
 * Convert an object as a formatted table to a string, ready to print to standard output.
 * @param obj The object to print.
 * @returns {string} The formatted table as a string.
 */
export function convertDataToHorizontalTable(data: any[], headers?: string[], chars?: TableOptions): string {
  const table = new Table({
    head: headers,
    // colWidths: [100, 200],
    chars
  })

  table.push(...data)
  return '\n' + table.toString()
}

/**
 * Convert data to a markdown table string. First row is headers, the rest are data rows.
 * @param data
 */
export function convertDataToMarkdownTable(data: string[][]): string {
  if (data.length === 0) return ''
  let markdown = '\n'

  // Headers
  markdown += '| ' + data[0].join(' | ') + ' |\n'

  // Separator
  markdown += '| ' + data[0].map(() => '---').join(' | ') + ' |\n'

  // Data rows
  data.slice(1).forEach((row) => {
    markdown += '| ' + row.join(' | ') + ' |\n'
  })

  return markdown
}

/**
 * Convert HSL to RGB
 * @param h Hue (0-360)
 * @param s Saturation (0-1)
 * @param l Lightness (0-1)
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0,
    g = 0,
    b = 0

  if (h < 60) {
    r = c
    g = x
    b = 0
  } else if (h < 120) {
    r = x
    g = c
    b = 0
  } else if (h < 180) {
    r = 0
    g = c
    b = x
  } else if (h < 240) {
    r = 0
    g = x
    b = c
  } else if (h < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

/**
 * Apply smooth rainbow gradient coloring to each character of the logo
 */
export function createColorLogo(logo: string): string {
  const lines = logo.split('\n')
  const coloredLines: string[] = []

  // Find the maximum line length for consistent gradient
  const maxLength = Math.max(...lines.map((l) => l.length))

  for (const line of lines) {
    let coloredLine = ''

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char !== ' ' && char !== '\n') {
        // Calculate hue based on horizontal position (0-300 for a nice rainbow, avoiding harsh magenta-to-red wrap)
        const hue = (i / maxLength) * 300
        // Use 85% saturation and 60% lightness for vibrant but not harsh colors on dark backgrounds
        const [r, g, b] = hslToRgb(hue, 0.85, 0.6)
        coloredLine += `\x1b[38;2;${r};${g};${b}m${char}\x1b[0m`
      } else {
        coloredLine += char
      }
    }
    coloredLines.push(coloredLine)
  }

  return coloredLines.join('\n')
}

/**
 * Extract interface number for a specific game type from the HTML
 * The table format is: Game type | Expansion | Version | Number | Date | Interface
 * Looks for an exact match of the game type in a <td> tag
 * @param html The HTML content to search.
 * @param gameType The game type to find the interface number for.
 * @returns The interface number as a string, or null if not found.
 */
export function getInterfaceFromHtml(html: string, gameType: GameType) {
  // Match rows that contain exactly <td>GameType</td> followed by interface in <code> tags
  const regex = new RegExp(`<td>${gameType}</td>[\\s\\S]*?<code>(\\d+)</code>`, 'g')
  const match = regex.exec(html)
  return match ? match[1] : null
}

export function createFileAndWriteContents(filePath: string, contents: string) {
  fs.writeFileSync(filePath, contents, 'utf8')
}

/**
 * Extract the game version string (e.g. "12.0.1") for a specific game type from the wiki HTML.
 * The table format is: Game type | Expansion | Version | Number | Date | Interface
 * Targets the Version column (3rd column) after matching the game type.
 * @param html The HTML content to search.
 * @param gameType The game type to find the version for.
 * @returns The version string, or null if not found.
 */
export function getVersionFromHtml(html: string, gameType: GameType): string | null {
  // Match: <td>GameType</td> then skip two <td>...</td> (Icon + Expansion), then capture version from the next <td>
  // The version may be wrapped in an <a> tag, so we skip any inner tags before capturing digits
  const regex = new RegExp(
    `<td>\\s*${gameType}\\s*</td>` +
      `\\s*<td[^>]*>[\\s\\S]*?</td>` + // Skip Icon column
      `\\s*<td[^>]*>[\\s\\S]*?</td>` + // Skip Expansion column
      `\\s*<td[^>]*>[\\s\\S]*?(\\d[\\d.]+)`, // Capture Version (may be inside <a> tags)
    's'
  )
  const match = regex.exec(html)
  return match ? match[1].trim() : null
}

/**
 * Extract all game version strings from the wiki HTML, returning a map of GameType to version.
 * @param html The HTML content to search.
 * @returns A map of GameType to latest version string.
 */
export function getAllVersionsFromHtml(html: string): Map<GameType, string> {
  const versions = new Map<GameType, string>()

  for (const gameType of Object.values(GameType)) {
    const version = getVersionFromHtml(html, gameType)
    if (version) {
      versions.set(gameType, version)
    }
  }

  return versions
}

/**
 * Reads all GitHub Action workflow files (.yml/.yaml) from the .github/workflows directory.
 * @param workspaceDir The repository root directory.
 * @returns An array of ActionFile objects.
 */
export function readActionFilesFromDirectory(workspaceDir: string): ActionFile[] {
  const workflowsDir = path.join(workspaceDir, '.github', 'workflows')

  if (!fs.existsSync(workflowsDir)) return []

  const files = fs.readdirSync(workflowsDir)
  return files
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map((f) => new ActionFile(f, workflowsDir, workspaceDir))
}
