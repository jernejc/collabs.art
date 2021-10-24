
export default class Slideshow {
  constructor({ parent }) {
    if (DEBUG) console.log('Slideshow: constructor');

    if (parent)
      this.parent = parent;

    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'slideshow');

    this.articles = [{ // This goes async from server
      icon: 'about.svg',
      title: 'About',
      body: 'A social experiment where players collectively draw on a shared canvas by changing the color of individual pixels and thus continuously contribute to the emerging global image. The goal is to illustrate the process of self-organization within a community of random players with the help of blockchain technology.'
    }, {
      icon: 'ownership.svg',
      title: 'Ownership',
      body: 'Each pixel on the canvas is represented by a non-fungible token (NFT) on the Ethereum network. Ownership is stored and transferred based on the ERC-721 standard as most digital art and collectibles. It cannot be taken away or destroyed.'
    }, {
      icon: 'social-dynamic.svg',
      title: 'Social dynamic',
      body: 'Once a player takes ownership of a pixel he or she can control its color, but also auction it to a different player if an agreement between them is reached. The experiment is decentralized and not controlled by any single actor so in theory it cannot be stopped.'
    }];
    
    this.setupDom();
    this.progressInterval = setInterval(this.progress.bind(this), 100); // 180
  }

  setupDom() {
    if (DEBUG) console.log('Slideshow: slideTemplate', title, body);

    this.index = 0;
    this.postIndex = 0;
    this.posts = [];

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('slides-wrapper');

    this.subheading = document.createElement('h2');
    this.subheading.classList.add('post-subheading');
    this.subheading.innerHTML = '<span>Contribute to social</span> experiment.<br /><span>Become a</span> Creator.';

    this.domElement.append(this.subheading);

    this.articles.forEach((article, i) => {
      let active = false;

      if (i === 0) 
        active = true;

      const postItem = this.slideTemplate({...article, active});

      this.posts.push(postItem);
      this.wrapper.append(postItem);

      if (active)
        this.currentPost = postItem;
    });

    this.nav = document.createElement('div');
    this.nav.classList.add('slides-nav');

    this.domElement.append(this.wrapper);
    this.parent.append(this.domElement);
  }

  navTemplate() {
    const item = document.createElement('div');
  }

  slideTemplate({ title, body, icon, active }) {
    if (DEBUG) console.log('Slideshow: slideTemplate', title, body);

    const slide = document.createElement('article');
    slide.classList.add('post'); // post--active

    if (active)
      slide.classList.add('post-active');
    else
      slide.classList.add('post-not-active');

    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');

    const progressBarFill = document.createElement('div');
    progressBarFill.classList.add('progress-bar__fill');

    const heading = document.createElement('h2');
    heading.classList.add('post-title');

    heading.textContent = title;

    if (icon) {
      const headingIcon = document.createElement('img');
      headingIcon.src = `assets/images/app/${icon}`;

      heading.prepend(headingIcon);
    }

    const content = document.createElement('p');
    content.classList.add('post-content');

    content.textContent = body;

    progressBar.append(progressBarFill);

    slide.append(progressBar);
    slide.append(heading);
    slide.append(content);

    return slide;
  }

  progress() {
    if (DEBUG) console.log('Slideshow: progress', this.index, this.postIndex);

    if (this.index === 100) {
      this.index = -5;

      // reset progress bar
      this.currentPost.querySelector('.progress-bar__fill').style.width = 0;

      this.currentPost.classList.remove('post-active');
      this.currentPost.classList.add('post-not-active');

      this.postIndex++;

      // reset postIndex to loop over the slides again
      if (this.postIndex === this.posts.length) 
        this.postIndex = 0;

      this.currentPost = this.posts[this.postIndex];
      //this.currentNav = this.navItems[this.postIndex];
    } else {
      this.index++;
      
      // Update active item
      this.currentPost.querySelector('.progress-bar__fill').style.width = `${this.index}%`;
      this.currentPost.classList.remove('post-not-active');
      this.currentPost.classList.add('post-active');
    }
  }
}