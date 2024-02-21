//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, Session } from "neo4j-driver";

//** VALIDATION ERROR
import { ClassicScoreStats } from "./game.services.interfaces";
import TokenService from "../user.services/token.service";


class LeaderboardService {
	/**
	 * Memgraph driver instance for database interactions.
	 * @type {Driver|undefined}
	 * @memberof InventoryService
	 * @instance
	 */
	driver?: Driver;

	/**
	 * Creates an instance of InventoryService.
	 *
	 * @constructor
	 * @param {Driver|undefined} driver - The Neo4j driver to be used for database interactions.
	 * @memberof InventoryService
	 * @instance
	 */
	constructor(driver?: Driver) {
		this.driver = driver;
	}

	public async dailyLeaderboard(songName: string, difficulty: string, token: string): Promise<ClassicScoreStats[]> {
		try {

			const tokenService: TokenService = new TokenService();
			await tokenService.verifyAccessToken(token);

			const currentDate: Date = new Date();
			const startOfDay: Date = new Date(currentDate);
			startOfDay.setHours(0, 0, 0, 0); // Set to the beginning of the current day
			const endOfDay: Date = new Date(startOfDay);
			endOfDay.setHours(23, 59, 59, 999); // Set to the end of the current day
	
			const startDate: string = startOfDay.toISOString().split('T')[0];
			const endDate: string = endOfDay.toISOString().split('T')[0];
	
			const songNameCaps: string = songName.toUpperCase();
			const difficultyCaps: string = difficulty.toUpperCase();
	
			const session: Session | undefined = this.driver?.session();
			const result: QueryResult | undefined = await session?.executeRead((tx: ManagedTransaction) =>
				tx.run(`
					MATCH (s:Score)-[:HIGHSCORE]-(u:User)-[:${songNameCaps}]->(s)<-[:${difficultyCaps}]-(u)
					WHERE date(s.date) >= date($startDate) AND date(s.date) <= date($endDate)
					RETURN s
					ORDER BY s.score
					LIMIT 100`,
				{ startDate, endDate })
			);
			await session?.close();
	
			const classicScoreStats: ClassicScoreStats[] | undefined = result?.records.map(record => record.get('s').properties);
	
			return classicScoreStats as ClassicScoreStats[];
		} catch (error: any) {
			throw error;
		}
	}
	
	 
	public async weeklyLeaderboard(gameMode: string, songName: string, period: string, difficulty: string, token: string): Promise<ClassicScoreStats[]> {
		//* Weekly is from Monday to Sunday
		try {
			const tokenService: TokenService = new TokenService();
			await tokenService.verifyAccessToken(token);

			const currentDate: Date = new Date();
			const startOfWeek: Date = new Date(currentDate);
			startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1)); // Monday of the current week
			const endOfWeek: Date = new Date(startOfWeek);
			endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday of the current week
	
			const startDate: string = startOfWeek.toISOString().split('T')[0];
			const endDate: string = endOfWeek.toISOString().split('T')[0];
	
			const songNameCaps: string = songName.toUpperCase();
			const difficultyCaps: string = difficulty.toUpperCase();
	
			const session: Session | undefined = this.driver?.session();
			const result: QueryResult | undefined = await session?.executeRead((tx: ManagedTransaction) =>
			tx.run(`
					MATCH (s:Score)-[:HIGHSCORE]-(u:User)-[:${songNameCaps}]->(s)<-[:${difficultyCaps}]-(u)
					WHERE date(s.date) >= date($startDate) AND date(s.date) <= date($endDate)
					RETURN s
					ORDER BY s.score
					LIMIT 100`,
				{ startDate, endDate })
			);
			await session?.close();
	
			const classicScoreStats: ClassicScoreStats[] | undefined = result?.records.map(record => record.get('s').properties);
	
			return classicScoreStats as ClassicScoreStats[];
		} catch (error: any) {
			throw error;
		}
	}
	
    public async monthlyLeaderboard(token: string): Promise<ClassicScoreStats[]> {
		// Monthly is from the 1st to the end of the month
		try {

			const tokenService: TokenService = new TokenService();
			await tokenService.verifyAccessToken(token);

			const currentDate: Date = new Date();
			const startOfMonth: Date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // 1st day of the current month
			const endOfMonth: Date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of the current month

			const startDate: string = startOfMonth.toISOString();
			const endDate: string = endOfMonth.toISOString();

			const session: Session | undefined = this.driver?.session();
			const result: QueryResult | undefined = await session?.executeRead((tx: ManagedTransaction) =>
				tx.run(`
                    MATCH (s:Score)-[:HIGHSCORE]-(u:User)
                    WHERE date(s.date) >= date($startDate) AND date(s.date) <= date($endDate)
                    RETURN s
                    ORDER BY s.score
                    LIMIT 100`,
				{ startDate, endDate })
			);
			await session?.close();

			const classicScoreStats: ClassicScoreStats[] | undefined = result?.records.map(record => record.get('s').properties);

			return classicScoreStats as ClassicScoreStats[];
		} catch (error: any) {
			throw error;
		}
	}
}

export default LeaderboardService;
