



const getTrades = async (app, req) => {
    const trades_table = app.get('trades_table')
    const trades = await trades_table[req.query.season].findAll()

    return trades
}

module.exports = {
    getTrades: getTrades
}