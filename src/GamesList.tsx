import React from 'react';
import {Link} from 'react-router-dom';
import {Database, Game} from './db';

interface GamesListProps {
  database: Database,
}

interface GamesListState {
  games: Game[] | undefined,
}

export class GamesList extends React.PureComponent<GamesListProps, GamesListState> {
  constructor(props: GamesListProps) {
    super(props);
    this.state = {
      games: undefined,
    };
  }

  componentDidMount() {
    // List games
    (async () => {
      const games = await this.props.database.listGames();
      this.setState({games});
    })();
  }

  render() {
    const {games} = this.state;
    if(!games) {
      return <p>Loading...</p>;
    } else {
      return (
        <ul className="games-list">
          {games.map((game) => (
            <li key={game.id}><Link to={`/${game.id}`}>{game.name}</Link></li>
          ))}
          <li key="new" className="new-game"><Link to="/new">New game</Link></li>
        </ul>
      );
    }
  }
}
