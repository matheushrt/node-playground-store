import { $ } from './bling';

function getCoordsAsync() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition((success, error) => {
      resolve(success.coords);
      reject(error);
    });
  });
}

function customMarkerHTML(name, slug, photo, location) {
  return `
        <div class="popup">
            <a href="/store/${slug}">
                <img src="/uploads/${photo || 'store.png'}" alt="${name}" />
                <p>${name} - ${location && location.address}</p>
            </a>
        </div>
    `;
}

function makeMarkers(map, places) {
  const bounds = new google.maps.LatLngBounds();
  const infoWindow = new google.maps.InfoWindow();

  places.forEach(place => {
    const [lng, lat] = place.location.coordinates;
    const position = { lat, lng };
    bounds.extend(position);
    const marker = new google.maps.Marker({ map, position });
    marker.place = place;
    marker.addListener('click', function() {
      const { name, slug, photo, location } = this.place;
      infoWindow.setContent(customMarkerHTML(name, slug, photo, location));
      infoWindow.open(map, this);
    });
  });

  map.setCenter(bounds.getCenter());
  map.fitBounds(bounds);
}

function loadPlaces(map, lat, lng) {
  fetch(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => res.json())
    .then(res => {
      if (!res.length) {
        alert('No places found!');
        return;
      }
      makeMarkers(map, res);
    })
    .catch(err => console.error(err));
}

function makeMap(mapDiv) {
  if (!mapDiv) return;
  getCoordsAsync()
    .then(({ latitude, longitude }) => {
      const mapOptions = {
        center: { lat: latitude, lng: longitude },
        zoom: 10
      };
      const map = new google.maps.Map(mapDiv, mapOptions);
      const input = $('[name="geolocate"]');
      const autocomplete = new google.maps.places.Autocomplete(input);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const { lat, lng } = place.geometry.location;
        loadPlaces(map, lat(), lng());
      });
    })
    .catch(err => console.error(err));
}

export default makeMap;
