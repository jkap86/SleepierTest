const { Op } = require("sequelize")

const getUser = async (axios, req) => {
    let user;
    try {
        user = await axios.get(`http://api.sleeper.app/v1/user/${req.query.username}`)
    } catch (error) {
        console.log(error)
    }
    if (user.data) {
        return {
            avatar: user.data.avatar,
            user_id: user.data.user_id,
            username: user.data.display_name
        };
    } else {
        return 'ERROR'
    }
}

const updateUser = async (axios, app, req) => {
    const users_table = app.get('users_table');
    const state = app.get('state');
    if (!users_table) {
        return
    }
    const user_db = await users_table.findOne({ where: { user_id: req.user.user_id } });
    let new_user;
    let league_ids;
    if (req.query.season === state.league_create_season || !user_db || !user_db[`${req.query.season}_leagues`]) {
        try {
            const leagues = await axios.get(`http://api.sleeper.app/v1/user/${req.user.user_id}/leagues/nfl/${req.query.season}`)
            league_ids = leagues.data.map(league => league.league_id)
        } catch (error) {
            console.log(error)
        }
        if (user_db) {
            await users_table.update({
                username: req.user.username,
                avatar: req.user.avatar,
                [`${req.query.season}_leagues`]: league_ids
            }, {
                where: {
                    user_id: req.user.user_id
                }
            })
        } else {
            new_user = {
                user_id: req.user.user_id,
                username: req.user.username,
                avatar: req.user.avatar,
                [`${req.query.season}_leagues`]: league_ids
            }
            await users_table.create(new_user)
        }
    } else {
        league_ids = user_db[`${req.query.season}_leagues`] || []
    }

    return {
        user: user_db || new_user,
        league_ids: league_ids,
        new: user_db ? -1 : 1
    }
}

const updateUser_Leagues = async (axios, app, req) => {
    const state = app.get('state')
    const cutoff = new Date(new Date() - (15 * 60 * 1000))
    const league_ids = req.league_ids || req.user_db.league_ids
    const keys = ["name", "avatar", "best_ball", "type", "settings", "scoring_settings", "roster_positions",
        "users", "rosters", "updatedAt"]

    let keys_to_update = keys
    if (req.query.season === state.league_season && state.week > 0 && state.week < 19) {
        keys_to_update.push(`matchups_${state.week}`)
    }

    const keys_to_add = [...keys, ...Array.from(Array(Math.min(18, state.week)).keys()).map(key => `matchups_${key + 1}`)]

    let leagues_user_db = await app.get('leagues_table')[req.query.season].findAll({
        where: {
            league_id: {
                [Op.in]: league_ids
            }
        }
    })
    leagues_user_db = leagues_user_db.map(league => league.dataValues)
    const leagues_up_to_date = leagues_user_db.filter(l_db => l_db.updatedAt >= cutoff)
    const leagues_to_update = leagues_user_db.filter(l_db => l_db.updatedAt < cutoff)
    const leagues_to_add = league_ids.filter(l => !leagues_user_db.find(l_db => l_db.league_id === l))

    console.log(`${leagues_up_to_date.length} Leagues Up to Date...`)
    console.log(`${leagues_to_update.length} Leagues to Update...`)
    console.log(`${leagues_to_add.length} Leagues to Add...`)

    let updated_leagues = []
    let i = 0;
    const increment = 1000;

    while (i <= leagues_to_update?.length) {
        let updated_leagues_batch = []
        await Promise.all(leagues_to_update
            .slice(i, Math.min(i + increment, leagues_to_update.length + 1))
            .map(async league_to_update => {
                const [league, users, rosters] = await Promise.all([
                    await axios.get(`https://api.sleeper.app/v1/league/${league_to_update.league_id}`),
                    await axios.get(`https://api.sleeper.app/v1/league/${league_to_update.league_id}/users`),
                    await axios.get(`https://api.sleeper.app/v1/league/${league_to_update.league_id}/rosters`),
                ])
                let matchups;

                if (req.query.season === state.league_season && state.week > 0 && state.week < 19) {
                    try {
                        matchups = await axios.get(`https://api.sleeper.app/v1/league/${league_to_update.league_id}/matchups/${state.week}`)
                    } catch (error) {
                        console.log(error)
                        matchups = {
                            data: []
                        }
                    }

                }
                const updated_league = {
                    league_id: league_to_update.league_id,
                    name: league.data.name,
                    avatar: league.data.avatar,
                    best_ball: league.data.settings.best_ball,
                    type: league.data.settings.type,
                    settings: league.data.settings,
                    scoring_settings: league.data.scoring_settings,
                    roster_positions: league.data.roster_positions,
                    users: users.data.map(user => {
                        return {
                            user_id: user.user_id,
                            display_name: user.display_name,
                            avatar: user.avatar
                        }
                    }),
                    rosters: rosters.data.map(roster => {
                        return {
                            taxi: roster.taxi,
                            starters: roster.starters,
                            settings: roster.settings,
                            roster_id: roster.roster_id,
                            reserve: roster.reserve,
                            players: roster.players,
                            owner_id: roster.owner_id,
                            co_owners: roster.co_owners
                        }
                    }),
                    [`matchups_${state.week}`]: matchups?.data,
                    updatedAt: Date.now()
                }

                updated_leagues_batch.push(updated_league)

                if (!req.league_ids) {
                    updated_leagues.push(updated_league)
                }
            })
        )

        await app.get('leagues_table')[req.query.season].bulkCreate(updated_leagues_batch, {
            updateOnDuplicate: keys_to_update
        })

        console.log(`${i + 1}-${Math.min(i + increment, leagues_to_update.length)} of ${leagues_to_update.length} Updated...`)

        i += increment
    }



    let new_leagues = []
    let j = 0;
    const increment_new = 200;

    while (j <= leagues_to_add?.length) {
        let new_leagues_batch = []
        await Promise.all(leagues_to_add
            .slice(j, Math.min(j + increment_new, leagues_to_add.length))
            .map(async league_to_add => {
                let league, users, rosters;
                try {
                    [league, users, rosters] = await Promise.all([
                        await axios.get(`https://api.sleeper.app/v1/league/${league_to_add}`),
                        await axios.get(`https://api.sleeper.app/v1/league/${league_to_add}/users`),
                        await axios.get(`https://api.sleeper.app/v1/league/${league_to_add}/rosters`),
                    ])
                } catch (error) {
                    console.log(error)
                }

                const weeks = state.league_season === req.query.season ? state.week
                    : state.league_season > req.query.season ? 18
                        : 0

                let matchups = {};

                await Promise.all(Array.from(Array(weeks).keys()).map(async key => {
                    let matchups_prev_week;
                    try {
                        matchups_prev_week = await axios.get(`https://api.sleeper.app/v1/league/${league_to_add}/matchups/${key + 1}`)
                    } catch (error) {
                        console.log({
                            code: error.code,
                            message: error.message,
                            stack: error.stack
                        })
                    }
                    matchups[`matchups_${key + 1}`] = matchups_prev_week?.data || []
                }))

                const new_league = {
                    league_id: league_to_add,
                    name: league.data.name,
                    avatar: league.data.avatar,
                    best_ball: league.data.settings.best_ball,
                    type: league.data.settings.type,
                    settings: league.data.settings,
                    scoring_settings: league.data.scoring_settings,
                    roster_positions: league.data.roster_positions,
                    users: users.data.map(user => {
                        return {
                            user_id: user.user_id,
                            display_name: user.display_name,
                            avatar: user.avatar
                        }
                    }),
                    rosters: rosters.data.map(roster => {
                        return {
                            taxi: roster.taxi,
                            starters: roster.starters,
                            settings: roster.settings,
                            roster_id: roster.roster_id,
                            reserve: roster.reserve,
                            players: roster.players,
                            owner_id: roster.owner_id,
                            co_owners: roster.co_owners
                        }
                    }),
                    ...matchups
                }

                new_leagues_batch.push(new_league)

                if (!req.league_ids) {
                    new_leagues.push(new_league)
                } else {
                    new_leagues.push(new_league.league_id)
                }
            })
        )

        await app.get('leagues_table')[req.query.season].bulkCreate(new_leagues_batch, {
            updateOnDuplicate: keys_to_add
        })

        console.log(`${j + 1}-${Math.min(j + increment_new, leagues_to_add.length)} of ${leagues_to_add.length} Added...`)

        j += increment_new
    }





    return req.league_ids ? new_leagues : (
        [...leagues_up_to_date, ...updated_leagues, ...new_leagues]
            .map(league => {
                league.rosters
                    ?.sort((a, b) => b.settings.fpts - a.settings.fpts)
                    ?.map((roster, index) => {
                        roster['rank_points'] = index + 1
                        return roster
                    })

                const standings = (
                    league.rosters
                        ?.sort((a, b) => b.settings.wins - a.settings.wins || a.settings.losses - b.settings.losses ||
                            b.settings.fpts - a.settings.fpts)
                        ?.map((roster, index) => {
                            roster['rank'] = index + 1
                            return roster
                        })
                )
                const userRoster = standings?.find(r => r.owner_id === req.user_db.user.user_id || r.co_owners?.includes(req.user_db.user.user_id))
                return {
                    ...league,
                    index: league_ids.findIndex(l => {
                        return l === league.league_id
                    }),
                    userRoster: userRoster
                }
            })
            .filter(league => league.userRoster?.players?.length > 0)
            .sort((a, b) => a.index - b.index)
    )

}

const updateLeaguemates = async (axios, app) => {
    console.log('updating leaguemates')
    const leaguemates = app.get('leaguemates')

    let updated_leagues = []

    for (let s = 0; s < Object.keys(leaguemates).length; s++) {
        const season = Object.keys(leaguemates)[s]
        const leagumates_season = leaguemates[season]

        console.log(`${Object.keys(leagumates_season).length} Leaguemates for ${season}`)

        let i = 0
        const increment = 100

        let lm_leagues = []

        while (i < Object.keys(leagumates_season).length) {
            await Promise.all(Object.keys(leagumates_season)
                .slice(i, Math.min(i + increment, Object.keys(leagumates_season).length + 1))
                .map(async lm => {
                    const user_db = await updateUser(axios, app, {
                        user: {
                            user_id: lm,
                            avatar: leagumates_season[lm].avatar,
                            username: leagumates_season[lm].username
                        },
                        query: {
                            season: season
                        }
                    })
                    if (user_db.new === 1) {
                        lm_leagues.push(user_db.league_ids)
                    }
                }))

            i += increment

        }

        console.log(`${lm_leagues.length} new Leaguemates added ${season}`)

        const leagues_to_add = Array.from(new Set(lm_leagues.flat(2)))

        console.log(`${leagues_to_add.length} Leaguemate Leagues update for ${season}`)

        const added_leagues = await updateUser_Leagues(axios, app, {
            league_ids: leagues_to_add,
            query: {
                season: season
            }
        })

        console.log(added_leagues.length + ' New Leagues Added...')

    }

}

module.exports = {
    getUser: getUser,
    updateUser: updateUser,
    updateUser_Leagues: updateUser_Leagues,
    updateLeaguemates: updateLeaguemates
}