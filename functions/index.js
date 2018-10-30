const functions = require('firebase-functions')
const admin = require('firebase-admin')

const express = require('express')

const app = express()
app.set('view engine', 'pug')

const keys = require('./src/keys.json')
admin.initializeApp({
  credential: admin.credential.cert(keys['firebase_service_account']),
  databaseURL: keys.firebase.databaseURL,
})

app.get('/api/spotify/auth', require('./src/spotify/auth').handler)

// Expose Express API as a single Cloud Function:
exports.api = functions.https.onRequest(app)
