import Elysia from "elysia";

const chat = (app: Elysia) => {
  app.ws('/api/chats/:room', {
    message(ws, message) {
      // Get the value of the :room parameter from the URL
      //@ts-ignore
      const room = ws.request.params.room;
      console.log(`Received message for room: ${room}`);
      
      ws.send(message);
    }
  });
};

export default chat;
