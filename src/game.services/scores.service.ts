//** IMPORTED TYPES
import { Driver, ManagedTransaction, QueryResult, Session } from "neo4j-driver";
import { ClassicScoreStats } from "./game.services.interfaces";

//** ERROR VALIDATION
import ValidationError from "../outputs/validation.error";

//** IMPORTED SERVICES
import TokenService from "../user.services/token.service";


class ScoreService {
    /**
     * Memgraph driver instance for database interactions.
     * @type {Driver|undefined}
     * @memberof ScoreService
     * @instance
     */
    driver?: Driver;

    /**
     * Creates an instance of ScoreService.
     *
     * @constructor
     * @param {Driver|undefined} driver - The Memgraph driver to be used for database interactions.
     * @memberof ScoreService
     * @instance
     */
    constructor(driver?: Driver) {
        this.driver = driver;
    }

    //* CLASSIC GAME MODE SAVE FUNCTION
    public async saveScoreClassic(scoreStats: ClassicScoreStats, token: string): Promise<void> {
        try {
            const tokenService: TokenService = new TokenService();
            const username: string = await tokenService.verifyAccessToken(token);

            const session: Session | undefined = this.driver?.session();
            const res: QueryResult | undefined = await session?.executeRead((tx: ManagedTransaction) =>
                tx.run("MATCH (u:User {username: $username}) RETURN u", { username })
            );
            await session?.close();
    
            if (res?.records.length === 0) {
                throw new ValidationError(`User with username '${username}' not found.`, "");
            }
    
            const statsScore: string = JSON.stringify(scoreStats);

            const session2: Session | undefined = this.driver?.session();
            const currentDate = new Date();
            const date: string = currentDate.toISOString().split('T')[0];

            const { highscore, score, difficulty } = scoreStats as ClassicScoreStats;
            const { songName } = scoreStats.finalStats;

            const songNameCaps: string = songName.toUpperCase()
            const difficultyCAps: string = difficulty.toUpperCase()

            await session2?.executeWrite(
                async (tx: ManagedTransaction) => {
                    // Find and remove the previous high score relationship
                    if (highscore) {
                        const prevHighScoreQuery = `
                            MATCH (u:User {username: $username})-[:CLASSIC]->(prevHighScore:Score)-[prevRel:HIGHSCORE]->()
                            DELETE prevRel
                        `;
                        await tx.run(prevHighScoreQuery, { username });
                    }
    
                    // Create the new Score node
                    const createScoreQuery: string = `
                        CREATE (s:Score {
                            username: $username,
                            scoreStats: $statsScore,
                            score: $score,
                            date: $date,
                            difficulty: $difficulty
                        })
                        WITH s
                        MATCH (u:User {username: $username})
                        CREATE (u)-[:${songNameCaps}]->(s)
                        ${highscore ? 'CREATE (u)-[:HIGHSCORE]->(s)' : ''}
                        CREATE (u)-[:CLASSIC]->(s)
                        CREATE (u)-[:${difficultyCAps}]->(s)
                    `;
                await tx.run(createScoreQuery, { username, statsScore, date, highscore, score, difficulty });
                }
            );
        } catch (error: any) {
            throw error;
        }
    }
    
    //* CLASSIC GAME MODE RETRIEVE SCORE FUNCTION
    public async getHighScoreClassic(token: string): Promise<ClassicScoreStats[]> {
        try {

            const tokenService: TokenService = new TokenService();
            const username: string = await tokenService.verifyAccessToken(token);
            
            const session: Session | undefined = this.driver?.session();
            const result: QueryResult | undefined = await session?.executeRead((tx: ManagedTransaction) =>
                tx.run(`
                    MATCH (u:User {username: $username})-[:CLASSIC]->(s:Score)<-[:HIGHSCORE]-(u2:User {username: $username})
                    RETURN s
                `, { username })
            );
            await session?.close();
    
            const classicScoreStats: ClassicScoreStats[] | undefined = result?.records.map(record => record.get('s').properties);

            return classicScoreStats as ClassicScoreStats[];
        } catch (error: any) {
            throw error;
        }
    }
}

export default ScoreService;
