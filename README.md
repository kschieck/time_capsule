# Time Capsule
A time delayed self-messaging app

Leave your future self a message, which is inaccessible until after the selected duration has elapsed. An email reminds the user to view their message when it becomes accessible.

## Dependencies
- nodejs
- mongodb database
- email service

## Instructions

Install: `npm install`

Start local mongodb instance `npm run mongod`

Start (development mode): `npm run start-dev`

Start: `npm start`

## Configuration

Edit `default.json` with the appropriate details. Configuration is handled by [npm:Config](https://www.npmjs.com/package/config).