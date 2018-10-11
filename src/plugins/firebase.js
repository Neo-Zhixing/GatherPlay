import firebase from 'firebase/app'
import firebaseui from 'firebaseui'
import keys from '@/keys.json'

import 'firebase/auth'
/*
import 'firebase/firestore'
import 'firebase/messaging'
import 'firebase/functions'
import 'firebase/messaging'
*/
firebase.initializeApp(keys.firebase)

export default firebase

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
