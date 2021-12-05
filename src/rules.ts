import {Player, Round} from './db';

export function roundTarget(round: Round): number {
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

export function roundContractMultiplier(round: Round): number {
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

export function roundPlayerMultiplier(playerId: number, players: number, round: Round): number {
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

export function totalScores(players: Player[], rounds: Round[]): Map<number, number> {
  const scores = new Map();
  players.forEach((player) => {
    scores.set(player.id, 0);
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
      scores.set(
        player.id,
        scores.get(player.id) + change,
      );
    });
  });

  return scores;
}
