import Elysia from "elysia";
import ChatService from "../chat.services";
import listenAll from "../chat.services/listeners";

interface Message {
    message: string
    roomdId: string
    username: string
}

// {
//     "message": "string",
//     "roomdId": "string",
//     "username": "string"
// }

 const chat = (app: Elysia): void => {
   app.ws('/api/chats/:room', { 
    open(ws) {
        //@ts-ignore
        const room: string = ws.data.params.room
        const chatService: ChatService = new ChatService()
        chatService.chatRoom(room, ws)

    }, message(ws, message) {
        //@ts-ignore
        const msg = message as Message
        listenAll(msg)
    }})

//    app.ws('/api/chats/:room', 
//    { async open(ws) {
    
//         try {
//             //@ts-ignore
//             // const authorizationHeader: string | null = ws.data.headers.authorization;
//             // if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
//             //   ws.close()
//             //   return 
//             // }
            
//             // const jwtToken: string | null = authorizationHeader.substring(7);
//             // // Verify the JWT token using 'jsonwebtoken' with options
//             // const decodedToken = await ws.data.jwt.verify(jwtToken);
//             // const msg = message as Message
//             // ws.send(message)
//             // await listenAll(msg)
        
//             const room: string = ws.data.params.room
//             const chatService: ChatService = new ChatService()
//             chatService.chatRoom(room, ws)

//         } catch (error) {
//             ws.send(error)
//             ws.close()
//             // You can send an error response to the client if needed.
//             // ws.send('Error: JWT verification failed');
//         }}
//     })
    
//     .ws('/api/chats/:room', { message(ws, message) {
//         try {
//             console.log(message)
//             //@ts-ignore
//             // const authorizationHeader: string | null = ws.data.headers.authorization;
//             // if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
//             //   ws.close()
//             //   return 
//             // }
            
//             // const jwtToken: string | null = authorizationHeader.substring(7);
//             // // Verify the JWT token using 'jsonwebtoken' with options
//             // const decodedToken = await ws.data.jwt.verify(jwtToken);
//             // const msg = message as Message
//             // ws.send(message)
//             // await listenAll(msg)
//             const msg = message as Message
//             console.log(msg)
//             listenAll(msg)

//         } catch (error) {
//             ws.send(error)
//             ws.close()
//             // You can send an error response to the client if needed.
//             // ws.send('Error: JWT verification failed');
//         }}
//     })

//   done();
};

 export default chat;
