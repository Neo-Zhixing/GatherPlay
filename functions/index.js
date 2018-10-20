global.__base = __dirname + '/'
global.__src = __base + 'src/'
global.__proj = __base + '../'
const functions = require('firebase-functions')
const admin = require('firebase-admin')

const express = require('express')

const app = express()
app.set('views', './views')
app.set('view engine', 'pug')

const keys = require(__base + 'keys.json')
admin.initializeApp({
  credential: admin.credential.cert(keys['firebase_service_account']),
  databaseURL: keys.firebase.databaseURL,
})

require(__src + 'spotify/auth')(app)

// Expose Express API as a single Cloud Function:
exports.api = functions.https.onRequest(app)

const auth_functions = require('./src/auth')
//exports.user_create = auth_functions.create
//exports.user_delete = auth_functions.delete
