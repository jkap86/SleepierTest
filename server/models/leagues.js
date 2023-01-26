const { Sequelize } = require("sequelize");

const leagues = (db, season) => {
    return db.define(`${season}_leagues`, {
        league_id: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING
        },
        avatar: {
            type: Sequelize.STRING
        },
        best_ball: {
            type: Sequelize.INTEGER,
        },
        type: {
            type: Sequelize.INTEGER
        },
        settings: {
            type: Sequelize.JSONB
        },
        scoring_settings: {
            type: Sequelize.JSONB
        },
        roster_positions: {
            type: Sequelize.JSONB
        },
        users: {
            type: Sequelize.JSONB
        },
        rosters: {
            type: Sequelize.JSONB
        },
        drafts: {
            type: Sequelize.JSONB
        },
        ...Object.fromEntries(Array.from(Array(18).keys()).map(key => {
            return [`matchups_${key + 1}`, { type: Sequelize.JSONB }]
        }))
    })
}

module.exports = {
    leagues: leagues
}