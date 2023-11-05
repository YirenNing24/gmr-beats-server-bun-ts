// * ELYSIA APP
import Elysia from 'elysia'

// * ROUTE FILES
import auth from './auth.routes'
import store from './store.routes'
import profile from './profile.routes'
import inventory from './inventory.route'
import chat from './chat.routes'


// import { insertChats } from '../game.services/chat.service';
// Routes Registration Function
// This function is responsible for registering all the routes and services within the application.

const routes = (app: Elysia) => {
    //@ts-ignore
    app.use(auth)
    //@ts-ignore
    app.use(profile)
    //@ts-ignore
    app.use(store)
    //@ts-ignore
    app.use(inventory)
    //@ts-ignore
    app.use(chat)
  }
  

export default routes;
