import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, TwitterAuthProvider } from "firebase/auth";

import config from '@util/config';
import logger from '@util/logger';

export default class FirebaseManager {

  constructor(game, emitter) {
    logger.log('FirebaseManager: constructor');

    this.game = game;
    this.emitter = emitter;

    this.twitterProvider = new TwitterAuthProvider();

    this.app = initializeApp(config.firebaseConfig);
    this.auth = getAuth(this.app);
  }

  async twitterSigninPopup() {
    try {
      const result = await signInWithPopup(this.auth, this.twitterProvider);

      this.credential = TwitterAuthProvider.credentialFromResult(result);
      this.setTokens(result);
    } catch (error) {
      logger.error('Twitter popup error', error);

      // const credential = TwitterAuthProvider.credentialFromError(error);
      // console.log('error credential', credential);
    }
  }

  setTokens(response) {
    this.idToken = response._tokenResponse.idToken;
    this.refreshToken = response._tokenResponse.refreshToken;
    this.user = response.user;
  }

  async updateTokens() {
    return this.auth.currentUser.getIdToken(true);
  }
}