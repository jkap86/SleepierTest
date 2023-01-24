


const trades_sync = async (axios, app) => {
    console.log(`Begin transactions sync at ${new Date()}`)

    const leagues_table = app.get('leagues_table')
    const trades_table = app.get('trades_table')

    const state = app.get('state')

    const total_leagues = await leagues_table[state.league_season].count()


    let i = 0
    const increment = 500

    while (i < total_leagues) {
        const all_leagues = await leagues_table[state.league_season].findAll({
            order: [['league_id', 'DESC']],
            offset: i,
            limit: increment
        })

        const leagues_to_update = all_leagues

        console.log(`Updating trades for ${i + 1}-${Math.min(i + 1 + increment, leagues_to_update.length)} of ${total_leagues} Leagues...`)

        let transactions_week = []

        await Promise.all(leagues_to_update
            .map(async league => {
                let transactions_league;
                let transactions_league_prev;
                try {
                    transactions_league = await axios.get(`https://api.sleeper.app/v1/league/${league.dataValues.league_id}/transactions/${state.season_type === 'regular' ? state.week : 1}`)
                    if (state.season_type === 'regular' && state.week > 1) {
                        transactions_league_prev = await axios.get(`https://api.sleeper.app/v1/league/${league.dataValues.league_id}/transactions/${state.week - 1}`)
                    }
                } catch (error) {
                    console.log(error)
                    transactions_league = {
                        data: []
                    }
                }
                return [...transactions_league.data, ...transactions_league_prev?.data || []]
                    .map(transaction => {
                        const managers = transaction.roster_ids.map(roster_id => {
                            const user_id = league.dataValues.rosters.find(x => x.roster_id === roster_id)?.owner_id
                            const user = league.dataValues.users.find(x => x.user_id === user_id)
                            return user
                        })

                        if (transaction.type === 'trade') {
                            return transactions_week.push({
                                transaction_id: transaction.transaction_id,
                                status_updated: new Date(transaction.status_updated),
                                managers: managers,
                                adds: transaction.adds,
                                drops: transaction.drops,
                                draft_picks: transaction.draft_picks,
                                league: {
                                    league_id: league.league_id,
                                    name: league.name,
                                    avatar: league.avatar,
                                    rosters: league.rosters,
                                    users: league.users
                                }
                            })
                        }

                    })
            }))

        try {
            await trades_table[state.league_season].bulkCreate(transactions_week, { ignoreDuplicates: true })
        } catch (error) {
            console.log(error)
        }

        i += increment
    }


    console.log(`Transactions sync completed at ${new Date()}`)
}


module.exports = {
    trades_sync: trades_sync
}