import * as core from '@actions/core'
import { Constants } from './constants'
import {
  readTocFilesFromDirectory,
  readActionFilesFromDirectory,
  convertDataToHorizontalTable,
  TABLE_STYLE_DOUBLE_LINED,
  fetchWebpage,
  getInterfaceFromHtml,
  getAllVersionsFromHtml,
  convertDataToMarkdownTable
} from './utils'
import { Chalk } from 'chalk'
import fs from 'fs'

import { TocFile } from './models/tocFile'
import { ActionFile } from './models/actionFile'
import path from 'path'

// Force chalk to use color level 3 (24-bit/truecolor) for GitHub Actions compatibility
const chalk = new Chalk({ level: 3 })

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    core.info(
      Constants.COLOR_LOGO +
        convertDataToHorizontalTable(
          [
            [
              chalk.rgb(255, 153, 235)(Constants.VERSION),
              chalk.rgb(255, 153, 235)(Constants.AUTHOR),
              chalk.blueBright('Quetz the Great')
            ]
          ],
          [chalk.white('Version'), chalk.white('Author'), chalk.white('Special Thanks')],
          TABLE_STYLE_DOUBLE_LINED
        ) +
        '\n──────────────────────────────────────────────────────────────────────────────────────────────────────────────'
    )

    core.info(`Checking for toc files in directory: ${chalk.bold(Constants.TOC_DIRECTORY)}`)

    const tocFiles = readTocFilesFromDirectory(Constants.TOC_DIRECTORY)
    if (tocFiles.length === 0) {
      core.error(
        chalk.red('No .toc files found in the specified directory! Check the "toc-directory" input and try again.')
      )
      core.setFailed(chalk.red('No .toc files found in the specified directory.'))
      return
    }

    const wikiUrl = Constants.WIKI_URL

    core.info(`Found ${chalk.bold(tocFiles.length)} .toc file(s)!`)
    core.info(`Fetching current interface numbers from ${chalk.bold(wikiUrl)}...`)

    const rawHTML = await fetchWebpage(wikiUrl)

    // ── TOC file processing ──────────────────────────────────────────────

    core.info('Comparing toc interface numbers with latest versions...')

    tocFiles.forEach((tocFile) => {
      if (tocFile.gameType) {
        const latestInterface = getInterfaceFromHtml(rawHTML, tocFile.gameType)
        if (latestInterface) {
          tocFile.checkAndUpdateInterfaceVersion(latestInterface)
        } else {
          tocFile.noKnownInterface = true
        }
      }
    })

    const tocsNeededingUpdates: TocFile[] = []

    core.info(
      convertDataToHorizontalTable(
        tocFiles.map((tocFile) => {
          let newInterfaceNumber = ''
          if (tocFile.newInterfaceNumber) {
            newInterfaceNumber = chalk.greenBright(tocFile.newInterfaceNumber)
            tocsNeededingUpdates.push(tocFile)
          } else if (tocFile.noKnownInterface) {
            newInterfaceNumber = chalk.red('Unknown latest!')
          } else {
            newInterfaceNumber = tocFile.interfaceNumber
          }

          return [tocFile.fileName, tocFile.gameType || 'Unknown', tocFile.interfaceNumber, newInterfaceNumber]
        }),
        [
          chalk.yellowBright('TOC File'),
          chalk.yellowBright('Game Type'),
          chalk.yellowBright('Current Interface Version'),
          chalk.yellowBright('Newest Interface Version')
        ]
      )
    )

    // ── GitHub Action file processing ────────────────────────────────────

    const actionsNeedingUpdates: ActionFile[] = []

    if (Constants.UPDATE_ACTION_VERSIONS) {
      core.info('\nScanning GitHub Action workflow files for outdated game versions...')

      const latestVersions = getAllVersionsFromHtml(rawHTML)
      const actionFiles = readActionFilesFromDirectory(Constants.GITHUB_WORKSPACE)

      if (actionFiles.length === 0) {
        core.info('No GitHub Action workflow files found in .github/workflows/')
      } else {
        core.info(`Found ${chalk.bold(actionFiles.length)} workflow file(s). Checking for game version strings...`)

        for (const actionFile of actionFiles) {
          actionFile.checkAndUpdateVersions(latestVersions, Constants.ACTION_VERSION_REGEX)
        }

        // Collect action files needing updates
        for (const actionFile of actionFiles) {
          if (actionFile.hasUpdates) {
            actionsNeedingUpdates.push(actionFile)
          }
        }

        // Build overview table showing all found versions (like the TOC table)
        const actionOverviewRows: string[][] = []
        for (const actionFile of actionFiles) {
          for (const found of actionFile.foundVersions) {
            let newestVersion = ''
            if (!found.gameType) {
              newestVersion = chalk.red('Unknown game type!')
            } else if (!found.latestVersion) {
              newestVersion = chalk.red('Unknown latest!')
            } else if (ActionFile.isVersionNewer(found.latestVersion, found.currentVersion)) {
              newestVersion = chalk.greenBright(found.latestVersion)
            } else {
              newestVersion = found.currentVersion
            }

            actionOverviewRows.push([
              actionFile.relativePath,
              found.gameType || 'Unknown',
              found.currentVersion,
              newestVersion
            ])
          }
        }

        if (actionOverviewRows.length > 0) {
          core.info(
            convertDataToHorizontalTable(actionOverviewRows, [
              chalk.yellowBright('Action File'),
              chalk.yellowBright('Game Type'),
              chalk.yellowBright('Current Version'),
              chalk.yellowBright('Newest Version')
            ])
          )
        } else {
          core.info('No game version strings found in workflow files.')
        }
      }
    }

    // ── Determine if any updates are needed ──────────────────────────────

    const totalUpdates = tocsNeededingUpdates.length + actionsNeedingUpdates.length

    if (totalUpdates === 0) {
      core.setOutput('tocs-updated', 0)
      core.setOutput('actions-updated', 0)
      core.info(chalk.greenBright('Everything is up to date! No updates needed.'))
      return
    }

    if (tocsNeededingUpdates.length > 0) {
      core.info(`Found ${chalk.bold(tocsNeededingUpdates.length)} toc file(s) needing interface updates.`)
    }
    if (actionsNeedingUpdates.length > 0) {
      core.info(`Found ${chalk.bold(actionsNeedingUpdates.length)} action file(s) needing game version updates.`)
    }

    if (process.env.fail_job_when_updates_found === 'true') {
      core.error('Failing job due to fail-job-when-updates-found being set to true.')
      const parts: string[] = []
      if (tocsNeededingUpdates.length > 0) {
        parts.push(
          `${tocsNeededingUpdates.length} toc file(s) need interface updates: ${tocsNeededingUpdates.map((toc) => toc.fileName).join(', ')}`
        )
      }
      if (actionsNeedingUpdates.length > 0) {
        parts.push(
          `${actionsNeedingUpdates.length} action file(s) need version updates: ${actionsNeedingUpdates.map((a) => a.relativePath).join(', ')}`
        )
      }
      const message = parts.join('; ')
      core.error(message)
      core.setFailed(message)
      return
    }

    // ── Build markdown tables for PR/issue ───────────────────────────────

    const tocMarkdownTable =
      tocsNeededingUpdates.length > 0
        ? convertDataToMarkdownTable([
            ['TOC File', 'Game Type', 'Old Version', 'New Version'],
            ...tocsNeededingUpdates.map((toc) => [
              toc.fileName,
              toc.gameType || 'Unknown',
              toc.interfaceNumber,
              toc.newInterfaceNumber!
            ])
          ])
        : undefined

    const actionMarkdownTable =
      actionsNeedingUpdates.length > 0
        ? convertDataToMarkdownTable([
            ['Action File', 'Game Type', 'Old Version', 'New Version'],
            ...actionsNeedingUpdates.flatMap((actionFile) =>
              actionFile.versionUpdates.map((update) => [
                actionFile.relativePath,
                update.gameType,
                update.oldVersion,
                update.newVersion
              ])
            )
          ])
        : undefined

    core.setOutput('tocs-updated', tocsNeededingUpdates.length)
    core.setOutput('actions-updated', actionsNeedingUpdates.length)

    if (process.env.create_issue_if_updates_found === 'true') {
      core.info('Creating issue template file...')

      fs.writeFileSync(
        path.join(Constants.ACTION_DIRECTORY, 'issue-template.md'),
        Constants.ISSUE_TEMPLATE(tocMarkdownTable, actionMarkdownTable),
        'utf8'
      )
    }

    core.setOutput('tocs-pr', Constants.PR_TEMPLATE(tocMarkdownTable, actionMarkdownTable))
    core.setOutput('tocs-issue', Constants.ISSUE_TEMPLATE(tocMarkdownTable, actionMarkdownTable))

    // ── Display summary and apply updates ────────────────────────────────

    if (tocsNeededingUpdates.length > 0) {
      core.info(
        convertDataToHorizontalTable(
          tocsNeededingUpdates.map((tocFile) => [
            tocFile.fileName,
            `${tocFile.interfaceNumber} -> ${tocFile.newInterfaceNumber}`
          ]),
          [chalk.yellowBright('TOC File'), chalk.yellowBright('Update')]
        )
      )
    }

    if (actionsNeedingUpdates.length > 0) {
      core.info(
        convertDataToHorizontalTable(
          actionsNeedingUpdates.flatMap((actionFile) =>
            actionFile.versionUpdates.map((update) => [
              actionFile.relativePath,
              `${update.oldVersion} -> ${update.newVersion}`
            ])
          ),
          [chalk.yellowBright('Action File'), chalk.yellowBright('Update')]
        )
      )
    }

    core.info('Updating files...')
    tocsNeededingUpdates.forEach((tocFile) => tocFile.saveUpdatedInterfaceNumber())
    actionsNeedingUpdates.forEach((actionFile) => actionFile.saveUpdatedVersions())

    core.info(chalk.greenBright.bold('All files updated.'))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
