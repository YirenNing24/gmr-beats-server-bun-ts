import rt, { ConnectionOptions } from 'rethinkdb';
import { HOST, RDB_PORT } from '../config/constants';

let rdbConn: rt.Connection | null = null;

const rdbConnect = async (): Promise<rt.Connection> => {
  try {
    const options: ConnectionOptions = {
      host: HOST,
      port: RDB_PORT,
    };

    const conn: rt.Connection = await rt.connect(options);

    // Handle close
    conn.on('close', (error: any) => {
      console.log('RDB connection closed: ', error);
      rdbConn = null;
    });

    console.log('RethinkDB Initialized!');
    rdbConn = conn;
    return conn;
  } catch (error) {
    throw error;
  }
};

export const getRethinkDB = async (): Promise<rt.Connection> => {
  if (rdbConn !== null) {
    return rdbConn;
  }
  return await rdbConnect();
};