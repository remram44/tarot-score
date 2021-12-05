import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import './App.css';
import {Database, Game, db_future} from './db';
import {GamesList} from './GamesList';
import {GameView} from './GameView';

interface AppState {
  database: Database | undefined,
  games: Game[] | undefined,
}

function NewGame() {
  return <p>TODO Create new game here</p>;
}

export default class App extends React.PureComponent<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      database: undefined,
      games: undefined,
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
    const {database, games} = this.state;
    if(database === undefined || games === undefined) {
      return <p>Loading...</p>;
    } else {
      return (
        <div className="App">
          <BrowserRouter>
            <Switch>
              <Route path="/new" render={() => <NewGame />} />
              <Route
                path="/:game"
                render={(props) => <GameView id={props.match.params.game} database={database} />} />
              <Route path="/" render={() => <GamesList games={games} />} />
            </Switch>
          </BrowserRouter>
        </div>
      );
    }
  }
}
