import { PolygonAmoyTestnet } from "@thirdweb-dev/chains";
import { SmartWalletConfig, SmartWalletOptions } from "@thirdweb-dev/wallets";

// API Configuration
export const API_PREFIX: string = process.env.API_PREFIX || '/api';
export const APP_PORT: number = Number(process.env.APP_PORT) || 3000;
export const API_KEY: string | undefined = process.env.API_KEY;
export const API_ID: string | undefined = process.env.API_ID;
export const HOST: string = process.env.HOST || 'localhost';
export const JWT_SECRET: string = process.env.JWT_SECRET || 'a secret key';
export const SALT_ROUNDS: string | "" = process.env.SALT_ROUNDS || ""

// Neo4j Database Configuration
export const NEO4J_URI: string = process.env.NEO4J_URI || ""
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
export const CHAIN: typeof PolygonAmoyTestnet  = PolygonAmoyTestnet;
export const FACTORIES: Record<number, string> = { [PolygonAmoyTestnet .chainId]: "0x2a3e0227174c57B201b448978117602aB0c4221a" };
// Contract Addresses
export const BEATS_TOKEN: string = '0x787F78A1Fb0cB113238f1957F3fb98648a28288a';
export const GMR_TOKEN: string = '0xd991050222Db34E1cA129DE155c8684C47614A76';

export const PACK_ADDRESS: string = '0x749bBCe456372c744e42a2391CFcb012E225ab65';
export const EDITION_ADDRESS: string = '0x75E504b9B341CA7f75d330Fa916AC3FFD81c0B4c'; // ** NFT CARD ADDRESS
export const CARD_MARKETPLACE: string = '0xE23DDfD5B6fCb662ED7afe90357C6f43c89E75Cc'; // ** CARD MARKETPLACE ADDRESS
export const PACK_MARKETPLACE: string = '0x4E18FACbC9919C5C8fd596Ee358AbfDdb3c516a8'; // ** CARD PACK MARKETPLACE ADDRESS

export const GOOGLE_CLIENT_ID: string  = process.env.GOOGLE_CLIENT_ID || ""
export const GOOGLE_CLIENT_SECRET: string = process.env.GOOGLE_CLIENT_SECRET || ""

const factoryAddress: string = FACTORIES[CHAIN.chainId];
// export const SMART_WALLET_CONFIG: {
//   chain: typeof CHAIN;
//   gasless: boolean;
//   factoryAddress: string;
//   secretKey: string;
  
// } = {
//   chain: CHAIN,
//   gasless: true,
//   factoryAddress: factoryAddress,
//   secretKey: SECRET_KEY,

// };

export const SMART_WALLET_CONFIG: SmartWalletConfig = {
  chain: CHAIN,
  factoryAddress,
  gasless: true,
  secretKey: SECRET_KEY,
};



