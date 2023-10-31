import Elysia from "elysia";

const chat = (app: Elysia) => {
  app.ws('/api/chats/:room', {
    message(ws, message) {
      // Access the 'room' parameter from the URL using ws.params
      //@ts-ignore
      const room = ws.params.room;
      
      // Now, you can use the 'room' variable in your WebSocket handler
      console.log(`Room: ${room}`);
      
      // Send the message
      ws.send(message);
    }
  });
};

export default chat;
