import React from 'react';
import './App.css';
import {Database, Game, db_future} from './db';

interface AppState {
  database: Database | null,
  games: Game[] | null,
}

class App extends React.PureComponent<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      database: null,
      games: null,
    };
  }

  componentDidMount() {
    // Wait for database
    db_future.then((database) => {
      // Database is ready
      this.setState({database});

      // List games
      (async () => {
        let games = await database.listGames();
        this.setState({games});
      })();
    });
  }

  render() {
    if(this.state.games === null) {
      return (
        <div className="App">
          <p>Loading...</p>
        </div>
      );
    } else {
      return (
        <div className="App">
          <ul>
            {this.state.games.map((game) => (
              <li key={game.id}>{game.name}</li>
            ))}
          </ul>
        </div>
      );
    }
  }
}

export default App;
