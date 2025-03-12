import { useState } from "react";
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const emailSignIn = async () => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async () => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  return (
    <div>
      <h2>Login</h2>
      <button onClick={googleSignIn}>Sign in with Google</button>
      <div>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <button onClick={emailSignIn}>Login</button>
        <button onClick={register}>Register</button>
      </div>
      <button onClick={logOut}>Logout</button>
    </div>
  );
};

export default Auth;
