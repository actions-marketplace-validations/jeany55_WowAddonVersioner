#!/bin/bash

# Fetch the webpage and parse the Latest Builds table to extract interface numbers
# for different WoW game versions, then update TOC files if needed
#
# Game type prefixes (interface number with last 4 digits removed):
#   1  -> Vanilla
#   2  -> TBC
#   3  -> Wrath
#   4  -> Cata
#   5  -> Mists
#   11 -> Mainline
#   12 -> Mainline

URL="$1"

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Fetch the webpage
HTML=$(curl -s "$URL")

# Function to extract interface number for a specific game type
# The table format is: Game type | Expansion | Version | Number | Date | Interface
# The interface number is in a <code> tag at the end of the row
# We look for an exact match of the game type in a <td> tag (to avoid matching "Mainline Beta" etc)
get_interface() {
    local game_type="$1"
    # Find the line with exactly <td>GameType</td>, then get the next few lines
    # and extract the interface number from the <code> tag
    echo "$HTML" | grep -A7 "<td>$game_type</td>" | grep -oP '<code>\K[0-9]+(?=</code>)' | head -1
}

# Function to get current interface version from a TOC file
get_toc_interface() {
    local toc_file="$1"
    grep -oP '## Interface: \K[0-9]+' "$toc_file"
}

# Function to update interface version in a TOC file
update_toc_interface() {
    local toc_file="$1"
    local new_version="$2"
    sed -i "s/## Interface: [0-9]*/## Interface: $new_version/" "$toc_file"
}

# Function to get game type from interface number prefix
get_game_type_from_prefix() {
    local prefix="$1"
    case "$prefix" in
        1)  echo "Vanilla" ;;
        2)  echo "TBC" ;;
        3)  echo "Wrath" ;;
        4)  echo "Cata" ;;
        5)  echo "Mists" ;;
        11) echo "Mainline" ;;
        12) echo "Mainline" ;;
        *)  echo "" ;;
    esac
}

# Find all .toc files in the root directory
TOC_FILES=$(find "$SCRIPT_DIR" -maxdepth 1 -name "*.toc" -type f)

if [[ -z "$TOC_FILES" ]]; then
    echo "No .toc files found in repository root."
    exit 0
fi

# Track which files need updating and the versions being changed
declare -a FILES_TO_UPDATE
declare -a VERSION_CHANGES

echo "Checking TOC files for updates..."

while IFS= read -r toc_file; do
    [[ -z "$toc_file" ]] && continue
    
    toc_filename=$(basename "$toc_file")
    current_version=$(get_toc_interface "$toc_file")
    
    if [[ -z "$current_version" ]]; then
        echo "  $toc_filename: No interface version found, skipping"
        continue
    fi
    
    # Remove last 4 digits to get the prefix
    prefix="${current_version%????}"
    
    # Get the game type from the prefix
    game_type=$(get_game_type_from_prefix "$prefix")
    
    if [[ -z "$game_type" ]]; then
        echo "  $toc_filename: Unknown prefix '$prefix', skipping"
        continue
    fi
    
    # Get the wiki version for this game type
    wiki_version=$(get_interface "$game_type")
    
    if [[ -z "$wiki_version" ]]; then
        echo "  $toc_filename: Could not fetch wiki version for $game_type, skipping"
        continue
    fi
    
    if [[ "$wiki_version" != "$current_version" ]]; then
        echo "  $toc_filename: $current_version -> $wiki_version (update needed)"
        FILES_TO_UPDATE+=("$toc_file")
        VERSION_CHANGES+=("$wiki_version")
    else
        echo "  $toc_filename: $current_version (up to date)"
    fi
done <<< "$TOC_FILES"

echo ""

# If no changes needed, exit with code 0
if [[ ${#FILES_TO_UPDATE[@]} -eq 0 ]]; then
    echo "All interface versions are up to date. No changes needed."
    exit 0
fi

# Update the TOC files
echo ""
echo "Updating TOC files..."

for i in "${!FILES_TO_UPDATE[@]}"; do
    toc_file="${FILES_TO_UPDATE[$i]}"
    new_version="${VERSION_CHANGES[$i]}"
    toc_filename=$(basename "$toc_file")
    
    update_toc_interface "$toc_file" "$new_version"
    echo "  Updated $toc_filename to interface version $new_version"
done

