import React, { useEffect, useState } from "react";
import { Link, useNavigate, redirect, useParams } from "react-router-dom";
import { loadingIcon } from '../Functions/misc';
import { filterLeagues } from '../Functions/filterData';
import Heading from "./heading";
import Leagues from '../Leagues/leagues';
import Lineups from '../Lineups/lineups';
import Players from '../Players/players';
import Leaguemates from '../Leaguemates/leaguemates';
const Trades = React.lazy(() => import('../Trades/trades'))

const View = ({
    stateState,
    stateAllPlayers,
    state_user,
    stateLeagues,
    stateLeaguemates,
    statePlayerShares,
    stateMatchups
}) => {
    const params = useParams();
    const navigate = useNavigate();
    const [stateLeaguesFiltered, setStateLeaguesFiltered] = useState([]);
    const [statePlayerSharesFiltered, setStatePlayerSharesFiltered] = useState([]);
    const [stateLeaguematesFiltered, setStateLeaguematesFiltered] = useState([]);
    const [stateMatchupsFiltered, setStateMatchupsFiltered] = useState([]);
    const [tab, setTab] = useState('Summary');
    const [type1, setType1] = useState('All');
    const [type2, setType2] = useState('All');
    const [lineupsTab, setLineupsTab] = useState('Weekly Rankings');
    const [week, setWeek] = useState(0);

    useEffect(() => {
        const filtered_data = filterLeagues(stateLeagues, type1, type2, stateLeaguemates, statePlayerShares, stateMatchups)

        const week = params.season === stateState.league_season ?
            Math.min(stateState.week, 18) : params.season > stateState.league_season ?
                1 : 18

        setWeek(week)
        setStateLeaguesFiltered([...filtered_data.leagues])
        setStatePlayerSharesFiltered([...filtered_data.playershares])
        setStateLeaguematesFiltered([...filtered_data.leaguemates])
        setStateMatchupsFiltered([...filtered_data.matchups])


    }, [state_user, stateLeagues, type1, type2, stateLeaguemates, statePlayerShares, stateMatchups])

    let display;


    switch (tab) {
        case 'Lineups':
            display = <Lineups
                stateState={stateState}
                stateAllPlayers={stateAllPlayers}
                state_user={state_user}
                stateMatchups={stateMatchupsFiltered}
                syncLeague={console.log}
                tab={lineupsTab}
                setTab={setLineupsTab}
                week={week}
                setWeek={setWeek}
            />
            break;
        case 'Leagues':
            display = <Leagues
                stateAllPlayers={stateAllPlayers}
                state_user={state_user}
                stateLeagues={stateLeaguesFiltered}
            />
            break;
        case 'Players':
            display = <Players
                stateAllPlayers={stateAllPlayers}
                state_user={state_user}
                statePlayerShares={statePlayerSharesFiltered}
                leagues_count={stateLeaguesFiltered.length}
            />
            break;
        case 'Leaguemates':
            display = <Leaguemates
                stateAllPlayers={stateAllPlayers}
                state_user={state_user}
                stateLeaguemates={stateLeaguematesFiltered}
            />
            break;
        default:
            display = null
            break;
    }

    return <>
        <Link to="/" className="home">
            Home
        </Link>
        <select
            className="view click"
            defaultValue={params.season}
            onChange={(e) => navigate(`/${params.username}/${e.target.value}`)}
        >
            {
                stateState.seasons?.sort((a, b) => b - a)?.map(option =>
                    <option key={option}>
                        {option}
                    </option>
                )
            }
        </select>
        <Heading
            state_user={state_user}
            stateLeaguesFiltered={stateLeaguesFiltered}
            tab={tab}
            setTab={setTab}
            type1={type1}
            setType1={setType1}
            type2={type2}
            setType2={setType2}
        />
        {display}

        <React.Suspense fallback={loadingIcon}>
            <div hidden={tab !== 'Trades'}>
                <Trades
                    stateState={stateState}
                    stateAllPlayers={stateAllPlayers}
                    state_user={state_user}
                />
            </div>
        </React.Suspense>
    </>
}

export default View;