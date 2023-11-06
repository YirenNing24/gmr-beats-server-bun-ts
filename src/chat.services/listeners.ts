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
  try {
    // Check if the message is not blank or null
    const connection: rt.Connection = await getRethinkDB();
    // Insert the parsed message into the "chats" table with a time
      await rt.db(RDB_DATABASE)
        .table("chats")
        .insert(Object.assign(message, { ts: Date.now()}))
        .run(connection);
  } catch (error: any) {
    console.error("Error processing message:", error);
  }
};

export default listenAll;
