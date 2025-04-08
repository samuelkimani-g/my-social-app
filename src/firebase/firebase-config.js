import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyBKbCclI7KjT_QP3fWpxHwvVph_fvXY-6U",
  authDomain: "socia-media-app-8d1a1.firebaseapp.com",
  projectId: "socia-media-app-8d1a1",
  storageBucket: "socia-media-app-8d1a1.firebasestorage.app",
  messagingSenderId: "536282279615",
  appId: "1:536282279615:web:88739bc1cbf45198f8e00a",
  measurementId: "G-TBKJGW8CWB",
}

const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
export const auth = getAuth(app)
