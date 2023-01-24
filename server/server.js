const express = require('express')
const app = express()
const cors = require('cors')
const compression = require('compression')
const path = require('path')
const NodeCache = require('node-cache');
const Sequelize = require('sequelize')
const https = require('https');
const axios = require('axios').create({
    headers: {
        'content-type': 'application/json'
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true })
})
axios.defaults.timeout = 5000;
const axiosRetry = require('axios-retry');
const puppeteer = require('puppeteer');
const http = require('http').Server(app)
const socketIO = require('socket.io')(http, {
    cors: {
        origin: "http://10.0.0.50:3000"
    }
})
const PuppeteerMassScreenshots = require("./screen.shooter");
const userAgent = require('user-agents');
const { bootServer } = require('./syncs/bootServer');
const { dailySync } = require('./syncs/daily_sync');
const { getUser, updateUser, updateUser_Leagues, updateLeaguemates } = require('./routes/user');
const { trades_sync } = require('./syncs/trades_sync')
const { getTrades } = require('./routes/trades')
const { Playoffs_Scoring } = require('./syncs/playoffs_scoring')
const { getPlayoffLeague } = require('./routes/league')

const myCache = new NodeCache;

app.use(compression())
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build')));

const connectionString = process.env.DATABASE_URL || 'postgres://dev:password123@localhost:5432/dev'
const ssl = process.env.HEROKU ? { rejectUnauthorized: false } : false
const db = new Sequelize(connectionString, { logging: false, dialect: 'postgres', dialectOptions: { ssl: ssl, useUTC: false } })


axiosRetry(axios, {
    retries: 3,
    retryCondition: (error) => {
        return error.code === 'ECONNABORTED' || error.code === 'ERR_BAD_REQUEST' ||
            axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
    },
    retryDelay: (retryCount) => {
        return retryCount * 500
    },
    shouldResetTimeout: true
})

bootServer(app, axios, db)
const date = new Date()
const tzOffset = date.getTimezoneOffset()
const tzOffset_ms = tzOffset * 60 * 1000
const date_tz = new Date(date + tzOffset_ms)

const hour = date_tz.getHours()
const minute = date_tz.getMinutes()

let delay;
if (hour < 3) {
    delay = (((3 - hour) * 60) + (60 - minute)) * 60 * 1000
} else {
    delay = (((27 - hour) * 60) + (60 - minute)) * 60 * 1000
}

setTimeout(async () => {
    setInterval(async () => {
        dailySync(app, axios)
        console.log(`Daily Sync completed at ${new Date()}`)
    }, 24 * 60 * 60 * 1 * 1000)

}, delay)
console.log(`Daily Sync in ${Math.floor(delay / (60 * 60 * 1000))} hours`)

setInterval(async () => {
    await updateLeaguemates(axios, app)
    console.log(`Leaguemate Sync Complete`)

}, 60 * 1000)

setInterval(async () => {

    await trades_sync(axios, app)
}, 60 * 60 * 1000)



const playoffs_sync = async () => {
    let scoring_interval = await Playoffs_Scoring(axios, app)
    console.log(`Next scoring update in ${Math.floor(scoring_interval / (60 * 60 * 1000))} hours, ${Math.floor(scoring_interval % (60 * 60 * 1000) / (60 * 1000))} minutes`)
    setTimeout(() => {
        playoffs_sync()
    }, scoring_interval)
}


playoffs_sync()





app.get('/playoffscores', async (req, res) => {
    const playoffs = app.get('playoffs_scoring')
    const allplayers = app.get('allplayers')
    res.send({
        scoring: playoffs,
        allplayers: allplayers
    })
})

app.get('/playoffs/league', async (req, res) => {
    const league_cache = myCache.get(req.query.league_id)
    if (league_cache) {
        console.log('From Cache...')
        res.send(league_cache)
    } else {
        const schedule = app.get('schedule')
        const league = await getPlayoffLeague(axios, req.query.league_id)
        myCache.set(req.query.league_id, {
            ...league,
            schedule: schedule
        }, 60 * 60)
        res.send({
            ...league,
            schedule: schedule
        })
    }
})


app.get('/home', (req, res) => {
    const leagues_table = app.get('leagues_table')
    if (leagues_table) {
        res.send({
            seasons: Object.keys(leagues_table),
            state: app.get('state')
        })
    }
})

app.get('/allplayers', (req, res) => {
    const allplayers = app.get('allplayers');
    res.send(allplayers);
})

app.get('/user', async (req, res, next) => {
    const user = await getUser(axios, req)
    if (!Object.keys(app.get('leagues_table')).includes(req.query.season)) {
        res.send('Invalid Season')
    } else if (user?.user_id) {
        req.user = user
        next()
    } else {
        res.send('Username Not Found')
    }
}, async (req, res, next) => {
    const user_db = await updateUser(axios, app, req)
    req.user_db = user_db
    next();
}, async (req, res, next) => {
    const leagues_db = await updateUser_Leagues(axios, app, req)
    let leaguemates = app.get('leaguemates')

    if (!Object.keys(leaguemates).includes(req.query.season)) {
        leaguemates[req.query.season] = {}
    }

    leagues_db.map(league => {
        return league.users
            .filter(u => u.user_id !== req.user_db.user.user_id)
            .map(user => {
                return leaguemates[req.query.season][user.user_id] = {

                    avatar: user.avatar,
                    user_id: user.user_db,
                    username: user.display_name

                }
            })
    })

    app.set('leaguemates', leaguemates)


    const data = {
        user_id: req.user_db.user.user_id,
        username: req.user_db.user.username,
        avatar: req.user_db.user.avatar,
        seasons: Object.keys(app.get('leagues_table')),
        leagues: leagues_db,
        state: app.get('state')
    }
    res.send(data)
})

app.get('/trades', async (req, res, next) => {
    const trades_db = await getTrades(app)
    res.send(trades_db)
})

app.get('*', async (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
})

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});