// ================= SETUP =================

import express, { request, response } from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import {
  add, read, write,
} from './jsonFileStorage.js';

const app = express();
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static('public'));
// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));
// Configure Express to parse request body data into request.body
app.use(express.urlencoded({ extended: false }));

// const formValidation = () => {
//   const city = document.forms.mainForm.elements.city.value;
//   const state = document.forms.mainForm.elements.state.value;
//   const shape = document.forms.mainForm.elements.shape.value;
//   const states = document.forms.mainForm.elements.state.value;
//   const duration = document.forms.mainForm.elements.duration.value;
//   const summary = document.forms.mainForm.elements.summary.value;
//   const text = document.forms.mainForm.elements.text.value;

//   const nameregex = /^[a-zA-Z]+\s?[a-zA-Z]+$/;
//   const oneWordRegex = /^[a-zA-Z]+\s?[a-zA-Z]+$/;
//   const freeTextregex = /^\+?[0-9]{8,12}$/;
// };

// ================= ROUTE HELPER FUNCTIONS =================

// Save new sighting data sent via POST request from our form
app.post('/sighting', (request, response) => {
  // form validation
  let formValidity = true;
  const content = request.body;
  if (!content.time) {
    formValidity = false;
    content.timeValidity = 'is-invalid';
  }

  if (!content.date) {
    formValidity = false;
    content.dateValidity = 'is-invalid';
  }

  if (!content.city) {
    formValidity = false;
    content.cityValidity = 'is-invalid';
  }
  if (!content.state) {
    formValidity = false;
    content.stateValidity = 'is-invalid';
  }
  if (!content.shape) {
    formValidity = false;
    content.shapeValidity = 'is-invalid';
  }
  if (!content.duration) {
    formValidity = false;
    content.durationValidity = 'is-invalid';
  }
  if (!content.summary) {
    formValidity = false;
    content.summaryValidity = 'is-invalid';
  }
  if (!content.text) {
    formValidity = false;
    content.textValidity = 'is-invalid';
  }
  if (formValidity === false) {
    content.index = '';
    content.creationDate = '';
    console.log(content.cityValidity);
    response.render('form', content);
    return;
  }
  // get creation date time of submission
  request.body.creationDate = Date();

  // Add new recipe data in request.body to recipes array in data.json.
  add('data.json', 'sightings', request.body, (err) => {
    if (err) {
      response.status(500).send('DB write error.');
      return;
    }

    read('data.json', (err, data) => {
      if (err) {
        response.status(500).send('DB write error.');
      }

      const index = data.sightings.length - 1;

      response.redirect(`/sighting/${index}`);
    });
  });
});

// render sighting page for selected sighting report
const handleFileReadSighting = (request, response) => {
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB write error.');
      return;
    }

    const arrayIndex = request.params.index;
    const content = data.sightings[arrayIndex];
    content.index = arrayIndex;

    response.render('sighting', content);
  });
};

// render home page with list of all sightings
const handleFileReadSightingList = (request, response) => {
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB write error.');
    }
    let visits = 0;

    // check if it's not the first time a request has been made
    if (request.cookies.visits) {
      console.log(request.cookies);
      visits = Number(request.cookies.visits); // get the value from the request
    }

    // set a new value of the cookie
    visits += 1;

    response.cookie('visits', visits); // set a new value to send back
    data.visits = visits;

    response.render('home', data);
  });
};

// render page with list of all shapes
const handleFileReadShapesList = (request, response) => {
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB write error.');
      return;
    }
    response.clearCookie('name');
    const shapesTally = {};
    data.sightings.forEach((sighting) => {
      const { shape } = sighting;
      if (shape in shapesTally) {
        shapesTally[shape] += 1;
      } else {
        shapesTally[shape] = 1;
      }
    });

    const shapesContent = {};
    shapesContent.shapes = Object.keys(shapesTally).sort();

    response.render('shapes', shapesContent);
  });
};

// render list of sightings with selected shape
const handleFileReadByShape = (request, response) => {
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB write error.');
      return;
    }

    const content = { sightings: [] };
    const condition = request.params.shape;
    data.sightings.forEach((element) => {
      if (element.shape === condition) {
        content.sightings.push(element);
      }
    });

    response.render('shapeList', content);
  });
};

// render edit form with pre-filled content from database
const handleFileReadEdit = (request, response) => {
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB read error.');
      return;
    }

    const arrayIndex = request.params.index;
    const content = data.sightings[arrayIndex];
    content.url = request.url;
    content.index = arrayIndex;

    response.render('edit', content);
  });
};

// handle edit submissions and redirect to sighting page
const handleFileReadPostEdit = (request, response) => {
  const { index } = request.params;
  read('data.json', (err, data) => {
    // Replace the data in the object at the given index
    data.sightings[index] = request.body;
    write('data.json', data, (err) => {
      // response.send('Done!');
      response.redirect(`/sighting/${index}`);
    });
  });
};

// render form when reporting new sighting
const handleFileReadForm = (request, response) => {
  const content = {
    cityValidity: '',
    stateValidity: '',
    shapeValidity: '',
    durationValidity: '',
    summaryValidity: '',
    textValidity: '',
    dateValidity: '',
    timeValidity: '',
  };
  response.render('form', content);
};

// handle delete requests of sighting
const handleFileReadDelete = (request, response) => {
  // Remove element from DB at given index
  const { index } = request.params;
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB read error.');
      return;
    }
    data.sightings.splice(index, 1);
    write('data.json', data, (err) => {
      if (err) {
        response.status(500).send('DB write error.');
        return;
      }
      response.redirect('/');
    });
  });
};

// const handleFileReadSort = (request, response) => {
//   read('data.json', (err, data) => {
//     const content = [...data.sightings];
//     // const { sortType } = request.params.sortType;
//     if (request.query.sort === 'asc') {
//       // for string sort only
//       content.sort((a, b) => {
//         if (a.city < b.city) {
//           return -1;
//         }
//         if (a.city > b.city) {
//           return 1;
//         }
//         return 0;
//       });

//       // for number sort only
//       // content.sort((a, b) => a.city - b.city);
//     }
//     let visits = 0;

//     // check if it's not the first time a request has been made
//     if (request.cookies.visits) {
//       visits = Number(request.cookies.visits); // get the value from the request
//     }

//     // set a new value of the cookie
//     visits += 1;

//     response.cookie('visits', visits); // set a new value to send back
//     data.visits = visits;
//     console.log(content);
//     response.render('home', { sightings: content, visits });
//   });
// };

// app.get('/', handleFileReadSort);

// ================= RENDER ROUTES =================

app.get('/sighting', handleFileReadForm); // form page
app.get('/sighting/:index', handleFileReadSighting); // individual sighting page
app.get('/', handleFileReadSightingList); // home page with all sightings listed
app.get('/shapes', handleFileReadShapesList); // page with all shapes reports
app.get('/shapes/:shape', handleFileReadByShape); // page with all sightings of a selected shape listed
app.get('/sighting/:index/edit', handleFileReadEdit); // edit sighting page
app.put('/sighting/:index', handleFileReadPostEdit); // page post edit submission
app.delete('/sighting/:index', handleFileReadDelete); // page post delete sighting
app.listen(3004);
