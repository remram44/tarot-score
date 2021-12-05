import React from 'react';
import {Link} from 'react-router-dom';
import {Database, Game, Player, Round} from './db';

interface GameViewProps {
  id: string,
  database: Database,
}

interface GameInfo {
  game: Game,
  players: Player[],
  playersById: Map<number, Player>,
  totalScores: Map<number, number>,
  rounds: Round[],
}

interface GameViewState {
  gameInfo: GameInfo | undefined | null,
}

function roundTarget(round: Round): number {
  if(round.attackOudlers === 1) {
    return 51;
  } else if(round.attackOudlers === 2) {
    return 41;
  } else if(round.attackOudlers === 3) {
    return 36;
  } else {
    return 56;
  }
}

function roundContractMultiplier(round: Round): number {
  if(round.contract === 'garde') {
    return 2;
  } else if(round.contract === 'garde sans') {
    return 4;
  } else if(round.contract === 'garde contre') {
    return 6;
  } else {
    return 1;
  }
}

function roundPlayerMultiplier(playerId: number, players: number, round: Round): number {
  if(players === 5) {
    if(playerId === round.attacker && playerId === round.called) {
      // Attacker who called themselves (1 against 4)
      return 4;
    } else if(playerId === round.attacker) {
      // Attacker who called someone else (2 for them, 1 for callee)
      return 2;
    } else if(playerId === round.called) {
      // Player called (king)
      return 1;
    } else {
      // Defense
      return -1;
    }
  } else {
    if(playerId === round.attacker) {
      // Attacker
      return players - 1;
    } else {
      // Defense
      return -1;
    }
  }
}

export class GameView extends React.PureComponent<GameViewProps, GameViewState> {
  constructor(props: GameViewProps) {
    super(props);
    this.state = {
      gameInfo: undefined,
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
          const totalScores = new Map();
          players.forEach((player) => {
            totalScores.set(player.id, 0);
          });
          rounds.forEach((round) => {
            // Target number of points, depending on oudlers
            const target = roundTarget(round);

            // Attack succeeds if number of points is reached
            const attackSuccessful = round.score >= target;

            // The multiplier depends on the contract chosen by the attack
            let contractMultiplier = roundContractMultiplier(round);

            const score = (25 + Math.abs(round.score - target)) * (attackSuccessful?1:-1) * contractMultiplier;

            players.forEach((player) => {
              const change = score * roundPlayerMultiplier(player.id, players.length, round);
              totalScores.set(
                player.id,
                totalScores.get(player.id) + change,
              );
            });
          });

          this.setState({
            gameInfo: {
              game,
              players,
              playersById,
              rounds,
              totalScores,
            },
          });
        }
      })();
    }
  }

  renderRound(round: Round) {
    const {gameInfo} = this.state;
    if(!gameInfo) {
      return undefined;
    } else {
      const target = roundTarget(round);
      const attackSuccessful = round.score >= target;
      const contractMultiplier = roundContractMultiplier(round);
      const score = (25 + Math.abs(round.score - target)) * (attackSuccessful?1:-1) * contractMultiplier;

      const renderPlayerScore = (playerId: number) => {
        const change = score * roundPlayerMultiplier(playerId, gameInfo.players.length, round);
        return change;
      };

      return (<>
        <td key="round">
          {round.id}: {gameInfo.playersById.get(round.attacker)!.name} {round.contract}, {round.score}, {(round.score >= target)?"win +":"fail -"}{Math.abs(round.score - target)}
        </td>
        {gameInfo.players.map((player) => (
          <td key={player.id}>{renderPlayerScore(player.id)}</td>
        ))}
      </>);
    }
  }

  render() {
    const {gameInfo} = this.state;
    if(gameInfo === undefined) {
      return <p>Loading...</p>;
    } else if(gameInfo === null) {
      return <p>No such game</p>;
    } else {
      return (
        <>
          <p><Link to="/">Back to games</Link></p>
          <h1>{gameInfo.game.name}</h1>
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
                <tr key={round.id}>{this.renderRound(round)}</tr>
              ))}
              <tr key="total">
                <td key="header">TOTAL</td>
                {gameInfo.players.map((player) => (
                  <th key={player.id}>{gameInfo.totalScores.get(player.id)}</th>
                ))}
              </tr>
            </tbody>
          </table>
        </>
      );
    }
  }
}
