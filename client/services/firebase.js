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
    this.loggedIn = false;

    this.initListeners();
  }

  initListeners() {
    this.auth.onAuthStateChanged((user) => {
      logger.log('FirebaseManager: onAuthStateChanged')

      if (user) {
        this.setUser(user);
      } else {
        this.loggedIn = false;
      }
    });
  }

  async twitterSigninPopup() {
    logger.log('FirebaseManager: twitterSigninPopup');

    try {
      const result = await signInWithPopup(this.auth, this.twitterProvider);

      if (!result)
        throw new Error('No signup response found');

      this.credential = TwitterAuthProvider.credentialFromResult(result);
      this.setUser(result.user);
    } catch (error) {
      logger.error('FirebaseManager: Twitter popup error', error);

      // const credential = TwitterAuthProvider.credentialFromError(error);
      // console.log('error credential', credential);
    }
  }

  setUser(user) {
    logger.log('FirebaseManager: setUser');

    this.user = user;

    if (user.stsTokenManager.accessToken)
      this.idToken = user.stsTokenManager.accessToken;
    if (user.stsTokenManager.refreshToken)
      this.refreshToken = user.stsTokenManager.refreshToken;
    if (user.reloadUserInfo)
      this.userInfo = user.reloadUserInfo;
    if (this.userInfo && this.userInfo.customAttributes)
      this.claims = JSON.parse(this.userInfo.customAttributes);

    this.loggedIn = true;

    this.game.tools.updateTokenInfo();
  }

  async updateTokens() {
    logger.log('FirebaseManager: updateTokens');

    const response = await this.auth.currentUser.getIdTokenResult(true);

    this.claims = response.claims;
    this.idToken = response.token;

    this.game.tools.updateTokenInfo();
  }

  get twitterGrantUsed() {
    const claims = this.claims;

    if (!claims)
      return;

    const grants = claims.grants;

    if (!grants)
      return;

    return grants && grants.includes('twitter:login');
  }

  get twitterScreenName() {
    if (!this.userInfo)
      return;

    return `@${this.userInfo.screenName}`
  }
}