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
//Thoughts' text
/* const Message = mongoose.model("ThoughtText", { message: String }); */

//Full thoughts' information
const Thought = mongoose.model("Thought", {
  message: String,
  /* {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  } */
  hearts: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

const User = mongoose.model("user", {
  name: String,
  email: String,
});

// ---- / Models ----

//List all endpoints
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);

  res.json({ endpoints: endpoints });
});

// Just to see all json data, temporary
/* app.get("/data", (req, res) => {
  res.json(data);
}); */

// ---- Endpoints POST ----
//All thougths:
app.post("/thought", async (req, res) => {
  const thought = new Thought({ message: req.body.message });
  await thought.save();
  res.json(thought);
  /* console.log(req.body);
  res.send("blahblah"); */
});

// ---- Endpoints PUT ----

//Edit a thought
app.put("/thought/:id", async (req, res) => {
  const { id } = req.params;
  const editedThought = req.body.message;

  const foundThought = await Thought.findById(id).exec();

  if (foundThought) {
    foundThought.message = editedThought;
    await foundThought.save();
  } else {
    res
      .status(404)
      .json({ error: `Oops, thought with ${id} doesn't seem to exist yet` });
  }
});

// ---- Endpoints DELETE ----

app.delete("/thought/:id", async (req, res) => {
  const { id } = req.params;

  const foundThought = await Thought.findById(id).exec();

  if (!foundThought) {
    return res.status(404).json({
      error: `Oh no, you can't delete a thougth with ${id} because it doesn't exist!`,
    });
  }
  await foundThought.deleteOne().exec();
  res.status(200).json({ message: "Thought was deleted" });
});

// ---- Endpoints GET ----

//All messages
/* app.get("/thoughts", async (req, res) => {
  console.log("this has no params");
  const allThoughts = await Thought.find();

  return res.json(allThoughts);
}); */

// ---- Find a message by id
app.get("/thought/:id", (req, res) => {
  const id = req.params.id;

  const messageById = data.find((item) => item._id === id);

  if (!messageById) {
    return res
      .status(404)
      .json({ error: `Message with id ${id} doesn't exist` });
  }

  res.json(messageById);
});

// ---- All messages, filter: query param: filter by hearts N or =+N, url ex.: http://localhost:8080/thoughts?hearts=23, url ex.: http://localhost:8080/thoughts/more-hearts?hearts=N,
app.get("/thoughts", async (req, res) => {
  /* console.log("this is the one with params"); */
  const { hearts } = req.query;

  const heartsNumber = Number(hearts);

  /*  console.log("hearts", heartsNumber); */

  const query = Thought.find();

  if (hearts) {
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
});

// TODO ---- LATER -----

// --- All messages that have N or more hearts, url ex.: http://localhost:8080/thoughts/more-hearts?hearts=N
app.get("/thoughts/more-hearts", (req, res) => {
  const { hearts } = req.query;

  const heartsMore = Number(hearts);

  let showPopular = data;

  if (hearts) {
    showPopular = showPopular.filter((item) => item.hearts >= heartsMore);

    if (!showPopular.length) {
      return res.status(404).json({
        error: `Message with more than ${hearts} hearts doesn't exist`,
      });
    }
  }
  res.json(showPopular);
});

// ---- Sorting by date ----

//Endpoint to sort all messages by date from old to new, url ex.: /messages/sort-by/?date=old:-new
app.get("/thoughts/sort-oldest/", (req, res) => {
  const sortedByDate = data.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  res.json(sortedByDate);
});

//Endpoint to sort all messages by date new to old, url ex.: /messages/sort-by/?date=old:-new
app.get("/thoughts/sort-newest/", (req, res) => {
  const sortedByDate = data.sort(
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
