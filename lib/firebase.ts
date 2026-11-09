import { getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const firebaseEnabled = Boolean(config.apiKey && config.projectId)

let app: FirebaseApp | undefined

function getApp(): FirebaseApp {
  if (!firebaseEnabled) throw new Error("Firebase não configurado (.env.local)")
  app ??= getApps()[0] ?? initializeApp(config)
  return app
}

export const firebaseAuth = (): Auth => getAuth(getApp())
export const firebaseDb = (): Firestore => getFirestore(getApp())
