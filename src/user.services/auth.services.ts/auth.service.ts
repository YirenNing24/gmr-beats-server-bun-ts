//**TODO SPACE IN LAST NAME SHOULD BE ALLOWED */
//**TODO SERVER VALIDATE REGISTRATION */
//**TODO ADD USERID CONSTRAINT
//**TODO ADD EMAIL IN THE CONSTRAINT */


//** CONFIGS IMPORT
import { SALT_ROUNDS } from '../../config/constants.js'

//** BCRYPT IMPORT
import { hash, compare } from 'bcrypt-ts'

//** ERROR CODES
import ValidationError from '../../outputs/validation.error.js'

//** NEW ACCOUNT DEFAULT VALUES
import { cardInventory, playerStats, powerUpInventory, iveEquip, IveEquip } from '../../noobs/noobs.js'

//**  IMPORTED SERVICES
import WalletService from '../wallet.services/wallet.service.js'
import Replenishments from '../../game.services/replenishments.services/replenishments.service.js'
import ProfileService from '../../game.services/profile.services/profile.service.js'
import TokenService from '../token.services/token.service.js'
import GoogleService from '../google.services/google.service.js'

//** UUID GENERATOR
import { nanoid } from "nanoid/async";

//** MEMGRAPH DRIVER
import { Driver, QueryResult, Session,  ManagedTransaction } from 'neo4j-driver-core'

//** TYPE INTERFACES
import { LocalWallet, WalletData, UserData, ValidateSessionReturn, AuthenticateReturn, PlayerStats, TokenScheme, PlayerInfo, User, Suspended } from '../user.service.interface.js'

//** GEO IP IMPORT
import geoip from 'geoip-lite2'
import { GoogleRegister } from './auth.interface.js'

class AuthService {

  driver: Driver
  constructor(driver: Driver) {
    this.driver = driver
    }


  // Registers a user.
  public async register(userData: User, ipAddress: string): Promise<void> {
    const walletService: WalletService = new WalletService();
    const replenishService: Replenishments = new Replenishments();

    const userId: string = await nanoid();
    const { userName, password, deviceId } = userData as User
    const encrypted: string = await hash(password, parseInt(SALT_ROUNDS));
    const locKey: string = await hash(userName, parseInt(SALT_ROUNDS));

    const wallets = await walletService.createWallet(locKey)
    const { localWallet, smartWalletAddress } = wallets
    const signupDate: number = Date.now()
    const suspended: Suspended = { until: null, reason: "" };

    const geo = geoip.lookup(ipAddress);
    const country: string | undefined = geo?.country


    const session: Session = this.driver.session();
    try {
       await session.executeWrite(
        (tx: ManagedTransaction) => tx.run(
           `
             CREATE (u:User {
               signupDate: $signupDate,
               accountType: "beats",
               userId: $userId,
               username: $userName,
               password: $encrypted,
               localWallet: $localWallet, 
               localWalletKey: $locKey,
               smartWalletAddress: $smartWalletAddress,
               playerStats: $playerStats,
               suspended: $suspended,
               country: "SOKOR",
               deviceId: $deviceId,
               inventorySize: 200,
               profilePictures: []
             })
           `,
           { signupDate, userId, userName, encrypted, localWallet, smartWalletAddress, locKey, playerStats, suspended, country, deviceId }
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

  // Authenticates a user with the provided username and unencrypted password.
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
        const { password, localWallet, localWalletKey, playerStats, userId, username, ...safeProperties } = user.properties

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

  // Authenticates a user using JWT for auto-login.
  public async validateSession(token: string): Promise<ValidateSessionReturn>  {
      try {
        // Create a new instance of the needed services class
        const walletService: WalletService = new WalletService();
        const replenishService: Replenishments = new Replenishments();
        const tokenService: TokenService = new TokenService();
  
        const accessRefresh:  TokenScheme = await tokenService.verifyRefreshToken(token)
        const { userName, accessToken, refreshToken  } = accessRefresh as  TokenScheme
  
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
        const { localWallet, localWalletKey, playerStats, password, userId, username, ...safeProperties } = userData.properties;
        
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
          refreshToken,
          message: "You are now logged-in",
          success: "OK", 
          loginType: 'beats',} as ValidateSessionReturn
        } catch (error: any) {
          throw error;
        }
    };

  public async googleRegister(body: GoogleRegister , ipAddress: string): Promise<void | ValidationError> {

    const walletService: WalletService = new WalletService();
    const replenishService: Replenishments = new Replenishments();

    const googleService: GoogleService = new GoogleService();

    const { serverToken, deviceId } = body
    const playerInfo: PlayerInfo = await googleService.googleAuth(serverToken);
    const { displayName, playerId } = playerInfo as PlayerInfo;

    const userName: string = displayName;
    const signupDate: number = Date.now()
    const suspended: Suspended = { until: null, reason: "" };

    const geo = geoip.lookup(ipAddress);
    const country: string | undefined = geo?.country
    const session: Session = this.driver.session();

    try {
      const password: string = await nanoid()
      const encrypted: string = await hash(password, parseInt(SALT_ROUNDS));
      const locKey: string = await hash(displayName, parseInt(SALT_ROUNDS));

      const wallets = await walletService.createWallet(locKey);
      const { localWallet, smartWalletAddress } = wallets

      await session.executeWrite(
        (tx: ManagedTransaction) => tx.run(
            `
            CREATE (u:User {
              signupDate: $signupDate,
              accountType: "google",
              userId: $playerId,
              username: $userName,
              password: $encrypted,
              localWallet: $localWallet, 
              localWalletKey: $locKey,
              smartWalletAddress: $smartWalletAddress, 
              playerStats: $playerStats,
              suspended: $suspended,
              country: "SOKOR",
              deviceId: $deviceId,
              inventorySize: 200,
              profilePictures: []
            })
          `,
          { signupDate, playerId, userName, encrypted, localWallet, smartWalletAddress, locKey, playerStats, suspended, country, deviceId }
          ) 
        )
  
        // Close the session
        await session.close()
  
        // Set energy for new users to 200
        const currentTime: number = Math.floor(Date.now() / 1000);
        await replenishService.setEnergy(userName, currentTime, 200, 1)
  
      } catch (error: any) {
        console.log(error)
        // Handle unique constraints in the database
        if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
          if (error.message.includes('userId')) {
            return new ValidationError(`An account already exists`,'An account already exists')}
          }

        if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
          if (error.message.includes('username')) {
              return new ValidationError(`An account already exists`,'An account already exists')}
          }
          throw error
        } finally {
          await session.close()
        }
    };

  // Logins a user using Google Auth
  public async googleLogin(token: string): Promise<AuthenticateReturn | ValidationError> {
    const googleService: GoogleService = new GoogleService();
    const playerInfo: PlayerInfo = await googleService.googleAuth(token);
    const { displayName, playerId } = playerInfo as PlayerInfo;

    const userName: string = displayName;

    const walletService: WalletService = new WalletService();
    const profileService: ProfileService = new ProfileService();
    const replenishService: Replenishments = new Replenishments();
    const tokenService: TokenService = new TokenService();

    try {

      const session: Session = this.driver.session();
      // Find the user node within a Read Transaction
      const result: QueryResult = await session.executeRead((tx: ManagedTransaction) =>
          tx.run('MATCH (u:User {userId: $playerId}) RETURN u', { playerId })
      );

      await session.close();
      // Verify the user exists
      if (result.records.length === 0) {
          console.log('none')
          return new ValidationError(`User with playerId '${playerId}' not found.`, "");
      }

      // Compare Passwords
      const user: UserData = result.records[0].get('u');

      // Return User Details
      const { password, localWallet, localWalletKey, playerStats, userId, username, ...safeProperties } = user.properties

      const walletPromise: Promise<WalletData> = walletService.importWallet(localWallet, localWalletKey);
      const energyPromise: Promise<number> = replenishService.getEnergy(userName, playerStats);
      const statsPromise: Promise<PlayerStats> = profileService.getStats(userName)
      const [ wallet, energy, stats ] = await Promise.all([walletPromise, energyPromise, statsPromise]);

      const tokens: TokenScheme = await tokenService.generateTokens(playerId);
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
      throw error

    }

    };





 
};

export default AuthService