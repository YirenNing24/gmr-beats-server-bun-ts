import auth from './auth.routes'
import store from './store.routes'
import profile from './profile.routes'
import inventory from './inventory.route'
import chat from './chat.routes'
import { initializeChatService } from '../chat.services'

// import { insertChats } from '../game.services/chat.service';
// Routes Registration Function
// This function is responsible for registering all the routes and services within the application.

const routes = (app: any) => {

    app.use(auth)
    app.use(profile)
    app.use(store)
    app.use(inventory)
    
    app.use(chat)
    app.use(initializeChatService)

    //   app.register(chat);
    //   app.register(insertChats)


  }
  

export default routes;
