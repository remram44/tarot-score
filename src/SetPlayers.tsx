import React from 'react';
import {Redirect} from 'react-router-dom';
import {Database, Game, Player, Round} from './db';

interface SetPlayersProps {
  database: Database,
  id: string,
}

interface Info {
  game: Game,
  players: Player[],
  rounds: Round[],
}

interface SetPlayersState {
  info: Info | undefined | null,
  // We give player name IDs to keep focus
  playerNames: [number, string][],
  playerIdGen: number,
  ready: boolean,
}

export class SetPlayers extends React.PureComponent<SetPlayersProps, SetPlayersState> {
  constructor(props: SetPlayersProps) {
    super(props);
    this.state = {
      info: undefined,
      playerNames: [],
      playerIdGen: 0,
      ready: false,
    };
  }

  componentDidMount() {
    // Get game
    let id = parseInt(this.props.id, 10);
    if(isNaN(id)) {
      this.setState({info: null});
    } else {
      (async() => {
        const info = await this.props.database.getGame(id);
        if(info === null) {
          this.setState({info: null});
        } else {
          this.setState({info});
        }
      })();
    }
  }

  changed(index: number | null, value: string) {
    if(index === null) {
      this.setState((oldState) => {
        return {
          playerNames: [
            ...oldState.playerNames,
            [oldState.playerIdGen, value],
          ],
          playerIdGen: oldState.playerIdGen + 1,
        };
      });
    } else {
      this.setState((oldState) => {
        const playerNames = oldState.playerNames.slice(0, index).concat(
          [[oldState.playerNames[index][0], value]],
          oldState.playerNames.slice(index + 1),
        );
        return {playerNames};
      });
    }
  }

  blurred(index: number, value: string) {
    if(value.length === 0) {
      this.setState((oldState) => {
        const playerNames = oldState.playerNames.slice(0, index).concat(
          oldState.playerNames.slice(index + 1)
        );
        return {playerNames};
      });
    }
  }

  async commit() {
    const {info} = this.state;
    if(info) {
      await this.props.database.setPlayers(info.game.id, this.state.playerNames.map((p) => p[1]));
      this.setState({ready: true});
    }
  }

  render() {
    const {info, playerNames, playerIdGen, ready} = this.state;
    if(info === undefined) {
      return <p>Loading...</p>;
    } else if(info === null) {
      return <p>No such game</p>;
    } else if(ready || info.rounds.length > 0 || info.players.length > 0) {
      // Game is already setup, go to game view
      return <Redirect to={`/${info.game.id}`} />;
    } else {
      const players = [];
      playerNames.forEach(([id, player], index) => {
        players.push(<tr key={id}><td>index={index} id={id}</td><td><input type="text" value={player} onChange={(event) => this.changed(index, event.target.value)} onBlur={(event) => this.blurred(index, event.target.value)} /></td></tr>);
      });
      if(playerNames.length < 5) {
        players.push(<tr key={playerIdGen}><td>(new)</td><td><input type="text" value="" onChange={(event) => this.changed(null, event.target.value)} /></td></tr>);
      }
      return (
        <>
          <h1>Set player names</h1>
          <table className="players">
            <tbody>
              {players}
            </tbody>
          </table>
          <button onClick={() => this.commit()} disabled={playerNames.length < 3}>Play!</button>
        </>
      );
    }
  }
}
