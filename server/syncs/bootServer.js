const { getAllPlayers } = require('../helpers/getAllPlayers');
const { users } = require('../models/users');
const { leagues } = require('../models/leagues');
const { trades } = require('../models/trades');
const { Playoffs_Scoring } = require('./playoffs_scoring');


const bootServer = async (app, axios, db) => {
    const state = await axios.get('https://api.sleeper.app/v1/state/nfl')
    await app.set('state', state.data)

    const allplayers = await getAllPlayers(axios, state.data)
    app.set('allplayers', allplayers)



    let leagues_table = {};
    let trades_table = {};
    let season = Math.max(parseInt(state.data.league_season), parseInt(state.data.league_create_season));
    let seasons_options = []

    while (season >= 2018) {
        leagues_table[season] = leagues(db, season)
        await leagues_table[season].sync({ alter: true })

        trades_table[season] = trades(db, season)
        await trades_table[season].sync({ alter: true })

        seasons_options.push(season)
        season -= 1
    }

    const users_table = users(db, seasons_options)
    await users_table.sync({ alter: true })

    app.set('seasons_options', seasons_options)
    app.set('users_table', users_table)
    app.set('leagues_table', leagues_table)
    app.set('trades_table', trades_table)
    app.set('leaguemates', {})
}

module.exports = {
    bootServer: bootServer
}