import * as core from '@actions/core'
import { Constants } from './constants'
import {
  readTocFilesFromDirectory,
  convertDataToHorizontalTable,
  TABLE_STYLE_DOUBLE_LINED,
  fetchWebpage,
  getInterfaceFromHtml,
  convertDataToMarkdownTable
} from './utils'
import chalk from 'chalk'
import fs from 'fs'

import { TocFile } from './models/tocFile'
import path from 'path'

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

    const wikiUrl = core.getInput('wiki-url')

    core.info(`Found ${chalk.bold(tocFiles.length)} .toc file(s)!`)
    core.info(`Fetching current interface numbers from ${chalk.bold(wikiUrl)}...`)

    const rawHTML = await fetchWebpage(wikiUrl)

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

    if (tocsNeededingUpdates.length == 0) {
      core.setOutput('tocs-updated', 0)
      core.info(chalk.greenBright(`All toc files are up to date! No interface updates needed.`))
      return
    }

    core.info(`Found ${chalk.bold(tocsNeededingUpdates.length)} toc file(s) needing interface updates:`)

    if (core.getBooleanInput('fail-job-when-updates-found')) {
      core.error('Failing job due to fail-job-when-updates-found being set to true.')
      const message = `${tocsNeededingUpdates.length} toc file(s) need interface updates: ${tocsNeededingUpdates.map((toc) => toc.fileName).join(', ')}`

      core.error(message)
      core.setFailed(message)
      return
    }

    const tocsOutput = tocsNeededingUpdates.map((tocFile) => ({
      name: tocFile.fileName,
      gameType: tocFile.gameType || 'Unknown',
      oldVersion: tocFile.interfaceNumber,
      newVersion: tocFile.newInterfaceNumber!
    }))

    const markDownTable = convertDataToMarkdownTable([
      ['TOC File', 'Game Type', 'Old Version', 'New Version'],
      ...tocsOutput.map((toc) => [toc.name, toc.gameType, toc.oldVersion, toc.newVersion])
    ])

    core.setOutput('tocs-updated', tocsOutput.length)

    if (core.getBooleanInput('create-issue-if-updates-found')) {
      core.info('Creating issue template file...')

      // Make a brand new file
      fs.writeFileSync(
        path.join(Constants.ACTION_DIRECTORY, 'issue-template.md'),
        Constants.ISSUE_TEMPLATE(markDownTable),
        'utf8'
      )
    }

    core.setOutput('tocs-pr', Constants.PR_TEMPLATE(markDownTable))
    core.setOutput('tocs-issue', Constants.ISSUE_TEMPLATE(markDownTable))

    core.info(
      convertDataToHorizontalTable(
        tocsNeededingUpdates.map((tocFile) => [
          tocFile.fileName,
          `${tocFile.interfaceNumber} -> ${tocFile.newInterfaceNumber}`
        ]),
        [chalk.yellowBright('TOC File'), chalk.yellowBright('Update')]
      )
    )

    core.info('Updating toc files...')
    tocsNeededingUpdates.map((tocFile) => tocFile.saveUpdatedInterfaceNumber())

    core.info(chalk.greenBright.bold('All toc files updated.'))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
