import app from "./app";
import { APP_PORT } from "./config/constants";

const port: number = APP_PORT;

app.listen({ port, hostname: '0.0.0.0' }, () => {
    console.log(`Beats admin server is running on port http://localhost:${port}/`);
});
