import keydb from "../db/keydb.client";
/**
 * Class representing the Replenishments functionality.
 */
export default class Replenishments {
    /**
   * Retrieve the last recorded energy value for a user.
   * @param {string} userName - The username of the player.
   * @returns {number} - The last recorded energy value.
   * @throws {Error} - If there is an issue retrieving the energy value.
   */
    async getEnergy(userName: string, playerStats: any) {
      try {
        // Retrieve the serialized energy data from Redis
        const serializedEnergy = await keydb.get(userName + "Energy") as string

        const energy = JSON.parse(serializedEnergy)
        const stats = JSON.parse(playerStats)
        const playerLevel = stats.level

        if (serializedEnergy) {
          const playerEnergy = energy;

          // Calculate elapsed time since the last replenishment
          const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
          const elapsedSeconds = currentTime - playerEnergy.lastTimestamp;
    
          const replenishRate = 10; // Energy replenishment rate per hour
          const replenishInterval = 3600; // 1 hour in seconds
    
          // Calculate how many replenishments occurred based on elapsed time
          const replenishments = Math.floor(elapsedSeconds / replenishInterval);
    
          // Calculate the energy after replenishments
          const newEnergy: number = playerEnergy.lastEnergy + replenishments * replenishRate;
    
          // Calculate max energy based on player level
          const maxEnergy = 200 + (playerLevel - 1) * 5;
    
          // Ensure that newEnergy doesn't exceed maxEnergy
          const updatedEnergy = Math.min(newEnergy, maxEnergy);

          // Update the timestamp in Redis (don't need to update energy value)
          await keydb.set(userName + "Energy", JSON.stringify({
            lastEnergy: updatedEnergy,
            lastTimestamp: currentTime,
          }));

          return updatedEnergy;
        } else {
          // Handle the case where the key is not found in Redis
          throw new Error(`Energy data not found for user: ${userName}`);
        }
      } catch (error: any) {
        console.log(error)
        throw new Error(`Error while retrieving energy data: ${error.message}`);
      }
    }
    
  /**
   * Set and replenish energy for a user based on their level and timestamp.
   * @param {string} userName - The username of the player.
   * @param {number} timestamp - The timestamp when the last energy replenishment occurred.
   * @param {number} lastEnergy - The last recorded energy value.
   * @param {number} playerLevel- The player's level.
   * @returns {number} - The updated energy value after replenishment.
   * @throws {Error} - If there is an issue setting or replenishing energy.
   */

  async setEnergy(userName: string, timestamp: number, lastEnergy: number, playerLevel: number) {
    try {

        if (playerLevel === 1) {
            // For level 1 players, set energy to 200 directly
            await keydb.set(userName + "Energy", JSON.stringify({
                lastEnergy: 200,
                lastTimestamp: Math.floor(Date.now() / 1000),
            }));
            return 200;
            }

      const maxEnergy = 200 + (playerLevel - 1) * 5; // Calculate max energy based on level

      // Calculate elapsed time since the last replenishment
      const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
      const elapsedSeconds = currentTime - timestamp;

      const replenishRate = 10; // Energy replenishment rate per hour
      const replenishInterval = 3600; // 1 hour in seconds

      // Calculate how many replenishments occurred based on elapsed time
      const replenishments = Math.floor(elapsedSeconds / replenishInterval);

      // Calculate the energy after replenishments
      let newEnergy:number = lastEnergy + replenishments * replenishRate;

      // Ensure energy doesn't exceed the maxEnergy
      if (newEnergy > maxEnergy) {
        newEnergy = maxEnergy;
      }

      // Update the timestamp to the current time
      const newTimestamp = currentTime;

      // Update the energy and timestamp in Redis
      const updatedEnergyData = {
        lastEnergy: newEnergy,
        lastTimestamp: newTimestamp,
      };

      // Serialize the data before storing in Redis
      const serializedEnergyData = JSON.stringify(updatedEnergyData);
      await keydb.set(userName + "Energy", serializedEnergyData);

      return newEnergy;
    } catch (error: any) {
      throw new Error(`Error while setting or replenishing energy: ${error.message}`);
    }
  }
}

