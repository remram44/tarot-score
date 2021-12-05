import React from 'react';
import {Redirect} from 'react-router-dom';
import {Database} from './db';

interface NewGameProps {
  database: Database,
}

interface NewGameState {
  gameId: number | undefined,
}

export class NewGame extends React.PureComponent<NewGameProps, NewGameState> {
  constructor(props: NewGameProps) {
    super(props);
    this.state = {
      gameId: undefined,
    };
  }

  componentDidMount() {
    (async() => {
      const gameId = await this.props.database.createGame();
      this.setState({gameId});
    })();
  }

  render() {
    const {gameId} = this.state;
    if(gameId === undefined) {
      return <p>Creating...</p>;
    } else {
      return <Redirect to={`/${gameId}`} />;
    }
  }
}
