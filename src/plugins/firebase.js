import axios from 'axios'
import firebase from 'firebase'
import firebaseui from 'firebaseui'
import 'firebase-init'

export default firebase

export const db = firebase.firestore()

const dbSettings = {
  timestampsInSnapshots: true,
}

db.settings(dbSettings)

export const auth = firebase.auth()

export const functions = firebase.functions()
functions.emulatorOrigin = process.env.VUE_APP_FUNC_EMULATOR_HOST || null

export const AuthUI = new firebaseui.auth.AuthUI(firebase.auth())

export function LoadAuthUI (element, uiShown) {
  return new Promise((resolve, reject) => {
    const uiConfig = {
      callbacks: {
        signInSuccessWithAuthResult: (authResult, redirectUrl) => {
          resolve(authResult, redirectUrl)
          return true
        },
        signInFailure: error => {
          reject(error)
        },
        uiShown: uiShown,
      },
      // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
      signInFlow: 'popup',
      signInSuccessUrl: '#',
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      ],
      // Terms of service url.
      tosUrl: '#',
      // Privacy policy url.
      privacyPolicyUrl: '#'
    }
    AuthUI.start(element, uiConfig)
  })
}

export const client = axios.create({
  baseURL: process.env.VUE_APP_API_ENDPOINT,
  timeout: 30000,
  headers: {}
})

client.interceptors.request.use(config => {
  // TODO: when user's not logged in, reject the request
  return auth.currentUser
    .getIdToken(/* forceRefresh */ false)
    .then(idToken => {
      config.headers['Authorization'] = 'Bearer ' + idToken
      return config
    })
})
