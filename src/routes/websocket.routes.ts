import Elysia from "elysia";
import jwt, { JwtPayload } from 'jsonwebtoken'

import ChatService from "../websocket.services/chat.socket.service";
import { JWT_SECRET } from "../config/constants";
import { insertChats } from "../websocket.services/chat.socket.service";

interface SenderData {
    username: string
    level: number
    rank: string
  }
  
interface NewMessage{
    id: string
    message: string
    roomId: string
    sender: SenderData
    receiver: string
    ts: number
  }
  
// {
//     "message": "string",
//     "roomdId": "string",
//     "username": "string"
// }

 const chat = (app: Elysia): void => {
   app.ws('/api/chats/:room', { 
    async open(ws) {
        //@ts-ignore
        const room: string = ws.data.params.room
        const authorizationHeader: string = ws.data.headers.authorization || ""
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
          throw new Error('Bearer token not found in Authorization header');
        }

        const jwtToken: string = authorizationHeader.substring(7);
        const decodedToken: string |JwtPayload = jwt.verify(jwtToken, JWT_SECRET)
        const { username } = decodedToken as { username: string };

        const chatService: ChatService = new ChatService()
        chatService.chatRoom(room, username, ws)
        ws.subscribe(room)
        }
    ,async message(ws, message){

        const newMessage = message as NewMessage
        insertChats(newMessage)


    }
    })


};

 export default chat;
