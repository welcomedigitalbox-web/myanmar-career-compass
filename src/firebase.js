import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBsYJBDE5kDQH2iFE4I1LY0S0xNgO6NT7Q",
  authDomain: "careertest-3a4ad.firebaseapp.com",
  projectId: "careertest-3a4ad",
  storageBucket: "careertest-3a4ad.firebasestorage.app",
  messagingSenderId: "804874192098",
  appId: "1:804874192098:web:fe9105a119c9adcf07cabb"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
