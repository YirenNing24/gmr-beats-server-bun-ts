import Elysia from "elysia";
import jwt, { JwtPayload } from 'jsonwebtoken'

import ChatService from "../websocket.services/chat.socket.service";
import { JWT_SECRET } from "../config/constants";


 const chat = (app: Elysia): void => {
   app.ws('/api/chats/:room', { 
    open(ws) {
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
        chatService.chatRoom(room, username)
        ws.subscribe(room)
    }})

};

 export default chat;
