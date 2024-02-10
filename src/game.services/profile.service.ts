//** IMPORTED TYPES
import { Driver, QueryResult, RecordShape, Session } from "neo4j-driver";
import { UpdateStatsFailed, PlayerStats, ProfilePicture } from "./game.services.interfaces";
import { getDriver } from '../db/memgraph';

//** RETHINK DB
import rt from "rethinkdb";
import { getRethinkDB } from "../db/rethink";

//** SHARP IMPORT
import sharp from "sharp";

//** NANOID IMPORT
import { nanoid } from "nanoid";

//** OUTPUT IMPORTS
import ValidationError from "../outputs/validation.error";
import { SuccessMessage } from "../outputs/success.message";



class ProfileService {

  driver?: Driver;
  constructor(driver?: Driver) {
    this.driver = driver;
  }

  public async updateStats(statPoints: any): Promise<any | UpdateStatsFailed>{
    try {
        const username: string = statPoints.statPointsSaved.username;
        const session: Session | undefined = this.driver?.session();
        const result: QueryResult<RecordShape> | undefined = await session?.executeRead(
            tx => tx.run(
                `MATCH (u:User {username: $username})
                RETURN u.playerStats`,
                { username }
            )
        );
        // Close the database session
        await session?.close();
        // Check if user exists
        if (result?.records.length === 0) {
            throw new ValidationError(`User with username '${username}' not found.`, "");
        }
        // Parse playerStats from retrieved data
        const userData = result?.records[0].get('u.playerStats');
        const playerStats: PlayerStats = JSON.parse(userData);
        // Extract existing stat values and new stat points
        const availStatPoints: number = playerStats.availStatPoints;
        const { level, playerExp, rank, statPointsSaved } = playerStats as PlayerStats
        const newStatPoints = statPoints.statPointsSaved;
        // Calculate total stat points added, considering existing values from the database
      const totalStatPointsAdded =
          (newStatPoints.mainVocalist - statPointsSaved.mainVocalist) +
          (newStatPoints.rapper - statPointsSaved.rapper) +
          (newStatPoints.leadDancer - statPointsSaved.leadDancer) +
          (newStatPoints.leadVocalist - statPointsSaved.leadVocalist) +
          (newStatPoints.mainDancer - statPointsSaved.mainDancer) +
          (newStatPoints.visual - statPointsSaved.visual) +
          (newStatPoints.leadRapper - statPointsSaved.leadRapper);
        // Validate stat changes
        if (
            statPointsSaved.mainVocalist + newStatPoints.mainVocalist < 0 ||
            statPointsSaved.rapper + newStatPoints.rapper < 0 ||
            statPointsSaved.leadDancer + newStatPoints.leadDancer < 0 ||
            statPointsSaved.leadVocalist + newStatPoints.leadVocalist < 0 ||
            statPointsSaved.mainDancer + newStatPoints.mainDancer < 0 ||
            statPointsSaved.visual + newStatPoints.visual < 0 ||
            statPointsSaved.leadRapper + newStatPoints.leadRapper < 0 ||
            totalStatPointsAdded > availStatPoints
        ) {
            throw new ValidationError(`Invalid stat changes detected.`, "");
        }
        // Calculate new available stat points, ensuring it doesn't go below 0
        const newAvailStatPoints = Math.max(0, availStatPoints - totalStatPointsAdded);
        // Construct updated playerStats object
        const updatedPlayerStats = {
            level,
            playerExp,
            availStatPoints: newAvailStatPoints,
            rank,
            statPointsSaved: {
                mainVocalist: newStatPoints.mainVocalist,
                rapper: newStatPoints.rapper,
                leadDancer: newStatPoints.leadDancer,
                leadVocalist: newStatPoints.leadVocalist,
                mainDancer: newStatPoints.mainDancer,
                visual: newStatPoints.visual,
                leadRapper: newStatPoints.leadRapper,
            },
        };
        try{
        // Convert updatedPlayerStats to JSON format
        const newPlayerStats: string = JSON.stringify(updatedPlayerStats);
        // Connect to a new database session for writing


        const session2: Session | undefined = this.driver?.session();
        await session2?.executeWrite(
            tx => tx.run(
                `MATCH (u:User {username: $username})
                SET u.playerStats = $newPlayerStats`,
                { username, newPlayerStats }
            )
        );
        await session2?.close();
        } catch(error){
          console.log(error)
          throw error
        }
        return { success: true, message: 'Stats updated successfully.', updatedPlayerStats };
      } catch (error: any) {
        return { success: false, message: 'Error updating stats.' } as UpdateStatsFailed;
      }
    };

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
        throw error;
      }
    };

   public async uploadProfilePic(bufferData: ArrayBuffer, userName: string): Promise<SuccessMessage> {
      try {
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
        console.error(error);
        throw new Error("Error processing the image.");
      }
    };

   public async getProfilePic(userName: string): Promise<ProfilePicture[]> {
      try {
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
        .orderBy(rt.desc('uploadedAt'))
        .limit(10)
        .run(connection);
    
        const profilePictures = await query.toArray() as ProfilePicture[]
    
        return profilePictures as ProfilePicture[]
      } catch (error: any) {
        throw new ValidationError(`Error processing the image ${error.message}.`, "");
      }
    };

    
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