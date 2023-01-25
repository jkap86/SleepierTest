import TableMain from "../Home/tableMain";
import { useState, useEffect } from "react";
import tumbleweedgif from '../../images/tumbleweed.gif';


const Lineup = ({ matchup, opponent, starting_slots, league, optimal_lineup, stateAllPlayers, state_user, lineup_check, syncLeague, players_points }) => {
    const [itemActive, setItemActive] = useState(null);
    const [syncing, setSyncing] = useState(false)
    const [secondaryContent, setSecondaryContent] = useState('Optimal')

    const active_player = lineup_check?.find(x => `${x.slot}_${x.index}` === itemActive)?.current_player

    useEffect(() => {
        if (itemActive) {
            setSecondaryContent('Options')
        }
    }, [itemActive])

    const handleSync = (league_id, user_id) => {
        setSyncing(true)
        syncLeague(league_id, user_id)
        setTimeout(() => {
            setSyncing(false)
        }, 1000)
    }

    const lineup_headers = [
        [
            {
                text: (starting_slots || [])
                    .map((slot, index) => {
                        const starter = matchup?.starters ? matchup.starters[index] : 'Empty'
                        return players_points[starter] || 0
                    })
                    .reduce((acc, cur) => acc + cur, 0)
                    .toLocaleString("en-US", { minimumFractionDigits: 2 })
                ,
                colSpan: 23,
                className: 'half'
            }
        ],
        [
            {
                text: 'Slot',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Player',
                colSpan: 10,
                className: 'half'
            },
            {
                text: 'Opp',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Rank',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Points',
                colSpan: 4,
                className: 'half'
            }
        ]
    ]

    const lineup_body = lineup_check?.map((slot, index) => {
        const color = (
            !optimal_lineup.find(x => x.player === slot.current_player) ? 'red'
                : slot.earlyInFlex || slot.lateNotInFlex ? 'yellow'
                    : ''
        )
        return {
            id: slot.slot_index,
            list: !matchup ? [] : [
                {
                    text: lineup_check.find(x => x.current_player === slot.current_player)?.slot,
                    colSpan: 3,
                    className: color
                },
                {
                    text: stateAllPlayers[slot.current_player]?.full_name || 'Empty',
                    colSpan: 10,
                    className: color + " left",
                    image: {
                        src: slot.current_player,
                        alt: stateAllPlayers[slot.current_player]?.full_name,
                        type: 'player'
                    }
                },
                {
                    text: stateAllPlayers[slot.current_player]?.player_opponent
                        ?.replace('at', '@')
                        ?.replace('vs.', '')
                        ?.replace(/\s/g, '')
                        ?.trim()
                        ||
                        '-',
                    colSpan: 3,
                    className: color
                },
                {
                    text: stateAllPlayers[slot.current_player]?.rank_ecr || '-',
                    colSpan: 3,
                    className: color
                },
                {
                    text: players_points[slot.current_player]?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || '-',
                    colSpan: 4,
                    className: color
                }
            ]
        }
    })

    const subs_headers = [
        [
            {
                text: (
                    secondaryContent === 'Options' ?
                        lineup_check.find(x => `${x.slot}_${x.index}` === itemActive)?.slot_options
                        : secondaryContent === 'Optimal' ?
                            optimal_lineup?.map(x => x.player) || []
                            : opponent?.matchup?.starters
                )?.map((player, index) => {
                    return players_points[player] || parseFloat(0)
                })
                    .reduce((acc, cur) => acc + cur, 0)
                    .toLocaleString("en-US", { minimumFractionDigits: 2 }
                    ) || 0.00,
                colSpan: 23,
                className: 'half'
            }
        ],
        [
            {
                text: 'Slot',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Player',
                colSpan: 10,
                className: 'half'
            },
            {
                text: 'Opp',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Rank',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Points',
                colSpan: 4,
                className: 'half'
            }
        ]
    ]

    const subs_body = itemActive && secondaryContent === 'Options' ?
        [

            {
                id: 'warning',
                list: [
                    {
                        text: lineup_check.find(x => x.slot_index === itemActive)?.current_player === '0' ? 'Empty Slot' :
                            lineup_check.find(x => x.slot_index === itemActive)?.notInOptimal ? 'Move Out Of Lineup' :
                                lineup_check.find(x => x.slot_index === itemActive)?.earlyInFlex ? 'Move Out Of Flex' :
                                    lineup_check.find(x => x.slot_index === itemActive)?.lateNotInFlex ? 'Move Into Flex'
                                        : '√',
                        colSpan: 23,
                        className: lineup_check.find(x => x.slot_index === itemActive)?.notInOptimal ? 'red'
                            : lineup_check.find(x => x.slot_index === itemActive)?.earlyInFlex || lineup_check.find(x => x.slot_index === itemActive)?.lateNotInFlex ? 'yellow'
                                : 'green'
                    }
                ]

            },

            ...lineup_check.find(x => x.slot_index === itemActive)?.slot_options
                ?.sort((a, b) => stateAllPlayers[a]?.rank_ecr - stateAllPlayers[b]?.rank_ecr)
                ?.map((so, index) => {
                    const color = optimal_lineup.find(x => x.player === so) ? 'green' :
                        stateAllPlayers[so]?.rank_ecr < stateAllPlayers[active_player]?.rank_ecr ? 'yellow' : ''
                    return {
                        id: so,
                        list: [
                            {
                                text: 'BN',
                                colSpan: 3,
                                className: color
                            },
                            {
                                text: stateAllPlayers[so]?.full_name || 'Empty',
                                colSpan: 10,
                                className: color + " left",
                                image: {
                                    src: so,
                                    alt: stateAllPlayers[so]?.full_name,
                                    type: 'player'
                                }
                            },
                            {
                                text: stateAllPlayers[so]?.player_opponent
                                    .replace('at', '@')
                                    .replace('vs.', '')
                                    .replace(/\s/g, '')
                                    .trim()
                                    || '-',
                                colSpan: 3,
                                className: color
                            },
                            {
                                text: stateAllPlayers[so]?.rank_ecr,
                                colSpan: 3,
                                className: color
                            },
                            {
                                text: players_points[so].toLocaleString("en-US", { minimumFractionDigits: 2 }),
                                colSpan: 4,
                                className: color
                            }
                        ]
                    }
                })
        ]
        : secondaryContent === 'Opponent' ?
            opponent?.matchup?.starters?.map((opp_starter, index) => {
                return {
                    id: opp_starter,
                    list: [
                        {
                            text: lineup_check[index]?.slot,
                            colSpan: 3
                        },
                        {
                            text: stateAllPlayers[opp_starter]?.full_name || 'Empty',
                            colSpan: 10,
                            className: 'left',
                            image: {
                                src: opp_starter,
                                alt: stateAllPlayers[opp_starter]?.full_name,
                                type: 'player'
                            }
                        },
                        {
                            text: stateAllPlayers[opp_starter]?.player_opponent
                                .replace('at', '@')
                                .replace('vs.', '')
                                .replace(/\s/g, '')
                                .trim()
                                ||
                                '-',
                            colSpan: 3,
                        },
                        {
                            text: stateAllPlayers[opp_starter]?.rank_ecr || '-',
                            colSpan: 3
                        },
                        {
                            text: opponent.matchup.players_points[opp_starter]?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || '-',
                            colSpan: 4
                        }
                    ]
                }
            })
            : optimal_lineup?.map((ol, index) => {
                return {
                    id: ol.player,
                    list: [
                        {
                            text: ol.slot,
                            colSpan: 3,
                            className: 'green'
                        },
                        {
                            text: stateAllPlayers[ol.player]?.full_name,
                            colSpan: 10,
                            className: 'left green',
                            image: {
                                src: ol.player,
                                alt: stateAllPlayers[ol.player]?.full_name,
                                type: 'player'
                            }
                        },
                        {
                            text: stateAllPlayers[ol.player]?.player_opponent
                                .replace('at', '@')
                                .replace('vs.', '')
                                .replace(/\s/g, '')
                                .trim(),
                            colSpan: 3,
                            className: 'green'
                        },
                        {
                            text: stateAllPlayers[ol.player]?.rank_ecr,
                            colSpan: 3,
                            className: 'green'
                        },
                        {
                            text: players_points[ol.player]?.toLocaleString("en-US", { minimumFractionDigits: 2 }),
                            colSpan: 4,
                            className: 'green'
                        }
                    ]
                }
            })


    return <>
        <div className="secondary nav">
            <div>
                <button>
                    Lineup
                </button>
            </div>
            <button
                className={`sync ${syncing ? 'rotate' : 'click'}`}
                onClick={syncing ? null : () => handleSync(league.league_id, state_user.user_id)}
            >
                <i className={`fa-solid fa-arrows-rotate ${syncing ? 'rotate' : ''}`}></i>
            </button>
            <div>
                <button
                    className={secondaryContent === 'Optimal' ? 'active click' : 'click'}
                    onClick={() => setSecondaryContent('Optimal')}
                >
                    Optimal
                </button>
                <button
                    className={secondaryContent === 'Options' ? 'active click' : !itemActive ? 'inactive' : 'click'}
                    onClick={itemActive ? () => setSecondaryContent('Options') : null}
                >
                    Options
                </button>
                <button
                    className={secondaryContent === 'Opponent' ? 'active click' : !(opponent?.roster && opponent?.user) ? 'inactive' : 'click'}
                    onClick={opponent?.roster && opponent?.user ? () => setSecondaryContent('Opponent') : null}
                >
                    Opponent
                </button>
            </div>
        </div>
        {
            lineup_body?.length > 0 ?
                <>
                    <TableMain
                        type={'secondary lineup'}
                        headers={lineup_headers}
                        body={lineup_body}
                        itemActive={itemActive}
                        setItemActive={(setItemActive)}
                    />

                    <TableMain
                        type={'secondary subs'}
                        headers={subs_headers}
                        body={subs_body}
                    />
                </>
                :
                <div>
                    <h1>No Matchups</h1>
                    <img src={tumbleweedgif} alt={'tumbleweed gif'} className='gif' />
                </div>
        }
    </>
}

export default Lineup;