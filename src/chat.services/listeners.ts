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

const listenAll = async (message: Message): Promise<void> => {
    console.log(message, "listen allll")
  try {
    const parsedMessage = JSON.parse(message.toString());

    // Check if the message is not blank or null
    if ( parsedMessage && parsedMessage.message !== null && parsedMessage.message !== "") {
      const connection: rt.Connection = await getRethinkDB();

    // Insert the parsed message into the "chats" table with a time
      await rt.db(RDB_DATABASE)
        .table("chats")
        .insert({
          ...parsedMessage,
          ts: Date.now(),
        })
        .run(connection);
    }
  } catch (error: any) {
    console.error("Error processing message:", error);
  }
};

export default listenAll;
