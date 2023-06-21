'use strict';

/*________________________________________________________________________________*/
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteWorkout = document.querySelector('.workout__delete');
const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

/*________________________________________________________________________________*/

class Workout {
  date = new Date();
  id = Date.now().toString().slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    const months = [
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
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadance) {
    super(coords, distance, duration);
    this.cadance = cadance;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    return (this.pace = this.duration / this.distance);
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, duration, distance);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    return (this.speed = this.distance / (this.duration / 60));
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getData();
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      err => {
        console.log('error ' + err.message);
      },
      options
    );
  }
  _loadMap(pos) {
    let crd = pos.coords;
    let lat = crd.latitude;
    let lon = crd.longitude;

    this.#map = L.map('map').setView([lat, lon], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    L.marker([lat, lon]).addTo(this.#map).bindPopup('Your Location').openPopup();
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(ele => this._renderWorkoutMarker(ele));
  }
  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm(e) {
    inputDuration.value =
      inputCadence.value =
      inputDistance.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _newWorkout(e) {
    e.preventDefault();
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    let clkLat = this.#mapEvent.latlng.lat;
    let clkLon = this.#mapEvent.latlng.lng;
    const validInputs = (...inputs) => {
      return inputs.every(input => Number.isFinite(input));
    };
    const positiveVals = (...inputs) => {
      return inputs.every(input => input > 0);
    };
    if (type === 'running') {
      const cadance = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadance) ||
        !positiveVals(distance, duration, cadance)
      ) {
        return alert('Invalid inputs');
      }
      workout = new Running([clkLat, clkLon], distance, duration, cadance);
    }
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !positiveVals(distance, duration)
      ) {
        return alert('Invalid inputs');
      }
      workout = new Cycling([clkLat, clkLon], distance, duration, elevation);
    }
    this.#workouts.push(workout);
    this._hideForm();
    this._renderWorkout(workout);
    this._renderWorkoutMarker(workout);
    this._saveData();
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          minWidth: 100,
          maxWidth: 250,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}  ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace}</span>
                <span class="workout__unit">min/km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadance}</span>
                <span class="workout__unit">spm</span>
                <div class="workout__delete">🗑️</div>
              </div>
            </li>`;
    }
    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
              </div>
            </li> `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEle = e.target.closest('.workout');
    
    if (!workoutEle) return;
    // console.log(workoutEle,e.target.classList.value,e.target.classList.value==='workout__delete')
    if(e.target.classList.value==='workout__delete'){
      this._deleteWorkout(e)
      console.log("hitt")
      return false
    }
    const findPos = this.#workouts.find(
      workout => workout.id === workoutEle.dataset.id
    );

    this.#map.setView(findPos.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  _saveData() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getData() {
    const dataLocal = JSON.parse(localStorage.getItem('workouts'));
    if (!dataLocal) return;
    this.#workouts = dataLocal;
    this.#workouts.forEach(workout => this._renderWorkout(workout));
  }
  _reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
  _deleteWorkout(e) {
    let del=e.target.closest('.workout');
    del.remove();
    this.#workouts=this.#workouts.filter(obj=>obj.id!==del.dataset.id)
    // this._renderWorkoutMarker(workout);
    this._saveData();
    this._reset()

  }
}

const app = new App();
