//** IMPORTED TYPES
import { Driver, QueryResult, RecordShape, Session } from "neo4j-driver";
import { UpdatedStats, UpdateStatsFailed, PlayerStats } from "./game.services.interfaces";

//** ERROR VALIDATION
import ValidationError from "../errors/validation.error";

//**
import { getDriver } from '../db/memgraph';


class ProfileService {

  driver?: Driver;
  constructor(driver?: Driver) {
    this.driver = driver;
  }

  async updateStats(statPoints: any): Promise<UpdatedStats | UpdateStatsFailed>{
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
        return { success: true, message: 'Stats updated successfully.', updatedPlayerStats } as UpdatedStats;
      } catch (error: any) {
        return { success: false, message: 'Error updating stats.' } as UpdateStatsFailed;
      }
    };

  async getStats(username: string): Promise<PlayerStats> {
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

  // async uploadProfilePic(bufferData, userId) {
  //   // Parse the packed-byte array image data from the JSON input.
  //   const dataBuffer = JSON.parse(bufferData);
  //   const imageBuffer = Buffer.from(dataBuffer);

  //   try {
  //     // Process the image using the sharp library.
  //     const outputBuffer = await sharp(imageBuffer)
  //       .resize({
  //         width: 200,
  //         height: 200,
  //         fit: sharp.fit.inside,
  //       })
  //       .toBuffer();

  //     // Upload the processed image to the storage service.
  //     const storage = new ThirdwebStorage({ contentType: "image/png" });
  //     const imageURI = await storage.upload(outputBuffer);
  //     const profilePicURL = imageURI;
  //     console.log(imageURI);

  //     if (!profilePicURL) {
  //       // Return early if the profilePicURL is not available.
  //       return;
  //     }
  //     // Update the user node in the database with the new profilePicURL.
  //     const session = this.driver.session();
  //     const res = await session.executeWrite((tx) =>
  //       tx.run(
  //         `MATCH (u:User {userId: $userId})
  //         SET u.profilePics = coalesce(u.profilePics, []) + $profilePicURL
  //         RETURN u
  //         `,
  //         { userId, profilePicURL }
  //       )
  //     );
  //     await session.close();

  //     if (res.records.length === 0) {
  //       throw new Error("User not found.");
  //     }

  //     const user = res.records[0].get('u').properties;
  //     const profilePics  = user.profilePics

  //     const base64Promises = profilePics.map(async (url) => {
  //       const temporary = url.replace("ipfs://", "");
  //       try {
  //         const image = await axios.get(`https://gateway.moralisipfs.com/ipfs/${temporary}`, {
  //           responseType: 'arraybuffer'
  //         });
  //         const base64Data = Buffer.from(image.data).toString('base64');
  //         return base64Data;
  //       } catch (error) {
  //         console.error(`Error fetching image from URL: ${url}`, error);
  //         return null; // Return null for failed requests
  //       }
  //     });
  
  //     // Wait for all promises to resolve
  //     const base64Array = await Promise.all(base64Promises);
  //     console.log(base64Array)

  //     return base64Array; // Return the URL of the uploaded profile picture.
  //   } catch (error) {
  //     console.error(error);
  //     throw new Error("Error processing the image.");
  //   }
  // }
}

export default ProfileService