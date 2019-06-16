'use strict';

// Load Environment Variable from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

// Application Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

// Get all the things
app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/events', handleEvents);

// Route Handlers
function handleLocation(request, response){
  getLocation(request.query.data)
    .then(location => response.send(location))
    .catch(error => handleError(error, response));
}

function handleWeather(request, response){
  getWeather(request.query)
    .then(weather => response.send(weather))
    .catch(error => handleError(error, response))
}

function handleEvents(request, response){
  getEvents(request.query)
    .then(data => response.send(data))
    .catch(error => handleError(error));
}

function getLocation(query){
  const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEO_DATA}`;
  return superagent.get(URL)
    .then(response => {
      let location = new Location(query, response.body.results[0]);
      return location;
    })
    .catch(error => console.error(error));
}

function getWeather(query){
  const URL = `https://api.darksky.net/forecast/${process.env.DARK_SKY}/${query.data.latitude},${query.data.longitude}`;
  return superagent.get(URL)
    .then(response => response.body.daily.data.map(day => new Weather(day)))
    .catch(error => console.error(error));
}

function getEvents(query){
  const URL = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${query.data.longitude}&location.latitude=${query.data.latitude}&expand=venue`;
  return superagent.get(URL)
    .set('Authorization', `Bearer ${process.env.EVENTBRITE_API_KEY}`)
    .then(data => data.body.events.map(event => new Event(event)))
    .catch(error => console.error(error));
}

// Constructor Functions
function Location(query, rawData){
  this.search_query = query;
  this.formatted_query = rawData.formatted_address;
  this.latitude = rawData.geometry.location.lat;
  this.longitude = rawData.geometry.location.lng;
}

function Weather(darkSkyData){
  this.forecast = darkSkyData.summary;
  this.time = new Date(darkSkyData.time * 1000).toDateString();
}

function Event(event){
  this.link = event.url,
  this.name = event.name.txt,
  this.event_date = event.start.local,
  this.summary = event.summary;
}

// Error handling
function handleError(error, response) {
  console.error(error);
  response.status(500).send('Sorry, something went wrong')
}

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is listening on ${PORT}`));
