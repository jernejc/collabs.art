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

    this.setupDom();

    this.progressInterval = setInterval(this.progress.bind(this), 100); // start progress interval
  }

  setupDom() {
    if (DEBUG) console.log('Slideshow: slideTemplate', title, body);

    this.index = 0;
    this.slideIndex = 0;
    this.slides = [];
    this.navItems = [];

    this.slidesWrapper = document.createElement('div');
    this.slidesWrapper.classList.add('slides-wrapper');

    this.navWrapper = document.createElement('div');
    this.navWrapper.classList.add('slides-nav');

    this.navWrapper.addEventListener('click', this.navAction);

    this.subtitle = document.createElement('h2');
    this.subtitle.classList.add('slide-subheading');
    this.subtitle.innerHTML = config.slideshow.subtitle;

    if (this.buttonAction) {
      this.slideActionButton = document.createElement('button');
      this.slideActionButton.classList.add('slide-action');
      this.slideActionButton.innerText = 'Start game';

      this.slideActionButton.addEventListener('click', this.buttonAction);
      this.domElement.append(this.slideActionButton);
    }

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

    this.domElement.append(this.subtitle);
    this.domElement.append(this.slidesWrapper);
    this.domElement.append(this.navWrapper);

    this.parent.append(this.domElement);
  }

  navTemplate({ title, icon, active }) {
    if (DEBUG) console.log('Slideshow: navTemplate');

    const navItem = document.createElement('div');
    navItem.classList.add('nav-item');

    const navTitle = document.createElement('span');

    if (active)
      navItem.classList.add('nav-active');

    /*if (icon) {
      const navItemIcon = document.createElement('img');
      navItemIcon.src = `assets/images/icons/${icon}`;

      navTitle.prepend(navItemIcon);
    }*/

    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');

    const progressBarFill = document.createElement('div');
    progressBarFill.classList.add('progress-bar__fill');

    const progressBarWrap = document.createElement('div');
    progressBarWrap.classList.add('progress-bar__wrap');

    progressBar.append(progressBarWrap);
    progressBar.append(progressBarFill);

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
    heading.classList.add('post-title');

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
      this.index = -5;

      this.slideIndex++;

      // Reset progress bar
      this.currentNav.querySelector('.progress-bar__fill').style.width = 0;

      // Reset postIndex to loop over the slides again
      if (this.slideIndex === this.slides.length) {
        this.stopProgressInterval();
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
      this.currentSlide = this.slides[this.slideIndex];
      this.currentSlide.classList.remove('slide-not-active')
      this.currentSlide.classList.add('slide-active');

      this.currentNav = this.navItems[this.slideIndex];
      this.currentNav.classList.add('nav-active');
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

    this.navWrapper.removeEventListener('click', this.navAction);

    this.stopProgressInterval();
  }

  stopProgressInterval() {
    if (DEBUG) console.log('Slideshow: stopProgressInterval');

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  navAction() {

  }
}