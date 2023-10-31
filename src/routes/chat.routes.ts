
// import ChatService from "../game.services/chat.service";

import Elysia from "elysia";



 const chat = (app: Elysia) => {
  
   app.ws('/api/chats/:room', {
    //@ts-ignore
    message(ws, message, route) {
        ws.send(message)
        console.log(route)
    }
})

//   done();
 };

 export default chat;
