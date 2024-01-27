import Elysia, { Context } from 'elysia';
import jwt from 'jsonwebtoken'

import { getDriver } from '../db/memgraph';
import AuthService from '../user.services/auth.service';

import { Driver } from 'neo4j-driver';
import { JWT_SECRET } from '../config/constants';
import { AuthenticateReturn, ValidateSessionReturn } from '../user.services/user.service.interface';



const auth = (app: Elysia): void => {
  
  app.post("api/login/beats", async (context: Context) => {
    try {
      const { username, password } = context.body as { username: string; password: string };
      const driver: Driver = getDriver();
      const authService: AuthService = new AuthService(driver);
      const output: AuthenticateReturn = await authService.authenticate(username, password);
      const { token, uuid, ...userProperties } = output;

      const response = {
        user: userProperties,
        validator: token,
        lookup: uuid,
        message: 'You are now logged in',
        success: 'OK',
        token: token
      };
      return(response);
    } catch (error: any) {
      console.log(`Login error: ${error.message}`);
      return error
    }
  })
  .post('/api/validate_session/beats', async (context: Context) => {
    try {
      const authorizationHeader = context.headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Bearer token not found in Authorization header');
      }
      const jwtToken: string = authorizationHeader.substring(7);
      const decodedToken: string | jwt.JwtPayload = jwt.verify(jwtToken, JWT_SECRET)
      const { userName } = decodedToken as { userName: string };

      const driver: Driver = getDriver();
      const authService: AuthService = new AuthService(driver);
      return await authService.validateSession(userName) as ValidateSessionReturn

    } catch (error: any) {
      console.error(`Session validation error: ${error.message}`);
      return { error: error.message };
    }
  })
  .post('/api/version-check/beats', async (context) => {
    const currentVersion = {
      apiKey: '1',
      apiId: 'Hello World',
      gameVersion: '0.1',
      logLevel: '2'
    };
    let isVersionCurrent = true;
    for (const key in currentVersion) {
      //@ts-ignore
      if (context.body[key] !== currentVersion[key]) {
        isVersionCurrent = false;
        break;
      }
    }
    if (isVersionCurrent) {
      return('Your app is up to date!');
    } else {
      return('Please update your app');
    }
  })
  .post('/api/register/beats', async (context: Context) => {
    try {
        const { anon, email, userName, password, firstName, lastName } = context.body as 
        { anon: boolean, email: string, userName: string, password: string, firstName: string, lastName: string };
      const driver: Driver = getDriver();
      const authService = new AuthService(driver);
      const output = await authService.register(anon, email, password, userName, firstName, lastName);
      return(output);
    } catch (error: any) {
      return(error);
    }
  })
};

export default auth;
