/**
 * Created by preb on 24.06.16.
 */
(function() {
    var uefaCoefficient;

    /* Check if every character of string is in the set */
    Set.prototype.contains = function (groups) {
        groups = groups.split('');
        return groups.every(group => this.has(group));
    };

    function isValidResult(result) {
        return Number.isInteger(Number(result)) && !isNaN(parseInt(result, 10));
    }

    class Team {
        constructor(name, shortcut) {
            this.name = name;
            this.shortcut = shortcut;
            this.groupStage = {
                group: "",
                wins: 0,
                draws: 0,
                losses: 0,
                points: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalsDiff: 0
            },
                this.smallGroup = {
                    points: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    goalsDiff: 0
                }
        }

        setGroupName(name) {
            this.groupStage.group = name;
        }

        // Used to calculate points and goals in group
        resetStats() {
            this.groupStage.points = this.groupStage.goalsFor = this.groupStage.goalsAgainst =
                this.groupStage.wins = this.groupStage.draws = this.groupStage.losses =
                    this.groupStage.goalsDiff = 0;
        }

        // Used to calculate points and goals in group
        addResult(thisResult, opponentResult) {
            this.groupStage.goalsFor += thisResult;
            this.groupStage.goalsAgainst += opponentResult;
            this.groupStage.goalsDiff += (thisResult - opponentResult);

            if (thisResult > opponentResult) {
                this.groupStage.points += 3;
                this.groupStage.wins++;
            } else if (thisResult === opponentResult) {
                this.groupStage.points += 1;
                this.groupStage.draws++;
            } else {
                this.groupStage.losses++;
            }
        }

        // Used to calculate points and goals in group of interest (if more than 2 teams are equal on points)
        addSmallGroupResult(thisResult, opponentResult) {
            this.smallGroup.goalsFor += thisResult;
            this.smallGroup.goalsAgainst += opponentResult;
            this.smallGroup.goalsDiff += (thisResult - opponentResult);

            if (thisResult > opponentResult) {
                this.smallGroup.points += 3;
                this.smallGroup.wins++;
            } else if (thisResult === opponentResult) {
                this.smallGroup.points += 1;
                this.smallGroup.draws++;
            } else {
                this.smallGroup.losses++;
            }
        }

        // Used to calculate points and goals in group of interest (if more than 2 teams are equal on points)
        resetSmallGroupStats() {
            this.smallGroup.points = this.smallGroup.goalsFor = this.smallGroup.goalsAgainst =
                this.smallGroup.goalsDiff = 0;
        }
    }

    class Match {
        constructor(teamA = null, teamB = null) {
            this.teams = [
                {
                    teamObject: teamA,
                    goals: Number.NaN
                },
                {
                    teamObject: teamB,
                    goals: Number.NaN
                }
            ];
            this.complete = false;
        }

        getWinner() {
            if (this.teams[0].goals > this.teams[1].goals) {
                return this.teams[0].teamObject;
            } else if (this.teams[0].goals < this.teams[1].goals) {
                return this.teams[1].teamObject;
            } else {
                return null;
            }
        }
    }

// Support class for sorting the groups
    class BaseGroup {
        sortByPoints(teamA, teamB) {
            if (teamA.groupStage.points > teamB.groupStage.points) {
                return -1;
            } else if (teamA.groupStage.points < teamB.groupStage.points) {
                return 1;
            } else {
                return 0;
            }
        }

        sortByGoalsDiff(teamA, teamB) {
            if (teamA.groupStage.goalsDiff > teamB.groupStage.goalsDiff) {
                return -1;
            } else if (teamA.groupStage.goalsDiff < teamB.groupStage.goalsDiff) {
                return 1
            } else {
                return 0;
            }
        }

        sortByGoalsFor(teamA, teamB) {
            if (teamA.groupStage.goalsFor > teamB.groupStage.goalsFor) {
                return -1;
            } else if (teamA.groupStage.goalsFor < teamB.groupStage.goalsFor) {
                return 1;
            } else {
                return 0;
            }
        }

        sortByUEFACoefficient(teamA, teamB) {
            if (uefaCoefficient[teamA.name] > uefaCoefficient[teamB.name]) {
                return -1;
            } else if (uefaCoefficient[teamA.name] < uefaCoefficient[teamB.name]) {
                return 1;
            } else {
                return 0;
            }
        }

        getOrder() {
            return this.groupOrder;
        }
    }

// Group of interest (if more than 2 teams are equal on points)
    class DirectGroup extends BaseGroup {
        constructor(teams, matches) {
            super();
            this.groupOrder = teams;
            this.matches = matches;
            // Filter matches in which both teams fight for place in group
            this.matches = this.matches.filter(function (match) {
                if (teams.indexOf(match.teams[0].teamObject) === -1 ||
                    teams.indexOf(match.teams[1].teamObject) === -1) {
                    return false;
                }

                return true;
            });
        }

        sort() {
            // Calculate points and goals difference between teams in direct group
            this.groupOrder.forEach(function (team) {
                team.resetSmallGroupStats();
            });
            this.matches.forEach(function (match) {
                match.teams[0].teamObject.addSmallGroupResult(match.teams[0].goals, match.teams[1].goals);
                match.teams[1].teamObject.addSmallGroupResult(match.teams[1].goals, match.teams[0].goals);
            });

            var group = this;
            this.groupOrder.sort(function (teamA, teamB) {
                // Greater number of points obtained in the matches between the teams in question.
                if (teamA.smallGroup.points > teamB.smallGroup.points) {
                    return -1;
                } else if (teamA.smallGroup.points > teamB.smallGroup.points) {
                    return -1;
                }

                // Goal difference resulting from the matches between the teams in question
                if (teamA.smallGroup.goalsDiff > teamB.smallGroup.goalsDiff) {
                    return -1;
                } else if (teamA.smallGroup.goalsDiff > teamB.smallGroup.goalsDiff) {
                    return -1;
                }

                // Greater number of goals scored in the matches between the teams in question
                if (teamA.smallGroup.goalsFor > teamB.smallGroup.goalsFor) {
                    return -1;
                } else if (teamA.smallGroup.goalsFor > teamB.smallGroup.goalsFor) {
                    return -1;
                }

                var order = group.sortByGoalsDiff(teamA, teamB);
                if (order) {
                    return order;
                }

                order = group.sortByGoalsFor(teamA, teamB);
                if (order) {
                    return order;
                }

                return group.sortByUEFACoefficient(teamA, teamB);
            });
        }
    }

// Group to determine which teams from third places are going to fight in play-off
    class ThirdPlaceGroup extends BaseGroup {
        constructor(teams) {
            super();
            this.groupOrder = teams;
        }

        sort() {
            var group = this;
            this.groupOrder.sort(function (teamA, teamB) {
                let order;
                // Greater number of points obtained.
                order = group.sortByPoints(teamA, teamB);
                if (order) {
                    return order;
                }

                // Goal difference in all the group matches
                order = group.sortByGoalsDiff(teamA, teamB);
                if (order) {
                    return order;
                }

                // Greater number of goals scored in all the group matches.
                order = group.sortByGoalsFor(teamA, teamB);
                if (order) {
                    return order;
                }

                // Fair Play conduct of the teams (final tournament). (impossible)

                // Higher position in the UEFA national team coefficient ranking.
                return group.sortByUEFACoefficient(teamA, teamB);
            });
        }
    }

    class Group extends BaseGroup {
        constructor(name, teamA, teamB, teamC, teamD) {
            super();
            this.name = name;
            this.teams = [teamA, teamB, teamC, teamD];
            this.teams.forEach(team => team.setGroupName(name));
            this.groupOrder = [teamA, teamB, teamC, teamD];
            this.complete = false;
            this.matches = [
                new Match(teamC, teamD),
                new Match(teamA, teamB),
                new Match(teamB, teamD),
                new Match(teamA, teamC),
                new Match(teamB, teamC),
                new Match(teamD, teamA)
            ];
        }


        getMatch(id) {
            return this.matches[id - 1];
        }

        sort() {
            // First step: sort by points
            this.groupOrder.sort(this.sortByPoints);

            // Second step: check if teams are equal on points
            var equal = [[this.groupOrder[0]]];
            let points = this.groupOrder[0].groupStage.points;
            let j = 0;
            for (let i = 1; i < 4; i++) {
                if (this.groupOrder[i].groupStage.points === points) {
                    equal[j].push(this.groupOrder[i]);
                } else {
                    j++;
                    equal.push([this.groupOrder[i]]);
                    points = this.groupOrder[i].groupStage.points;
                }
            }
            // Third step: sort teams by other criteria
            let size = equal.length;
            let position = 0;
            if (size != 4) {
                for (let i = 0; i < size; i++) {
                    // Case A: two team are equal on points
                    let amountOfTeams = equal[i].length, order;
                    if (amountOfTeams === 2) {
                        let teams = this.groupOrder.splice(position, 2);
                        var group = this;
                        teams.sort(function (teamA, teamB) {
                            // Greater number of points obtained in the matches between the teams in question.
                            for (let match of group.matches) {
                                if (match.complete) {
                                    if ((match.teams[0].teamObject === teamA && match.teams[1].teamObject === teamB) ||
                                        (match.teams[1].teamObject === teamA && match.teams[0].teamObject === teamB)) {
                                        let winner = match.getWinner();
                                        if (winner === teamA) {
                                            return -1;
                                        } else if (winner === teamB) {
                                            return 1;
                                        }
                                    }
                                }
                            }

                            // Goal difference in all the group matches
                            order = group.sortByGoalsDiff(teamA, teamB);
                            if (order) {
                                return order;
                            }

                            // Greater number of goals scored in all the group matches.
                            order = group.sortByGoalsFor(teamA, teamB);
                            if (order) {
                                return order;
                            }

                            // Fair Play conduct of the teams (final tournament). (impossible)

                            // Higher position in the UEFA national team coefficient ranking.
                            return group.sortByUEFACoefficient(teamA, teamB);
                        });
                        this.groupOrder.splice(position, 0, ...teams);
                    }
                    // Case B: more than two team are equal on points
                    else if (amountOfTeams > 2) {
                        let teams = this.groupOrder.splice(position, amountOfTeams);
                        // Create small group
                        var directGroup = new DirectGroup(teams, this.matches);
                        directGroup.sort();
                        this.groupOrder.splice(position, 0, ...directGroup.getOrder());
                    }
                    position += amountOfTeams;
                }
            }
        }

        display() {
            var html = '';
            for (let team of this.groupOrder) {
                html += `<tr>
                        <td><img src="images/flags/${team.shortcut}.png"> ${team.name}</td>
                        <td>${team.groupStage.wins}</td>
                        <td>${team.groupStage.draws}</td>
                        <td>${team.groupStage.losses}</td>
                        <td>${team.groupStage.goalsDiff}</td>
                        <td>${team.groupStage.points}</td>
                     </tr>`
            }

            var table = $(`[data-group="${this.name}"]`).closest('section').find('tbody');
            if (this.complete) {
                table.addClass('complete');
            } else {
                table.removeClass('complete');
            }
            table.html(html);
        }

        // Update stats of two teams, triggered by event 'match-complete'
        update(teamA, teamB) {
            teamA.resetStats();
            teamB.resetStats();
            this.matches.forEach(function (match) {
                if (match.complete) {
                    if (match.teams[0].teamObject === teamA) {
                        teamA.addResult(match.teams[0].goals, match.teams[1].goals);
                    } else if (match.teams[0].teamObject === teamB) {
                        teamB.addResult(match.teams[0].goals, match.teams[1].goals);
                    }

                    if (match.teams[1].teamObject === teamA) {
                        teamA.addResult(match.teams[1].goals, match.teams[0].goals);
                    } else if (match.teams[1].teamObject === teamB) {
                        teamB.addResult(match.teams[1].goals, match.teams[0].goals);
                    }
                }
            });

            this.sort();
            // Check if all matches have been played in group
            this.complete = this.matches.every(match => match.complete);
            if (this.complete) {
                $('#group-stage').trigger('group-complete');
            }
            this.display();
        }
    }

    class GroupStage {
        constructor(teams) {
            this.teams = teams;
            this.groups = [];
            for (let i = 0; i < 24; i += 4) {
                this.groups.push(new Group(String.fromCharCode('A'.charCodeAt(0) + i / 4),
                    teams[i], teams[i + 1], teams[i + 2], teams[i + 3]));
            }
        }

        getGroup(id) {
            return this.groups[id.charCodeAt(0) - 'A'.charCodeAt(0)];
        }

        teamsToAdvance() {
            var groups = this.groups;
            // Init group of teams finished at 3rd place in group
            var thirdPlaceGroup = new ThirdPlaceGroup([groups[0].groupOrder[2], groups[1].groupOrder[2],
                groups[2].groupOrder[2], groups[3].groupOrder[2], groups[4].groupOrder[2], groups[5].groupOrder[2]]);
            thirdPlaceGroup.sort();

            // Determine from which groups team from 3rd place has advanced to the next stage
            var bestGroups = new Set();
            bestGroups.add(thirdPlaceGroup.groupOrder[0].groupStage.group).add(thirdPlaceGroup.groupOrder[1].groupStage.group)
                .add(thirdPlaceGroup.groupOrder[2].groupStage.group).add(thirdPlaceGroup.groupOrder[3].groupStage.group);
            var fromThirdPlace = [];

            // https://pl.wikipedia.org/wiki/Mistrzostwa_Europy_w_Pi%C5%82ce_No%C5%BCnej_2016#Rozgrywki
            if (bestGroups.contains("ABCD")) {
                fromThirdPlace = [groups[2].groupOrder[2], groups[3].groupOrder[2], groups[0].groupOrder[2],
                    groups[1].groupOrder[2]];
            } else if (bestGroups.contains("ABCE")) {
                fromThirdPlace = [groups[2].groupOrder[2], groups[0].groupOrder[2], groups[1].groupOrder[2],
                    groups[4].groupOrder[2]];
            } else if (bestGroups.contains("ABCF")) {
                fromThirdPlace = [groups[2].groupOrder[2], groups[0].groupOrder[2], groups[1].groupOrder[2],
                    groups[5].groupOrder[2]];
            } else if (bestGroups.contains("ABDE")) {
                fromThirdPlace = [groups[3].groupOrder[2], groups[0].groupOrder[2], groups[1].groupOrder[2],
                    groups[4].groupOrder[2]];
            } else if (bestGroups.contains("ABDF")) {
                fromThirdPlace = [groups[3].groupOrder[2], groups[0].groupOrder[2], groups[1].groupOrder[2],
                    groups[5].groupOrder[2]];
            } else if (bestGroups.contains("ABEF")) {
                fromThirdPlace = [groups[4].groupOrder[2], groups[0].groupOrder[2], groups[1].groupOrder[2],
                    groups[5].groupOrder[2]];
            } else if (bestGroups.contains("ACDE")) {
                fromThirdPlace = [groups[2].groupOrder[2], groups[3].groupOrder[2], groups[0].groupOrder[2],
                    groups[4].groupOrder[2]];
            } else if (bestGroups.contains("ACDF")) {
                fromThirdPlace = [groups[2].groupOrder[2], groups[3].groupOrder[2], groups[0].groupOrder[2],
                    groups[5].groupOrder[2]];
            } else if (bestGroups.contains("ACEF")) {
                fromThirdPlace = [groups[2].groupOrder[2], groups[0].groupOrder[2], groups[5].groupOrder[2],
                    groups[4].groupOrder[2]];
            } else if (bestGroups.contains("ADEF")) {
                fromThirdPlace = [groups[3].groupOrder[2], groups[0].groupOrder[2], groups[5].groupOrder[2],
                    groups[4].groupOrder[2]];
            } else if (bestGroups.contains("BCDE")) {
                fromThirdPlace = [groups[2].groupOrder[2], groups[4].groupOrder[2], groups[1].groupOrder[2],
                    groups[4].groupOrder[2]];
            } else if (bestGroups.contains("BCDF")) {
                fromThirdPlace = [groups[2].groupOrder[2], groups[3].groupOrder[2], groups[1].groupOrder[2],
                    groups[5].groupOrder[2]];
            } else if (bestGroups.contains("BCEF")) {
                fromThirdPlace = [groups[4].groupOrder[2], groups[2].groupOrder[2], groups[1].groupOrder[2],
                    groups[5].groupOrder[2]];
            } else if (bestGroups.contains("BDEF")) {
                fromThirdPlace = [groups[4].groupOrder[2], groups[3].groupOrder[2], groups[1].groupOrder[2],
                    groups[5].groupOrder[2]];
            } else {
                fromThirdPlace = [groups[2].groupOrder[2], groups[3].groupOrder[2], groups[5].groupOrder[2],
                    groups[4].groupOrder[2]];
            }
            return [groups[0].groupOrder[1], groups[2].groupOrder[1], groups[3].groupOrder[0], fromThirdPlace[3],
                groups[1].groupOrder[0], fromThirdPlace[1], groups[5].groupOrder[0], groups[4].groupOrder[1],
                groups[2].groupOrder[0], fromThirdPlace[2], groups[4].groupOrder[0], groups[3].groupOrder[1],
                groups[0].groupOrder[0], fromThirdPlace[0], groups[1].groupOrder[1], groups[5].groupOrder[1]];
        }
    }

    class Playoff {
        constructor() {
            this.stages = [[], [], [], []];
            for (let i = 0; i < 4; i++) {
                let condition = 16 / Math.pow(2, i + 1);
                for (let j = 0; j < condition; j++) {
                    this.stages[i].push(new Match());
                }
            }
        }

        setTeams(teams) {
            // Init first stage of play off
            for (let i = 0; i < 16; i++) {
                this.stages[0][Math.floor(i / 2)].teams[i % 2].teamObject = teams[i];
            }

            var matches = $('#ro16').find('li').slice(1);
            matches.each(function (matchIndex) {
                $(this).find('.play-off-team').each(function (teamIndex) {
                    if (teams[matchIndex * 2 + teamIndex])   // to delete
                        $(this).find('span').text(teams[matchIndex * 2 + teamIndex].name);
                });
            });
        }

        getMatch(stage, id) {
            stage = stage.slice(2);
            var stageID = 4 - Math.log2(parseInt(stage));

            return this.stages[stageID][id - 1];
        }

        getNextMatch(stage, id) {
            stage = stage.slice(2);
            var stageID = 4 - Math.log2(parseInt(stage)) + 1;

            return this.stages[stageID][Math.floor((id - 1) / 2)];
        }

        displayNextMatch(stage, id) {
            var nextMatch = this.getNextMatch(stage, id);
            stage = stage.slice(2);
            stage = '#ro' + (parseInt(stage, 10) / 2).toString();
            var teamsNames = $(`${stage}`).find(`[data-id='${Math.floor((id - 1) / 2) + 1}']`).find('span');

            if (nextMatch.teams[0].teamObject) {
                teamsNames.eq(0).text(nextMatch.teams[0].teamObject.name);
            }

            if (nextMatch.teams[1].teamObject) {
                teamsNames.eq(1).text(nextMatch.teams[1].teamObject.name);
            }
        }
    }

    class Tournament {
        constructor() {
            this.teams = this.initTeams();
            this.groupStage = new GroupStage(this.teams);
            this.playoff = new Playoff();

            var groupStage = this.groupStage, playoff = this.playoff;
            $('#group-stage').on("change", "input", function () {
                var group = groupStage.getGroup($(this).closest('.group-matches').data('group'));
                var match = group.getMatch($(this).closest('.group-match').data('id'));
                var val = $(this).val();

                if (isValidResult(val)) {
                    match.teams[$(this).index()].goals = parseInt(val, 10);

                    if (!Number.isNaN(match.teams[0].goals) && !Number.isNaN(match.teams[1].goals)) {
                        $(this).closest('.result').removeClass('has-error').addClass('has-success');
                        match.complete = true;
                        $('#group-stage').trigger('match-complete', [group, match.teams[0].teamObject, match.teams[1].teamObject]);
                    }

                } else {
                    $(this).closest('.result').removeClass('has-success');
                    if ($(this).val() != '') {
                        $(this).closest('.result').addClass('has-error');
                    }
                    match.complete = false;
                    group.complete = false;
                }

            });

            $('#group-stage').on('match-complete', function (event, group, teamA, teamB) {
                group.update(teamA, teamB);
            });

            $('#group-stage').on('group-complete', function () {
                if (groupStage.groups.every(group => group.complete)) {
                    $(document).trigger('group-stage-complete', groupStage.teamsToAdvance());
                }
            });

            $(document).on('group-stage-complete', function (event, ...teams) {
                playoff.setTeams(teams);
            });

            $('#tournament-bracket').on('change', 'input', function () {
                var stage = $(this).closest('.play-off-stage').attr('id'),
                    matchID = $(this).closest('.play-off-match').data('id'),
                    match = playoff.getMatch(stage, matchID);
                var val = $(this).val();
                if (isValidResult(val)) {
                    match.teams[$(this).closest('.play-off-team').index()].goals = parseInt(val, 10);
                    if (!Number.isNaN(match.teams[0].goals) && !Number.isNaN(match.teams[1].goals)) {
                        if (match.teams[0].goals === match.teams[1].goals) {
                            $(this).closest('.play-off-match').removeClass('has-success').addClass('has-error');
                            match.complete = false;
                        } else {
                            $(this).closest('.play-off-match').removeClass('has-error').addClass('has-success');
                            match.complete = true;
                            $('#tournament-bracket').trigger('match-complete', [stage, matchID]);
                        }
                    }
                } else {
                    $(this).closest('.play-off-match').removeClass('has-success').removeClass('has-error');
                    if ($(this).val() != '') {
                        $(this).closest('.play-off-match').addClass('has-error');
                    }
                    match.complete = false;
                }
            });

            $('#tournament-bracket').on('match-complete', function (event, stage, matchID) {
                var match = playoff.getMatch(stage, matchID);

                if (stage !== 'ro2') {
                    var nextMatch = playoff.getNextMatch(stage, matchID);

                    nextMatch.teams[1 - matchID % 2].teamObject = match.getWinner();

                    playoff.displayNextMatch(stage, matchID);

                    stage = stage.slice(2);
                    stage = '#ro' + (parseInt(stage, 10) / 2).toString();
                    $(stage).find(`[data-id='${Math.floor((matchID - 1) / 2) + 1}']`).find('input').eq(0).trigger('change');
                }
            });
        }

        initTeams() {
            var names = [['France', 'fr'], ['Romania', 'ro'], ['Albania', 'al'], ['Switzerland', 'ch'],
                ['England', '_England'], ['Russia', 'ru'], ['Wales', '_Wales'], ['Slovakia', 'sk'],
                ['Germany', 'de'], ['Ukraine', 'ua'], ['Poland', 'pl'], ['Northern Ireland', '_Northern%20Ireland'],
                ['Spain', 'es'], ['Czech Republic', 'cz'], ['Turkey', 'tr'], ['Croatia', 'hr'],
                ['Belgium', 'be'], ['Italy', 'it'], ['Republic of Ireland', 'ie'], ['Sweden', 'se'],
                ['Portugal', 'pt'], ['Iceland', 'is'], ['Austria', 'at'], ['Hungary', 'hu']];

            var teams = [];
            for (let name of names) {
                teams.push(new Team(...name));
            }

            return teams;
        }
    }

    $.getJSON('coefficient.json', function (data) {
        uefaCoefficient = data.uefaCoefficient;
        var euro2016 = new Tournament();
    });
})();