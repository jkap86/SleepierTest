import TableMain from "../Home/tableMain";
import { memo, useState, useEffect } from "react"
import LeaguematePlayersLeagues from "./leaguematePlayersLeagues"

const LeaguemateLeagues = ({ stateAllPlayers, state_user, leaguemate }) => {
    const [secondaryContent, setSecondaryContent] = useState('Leagues')
    const [page, setPage] = useState(1)
    const [searched, setSearched] = useState('')
    const [itemActive, setItemActive] = useState('')
    const [playersCount, setPlayersCount] = useState([])

    const sort = (sort_by) => {
        console.log(sort_by)
        let players_count = playersCount
        switch (sort_by) {
            case 'Leaguemate':
                players_count = players_count.sort((a, b) => b.leagues_lm?.length - a.leagues_lm?.length)
                break;
            case 'User':
                players_count = players_count.sort((a, b) => b.leagues_user?.length - a.leagues_user?.length)
                break;
            default:
                break;
        }
        console.log(players_count)
        setPlayersCount([...players_count])
    }

    useEffect(() => {
        const players_all = []

        leaguemate.leagues.map(league => {
            return league.lmRoster.players.map(player => {
                return players_all.push({
                    id: player,
                    league: league,
                    type: 'lm',
                    wins: league.lmRoster.settings.wins,
                    losses: league.lmRoster.settings.losses,
                    ties: league.lmRoster.settings.ties
                })
            }) &&
                league.userRoster.players.map(player => {
                    return players_all.push({
                        id: player,
                        league: league,
                        type: 'user',
                        wins: league.userRoster.settings.wins,
                        losses: league.userRoster.settings.losses,
                        ties: league.userRoster.settings.ties
                    })
                })
        })

        const players_count = []

        players_all.map(player => {
            const index = players_count.findIndex(obj => {
                return obj.id === player.id
            })
            if (index === -1) {
                let leagues_lm = players_all.filter(x => x.id === player.id && x.type === 'lm')
                let leagues_user = players_all.filter(x => x.id === player.id && x.type === 'user')
                players_count.push({
                    id: player.id,
                    leagues_lm: leagues_lm,
                    leagues_user: leagues_user
                })
            }
        })
        setPlayersCount(players_count)

    }, [leaguemate, state_user, stateAllPlayers])
    const leaguemateLeagues_headers = [
        [
            {
                text: 'League',
                colSpan: 4,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: leaguemate.display_name,
                colSpan: 4,
                className: 'half'
            },
            {
                text: state_user.username,
                colSpan: 4,
                className: 'half'
            }
        ],
        [
            {
                text: 'Record',
                colSpan: 2,
                className: 'half'
            },
            {
                text: 'Ovr',
                colSpan: 1,
                className: 'small half'
            },
            {
                text: 'PF',
                colSpan: 1,
                className: 'small half'
            },
            {
                text: 'Record',
                colSpan: 2,
                className: 'half'
            },
            {
                text: 'Ovr',
                colSpan: 1,
                className: 'small half'
            },
            {
                text: 'PF',
                colSpan: 1,
                className: 'small half'
            },
        ]
    ]

    const leaguemateLeagues_body = leaguemate.leagues.map((lm_league) => {
        return {
            id: lm_league.league_id,
            list: [[
                {
                    text: lm_league.name,
                    colSpan: 4,
                    className: 'left',
                    image: {
                        src: lm_league.avatar,
                        alt: 'avatar',
                        type: 'league'
                    }
                },
                {
                    text: `${lm_league.lmRoster.settings.wins}-${lm_league.lmRoster.settings.losses}${lm_league.lmRoster.ties > 0 ? `-${lm_league.lmRoster.ties}` : ''}`,
                    colSpan: 2

                },
                {
                    text: lm_league.lmRoster.rank,
                    colSpan: 1,
                    className: lm_league.lmRoster.rank / lm_league.rosters.length <= .25 ? 'green' :
                        lm_league.lmRoster.rank / lm_league.rosters.length >= .75 ? 'red' :
                            null
                },
                {
                    text: lm_league.lmRoster.rank_points,
                    colSpan: 1,
                    className: lm_league.lmRoster.rank_points / lm_league.rosters.length <= .25 ? 'green' :
                        lm_league.lmRoster.rank_points / lm_league.rosters.length >= .75 ? 'red' :
                            null
                },
                {
                    text: `${lm_league.userRoster.settings.wins}-${lm_league.userRoster.settings.losses}${lm_league.userRoster.ties > 0 ? `-${lm_league.userRoster.ties}` : ''}`,
                    colSpan: 2
                },
                {
                    text: lm_league.userRoster.rank,
                    colSpan: 1,
                    className: lm_league.userRoster.rank / lm_league.rosters.length <= .25 ? 'green' :
                        lm_league.userRoster.rank / lm_league.rosters.length >= .75 ? 'red' :
                            null
                },
                {
                    text: lm_league.userRoster.rank_points,
                    colSpan: 1,
                    className: lm_league.userRoster.rank_points / lm_league.rosters.length <= .25 ? 'green' :
                        lm_league.userRoster.rank_points / lm_league.rosters.length >= .75 ? 'red' :
                            null
                }
            ]]
        }
    })

    const leaguematePlayers_headers = [
        [
            {
                text: 'Player',
                colSpan: 4,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: leaguemate.display_name,
                colSpan: 4,
                onClick: () => sort('Leaguemate'),
                className: 'half'
            },
            {
                text: state_user.username,
                colSpan: 4,
                onClick: () => sort('User'),
                className: 'half'
            }
        ],
        [
            {
                text: 'Count',
                colSpan: 1,
                className: 'small half',
                onClick: () => sort('Leaguemate')
            },
            {
                text: 'Record',
                colSpan: 3,
                className: 'small half',
                onClick: () => sort('Leaguemate')
            },
            {
                text: 'Count',
                colSpan: 1,
                className: 'small half',
                onClick: () => sort('User')
            },
            {
                text: 'Record',
                colSpan: 3,
                className: 'small half',
                onClick: () => sort('User')
            }
        ]
    ]

    const leaguematePlayers_body = playersCount
        .map(player => {
            const lm_wins = player.leagues_lm.reduce((acc, cur) => acc + cur.wins, 0)
            const lm_losses = player.leagues_lm.reduce((acc, cur) => acc + cur.losses, 0)
            const lm_ties = player.leagues_lm.reduce((acc, cur) => acc + cur.lmRoster?.settings.ties, 0)
            const user_wins = player.leagues_user.reduce((acc, cur) => acc + cur.wins, 0)
            const user_losses = player.leagues_user.reduce((acc, cur) => acc + cur.losses, 0)
            const user_ties = player.leagues_user.reduce((acc, cur) => acc + cur.lmRoster?.settings.ties, 0)
            return {
                id: player.id,
                search: {
                    text: stateAllPlayers[player.id]?.full_name,
                    image: {
                        src: player.id,
                        alt: 'player headshot',
                        type: 'player'
                    }
                },
                list: [[
                    {
                        text: stateAllPlayers[player.id]?.full_name,
                        colSpan: 4,
                        className: 'left',
                        image: {
                            src: player.id,
                            alt: 'player headshot',
                            type: 'player'
                        }
                    },
                    {
                        text: stateAllPlayers[player.id] && player.leagues_lm.length || '0',
                        colSpan: 1
                    },
                    {
                        text: stateAllPlayers[player.id] && (lm_wins + '-' + lm_losses + (lm_ties > 0 ? `-${lm_ties}` : '')),
                        colSpan: 3
                    },
                    {
                        text: stateAllPlayers[player.id] && player.leagues_user.length || '0',
                        colSpan: 1
                    },
                    {
                        text: stateAllPlayers[player.id] && (user_wins + '-' + user_losses + (user_ties > 0 ? `-${user_ties}` : '')),
                        colSpan: 3
                    }
                ]],
                secondary_table: (
                    <LeaguematePlayersLeagues
                        state_user={state_user}
                        leagues_lm={player.leagues_lm}
                        leagues_user={player.leagues_user}
                        leaguemate={leaguemate}
                    />
                )

            }
        })


    return <>
        <div className="secondary nav">
            <div>
                <button
                    className={secondaryContent === 'Leagues' ? 'active click' : 'click'}
                    onClick={() => setSecondaryContent('Leagues')}
                >
                    Leagues
                </button>
                <button
                    className={secondaryContent === 'Players' ? 'active click' : 'click'}
                    onClick={() => setSecondaryContent('Players')}
                >
                    Players
                </button>
            </div>
        </div>
        <TableMain
            id={'Players'}
            type={'secondary'}
            headers={secondaryContent === 'Leagues' ? leaguemateLeagues_headers : leaguematePlayers_headers}
            body={secondaryContent === 'Leagues' ? leaguemateLeagues_body : leaguematePlayers_body}
            page={page}
            setPage={setPage}
            itemActive={itemActive}
            setItemActive={setItemActive}
            search={secondaryContent === 'Players' ? true : false}
            searched={searched}
            setSearched={setSearched}
        />
    </>
}


export default memo(LeaguemateLeagues, (prevLm, nextLm) => {
    return prevLm.leaguemate.user_id === nextLm.leaguemate.user_id
});
