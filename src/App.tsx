import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import './App.css';
import {Database, Game, db_future} from './db';
import {GamesList} from './GamesList';

interface AppState {
  database: Database | null,
  games: Game[] | null,
}

function NewGame() {
  return <p>TODO Create new game here</p>;
}

export default class App extends React.PureComponent<{}, AppState> {
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
    const games = this.state.games;
    if(games === null) {
      return <p>Loading...</p>;
    } else {
      return (
        <div className="App">
          <BrowserRouter>
            <Switch>
              <Route path="/new" render={() => <NewGame />} />
              <Route path="/" render={() => <GamesList games={games} />} />
            </Switch>
          </BrowserRouter>
        </div>
      );
    }
  }
}
