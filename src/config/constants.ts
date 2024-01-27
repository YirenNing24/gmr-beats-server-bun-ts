import ip from 'ip'
import { Mumbai } from "@thirdweb-dev/chains";


// API Configuration
export const API_PREFIX: string = process.env.API_PREFIX || '/api';
export const APP_PORT: number = Number(process.env.APP_PORT) || 3000;
export const API_KEY: string | undefined = process.env.API_KEY;
export const API_ID: string | undefined = process.env.API_ID;
export const HOST: string = process.env.HOST || 'localhost';
export const JWT_SECRET: string = process.env.JWT_SECRET || 'a secret key';
export const SALT_ROUNDS: string | "" = process.env.SALT_ROUNDS || ""
export const IP_ADDRESS: string = ip.address()
export const SERVER_ID: string = `${IP_ADDRESS}:${APP_PORT}`;

// Neo4j Database Configuration
export const NEO4J_URI: string | undefined = process.env.NEO4J_URI;
export const NEO4J_USERNAME: string  = process.env.NEO4J_USERNAME || ""
export const NEO4J_PASSWORD: string = process.env.NEO4J_PASSWORD || ""

// RethinkDB Configuration
export const RDB_DATABASE: string = process.env.RDB_DATABASE || ""
export const RDB_PORT: number = Number(process.env.RDB_PORT) || 28015;

// KeyDB Configuration
export const KEYDB_PASSWORD: string | undefined = process.env.KEYDB_PASSWORD;
export const KEYDB_PORT: string | undefined = process.env.KEYDB_PORT;
export const KEYDB_HOST: string | undefined = process.env.KEYDB_HOST;

export const KDB: { host: string | undefined; port: string | number; password: string | undefined } = {
  host: process.env.KEYDB_HOST,
  port: process.env.KEYDB_PORT || 6379,
  password: process.env.KEYDB_PASSWORD,
};

// Thirdweb SDK Configuration
export const SECRET_KEY: string = process.env.SECRET_KEY || ""
// Chain and Wallet Factory Configuration
export const CHAIN: typeof Mumbai = Mumbai;
export const FACTORIES: Record<number, string> = { [Mumbai.chainId]: "0xB164886ED35942D2B4aCb042c1c41D4B5c0EABe1" };
// Contract Addresses
export const BEATS_TOKEN: string = '0x63F8Cb0ffc1DeB782E84B9C68b2F85260fbd497d';
export const THUMP_TOKEN: string = '0xDAd44595262D2390192762bbb3358DF807808480';
export const KMR_TOKEN: string = '0xb6446F25afD9f18B9716Aa32d65df9370980d6c7';

export const PACK_ADDRESS: string = '0x436B0468CF4d8dA8E887fA01F5F97d03C7A465e1';
export const EDITION_ADDRESS: string = '0x09F143c0222505D7985482fCc7D3Abf7E3C987eA'; // ** NFT CARD ADDRESS
export const CARD_MARKETPLACE: string = '0x7dc65A3EeBdFbCAC10C9f0a0ecaA62f98a8d1f00'; // ** CARD MARKETPLACE ADDRESS
export const BUNDLE_MARKETPLACE: string = '0xcd5CB69Dcc7D52eAe5CD99Cc43F92F329507ED6E'; // ** LOOTBOX MARKETPLACE ADDRESS


const factoryAddress: string = FACTORIES[CHAIN.chainId];
export const SMART_WALLET_CONFIG: {
  chain: typeof CHAIN;
  gasless: boolean;
  factoryAddress: string;
  secretKey: string;
} = {
  chain: CHAIN,
  gasless: true,
  factoryAddress: factoryAddress,
  secretKey: SECRET_KEY,
};

