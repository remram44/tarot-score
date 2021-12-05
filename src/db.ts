export interface Game {
  id: number,
  name: string,
  created: Date,
  modified: Date,
}

export interface Player {
  id: number,
  game: number,
  name: string,
}

export type Contract = 'petite' | 'garde' | 'garde sans' | 'garde contre';

export interface Round {
  id: number,
  game: number,
  attacker: number,
  called: number | null,
  contract: Contract,
  attackOudlers: number,
  attackScore: number,
}

const VERSION = 1;

const SCHEMA = [
  {
    name: 'games',
    config: {keyPath: 'id', autoIncrement: true},
    indexes: ['name', 'created', 'modified'],
  },
  {
    name: 'game_players',
    config: {keyPath: 'id', autoIncrement: true},
    indexes: ['game'],
  },
  {
    name: 'rounds',
    config: {keyPath: 'id', autoIncrement: true},
    indexes: ['game'],
  },
];

export class Database {
  idb: IDBDatabase;

  constructor(idb: IDBDatabase) {
    this.idb = idb;
  }

  listGames(): Promise<Game[]> {
    const transaction = this.idb.transaction(['games'], 'readonly');
    const games = transaction.objectStore('games');
    return new Promise((accept, reject) => {
      const array: Game[] = [];
      games.index('created').openCursor().onsuccess = (event) => {
        const cursor = (event.target as unknown as {result?: IDBCursor}).result;
        if(cursor) {
          array.push((cursor as unknown as {value: Game}).value);
          cursor.continue();
        } else {
          accept(array);
        }
      };
    });
  }

  _getGame(transaction: IDBTransaction, id: number): Promise<Game | null> {
    const games = transaction.objectStore('games');
    return new Promise((accept, reject) => {
      games.get(id).onsuccess = (event) => {
        const game = (event.target as unknown as {result: Game | null | undefined}).result;
        if(game === undefined) {
          accept(null);
        } else {
          accept(game);
        }
      };
    });
  }

  _getPlayers(transaction: IDBTransaction, id: number): Promise<Player[]> {
    const game_players = transaction.objectStore('game_players');
    return new Promise((accept, reject) => {
      const array: Player[] = [];
      game_players.index('game').openCursor(IDBKeyRange.only(id)).onsuccess = (event) => {
        const cursor = (event.target as unknown as {result?: IDBCursor}).result;
        if(cursor) {
          array.push((cursor as unknown as {value: Player}).value);
          cursor.continue();
        } else {
          accept(array);
        }
      };
    });
  }

  _getRounds(transaction: IDBTransaction, id: number): Promise<Round[]> {
    const rounds = transaction.objectStore('rounds');
    return new Promise((accept, reject) => {
      const array: Round[] = [];
      rounds.index('game').openCursor(IDBKeyRange.only(id)).onsuccess = (event) => {
        const cursor = (event.target as unknown as {result?: IDBCursor}).result;
        if(cursor) {
          array.push((cursor as unknown as {value: Round}).value);
          cursor.continue();
        } else {
          accept(array);
        }
      };
    });
  }

  async getGame(id: number): Promise<{game: Game, players: Player[], rounds: Round[]} | null> {
    const transaction = this.idb.transaction(
      ['games', 'game_players', 'rounds'],
      'readonly',
    );
    // Get game
    const game = await this._getGame(transaction, id);
    if(game === null) {
      return null;
    } else {
      // Get the players and rounds
      const players = await this._getPlayers(transaction, id);
      const rounds = await this._getRounds(transaction, id);

      return {game, players, rounds};
    }
  }

  createGame(): Promise<number> {
    const transaction = this.idb.transaction(['games'], 'readwrite');
    const games = transaction.objectStore('games');
    return new Promise((accept, reject) => {
      games.add({name: "New Game", created: new Date(), modified: new Date()}).onsuccess = (event) => {
        const gameId = (event.target as unknown as {result: number}).result;
        accept(gameId);
      };
    });
  }

  renameGame(id: number, name: string): Promise<void> {
    const transaction = this.idb.transaction(['games'], 'readwrite');
    const games = transaction.objectStore('games');
    return new Promise((accept, reject) => {
      games.get(id).onsuccess = (event) => {
        const game = (event.target as unknown as {result: Game}).result;
        if(!game) {
          reject(new Error("No such game"));
        } else {
          game.name = name;
          games.put(game).onsuccess = () => {
            accept();
          };
        }
      };
    });
  }

  async removeGame(id: number): Promise<void> {
    const transaction = this.idb.transaction(['games', 'game_players', 'rounds'], 'readwrite');
    // Delete players
    await new Promise((accept, reject) => {
      const game_players = transaction.objectStore('game_players');
      game_players.index('game').openCursor(IDBKeyRange.only(id)).onsuccess = (event) => {
        const cursor = (event.target as unknown as {result?: IDBCursor}).result;
        if(cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          accept(0);
        }
      };
    });
    // Delete rounds
    await new Promise((accept, reject) => {
      const rounds = transaction.objectStore('rounds');
      rounds.index('game').openCursor(IDBKeyRange.only(id)).onsuccess = (event) => {
        const cursor = (event.target as unknown as {result?: IDBCursor}).result;
        if(cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          accept(0);
        }
      };
    });
    // Delete game
    await new Promise((accept, reject) => {
      const games = transaction.objectStore('games');
      games.delete(id).onsuccess = (event) => {
        accept(0);
      };
    });
  }

  async setPlayers(gameId: number, names: string[]): Promise<void> {
    const transaction = this.idb.transaction(['game_players'], 'readwrite');
    const game_players = transaction.objectStore('game_players');
    for(const name of names) {
      await new Promise((accept, reject) => {
        game_players.add({game: gameId, name});
        accept(0);
      });
    }
  }

  setRound(round: Round): Promise<number> {
    const transaction = this.idb.transaction(['rounds'], 'readwrite');
    const rounds = transaction.objectStore('rounds');
    return new Promise((accept, reject) => {
      rounds.put(round).onsuccess = (event) => {
        const roundId = (event.target as unknown as {result: number}).result;
        accept(roundId);
      };
    });
  }
}

async function addTestData(database: Database): Promise<void> {
  // Open transaction
  const transaction = database.idb.transaction(
    ['games', 'game_players', 'rounds'],
    'readwrite',
  );
  const games = transaction.objectStore('games');

  // Check if data is present
  const hasData = await new Promise((accept, reject) => {
    games.openCursor().onsuccess = (event) => {
      let cursor = (event.target as unknown as {result?: IDBCursor}).result;
      if(cursor) {
        accept(true);
      } else {
        accept(false);
      }
    };
  });

  if(!hasData) {
    // Add test data
    // Games
    games.add(
      {id: 1, name: "Game 1", created: new Date('2021-11-27T23:32:27'), modified: new Date('2021-11-28T02:07:15')},
    );
    games.add(
      {id: 2, name: "Game 2", created: new Date('2021-11-29T01:45:39'), modified: new Date('2021-11-29T05:57:31')},
    );
    // Players
    const game_players = transaction.objectStore('game_players');
    game_players.add(
      {id: 1, game: 1, name: "Remi"},
    );
    game_players.add(
      {id: 2, game: 1, name: "Vicky"},
    );
    game_players.add(
      {id: 3, game: 1, name: "Brian"},
    );
    // Rounds
    const rounds = transaction.objectStore('rounds');
    rounds.add(
      {id: 1, game: 1, attacker: 2, called: null, contract: 'petite', attackOudlers: 2, attackScore: 48},
    );
    rounds.add(
      {id: 2, game: 1, attacker: 3, called: null, contract: 'garde', attackOudlers: 3, attackScore: 45},
    );
    rounds.add(
      {id: 3, game: 1, attacker: 1, called: null, contract: 'petite', attackOudlers: 1, attackScore: 49},
    );
  }
}

export const db_future: Promise<Database> = new Promise((accept, reject) => {
  if(!window.indexedDB) {
    alert("Your browser doesn't support IndexedDB, can't store any data!");
  } else {
    // Open database
    let request = window.indexedDB.open("scores", VERSION);
    request.onerror = () => {
      alert("Couldn't use IndexedDB");
      reject(new Error("Couldn't use IndexedDB"));
    };
    request.onsuccess = (event) => {
      const db: IDBDatabase = request.result;
      // Attach error handler (show alert)
      db.onerror = (event) => {
        const error = (event.target as any)?.error;
        if(error) {
          alert("Database error: " + error);
        }
      };
      // Construct object
      let database = new Database(db);
      // Add test data
      addTestData(database).then(() => {
        // Resolve promise
        accept(new Database(db));
      });
    };

    request.onupgradeneeded = (event) => {
      // Create schema
      console.log("Upgrading database:", event.oldVersion, "->", event.newVersion);
      if(event.oldVersion === VERSION) {
        return;
      }
      let db: IDBDatabase = (event.target as unknown as {result: IDBDatabase}).result;
      SCHEMA.forEach(({name, config, indexes}) => {
        let objectStore = db.createObjectStore(name, config);
        indexes.forEach((idxColumn) => objectStore.createIndex(idxColumn, idxColumn, {unique: false}));
      });
    };
  }
});
