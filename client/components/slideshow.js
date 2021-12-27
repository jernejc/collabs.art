import config from '@util/config';

export default class Slideshow {
  constructor({ parent, buttonAction }) {
    if (DEBUG) console.log('Slideshow: constructor');

    if (parent)
      this.parent = parent;
    if (buttonAction)
      this.buttonAction = buttonAction;

    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'slideshow');

    this.articles = config.slideshow.articles;

    this.playing = false;

    this.bindNavAction = this.navAction.bind(this);
    this.bindNextPrevAction = this.nextPrevAction.bind(this);

    this.setupDom();
  }

  setupDom() {
    if (DEBUG) console.log('Slideshow: setupDom');

    this.index = 0;
    this.slideIndex = 0;
    this.slides = [];
    this.navItems = [];

    // Slide article 
    this.slidesWrapper = document.createElement('div');
    this.slidesWrapper.classList.add('slides-wrapper');

    // Navigation
    this.navWrapper = document.createElement('div');
    this.navWrapper.classList.add('slides-nav');

    this.navItemsWrapper = document.createElement('div');
    this.navItemsWrapper.classList.add('slides-nav-items');

    this.navItemsWrapper.addEventListener('click', this.bindNavAction);

    // Navigation buttons

    this.leftIcon = document.createElement('i')
    this.leftIcon.classList.add('gg-play-button', 'left', 'disabled');

    this.rightIcon = document.createElement('i')
    this.rightIcon.classList.add('gg-play-button', 'right');

    this.leftIcon.addEventListener('click', this.bindNextPrevAction);
    this.rightIcon.addEventListener('click', this.bindNextPrevAction);

    // Action button
    if (this.buttonAction) {
      this.slideActionButton = document.createElement('button');
      this.slideActionButton.classList.add('slide-action');
      this.slideActionButton.innerHTML = '<i class="gg-chevron-double-down"></i>' + config.slideshow.slideActionText;

      this.slideActionButton.addEventListener('click', this.buttonAction);
    }

    // Load articles
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

    // Attach to DOM
    this.navWrapper.append(this.navItemsWrapper);
    this.navWrapper.append(this.slideActionButton);

    this.navWrapper.prepend(this.leftIcon);
    this.navWrapper.append(this.rightIcon);

    this.slidesWrapper.append(this.navWrapper);

    this.domElement.append(this.slidesWrapper);

    this.parent.append(this.domElement);
  }

  navTemplate({ title, icon, active }) {
    if (DEBUG) console.log('Slideshow: navTemplate');

    const navItem = document.createElement('div');
    navItem.classList.add('nav-item');

    const navTitle = document.createElement('span');

    if (active)
      navItem.classList.add('nav-active');

    const navItemTitle = document.createElement('div');
    navItemTitle.classList.add('nav-title');

    navItemTitle.innerText = title.split(' ')[0];

    navItem.append(navItemTitle);
    navItem.append(navTitle);

    return navItem;
  }

  slideTemplate({ title, body, icon, active }) {
    if (DEBUG) console.log('Slideshow: slideTemplate', title, body);

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

  destroy() {
    if (DEBUG) console.log('Slideshow: destroy');

    if (this.buttonAction)
      this.slideActionButton.removeEventListener('click', this.buttonAction);

    this.navWrapper.removeEventListener('click', this.bindNavAction);
    this.leftIcon.removeEventListener('click', this.bindNextPrevAction);
    this.rightIcon.removeEventListener('click', this.bindNextPrevAction);

    this.stopProgressInterval();
  }

  stopProgressInterval() {
    if (DEBUG) console.log('Slideshow: stopProgressInterval');

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  navAction(e) {
    /*if (DEBUG)*/ console.log('Slideshow: navAction', e);

    let navItem;

    if (e.target.classList.contains('nav-item'))
      navItem = e.target;
    else
      navItem = e.target.closest('.nav-item');

    console.log('navItem', navItem);

    // https://stackoverflow.com/questions/5913927/get-child-node-index
    // Need to wrap items
    const goToIndex = Array.from(this.navItemsWrapper.children).indexOf(navItem);

    if (goToIndex > -1) {
      this.index = -1;
      this.navigateSlideshow(goToIndex);
    }
  }

  nextPrevAction(e) {
    if (DEBUG) console.log('Slideshow: nextPrevAction', e, this.slideIndex)

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

  navigateSlideshow(toIndex) {
    if (DEBUG) console.log('Slideshow: navigateSlideshow', toIndex);

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
        this.secActiveNav({ index })
      }
    });

    if ((this.slideIndex === this.slides.length - 1) && !this.playing) {
      this.slideActionButton.classList.add('active');
      this.rightIcon.classList.add('disabled');
    }
    else {
      //this.slideActionButton.classList.remove('active');
      this.rightIcon.classList.remove('disabled');
    }

    if (this.slideIndex === 0)
      this.leftIcon.classList.add('disabled');
    else
      this.leftIcon.classList.remove('disabled');
  }

  setActiveSlide({ index, slide }) {
    if (DEBUG) console.log('Slideshow: setActiveSlide');

    this.currentSlide = slide || this.slides[index];
    this.currentSlide.classList.remove('slide-not-active');
    this.currentSlide.classList.add('slide-active');
  }

  secActiveNav({ index, navItem }) {
    if (DEBUG) console.log('Slideshow: secActiveNav');

    this.currentNav = navItem || this.navItems[index];
    this.currentNav.classList.add('nav-active');
  }
}