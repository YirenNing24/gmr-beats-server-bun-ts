import app from "./app";
import { APP_PORT, IP_ADDRESS} from "./config/constants";


const port: number = APP_PORT;
const hostname: string = 'kjjddw0w-8081.asse.devtunnels.ms'

app.listen({ port }, () => {
    console.log(`Beats admin server is running on port http://${hostname}:${port}/`);
});
