//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, Session } from "neo4j-driver";

//** ERROR CODES
import ValidationError from '../../outputs/validation.error'

//** TYPE INTERFACES
import { UserData } from "../../user.services/user.service.interface";
import { LevelUpResult, PlayerStats } from "../game.services.interfaces";


class ExperienceService {

driver?: Driver;

constructor(driver?: Driver) {
    this.driver = driver;
}
    /**
     * Calculates the experience gain for a user based on their accuracy and experience needed for the next level.
     * @param userName The username of the user for whom experience gain is calculated.
     * @param accuracy The accuracy of the user's action, represented as a percentage.
     * @param experienceNeededForNextLevel The amount of experience needed for the user to reach the next level.
     * @returns A promise resolving to a LevelUpResult object representing the result of the experience gain calculation.
     */
    public async calculateExperienceGain(userName: string, accuracy: number, experienceRequired: number): Promise<LevelUpResult> {
        try {
            const user = await this.getUserDetails(userName);

            // Extract user stats
            const { playerStats } = user.properties;

            // Calculate experience gain
            const baseExperienceGain: number = Math.floor(10 * Math.pow(playerStats.level, 1.8));
            let adjustedExperienceGain: number = baseExperienceGain * (accuracy / 100);
            const minExperienceGain: number = Math.floor(experienceRequired * 0.05);
            const maxExperienceGain: number = Math.floor(experienceRequired * 0.2);
            adjustedExperienceGain = Math.max(minExperienceGain, Math.min(maxExperienceGain, adjustedExperienceGain));

            const experienceGained: number = Math.floor(adjustedExperienceGain);

            // Generate the experience and get the result
            const result: LevelUpResult= await this.generateExperience(userName, experienceGained, playerStats);

            // Do something with the result, or return it if needed
            return result
            
        } catch (error: any) {
            console.error("Error calculating experience gain:", error);
            throw error;
        }
    }
    /**
     * Generates experience for a user, updating their level and experience points accordingly.
     * @param userName The username of the user for whom experience is generated.
     * @param experienceGained The amount of experience gained by the user.
     * @param stats The current statistics of the user, including level and experience points.
     * @returns A promise resolving to a LevelUpResult object representing the user's updated level and experience points.
     */
    public async generateExperience(userName: string, experienceGained: number, stats: PlayerStats): Promise<LevelUpResult> {
        const { level, playerExp } = stats;
        let currentLevel = level;
        let currentExperience = playerExp + experienceGained;

        // Loop until all experience is consumed
        while (currentExperience >= 50 * Math.pow(currentLevel, 2.5)) {
            // Subtract required experience for the current level
            currentExperience -= 50 * Math.pow(currentLevel, 2.5);
            // Increment level
            currentLevel++;
        }

        // If there's excess experience and the player leveled up, set currentExperience to excessExperience
        if (currentExperience > 0 && currentLevel > level) {
            currentExperience = experienceGained;
        } else {
            // If not leveled up, add experience gained to currentExperience
            currentExperience += experienceGained;
        }
        
        stats.level = currentLevel
        stats.playerExp = currentExperience

        await this.saveUserDetails(userName, stats)
        return { currentLevel, currentExperience }
    }
    /**
     * Retrieves details of a user  based on the provided username.
     * @param userName The username of the user whose details are to be retrieved.
     * @returns A promise resolving to the user data.
     */
    private async getUserDetails(userName: string): Promise<UserData> {
        const session: Session | undefined = this.driver?.session();

        try {
            // Find the user node within a Read Transaction
            const result: QueryResult | undefined = await session?.executeRead((tx: ManagedTransaction) =>
                tx.run('MATCH (u:User {username: $userName}) RETURN u', { userName })
            );

            if (!result || result.records.length === 0) {
                throw new ValidationError(`User with username '${userName}' not found.`, "");
            }

            return result.records[0].get('u');
        } finally {
            await session?.close();
        }
    }
    /**
     * Saves the details of a user, including player statistics, in the database.
     * @param userName The username of the user whose details are to be saved.
     * @param playerStats The player statistics to be saved for the user.
     * @returns A promise resolving to void when the user details are successfully saved.
     */
    private async saveUserDetails(userName: string, playerStats: PlayerStats): Promise<void> {
        const session: Session | undefined = this.driver?.session();

        try {
            // Find the user node within a Read Transaction
            const result: QueryResult | undefined = await session?.executeWrite((tx: ManagedTransaction) =>
                tx.run(
                    `MATCH (u:User {username: $userName}) 
                     SET u.playerStats = $playerStats`, 
                    { userName, playerStats })
            );
            await session?.close();
            if (!result || result.records.length === 0) {
                throw new ValidationError(`User with username '${userName}' not found.`, "");
            }

        } catch(error: any) { 
            throw error
        }
    }
}
    

export default ExperienceService