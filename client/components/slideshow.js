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
    this.playIcon = '<i class="gg-play-button"></i>';
    this.pauseIcon = '<i class="gg-play-pause"></i>';

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

    this.navWrapper.addEventListener('click', this.navAction.bind(this));

    // Play/Pause button
    this.playPauseBtn = document.createElement('div');
    this.playPauseBtn.classList.add('play-pause');
    this.playPauseBtn.innerHTML = this.playIcon;

    this.playPauseBtn.addEventListener('click', this.playPauseSlideshow.bind(this));

    // Subtitle
    /*
      this.subtitle = document.createElement('h2');
      this.subtitle.classList.add('slide-subheading');
      this.subtitle.innerHTML = config.slideshow.subtitle;
      this.domElement.append(this.subtitle);
    */

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
      this.navWrapper.append(navItem);

      const slide = this.slideTemplate({ ...article, active });
      this.slides.push(slide);
      this.slidesWrapper.append(slide);

      if (active) {
        this.currentSlide = slide;
        this.currentNav = navItem;
      }
    });

    // Attach to DOM
    this.navWrapper.append(this.slideActionButton);
    this.navWrapper.append(this.playPauseBtn);

    this.slidesWrapper.append(this.navWrapper);
    this.slidesWrapper.append();

    this.domElement.append(this.slidesWrapper);

    this.parent.append(this.domElement);

    //this.playPauseSlideshow(false);
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

    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');

    const progressBarFill = document.createElement('div');
    progressBarFill.classList.add('progress-bar__fill');

    const progressBarWrap = document.createElement('div');
    progressBarWrap.classList.add('progress-bar__wrap');

    progressBar.append(progressBarWrap);
    progressBar.append(progressBarFill);

    navItem.append(navItemTitle);
    navItem.append(navTitle);
    navItem.append(progressBar);

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

  progress() {
    if (DEBUG) console.log('Slideshow: progress', this.index, this.slideIndex);

    if (this.index === 100) {
      this.index = -1;

      this.slideIndex++;

      // Reset progress bar
      this.currentNav.querySelector('.progress-bar__fill').style.width = 0;

      // Reset postIndex to loop over the slides again
      if (this.slideIndex === this.slides.length) {
        this.playPauseSlideshow();

        this.currentNav.classList.remove('nav-active');
        this.currentNav.classList.add('nav-seen');

        this.slideActionButton.classList.add('active');
        return;
      }

      // Hide prev slide
      this.currentSlide.classList.remove('slide-active');
      this.currentSlide.classList.add('slide-not-active');

      // Set active nav
      this.currentNav.classList.add('nav-seen');
      this.currentNav.classList.remove('nav-active');

      // Show next slide
      this.setActiveSlide({ index: this.slideIndex });
      this.secActiveNav({ index: this.slideIndex });
    } else {
      this.index++;

      // Update active item
      this.currentNav.querySelector('.progress-bar__fill').style.width = `${this.index}%`;
    }
  }

  destroy() {
    if (DEBUG) console.log('Slideshow: destroy');

    if (this.buttonAction)
      this.slideActionButton.removeEventListener('click', this.buttonAction);

    this.navWrapper.removeEventListener('click', this.navAction.bind(this));
    this.playPauseBtn.removeEventListener('click', this.playPauseSlideshow.bind(this));

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
    if (DEBUG) console.log('Slideshow: navAction');

    const children = Array.prototype.slice.call(this.navWrapper.children);
    let navItem;

    if (e.target.classList.contains('nav-item'))
      navItem = e.target;
    else
      navItem = e.target.closest('.nav-item');

    const goToIndex = children.indexOf(navItem);

    if (goToIndex > -1) {
      this.index = -1;
      this.resetSlideShow(goToIndex);
    }
  }

  playPauseSlideshow(reset) {
    if (DEBUG) console.log('Slideshow: playPauseSlideshow');

    const navItemsSeen = this.navWrapper.querySelectorAll('.nav-item.nav-seen');

    this.playing = !this.playing;
    this.playPauseBtn.innerHTML = (this.playing) ? this.pauseIcon : this.playIcon;

    if (navItemsSeen.length === this.navItems.length)
      this.resetSlideShow(0);
    if (reset)
      this.resetSlideShow(this.slideIndex);

    if (this.playing) {
      this.progressInterval = setInterval(this.progress.bind(this), 100); // start progress interval
    } else {
      this.stopProgressInterval();
    }
  }

  resetSlideShow(toIndex) {
    if (DEBUG) console.log('Slideshow: resetSlideShow');

    this.slides.forEach((slide, index) => {

      slide.classList.add('slide-not-active');
      slide.classList.remove('slide-active');

      const navItem = this.navItems[index];
      navItem.classList.remove('nav-active');

      if (this.playing && toIndex > index)
        navItem.classList.add('nav-seen');
      else if (!this.playing && toIndex >= index)
        navItem.classList.add('nav-seen');
      else
        navItem.classList.remove('nav-seen');

      navItem.querySelector('.progress-bar__fill').style.width = 0;

      if ((index === toIndex) || (!toIndex && index === 0)) {
        this.slideIndex = index;

        this.setActiveSlide({ index })
        this.secActiveNav({ index })
      }
    });

    if ((this.slideIndex === this.slides.length - 1) && !this.playing)
      this.slideActionButton.classList.add('active');
    else
      this.slideActionButton.classList.remove('active');
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