import { $ } from './bling';

function ajaxHeart(e) {
  e.preventDefault();
  fetch(this.action, {
    method: 'POST'
  })
    .then(res => res.json())
    .then(res => {
      const isHearted = this.heart.classList.toggle('heart__button--hearted');
      if (isHearted) this.heart.classList.toggle('heart__button--float');

      $('.heart-count').textContent = res.favorites.length;
    })
    .catch(console.error);
}

export default ajaxHeart;
