//** MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, Session } from "neo4j-driver";

//** VALIDATION ERROR
import { ClassicScoreStats } from "./leaderboard.interface";
import TokenService from "../../user.services/token.services/token.service";


class LeaderboardService {
	driver?: Driver;
	constructor(driver?: Driver) {
		this.driver = driver;
	}



	public async weeklyLeaderboard(token: string, body: ClassicScoreStats): Promise<ClassicScoreStats[]> {
		//* Weekly is from Monday to Sunday
		try {

			console.log(body)
			const tokenService: TokenService = new TokenService();
			await tokenService.verifyAccessToken(token);

			const date: Date = new Date();

			const session: Session | undefined = this.driver?.session();
			const result: QueryResult | undefined = await session?.executeRead((tx: ManagedTransaction) =>
			tx.run(`
`,
				{  })
			);
			await session?.close();
	
			const classicScoreStats: ClassicScoreStats[] | undefined = result?.records.map(record => record.get('s').properties);
	
			return classicScoreStats as ClassicScoreStats[];
		} catch (error: any) {
			console.log(error)
			throw error;
		}
	}

}

export default LeaderboardService;
