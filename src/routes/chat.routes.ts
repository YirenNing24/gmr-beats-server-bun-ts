
// import ChatService from "../game.services/chat.service";

import Elysia from "elysia";



 const chat = (app: Elysia) => {
  
   app.ws('/api/chats/:room', {
    message(ws, message) {
        ws.send(message)
    }
})

//   done();
 };

 export default chat;
