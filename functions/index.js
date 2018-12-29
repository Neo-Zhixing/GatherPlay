const functions = require('firebase-functions')
const admin = require('firebase-admin')


const adminConfig = JSON.parse(process.env.FIREBASE_CONFIG)
adminConfig.credential = admin.credential.applicationDefault()
admin.initializeApp(adminConfig)

admin.firestore().settings({
  timestampsInSnapshots: true
})
