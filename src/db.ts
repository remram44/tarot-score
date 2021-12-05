export interface Game {
  id: number,
  name: string,
  created: Date,
  modified: Date,
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
    indexes: ['game', 'name'],
  },
  {
    name: 'rounds',
    config: {keyPath: 'id', autoIncrement: true},
    indexes: ['game'],
  },
  {
    name: 'points',
    config: {keyPath: 'round_player_pair', autoIncrement: true},
    indexes: [],
  },
];

export class Database {
  idb: IDBDatabase;

  constructor(idb: IDBDatabase) {
    this.idb = idb;
  }

  async listGames(): Promise<Game[]> {
    const transaction = this.idb.transaction(['games'], 'readonly');
    const games = transaction.objectStore('games');
    return new Promise((accept, reject) => {
      const array: Game[] = [];
      games.openCursor().onsuccess = (event) => {
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

  async getGame(id: number): Promise<Game | null> {
    const transaction = this.idb.transaction(['games'], 'readonly');
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
}

async function addTestData(database: Database): Promise<void> {
  // Open transaction
  const transaction = database.idb.transaction(['games'], 'readwrite');
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
    games.add(
      {name: "Game 1", created: new Date('2021-11-27T23:32:27'), modified: new Date('2021-11-28T02:07:15')},
    );
    games.add(
      {name: "Game 2", created: new Date('2021-11-29T01:45:39'), modified: new Date('2021-11-29T05:57:31')},
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
