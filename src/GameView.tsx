import React from 'react';
import {Database, Game} from './db';

interface GameViewProps {
  id: string,
  database: Database,
}

interface GameViewState {
  game: Game | undefined | null,
}

export class GameView extends React.PureComponent<GameViewProps, GameViewState> {
  constructor(props: GameViewProps) {
    super(props);
    this.state = {
      game: undefined,
    };
  }

  componentDidMount() {
    // Get game
    let id = parseInt(this.props.id, 10);
    if(isNaN(id)) {
      this.setState({game: null});
    } else {
      (async () => {
        let game = await this.props.database.getGame(id);
        this.setState({game});
      })();
    }
  }

  render() {
    if(this.state.game === undefined) {
      return <p>Loading...</p>;
    } else if(this.state.game === null) {
      return <p>No such game</p>;
    } else {
      return <p>TODO Game {this.props.id}: {JSON.stringify(this.state.game)}</p>;
    }
  }
}
