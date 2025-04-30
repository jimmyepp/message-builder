// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwdxBBKdZKWq8607RX9qYXXuSH0Y70-8M",
  authDomain: "message-builder.firebaseapp.com",
  projectId: "message-builder",
  storageBucket: "message-builder.appspot.com",
  messagingSenderId: "620007229764",
  appId: "1:620007229764:web:06a24e72c2298ddf022f11",
  measurementId: "G-V4J3HTB2L9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
