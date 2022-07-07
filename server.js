const fs = require('fs');
const path = require('path');

const express = require('express');
//tell app to use environment variable or else to default to port 3001
const PORT = process.env.PORT || 3001;

const app = express();

//sets up Express.js middleware to instruct server to make files readily available- not gated behind a server endpoint
app.use(express.static('public'));
//parse incoming string or array data
app.use(express.urlencoded({ extended: true }));
//partse incoming JSON data
app.use(express.json());

const { animals } = require('./data/animals');

//validation function - takes new animal data from req.body to see if each key exists and is the right type of data
function validateAnimal(animal) {
  if (!animal.name || typeof animal.name !== 'string') {
    return false;
  }
  if (!animal.species || typeof animal.species !== 'string') {
    return false;
  }
  if (!animal.diet || typeof animal.diet !== 'string') {
    return false;
  }
  if (!animal.personalityTraits || !Array.isArray(animal.personalityTraits)) {
    return false;
  }
  return true;
}

//filter functionality
function filterByQuery(query, animalsArray) {
    let personalityTraitsArray = [];
    // Note that we save the animalsArray as filteredResults here:
    let filteredResults = animalsArray;
    if (query.personalityTraits) {
      // Save personalityTraits as a dedicated array.
      // If personalityTraits is a string, place it into a new array and save.
      if (typeof query.personalityTraits === 'string') {
        personalityTraitsArray = [query.personalityTraits];
      } else {
        personalityTraitsArray = query.personalityTraits;
      }
      // Loop through each trait in the personalityTraits array:
      personalityTraitsArray.forEach(trait => {
        // Check the trait against each animal in the filteredResults array.
        // Remember, it is initially a copy of the animalsArray,
        // but here we're updating it for each trait in the .forEach() loop.
        // For each trait being targeted by the filter, the filteredResults
        // array will then contain only the entries that contain the trait,
        // so at the end we'll have an array of animals that have every one 
        // of the traits when the .forEach() loop is finished.
        filteredResults = filteredResults.filter(
          animal => animal.personalityTraits.indexOf(trait) !== -1
        );
      });
    }
    if (query.diet) {
      filteredResults = filteredResults.filter(animal => animal.diet === query.diet);
    }
    if (query.species) {
      filteredResults = filteredResults.filter(animal => animal.species === query.species);
    }
    if (query.name) {
      filteredResults = filteredResults.filter(animal => animal.name === query.name);
    }
    // return the filtered results:
    return filteredResults;
  }

//function takes in the id and array of animal and return a single animal object
function findById(id, animalsArray) {
    const result = animalsArray.filter(animal => animal.id === id)[0];
    return result;
}

function createNewAnimal(body, animalsArray) {
  const animal = body;
  animalsArray.push(animal);
  fs.writeFileSync(
    path.join(__dirname, './data/animals.json'),
    JSON.stringify({ animals: animalsArray }, null, 2)
  );
  return animal;
}



//add route- get() method requires two arguements- a string and callback function
app.get('/api/animals', (req, res) => {
    let results = animals;
    if (req.query) {
        results = filterByQuery(req.query, results);
    }
    console.log(req.query)
    res.json(results);
});

//route 2
app.get('/api/animals/:id', (req, res) => {
    const result = findById(req.params.id, animals);
    if (result) {
        res.json(result);
    } else {
        res.send(404);
    }
});

//route to accept data to be used/stored server-side POST requests represent the action of a client requesting the server to accept data
app.post('/api/animals', (req, res) => {
  // set id based on what the next index of the array will be
  req.body.id = animals.length.toString();

  // if any data in req.body is incorrect, send 400 error back
  if (!validateAnimal(req.body)) {
    res.status(400).send('The animal is not properly formatted.');
  } else {
    const animal = createNewAnimal(req.body, animals);
    res.json(animal);
  }
});

//route to get index.html to be served from Expre;ss.js server
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

// route to animals.html (routes ending in /<word> can be assumed to serve HTML pages while those with "api" will transfer JSON data)
app.get('/animals', (req, res) => {
  res.sendFile(path.join(__dirname, './public/animals.html'));
});

//route to zookeeper html page
app.get('/zookeepers', (req, res) => {
  res.sendFile(path.join(__dirname, './public/zookeepers.html'));
});

//wildcard route for nonexistent requests to direct back to the homepage ~routes with '*' should always come last or they will override routes above and they will seem not to work~
app.get('*', (requ, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

//add listen event- listen events should always go last
app.listen(PORT, () => {
    console.log(`API server now on port ${PORT}!`);
});