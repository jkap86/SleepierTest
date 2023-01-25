import TableMain from "../Home/tableMain";
import { useState } from "react";

const PlayerLeagues = ({ leagues_owned, leagues_taken, leagues_available }) => {
    const [tab, setTab] = useState('Owned');

    const player_leagues_headers = [
        [
            {
                text: 'League',
                colSpan: 3,
                rowSpan: 2,
                className: 'half'
            },
            {
                text: 'Rank',
                colSpan: 2,
                className: 'half'
            },
            tab === 'Taken' ?
                {
                    text: 'Manager',
                    colSpan: 2,
                    rowSpan: 2,
                    className: 'half'
                }
                :
                null
        ],
        [
            {
                text: 'OVR',
                colSpan: 1,
                className: 'half'
            },
            {
                text: 'PF',
                colSpan: 1,
                className: 'half'
            }
        ]
    ]

    const leagues_display = tab === 'Owned' ? leagues_owned :
        tab === 'Taken' ? leagues_taken :
            tab === 'Available' ? leagues_available :
                null

    const player_leagues_body = leagues_display.map(lo => {
        return {
            id: lo.league_id,
            list: [[
                {
                    text: lo.name,
                    colSpan: 3,
                    className: 'left',
                    image: {
                        src: lo.avatar,
                        alt: lo.name,
                        type: 'league'
                    }
                },
                {
                    text: lo.userRoster.rank,
                    colSpan: 1,
                    className: lo.userRoster.rank / lo.rosters.length <= .25 ? 'green' :
                        lo.userRoster.rank / lo.rosters.length >= .75 ? 'red' :
                            null
                },
                {
                    text: lo.userRoster.rank_points,
                    colSpan: 1,
                    className: lo.userRoster.rank_points / lo.rosters.length <= .25 ? 'green' :
                        lo.userRoster.rank_points / lo.rosters.length >= .75 ? 'red' :
                            null
                },
                tab === 'Taken' ?
                    {
                        text: lo.manager?.username,
                        colSpan: 2,
                        className: 'left end',
                        image: {
                            src: lo.manager?.avatar,
                            alt: lo.manager?.username,
                            type: 'user'
                        }
                    }
                    :
                    {
                        colSpan: 0
                    }
            ]]
        }
    })

    return <>
        <div className="secondary nav">
            <button
                className={tab === 'Owned' ? 'active click' : 'click'}
                onClick={() => setTab('Owned')}
            >
                Owned
            </button>
            <button
                className={tab === 'Taken' ? 'active click' : 'click'}
                onClick={() => setTab('Taken')}
            >
                Taken
            </button>
            <button
                className={tab === 'Available' ? 'active click' : 'click'}
                onClick={() => setTab('Available')}
            >
                Available
            </button>
        </div>
        <TableMain
            type={'secondary'}
            headers={player_leagues_headers}
            body={player_leagues_body}
        />
    </>
}

export default PlayerLeagues;