import Elysia from "elysia";
import ChatService from "../chat.services";






 const chat = (app: Elysia) => {

   app.ws('/api/chats/:room', {
    open(ws) {
        // const room: string = ws.data.params.room
        const chatService = new ChatService()
        const initializePubSub = chatService.initPubSub(ws)
        
    },
})

//   done();
 };

 export default chat;
