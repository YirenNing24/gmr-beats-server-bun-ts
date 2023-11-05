import Elysia from "elysia";
import ChatService from "../chat.services";
import listenAll from "../chat.services/listeners";

interface Message {
    message: string
    roomdId: string
    username: string
}



 const chat = (app: Elysia) => {

   app.ws('/api/chats/:room', { async message(ws, message: Message) {
        try {
            
            //@ts-ignore
            // const authorizationHeader: string | null = ws.data.headers.authorization;
            // if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
            //   ws.close()
            //   return 
            // }
            
            // const jwtToken: string | null = authorizationHeader.substring(7);
            // // Verify the JWT token using 'jsonwebtoken' with options
            // const decodedToken = await ws.data.jwt.verify(jwtToken);
            
            const room: string = ws.data.params.room;
            const chatService: ChatService = new ChatService()
            chatService.chatRoom(room, ws)

            listenAll(message)

            

        } catch (error) {
            ws.send(error)
            ws.close()
            // You can send an error response to the client if needed.
            // ws.send('Error: JWT verification failed');
        }}
    })

//   done();
};

 export default chat;
