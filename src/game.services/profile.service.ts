import { Driver } from "neo4j-driver";
import ValidationError from "../errors/validation.error";
import { getDriver } from '../db/memgraph';


/**
 * ProfileService class handles profile-related operations.
 * It uses the Neo4j Driver to interact with the Neo4j database and the ThirdwebStorage library
 * for storing images on a third-party storage service.
 *
 * @class ProfileService
 */
export default class ProfileService {
  /**
   * The Neo4j Driver instance used for database interaction.
   * @type {neo4j.Driver:}
   */
  driver?;

  /**
   * The constructor initializes the ProfileService with a Neo4j Driver instance.
   *
   * @constructor
   * @param {neo4j.Driver} driver - An instance of the Neo4j Driver.
   */
  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Uploads a profile picture for the given user.
   *
   * @async
   * @param {string} bufferData - The base64-encoded image data in JSON format.
   * @param {string} userId - The ID of the user associated with the profile picture.
   * @returns {Promise<string>} The URL of the uploaded profile picture.
   * @throws {Error} If there is an error processing the image or uploading it to the storage service.
   */
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

/**
 * Updates the player's statistics based on provided stat points.
 * @param {Object} statPoints - The new stat points to be applied.
 * @param {Object} statPoints.statPointsSaved - Object containing new stat points.
 * @param {string} statPoints.statPointsSaved.username - Username of the player.
 * @returns {Object} - An object indicating success and a message.
 * @throws {ValidationError} If invalid stat changes or user not found.
 */
  async updateStats(statPoints: any) {
    try {
        const username = statPoints.statPointsSaved.username;
        const session = this.driver.session();
        const res = await session.executeRead(
            tx => tx.run(
                `MATCH (u:User {username: $username})
                RETURN u.playerStats`,
                { username }
            )
        );
        // Close the database session
        await session.close();
        // Check if user exists
        if (res.records.length === 0) {
            throw new ValidationError(`User with username '${username}' not found.`, '');
        }
        // Parse playerStats from retrieved data
        const userData = res.records[0].get('u.playerStats');
        const playerStats = JSON.parse(userData);
        // Extract existing stat values and new stat points
        const availStatPoints = playerStats.availStatPoints;
        const { level, playerExp, rank, statPointsSaved } = playerStats;
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
            throw new ValidationError(`Invalid stat changes detected.`, '');
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
        const newPlayerStats = JSON.stringify(updatedPlayerStats);
        // Connect to a new database session for writing
        const session2 = this.driver.session();
        await session2.executeWrite(
            tx => tx.run(
                `MATCH (u:User {username: $username})
                SET u.playerStats = $newPlayerStats`,
                { username, newPlayerStats }
            )
        );
        await session2.close();
        } catch(error){
          console.log(error)
          throw error
        }
        return { success: true, message: 'Stats updated successfully.', updatedPlayerStats };
      } catch (error) {
        // Log and rethrow any errors
        console.error(error);
        return { success: false, message: 'Error updating stats.' };
      }
    };
/**
 * Retrieves player statistics for the specified username from the database.
 * @param {string} username - The username of the player.
 * @returns {Promise<Object>} - A promise that resolves to the player's statistics object.
 * @throws {ValidationError} - If the user with the given username is not found.
 * @throws {Error} - If there's an error while retrieving the statistics.
 */
async getStats(username: string) {
  try {
      // Get the Neo4j driver instance
      const driver = getDriver();
      const session = driver.session();

      // Execute a read transaction to retrieve playerStats
      const res = await session.executeRead(
          tx => tx.run(
              `MATCH (u:User {username: $username})
              RETURN u.playerStats`,
              { username }
          )
      );
        // Close the database session
        await session.close();
        // Check if user exists in the database
        if (res.records.length === 0) {
            throw new ValidationError(`User with username '${username}' not found.`, '');
        }
        // Get playerStats from the query result and return it
        const playerStats = res.records[0].get('u.playerStats');
        return playerStats;
    } catch (error) {
        // Log and rethrow any errors
        console.error(error);
        throw error;
    }
  }
}

