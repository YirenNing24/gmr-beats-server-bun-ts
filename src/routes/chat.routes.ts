//** ELYSIA IMPORT
import Elysia from "elysia";

//** JWT IMPORT
import jwt, { JwtPayload } from 'jsonwebtoken';

//** CHAT SERVICE IMPORT
import ChatService, { insertChats } from "../chat.services/chat.socket.service";
import { NewMessage } from "../chat.services/chat.interface";

//** SERVER TIME SERVICE IMPORT
import TimeService from "../game.services/time.services/time.service";

//** CONFIG IMPORT
import ValidationError from "../outputs/validation.error";
import { changeProfilePicsSchema } from "./route.schema/schema.profile";

const chat = (app: Elysia): void => {
  app.ws('/api/ws', {
      async open(ws) {
        try {
          const room: string = 'all';
          const authorizationHeader: string = ws.data.headers.authorization || "";

          if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
            throw new ValidationError('jwt issue', 'jwt issue');
          }

          const jwtToken: string = authorizationHeader.substring(7);

          //@ts-ignore
          const chatService: ChatService = new ChatService(ws);
          chatService.chatRoom(room, jwtToken);
          ws?.subscribe('all');
        } catch (error: any) {
          throw error;
        }
      },

      async message(ws, message) {
        try {
          const newMessage: NewMessage = message as NewMessage;

          newMessage?.roomId && (await insertChats(newMessage));
          //@ts-ignore
          const timeService: TimeService = new TimeService(ws);
          newMessage?.timestamp && (await timeService.getServerDateTime(newMessage));
        } catch (error: any) {
          console.error('Error in WebSocket message event:', error);
          throw error;
        }
      }
      
    }
  ), changeProfilePicsSchema
  

  app.ws('/api/ws/group-chat', {
    async open(ws) {
      try {
        const room: string = 'all';
        const authorizationHeader: string = ws.data.headers.authorization || "";

        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new ValidationError('jwt issue', 'jwt issue');
        }

        const jwtToken: string = authorizationHeader.substring(7);

        //@ts-ignore
        const chatService: ChatService = new ChatService(ws);
        chatService.groupChatRoom(jwtToken);
        ws?.subscribe('all');
      } catch (error: any) {
        throw error;
      }
    },

    async message(ws, message) {
      try {
        const newMessage: NewMessage = message as NewMessage;

        newMessage?.roomId && (await insertChats(newMessage));
        //@ts-ignore
        const timeService: TimeService = new TimeService(ws);
        newMessage?.timestamp && (await timeService.getServerDateTime(newMessage));
      } catch (error: any) {
        console.error('Error in WebSocket message event:', error);
        throw error;
      }
    }
    
  }
), changeProfilePicsSchema


};

export default chat;
