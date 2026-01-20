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

const tocDirectory = core.getInput('toc-directory')
const githubWorkspace = process.env.GITHUB_WORKSPACE || ''

const prTemplate = (
  table: string
) => `World of Warcraft has updated its interface numbers and your addon TOC files are out of date.

This PR contains changes to the following TOC files, updating their interface numbers to the latest versions:

${table}

If new interface versions are released before this PR is merged, this PR will automatically update to reflect those changes.

---

_This PR was created automatically by [WoW Addon Versioner](https://github.com/Jeany55/WowAddonVersioner)._
`

const issueTemplate = (table: string) => `---
title: Addon TOC Files Out of Date
labels: addon-version-update, auto-generated
---
World of Warcraft has updated its interface numbers and your addon TOC files are out of date.

The following TOC files need to be updated:

${table}

---

_This issue was created automatically by [WoW Addon Versioner](https://github.com/Jeany55/WowAddonVersioner)._
`

export const Constants = {
  COLOR_LOGO: createColorLogo(LOGO),
  GITHUB_WORKSPACE: process.env.GITHUB_WORKSPACE || '',
  ACTION_DIRECTORY: process.env.GITHUB_ACTION_PATH || '',
  TOC_DIRECTORY: tocDirectory ? path.join(githubWorkspace, tocDirectory) : githubWorkspace,
  TOC_DIRECTORY_EXTRA: tocDirectory,
  VERSION: version,
  AUTHOR: author,
  PR_TEMPLATE: prTemplate,
  ISSUE_TEMPLATE: issueTemplate
}
