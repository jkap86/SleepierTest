const ALLPLAYERS = require('../allplayers.json');

const getAllPlayers = async (axios, state) => {
    let sleeper_players;
    if (process.env.DATABASE_URL) {
        try {
            sleeper_players = await axios.get('https://api.sleeper.app/v1/players/nfl')
            sleeper_players = sleeper_players.data

        } catch (error) {
            console.log(error)
        }
    } else {
        console.log('getting allplayers from file...')

        sleeper_players = ALLPLAYERS
    }


    if (state.season_type === 'regular') {
        sleeper_players = getWeeklyRankings(axios, state, sleeper_players)
    }


    return sleeper_players
}

const getWeeklyRankings = async (axios, state, sleeper_players) => {

}

module.exports = {
    getAllPlayers: getAllPlayers
}