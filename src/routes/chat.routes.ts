
// import ChatService from "../game.services/chat.service";

import Elysia from "elysia";



 const chat = (app: Elysia) => {
  
   app.ws('/api/chats/:room', {
    //@ts-ignore
    message(ws, message, route) {
        const roomParam = route.params.room;

        // Now, you can use the 'roomParam' as needed
        console.log('Room parameter:', roomParam);
        ws.send(message)
    }
})

//   done();
 };

 export default chat;
