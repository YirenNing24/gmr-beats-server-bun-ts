// * WEBSOCKET SERVER
import { WebSocketServer } from "ws";

// * RETHINK DB IMPORTS
import rt from "rethinkdb";
import { getRethinkDB } from "../db/rethink";
import { RDB_DATABASE } from "../config/constants";

interface Message {
    message: string
    roomdId: string
    username: string
}

const listenAll = async (message: Message) => {
  try {
    const parsedMessage = JSON.parse(message.toString());
    if ( parsedMessage && parsedMessage.message !== null && parsedMessage.message !== "") 
    {
      const connection: rt.Connection = await getRethinkDB();
      await rt
        .db(RDB_DATABASE)
        .table("chats")
        .insert({
          ...parsedMessage,
          ts: Date.now(),
        })
        .run(connection);
    }
  } catch (error: any) {
    throw Error("Error processing message:", error);
  }
};

export default listenAll;
