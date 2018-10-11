import axios from 'axios'
import firebase from 'firebase/app'
import firebaseui from 'firebaseui'

import 'firebase/auth'
/*
import 'firebase/firestore'
import 'firebase/messaging'
import 'firebase/functions'
import 'firebase/messaging'
*/

const firebaseLoader = axios.get('/__/firebase/init.json')
  .then(response => {
    firebase.initializeApp(response.data)
    return firebase
  })

export default firebaseLoader

export const UILoader = firebaseLoader
  .then(firebase => {
    const ui = new firebaseui.auth.AuthUI(firebase.auth())
    return (element, uiShown) => {
      return new Promise((resolve, reject) => {
        const uiConfig = {
          callbacks: {
            signInSuccessWithAuthResult: (authResult, redirectUrl) => {
              resolve(authResult, redirectUrl)
              return true
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
            firebase.auth.PhoneAuthProvider.PROVIDER_ID
          ],
          // Terms of service url.
          tosUrl: '#',
          // Privacy policy url.
          privacyPolicyUrl: '#'
        }
        ui.start(element, uiConfig)
      })
    }
  })
