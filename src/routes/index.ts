// * ELYSIA APP
import Elysia from 'elysia'

// * ROUTE FILES
import auth from './auth.routes'
import gacha from './gacha.routes'
import inventory from './inventory.route'
import leaderboards from './leaderboard.routes'
import profile from './profile.routes'
import scores from './scores.routes'
import social from './social.routes'
import store from './store.routes'
import upgrade from './upgrade.routes'
import rewards from './rewards.routes'

import chat from './chat.routes'



const routes = (app: Elysia): void => {

    app.use(auth)
    app.use(gacha)
    app.use(inventory)
    app.use(leaderboards)
    app.use(profile)
    app.use(scores)
    app.use(social)
    app.use(store)
    app.use(inventory)
    app.use(chat)
    app.use(upgrade)
    app.use(rewards)

}


export default routes;
