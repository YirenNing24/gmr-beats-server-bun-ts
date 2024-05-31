//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, Session } from "neo4j-driver";

//** RETHINK DB
import rt from "rethinkdb";
import { getRethinkDB } from "../db/rethink";

//**THIRDWEB IMPORT
import { Edition, ThirdwebSDK } from "@thirdweb-dev/sdk";

//** ERROR CODES
import ValidationError from "../outputs/validation.error";

//** TYPE INTERFACE IMPORTS
import { FollowResponse, ViewProfileData, ViewedUserData, MutualData, PlayerStatus, SetPlayerStatus, CardGiftData, CardGiftSending } from "./social.services.interface";

//** IMPORTED SERVICES 
import TokenService from "../user.services/token.services/token.service";
import { CardMetaData } from "../game.services/inventory.services/inventory.interface";
import { SuccessMessage } from "../outputs/success.message";
import { UserData } from "../user.services/user.service.interface";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { CHAIN, EDITION_ADDRESS, SECRET_KEY, SMART_WALLET_CONFIG } from "../config/constants";
import { SmartWallet } from "@thirdweb-dev/wallets";

class SocialService {

  private driver:Driver
  constructor(driver: Driver) {

  this.driver = driver;
  }

  public async follow(follower: string, toFollow: string, token: string): Promise<FollowResponse> {
    try {

      const tokenService: TokenService = new TokenService();
      const userName: string = await tokenService.verifyAccessToken(token);


      if (userName !== follower) {
        throw new Error("Unauthorized")
      }
      const session: Session = this.driver.session();
      const result: QueryResult = await session.executeWrite((tx: ManagedTransaction) =>
        tx.run( 
          `
          MATCH (u:User {username: $follower}) 
          MATCH (p:User {username: $toFollow})
          MERGE (u)-[r:FOLLOW]->(p)
          ON CREATE SET u.createdAt = timestamp()
          RETURN p 
          {.*, 
            followed: true} 
            AS follow
          `,
          { follower, toFollow }
        ));
      await session.close();

      if (result.records.length === 0) {
        throw new Error(
          `User to follow not found`
        )
      } else {
        return { status: "Followed" } as FollowResponse;
       
      }
    } catch (error: any) {
      console.error("Something went wrong: ", error);
      throw error;
    }
  };

  /**
   * Unfollows a user.
   *
   * @param {string} follower - The username of the follower.
   * @param {string} toUnfollow - The username of the user to unfollow.
   * @returns {Promise<FollowResponse>} A promise that resolves to a FollowResponse indicating the unfollow status.
   * @throws {Error} If the user to unfollow is not found.
   */
  public async unfollow(follower: string, toUnfollow: string, token: string): Promise<FollowResponse> {
    try {

      const tokenService: TokenService = new TokenService();
      const userName: string = await tokenService.verifyAccessToken(token);

      if (userName !== follower) {
        throw new Error("Unauthorized")
      }

      const session = this.driver.session();
      const result: QueryResult = await session.executeWrite((tx: ManagedTransaction) =>
        tx.run( 
          `
          MATCH (u:User {username: $follower})-[r:FOLLOW]->(p:User {username: $toUnfollow})
          DELETE r
          RETURN p {.*, 
            followed: false
          } AS unfollow
          `,
          { follower, toUnfollow }
        ));
      await session.close();

      if (result.records.length === 0) {
        throw new Error("User to unfollow not found");
      } else {
        return { status: "Unfollowed"} as FollowResponse;
      }
    } catch (error: any) {
      console.error("Something went wrong: ", error);
      throw error;
    }
  };

  //** Retrieves profile information for a user's view of another user's profile.

  public async viewProfile(viewUsername: string, token: string): Promise<ViewProfileData> {
    const tokenService: TokenService = new TokenService();
    const userName: string = await tokenService.verifyAccessToken(token);
  
    const session: Session = this.driver.session();
    try {
      const result = await session.executeRead(async (tx: ManagedTransaction) => {
        const [userQuery, followQuery, followedByQuery, soul] = await Promise.all([
          tx.run('MATCH (u:User {username: $viewUsername}) RETURN u', { viewUsername }),
          tx.run(`
            MATCH (u:User {username: $userName})-[:FOLLOW]->(v:User {username: $viewUsername})
            OPTIONAL MATCH (u)-[:SOUL]->(s:Soul)
            RETURN COUNT(v) > 0 AS followsUser, s as Soul`,
            { userName, viewUsername }
          ),
          tx.run(`
            MATCH (v:User {username: $viewUsername})-[:FOLLOW]->(u:User {username: $userName})
            RETURN COUNT(u) > 0 AS followedByUser`,
            { userName, viewUsername }
          ),
          tx.run(`
          MATCH (u:User {username: $viewUsername})-[:SOUL]->(s:Soul)
          RETURN s as Soul`,
          { viewUsername }
        )
        ]);
  
        if (userQuery.records.length === 0) {
          throw new ValidationError(`User with username '${viewUsername}' not found.`, "");
        };
  
        const user = userQuery.records[0].get('u');
        let userSoul = {}
        if (soul.records.length === 0) {
          userSoul = {}
        }
        else{
          userSoul = soul.records[0].get('Soul').properties;
        }

        const { username, playerStats } = user.properties as ViewedUserData;

        const followsUser: boolean = followQuery.records.length > 0 ? followQuery.records[0].get('followsUser') : false;
        const followedByUser: boolean = followedByQuery.records.length > 0 ? followedByQuery.records[0].get('followedByUser') : false;
  
        return { username, playerStats, userSoul, followsUser, followedByUser } as ViewProfileData;
      });
  
      return result as ViewProfileData;
    } catch (error: any) {
      console.log(error);
      throw error;
    } finally {
      if (session) {
        await session.close();
      }
    }
  };
  


  //** Retrieves a list of users who are mutual followers with the specified user.
   public async mutual(token: string): Promise<MutualData[]> {
    try {
      const tokenService:  TokenService = new TokenService();
      const username: string = await tokenService.verifyAccessToken(token);
      
      const session: Session = this.driver.session();
      const result: QueryResult = await session.executeRead((tx: ManagedTransaction) =>
        tx.run(
          `
          MATCH (u1:User {username: $username})-[:FOLLOW]->(u2),
                (u2)-[:FOLLOW]->(u1)
          RETURN u2.username as username, u2.playerStats as playerStats
          `,
          { username }
        ));
      await session.close();

      const users: MutualData[] = result.records.map(record => ({
        username: record.get("username") || "",
        playerStats: record.get("playerStats") || "" })) as MutualData[];

      return users as MutualData[];
    } catch (error: any) {
      console.error("Something went wrong: ", error);
      throw error;
    }
  };


  /**
   * Retrieves the online status of mutual followers for the specified user.
   *
   * @param {string} username - The username of the user for whom mutual followers' status is to be retrieved.
   * @returns {Promise<PlayerStatus[]>} A promise that resolves to an array of PlayerStatus representing online status of mutual followers.
   * @throws {Error} If an error occurs during the retrieval process.
   */
  public async mutualStatus(token: string): Promise<PlayerStatus[]> {
    try {
      const tokenService: TokenService = new TokenService();
      const username: string = await tokenService.verifyAccessToken(token);

      const session: Session = this.driver.session();
      const result: QueryResult = await session.executeRead((tx: ManagedTransaction) =>
        tx.run(
          `
          MATCH (u1:User {username: $username})-[:FOLLOW]->(u2),
                (u2)-[:FOLLOW]->(u1)
          RETURN COLLECT(u2.username) AS mutualFollowers
          `,
          { username }
        )
      );

      const mutualFollowers: string[] = result.records[0].get('mutualFollowers');

      // Close the Neo4j session
      await session.close();

      // RethinkDB query using the mutual followers' usernames
      const connection: rt.Connection = await getRethinkDB();
      const onlineMutuals: rt.Cursor = await rt
        .db('beats')
        .table('status')
        .getAll(...mutualFollowers)
        .limit(1)
        .orderBy(rt.desc('lastOnline'))
        .run(connection);

      const mutualsOnline = await onlineMutuals.toArray() as PlayerStatus[];
      return mutualsOnline;
    } catch (error: any) {
      throw error;
    }
  }


   //* Sets the online status for a user in the system.
  public async setStatusOnline(activity: string, userAgent: string, osName: string, ipAddress: string, token: string): Promise<void> {

    try {
      const tokenService: TokenService = new TokenService();
      const username: string = await tokenService.verifyAccessToken(token);

      const playerStatus: SetPlayerStatus = {
        username,
        status: true,
        activity,
        lastOnline: Date.now(),
        userAgent,
        osName,
        ipAddress,
      };

      const connection: rt.Connection = await getRethinkDB();
      await rt
        .db('beats')
        .table('status')
        .insert(playerStatus)
        .run(connection);
    } catch (error: any) {
      throw error;
    }
  }

  public async sendCardGift(token: string, cardGiftData: CardGiftData): Promise<SuccessMessage> {
    const session: Session | undefined = this.driver?.session();
    const tokenService: TokenService = new TokenService();
  
    try {
      const { receiver, cardName, id } = cardGiftData as CardGiftData
      const userName: string = await tokenService.verifyAccessToken(token);
      const result: QueryResult | undefined = await session?.executeRead((tx: ManagedTransaction) =>
        tx.run(`
        MATCH (u:User {username: $userName})-[:INVENTORY]->(c:Card {name: $name, id: $id})
        MATCH (r:User {username: $receiver})
        MATCH (u)-[:FOLLOW]->(r)
        MATCH (r)-[:FOLLOW]->(u)
        RETURN u.smartWalletAddress as smartWalletAddress, c as Card, r.smartWalletAddress as receiverWalletAddress, u.localWallet as localWallet, u.localWalletKey as localWalletKey`,
        { userName, name: cardName, id, receiver })
      );
  
      if (result && result.records.length > 0) {
        const record = result.records[0];
        const smartWalletAddress: string = record.get('smartWalletAddress');
        const receiverWalletAddress: string = record.get('receiverWalletAddress');
        const localWallet: string = record.get('localWallet');
        const localWalletKey: string = record.get('localWalletKey');
  
        // Call the cardGiftSending function with the obtained addresses and cardData

        const cardGiftSend: CardGiftSending = { localWallet, localWalletKey, senderWalletAddress: smartWalletAddress, receiverWalletAddress};
        await this.cardGiftSending(cardGiftData, cardGiftSend, userName);
      } else {
        throw new Error("No matching records found or users do not follow each other");
      }
  
      return new SuccessMessage("Card gift sent");
    } catch (error: any) {
      throw error;
    } finally {
      if (session) {
        await session.close();
      }
    }
  }
  
  private async cardGiftSending(cardGiftData: CardGiftData, cardGiftSending: CardGiftSending, userName: string) {
    try {

      await this.sendGifromWallet(cardGiftSending, cardGiftData); 
      const { receiver, id, cardName } = cardGiftData
      const session: Session | undefined = this.driver?.session();
      await session?.executeWrite((tx: ManagedTransaction) =>
        tx.run(`
        MATCH (u:User {username: $userName})-[e:INVENTORY]->(c:Card {name: $name, id: $id})
        MATCH (r:User {username: $receiver})
        CREATE (r)-[:INVENTORY]->(C)
        DELETE e`,
        { userName, name: cardName, id, receiver })
      );

    } catch (error: any) {
      console.error('Error sending card gift:', error);
      throw error;
    }
  }
  

  private async sendGifromWallet(cardGfitSending: CardGiftSending, cardData: CardGiftData) {
    try {

      const { localWalletKey, localWallet, receiverWalletAddress } = cardGfitSending;

      const wallet: LocalWalletNode = new LocalWalletNode({ chain: CHAIN });
      await wallet.import({
        encryptedJson: localWallet,
        password: localWalletKey,
      });

      // Connect the smart wallet
      const smartWallet: SmartWallet = new SmartWallet(SMART_WALLET_CONFIG);
      await smartWallet.connect({
        personalWallet: wallet,
      });

      // Use the SDK normally
      const sdk: ThirdwebSDK = await ThirdwebSDK.fromWallet(smartWallet, CHAIN, {
        secretKey: SECRET_KEY,
      });

      const cardContract: Edition = await sdk.getContract(EDITION_ADDRESS, 'edition');
      await cardContract.transfer(receiverWalletAddress, cardData.id, 1)

    } catch(error: any) {
      throw error
    }
  }
  
  
  
};


export default SocialService