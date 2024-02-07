//** ELYSIA AND JWT MODULE IMPORT
import Elysia from 'elysia'
import jwt from 'jsonwebtoken'

//** CONFIG IMPORT
import { JWT_SECRET } from '../config/constants';

//* MEMGRAPH DRIVER AND ETC
import { Driver } from 'neo4j-driver';
import { getDriver } from '../db/memgraph';

//* SOCIAL & CHAT SERVICE
import SocialService from '../social.services/social.service';
import ChatService from '../chat.services/chat.socket.service';


//* TYPES IMPORTS


//* TYPE INTERFACES
interface ViewProfileData {
  username: string
  playerStats: string
  followsUser: boolean
  followedByUser: boolean
  }

interface FollowResponse {
    status: string;
  }

interface MutualData {
    username: string;
    playerStats: string;
  }

interface PrivateMessage {
    message: string
    roomId: string
    sender: SenderData
    receiver: string
    seen: boolean
    ts: number
  }

interface SenderData {
    username: string
    level: number
    rank: string
  }

interface PlayerStatus {
    username: string
    status: boolean
    activity: string
    lastOnline: number
    userAgent: string
    osName: string
    ipAddress: string
    id: string
  }
  

const social = (app: Elysia) => {
    app.get('/api/social/viewprofile/:username', async (context) => {
      try {

        const authorizationHeader = context.headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);
        const decodedToken: string | jwt.JwtPayload = jwt.verify(jwtToken, JWT_SECRET)

        const { userName } = decodedToken as { userName: string };
        const viewUsername: string = context.params.username;

        const driver: Driver = getDriver();
        const followService: SocialService = new SocialService(driver);

        const output: ViewProfileData = await followService.viewProfile(userName, viewUsername);
        return output
      } catch (error: any) {
        throw error
      }
    })

    .post('/api/social/follow', async (context) => {
        try {
          const authorizationHeader = context.headers.authorization;
          if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
            throw new Error('Bearer token not found in Authorization header');
          }
          const jwtToken: string = authorizationHeader.substring(7);
          const decodedToken: string | jwt.JwtPayload = jwt.verify(jwtToken, JWT_SECRET)
          const { userName } = decodedToken as { userName: string };

          const { follower, toFollow } = context.body as { follower: string, toFollow: string }
          if (userName !== follower) {
            throw new Error("Unauthorized")
          }

          const driver: Driver = getDriver();
          const followService: SocialService = new SocialService(driver);
          const output: FollowResponse = await followService.follow(follower, toFollow);

          return output
        } catch (error: any) {
          throw new Error("Unauthorized")
        }
    })

    .post('/api/social/unfollow', async (context) => {
      try {
          const authorizationHeader = context.headers.authorization;
          if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
            throw new Error('Bearer token not found in Authorization header');
          }
          const jwtToken: string = authorizationHeader.substring(7);
          const decodedToken: string | jwt.JwtPayload = jwt.verify(jwtToken, JWT_SECRET)
          const { userName } = decodedToken as { userName: string };

          
        const { follower, toUnfollow } = context.body as {follower: string, toUnfollow: string}
        if (userName !== follower) {
          throw new Error("Unauthorized")
        }
        const driver: Driver = getDriver();
        const followService: SocialService = new SocialService(driver);
  
        const output: FollowResponse = await followService.unfollow(follower, toUnfollow);

        return output
      } catch (error: any) {
        throw new Error("Unauthorized")
      }
    })

    .get('/api/social/list/mutual', async (context) => {
      try {
        const authorizationHeader = context.headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);
        const decodedToken: string | jwt.JwtPayload = jwt.verify(jwtToken, JWT_SECRET)
        const { userName } = decodedToken as { userName: string };

        const driver: Driver = getDriver();
        const socialService: SocialService = new SocialService(driver);

        const output: MutualData[] = await socialService.mutual(userName);
        return output;
      } catch (error: any) {
        throw new Error("Unauthorized")
      }
    })

    .get('/api/social/mutual/:conversingUsername', async (context) => {
      try {
        const authorizationHeader = context.headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);
        const decodedToken: string | jwt.JwtPayload = jwt.verify(jwtToken, JWT_SECRET)
        const { userName } = decodedToken as { userName: string };

        const conversingUsername: string = context.params.conversingUsername

        const chatService = new ChatService()
        const output: PrivateMessage[] = await chatService.privateInboxData(userName, conversingUsername)

        return output
      } catch (error: any) {
        throw new Error("Unauthorized")
      }
    })


    .post('/api/social/status/online', async (context) => {
      try {
        const authorizationHeader = context.headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);
        const decodedToken: string | jwt.JwtPayload = jwt.verify(jwtToken, JWT_SECRET)
        const { userName } = decodedToken as { userName: string };
    
        const { activity, userAgent, osName } = context.body as {activity: string, userAgent: string, osName: string}
        const ipAddress = "temporaryfornow"
        
        const driver: Driver = getDriver();
        const socialService: SocialService = new SocialService(driver);

        await socialService.setStatusOnline(userName, activity, userAgent, osName, ipAddress);
    
      } catch (error: any) {
        throw new Error("Unauthorized")
      }
    })
    
    .get('/api/social/mutual/online', async (context) => {
      try {
        const authorizationHeader = context.headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);
        const decodedToken: string | jwt.JwtPayload = jwt.verify(jwtToken, JWT_SECRET)
        const { userName } = decodedToken as { userName: string };

        const driver: Driver = getDriver();
        const socialService: SocialService = new SocialService(driver);
        const output: PlayerStatus[] = await socialService.mutualStatus(userName)

        return output
      } catch (error: any) {
        throw new Error("Unauthorized")
      }
    })

  };

export default social;

