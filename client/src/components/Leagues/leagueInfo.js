import { useState } from "react";
import TableMain from "../Home/tableMain";
import { days, default_scoring_settings } from '../Functions/misc';
import { Link } from 'react-router-dom';

const LeagueInfo = ({
    stateAllPlayers,
    state_user,
    league
}) => {
    const [itemActive, setItemActive] = useState(league.userRoster.roster_id);
    const [secondaryContent, setSecondaryContent] = useState('Lineup')

    const active_roster = league.rosters.find(x => x.roster_id === itemActive)

    const standings_headers = [
        [
            {
                text: 'Manager',
                colSpan: 5,
            },
            {
                text: 'Record',
                colSpan: 2,
            },
            {
                text: 'FP',
                colSpan: 3
            }
        ]
    ]

    const standings_body = league.rosters
        .sort((a, b) => b.settings.wins - a.settings.wins || b.settings.fpts - a.settings.fpts)
        .map((team, index) => {
            return {
                id: team.roster_id,
                list: [
                    [
                        {
                            text: league.users.find(x => x.user_id === team.owner_id)?.username || 'Orphan',
                            colSpan: 5,
                            className: 'left',
                            image: {
                                src: league.users.find(x => x.user_id === team.owner_id)?.avatar,
                                alt: 'user avatar',
                                type: 'user'
                            }
                        },
                        {
                            text: team.settings.wins + '-' + team.settings.losses + (team.settings.ties > 0 ? '-' + team.settings.ties : ''),
                            colSpan: 2
                        },
                        {
                            text: (
                                parseFloat(team.settings.fpts + '.' + (team.settings.fpts_decimal || '00'))
                            ).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }),
                            colSpan: 3
                        }
                    ]
                ]
            }
        })

    const leagueInfo_headers = [
        [
            {
                text: 'Slot',
                colSpan: 3,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: 'Player',
                colSpan: 10,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: 'Age',
                colSpan: 3,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: 'Draft',
                colSpan: 6,
                className: 'half'
            }
        ],
        [
            {
                text: 'Yr',
                colSpan: 3,
                className: 'half'
            },
            {
                text: 'Pick',
                colSpan: 3,
                className: 'half'
            }
        ]
    ]

    const position_abbrev = {
        'QB': 'QB',
        'RB': 'RB',
        'WR': 'WR',
        'TE': 'TE',
        'SUPER_FLEX': 'SF',
        'FLEX': 'WRT',
        'WRRB_FLEX': 'W R',
        'WRRB_WRT': 'W R',
        'REC_FLEX': 'W T'
    }

    const display = active_roster ?
        secondaryContent === 'Lineup' ? active_roster?.starters
            : secondaryContent === 'QBs' ? active_roster?.players?.filter(x => stateAllPlayers[x]?.position === 'QB')
                : secondaryContent === 'RBs' ? active_roster?.players?.filter(x => stateAllPlayers[x]?.position === 'RB')
                    : secondaryContent === 'WRs' ? active_roster?.players?.filter(x => stateAllPlayers[x]?.position === 'WR')
                        : secondaryContent === 'TEs' ? active_roster?.players?.filter(x => stateAllPlayers[x]?.position === 'TE')
                            : []
        : []

    const leagueInfo_body = active_roster ? [
        ...display.map((starter, index) => {
            return {
                id: starter,
                list: [[
                    {
                        text: secondaryContent === 'Lineup' ? (position_abbrev[league.roster_positions[index]] || '-')
                            : stateAllPlayers[starter]?.position,
                        colSpan: 3
                    },
                    {
                        text: stateAllPlayers[starter]?.full_name || 'Empty',
                        colSpan: 10,
                        className: 'left',
                        image: {
                            src: starter,
                            alt: 'player headshot',
                            type: 'player'
                        }
                    },
                    {
                        text: stateAllPlayers[starter]?.age || '-',
                        colSpan: 3
                    },
                    {
                        text: stateAllPlayers[starter]?.draft_year || '-',
                        colSpan: 3
                    },
                    {
                        text: typeof (stateAllPlayers[starter]?.draft_round) === 'number' ?
                            `${stateAllPlayers[starter]?.draft_round || '-'}.${stateAllPlayers[starter]?.draft_pick.toLocaleString("en-US", { minimumIntegerDigits: 2 }) || null}`
                            : '-',
                        colSpan: 3
                    }
                ]]
            }
        })
    ]
        :
        [
            {
                id: 'Type',
                list: [[
                    {
                        text: league.settings['type'] === 2 ? 'Dynasty'
                            : league.settings['type'] === 1 ? 'Keeper'
                                : 'Redraft',
                        colSpan: 11
                    },
                    {
                        text: league.settings['best_ball'] === 1 ? 'Bestball' : 'Standard',
                        colSpan: 11
                    },
                ]]
            },
            {
                id: 'Trade Deadline',
                list: [[
                    {
                        text: 'Trade Deadline',
                        colSpan: 11
                    },
                    {
                        text: 'Week ' + league.settings['trade_deadline'],
                        colSpan: 11
                    }
                ]]
            },
            {
                id: 'Daily Waivers',
                list: [[
                    {
                        text: 'Waivers',
                        colSpan: 11
                    },
                    {
                        text: `${days[league.settings['waiver_day_of_week']]} 
                                ${league.settings['daily_waivers_hour'] > 12 ? (league.settings['daily_waivers_hour'] - 12) + ' pm' : (league.settings['daily_waivers_hour'] || '12') + 'am'} `,
                        colSpan: 11
                    }
                ]]
            }
        ]

    return <>
        <div className="secondary nav">
            <div>
                <button>
                    <Link to={`/playoffs/${league.league_id}`} target="_blank">
                        Playoffs
                    </Link>
                </button>
                <button className="active">Standings</button>
            </div>
            <div>
                {
                    active_roster ?
                        <>
                            <button
                                className={secondaryContent === 'Lineup' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('Lineup')}
                            >
                                Lineup
                            </button>
                            <button
                                className={secondaryContent === 'QBs' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('QBs')}
                            >
                                QBs
                            </button>
                            <button
                                className={secondaryContent === 'RBs' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('RBs')}
                            >
                                RBs
                            </button>
                            <button
                                className={secondaryContent === 'WRs' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('WRs')}
                            >
                                WRs
                            </button>
                            <button
                                className={secondaryContent === 'TEs' ? 'active click' : 'click'}
                                onClick={() => setSecondaryContent('TEs')}
                            >
                                TEs
                            </button>
                        </>
                        :
                        <button className="active">
                            Settings
                        </button>
                }
            </div>
        </div>
        <TableMain
            type={'secondary subs'}
            headers={standings_headers}
            body={standings_body}
            itemActive={itemActive}
            setItemActive={setItemActive}
        />
        <TableMain
            type={'secondary lineup'}
            headers={leagueInfo_headers}
            body={leagueInfo_body}
        />
    </>
}

export default LeagueInfo;