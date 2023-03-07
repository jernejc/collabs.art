import config from '@util/config';
import { deleteCookie, setCookie, getCookie, pushGTMEvent } from '@util/helpers';
import logger from '@util/logger';
import Button from './form/button';

export default class Slideshow {
  constructor({ game, parent, overlay, buttonAction }) {
    logger.log('Slideshow: constructor');

    if (parent)
      this.parent = parent;
    if (buttonAction)
      this.buttonAction = buttonAction;
    if (overlay)
      this.overlay = overlay;
    if (game)
      this.game = game;

    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'slideshow');

    this.articles = config.slideshow.articles;

    this.bindNavAction = this.navAction.bind(this);
    this.bindNextPrevAction = this.nextPrevAction.bind(this);
    this.bindToggleCookie = this.toggleCookie.bind(this);

    this.setupDom();
  }

  setupDom() {
    logger.log('Slideshow: setupDom');

    this.index = 0;
    this.slideIndex = 0;
    this.slides = [];
    this.navItems = [];

    this.slidesWrapper = document.createElement('div');
    this.slidesWrapper.classList.add('slides-wrapper');

    this.navWrapper = document.createElement('div');
    this.navWrapper.classList.add('slides-nav');

    this.navItemsWrapper = document.createElement('div');
    this.navItemsWrapper.classList.add('slides-nav-items');

    this.navItemsWrapper.addEventListener('click', this.bindNavAction);

    this.leftIcon = document.createElement('i')
    this.leftIcon.classList.add('gg-play-button', 'left', 'disabled');

    this.rightIcon = document.createElement('i')
    this.rightIcon.classList.add('gg-play-button', 'right');

    this.leftIcon.addEventListener('click', this.bindNextPrevAction);
    this.rightIcon.addEventListener('click', this.bindNextPrevAction);

    this.actionBarForm = document.createElement('div');
    this.actionBarForm.classList.add('action-bar');

    this.slideActionButton = new Button({
      elClasses: ['slide-action'],
      text: 'Launch app',
      clickAction: this.slideAction.bind(this)
    });

    this.actionBarForm.append(this.slideActionButton.domElement);

    this.docsIcon = new Button({
      elClasses: ['docs-action'],
      icon: 'gg-file-document',
      text: 'Docs',
      clickAction: async () => {
        this.docsAction();
      }
    });
    this.actionBarForm.append(this.docsIcon.domElement);

    this.discordButton = new Button({
      elClasses: ['discord-action'],
      icon: 'discord-icon.png',
      clickAction: async () => {
        this.discordAction();
      }
    });
    this.actionBarForm.append(this.discordButton.domElement)

    this.twitterButton = new Button({
      elClasses: ['twitter-action'],
      icon: 'twitter-logo.png',
      clickAction: async () => {
        this.twitterAction();
      }
    });
    this.actionBarForm.append(this.twitterButton.domElement)

    const overlayCookie = getCookie('no_overlay');

    this.keyNoteWrapper = document.createElement('span');
    this.keyNoteWrapper.classList.add('key-note', 'noselect');
    this.keyNoteWrapper.addEventListener('click', this.bindToggleCookie);

    this.cookieToggleInput = document.createElement('input');
    this.cookieToggleInput.type = 'checkbox';

    this.cookieToggleInput.addEventListener('click', this.bindToggleCookie);

    if (overlayCookie)
      this.cookieToggleInput.setAttribute('checked', true);

    this.keyNoteWrapper.append(this.cookieToggleInput);
    this.keyNoteWrapper.innerHTML += '&nbsp;Don\'t show again';
    this.actionBarForm.append(this.keyNoteWrapper);

    this.articles.forEach((article, i) => {
      let active = false;

      if (i === 0)
        active = true;

      const navItem = this.navTemplate({ ...article, active });
      this.navItems.push(navItem)
      this.navItemsWrapper.append(navItem);

      const slide = this.slideTemplate({ ...article, active });
      this.slides.push(slide);
      this.slidesWrapper.append(slide);

      if (active) {
        this.currentSlide = slide;
        this.currentNav = navItem;
      }
    });

    this.navWrapper.append(this.navItemsWrapper);
    this.navWrapper.prepend(this.leftIcon);
    this.navWrapper.append(this.rightIcon);

    this.slidesWrapper.append(this.navWrapper);
    this.slidesWrapper.append(this.actionBarForm);

    this.domElement.append(this.slidesWrapper);

    this.insipredBy = document.createElement('div');
    this.insipredBy.id = 'inspired-by';

    this.insipredBy.innerHTML = `
      creds <a href="https://en.wikipedia.org/wiki/Poietic_Generator" target="_blank">Poietic Generator</a> 
      and 
      <a href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life" target="_blank">Game of Life</a>
    `

    this.gameOfLifeButton = new Button({
      elClasses: ['game-of-life-toggle'],
      icon: 'gg-play-button',
      clickAction: this.overlay.toggleGameOfLife.bind(this.overlay)
    });

    this.insipredBy.append(this.gameOfLifeButton.domElement);

    this.domElement.append(this.insipredBy);

    this.ribbon = document.createElement('div');
    this.ribbon.classList.add('ribbon');

    this.ribbonContent = document.createElement('div');
    this.ribbonContent.classList.add('ribbon-content');
    this.ribbonContent.innerHTML = '<a href="https://polygon.technology/" target="_blank">Polygon</a>';

    this.ribbon.append(this.ribbonContent);
    this.domElement.append(this.ribbon);

    this.parent.append(this.domElement);
  }

  slideAction() {
    logger.log('Slideshow: slideAction');

    pushGTMEvent('overlayBtns', 'launchApp', this.game.scene.keys['MainScene']);
    this.game.tools.clearOverlay();
  }

  navTemplate({ shortTitle, icon, active }) {
    logger.log('Slideshow: navTemplate');

    const navItem = document.createElement('div');
    navItem.classList.add('nav-item');

    const navTitle = document.createElement('span');

    if (active)
      navItem.classList.add('nav-active');

    const navItemTitle = document.createElement('div');
    navItemTitle.classList.add('nav-title');

    navItemTitle.innerText = shortTitle;

    navItem.append(navItemTitle);
    navItem.append(navTitle);

    return navItem;
  }

  slideTemplate({ title, body, icon, active }) {
    logger.log('Slideshow: slideTemplate');

    const slide = document.createElement('article');
    slide.classList.add('post');

    if (active)
      slide.classList.add('slide-active');
    else
      slide.classList.add('slide-not-active');

    const heading = document.createElement('h2');
    heading.classList.add('slide-title');

    heading.textContent = title;

    if (icon) {
      const headingIcon = document.createElement('img');
      headingIcon.src = `assets/images/icons/${icon}`;

      heading.prepend(headingIcon);
    }

    const content = document.createElement('p');
    content.classList.add('slide-content');

    content.innerHTML = body;

    slide.append(heading);
    slide.append(content);

    return slide;
  }

  toggleCookie(e) {
    logger.log('Slideshow: toggleCookie');

    e.preventDefault();
    e.stopImmediatePropagation();
    // set cookie for overlay

    const cookieInput = this.keyNoteWrapper.querySelector('input');
    cookieInput.checked = !cookieInput.checked;

    if (cookieInput.checked) {
      setCookie('no_overlay', true, 9999);
    } else {
      deleteCookie('no_overlay');
    }
  }

  formAction(e) {
    logger.log('Slideshow: formAction');

    e.preventDefault();
    e.stopImmediatePropagation();
    // close overlay
  }

  navAction(e) {
    logger.log('Slideshow: navAction');

    let navItem;

    pushGTMEvent('overlayBtns', 'navClick', this.game.scene.keys['MainScene']);
    if (e.target.classList.contains('nav-item'))
      navItem = e.target;
    else
      navItem = e.target.closest('.nav-item');

    // https://stackoverflow.com/questions/5913927/get-child-node-index
    // Need to wrap items
    const goToIndex = Array.from(this.navItemsWrapper.children).indexOf(navItem);

    if (goToIndex > -1) {
      this.index = -1;
      this.navigateSlideshow(goToIndex);
    }
  }

  nextPrevAction(e) {
    logger.log('Slideshow: nextPrevAction');

    let navItem, currentIndex = this.slideIndex;

    if (e.target.classList.contains('.gg-play-button'))
      navItem = e.target;
    else
      navItem = e.target.closest('.gg-play-button');

    if (navItem.classList.contains('disabled'))
      return;

    if (navItem.classList.contains('left'))
      currentIndex--
    else
      currentIndex++

    this.navigateSlideshow(currentIndex);
  }

  discordAction() {
    logger.log('Slideshow: discordAction');

    pushGTMEvent('overlayBtns', 'discordClick', this.game.scene.keys['MainScene']);
    window.open(config.slideshow.discordLink, '_blank').focus();
  }

  twitterAction() {
    logger.log('Slideshow: twitterAction');

    pushGTMEvent('overlayBtns', 'twitterClick', this.game.scene.keys['MainScene']);
    window.open(config.slideshow.twitterLink, '_blank').focus();
  }

  docsAction() {
    logger.log('Slideshow: docsAction');

    pushGTMEvent('overlayBtns', 'docsClick', this.game.scene.keys['MainScene']);
    window.open(config.appConfig.docsLink, '_blank').focus();
  }

  navigateSlideshow(toIndex) {
    logger.log('Slideshow: navigateSlideshow', toIndex);

    this.slides.forEach((slide, index) => {

      slide.classList.add('slide-not-active');
      slide.classList.remove('slide-active');

      const navItem = this.navItems[index];
      navItem.classList.remove('nav-active');

      if (toIndex >= index)
        navItem.classList.add('nav-seen');

      //navItem.querySelector('.progress-bar__fill').style.width = 0;

      if ((index === toIndex) || (!toIndex && index === 0)) {
        this.slideIndex = index;

        this.setActiveSlide({ index })
        this.setActiveNav({ index })
      }
    });

    if (this.slideIndex === this.slides.length - 1)
      this.rightIcon.classList.add('disabled');
    else
      this.rightIcon.classList.remove('disabled');

    if (this.slideIndex === 0)
      this.leftIcon.classList.add('disabled');
    else
      this.leftIcon.classList.remove('disabled');
  }

  setActiveSlide({ index, slide }) {
    logger.log('Slideshow: setActiveSlide');

    this.currentSlide = slide || this.slides[index];
    this.currentSlide.classList.remove('slide-not-active');
    this.currentSlide.classList.add('slide-active');
  }

  setActiveNav({ index, navItem }) {
    logger.log('Slideshow: setActiveNav');

    this.currentNav = navItem || this.navItems[index];
    this.currentNav.classList.add('nav-active');
  }

  destroy() {
    logger.log('Slideshow: destroy');

    this.navWrapper.removeEventListener('click', this.bindNavAction);
    this.leftIcon.removeEventListener('click', this.bindNextPrevAction);
    this.rightIcon.removeEventListener('click', this.bindNextPrevAction);
    this.keyNoteWrapper.removeEventListener('click', this.bindToggleCookie);

    if (this.parent)
      this.parent.removeChild(this.domElement);
  }
}