import React from 'react';
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
            let contractMultiplier = 1;
            if(round.contract === 'garde') {
              contractMultiplier = 2;
            } else if(round.contract === 'garde sans') {
              contractMultiplier = 4;
            } else if(round.contract === 'garde contre') {
              contractMultiplier = 6;
            }

            const score = (25 + Math.abs(round.score - target)) * (attackSuccessful?1:-1) * contractMultiplier;

            players.forEach((player) => {
              let change = score;
              if(players.length === 5) {
                if(player.id === round.attacker && player.id === round.called) {
                  // Attacker who called themselves
                  change = score * 4;
                } else if(player.id === round.attacker) {
                  // Attacker who called someone else
                  change = score * 2;
                } else if(player.id === round.called) {
                  // Player called (king)
                  change = score;
                } else {
                  // Defense
                  change = -score;
                }
              } else {
                if(player.id === round.attacker) {
                  // Attacker
                  change = (players.length - 1) * score;
                } else {
                  // Defense
                  change = -score;
                }
              }
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
      return (<>
        {round.id}: {gameInfo.playersById.get(round.attacker)!.name} {round.contract}, {round.score}, {(round.score >= target)?"win +":"fail -"}{Math.abs(round.score - target)}
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
          <h1>{gameInfo.game.name}</h1>
          <p>Players:</p>
          <ul className="players">
            {gameInfo.players.map((player) => (
              <li key={player.id}>{player.name} | {gameInfo.totalScores.get(player.id)}</li>
            ))}
          </ul>
          <p>Rounds:</p>
          <ul className="rounds">
            {gameInfo.rounds.map((round) => (
              <li key={round.id}>{this.renderRound(round)}</li>
            ))}
          </ul>
        </>
      );
    }
  }
}
