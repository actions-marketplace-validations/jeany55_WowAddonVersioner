import { GameType } from '.';
/**
 * Represents a World of Warcraft addon TOC file.
 * @class
 * @param {string} fileName The name of the TOC file.
 * @param {string} location The file path of the TOC file (not including the file name).
 */
export declare class TocFile {
    fileName: string;
    filePath: string;
    gameType?: GameType;
    interfaceNumber: string;
    fileContents: string;
    newInterfaceNumber?: string;
    noKnownInterface: boolean;
    constructor(fileName: string, location: string);
    checkAndUpdateInterfaceVersion(newInterface: string): void;
    saveUpdatedInterfaceNumber(): void;
}
