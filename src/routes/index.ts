// * ELYSIA APP
import Elysia from 'elysia'

// * ROUTE FILES
import auth from './auth.routes'
import store from './store.routes'
import profile from './profile.routes'
import inventory from './inventory.route'
import chat from './chat.routes'
import listenAll from '../chat.services/listeners'

// import { insertChats } from '../game.services/chat.service';
// Routes Registration Function
// This function is responsible for registering all the routes and services within the application.

const routes = (app: Elysia): void => {

    app.use(auth)
    app.use(profile)
    app.use(store)
    app.use(inventory)
    app.use(chat)

}


export default routes;
