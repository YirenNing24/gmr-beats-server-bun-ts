//* ELYSIA
import Elysia from "elysia";
import { cors } from '@elysiajs/cors'

//* DATABASES
import { initDriver } from './db/memgraph';

//* INITIALIZERS
import { NEO4J_PASSWORD, NEO4J_URI, NEO4J_USERNAME } from './config/constants.js';
import routes from "./routes/index";


const app: Elysia = new Elysia()

//@ts-ignore
app.use(cors({
  origin: ['http://localhost:8081'],
  methods: ["GET", "POST", "HEAD", "PUT", "OPTIONS"],
  allowedHeaders: [
    "content-Type",
    "authorization",
    "origin",
    "x-Requested-with",
    "accept",
  ],
  credentials: true,
  maxAge: 600,
}))
//@ts-ignore
.use(routes);

//@ts-ignore
initDriver(NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD);

export default app