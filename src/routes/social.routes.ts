//** ELYSIA AND PLUGINS IMPORT
import Elysia from 'elysia'
import { ip } from "elysia-ip";

//* MEMGRAPH DRIVER AND ETC
import { Driver } from 'neo4j-driver';
import { getDriver } from '../db/memgraph';

//* SOCIAL & CHAT SERVICE
import SocialService from '../social.services/social.service';
import ChatService from '../chat.services/chat.socket.service';

//* TYPES IMPORTS
import { FollowResponse, MutualData, PlayerStatus, ViewProfileData } from '../social.services/social.services.interface';
import { PrivateMessage } from '../chat.services/chat.interface';

//** VALIDATION SCHEMA IMPORT
import { followResponseSchema, getMutualConversationSchema, setOnlineStatusSchema, unFollowResponseSchema, viewProfileSchema } from './route.schema/schema.social';
import { authorizationBearerSchema } from './route.schema/schema.auth';
import { cardGiftSchema } from '../social.services/social.schema';
import { SuccessMessage } from '../outputs/success.message';
  

const social = (app: Elysia) => {
    
  //@ts-ignore

    app.get('/api/social/viewprofile/:username', async ({ headers, params }): Promise<ViewProfileData> => {
      try {
        const authorizationHeader: string = headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);

        const viewUsername: string = params.username;

        const driver: Driver = getDriver();
        const followService: SocialService = new SocialService(driver);

        const output: ViewProfileData = await followService.viewProfile(viewUsername, jwtToken);

        return output as ViewProfileData
      } catch (error: any) {
        throw error
        }
      }, viewProfileSchema )

    .post('/api/social/follow', async ({ headers, body }): Promise<FollowResponse> => {
        try {

          const authorizationHeader: string = headers.authorization;
          if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
            throw new Error('Bearer token not found in Authorization header');
          }
          const jwtToken: string = authorizationHeader.substring(7);

          const { follower, toFollow } = body

          const driver: Driver = getDriver();
          const followService: SocialService = new SocialService(driver);
          const output: FollowResponse = await followService.follow(follower, toFollow, jwtToken);

          return output as FollowResponse
        } catch (error: any) {
          throw new Error("Unauthorized")
        }
      }, followResponseSchema
    )

    .post('/api/social/unfollow', async ({ headers, body }): Promise<FollowResponse> => {
      try {
          const authorizationHeader: string = headers.authorization;
          if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
            throw new Error('Bearer token not found in Authorization header');
          }
          const jwtToken: string = authorizationHeader.substring(7);

          const { follower, toUnfollow } = body

          const driver: Driver = getDriver();
          const followService: SocialService = new SocialService(driver);
  
        const output: FollowResponse = await followService.unfollow(follower, toUnfollow, jwtToken);

        return output as FollowResponse
      } catch (error: any) {
        throw new Error("Unauthorized")
        }
      }, unFollowResponseSchema
    )

    .get('/api/social/list/mutual', async ({ headers }) => {
      try {
        const authorizationHeader: string = headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);

        const driver: Driver = getDriver();
        const socialService: SocialService = new SocialService(driver);

        const output: MutualData[] = await socialService.mutual(jwtToken);
        return output;
      } catch (error: any) {
        throw error
        }
      }, authorizationBearerSchema
    )

    .get('/api/social/mutual/:conversingUsername', async ({ headers, params }): Promise<PrivateMessage[]> => {
      try {
        const authorizationHeader = headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);

        const conversingUsername: string = params.conversingUsername

        const chatService = new ChatService()
        const output: PrivateMessage[] = await chatService.privateInboxData(jwtToken, conversingUsername)

        return output as PrivateMessage[]
      } catch (error: any) {
        throw new Error("Unauthorized")
        }
      }, getMutualConversationSchema
    )

    .post('/api/social/status/online', async ({ headers, body }): Promise<void> => {
      try {
        const authorizationHeader: string = headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);

        const { activity, userAgent, osName } = body
        const ipAddress: string = "toFollowlaterssss"
        
        const driver: Driver = getDriver();
        const socialService: SocialService = new SocialService(driver);

        await socialService.setStatusOnline(activity, userAgent, osName, ipAddress, jwtToken);
    
      } catch (error: any) {
        throw new Error("Unauthorized")
        }
      }, setOnlineStatusSchema
    )
    
    .get('/api/social/mutual/online', async ({ headers }): Promise<PlayerStatus[]> => {
      try {
        const authorizationHeader: string = headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);

        const driver: Driver = getDriver();
        const socialService: SocialService = new SocialService(driver);
        const output: PlayerStatus[] = await socialService.mutualStatus(jwtToken)

        return output as PlayerStatus[]
      } catch (error: any) {
        throw new Error("Unauthorized")
        }
      }, authorizationBearerSchema
    )

    .post('/api/social/gift/card', async ({ headers, body }): Promise<SuccessMessage> => {
      try {
        const authorizationHeader: string = headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }
        const jwtToken: string = authorizationHeader.substring(7);

        const driver: Driver = getDriver();
        const socialService: SocialService = new SocialService(driver);
        const output: SuccessMessage = await socialService.sendCardGift(jwtToken, body)

        return output as SuccessMessage
      } catch(error: any) {
        throw error
      }
      }, cardGiftSchema
    )

  };

export default social;

