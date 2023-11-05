import auth from './auth.routes'
import store from './store.routes'
import profile from './profile.routes'
import inventory from './inventory.route'
import chat from './chat.routes'

import Elysia from 'elysia'

// import { insertChats } from '../game.services/chat.service';
// Routes Registration Function
// This function is responsible for registering all the routes and services within the application.

const routes = (app: Elysia) => {

    app.use(auth)
    .use(profile)
    .use(store)
    .use(inventory)
    .use(chat)


    //   app.register(chat);
    //   app.register(insertChats)


  }
  

export default routes;
