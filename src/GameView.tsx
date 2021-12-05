import React from 'react';
import {Link, Redirect} from 'react-router-dom';
import {Database, Game, Player, Round} from './db';
import {totalScores} from './rules';
import {RoundEdit} from './RoundEdit';
import {RoundView} from './RoundView';

interface GameViewProps {
  id: string,
  database: Database,
}

interface GameInfo {
  game: Game,
  players: Player[],
  playersById: Map<number, Player>,
  rounds: Round[],
  roundsById: Map<number, Round>,
  scores: Map<number, number>,
  editing: number | undefined,
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

          const roundsById = new Map();
          rounds.forEach((round) => roundsById.set(round.id, round));

          // Compute total scores
          const scores = totalScores(players, rounds);

          this.setState({
            gameInfo: {
              game,
              players,
              playersById,
              rounds,
              roundsById,
              scores,
              editing: undefined,
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

  editRound(roundId: number) {
    this.setState((oldState) => {
      const {gameInfo} = oldState;
      if(gameInfo) {
        return {gameInfo: {...gameInfo, editing: roundId}};
      } else {
        return {gameInfo};
      }
    });
  }

  async changeRound(round: Round): Promise<void> {
    round.id = await this.props.database.setRound(round);
    this.setState((oldState) => {
      const {gameInfo} = oldState;
      if(gameInfo) {
        let roundIndex = undefined;
        gameInfo.rounds.forEach((otherRound, index) => {
          if(otherRound.id === round.id) {
            roundIndex = index;
          }
        });
        let rounds;
        if(roundIndex === undefined) {
          rounds = gameInfo.rounds.concat([round]);
        } else {
          rounds = gameInfo.rounds.slice(0, roundIndex).concat(
            [round],
            gameInfo.rounds.slice(roundIndex + 1),
          );
        }
        return {gameInfo: {...gameInfo, rounds, editing: undefined}};
      } else {
        return {gameInfo};
      }
    });
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
                <tr key={round.id}>
                  <RoundView
                    game={gameInfo.game}
                    players={gameInfo.players}
                    playersById={gameInfo.playersById}
                    round={round}
                    editRound={this.editRound.bind(this)}
                  />
                </tr>
              ))}
              <tr key="total">
                <td key="header">TOTAL</td>
                {gameInfo.players.map((player) => (
                  <th key={player.id}>{gameInfo.scores.get(player.id)}</th>
                ))}
              </tr>
            </tbody>
          </table>
          {(gameInfo.editing !== undefined)?
          <RoundEdit key={gameInfo.editing} round={gameInfo.roundsById.get(gameInfo.editing)!} players={gameInfo.players} changeRound={this.changeRound.bind(this)} />
            :undefined}
        </>
      );
    }
  }
}
