"use strict";

class workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setdescription() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class running extends workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcpace();
    this._setdescription();
  }

  calcpace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class cycling extends workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcspeed();
    this._setdescription();
  }

  calcspeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class App {
  #map;
  #mapzoom = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getposition();
    this._getlocalstorage();
    form.addEventListener("submit", this._newworkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._movetopopup.bind(this));
  }

  _getposition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("could not get your position");
      }
    );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    //L is namespace given by leaflet
    this.#map = L.map("map").setView(coords, this.#mapzoom);

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showform.bind(this));

    this.#workouts.forEach((work) => {
      this._workoutMarker(work);
    });
  }

  _showform(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputElevation.value =
      inputDuration.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newworkout(e) {
    const valid = (...Inputs) => Inputs.every((inp) => Number.isFinite(inp));
    const positive = (...Inputs) => Inputs.every((inp) => inp > 0);

    e.preventDefault(); //prevents the default behaviour of  forms(the page reloading)

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type == "running") {
      const cadence = +inputCadence.value;
      if (
        !valid(distance, duration, cadence) ||
        !positive(distance, duration, cadence)
      )
        return alert("Inputs have to be Positive number");

      workout = new running([lat, lng], distance, duration, cadence);
    }

    if (type == "cycling") {
      const elevation = +inputElevation.value;
      if (
        !valid(distance, duration, elevation) ||
        !positive(distance, duration)
      )
        return alert("Inputs have to be Positive number");
      workout = new cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);
    this._workoutMarker(workout);
    this._workoutList(workout);

    this._hideForm();
    this._setLocalStorage();
  }

  _workoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxwidth: 250,
          minwidth: 100,
          autoClose: false, // closes the deafult behaviour of popup closing jb new popup opened
          closeOnClick: false, //closes the deafult behaviour of popup closing jb clicked on map
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  _workoutList(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id=${workout.id}>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (workout.type === "running")
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>
    `;

    if (workout.type === "cycling")
      html += `
    <div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.speed.toFixed(1)}</span>
    <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
    <span class="workout__icon">⛰</span>
    <span class="workout__value">${workout.elevationGain}</span>
    <span class="workout__unit">m</span>
    </div>
    </li> 
    `;

    form.insertAdjacentHTML("afterend", html);
  }

  _movetopopup(e) {
    const workoutele = e.target.closest(".workout");
    if (!workoutele) return;
    const workout = this.#workouts.find(
      (work) => work.id === workoutele.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapzoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts)); //stringify converts the object to string
  }

  _getlocalstorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach((work) => {
      this._workoutList(work);
    });
  }

  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const app = new App();
