const dompurify = require('dompurify');

function searchResultsToHTML(stores) {
  return stores
    .map(store => {
      return `
        <a href="/store/${store.slug}" class="search__result">
            <strong>${store.name}</strong>
        </a>
        `;
    })
    .join('');
}

function typeAhead(search) {
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

  searchInput.on('input', function() {
    if (!this.value) {
      searchResults.style.display = 'none';
    }

    searchResults.style.display = 'block';
    searchResults.innerHTML = '';

    fetch(`/api/search?q=${this.value}`)
      .then(res => res.json())
      .then(res => {
        if (res.length) {
          searchResults.innerHTML = dompurify.sanitize(
            searchResultsToHTML(res)
          );
        } else {
          searchResults.innerHTML = dompurify.sanitize(`
                <div class="search__result">No results for ${this.value} found!</div>
            `);
        }
      })
      .catch(err => {
        console.error(err);
      });
  });

  searchInput.on('keyup', e => {
    if (![13, 38, 40].includes(e.keyCode)) {
      return;
    }
    const activeClass = 'search__result--active';
    let current = document.querySelector(`.${activeClass}`);

    if (e.keyCode === 40) {
      current ? current.classList.remove(activeClass) : null;
      current =
        (current && current.nextElementSibling) ||
        searchResults.firstElementChild;
      current.classList.add(activeClass);
    } else if (e.keyCode === 38) {
      current ? current.classList.remove(activeClass) : null;
      current =
        (current && current.previousElementSibling) ||
        searchResults.lastElementChild;
      current.classList.add(activeClass);
    } else {
      current ? (window.location = current.href) : null;
    }
  });
}

export default typeAhead;
