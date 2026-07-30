import chalk from 'chalk'
import { GameType } from './models'
import * as core from '@actions/core'

import { version, author } from '../package.json'
import path from 'path'
import { createColorLogo } from './utils'

/**
 * Mapping of interface number prefixes to game types.
 */
export const GameTypePrefixesMap: Record<string, GameType> = {
  '1': GameType.Vanilla,
  '2': GameType.TBC,
  '3': GameType.WotLK,
  '4': GameType.Cataclysm,
  '5': GameType.Mists,
  '6': GameType.Classic,
  '11': GameType.Mainline,
  '12': GameType.Mainline
}

const LOGO = `
          █████   ███   █████          █████   ███   █████              
         ░░███   ░███  ░░███          ░░███   ░███  ░░███               
          ░███   ░███   ░███   ██████  ░███   ░███   ░███               
          ░███   ░███   ░███  ███░░███ ░███   ░███   ░███               
          ░░███  █████  ███  ░███ ░███ ░░███  █████  ███                
           ░░░█████░█████░   ░███ ░███  ░░░█████░█████░                 
             ░░███ ░░███     ░░██████     ░░███ ░░███                   
              ░░░   ░░░       ░░░░░░       ░░░   ░░░                    
                                                                        
                                                                        
                                                                        
             ███████████    ███████      █████████                      
            ░█░░░███░░░█  ███░░░░░███   ███░░░░░███                     
            ░   ░███  ░  ███     ░░███ ███     ░░░                      
                ░███    ░███      ░███░███                              
                ░███    ░███      ░███░███                              
                ░███    ░░███     ███ ░░███     ███                     
                █████    ░░░███████░   ░░█████████                      
               ░░░░░       ░░░░░░░      ░░░░░░░░░                       
                                                                        
                                                                        
                                                                        
 █████  █████               █████            █████                      
░░███  ░░███               ░░███            ░░███                       
 ░███   ░███  ████████   ███████   ██████   ███████    ██████  ████████ 
 ░███   ░███ ░░███░░███ ███░░███  ░░░░░███ ░░░███░    ███░░███░░███░░███
 ░███   ░███  ░███ ░███░███ ░███   ███████   ░███    ░███████  ░███ ░░░ 
 ░███   ░███  ░███ ░███░███ ░███  ███░░███   ░███ ███░███░░░   ░███     
 ░░████████   ░███████ ░░████████░░████████  ░░█████ ░░██████  █████    
  ░░░░░░░░    ░███░░░   ░░░░░░░░  ░░░░░░░░    ░░░░░   ░░░░░░  ░░░░░     
              ░███                                                      
              █████                                                     
             ░░░░░                                                                                       
`

const tocDirectory = process.env.toc_directory || ''
const githubWorkspace = process.env.GITHUB_WORKSPACE || ''

const prTemplate = (tocTable?: string, actionTable?: string) => {
  const sections: string[] = ['World of Warcraft has updated its versions and your addon files are out of date.\n']

  if (tocTable) {
    sections.push(
      'This PR contains changes to the following TOC files, updating their interface numbers to the latest versions:\n',
      tocTable + '\n'
    )
  }

  if (actionTable) {
    sections.push(
      'The following GitHub Action workflow files have been updated with the latest game versions:\n',
      actionTable + '\n'
    )
  }

  sections.push(
    'If new versions are released before this PR is merged, this PR will automatically update to reflect those changes.\n',
    '---\n',
    '_This PR was created automatically by [WoW Addon Versioner](https://github.com/Jeany55/WowAddonVersioner)._\n'
  )

  return sections.join('\n')
}

const issueTemplate = (tocTable?: string, actionTable?: string) => {
  const sections: string[] = [
    '---\ntitle: Addon Files Out of Date\nlabels: addon-version-update, auto-generated\n---',
    'World of Warcraft has updated its versions and your addon files are out of date.\n'
  ]

  if (tocTable) {
    sections.push('The following TOC files need to be updated:\n', tocTable + '\n')
  }

  if (actionTable) {
    sections.push('The following GitHub Action workflow files need their game versions updated:\n', actionTable + '\n')
  }

  sections.push(
    '---\n',
    '_This issue was created automatically by [WoW Addon Versioner](https://github.com/Jeany55/WowAddonVersioner)._\n'
  )

  return sections.join('\n')
}

export const Constants = {
  COLOR_LOGO: createColorLogo(LOGO),
  GITHUB_WORKSPACE: githubWorkspace,
  ACTION_DIRECTORY: process.env.GITHUB_ACTION_PATH || '',
  TOC_DIRECTORY: tocDirectory ? path.join(githubWorkspace, tocDirectory) : githubWorkspace,
  TOC_DIRECTORY_EXTRA: tocDirectory,
  VERSION: version,
  WIKI_URL: process.env.wiki_url || '',
  UPDATE_ACTION_VERSIONS: process.env.update_action_versions === 'true',
  ACTION_VERSION_REGEX: process.env.action_version_regex || '',
  AUTHOR: author,
  PR_TEMPLATE: prTemplate,
  ISSUE_TEMPLATE: issueTemplate
}
