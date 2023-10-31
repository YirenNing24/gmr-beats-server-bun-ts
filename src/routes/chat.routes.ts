
// import ChatService from "../game.services/chat.service";

import Elysia from "elysia";



 const chat = (app: Elysia) => {
  
   app.ws('/api/chats/:room', {
    open(ws) {
        const data = ws.data
        console.log(data)
    },
    message(ws, message) {
        ws.send(message)
        const params = ws.data
    }
})

//   done();
 };

 export default chat;
