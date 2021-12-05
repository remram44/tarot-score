import React from 'react';
import {Link, Redirect} from 'react-router-dom';
import {Database, Game, Player, Round} from './db';
import {totalScores} from './rules';
import {RoundView} from './RoundView';

interface GameViewProps {
  id: string,
  database: Database,
}

interface GameInfo {
  game: Game,
  players: Player[],
  playersById: Map<number, Player>,
  scores: Map<number, number>,
  rounds: Round[],
}

interface GameViewState {
  gameInfo: GameInfo | undefined | null,
  removed: boolean,
}

export class GameView extends React.PureComponent<GameViewProps, GameViewState> {
  constructor(props: GameViewProps) {
    super(props);
    this.state = {
      gameInfo: undefined,
      removed: false,
    };
  }

  componentDidMount() {
    // Get game
    let id = parseInt(this.props.id, 10);
    if(isNaN(id)) {
      this.setState({gameInfo: null});
    } else {
      (async () => {
        const info = await this.props.database.getGame(id);
        if(info === null) {
          this.setState({gameInfo: null});
        } else {
          const {game, players, rounds} = info;

          const playersById = new Map();
          players.forEach((player) => playersById.set(player.id, player));

          // Compute total scores
          const scores = totalScores(players, rounds);

          this.setState({
            gameInfo: {
              game,
              players,
              playersById,
              rounds,
              scores,
            },
          });
        }
      })();
    }
  }

  rename() {
    const {gameInfo} = this.state;
    if(!gameInfo) {
      return;
    } else {
      const {game} = gameInfo;
      const newName = window.prompt("New name", game.name);
      if(newName && newName !== game.name) {
        (async () => {
          await this.props.database.renameGame(game.id, newName);
          this.setState({
            gameInfo: {
              ...gameInfo,
              game: {...game, name: newName},
            },
          });
        })();
      }
    }
  }

  remove() {
    const {gameInfo} = this.state;
    if(!gameInfo) {
      return;
    } else {
      const {game} = gameInfo;
      const confirmed = window.confirm("Are you sure you want to delete?");
      if(confirmed) {
        (async () => {
          await this.props.database.removeGame(game.id);
          this.setState({
            removed: true,
          });
        })();
      }
    }
  }

  render() {
    const {gameInfo, removed} = this.state;
    if(removed) {
      return <Redirect to="/" />;
    } else if(gameInfo === undefined) {
      return <p>Loading...</p>;
    } else if(gameInfo === null) {
      return <p>No such game</p>;
    } else {
      return (
        <>
          <p><Link to="/">Back to games</Link></p>
          <h1>
            {gameInfo.game.name}{' '}
            <button onClick={() => this.rename()}>(edit)</button>{' '}
            <button onClick={() => this.remove()}>(delete)</button>
          </h1>
          <table className="scores">
            <thead>
              <tr>
                <td className="corner"></td>
                {gameInfo.players.map((player) => (
                  <th key={player.id}>{player.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gameInfo.rounds.map((round) => (
                <tr key={round.id}><RoundView game={gameInfo.game} players={gameInfo.players} playersById={gameInfo.playersById} round={round} /></tr>
              ))}
              <tr key="total">
                <td key="header">TOTAL</td>
                {gameInfo.players.map((player) => (
                  <th key={player.id}>{gameInfo.scores.get(player.id)}</th>
                ))}
              </tr>
            </tbody>
          </table>
        </>
      );
    }
  }
}
