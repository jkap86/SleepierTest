import TableMain from "../Home/tableMain";
import { useState } from "react";
import LeaguemateLeagues from './leaguemateLeagues'

const Leaguemates = ({
    stateAllPlayers,
    state_user,
    stateLeaguemates
}) => {
    const [itemActive, setItemActive] = useState('');
    const [page, setPage] = useState(1)
    const [searched, setSearched] = useState('')

    const leaguemates_headers = [
        [
            {
                text: 'Leaguemate',
                colSpan: 3,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: '#',
                colSpan: 1,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: 'Leaguemate',
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
                text: 'Fpts',
                colSpan: 2,
                className: 'half'
            },
            {
                text: 'Record',
                colSpan: 2,
                className: 'half'
            },
            {
                text: 'Fpts',
                colSpan: 2,
                className: 'half'
            }

        ]
    ]

    const leaguemates_body = stateLeaguemates
        .filter(x => x.username !== state_user.username)
        .sort((a, b) => b.leagues.length - a.leagues.length)
        .map(lm => {
            return {
                id: lm.user_id,
                search: {
                    text: lm.username,
                    image: {
                        src: lm.avatar,
                        alt: 'user avatar',
                        type: 'user'
                    }
                },
                list: [[
                    {
                        text: lm.username,
                        colSpan: 3,
                        className: 'left',
                        image: {
                            src: lm.avatar,
                            alt: lm.username,
                            type: 'user'
                        }
                    },
                    {
                        text: lm.leagues.length,
                        colSpan: 1
                    },
                    {
                        text: (
                            lm.leagues.reduce((acc, cur) => acc + cur.lmRoster.settings?.wins, 0) +
                            "-" +
                            lm.leagues.reduce((acc, cur) => acc + cur.lmRoster.settings?.losses, 0) +
                            (
                                lm.leagues.reduce((acc, cur) => acc + cur.lmRoster.settings.ties, 0) > 0 ?
                                    `-${lm.leagues.reduce((acc, cur) => acc + cur.lmRoster.settings.ties, 0)}` :
                                    ''
                            )
                        ),
                        colSpan: 2,
                        className: "red"
                    },
                    {
                        text: lm.leagues.reduce(
                            (acc, cur) =>
                                acc +
                                parseFloat(
                                    cur.lmRoster.settings?.fpts +
                                    '.' +
                                    cur.lmRoster.settings?.fpts_decimal
                                )
                            , 0).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }),
                        colSpan: 2,
                        className: "red"
                    },
                    {
                        text: (
                            lm.leagues.reduce((acc, cur) => acc + cur.userRoster.settings?.wins, 0) +
                            "-" +
                            lm.leagues.reduce((acc, cur) => acc + cur.userRoster.settings?.losses, 0) +
                            (
                                lm.leagues.reduce((acc, cur) => acc + cur.userRoster.settings?.ties, 0) > 0 ?
                                    `${lm.leagues.reduce((acc, cur) => acc + cur.userRoster.settings?.ties, 0)}` :
                                    ''
                            )
                        ),
                        colSpan: 2,
                        className: "green"
                    },
                    {
                        text: lm.leagues.reduce(
                            (acc, cur) =>
                                acc +
                                parseFloat(
                                    cur.userRoster.settings?.fpts +
                                    '.' +
                                    cur.userRoster.settings?.fpts_decimal
                                )
                            , 0).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }),
                        colSpan: 2,
                        className: "green"
                    }
                ]],
                secondary_table: (
                    <LeaguemateLeagues
                        stateAllPlayers={stateAllPlayers}
                        state_user={state_user}
                        leaguemate={lm}
                    />
                )
            }
        })

    return <>
        <TableMain
            id={'Leaguemates'}
            type={'main'}
            headers={leaguemates_headers}
            body={leaguemates_body}
            page={page}
            setPage={setPage}
            itemActive={itemActive}
            setItemActive={setItemActive}
            search={true}
            searched={searched}
            setSearched={setSearched}
        />
    </>
}

export default Leaguemates;