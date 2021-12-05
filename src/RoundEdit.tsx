import React from 'react';
import {Contract, Player, Round} from './db';

interface RoundEditProps {
  round: Round,
  players: Player[],
  changeRound: (round: Round) => void,
}

export class RoundEdit extends React.PureComponent<RoundEditProps, Round> {
  constructor(props: RoundEditProps) {
    super(props);
    this.state = Object.assign({}, props.round);
  }

  changeContract(contract: Contract) {
    this.setState({contract});
  }

  changeAttacker(playerId: number) {
    this.setState({attacker: playerId});
  }

  changeOudlers(attackOudlers: number) {
    this.setState({attackOudlers: Math.max(0, Math.min(3, attackOudlers))});
  }

  changeAttackScore(attackScore: number) {
    this.setState({attackScore: Math.max(0, Math.min(91, attackScore))});
  }

  changeDefenseScore(defenseScore: number) {
    this.changeAttackScore(91 - defenseScore);
  }

  handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    this.props.changeRound(this.state);
  }

  render() {
    const {players} = this.props;
    const round = this.state;
    const attackScore = round.attackScore;
    const defenseScore = 91 - round.attackScore;
    return (
      <form onSubmit={this.handleSubmit.bind(this)} style={{marginTop: '2em'}}>
        Contract: <select value={round.contract} onChange={(event) => this.changeContract(event.target.value as unknown as Contract)}>
          <option value="petite">Petite</option>
          <option value="garde">Garde</option>
          <option value="garde sans">Garde sans</option>
          <option value="garde contre">Garde contre</option>
        </select>{' '}
      Attack: <select value={round.attacker} onChange={(event) => this.changeAttacker(parseInt(event.target.value, 10))}>
          {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
        </select>{' '}
        Oudlers: <input type="number" min={0} max={3} size={1} value={round.attackOudlers} onChange={(event) => this.changeOudlers(parseInt(event.target.value, 10))} />{' '}
        Attack: <input type="number" min={0} max={91} size={2} value={attackScore} onChange={(event) => this.changeAttackScore(parseInt(event.target.value, 10))} />{' '}
        Defense: <input type="number" min={0} max={91} size={2} value={defenseScore} onChange={(event) => this.changeDefenseScore(parseInt(event.target.value, 10))} />{' '}
        <input type="submit" value="Set" />
      </form>
    );
  }
}
