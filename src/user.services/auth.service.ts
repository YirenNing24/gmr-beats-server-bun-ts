import { JWT_SECRET, SALT_ROUNDS } from '../config/constants'
import { hash, compare } from 'bcrypt-ts'

import ValidationError from '../errors/validation.error'
import { cardInventory, playerStats, powerUpInventory } from '../noobs/noobs'

import WalletService from './wallet.service'
import Replenishments from '../game.services/replenishments.service.js'
import ProfileService from '../game.services/profile.service'
//** UUID GENERATOR */
import { nanoid } from "nanoid/async";
import { Driver, QueryResult, Session } from 'neo4j-driver-core'
import jwt  from 'jsonwebtoken'




export default class AuthService {
  /**
   * @type {neo4j.Driver}
   */
  private driver: Driver;

  /**
   * The constructor expects an instance of the Neo4j Driver, which will be
   * used to interact with Neo4j.
   *
   * @param {neo4j.Driver} driver
   */
  constructor(driver: Driver) {
      this.driver = driver;
  }


  async register(anon: boolean, email: string, password: string, userName: string, firstName: string, lastName: string) {
    const walletService = new WalletService();
    const replenishService = new Replenishments()

    const userId:string = await nanoid()
    const inventoryCard:string = JSON.stringify(cardInventory);
    const statsPlayer:string = JSON.stringify(playerStats)
    const inventoryPowerUp:string = JSON.stringify(powerUpInventory)
    
    const encrypted:string = await hash(password, parseInt(SALT_ROUNDS))
    const locKey:string = await hash(userName, parseInt(SALT_ROUNDS))

    const localWallet = await walletService.createWallet(locKey)
    // Open a new session
    const session:Session = this.driver.session()
    try {
      // Create the User node in a write transaction
       const res:QueryResult = await session.executeWrite(
         tx => tx.run(
           `
             CREATE (u:User {
               userId: $userId,
               anon: $anon,
               email: $email,
               username: $userName,
               password: $encrypted,
               firstName: $firstName,
               lastName: $lastName,
               localWallet: $localWallet, 
               localWalletKey: $locKey,
               cardInventory: $inventoryCard,
               playerStats: $statsPlayer,
               powerUpInventory: $inventoryPowerUp,
               profilePics: $profilePics
             })
             RETURN u
           `,
           { userId, anon, email, userName, encrypted, firstName, lastName, localWallet, locKey, inventoryCard, statsPlayer, inventoryPowerUp, profilePics: [] }
         ) 
       )
      // Extract the user from the result
      const [ first ] = res.records
      const node:any = first.get('u')

      const { password, ...safeProperties } = node.properties
      // Close the session
      await session.close()

      // Set energy for new users to 200
      const currentTime = Math.floor(Date.now() / 1000);
      await replenishService.setEnergy(userName, currentTime, 200, 1)

      return { ...safeProperties }
    } catch (error: any) {
      // Handle unique constraints in the database
      if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
        if (error.message.includes('email')) {
          throw new ValidationError(
            `An account already exists with the email address ${email}`,
              'Email address already taken',
          )
        } else if (error.message.includes('username')) {
          throw new ValidationError(
            `An account already exists with the username ${userName}`,
              'Username already taken',
          )
        }
      }
      // Non-neo4j error
      throw error
    } finally {
      // Close the session
      await session.close()
    }
  }

  async authenticate(userName: string, unencryptedPassword: string) {
    const walletService = new WalletService();
    const replenishService = new Replenishments();

    //@ts-ignore
    const profileService = new ProfileService();

    try {
      // Open a new session
      const session:Session = this.driver.session();
  
      // Find the user node within a Read Transaction
      const res:QueryResult = await session.executeRead(tx =>
        tx.run('MATCH (u:User {username: $userName}) RETURN u', { userName })
      );
      // Close the session
      await session.close();
      // Verify the user exists
      if (res.records.length === 0) {
        //@ts-ignore
        throw new ValidationError(`User with username '${userName}' not found.`, {});
      }

      // Compare Passwords
      const user = res.records[0].get('u');
      const encryptedPassword:string = user.properties.password;
      const correct:boolean = await compare(unencryptedPassword, encryptedPassword);
      if (!correct) {
        //@ts-ignore
        throw new ValidationError('Incorrect password.', {});  
      }
      // Return User Details
      const { password, localWallet, localWalletKey, smartWallet, playerStats, username, userId, ...safeProperties  } = user.properties;
  
      const walletPromise = walletService.importWallet(localWallet, localWalletKey);
      const energyPromise = replenishService.getEnergy(userName, playerStats);
      const statsPromise = profileService.getStats(userName)
      const [wallet, energy, stats] = await Promise.all([walletPromise, energyPromise, statsPromise ]);
      
      return {
        energy, wallet, playerStats: stats, username,
        ...safeProperties,
        uuid: user.properties.userId,


        token: jwt.sign(username, JWT_SECRET, {expiresIn: "1h"}),
      };
    } catch (error) {
      throw error;
    }
  }

async validateSession(username: string) {
  try {
    // Create a new instance of the WalletService class
    const walletService = new WalletService();
    const replenishService = new Replenishments();

    //@ts-ignore
    // const profileService = new ProfileService();

    // Open a new session
    const session: Session = this.driver.session();
    const res: QueryResult = await session.executeRead(tx =>
      tx.run('MATCH (u:User {username: $username}) RETURN u', { username })
    );

    // Close the session
    await session.close();
    // Verify the user exists
    if (res.records.length === 0) {

      //@ts-ignore
      throw new ValidationError(`User with username '${username}' not found.`, {});
    }
    
    const userData = res.records[0].get('u');
    const { localWallet, localWalletKey, playerStats, password, ...safeProperties } = userData.properties;
    
    // Import the user's smart wallet using the WalletService class
    const walletPromise = walletService.importWallet(localWallet, localWalletKey);
    const energyPromise = replenishService.getEnergy(username, playerStats) ;
    // const statsPromise = profileService.getStats(username);
    const [walletSmart, energy ] = await Promise.all([walletPromise, energyPromise ]);
    // Return an object containing the user's smart wallet, safe properties, success message, and JWT token
    return {
      wallet: walletSmart,
      username, ...safeProperties, 
      playerStats,
      success: "OK", energy };
  } catch (error) {
    console.log(error)
    throw error;
  }
  }



async resetPassword(username: string, email: string) {

}


}