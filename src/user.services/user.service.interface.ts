//**  TYPE INTERFACE

/**
 * Represents the return data structure for validating a user session.
 *
 * @interface ValidateSessionReturn
 * @property {WalletData} wallet - User wallet information.
 * @property {SafeProperties} safeProperties - Safe user properties.
 * @property {PlayerStats} playerStats - Player statistics.
 * @property {string} success - Indicates the success status.
 * @property {number} energy - User energy level.
 */
export interface ValidateSessionReturn {
    wallet: WalletData;
    safeProperties: SafeProperties;
    playerStats: PlayerStats;
    success: string;
    energy: number;
  }
  
  /**
   * Represents the return data structure for authenticating a user.
   *
   * @interface AuthenticateReturn
   * @property {WalletData} wallet - User wallet information.
   * @property {SafeProperties} safeProperties - Safe user properties.
   * @property {PlayerStats} playerStats - Player statistics.
   * @property {number} energy - User energy level.
   * @property {string} uuid - Unique identifier for the user.
   * @property {string} token - Authentication token for the user session.
   */
  export interface AuthenticateReturn {
    username: string;
    wallet: WalletData;
    safeProperties: SafeProperties;
    playerStats: PlayerStats;
    energy: number;
    uuid: string;
    token: string;
    [key: string]: any; // Index signature for additional properties
  }
  
  
  /**
   * Represents an item within a card inventory.
   *
   * @interface CardInventoryItem
   * @property {string | undefined} Item - The item within the card inventory. It may be a string or undefined.
   */
export interface CardInventoryItem {
    Item: string | null;
  }
  
  /**
   * Represents a card inventory with dynamic keys.
   *
   * @interface CardInventory
   * @property {CardInventoryItem | undefined} key - The key represents a specific slot in the card inventory.
   * @description The value associated with each key is either a CardInventoryItem or undefined.
   */
export interface CardInventory {
    [key: string]: CardInventoryItem | null;
  }
  
  /**
   * Represents an item with stack information within a power-up inventory.
   *
   * @interface PowerUpInventoryItem
   * @property {string} Item - The item within the power-up inventory.
   * @property {number} Stack - The stack quantity of the item.
   */
export interface PowerUpInventoryItem {
    Item: string;
    Stack: number;
  }
  
  /**
   * Represents a power-up inventory with dynamic keys.
   *
   * @interface PowerUpInventory
   * @property {PowerUpInventoryItem | undefined} key - The key represents a specific slot in the power-up inventory.
   * @description The value associated with each key is either a PowerUpInventoryItem or undefined.
   */
export interface PowerUpInventory {
    [key: string]: PowerUpInventoryItem | undefined;
  }
  
  /**
   * Represents the statistical data of a player in the game.
   *
   * @interface PlayerStats
   * @property {number} level - The player's level.
   * @property {number} playerExp - The player's experience points.
   * @property {number} availStatPoints - The available stat points for the player.
   * @property {string} rank - The player's rank in the game.
   * @property {Object} statPointsSaved - The saved stat points for different attributes.
   * @property {number} statPointsSaved.mainVocalist - Stat points saved for the main vocalist attribute.
   * @property {number} statPointsSaved.rapper - Stat points saved for the rapper attribute.
   * @property {number} statPointsSaved.leadDancer - Stat points saved for the lead dancer attribute.
   * @property {number} statPointsSaved.leadVocalist - Stat points saved for the lead vocalist attribute.
   * @property {number} statPointsSaved.mainDancer - Stat points saved for the main dancer attribute.
   * @property {number} statPointsSaved.visual - Stat points saved for the visual attribute.
   * @property {number} statPointsSaved.leadRapper - Stat points saved for the lead rapper attribute.
   */
export interface PlayerStats {
    level: number;
    playerExp: number;
    availStatPoints: number;
    rank: string;
    statPointsSaved: {
      mainVocalist: number;
      rapper: number;
      leadDancer: number;
      leadVocalist: number;
      mainDancer: number;
      visual: number;
      leadRapper: number;
    };
  }
  
  /**
   * Represents the data structure for safe user properties.
   * 
   * @interface SafeProperties
   * @property {boolean} anon - Indicates if the user is anonymous.
   * @property {number} createdAt - The timestamp of user creation.
   * @property {string} email - The user's email.
   * @property {string} firstName - The user's first name.
   * @property {string} lastName - The user's last name.
   * @property {string[]} profilePics - Array of profile picture filenames.
   * @property {string} userId - The user ID.
   * @property {string} username - The username.
   */
export interface SafeProperties {
    anon: boolean;
    createdAt: number;

    email: string;
    firstName: string;
    lastName: string;
    profilePics: string[];
  }
  
  /**
   * Represents user data in the system.
   *
   * @interface UserData
   * @property {Object} properties - The user's properties.
   * @property {boolean} properties.anon - Indicates if the user is anonymous.
   * @property {CardInventory} properties.cardInventory - The user's card inventory.
   * @property {number} properties.createdAt - The timestamp of user creation.
   * @property {string} properties.email - The user's email address.
   * @property {string} properties.firstName - The user's first name.
   * @property {string} properties.lastName - The user's last name.
   * @property {string} properties.localWallet - The local wallet information of the user.
   * @property {string} properties.localWalletKey - The key associated with the local wallet.
   * @property {string} properties.password - The user's password.
   * @property {PlayerStats} properties.playerStats - The statistical data of the player.
   * @property {PowerUpInventory} properties.powerUpInventory - The user's power-up inventory.
   * @property {string[]} properties.profilePics - Array of profile picture filenames.
   * @property {string} properties.userId - The unique identifier for the user.
   * @property {string} properties.username - The username chosen by the user.
   */
export interface UserData {
    properties: {
      anon: boolean;
      cardInventory: CardInventory;
      createdAt: number;
      email: string;
      firstName: string;
      lastName: string;
      localWallet: string;
      localWalletKey: string;
      password: string;
      playerStats: PlayerStats;
      powerUpInventory: PowerUpInventory;
      profilePics: string[];
      userId: string;
      username: string;
    };
  }
  
  /**
   * Represents data related to a user's wallet.
   *
   * @interface WalletData
   * @property {string} smartWalletAddress - The address of the smart wallet.
   * @property {string} beatsBalance - The balance in beats.
   * @property {string} kmrBalance - The balance in kmr.
   * @property {string} thumpBalance - The balance in thump.
   * @property {string} nativeBalance - The native balance.
   */
export interface WalletData {
    smartWalletAddress: string;
    beatsBalance: string;
    kmrBalance: string;
    thumpBalance: string;
    nativeBalance: string;
  }
  
export interface LocalWallet {
    address: string;
    id: string;
    version: number;
    crypto: {
      cipher: string;
      cipherparams: {
        iv: string;
      };
      ciphertext: string;
      kdf: string;
      kdfparams: {
        salt: string;
        n: number;
        dklen: number;
        p: number;
        r: number;
      };
      mac: string;
    };
  }

export interface User {
  anon: boolean;
  email: string;
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  time: string;
}