import React from 'react';
import {roundTarget, roundContractMultiplier, roundPlayerMultiplier} from './rules';
import {Game, Player, Round} from './db';

interface RoundViewProps {
  game: Game,
  players: Player[],
  playersById: Map<number, Player>,
  round: Round,
  editRound: (roundId: number) => void,
}

export class RoundView extends React.PureComponent<RoundViewProps> {
  render() {
    const {players, playersById, round} = this.props;

    const target = roundTarget(round);
    const attackSuccessful = round.attackScore >= target;
    const contractMultiplier = roundContractMultiplier(round);
    const score = (25 + Math.abs(round.attackScore - target)) * (attackSuccessful?1:-1) * contractMultiplier;

    const renderPlayerScore = (playerId: number) => {
      const change = score * roundPlayerMultiplier(playerId, players.length, round);
      return change;
    };

    return (<>
      <td key="round">
        <button className="like-link" onClick={() => this.props.editRound(round.id)}>
          {round.id}: {playersById.get(round.attacker)!.name} {round.contract}, {(round.attackScore >= target)?"win +":"fail -"}{Math.abs(round.attackScore - target)}
        </button>
      </td>
      {players.map((player) => (
        <td key={player.id}>{renderPlayerScore(player.id)}</td>
      ))}
    </>);
  }
}
