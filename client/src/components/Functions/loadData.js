

export const getLeagueData = (leagues, user_id, state, query_season) => {
    let players_all = [];
    let leaguemates_all = [];
    let matchups_all = []

    leagues.map(league => {
        league.rosters.map(roster => {
            roster.players?.map(player_id => {
                players_all.push({
                    id: player_id,
                    league_id: league.league_id,
                    name: league.name,
                    avatar: league.avatar,
                    status: (
                        roster.starters?.includes(player_id) ?
                            'Starter' :
                            roster.taxi?.includes(player_id) ?
                                'Taxi' :
                                roster.reserve?.includes(player_id) ?
                                    'IR' :
                                    'Bench'
                    ),
                    rosters: league.rosters,
                    userRoster: league.userRoster,
                    users: league.users,
                    scoring_settings: league.scoring_settings,
                    rank: roster.rank,
                    rank_pts: roster.rank_points,
                    roster: roster,
                    roster_positions: league.roster_positions,
                    type: league.type,
                    best_ball: league.best_ball,
                    manager: (league.users.find(x =>
                        x.user_id === roster.owner_id
                    )) || (league.users.find(x =>
                        roster.co_owners?.includes(x.user_id)
                    )) || {
                        username: 'Orphan',
                        user_id: 0
                    },
                    wins: roster.settings.wins,
                    losses: roster.settings.losses,
                    ties: roster.settings.ties,
                    fpts: parseFloat(`${roster.settings.fpts}.${roster.settings.fpts_decimal}`),
                    fpts_against: parseFloat(`${roster.settings.fpts_against}.${roster.settings.fpts_against_decimal}`)
                })
            })
        })

        league.users.map(user => {
            let lmRoster = league.rosters.find(x =>
                x.owner_id === user.user_id ||
                x.co_owners?.includes(user.user_id)
            )
            if (lmRoster?.players) {
                leaguemates_all.push({
                    ...user,
                    league: {
                        ...league,
                        lmRoster: lmRoster
                    }
                })
            }
        })


        const week = query_season === state.league_season ? state.week
            : query_season < state.league_season ? 18
                : 0

        let matchups_league = { league: league }

        Array.from(Array(week).keys()).map(key => {
            matchups_league[`matchups_${key + 1}`] = league[`matchups_${key + 1}`]
        })
        matchups_all.push(matchups_league)
    })

    let playersCount = [];
    let leaguematesCount = [];

    players_all.map(player => {
        const index = playersCount.findIndex(obj => {
            return obj.id === player.id
        })
        if (index === -1) {
            let leagues_owned = players_all.filter(x => x.id === player.id && x.manager?.user_id === user_id)
            let leagues_taken = players_all.filter(x => x.id === player.id && x.manager?.user_id !== user_id)
            playersCount.push({
                id: player.id,
                leagues_owned: leagues_owned,
                leagues_taken: leagues_taken,
                leagues_available: leagues.filter(x =>
                    !leagues_owned.find(y => y.league_id === x.league_id) &&
                    !leagues_taken.find(y => y.league_id === x.league_id)
                )
            })
        }
    })

    leaguemates_all.map(lm => {
        const index = leaguematesCount.findIndex(obj => {
            return obj.user_id === lm.user_id
        })
        if (index === -1) {
            leaguematesCount.push({
                user_id: lm.user_id,
                username: lm.username,
                avatar: lm.avatar,
                leagues: leaguemates_all.filter(x => x.user_id === lm.user_id).map(x => x.league)
            })
        }
    })

    return {
        players: playersCount,
        leaguemates: leaguematesCount,
        matchups: matchups_all
    }
}

export const getLineupCheck = (matchup, league, stateAllPlayers) => {
    const position_map = {
        'QB': ['QB'],
        'RB': ['RB', 'FB'],
        'WR': ['WR'],
        'TE': ['TE'],
        'FLEX': ['RB', 'FB', 'WR', 'TE'],
        'SUPER_FLEX': ['QB', 'RB', 'FB', 'WR', 'TE'],
        'WRRB_FLEX': ['RB', 'FB', 'WR'],
        'REC_FLEX': ['WR', 'TE']
    }
    const position_abbrev = {
        'QB': 'QB',
        'RB': 'RB',
        'WR': 'WR',
        'TE': 'TE',
        'SUPER_FLEX': 'SF',
        'FLEX': 'WRT',
        'WRRB_FLEX': 'W R',
        'WRRB_WRT': 'W R',
        'REC_FLEX': 'W T'
    }
    const starting_slots = league.roster_positions.filter(x => Object.keys(position_map).includes(x))

    let players = []
    matchup?.players?.map(player_id => {
        players.push({
            id: player_id,
            rank: stateAllPlayers[player_id]?.rank_ecr || 999
        })
    })

    const getOptimalLineup = () => {
        let optimal_lineup = []
        let player_ranks_filtered = players
        starting_slots.map((slot, index) => {
            const slot_options = player_ranks_filtered
                .filter(x => position_map[slot].includes(stateAllPlayers[x.id]?.position))
                .sort((a, b) => a.rank - b.rank || (matchup.starters || []).includes(a.id) - (matchup.starters || []).includes(b.id))

            const optimal_player = slot_options[0]?.id
            player_ranks_filtered = player_ranks_filtered.filter(x => x.id !== optimal_player)
            optimal_lineup.push({
                slot: position_abbrev[slot],
                player: optimal_player
            })
        })

        return optimal_lineup
    }

    let optimal_lineup = matchup ? getOptimalLineup() : []

    const findSuboptimal = () => {
        let lineup_check = []
        starting_slots.map((slot, index) => {
            const cur_id = (matchup?.starters || [])[index]
            const isInOptimal = optimal_lineup.find(x => x.player === cur_id)
            const gametime = new Date((stateAllPlayers[cur_id]?.gametime) * 1000)
            const day = gametime.getDay() <= 2 ? gametime.getDay() + 7 : gametime.getDay()
            const hour = gametime.getHours()
            const timeslot = parseFloat(day + '.' + hour)
            const slot_options = matchup?.players
                ?.filter(x =>
                    !(matchup.starters || []).includes(x) &&
                    position_map[slot].includes(stateAllPlayers[x]?.position)
                )
                || []
            const earlyInFlex = timeslot < 7 && matchup.starters?.find((x, starter_index) => {
                const alt_gametime = new Date(stateAllPlayers[x]?.gametime * 1000)
                const alt_day = alt_gametime.getDay() <= 2 ? alt_gametime.getDay() + 7 : alt_gametime.getDay()
                const alt_hour = alt_gametime.getHours()
                const alt_timeslot = parseFloat(alt_day + '.' + alt_hour)

                return (

                    alt_timeslot > timeslot
                    && position_map[slot].includes(stateAllPlayers[x]?.position)
                    && position_map[starting_slots[starter_index]].includes(stateAllPlayers[cur_id]?.position)
                    && position_map[league.roster_positions[starter_index]].length < position_map[slot].length
                )
            })

            const lateNotInFlex = timeslot > 7.17 && matchup.starters?.find((x, starter_index) => {
                const alt_gametime = new Date(stateAllPlayers[x]?.gametime * 1000)
                const alt_day = alt_gametime.getDay() <= 2 ? alt_gametime.getDay() + 7 : alt_gametime.getDay()
                const alt_hour = alt_gametime.getHours()
                const alt_timeslot = parseFloat(alt_day + '.' + alt_hour)

                return (
                    alt_timeslot < timeslot
                    && position_map[slot].includes(stateAllPlayers[x]?.position)
                    && position_map[starting_slots[starter_index]].includes(stateAllPlayers[cur_id]?.position)
                    && position_map[league.roster_positions[starter_index]].length > position_map[slot].length
                )
            })

            return lineup_check.push({
                index: index,
                slot: position_abbrev[slot],
                slot_index: `${position_abbrev[slot]}_${index}`,
                current_player: (matchup?.starters || [])[index] || '0',
                notInOptimal: !isInOptimal,
                earlyInFlex: earlyInFlex,
                lateNotInFlex: lateNotInFlex,
                nonQBinSF: position_map[slot].includes('QB') && stateAllPlayers[(matchup?.starters || [])[index]]?.position !== 'QB',
                slot_options: slot_options
            })
        })
        return lineup_check
    }

    const lineup_check = matchup ? findSuboptimal() : []

    return {
        players_points: matchup.players_points,
        starting_slots: starting_slots,
        optimal_lineup: optimal_lineup,
        lineup_check: lineup_check
    }
}

