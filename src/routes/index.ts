import Elysia from 'elysia'

import auth from './auth.routes'
import store from './store.routes'
import profile from './profile.routes'
import inventory from './inventory.route'
import chat from './chat.routes'


// import { insertChats } from '../game.services/chat.service';
// Routes Registration Function
// This function is responsible for registering all the routes and services within the application.

const routes = (app: any) => {

    //@ts-ignore
    app.use(auth)
    //@ts-ignore
    .use(profile)
    //@ts-ignore
    .use(store)
    //@ts-ignore
    .use(inventory)
    //@ts-ignore
    .use(chat)


    //   app.register(chat);
    //   app.register(insertChats)


  }
  

export default routes;
