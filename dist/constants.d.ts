import { GameType } from './models';
/**
 * Mapping of interface number prefixes to game types.
 */
export declare const GameTypePrefixesMap: Record<string, GameType>;
export declare const Constants: {
    COLOR_LOGO: string;
    GITHUB_WORKSPACE: string;
    ACTION_DIRECTORY: string;
    TOC_DIRECTORY: string;
    TOC_DIRECTORY_EXTRA: string;
    VERSION: string;
    WIKI_URL: string;
    UPDATE_ACTION_VERSIONS: boolean;
    ACTION_VERSION_REGEX: string;
    AUTHOR: string;
    PR_TEMPLATE: (tocTable?: string, actionTable?: string) => string;
    ISSUE_TEMPLATE: (tocTable?: string, actionTable?: string) => string;
};
