//** MEMGRAPH IMPORT
import { Driver, ManagedTransaction, QueryResult, RecordShape, Session } from "neo4j-driver";
import { getDriver } from '../../db/memgraph';

//** RETHINK DB IMPORT
import rt from "rethinkdb";
import { getRethinkDB } from "../../db/rethink";

//** OUTPUT IMPORTS
import ValidationError from "../../outputs/validation.error";
import { SuccessMessage } from "../../outputs/success.message";

//** SERVICE IMPORT
import TokenService from "../../user.services/token.service";

//** TYPE INTERFACES
import { UpdateStatsFailed, ProfilePicture, StatPoints } from "./profile.interface";
import { PlayerStats } from "../../user.services/user.service.interface";

class ProfileService {

  driver?: Driver;
  constructor(driver?: Driver) {
    this.driver = driver;
  }


  //Updates the statistics of a user based on the provided stat points.
  public async updateStats(statPoints: StatPoints, token: string): Promise<any | UpdateStatsFailed> {
    try {
        const tokenService: TokenService = new TokenService();
        const username: string = await tokenService.verifyAccessToken(token);

        const session: Session | undefined = this.driver?.session();
        if (!session) throw new Error('Session is undefined');

        const result: QueryResult<RecordShape> | undefined = await session.executeRead(tx =>
            tx.run(`MATCH (u:User {username: $username}) RETURN u.playerStats`, { username })
        );

        if (!result?.records.length) throw new ValidationError(`User with username '${username}' not found.`, "");

        const userData = result?.records[0].get('u.playerStats');
        const playerStats: PlayerStats = JSON.parse(userData);

        const { level, playerExp, availStatPoints, rank, statPointsSaved } = playerStats;
        const { mainVocalist, rapper, leadDancer, leadVocalist, mainDancer, visual, leadRapper } = statPoints;
        const totalStatPointsAdded =
            mainVocalist + rapper + leadDancer + leadVocalist + mainDancer + visual + leadRapper;

        if (
            Object.values(statPoints).some(val => val < 0) ||
            totalStatPointsAdded > availStatPoints
        ) throw new ValidationError(`Invalid stat changes detected.`, "");

        const newAvailStatPoints = Math.max(0, availStatPoints - totalStatPointsAdded);
        const updatedStatPointsSaved = {
            mainVocalist,
            rapper,
            leadDancer,
            leadVocalist,
            mainDancer,
            visual,
            leadRapper,
        };

        const updatedPlayerStats: PlayerStats = { level, playerExp, availStatPoints: newAvailStatPoints, rank, statPointsSaved: updatedStatPointsSaved };
        await session.executeWrite(tx =>
            tx.run(`MATCH (u:User {username: $username}) SET u.playerStats = $newPlayerStats`, { username, updatedPlayerStats })
        );
        await session.close();

        return { success: true, message: 'Stats updated successfully.', updatedPlayerStats };
    } catch (error: any) {
        console.error("Error updating stats:", error);
        return { success: false, message: 'Error updating stats.' } as UpdateStatsFailed;
    }
};

  //Retrieves the statistics of a player from the database.
  public async getStats(username: string): Promise<PlayerStats> {
    try {

        // Get the Neo4j driver instance
        const driver: Driver = getDriver();
        const session: Session = driver.session();

        // Execute a read transaction to retrieve playerStats
        const result: QueryResult<RecordShape> | undefined = await session.executeRead(
            tx => tx.run(
                `MATCH (u:User {username: $username})
                RETURN u.playerStats`,
                { username }
            )
        );
          // Close the database session
          await session.close();
          // Check if user exists in the database
          if (result.records.length === 0) {
              throw new ValidationError(`User with username '${username}' not found.`, "");
          }
          // Get playerStats from the query result and return it
          const playerStats: PlayerStats = result.records[0].get('u.playerStats');
          return playerStats;
      } catch (error: any) {
        console.error("Error getting stats:", error);
        throw error;
      }
    };

  //Uploads a profile picture for the user
  public async uploadProfilePic(bufferData: number[], token: string): Promise<SuccessMessage> {
      try {

        const tokenService: TokenService = new TokenService();
        const userName: string = await tokenService.verifyAccessToken(token);

        const session: Session | undefined = this.driver?.session();
    
        // Find the user node within a Read Transaction
        const result: QueryResult | undefined = await session?.executeRead((tx: ManagedTransaction) =>
          tx.run(`
            MATCH (u:User {username: $userName})
            RETURN u
            OR
            MATCH (u:User {username: $username})
            RETURN u
          `, { userName })
        );
    
        await session?.close();
    
        // Verify the user exists
        if (result?.records.length === 0) {
          throw new ValidationError(`User with username '${userName}' not found.`, "");
        }
    
        // Check the number of existing profile pictures for the user
        const existingProfilePicsCount: number = await this.getProfilePicsCount(userName);
    
        if (existingProfilePicsCount >= 5) {
          throw new ValidationError(`You already have 5 profile pictures.`, "");
        }
    
        const uploadedAt: number = Date.now();
        const fileFormat: string = 'png';
        const fileSize: number = 100;

        const profilePicture: ProfilePicture = { profilePicture: bufferData, userName, uploadedAt, fileFormat, fileSize };
    
        const connection: rt.Connection = await getRethinkDB();
        
        // Store the username along with the profile picture data
        await rt
          .db('beats')
          .table('profilepic')
          .insert(profilePicture)
          .run(connection)
    
        return new SuccessMessage("Profile picture upload successful");
      } catch (error) {
        console.error("Error updating profile picture:", error);
        throw new Error("Error processing the image.");
      }
    };

  // Retrieves profile pictures for the user
  public async getProfilePic(token: string): Promise<ProfilePicture[]> {
      try {

        const tokenService: TokenService = new TokenService();
        const userName: string = await tokenService.verifyAccessToken(token);

        const session: Session | undefined = this.driver?.session();
    
        // Find the user node within a Read Transaction
        const result: QueryResult | undefined = await session?.executeRead(tx =>
          tx.run('MATCH (u:User {username: $userName}) RETURN u', { userName })
        );
    
        await session?.close();
    
        // Verify the user exists
        if (result?.records.length === 0) {
          throw new ValidationError(`User with username '${userName}' not found.`, "");
        }
    
        const connection: rt.Connection = await getRethinkDB();
        const query: rt.Cursor = await rt
          .db('beats')
          .table('profilepic')
          .filter({ userName })  // Filter by userName
          .orderBy(rt.desc('uploadedAt'))
          .limit(10)
          .run(connection);
    
        const profilePictures = await query.toArray() as ProfilePicture[];
    
        return profilePictures as ProfilePicture[];
      } catch (error: any) {
        throw new ValidationError(`Error processing the image ${error.message}.`, "");
      }
    };
  
  // Retrieves display pictures for the specified user names
  public async getDisplayPic(userNames: string[]) {
      try {
        const connection: rt.Connection = await getRethinkDB();
        
        const query: rt.Cursor = await rt
        .db('beats')
        .table('profilepic')
        .getAll(...userNames)
        .orderBy(rt.desc('uploadedAt'))
        .limit(10)  // Limit to the latest 10 for each user
        .run(connection);
  
        // Map the result to an array of objects with username and profilePicture
        const profilePictures: { userName: string, profilePicture: ProfilePicture }[] = await query.toArray().then(rows => 
          rows.map(row => ({ 
            userName: row('group'), 
            profilePicture: row('reduction') 
          }))
        );
    
        return profilePictures;
      } catch (error: any) {
        console.error("Error getting profile pictures:", error);
        throw new ValidationError(`Error retrieving the image ${error.message}.`, "");
      }
    };

  //Retrieves the count of profile pictures for the specified user
  private async getProfilePicsCount(userName: string): Promise<number> {
      const connection: rt.Connection = await getRethinkDB();
      try {
        // Count the number of profile pictures for the user
        const countResult: number = await rt
          .db('beats')
          .table('profilepic')
          .getAll(userName)
          .count()
          .run(connection);
    
        return countResult;
      } catch (error: any) {
        throw new ValidationError(`Get profile pic error.`, "");
      }
    };

    
    
}

export default ProfileService