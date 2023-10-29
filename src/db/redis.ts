import { createClient } from 'redis';
import { KEYDB_PASSWORD, HOST, KEYDB_PORT } from '../config/constants';

const keydb = createClient({ url:`redis://:${KEYDB_PASSWORD}@${HOST}:${KEYDB_PORT}`});


keydb.on('error', err => console.log('KeyDB Client Error', err));

await keydb.connect();


export default keydb