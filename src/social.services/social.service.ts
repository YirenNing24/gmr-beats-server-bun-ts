//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, Session } from "neo4j-driver";

//** RETHINK DB
import rt from "rethinkdb";
import { getRethinkDB } from "../db/rethink";

//** ERROR CODES
import ValidationError from "../outputs/validation.error";

//** TYPE INTERFACE IMPORTS
import { FollowResponse, ViewProfileData, ViewedUserData, MutualData, PlayerStatus, SetPlayerStatus } from "./social.services.interface";

//** IMPORTED SERVICES 
import TokenService from "../user.services/token.services/token.service";

class SocialService {
    /**
   * Creates an instance of the SocialService class.
   *
   * @constructor
   * @param {Driver} driver - The Neo4j driver for database interactions.
   */
  private driver:Driver
  constructor(driver: Driver) {
    /**
     * The Neo4j driver for database interactions.
     * @type {Driver}
     */
    this.driver = driver;
  }
  /**
 * Follows a user.
 *
 * @param {string} follower - The username of the follower.
 * @param {string} toFollow - The username of the user to follow.
 * @returns {Promise<FollowResponse>} A promise that resolves to a FollowResponse indicating the follow status.
 * @throws {Error} If the user to follow is not found.
 */
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

      if ( result.records.length === 0 ) {
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

  /**
   * Retrieves profile information for a user's view of another user's profile.
   *
   * @param {string} userName - The username of the user making the request.
   * @param {string} viewUsername - The username of the user whose profile is being viewed.
   * @returns {Promise<ViewProfileData>} A promise that resolves to ViewProfileData containing profile information.
   * @throws {ValidationError} If the user with the specified viewUsername is not found.
   */
  public async viewProfile(viewUsername: string, token: string): Promise<ViewProfileData> {
    /**
     * @typedef {Object} ViewProfileData
     * @property {string} username - The username of the viewed user.
     * @property {PlayerStats} playerStats - The player statistics of the viewed user.
     * @property {boolean} followsUser - Indicates if the user making the request follows the viewed user.
     * @property {boolean} followedByUser - Indicates if the viewed user follows the user making the request.
     */

    const tokenService:  TokenService = new TokenService();
    const userName: string = await tokenService.verifyAccessToken(token);

    const session: Session = this.driver.session();
    try {
      const result = await session.executeRead(async (tx: ManagedTransaction) => {
        const [userQuery, followQuery, followedByQuery] = await Promise.all([
          tx.run('MATCH (u:User {username: $viewUsername}) RETURN u', 
            { viewUsername }),
          tx.run(`
            MATCH (u:User {username: $userName})-[:FOLLOW]->(v:User {username: $viewUsername})
            RETURN COUNT(v) > 0 AS followsUser`,
            { userName, viewUsername }),
          tx.run(`
            MATCH (v:User {username: $viewUsername})-[:FOLLOW]->(u:User {username: $userName})
            RETURN COUNT(u) > 0 AS followedByUser`,
            { userName, viewUsername }),
        ]);

        if (userQuery.records.length === 0) {
          throw new ValidationError(`User with username '${viewUsername}' not found.`, "");
        }

        const user = userQuery.records[0].get('u');
        const { username, playerStats } = user.properties as ViewedUserData;

        const followsUser: boolean = followQuery.records[0].get('followsUser');
        const followedByUser: boolean = followedByQuery.records[0].get('followedByUser');

        return { username, playerStats, followsUser, followedByUser };
      });

      return result;
    } catch (error: any) {
      throw error;
    } finally {
      if (session) {
        await session.close();
      }
    }
  };


  //Retrieves a list of users who are mutual followers with the specified user.
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
    /**
     * @typedef {Object} PlayerStatus
     * @property {string} username - The username of a mutual follower.
     * @property {number} lastOnline - The timestamp representing the last online time of the mutual follower.
     * @property {string} status - The online status of the mutual follower.
     */

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

/**
   * Sets the online status for a user in the system.
   *
   * @param {string} username - The username of the user for whom the online status is to be set.
   * @param {string} activity - The activity description of the user.
   * @param {string} userAgent - The user agent string representing the user's browser.
   * @param {string} osName - The name of the operating system used by the user.
   * @param {string} ipAddress - The IP address from which the user is accessing the system.
   * @returns {Promise<void>} A promise that resolves once the online status is successfully set.
   * @throws {Error} If an error occurs during the status setting process.
   */
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
  
};


export default SocialService