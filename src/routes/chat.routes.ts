
// import ChatService from "../game.services/chat.service";



// const router = (app: FastifyInstance, options: FastifyPluginOptions, done: () => void) => {
  
//   app.get("/api/chats/:room", { websocket: true}, (connection: any, request: FastifyRequest) => {
//       try {
//         //@ts-ignore
//         const room:string = request.params.room;

//         const chatService = new ChatService(connection);
//         chatService.chatRoom(room)
//       } catch (error) {
//         console.log(error)
//       }
//     }
//   );

//   done();
// };

// export default router;
