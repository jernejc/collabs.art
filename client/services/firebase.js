import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, TwitterAuthProvider } from "firebase/auth";

import config from '@util/config';
import logger from '@util/logger';
import { sleep } from '@util/helpers';

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

    let response = await this.checkAndRetryClaims()

    if (response) {
      this.claims = response.claims;
      this.idToken = response.token;

      this.game.tools.updateTokenInfo();
    }
  }

  async checkAndRetryClaims() {
    logger.log('FirebaseManager: checkAndRetryClaims');
    let count = 1;

    const response = await this.auth.currentUser.getIdTokenResult(true);

    if (!response.claims || !response.claims.grants) { // retry cause
      if (count === 5)
        return;

      count++;
      await sleep(1000 * count);
      response = await this.checkAndRetryClaims();
    }

    return response;
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