



const getTrades = async (app, req) => {
    const trades_table = app.get('trades_table')
    const trades = await trades_table[req.query.season].findAll({
        order: [['status_updated', 'DESC']],
        limit: 250,
        offset: (req.query.page - 1) * 250
    })

    return trades
}

module.exports = {
    getTrades: getTrades
}