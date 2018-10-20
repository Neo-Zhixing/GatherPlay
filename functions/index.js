global.__base = __dirname + '/'
global.__src = __base + 'src/'
global.__proj = __base + '../'
const functions = require('firebase-functions')
const admin = require('firebase-admin')

const keys = require(__base + 'keys.json')
const config = require(__proj + 'config.json')
admin.initializeApp({
  credential: admin.credential.cert(keys['firebase_service_account']),
  databaseURL: keys.firebase.databaseURL,
})

admin.firestore().settings({
  timestampsInSnapshots: true
})

const express = require('express')

const app = express()
app.set('views', './views')
app.set('view engine', 'pug')

const router = express.Router()

require(__src + 'spotify/auth')(router, exports)

app.use(config.func_base_url, router)
// Expose Express API as a single Cloud Function:
exports.api = functions.https.onRequest(app)

const auth_functions = require('./src/auth')
//exports.user_create = auth_functions.create
//exports.user_delete = auth_functions.delete
