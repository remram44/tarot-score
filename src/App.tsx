import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import './App.css';
import {Database, db_future} from './db';
import {GamesList} from './GamesList';
import {GameView} from './GameView';
import {NewGame} from './NewGame';
import {SetPlayers} from './SetPlayers';

interface AppState {
  database: Database | undefined,
}

export default class App extends React.PureComponent<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      database: undefined,
    };
  }

  componentDidMount() {
    // Wait for database
    db_future.then((database) => {
      // Database is ready
      this.setState({database});
    });
  }

  render() {
    const {database} = this.state;
    if(database === undefined) {
      return <p>Loading...</p>;
    } else {
      return (
        <div className="App">
          <BrowserRouter>
            <Switch>
              <Route path="/new" render={() => <NewGame database={database} />} />
              <Route
                path="/set-players/:game"
                render={(props) => <SetPlayers id={props.match.params.game} database={database} />} />
              <Route
                path="/:game"
                render={(props) => <GameView id={props.match.params.game} database={database} />} />
              <Route path="/" render={() => <GamesList database={database} />} />
            </Switch>
          </BrowserRouter>
        </div>
      );
    }
  }
}
