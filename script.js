'use strict';
const form = document.querySelector('.list .form');
const list = document.querySelector('.list');
const formDistance = document.querySelector('.list .form .distance');
const formTime = document.querySelector('.list .form .time');
const formCadence = document.querySelector('.list .form .sm');
const formType = document.querySelector('.list .form .type');
const formElev = document.querySelector('.form .elevGain');
const listOuter = document.querySelector('.list-outer');
const listItem=document.querySelectorAll('.list-item');
class Workout {
  date = new Date();
  id = (new Date().getTime() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(1);
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    this.pace = (this.duration / this.distance).toFixed(2);
    return this.pace;
  }
}

class App {
  #map;
  #mapEvent;
  #workout = [];
  tempMarker;
  constructor() {
    this.#getPosition();
    this.#toggleElevationField();
    form.addEventListener(
      'keydown',
      function (e) {
        if (e.key === 'Enter') {
          this.#newWorkOut();
        }
      }.bind(this)
    );
    listOuter.addEventListener('click', this.moveToPopup.bind(this));
    this.#getLocalStorage();
  }
  #getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert('could not retrieved your position.');
        }
      );
    }
  }
  #loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    this.#map = L.map('map').setView([latitude, longitude], 15);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this.#showForm.bind(this));
    if (localStorage.getItem('workout')) {
      this.#workout.forEach((workout) => {
        this.#renderWorkout(workout);
        L.marker(workout.coords)
          .addTo(this.#map)
          .bindPopup(
            L.popup({
              maxWidth: 250,
              minHeight: 100,
              autoClose: false,
              closeOnClick: false,
              className: `${workout.type}-popup`,
            })
          )
          .setPopupContent(workout.content)
          .openPopup();
      });
    }
  }
  #showForm(e) {
    if (this.tempMarker) {
      this.#map.removeLayer(this.tempMarker);
    }
    this.#mapEvent = e;
    this.tempMarker = L.marker(this.#mapEvent.latlng)
      .addTo(this.#map)
      .bindPopup('Add description...', { className: 'temp-marker' })
      .openPopup();
    form.classList.remove('hidden');
    gsap.from('.form', {
      transform: 'translateX(-5rem)',
      duration: 0.5,
    });
    formDistance.focus();
  }
  #toggleElevationField() {
    formType.addEventListener('change', function () {
      formCadence.closest('.form-row').classList.toggle('hidden');
      formElev.closest('.form-row').classList.toggle('hidden');
    });
  }
  #newWorkOut() {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const positiveInputs = (...inputs) => inputs.every(inp => inp > 0);
    const type = formType.value;
    const time = +formTime.value;
    const distance = +formDistance.value;
    let workout;
    let popupType;
    let listData;
    let months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    if (type === 'running') {
      const cadence = +formCadence.value;
      if (
        !validInputs(cadence, time, distance) ||
        !positiveInputs(cadence, time, distance)
      ) {
        return alert('please enter positive numbers only.');
      }
      workout = new Running(this.#mapEvent.latlng, distance, time, cadence);
      this.#workout.push(workout);
      popupType = 'running-popup';
      workout.content = `🏃 Running On ${workout.date.getDate()} ${
        months[workout.date.getMonth()]
      }`;
      workout.type = type;
      console.log(workout);
    }
    if (type === 'cycling') {
      const elev = +formElev.value;
      if (
        !validInputs(elev, time, distance) ||
        !positiveInputs(time, distance)
      ) {
        return alert('please enter positive numbers only.');
      }
      workout = new Cycling(this.#mapEvent.latlng, distance, time, elev);
      this.#workout.push(workout);
      popupType = 'cycling-popup';
      workout.content = `🚴 Cycling On ${workout.date.getDate()} ${
        months[workout.date.getMonth()]
      } `;
      workout.type = type;
    }
    this.#map.removeLayer(this.tempMarker);
    L.marker(this.#mapEvent.latlng)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minHeight: 100,
          autoClose: false,
          closeOnClick: false,
          className: popupType,
        })
      )
      .setPopupContent(workout.content)
      .openPopup();
    formDistance.value = '';
    formTime.value = '';
    formCadence.value = '';
    formElev.value = '';
    form.classList.add('hidden');
    this.#renderWorkout(workout);
    this.#setLocalStorage();
  }
  #renderWorkout(workout) {
    let html = `<div class='workout ${
      workout.type === 'running' ? 'list-wraper' : 'list-wrapper-cycling'
    } list-item' data-id='${workout.id}'>
    <p>${workout.content.slice(2)}</p>
    <div class="list-content">
      <p>${workout.type === 'running' ? '🏃' : '🚴'} ${
      workout.distance
    }<span> KM</span></p>
      <p>⏱️${workout.duration} <span>MIN</span></p>
      <p>⚡${workout.type === 'running' ? workout.pace : workout.speed} <span>${
      workout.type === 'running' ? 'MIN/KM' : 'KM/HR'
    }</span></p>
      <p>${workout.type === 'running' ? '🦶' : '🏔️'} ${
      workout.type === 'running' ? workout.cadence : workout.elevationGain
    } <span>${workout.type === 'running' ? 'SPM' : 'M'}</span></p>
    </div>
  </div>`;
    listOuter.insertAdjacentHTML('beforeend', html);
  }
  moveToPopup(e) {
    const workEl = e.target.closest('.workout');
    const workout = this.#workout.find(work => work.id === workEl.dataset.id);
    this.#map.setView(workout.coords, 15, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  #setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workout));
  }
  #getLocalStorage() {
    if (localStorage.getItem('workout')) {
      const localWorkout = JSON.parse(localStorage.getItem('workout'));
      this.#workout = localWorkout;
    }
  }
}
const app = new App();