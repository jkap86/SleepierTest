import { useEffect, useState } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import TableMain from "../Home/tableMain";
import Search from "../Home/search";

const Trades = ({
    stateState,
    stateAllPlayers,
    state_user,
}) => {
    const params = useParams();
    const [stateTrades, setStateTrades] = useState({})
    const [stateTradesFiltered, setStateTradesFiltered] = useState([])
    const [page, setPage] = useState(1)
    const [itemActive, setItemActive] = useState('');
    const [searched_player, setSearched_Player] = useState('')
    const [searched_manager, setSearched_Manager] = useState('')
    const [searched_league, setSearched_League] = useState('')

    const fetchTrades = async () => {
        let trades;
        let p = 0;
        while (p === 0 || p * 1000 < trades?.data?.count) {
            trades = await axios.get('/trades', {
                params: {
                    season: params.season,
                    page: p
                }
            })
            console.log(trades.data)
            setStateTrades(prevState => p === 0 ? trades.data : {
                count: trades.data.count,
                trades: [...prevState.trades || [], ...trades.data.trades]
            })
            p += 1
        }
    }


    useEffect(() => {
        const filterTrades = () => {
            let trades = stateTrades.trades || []
            let trades_filtered1;
            let trades_filtered2;
            let trades_filtered3;
            if (searched_player === '') {
                trades_filtered1 = trades
            } else {
                trades_filtered1 = trades.filter(t => Object.keys(t.adds || {}).includes(searched_player.id))
            }
            console.log({ searched_manager: searched_manager })

            if (searched_manager === '') {
                trades_filtered2 = trades_filtered1
            } else {
                trades_filtered2 = trades_filtered1.filter(t => t.managers.find(m => m.user_id === searched_manager.id))
            }

            setStateTradesFiltered([...trades_filtered2])
        }

        filterTrades()
    }, [stateTrades, searched_player, searched_manager])

    useEffect(() => {


        fetchTrades()

    }, [])


    const trades_headers = [
        [
            {
                text: 'Date',
                colSpan: 2
            },
            {
                text: 'League',
                colSpan: 6
            }
        ]
    ]

    const trades_body = stateTradesFiltered
        .sort((a, b) => new Date(b.status_updated) - new Date(a.status_updated))
        .map(trade => {
            return {
                id: trade.transaction_id,
                list: [
                    [
                        {
                            text: new Date(trade.status_updated).toLocaleDateString('en-US') + ' ' + new Date(trade.status_updated).toLocaleTimeString('en-US', { hour: "2-digit", minute: "2-digit" }),
                            colSpan: 2,
                            className: 'small'
                        },
                        {
                            text: trade.league.name,
                            colSpan: 6,

                            image: {
                                src: trade.league.avatar,
                                alt: 'league avatar',
                                type: 'league'
                            }
                        },
                    ],
                    ...trade.managers.map(m => {
                        return [

                            {
                                text: m?.username || 'Orphan',
                                colSpan: 2,
                                className: 'left',
                                image: {
                                    src: m?.avatar,
                                    alt: 'user avatar',
                                    type: 'user'
                                }
                            },
                            {
                                text: <ol>
                                    {
                                        Object.keys(trade.adds || {}).filter(a => trade.adds[a] === m?.roster_id).map(player_id =>
                                            <li>+ {stateAllPlayers[player_id]?.full_name}</li>
                                        )
                                    }
                                    {
                                        trade.draft_picks
                                            .filter(p => p.owner_id === m?.roster_id)
                                            .sort((a, b) => (a.season) - b.season || a.round - b.round)
                                            .map(pick =>
                                                <li>
                                                    {
                                                        `+ ${pick.season} Round ${pick.round} (${pick.original_user?.username || 'Orphan'})`
                                                    }
                                                </li>
                                            )
                                    }
                                </ol>,
                                colSpan: 3,
                                className: 'small left'
                            },
                            {
                                text: <ol>
                                    {
                                        Object.keys(trade.drops || {}).filter(d => trade.drops[d] === m?.roster_id).map(player_id =>
                                            <li>- {stateAllPlayers[player_id]?.full_name}</li>
                                        )
                                    }
                                    {
                                        trade.draft_picks
                                            .filter(p => p.previous_owner_id === m?.roster_id)
                                            .sort((a, b) => (a.season) - b.season || a.round - b.round)
                                            .map(pick =>
                                                <li className="end">
                                                    <span>- {pick.season} Round {pick.round} {pick.original_user?.username || 'Orphan'}</span>
                                                </li>
                                            )
                                    }
                                </ol>,
                                colSpan: 3,
                                className: 'small left'
                            }
                        ]
                    })
                ]
            }
        })

    const players_list = Array.from(
        new Set(
            stateTradesFiltered.map(trade => Object.keys(trade.adds || {})).flat()
        )
    ).map(player_id => {
        return {
            id: player_id,
            text: stateAllPlayers[player_id]?.full_name
        }
    })

    let managers_dict = {}

    stateTradesFiltered.map(trade => {
        return trade.managers.map(manager => {
            return managers_dict[manager?.user_id] = manager?.username
        })
    })

    let managers_list = Object.keys(managers_dict).map(user_id => {
        return {
            id: user_id,
            text: managers_dict[user_id]
        }
    })


    return <>
        <h4>{stateTrades.trades?.length} out of {stateTrades.count} Trades</h4>
        <div className="search_wrapper">
            <Search
                id={'By Player'}
                sendSearched={(data) => setSearched_Player(data)}
                placeholder={`Search By Player`}
                list={players_list}
            />
            <Search
                id={'By Manager'}
                sendSearched={(data) => setSearched_Manager(data)}
                placeholder={`Search By Manager`}
                list={managers_list}
            />
        </div>
        <TableMain
            id={'trades'}
            type={'main'}
            headers={trades_headers}
            body={trades_body}
            page={page}
            setPage={setPage}
            itemActive={itemActive}
            setItemActive={setItemActive}
        />
    </>
}

export default Trades;