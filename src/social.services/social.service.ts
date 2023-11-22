//* MEMGRAPH DRIVER AND TYPES
import { Driver, ManagedTransaction, QueryResult, Session } from "neo4j-driver";

//* ERROR CODES
import ValidationError from "../errors/validation.error";


//* TYPE INTERFACES
interface FollowResponse {
    status: string;
  }

interface ViewedUserData {
  username: string
  playerStats: string
  }

interface ViewProfileData {
  username: string
  playerStats: string
  followsUser: boolean
  followedByUser: boolean
  }

interface MutualData {
    username: string;
    playerStats: string;
  }


class SocialService {

  private driver:Driver
  constructor(driver: Driver) {
    this.driver = driver
  };

  public async follow(follower: string, toFollow: string): Promise<FollowResponse> {
    try {
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

  public async unfollow(follower: string, toUnfollow: string): Promise<FollowResponse> {
    try {
      
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
  
  public async viewProfile(userName: string, viewUsername: string): Promise<ViewProfileData> {
    const session:Session = this.driver.session();
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
      console.error("Something went wrong: ", error);
      throw error;
    } finally {
      if (session) {
        await session.close();
      }
    }
  };

  public async mutual(username: string): Promise<MutualData[]> {
    try {
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
  
      const users: { username: string, playerStats: string }[] = result.records.map(record => ({
        username: record.get("username") || "", // Ensure a default value if property is undefined
        playerStats: record.get("playerStats") || "" // Ensure a default value if property is undefined
    })) as MutualData[];
    
  
      return users as MutualData[];
    } catch (error: any) {
      console.error("Something went wrong: ", error);
      throw error;
    }
  };
  
};


export default SocialService