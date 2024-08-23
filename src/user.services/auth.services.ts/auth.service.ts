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
import { playerStats } from '../../noobs/noobs.js'

//**  IMPORTED SERVICES
import WalletService from '../wallet.services/wallet.service.js'
import TokenService from '../token.services/token.service.js'
import GoogleService from '../google.services/google.service.js'

//** UUID GENERATOR
import { nanoid } from "nanoid/async";

//** MEMGRAPH DRIVER
import { Driver, QueryResult, Session,  ManagedTransaction } from 'neo4j-driver-core'

//** TYPE INTERFACES
import { WalletData, UserData, ValidateSessionReturn, AuthenticateReturn, TokenScheme, PlayerInfo, User, Suspended } from '../user.service.interface.js'

//** GEO IP IMPORT
import geoip from 'geoip-lite2'
import { GoogleRegister } from './auth.interface.js'
class AuthService {

  driver: Driver
  constructor(driver: Driver) {
    this.driver = driver
    };


  // Registers a user.
  public async register(userData: User, ipAddress: string): Promise<void> {
    const walletService: WalletService = new WalletService();
  
    const userId: string = await nanoid();
    const { userName, password, deviceId } = userData as User;
    const encrypted: string = await hash(password, parseInt(SALT_ROUNDS));

    const smartWalletAddress: string = await walletService.createWallet(userName);
    const signupDate: number = Date.now();
    const suspended: Suspended = { until: null, reason: "" };
  
    const geo = geoip.lookup(ipAddress);
    const country: string | undefined = geo?.country || "SOKOR";
  
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
            smartWalletAddress: $smartWalletAddress,
            playerStats: $playerStats,
            suspended: $suspended,
            country: $country,
            deviceId: $deviceId,
            inventorySize: 200
          })
          `,
          { signupDate, userId, userName, encrypted, smartWalletAddress, suspended, country, deviceId, playerStats }
        )
      );
  
    } catch (error: any) {
      // Handle unique constraints in the database
      if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
        if (error.message.includes('username')) {
          throw new ValidationError(
            `An account already exists with the username ${userName}`,
            'Username already taken',
          );
        }
      }
      throw error;
    } finally {
      await session.close();
    }
    }
  

  // Authenticates a user with the provided username and unencrypted password.
  public async authenticate(userName: string, unencryptedPassword: string): Promise<AuthenticateReturn> {
    const walletService: WalletService = new WalletService();
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
            throw new ValidationError('Incorrect password.', "Incorrect password");
        }
        // Return User Details
        const { password, smartWalletAddress, playerStats, userId, username, ...safeProperties } = user.properties

        const walletPromise: Promise<WalletData> = walletService.getWalletBalance(smartWalletAddress);
        const [ wallet ] = await Promise.all([ walletPromise ]);

        const tokens: TokenScheme = await tokenService.generateTokens(userName);
        const { refreshToken, accessToken } = tokens as TokenScheme
        return {
            username,
            wallet,
            safeProperties,
            playerStats,
            uuid: userId,
            refreshToken,
            accessToken,
            message: 'You are now logged in',
            success: 'OK',
            loginType: 'beats'

        } as AuthenticateReturn
    } catch (error: any) {
        console.log(error)
        throw error;
    }
    }

  // Authenticates a user using JWT for auto-login.
  public async validateSession(token: string): Promise<ValidateSessionReturn>  {
      try {
        // Create a new instance of the needed services class
        const walletService: WalletService = new WalletService();
        const tokenService: TokenService = new TokenService();
  
        const accessRefresh: TokenScheme = await tokenService.verifyRefreshToken(token);

        const { userName, accessToken, refreshToken  } = accessRefresh as  TokenScheme;
  
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
        const { smartWalletAddress, playerStats, password, userId, username, ...safeProperties } = userData.properties;
        
        // Import the user's smart wallet using the WalletService class
        const walletPromise: Promise<WalletData> = walletService.getWalletBalance(smartWalletAddress);
  
        // const statsPromise = profileService.getStats(username);
        const [ walletSmart ] = await Promise.all([walletPromise]);
  
        // Return an object containing the user's smart wallet, safe properties, success message, and JWT token
        return {
          username,
          wallet: walletSmart,
          safeProperties,
          playerStats,
          uuid: userId,
          accessToken,
          refreshToken,
          message: "You are now logged-in",
          success: "OK", 
          loginType: 'beats',} as ValidateSessionReturn
        } catch (error: any) {
          console.log(error)
          throw error;
        }
    }


  public async googleRegister(body: GoogleRegister , ipAddress: string): Promise<void | ValidationError> {
    const walletService: WalletService = new WalletService();
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
      const smartWalletAddress: string = await walletService.createWallet(userName);

      await session.executeWrite(
        (tx: ManagedTransaction) => tx.run(
            `
            CREATE (u:User {
              signupDate: $signupDate,
              accountType: "google",
              userId: $playerId,
              username: $userName,
              password: $encrypted,
              smartWalletAddress: $smartWalletAddress, 
              playerStats: $playerStats,
              suspended: $suspended,
              country: "SOKOR",
              deviceId: $deviceId,
              inventorySize: 200,
            })
          `,
          { signupDate, playerId, userName, encrypted, smartWalletAddress, playerStats, suspended, country, deviceId }
          ) 
        )
  
        // Close the session
        await session.close()
  
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
    }

  // Logins a user using Google Auth
  public async googleLogin(token: string): Promise<AuthenticateReturn | ValidationError> {
    const googleService: GoogleService = new GoogleService();
    const playerInfo: PlayerInfo = await googleService.googleAuth(token);
    const { playerId } = playerInfo as PlayerInfo;


    const walletService: WalletService = new WalletService();
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
      const { password, smartWalletAddress, playerStats, userId, username, ...safeProperties } = user.properties

      const walletPromise: Promise<WalletData> = walletService.getWalletBalance(smartWalletAddress);
      const [ wallet ] = await Promise.all([walletPromise ]);

      const tokens: TokenScheme = await tokenService.generateTokens(playerId);
      const { refreshToken, accessToken } = tokens as TokenScheme
      return {
          username,
          wallet,
          safeProperties,
          playerStats,
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

    }


};

export default AuthService