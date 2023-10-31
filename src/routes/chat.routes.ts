
// import ChatService from "../game.services/chat.service";

import Elysia from "elysia";



 const chat = (app: Elysia) => {
  
   app.ws('/api/chats/:room', {
    //@ts-ignore
    message(ws, message) {
        ws.send(message)
        const params = ws.data.params
        console.log(params)
        
    }
})

//   done();
 };

 export default chat;
