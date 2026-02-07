import cors from "cors";
import express from "express";
import data from "./data.json";
import listEndpoints from "express-list-endpoints";
import mongoose, { Model, set } from "mongoose";

/* console.log("Tweets here: ", data.length) */

const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

//Connect database:
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/thoughts";
mongoose.connect(mongoUrl);
mongoose.Promise = Promise;

// ---- Models ----

//Full thoughts' information
const Thought = mongoose.model("Thought", {
  message: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 140,
  },
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

const User = mongoose.model("User", {
  name: {
    type: String,
    required: true,
    minLength: 4,
    maxLength: 32,
    match: true,
  },
  email: {
    type: String,
    required: true,
    match: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
    maxLength: 24,
    match: true,
  },
  registerDate: {
    type: Date,
    default: () => new Date(),
  },
});

// ---- / Models ----

// ---- List all endpoints
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);

  res.json({ endpoints: endpoints });
});

// ---- Endpoints POST ----
// ---- Post a thought:
app.post("/thoughts", async (req, res) => {
  const { message } = req.body;

  try {
    const thought = await new Thought({ message }).save();
    res.status(201).json(thought);
  } catch (err) {
    //Bad request
    res.status(400).json({
      message: "Couldn't save a thought to the database",
      error: err.errors, //check the errors
    });
  }
});

// ---- / Endpoints POST ----

// ---- Endpoints GET ----
// ---- All messages, and filter: query param: filter by hearts N url ex.: http://localhost:8080/thoughts?hearts=23
app.get("/thoughts", async (req, res) => {
  /* console.log("this is the one with params"); */
  const { hearts } = req.query;

  const heartsNumber = Number(hearts);

  const query = Thought.find().sort({ createdAt: "desc" }); //building query for filtering by amount of hearts
  try {
    if (hearts) {
      //Filter by amount of hearts
      query.find({
        hearts: { $eq: heartsNumber },
      });
    }

    const allThoughts = await query.exec();

    if (!allThoughts.length) {
      return res
        .status(404)
        .json({ error: `Message with ${heartsNumber} hearts doesn't exist` });
    }

    res.json(allThoughts);
  } catch (err) {
    res.status(400).json({
      message: "On no, something went wrong, couldn't retrieve any thoughts",
    });
  }
});

// ---- Find one thought by id
app.get("/thoughts/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: `Oops, this id ${id} is invalid` });
  }

  try {
    const singleThought = await Thought.findById(id).exec();

    if (!singleThought) {
      return res.status(404).json({
        error: `Oh no, seem like a thougth with ${id} doesn't exist or was deleted!`,
      });
    }

    res.status(201).json(singleThought);
  } catch (err) {
    res.status(404).json({
      message: `Oops, thought with ${id} doesn't seem to exist yet`,
      error: err.errors,
    });
  }
});

// ---- Like a thought
app.post("/thoughts/:id/like", async (req, res) => {
  const { id } = req.params;
  const update = { $inc: { hearts: 1 }, new: true };

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: `Oops, this id ${id} is invalid` });
  }

  try {
    const addLike = await Thought.findByIdAndUpdate(id, update);

    if (!addLike) {
      return res.status(404).json({
        error: `Oops, can't like thought with id ${id} because it doesn't exist or was deleted`,
      });
    }

    res.status(200).json(addLike);
  } catch (err) {
    res.status(500).json({
      message: "Couldn't save like to the database",
      error: err.errors,
    });
  }
});

// --- All messages with filter: query param, that have N or more hearts, url ex.: http://localhost:8080/thoughts/hearts?hearts=N&sort=desc

// TODO check the route
app.get("/hearts", async (req, res) => {
  const { hearts } = req.query;
  const heartsMore = Number(hearts);

  if (isNaN(heartsMore)) {
    return res
      .status(400)
      .json({ message: "Oops, this number of likes is not valid" });
  }

  const query = {};
  if (hearts) {
    query.hearts = { $gte: heartsMore };
  }

  try {
    const filteredThougths = await Thought.find(query).sort({ hearts: "desc" });

    if (filteredThougths.length === 0) {
      return res.status(404).json({
        success: false,
        response: [],
        message: `Looks like there are no thoughts with ${hearts} or more likes.`,
      });
    }
    return res.status(200).json({
      success: true,
      response: filteredThougths,
      message: "Found them!",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      response: [],
      message: "Something went wrong at the server",
    });
  }
});

// ---- / Endpoints GET ----

// TODO --- Edit thought -----
// ---- Endpoints PUT ----
//Edit a thought

app.put("/test/:id", async (req, res) => {
  return res.json(req.body);
});

app.put("/thoughts/:id", async (req, res) => {
  const { id } = req.params;
  const editedThought = req.body.message;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: `Oops, this id ${id} is invalid` });
  }

  if (!editedThought) {
    return res.status(400).json({
      error: "Message is required to update a thought",
    });
  }

  const foundThought = await Thought.findById(id);
  try {
    if (!foundThought) {
      return res.status(404).json({
        error: `Oops, thought with ${id} doesn't seem to exist yet`,
      });
    }
    foundThought.message = editedThought;
    await foundThought.save();
    res.status(200).json({
      message: "Message was successfully updated",
      thought: foundThought,
    });
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong at the server",
      error: err.errors,
    });
  }
});

// ---- / Endpoints PUT ----

// ---- Endpoints DELETE ----
// Delete a thought
app.delete("/thoughts/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Oops, looks like id is invalid" });
  }
  try {
    const foundThought = await Thought.findByIdAndDelete(id).exec();

    if (!foundThought) {
      return res.status(404).json({
        error: `Oh no, you can't delete a thougth with ${id} because it doesn't exist!`,
      });
    }

    res.status(200).json({ message: "Thought was deleted" });
  } catch (err) {
    res.status(500).json({
      message: "Something went wrong at the server",
      error: err.errors,
    });
  }
});

// ---- / Endpoints DELETE ----

// TODO ---- LATER -----

// ---- Sorting by date ----

//Endpoint to sort all messages by date from old to new, url ex.: OR with /sort-by/?date=old:-new
app.get("/sort-oldest/", async (req, res) => {
  /* const { date } = req.query; */

  const sortedByDate = await new Thought.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  res.json(sortedByDate);
});

//Endpoint to sort all messages by date new to old, url ex.: /messages/sort-by/?date=old:-new
app.get("/thoughts/sort-newest/", (req, res) => {
  const sortedByDate = data.sort(
    // TODO still data
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  res.json(sortedByDate);
});

//Endpoint to find all messages filtered by date from a specific date that exists/up to a specific date
/* app.get("/messages/date/?date=old:-new);
app.get("/messages/date/?date=new:-old); 
const { date } = req.query;

const dateString = ParseInt(date);

const DateObject = new Date(date)*/

//Endpoint to find all messages filtered by a year
/* app.get("/messages/year/:year", (req, res) => {
  const createdAtDate = data.map((item) => item.createdAt); */
/*   res.json(createdAtYear);
}); */

//Endpoint to find all messages filtered by month
/* app.get("/messages/month/:month" or "/messages/month?month=May");
use Date.parse for this to get timestamp with name of the month in it? 
*/

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// ---- REGISTER ----
// TODO add user registration

// ---- LOGIN ----
// TODO add user login
