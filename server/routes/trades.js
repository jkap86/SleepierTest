



const getTrades = async (app, req) => {
    const trades_table = app.get('trades_table')
    const trades = await trades_table[req.query.season].findAll({
        order: [['status_updated', 'DESC']],
        limit: 1000,
        offset: (req.query.page) * 1000
    })

    const count = await trades_table[req.query.season].count()

    return {
        trades: trades,
        count: count
    }
}

module.exports = {
    getTrades: getTrades
}