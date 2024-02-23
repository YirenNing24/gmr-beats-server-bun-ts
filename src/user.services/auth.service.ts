//**TODO SPACE IN LAST NAME SHOULD BE ALLOWED */
//**TODO SERVER VALIDATE REGISTRATION */
//**TODO ADD USERID CONSTRAINT
//**TODO ADD EMAIL IN THE CONSTRAINT */


//** JWT MODULE, AND CONFIGS IMPORTS
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SALT_ROUNDS } from '../config/constants'

//** BCRYPT IMPORT
import { hash, compare } from 'bcrypt-ts'

//** ERROR CODES
import ValidationError from '../outputs/validation.error'

//** NEW ACCOUNT DEFAULT VALUES
import { cardInventory, playerStats, powerUpInventory, iveEquip } from '../noobs/noobs'

//**  IMPORTED SERVICES
import WalletService from './wallet.service'
import Replenishments from '../game.services/replenishments.service.js'
import ProfileService from '../game.services/profile.service'
import TokenService from './token.service.js'
import GoogleService from './google.service.js'

//** UUID GENERATOR
import { nanoid } from "nanoid/async";

//** MEMGRAPH DRIVER
import { Driver, QueryResult, Session,  ManagedTransaction } from 'neo4j-driver-core'

//** TYPE INTERFACES
import { LocalWallet, WalletData, UserData, ValidateSessionReturn, AuthenticateReturn, PlayerStats, TokenScheme, AccessRefresh, PlayerInfo, User, GoogleRegistered } from './user.service.interface'

/**
 * Service for handling authentication-related operations.
 * 
 * @class
 * @name AuthService
 */
class AuthService {
  /**
   * The Neo4j driver used for database interactions.
   * @type {Driver}
   * @memberof AuthService
   * @instance
   */
  driver: Driver
  constructor(driver: Driver) {
    this.driver = driver
    }
    /**
   * Registers a new user.
   *
   * @method
   * @memberof AuthService
   * @instance
   * @param {string} username - The username of the new user.
   * @param {string} password - The password of the new user.
   * @returns {Promise<void>} A Promise that resolves when the registration is successful.
   */
  public async register(userData: User): Promise<void> {
    const walletService: WalletService = new WalletService();
    const replenishService: Replenishments = new Replenishments();

    const userId: string = await nanoid();
    const inventoryCard: string = JSON.stringify(cardInventory);
    const statsPlayer: string = JSON.stringify(playerStats);
    const inventoryPowerUp: string = JSON.stringify(powerUpInventory);
    const equipIve: string = JSON.stringify(iveEquip);

    const { userName, password } = userData as User
    const encrypted: string = await hash(password, parseInt(SALT_ROUNDS));
    const locKey: string = await hash(userName, parseInt(SALT_ROUNDS));

    const localWallet = await walletService.createWallet(locKey) as LocalWallet

    const session: Session = this.driver.session();
    try {
       await session.executeWrite(
        (tx: ManagedTransaction) => tx.run(
           `
             CREATE (u:User { 
               userId: $userId,
               username: $userName,
               password: $encrypted,
               localWallet: $localWallet, 
               localWalletKey: $locKey,
               cardInventory: $inventoryCard,
               iveEquip: $equipIve,
               playerStats: $statsPlayer,
               powerUpInventory: $inventoryPowerUp
             })
             RETURN u
           `,
           { userId, userName, encrypted, localWallet, locKey, inventoryCard, equipIve, statsPlayer, inventoryPowerUp }
         ) 
       )

      // Close the session
      await session.close()

      // Set energy for new users to 200
      const currentTime: number = Math.floor(Date.now() / 1000);
      await replenishService.setEnergy(userName, currentTime, 200, 1)

    } catch (error: any) {
      // Handle unique constraints in the database
      if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
        if (error.message.includes('username')) {
          throw new ValidationError(
            `An account already exists with the username ${userName}`,
              'Username already taken',
            )
          }
        }
        throw error
      } finally {
        await session.close()
      }
    };

/**
 * Authenticates a user by verifying their username and password.
 *
 * @method
 * @memberof AuthService
 * @instance
 * @param {string} userName - The username of the user to authenticate.
 * @param {string} unencryptedPassword - The unencrypted password of the user.
 * @returns {Promise<AuthenticateReturn>} A promise that resolves with authentication details.
 * @throws {ValidationError} Throws a validation error if authentication fails.
 */
  public async authenticate(userName: string, unencryptedPassword: string): Promise<AuthenticateReturn> {
    const walletService: WalletService = new WalletService();
    const profileService: ProfileService = new ProfileService();
    const replenishService: Replenishments = new Replenishments();
    const tokenService: TokenService = new TokenService();

    try {
        const session: Session = this.driver.session();
        // Find the user node within a Read Transaction
        const result: QueryResult = await session.executeRead(tx =>
            tx.run('MATCH (u:User {username: $userName}) RETURN u', { userName })
        );

        await session.close();
        // Verify the user exists
        if (result.records.length === 0) {
            throw new ValidationError(`User with username '${userName}' not found.`, "");
        }

        // Compare Passwords
        const user: UserData = result.records[0].get('u');
        const encryptedPassword: string = user.properties.password;
        const correct: boolean = await compare(unencryptedPassword, encryptedPassword);
        if (!correct) {
            throw new ValidationError('Incorrect password.', "");
        }
        // Return User Details
        const { password, localWallet, localWalletKey, playerStats, userId, username, cardInventory, powerUpInventory, ...safeProperties } = user.properties

        const walletPromise: Promise<WalletData> = walletService.importWallet(localWallet, localWalletKey);
        const energyPromise: Promise<number> = replenishService.getEnergy(userName, playerStats);
        const statsPromise: Promise<PlayerStats> = profileService.getStats(userName)
        const [ wallet, energy, stats ] = await Promise.all([walletPromise, energyPromise, statsPromise]);

        const tokens: TokenScheme = await tokenService.generateTokens(userName);
        const { refreshToken, accessToken } = tokens as TokenScheme
        return {
            username,
            wallet,
            safeProperties,
            playerStats: stats,
            energy,
            uuid: userId,
            refreshToken,
            accessToken,
            message: 'You are now logged in',
            success: 'OK',
            loginType: 'beats'

        } as AuthenticateReturn
    } catch (error: any) {
        throw error;
    }
  };

    /**
   * Validates a user's session using JWT
   * @method
   * @memberof AuthService
   * @instance
   * @param {string} username - The username of the user whose session is to be validated.
   * @returns {Promise<ValidateSessionReturn>} A promise that resolves with session validation details.
   * @throws {ValidationError} Throws a validation error if the user is not found.
   */
  public async validateSession(token: string): Promise<ValidateSessionReturn>  {
      try {
        // Create a new instance of the needed services class
        const walletService: WalletService = new WalletService();
        const replenishService: Replenishments = new Replenishments();
        const tokenService: TokenService = new TokenService();
  
        const accessRefresh: AccessRefresh = await tokenService.verifyRefreshToken(token)
        const { userName, accessToken } = accessRefresh as AccessRefresh
  
        // Open a new session
        const session:Session = this.driver.session();
        const result :QueryResult = await session.executeRead(tx =>
          tx.run(`MATCH (u:User {username: $userName}) RETURN u`, { userName })
        );
  
        // Close the session
        await session.close();
        // Verify the user exists
        if (result.records.length === 0) {
          throw new ValidationError(`User with username '${userName}' not found.`, "");
        }
        
        const userData: UserData = result.records[0].get('u');
        const { localWallet, localWalletKey, playerStats, password, userId, cardInventory, powerUpInventory, username, ...safeProperties } = userData.properties;
        
        // Import the user's smart wallet using the WalletService class
        const walletPromise: Promise<WalletData> = walletService.importWallet(localWallet, localWalletKey);
        const energyPromise: Promise<number> = replenishService.getEnergy(username, playerStats) ;
  
        // const statsPromise = profileService.getStats(username);
        const [walletSmart, energy ] = await Promise.all([walletPromise, energyPromise ]);
  
        // Return an object containing the user's smart wallet, safe properties, success message, and JWT token
        return {
          username,
          wallet: walletSmart,
          safeProperties,
          playerStats,
          energy,
          uuid: userId,
          accessToken,
          message: "You are now logged-in",
          success: "OK", } as ValidateSessionReturn
        } catch (error: any) {
          throw error;
        }
  };

  public async googleRegister(token: string): Promise<void> {
    const walletService: WalletService = new WalletService();
    const replenishService: Replenishments = new Replenishments();

    const googleService: GoogleService = new GoogleService();
    const playerInfo: PlayerInfo = await googleService.googleAuth(token);
    const { displayName, playerId } = playerInfo as PlayerInfo;
    const userName: string = displayName;
    const session: Session = this.driver.session();

    try {
      
      const inventoryCard: string = JSON.stringify(cardInventory);
      const statsPlayer: string = JSON.stringify(playerStats);
      const inventoryPowerUp: string = JSON.stringify(powerUpInventory);
      const equipIve: string = JSON.stringify(iveEquip);

      const password: string = await nanoid()
      const encrypted: string = await hash(password, parseInt(SALT_ROUNDS));
      const locKey: string = await hash(displayName, parseInt(SALT_ROUNDS));
  
      const localWallet: LocalWallet = await walletService.createWallet(locKey) as LocalWallet

      await session.executeWrite(
        (tx: ManagedTransaction) => tx.run(
            `
            CREATE (u:User { 
              userId: $playerId,
              username: $userName,
              password: $encrypted,
              localWallet: $localWallet, 
              localWalletKey: $locKey,
              cardInventory: $inventoryCard,
              iveEquip: $equipIve,
              playerStats: $statsPlayer,
              powerUpInventory: $inventoryPowerUp
            })
            RETURN u
          `,
            { playerId, userName , encrypted, localWallet, locKey, inventoryCard, equipIve, statsPlayer, inventoryPowerUp }
          ) 
        )
  
        // Close the session
        await session.close()
  
        // Set energy for new users to 200
        const currentTime: number = Math.floor(Date.now() / 1000);
        await replenishService.setEnergy(userName, currentTime, 200, 1)
  
      } catch (error: any) {
        // Handle unique constraints in the database
        if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
          if (error.message.includes('username')) {
            throw new ValidationError(
              `An account already exists with the email address ${userName}`,
                'Email address already taken',
            )
          }
          }
          throw error
        } finally {
          await session.close()
        }
  };

  public async googleLogin(token: string) {
    const walletService: WalletService = new WalletService();
    const profileService: ProfileService = new ProfileService();
    const replenishService: Replenishments = new Replenishments();
    const tokenService: TokenService = new TokenService();

    const googleService: GoogleService = new GoogleService();
    const playerInfo: PlayerInfo = await googleService.googleAuth(token);
    const { displayName, playerId } = playerInfo as PlayerInfo;
    const userName: string = displayName;

    try {

      const session: Session = this.driver.session();
      // Find the user node within a Read Transaction
      const result: QueryResult = await session.executeRead((tx: ManagedTransaction) =>
          tx.run('MATCH (u:User {userId: $playerId}) RETURN u', { userName, playerId })
      );

      await session.close();
      // Verify the user exists
      if (result.records.length === 0) {
          throw new ValidationError(`User with username '${userName}' not found.`, "");
      }

      // Compare Passwords
      const user: UserData = result.records[0].get('u');

      // Return User Details
      const { password, localWallet, localWalletKey, playerStats, userId, username, cardInventory, powerUpInventory, ...safeProperties } = user.properties

      const walletPromise: Promise<WalletData> = walletService.importWallet(localWallet, localWalletKey);
      const energyPromise: Promise<number> = replenishService.getEnergy(userName, playerStats);
      const statsPromise: Promise<PlayerStats> = profileService.getStats(userName)
      const [ wallet, energy, stats ] = await Promise.all([walletPromise, energyPromise, statsPromise]);

      const tokens: TokenScheme = await tokenService.generateTokens(userName);
      const { refreshToken, accessToken } = tokens as TokenScheme
      return {
          username,
          wallet,
          safeProperties,
          playerStats: stats,
          energy,
          uuid: userId,
          refreshToken,
          accessToken,
          message: 'You are now logged in',
          success: 'OK',
          loginType: 'google'

      } as AuthenticateReturn

    } catch(error: any) {

    }

  };
    
  public async googleCheck(token: string): Promise<GoogleRegistered> {
    try {
      const googleService: GoogleService = new GoogleService();
      const playerInfo: PlayerInfo = await googleService.googleAuth(token);
      const { displayName, playerId } = playerInfo as PlayerInfo;

      const session: Session = this.driver.session();
      const result: QueryResult = await session.executeRead((tx: ManagedTransaction) =>
        tx.run(`
          MATCH (u:User)
          WHERE u.username = $displayName OR u.userId = $playerId
          RETURN u
        `, { displayName, playerId })
      );
  
      // Close the session
      await session.close();
  
      // Return boolean based on the existence of records
      return { registered: result.records.length > 0 } as GoogleRegistered
    } catch (error: any) {
      throw error;
    }
  };
  
};

export default AuthService