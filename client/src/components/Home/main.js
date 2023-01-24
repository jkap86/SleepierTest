import { Link, useNavigate, redirect, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { loadingIcon } from '../Functions/misc';
import View from "./view";
import { getLeagueData } from '../Functions/loadData';

const Main = () => {
    const params = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [seasons_options, setSeasons_options] = useState([params.season]);
    const [stateState, setStateState] = useState({})
    const [stateAllPlayers, setStateAllPlayers] = useState({});
    const [state_user, setState_User] = useState(false);
    const [stateLeagues, setStateLeagues] = useState([]);
    const [stateLeaguemates, setStateLeaguemates] = useState([]);
    const [statePlayerShares, setStatePlayerShares] = useState([]);
    const [stateMatchups, setStateMatchups] = useState([]);


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            let user;
            try {
                user = await axios.get('/user', {
                    params: {
                        username: params.username,
                        season: params.season
                    }
                })
            } catch (error) {
                console.log(error)
            }
            if (!user.data?.user_id) {
                setState_User(user.data)
            } else {
                let allplayers;
                try {
                    allplayers = await axios.get('/allplayers')
                } catch (error) {
                    console.log(error)
                }

                setSeasons_options(user.data.seasons)
                setStateState({
                    ...user.data.state,
                    seasons: user.data.seasons
                })
                setStateAllPlayers(allplayers.data)
                setState_User({
                    username: user.data.username,
                    user_id: user.data.user_id,
                    avatar: user.data.avatar
                })

                const data = getLeagueData(user.data.leagues, user.data.user_id, stateState, params.season)

                setStateLeagues(user.data.leagues)
                setStatePlayerShares(data.players)
                setStateLeaguemates(data.leaguemates)
                setStateMatchups(data.matchups)

            }

            setIsLoading(false)
        }
        fetchData()
    }, [params.username, params.season])

    useEffect(() => {
        const fetchTrades = async () => {
            const trades = await axios.get('/trades', {
                params: {
                    season: params.season
                }
            })
            console.log(trades.data)
        }

        fetchTrades()

    }, [params.season])


    return <>
        {
            isLoading || !state_user ?
                <div className="loading">
                    <h1 className="loading">
                        {isLoading && loadingIcon}
                    </h1>
                </div>
                : !state_user?.user_id ? state_user

                    : <React.Suspense fallback={loadingIcon}>
                        <View
                            stateState={stateState}
                            stateAllPlayers={stateAllPlayers}
                            state_user={state_user}
                            stateLeagues={stateLeagues}
                            stateLeaguemates={stateLeaguemates}
                            statePlayerShares={statePlayerShares}
                            stateMatchups={stateMatchups}
                        />
                    </React.Suspense>

        }
    </>
}

export default Main;