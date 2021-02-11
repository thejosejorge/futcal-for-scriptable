// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: futbol;

// Widget customisation
const defaultSettings = {
    teamId: "9768",
    timeZone: "Europe/London",

    language: "system",

    smallWidgetView: args.widgetParameter ? args.widgetParameter : "table",

    showMatchesRound: false,
    showMatchesTeamsNames: true,
    showMatchesTeamsBadges: false,
    showMatchesOnlyOpposition: false,
    showHomeOrAway : false,
    matchesTwelveHourClock: false,
    showMatchesDayOfWeek: false,
    showMatchesLiveTime: false,
    showLeagueSubtitle: false,
    showCirclePositionHighlight: true,
    showRowPositionHighlight: false,

    backgroundColor: {
        light: "#ffffff",
        dark: "#1c1c1e"
    },
    leagueTitleColor: {
        light: "#ff3b30",
        dark: "#ff453a"
    },
    highlightedPositionColor: {
        light: "#ff3b30",
        dark: "#ff453a"
    },
    highlightedRowColor: {
        light: "#e5e6ea",
        dark: "#3a3a3c"
    },
    liveColor: {
        light: "#ff3b30",
        dark: "#ff453a"
    }
};

// Create folder to store data
let fm = FileManager.local();
const iCloudUsed = fm.isFileStoredIniCloud(module.filename);
fm = iCloudUsed ? FileManager.iCloud() : fm;
const widgetFolder = "Futcal";
const offlinePath = fm.joinPath(fm.documentsDirectory(), widgetFolder);
if (!fm.fileExists(offlinePath)) fm.createDirectory(offlinePath);

// Get user settings
let userSettings;
const userSettingsOffline = "userSettings.json";
if (!fm.fileExists(fm.joinPath(offlinePath, userSettingsOffline))) {
    userSettings = defaultSettings;
} else {
    if (iCloudUsed) await fm.downloadFileFromiCloud(fm.joinPath(offlinePath, userSettingsOffline));
    userSettings = JSON.parse(fm.readString(fm.joinPath(offlinePath, userSettingsOffline)));
}

// Get language settings
let language;
const supportedLanguages = getDictionary(language)[0];

if (userSettings.language == "system") {
    let systemLanguage = Device.preferredLanguages()[0];
    language = systemLanguage.split("-")[0];
} else {
    language = userSettings.language;
}
if (!(supportedLanguages.includes(language))) {
  console.log("Language Error: Language not found, defaulting to English.")
  language = "en";
};
const dictionary = getDictionary(language)[1];

// Define FotMob API URLs
const baseApiUrl = encodeURI("https://www.fotmob.com");
const teamDataApiUrl = encodeURI(`${baseApiUrl}/teams?id=${userSettings.teamId}&tab=overview&type=team&timeZone=${userSettings.timeZone}`);
const matchDetailsApiUrl = encodeURI(`${baseApiUrl}/matchDetails?matchId=`);

// Get team data
const teamData = await getData(teamDataApiUrl, "teamData.json");

// Set tap URLs
const teamTapUrl = encodeURI(`${baseApiUrl}/teams/${userSettings.teamId}/overview`);
const teamMatchesTapUrl = encodeURI(`${baseApiUrl}/teams/${userSettings.teamId}/fixtures`);
let leagueTableTapUrl;
if (teamData) {
    const leagueOverviewUrl = encodeURI(`${baseApiUrl}${teamData.tableData.tables[0].pageUrl}`);
    leagueTableTapUrl = leagueOverviewUrl.replace("overview", "table");
}

// Run
if (config.runsInWidget) {
    let widget = await createWidget();
    Script.setWidget(widget);
    Script.complete();
} else {
    let widget = await createWidget();
    Script.complete();
    await widget.presentMedium();
}

// *** Functions *** //

// Create widget UI
async function createWidget() {
    let widget = new ListWidget();
    widget.backgroundColor = Color.dynamic(new Color(userSettings.backgroundColor.light), new Color(userSettings.backgroundColor.dark));
    setWidgetBackground(widget);

    let showMatchesView = true;
    let showTableView = true;

    let paddingLeft = 14;
    let paddingRight = 13;
    let paddingTop = 15.5;
    let paddingBottom = 16;

    if (teamData) {
        // By default small widgets will show the Table View, in order to see the Matches View edit the widget and add "matches" in the Parameter box
        if (config.widgetFamily === "small") {
            if (defaultSettings.smallWidgetView === "matches") {
                widget.url = teamMatchesTapUrl;
                showTableView = false;

                paddingLeft = 10;
                paddingRight = 10;
                paddingBottom = 20;
            } else {
                widget.url = leagueTableTapUrl;
                showMatchesView = false;

                paddingLeft = 0;
                paddingRight = 0;
            }
        }
        widget.setPadding(paddingTop, paddingLeft, paddingBottom, paddingRight);

        const globalStack = widget.addStack();
        globalStack.url = teamTapUrl;

        if (showMatchesView) {
            await addWidgetMatches(globalStack);
        }
        if (showTableView) {
            await addWidgetTable(globalStack);
        }
    } else {
        const offlineError = dictionary.nointernetConnection;
        const errorStack = widget.addStack();
        addFormattedText(errorStack, offlineError, Font.regularSystemFont(14), Color.gray(), null, true);
    }
    return widget;
}

// Create matches view
async function addWidgetMatches(globalStack) {
    const teamMatches = teamData.fixtures;
    // Find next match (first match not started and not cancelled)
    const nextMatchIndex = teamMatches.findIndex(obj => obj.notStarted && !obj.status.cancelled);
    const nextMatch = teamMatches[nextMatchIndex];
    // Assume previous match is the one before the next
    let previousMatchIndex = nextMatchIndex - 1;
    if (nextMatch == undefined) {
        // If no next match available season is over, previous match is the last of the season, if exists
        previousMatchIndex = teamMatches.length - 1;
    }
    const previousMatch = teamMatches[previousMatchIndex];

    const matchesStack = globalStack.addStack();
    matchesStack.url = teamMatchesTapUrl;
    globalStack.addSpacer();
    matchesStack.layoutVertically();
    matchesStack.addSpacer(1.5);
    await addWidgetMatch(matchesStack, previousMatch, "Previous");
    matchesStack.addSpacer(9.5);
    const matchesSeparatorStack = matchesStack.addStack();
    matchesSeparatorStack.addSpacer(2);
    const separatorValue = (dictionary.matchTitleNext).toUpperCase();
    addFormattedText(matchesSeparatorStack, separatorValue, Font.semiboldSystemFont(11), Color.gray(), 1, false);
    matchesStack.addSpacer(3);
    await addWidgetMatch(matchesStack, nextMatch, "Next");
}

// Create specific match
async function addWidgetMatch(matchesStack, match, title) {
    matchesStack.addSpacer(2);
    const matchStack = matchesStack.addStack();
    matchStack.size = new Size(0, 46);

    if (match != undefined) {
        const matchTapUrl = encodeURI(`${baseApiUrl}${match.pageUrl}`);
        matchStack.url = matchTapUrl;
        const matchDetailsUrl = `${matchDetailsApiUrl}${match.id}`;
        const matchDetailsOffline = `match${title}.json`;
        const matchDetails = await getData(matchDetailsUrl, matchDetailsOffline);

        let resultColor = Color.gray();
        if (matchDetails.header.status.started) {
            if (match.home.score == match.away.score) {
                resultColor = Color.yellow();
            } else if ((matchDetails.header.teams[0].score > matchDetails.header.teams[1].score && match.home.id == teamData.details.id) ||
                (matchDetails.header.teams[0].score < matchDetails.header.teams[1].score && match.away.id == teamData.details.id)) {
                resultColor = Color.green();
            } else {
                resultColor = Color.red();
            }
        }
        const matchResultBar = matchStack.addStack();
        const resultBarImage = getResultBar(resultColor);
        matchResultBar.addImage(resultBarImage);
        matchStack.addSpacer(5);

        // Add match information
        const matchInfoStack = matchStack.addStack();
        matchInfoStack.layoutVertically();
        const matchInfoCompetitionStack = matchInfoStack.addStack();
        matchInfoCompetitionStack.centerAlignContent();
        const competitionValue = shortenLeagueRound(matchDetails.content.matchFacts.infoBox.Tournament.text);
        const competitionNameValue = competitionValue[0];
        addFormattedText(matchInfoCompetitionStack, competitionNameValue, Font.semiboldSystemFont(13), null, 1, false);
        if (userSettings.showMatchesRound && competitionValue[1]) {
            matchInfoCompetitionStack.addSpacer(2);
            const competitionRoundValue = `(${competitionValue[1]})`;
            addFormattedText(matchInfoCompetitionStack, competitionRoundValue, Font.semiboldSystemFont(13), null, 1, false);
        }
        matchInfoStack.addSpacer(1);

        // Add match info
        const matchInfoTeamsStack = matchInfoStack.addStack();
        matchInfoTeamsStack.centerAlignContent();
        if (userSettings.showMatchesOnlyOpposition) {
          if (userSettings.showMatchesTeamsBadges) {
            let teamBadgeUrl = match.home.id == teamData.details.id ? encodeURI(`${baseApiUrl}/images/team/${match.away.id}_xsmall`) : encodeURI(`${baseApiUrl}/images/team/${match.home.id}_xsmall`);
            let teamBadgeOffline = match.home.id == teamData.details.id ? `badge${title}Away.png` : `badge${title}Home.png`;
            let teamBadgeValue = await getImage(teamBadgeUrl, teamBadgeOffline);
            let teamBadgeImage = matchInfoTeamsStack.addImage(teamBadgeValue);
            teamBadgeImage.imageSize = new Size(14, 14);
            matchInfoTeamsStack.addSpacer(2);
          }
          if (userSettings.showMatchesTeamsNames) {
            const oppositionTeamValue = match.home.id == teamData.details.id ? replaceText(match.away.name) : replaceText(match.home.name);
            addFormattedText(matchInfoTeamsStack, oppositionTeamValue, Font.regularSystemFont(12), null, 1, false);
            matchInfoTeamsStack.addSpacer(2);
          }
          if (userSettings.showHomeOrAway) {
            const homeOrAwayValue = match.home.id == teamData.details.id ? `(${dictionary.home})` : `(${dictionary.away})`;
            addFormattedText(matchInfoTeamsStack, homeOrAwayValue, Font.regularSystemFont(12), null, null, false);
          }
        } else {
          if (userSettings.showMatchesTeamsNames) {
            const teamsHomeValue = replaceText(match.home.name);
            addFormattedText(matchInfoTeamsStack, teamsHomeValue, Font.regularSystemFont(12), null, 1, false);
            matchInfoTeamsStack.addSpacer(2);
          }
          if (userSettings.showMatchesTeamsBadges) {
            let teamBadgeUrl = encodeURI(`${baseApiUrl}/images/team/${match.home.id}_xsmall`);
            let teamBadgeOffline = `badge${title}Home.png`;
            let teamBadgeValue = await getImage(teamBadgeUrl, teamBadgeOffline);
            let teamBadgeImage = matchInfoTeamsStack.addImage(teamBadgeValue);
            teamBadgeImage.imageSize = new Size(14, 14);
            matchInfoTeamsStack.addSpacer(2);
          }
          const teamsSeparatorValue = "-";
          addFormattedText(matchInfoTeamsStack, teamsSeparatorValue, Font.regularSystemFont(12), null, null, false);
          if (userSettings.showMatchesTeamsBadges) {
            matchInfoTeamsStack.addSpacer(2);
            let teamBadgeUrl = encodeURI(`${baseApiUrl}/images/team/${match.away.id}_xsmall`);
            let teamBadgeOffline = `badge${title}Away.png`;
            let teamBadgeValue = await getImage(teamBadgeUrl, teamBadgeOffline);
            let teamBadgeImage = matchInfoTeamsStack.addImage(teamBadgeValue);
            teamBadgeImage.imageSize = new Size(14, 14);
          }
          if (userSettings.showMatchesTeamsNames) {
            matchInfoTeamsStack.addSpacer(2);
            const teamsAwayValue = replaceText(match.away.name);
            addFormattedText(matchInfoTeamsStack, teamsAwayValue, Font.regularSystemFont(12), null, 1, false);
          }
        }
        matchInfoStack.addSpacer(1);

        // Add date/time or result
        const matchInfoDetailsStack = matchInfoStack.addStack();
        matchInfoDetailsStack.centerAlignContent();
        if (!matchDetails.header.status.started) {
            if (matchDetails.header.status.cancelled) {
                // If match is cancelled show reason
                const detailsCancellationValue = replaceText(matchDetails.header.status.reason.long);
                addFormattedText(matchInfoDetailsStack, detailsCancellationValue, Font.regularSystemFont(12), Color.gray(), null, false);
            } else {
                // If match is in the future show date and time
                const detailsDateValue = formatDate(new Date(matchDetails.content.matchFacts.infoBox["Match Date"]));
                addFormattedText(matchInfoDetailsStack, detailsDateValue, Font.regularSystemFont(12), Color.gray(), null, false);
                matchInfoDetailsStack.addSpacer(3);
                const detailsTimeValue = formatTime(new Date(matchDetails.content.matchFacts.infoBox["Match Date"]));
                addFormattedText(matchInfoDetailsStack, detailsTimeValue, Font.regularSystemFont(12), Color.gray(), null, false);
            }
        } else {
            // If match is in the past or ongoing show result
            const detailsScoreValue = matchDetails.header.status.scoreStr;
            addFormattedText(matchInfoDetailsStack, detailsScoreValue, Font.regularSystemFont(12), Color.gray(), null, false);
            matchInfoDetailsStack.addSpacer(3);
            if (matchDetails.header.status.started && !matchDetails.header.status.finished) {
                if (userSettings.showMatchesLiveTime) {
                    const detailsPlayingTimeValue = `(${replaceText(matchDetails.header.status.liveTime.short)})`;
                    addFormattedText(matchInfoDetailsStack, detailsPlayingTimeValue, Font.regularSystemFont(12), Color.gray(), null, false);
                    matchInfoDetailsStack.addSpacer(3);
                }
                const detailsLiveValue = "●";
                addFormattedText(matchInfoDetailsStack, detailsLiveValue, Font.semiboldSystemFont(11), Color.dynamic(new Color(userSettings.liveColor.light), new Color(userSettings.liveColor.dark)), null, false);
            }
        }
    } else {
        const matchInfoStack = matchStack.addStack();
        matchInfoStack.layoutVertically();
        const matchInfoDetailsStack = matchInfoStack.addStack();
        matchInfoDetailsStack.centerAlignContent();
        const noMatchesValue = dictionary.noDataAvailable;
        addFormattedText(matchInfoDetailsStack, noMatchesValue, Font.regularSystemFont(12), null, 1, false);
        matchInfoStack.addSpacer(1);
        addFormattedText(matchInfoStack, "", Font.semiboldSystemFont(13), null, null, false);
        matchInfoStack.addSpacer(1);
        addFormattedText(matchInfoStack, "", Font.regularSystemFont(12), null, null, false);
    }
}

async function addWidgetTable(stack) {
    let leagueTable = teamData.tableData.tables[0].table;
    let leagueTitle = teamData.tableData.tables[0].leagueName;
    let leagueSubtitle;
    // If league table is not found assume it is a special case with more than one table available
    if (!leagueTable) {
        let teamFound;
        let tableIndex = 0;
        for (let i = 0; i < teamData.tableData.tables[0].tables.length; i += 1) {
            teamFound = (teamData.tableData.tables[0].tables[i].table).findIndex(obj => obj.id == teamData.details.id);
            if (teamFound != -1) {
                tableIndex = i;
                break;
            }
        }
        leagueTable = teamData.tableData.tables[0].tables[tableIndex].table;
        leagueSubtitle = teamData.tableData.tables[0].tables[tableIndex].leagueName;
        leagueSubtitle = leagueSubtitle.startsWith("- ") ? leagueSubtitle.substring(2) : leagueSubtitle;
    }
    // Get team position in league
    const teamOnLeague = leagueTable[leagueTable.findIndex(obj => obj.id == teamData.details.id)];
    let teamLeaguePosition = -1;
    if (teamOnLeague) {
        teamLeaguePosition = teamOnLeague.idx;
    }

    const leagueStack = stack.addStack();
    leagueStack.layoutVertically();
    leagueStack.url = leagueTableTapUrl;
    leagueStack.addSpacer(2.5);
    const leagueTitleStack = leagueStack.addStack();
    leagueTitleStack.addSpacer(4);
    const leagueTitleValue = leagueTitle.toUpperCase();
    addFormattedText(leagueTitleStack, leagueTitleValue, Font.semiboldSystemFont(11), Color.dynamic(new Color(userSettings.leagueTitleColor.light), new Color(userSettings.leagueTitleColor.dark)), 1, false);
    if (userSettings.showLeagueSubtitle && leagueSubtitle) {
      leagueTitleStack.addSpacer(2);
      const leagueSeparatorValue = "-";
      addFormattedText(leagueTitleStack, leagueSeparatorValue, Font.semiboldSystemFont(11), Color.dynamic(new Color(userSettings.leagueTitleColor.light), new Color(userSettings.leagueTitleColor.dark)), 1, false);
      leagueTitleStack.addSpacer(2);
      const leagueSubtitleValue = leagueSubtitle.toUpperCase();
      addFormattedText(leagueTitleStack, leagueSubtitleValue, Font.semiboldSystemFont(11), Color.dynamic(new Color(userSettings.leagueTitleColor.light), new Color(userSettings.leagueTitleColor.dark)), 1, false);
    }
    leagueStack.addSpacer(1);

    const hSpacing = config.widgetFamily === "small" ? 17 : 19.2;
    const vSpacing = 18.4;
    const leagueTableStack = leagueStack.addStack();
    leagueTableStack.layoutVertically();
    const tableInfo = getTable(leagueTable, teamLeaguePosition);
    const table = tableInfo[0];
    const highlighted = tableInfo[1];
    for (let i = 0; i < table.length; i += 1) {
        let leagueTableRowStack = leagueTableStack.addStack();
        leagueTableRowStack.spacing = 2;
        for (let j = 0; j < table[i].length; j += 1) {
            let cellDataStack = leagueTableRowStack.addStack();
            cellDataStack.size = new Size(hSpacing, vSpacing);
            cellDataStack.centerAlignContent();
            if (j == 0 && i == highlighted) {
                if (userSettings.showRowPositionHighlight) leagueTableRowStack.backgroundColor = Color.dynamic(new Color(userSettings.highlightedRowColor.light), new Color(userSettings.highlightedRowColor.dark));
                if (userSettings.showCirclePositionHighlight) {
                  const highlightedPositionImage = getPositionHighlight((teamLeaguePosition).toString(), Color.dynamic(new Color(userSettings.highlightedPositionColor.light), new Color(userSettings.highlightedPositionColor.dark)));
                  cellDataStack.addImage(highlightedPositionImage);
                } else {
                  let cellDataValue = `${table[i][j]}`;
                  addFormattedText(cellDataStack, cellDataValue, Font.semiboldSystemFont(10), null, null, true);
                }
            } else if (j == 1 && i > 0) {
                let teamBadgeUrl = encodeURI(`${baseApiUrl}/images/team/${table[i][j]}_xsmall`);
                let teamBadgeOffline = `badge_${i}.png`;
                let teamBadgeValue = await getImage(teamBadgeUrl, teamBadgeOffline);
                let teamBadgeImage = cellDataStack.addImage(teamBadgeValue);
                teamBadgeImage.imageSize = new Size(14, 14);
            } else {
                let cellDataValue = `${table[i][j]}`;
                addFormattedText(cellDataStack, cellDataValue, Font.semiboldSystemFont(10), null, null, true);
            }
        }
    }
}

// Build the league table (Position, Team, Matches Played, Wins, Draws, Losses, Points)
function getTable(leagueTable, teamLeaguePosition) {
    const table = [
        // Table header
        [
          "#",
          dictionary.tableHeaderTeam,
          dictionary.tableHeaderPlayed,
          dictionary.tableHeaderWins,
          dictionary.tableHeaderDraws,
          dictionary.tableHeaderLosses,
          dictionary.tableHeaderPoints
        ],
    ];
    const teamsToShow = Math.min(5, leagueTable.length);
    const teamsAbove = Math.ceil((teamsToShow - 1) / 2);
    const teamsBelow = Math.floor((teamsToShow - 1) / 2);
    // By default show 2 teams above selected team and 2 teams below selected team (5 rows in total)
    let initial = teamLeaguePosition - teamsAbove;
    let final = teamLeaguePosition + teamsBelow;
    // By default highlight selected team, in the middle row
    let highlighted = teamsToShow - teamsBelow;
    if (teamLeaguePosition == -1) {
        // If team selected not found show 5 top teams and do not highlight any
        initial = 1;
        final = initial + 4;
        highlighted = -1;
        console.log("League Table Error: Team not found in the selected league, showing top teams.");
    } else if (teamLeaguePosition <= teamsAbove) {
        // If team selected in first place show 5 top teams and highlight first row
        initial = 1;
        final = teamsToShow <= leagueTable.length ? teamsToShow : leagueTable.length;
        highlighted = teamLeaguePosition;
    } else if (teamLeaguePosition > leagueTable.length - teamsBelow) {
        // If team selected in first place show 5 top teams and highlight first row
        initial = leagueTable.length - teamsToShow >= 0 ? leagueTable.length - teamsToShow + 1 : 1;
        final = leagueTable.length;
        highlighted = teamLeaguePosition - initial + 1;
    }

    for (let i = initial; i < final + 1; i += 1) {
        // Add table data, row by row
        table.push(
          [
            i,
            leagueTable[i - 1].id,
            leagueTable[i - 1].played,
            leagueTable[i - 1].wins,
            leagueTable[i - 1].draws,
            leagueTable[i - 1].losses,
            leagueTable[i - 1].pts
          ]
        );
    }
    return [table, highlighted];
}

// Return the team badge
async function getImage(url, cachedFileName) {
    let image;
    try {
        image = await new Request(url).loadImage();
        fm.writeImage(fm.joinPath(offlinePath, cachedFileName), image);
    } catch (err) {
        console.log(`${err} Trying to read cached data: ${cachedFileName}`);
        try {
            if (iCloudUsed) await fm.downloadFileFromiCloud(fm.joinPath(offlinePath, cachedFileName));
            image = fm.readImage(fm.joinPath(offlinePath, cachedFileName));
        } catch (err) {
            console.log(`${err}`);
        }
    }
    return image;
}

async function getData(url, cachedFileName) {
    let data;
    try {
        data = await new Request(url).loadJSON();
        fm.writeString(fm.joinPath(offlinePath, cachedFileName), JSON.stringify(data));
    } catch (err) {
        console.log(`${err} Trying to read cached data: ${cachedFileName}`);
        try {
            if (iCloudUsed) await fm.downloadFileFromiCloud(fm.joinPath(offlinePath, cachedFileName));
            data = JSON.parse(fm.readString(fm.joinPath(offlinePath, cachedFileName)));
        } catch (err) {
            console.log(`${err}`);
        }
    }
    return data;
}

// Draws a circle on the team current position in the league table
function getPositionHighlight(position, color) {
    const drawContext = new DrawContext();
    drawContext.respectScreenScale = true;
    const size = 50;
    drawContext.size = new Size(size, size);
    drawContext.opaque = false;
    drawContext.setFillColor(color);
    drawContext.fillEllipse(new Rect(1, 1, size - 2, size - 2));
    drawContext.setFont(Font.semiboldSystemFont(27));
    drawContext.setTextAlignedCenter();
    drawContext.setTextColor(new Color("#ffffff"));
    drawContext.drawTextInRect(position, new Rect(0, 8.5, size, size));
    const positionHighlightImage = drawContext.getImage();
    return positionHighlightImage;
}

function getResultBar(resultColor) {
    const drawContext = new DrawContext();
    drawContext.size = new Size(10, 115);
    drawContext.respectScreenScale = true;
    drawContext.opaque = false;
    drawContext.setStrokeColor(resultColor);
    drawContext.setLineWidth(10);
    const path = new Path();
    path.move(new Point(5, 5));
    path.addLine(new Point(5, 110));
    drawContext.addPath(path);
    drawContext.strokePath();
    drawContext.setFillColor(resultColor);
    drawContext.fillEllipse(new Rect(0, 0, 10, 10));
    drawContext.fillEllipse(new Rect(0, 105, 10, 10));
    const resultBarImage = drawContext.getImage();
    return resultBarImage;
}

function addFormattedText(stack, string, font, textColor, lineLimit, center) {
    const text = stack.addText(string);
    text.font = font;
    if (lineLimit) text.lineLimit = lineLimit;
    if (textColor) text.textColor = textColor;
    if (center) text.centerAlignText();
}

// Formats the event date into day and month (format 01/Jan)
function formatDate(date) {
    if (isToday(date)) {
        return dictionary.matchDateToday;
    } else if (isTomorrow(date)) {
        return dictionary.matchDateTomorrow;
    } else {
        const dateFormatter = new DateFormatter();
        dateFormatter.dateFormat = userSettings.showMatchesDayOfWeek ? "EEE dd/MMM" : "dd/MMM";
        // Format will depend on device language
        dateFormatter.locale = (language);
        return dateFormatter.string(date);
    }
}

function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    let time;
    if (userSettings.matchesTwelveHourClock) {
        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        time = `${hours}:${minutes}${ampm}`;
    } else {
        time = `${hours}:${minutes}`;
    }
    return time;
}

// Check if date is today
function isToday(date) {
    const today = new Date();
    return (date.getDate() == today.getDate() &&
        date.getMonth() == today.getMonth() &&
        date.getFullYear() == today.getFullYear());
}

// Check if date is tomorrow
function isTomorrow(date) {
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return (date.getDate() == tomorrow.getDate() &&
        date.getMonth() == tomorrow.getMonth() &&
        date.getFullYear() == tomorrow.getFullYear());
}

// Look for backgroundImage in folder and if available use it as background
function setWidgetBackground(widget) {
    const backgroundImage = "background.png";
    const imageUrl = fm.joinPath(offlinePath, backgroundImage);
    widget.backgroundImage = Image.fromFile(imageUrl);
}

// Prepare league and round name to fit in widget
function shortenLeagueRound(leagueRoundName) {
    // Clean extra spaces found on FotMob API responses
    leagueRoundName = leagueRoundName.replace(/ +(?= )/g, '');
    // Split League and Round information
    const leagueName = leagueRoundName.split(" - ")[0];
    let roundName = leagueRoundName.split(" - ")[1];
    if (roundName) {
        // Clean up round name
        if (roundName.includes("Round")) {
            if (roundName.includes("of")) {
                // Replace "Round of X" with "1/X"
                roundName = `1/${roundName.split("Round of ")[1]}`;
            } else {
                // Replace "Round X" with "RX" (language dependent)
                roundName = `${dictionary.matchRound}${roundName.split("Round ")[1]}`;
            }
        }
        return [replaceText(leagueName), replaceText(roundName)];
    } else {
        return [replaceText(leagueName), false];
    }
}

// Shorten and / or translate specific information
function replaceText(string) {
    const text = {
        // Tournaments
        "Champions League Qualification": dictionary.championsLeagueQualification,
        "Europa League Qualification": dictionary.europaLeagueQualification,
        "Cup": dictionary.cup,
        "League Cup": dictionary.leagueCup,
        "Super Cup": dictionary.superCup,
        "Club Friendlies": dictionary.clubFriendlies,
        // Rounds
        "Quarter-Final": dictionary.quarterFinal,
        "Semi-Final": dictionary.semiFinal,
        "Final": dictionary.final,
        // Cancel reasons
        "Postponed": dictionary.postponed,
        "Cancelled": dictionary.cancelled,
        //Live time
        "HT": dictionary.halfTime,
        // Teams
        "Sporting CP": "Sporting",
        "Famalicao": "Famalicão",
        "Pacos de Ferreira": "P. Ferreira",
        "Vitoria de Guimaraes": "V. Guimarães",
        "Belenenses SAD": "Belenenses",
        "FC Porto": "Porto"
    };

    if (text[string]) {
        return text[string];
        // Special cases - includes
    } else if (string.includes("Champions League")) {
        return dictionary.championsLeague;
    } else if (string.includes("Europa League")) {
        return dictionary.europaLeague;
    } else if (string.includes("UEFA Super Cup")) {
        return dictionary.uefaSuperCup;
    } else {
        return string;
    }
}

// Multi language dictionary
function getDictionary(language) {
    const text = {
        en: {
            championsLeague: "Champions League",
            championsLeagueQualification: "Champions League Q.",
            europaLeague: "Europa League",
            europaLeagueQualification: "Europa League Q.",
            uefaSuperCup: "UEFA Super Cup",
            cup: "Cup",
            leagueCup: "League Cup",
            superCup: "Super Cup",
            clubFriendlies: "Friendly",
            quarterFinal: "QF",
            semiFinal: "SF",
            final: "F",
            matchTitleNext: "Next",
            matchRound: "R",
            home: "H",
            away: "A",
            matchDateToday: "Today",
            matchDateTomorrow: "Tomorrow",
            postponed: "Postponed",
            cancelled: "Cancelled",
            halfTime: "HT",
            tableHeaderTeam: "T",
            tableHeaderPlayed: "M",
            tableHeaderWins: "W",
            tableHeaderDraws: "D",
            tableHeaderLosses: "L",
            tableHeaderPoints: "P",
            noDataAvailable: "No data",
            nointernetConnection: "Internet connection required"
        },
        pt: {
            championsLeague: "Liga Campeões",
            championsLeagueQualification: "Q. Liga Campeões",
            europaLeague: "Liga Europa",
            europaLeagueQualification: "Q. Liga Europa",
            uefaSuperCup: "Supertaça Europeia",
            cup: "Taça",
            leagueCup: "Taça Liga",
            superCup: "Supertaça",
            clubFriendlies: "Amigável",
            quarterFinal: "QF",
            semiFinal: "MF",
            final: "F",
            matchTitleNext: "Próximo",
            matchRound: "J",
            home: "C",
            away: "F",
            matchDateToday: "Hoje",
            matchDateTomorrow: "Amanhã",
            postponed: "Adiado",
            cancelled: "Cancelado",
            halfTime: "Int",
            tableHeaderTeam: "E",
            tableHeaderPlayed: "J",
            tableHeaderWins: "V",
            tableHeaderDraws: "E",
            tableHeaderLosses: "D",
            tableHeaderPoints: "P",
            noDataAvailable: "Sem dados",
            nointernetConnection: "Necessária ligação à internet"
        },
        es: {
            championsLeague: "Champions League",
            championsLeagueQualification: "C. Champions League",
            europaLeague: "Europa League",
            europaLeagueQualification: "C. Europa League",
            uefaSuperCup: "Supercopa UEFA",
            cup: "Copa",
            leagueCup: "Copa Liga",
            superCup: "Supercopa",
            clubFriendlies: "Amistoso",
            quarterFinal: "CF",
            semiFinal: "SF",
            final: "F",
            matchTitleNext: "Siguiente",
            matchRound: "J",
            home: "L",
            away: "V",
            matchDateToday: "Hoy",
            matchDateTomorrow: "Mañana",
            postponed: "Aplazado",
            cancelled: "Cancelado",
            halfTime: "ET",
            tableHeaderTeam: "E",
            tableHeaderPlayed: "J",
            tableHeaderWins: "G",
            tableHeaderDraws: "E",
            tableHeaderLosses: "P",
            tableHeaderPoints: "PT",
            noDataAvailable: "Sin datos",
            nointernetConnection: "Requiere conexión a internet"
        },
        fr: {
            championsLeague: "Ligue Champions",
            championsLeagueQualification: "Q. Ligue Champions",
            europaLeague: "Ligue Europa",
            europaLeagueQualification: "Q. Ligue Europa",
            uefaSuperCup: "Supercoupe d'Europe",
            cup: "Coupe",
            leagueCup: "League Cup",
            superCup: "Supercoupe",
            clubFriendlies: "Amical",
            quarterFinal: "QF",
            semiFinal: "DF",
            final: "F",
            matchTitleNext: "Suivant",
            matchRound: "J",
            home: "D",
            away: "E",
            matchDateToday: "Aujourd'hui",
            matchDateTomorrow: "Demain",
            postponed: "Reporté",
            cancelled: "Annulé",
            halfTime: "MT",
            tableHeaderTeam: "C",
            tableHeaderPlayed: "M",
            tableHeaderWins: "G",
            tableHeaderDraws: "N",
            tableHeaderLosses: "P",
            tableHeaderPoints: "PT",
            noDataAvailable: "Pas de données",
            nointernetConnection: "Connexion Internet requise"
        },
        de: {
            championsLeague: "Champions League",
            championsLeagueQualification: "Champions League Q.",
            europaLeague: "Europa League",
            europaLeagueQualification: "Europa League Q.",
            uefaSuperCup: "UEFA Supercup",
            cup: "DFB-Pokal",
            leagueCup: "Ligapokal",
            superCup: "Supercup",
            clubFriendlies: "Testspiel",
            quarterFinal: "VF",
            semiFinal: "HF",
            final: "F",
            matchTitleNext: "Nächstes",
            matchRound: "S",
            home: "H",
            away: "A",
            matchDateToday: "Heute",
            matchDateTomorrow: "Morgen",
            postponed: "Verlegt",
            cancelled: "Abgesagt",
            halfTime: "HZ",
            tableHeaderTeam: "M",
            tableHeaderPlayed: "S",
            tableHeaderWins: "G",
            tableHeaderDraws: "U",
            tableHeaderLosses: "V",
            tableHeaderPoints: "P",
            noDataAvailable: "Keine Daten",
            nointernetConnection: "Internetverbindung erforderlich"
        },
        cs: {
            championsLeague: "Liga mistrů",
            championsLeagueQualification: "Liga mistrů K.",
            europaLeague: "Evropská liga",
            europaLeagueQualification: "Evropská liga K.",
            uefaSuperCup: "Superpohár UEFA",
            cup: "Pohár",
            leagueCup: "Ligový pohár",
            superCup: "Super pohár",
            clubFriendlies: "Prátelák",
            quarterFinal: "ČF",
            semiFinal: "SF",
            final: "F",
            matchTitleNext: "Další",
            matchRound: "K",
            home: "D",
            away: "V",
            matchDateToday: "Dnes",
            matchDateTomorrow: "Zítra",
            postponed: "Přeloženo",
            cancelled: "Zrušeno",
            halfTime: "Pol",
            tableHeaderTeam: "T",
            tableHeaderPlayed: "Z",
            tableHeaderWins: "V",
            tableHeaderDraws: "R",
            tableHeaderLosses: "P",
            tableHeaderPoints: "B",
            noDataAvailable: "Žádná data",
            nointernetConnection: "Vyžadováno internetové připojení"
        }
    };
    return [Object.keys(text), text[language]];
}
