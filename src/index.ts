import app from "./app";
import { APP_PORT, IP_ADDRESS} from "./config/constants";


const port: number = APP_PORT;
const hostname: string = IP_ADDRESS

app.listen({ port }, () => {
    console.log(`Beats admin server is running on port http://${hostname}:${port}/`);
});
