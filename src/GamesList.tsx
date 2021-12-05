import React from 'react';
import {Link} from 'react-router-dom';
import {Game} from './db';

interface GamesListProps {
  games: Game[],
}

export class GamesList extends React.PureComponent<GamesListProps> {
  render() {
    if(this.props.games === null) {
      return (
        <div className="App">
          <p>Loading...</p>
        </div>
      );
    } else {
      return (
        <ul className="games-list">
          {this.props.games.map((game) => (
            <li key={game.id}><Link to={`/${game.id}`}>{game.name}</Link></li>
          ))}
          <li key="new" className="new-game"><Link to="/new">New game</Link></li>
        </ul>
      );
    }
  }
}
