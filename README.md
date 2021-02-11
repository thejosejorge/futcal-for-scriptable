![img_banner](https://user-images.githubusercontent.com/76433052/104852433-ed35fb80-58f2-11eb-8a49-256395f18bae.png)

# Futcal for Scriptable
Futcal is a football widget for [Scriptable](https://scriptable.app) that relies on the [FotMob](https://www.fotmob.com) API data.

With Futcal you can choose your favourite team and quickly see:
* Last match
    * Competition and round
    * Home and Away teams
    * Result
* Next match
    * Competition and round
    * Home and Away teams
    * Time and date (or current result and playing time if match is ongoing)
* League table
    * Position, Team, Matches played, Wins, Draws, Losses and Points

## Features
### 📱 First-Party Design
<img src="https://user-images.githubusercontent.com/76433052/103371938-9b0a7300-4ac8-11eb-90f8-aadbeaf018ca.gif" width=300>

Futcal was built with simplicity and consistency in mind, with a design based on the Apple Calendar widget.
The goal is to fit in with other Apple widgets while providing at a glance all the information you are looking for.

Note: The widget was developed and tested on an iPhone XS. Minor changes on the position of the different elements may occur for devices with different screen sizes.

### 🌙 Dark Mode
<img src="https://user-images.githubusercontent.com/76433052/103371941-9cd43680-4ac8-11eb-965f-c8df20db043b.gif" width=300>

Futcal supports different color configurations for light and dark mode.
The default colors are fully aligned with the Apple Calendar widget, for consistency.

### ↔️ Different Sizes
<img src="https://user-images.githubusercontent.com/76433052/104840015-b7762000-58bc-11eb-99fc-581ad59bae20.gif" width=300>

Futcal is available in different widget sizes.
#### Small
* Matches view
* Table view
#### Medium
* Matches and Table view

### 💬 Multi Languages
<img src="https://user-images.githubusercontent.com/76433052/103371943-9e056380-4ac8-11eb-8a70-3ecb2c91cca7.gif" width=300>

Futcal is prepared to support multiple languages, based on your device system settings. This applies to all default UI elements but also specific API information (e.g. competition or round name).
Currently the following languages are available:
* 🇬🇧 English
* 🇵🇹 Portuguese
* 🇪🇸 Spanish
* 🇫🇷 French (thanks to [@Write](https://github.com/Write) for the help translating)
* 🇩🇪 German (thanks to [@lcshmn](https://github.com/lcshmn) and [@ostoer](https://github.com/ostoer) for the help translating)
* 🇨🇿 Czech

If you would like other languages to be added feel free to share the translation strings and I will gladly add them.

Note: If your device language is not supported, the widget will default to English.

### 👆 Tap To Open
Clicking any of the widget different sections will open additional details on Safari or on the FotMob iOS/iPadOS application, if installed.

Note: This overrides any behavior defined in the configuration of the widget

### ✈️ Offline Mode
Futcal will still properly run even if there is no internet connectivity. In this case the latest cached information (previously stored in your iCloud Drive) will be displayed.

Note: Data will only be refreshed when internet connection is restored.

## Instructions
### Prerequisites
Before you begin, ensure you have met the following requirements:
* Instal the latest version of Scriptable

To improve the experience when using Tap To Open:
* Install the FotMob iOS/iPadOS application.

### Add widget
To add the widget to the Home Screen please follow these steps:
1. Download and extract the content of this repository.

2. Copy `Futcal.js` into the Scriptable folder located in your iCloud Drive.

Your Scriptable folder structure should look like this:
```
iCloud Drive/
├─ Scriptable/
│  ├─ Futcal.js
```

3. Launch Scriptable and make sure that Futcal is listed in the Scripts view.

4. Run the script and if everything is set up correctly you should see a preview of the Medium-sized widget for the default team ([Sporting CP](https://www.sporting.pt/en)).

5. Return to your home screen and add a Medium Scriptable widget.

6. Edit the Scriptable widget and choose Futcal as the Script. Next, set "When Interacting" to "Run Script" and you should be all set and ready to go.

### Customise widget
#### ⚽ Team
In order to get your favourite team information you have to specify your team's FotMob numerical id:
1. Go to https://www.fotmob.com.
2. Search for your team in the search box and select it.
3. In your team overview page check the URL.

The URL should look like this:
`https://www.fotmob.com/teams/9768/overview/sporting-cp`

4. Copy the numeric value from the URL (e.g. 9768 for Sporting CP).
5. Look for parameter `teamId` in `Futcal.js`.
6. Replace the numeric value with the new one.

#### 🌍 Time Zone
In order to get the correct time and date information you should define your time zone:
1. Get your time zone name (you can see a full list on https://timezonedb.com/time-zones).
2. Look for parameter `timeZone` in `Futcal.js`.
3. Replace the string value with the new one.

#### 🎭 Small Widget View
By default small widgets will display the Table view.

In order to display the Matches view:
1. Long press the small widget on your Home Screen.
2. Choose "Edit Widget".
3. On "Parameter" write `matches`.

#### ♟️ Match Round
The ability to show the match competition round can be turned on or off. By default this is turned off to minimise the amount of information shown.

In order to turn this feature on:
1. Look for parameter `showRound` in `Futcal.js`.
2. Change the value to `true`.

Please see the examples below to see the difference:
| `showRound = false`          | `showRound = true`           |
| ---------------------------- | ---------------------------- |
| `Premier League`             | `Premier League (R1)`        |
| `Cup`                        | `Cup (Q/F)`                  |

#### 🆚 Teams Names / Logos
By default in the matches details only the teams names are shown. It's also possible to show the teams logos. Both options can be turned on or off.

Teams Names option:
1. Look for parameter `showMatchesTeamsNames` in `Futcal.js`.
2. Change the value to `true` / `false` to turn it on / off.

Teams Logos option:
1. Look for parameter `showMatchesTeamsBadges` in `Futcal.js`.
2. Change the value to `true` / `false` to turn it on / off.

#### ♟️ Opposition
By default in the matches details both teams are shown. There is the option to shown only the opposition team and whether it is a home or away match.

In order to turn this option on:
1. Look for parameter `showOnlyOpposition` in `Futcal.js`.
2. Change the value to `true`.

Please see the examples below to see the difference:
| `showOnlyOpposition = false` | `showOnlyOpposition = true`  |
| ---------------------------- | ---------------------------- |
| `Boavista - Sporting`        | `Boavista (A)`               |
| `Sporting - Benfica`         | `Benfica (H)`                |

#### 🕒 12 / 24 Hour Clock
By default the next match time is shown using the 24 hour clock.

In order to display the time in 12 hour clock format:
1. Look for parameter `twelveHourClock` in `Futcal.js`.
2. Change the value to `true`.

Please see the examples below to see the difference:
| `twelveHourClock = false`    | `twelveHourClock = true`     |
| ---------------------------- | ---------------------------- |
| `19/Jan 19:45`               | `19/Jan 7:45pm`              |
| `03/Feb 16:00`               | `03/Feb 4:00pm`              |

#### 📅 Day of the Week
By default the day of the week is not shown on the next match date.

In order to turn this feature on:
1. Look for parameter `showDayOfWeek` in `Futcal.js`.
2. Change the value to `true`.

Please see the examples below to see the difference:
| `showDayOfWeek = false`      | `showDayOfWeek = true`       |
| ---------------------------- | ---------------------------- |
| `19/Jan 19:45`               | `Tue 19/Jan 19:45`           |
| `03/Feb 16:00`               | `Wed 03/Feb 16:00`           |

#### ⏱️ Playing Time
By default the current playing time is not shown on live matches.

In order to turn this feature on:
1. Look for parameter `showLivetime` in `Futcal.js`.
2. Change the value to `true`.

Please see the examples below to see the difference:
| `showLivetime = false`       | `showLivetime = true`        |
| ---------------------------- | ---------------------------- |
| `1 - 0 ●`                    | `1 - 0 (15') ●`              |
| `2 - 2 ●`                    | `2 - 2 (HT) ●`               |

#### 🏆 League Subtitle
For leagues with more than one table (e.g. "MLS" with "Eastern" and "Western") it is possible to show the subtitle next to the league title. By default this is turned off to minimise the amount of information shown.

In order to turn this feature on:
1. Look for parameter `showLeagueSubtitle` in `Futcal.js`.
2. Change the value to `true`.

Please see the examples below to see the difference:
| `showLeagueSubtitle = false` | `showLeagueSubtitle = true`  |
| ---------------------------- | ---------------------------- |
| `MLS`                        | `MLS (EASTERN)`              |
| `EURO U21`                   | `EURO U21 (GRP. D)`          |

#### 🥇 Position Highlight
By default the current team position in the league table is highlighted with a circle around the position cell. It's also possible to highlight the entire row on the table. Both options can be turned on or off.

Circle highlight option:
1. Look for parameter `showCirclePositionHighlight` in `Futcal.js`.
2. Change the value to `true` / `false` to turn it on / off.

Row highlight option:
1. Look for parameter `showRowPositionHighlight` in `Futcal.js`.
2. Change the value to `true` / `false` to turn it on / off.

#### 🖼️ Background
By default the widget has a solid color background (same as the Apple Calendar widget).
However, if you want you can select an image as the widget background:
1. Run Futcal in the Scriptable app (this is to make sure all the required directories are created).
2. Name your image `background.png`.
3. Copy `background.png` into the Futcal folder now available in the Scriptable folder located in your iCloud Drive.

Your Scriptable folder structure should look like this:
```
iCloud Drive/
├─ Scriptable/
│  ├─ Futcal.js
│  ├─ Futcal/
│  |  ├─ background.png
```

#### 🎨 Colors
To customise the widget colors look for the following parameters in the script:
| Parameter                  | Notes                                             |
| -------------------------- | ------------------------------------------------- |
| `backgroundColor`          | Dynamic, changes with dark mode (light, dark)     |
| `leagueTitleColor`         | Color of the league table title                   |
| `highlightedPositionColor` | Color of the circle highlighting team's position  |
| `highlightedRowColor`      | Color of the row highlighting team's position     |
| `liveColor`                | Color of the circle shown when a match is ongoing |

#### 📖 Data Manipulation
To customise specific strings returned by the API change the `text` variable inside the function `replaceText`.\
To add or customise language translations change the `text` variable inside the function `getDictionary`.

## Known Issues
* **Tap To Open**: There is currently an iOS/iPadOS limitation where any URLs opened through a widget will require its host app (in this case Scriptable) to launch first, before the URL can be opened.
* **Refresh rate**: The refresh rate of a widget is partly up to iOS/iPadOS. For example, a widget may not refresh if the device is low on battery or the user is rarely looking at the widget.

---

<p align="center">
<a href="https://www.instagram.com/thejosejorge" align="center" target="_blank"><img src="https://user-images.githubusercontent.com/76433052/103406427-98546000-4b52-11eb-935c-3935a8fc6f4d.png" height=40px/></a>&nbsp;&nbsp;
<a href="mailto:thejosejorge@gmail.com" target="_blank"><img src="https://user-images.githubusercontent.com/76433052/103406428-98ecf680-4b52-11eb-9274-d46403a7073d.png" height=40px/></a>
</p>

<p align="center">
If you like this project and want to show your appreciation, consider buying me a coffee by clicking on the button below!
</p>

<p align="center">
  <a href="https://www.buymeacoffee.com/thejosejorge" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-black.png" alt="Buy Me A Coffee" height=60px></a>
</p>
