
export default class LoadingBar {
  constructor() {
    this.loadingIcon = document.createElement('div');
    this.loadingIcon.classList.add('loadingbar');
    this.loadingIcon.innerHTML = `<i class="gg-loadbar-alt"></i> Loading..`;

    return this.loadingIcon;
  }
}