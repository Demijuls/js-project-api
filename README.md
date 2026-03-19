# Backend for the Happy Thoughts project

## Check out demo here:

[Backend part demo on Render](https://get-thoughts-out-api.onrender.com)
OBS! It is deployed on Render, and API goes to sleep after 50 sec on inactivity. Allow some time for it to respond for the first time.

[Full Happy Thoughts project](https://happy-thoughts-byjd.netlify.app/)(no sign-up needed to see the feed, but if you want to submit your thoughts, please register a user first)

## Overview:

Happy Thoughts Tiny API
A RESTful API for sharing, managing, and reacting to short happy thoughts. Built with Node.js, Express, and MongoDB/Mongoose — with full authentication support.
OBS! It is deployed on Render, and API goes to sleep after 50 sec on inactivity. Allow some time for it to respond for the first time.

### Features

- Browse thoughts — fetch all thoughts with filtering and sorting options (by date, likes, or category)
- Single thought lookup — retrieve one thought by ID
- Like a thought — increment the heart count on any thought
- Full CRUD — authenticated users can create, update, and delete their own thoughts
- Auth — sign up and log in with encrypted passwords (bcrypt) and token-based authentication
- Input validation — meaningful error responses for invalid or duplicate data (e.g. unique emails enforced)
- API docs — auto-generated endpoint listing via Express List Endpoints

> Frontend part lives in [this repo](https://github.com/Demijuls/js-project-happy-thoughts).

###### Created as a part full-stack programm in TechniGo bootcamp.

### API includes:

- RESTful APIs
- MongoDB for database + data modeling in mongoose
- Authentication with user token
- Endpoints GET, POST, PUT, DELETE
- Filtering and sorting

### Tech Stack

Node.js + Express
MongoDB + Mongoose
bcrypt for password hashing
JWT for authentication
Deployed on Render
