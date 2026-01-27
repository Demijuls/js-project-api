import cors from "cors";
import express from "express";
import data from "./data.json";
import listEndpoints from "express-list-endpoints";
import mongoose, { Model } from "mongoose";

/* console.log("Tweets here: ", data.length) */

const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

//for database:
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/thoughts";
mongoose.connect(mongoUrl); //connecting to it
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
  hearts: Number,
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

//List all enpoints
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);

  res.json({ endpoints: endpoints });
});

// ---- Endpoints POST ----
//All thougths:
app.post("/all", async (req, res) => {
  const thought = new Thought({ message: req.body.message });
  await thought.save();
  res.json(thought);
  /* console.log(req.body);
  res.send("blahblah"); */
});

// Just to see all json data, temporary
app.get("/data", (req, res) => {
  res.json(data);
});

//Find a message by id
app.get("/message/id/:id", (req, res) => {
  const id = req.params.id;

  const messageById = data.find((item) => item._id === id);

  if (!messageById) {
    return res
      .status(404)
      .json({ error: `Message with id ${id} doesn't exist` });
  }

  res.json(messageById);
});

//Filter all messages that have N hearts //url ex.: http://localhost:8080/messages/?hearts=23
app.get("/messages", (req, res) => {
  const { hearts } = req.query;

  const heartsNumber = Number(hearts);

  console.log("hearts", heartsNumber);

  let filteredByHearts = data;

  if (hearts) {
    filteredByHearts = filteredByHearts.filter(
      (item) => item.hearts === heartsNumber,
    );

    if (!filteredByHearts.length) {
      return res
        .status(404)
        .json({ error: `Message with ${heartsNumber} hearts doesn't exist` });
    }
  }

  res.json(filteredByHearts);
});

//Finds A MESSAGE (first one) with specific number of hearts, temporary
app.get("/messages/hearts/:hearts", (req, res) => {
  const hearts = req.params.hearts;
  const heartsNumber = data.find(
    (heartsNumber) => Number(heartsNumber.hearts) === Number(hearts),
  );

  if (!heartsNumber) {
    return res
      .status(404)
      .json({ error: `Message with ${hearts} number doesn't exist` });
  }

  res.json(heartsNumber);
});

//Endpoint to filter all messages that have N or more hearts, url ex.: http://localhost:8080/messages/more-hearts?hearts=N
app.get("/messages/more-hearts", (req, res) => {
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

//Endpoint to sort all messages by date from old to new, url ex.: /messages/sort-by/?date=old:-new
app.get("/messages/sort-oldest/", (req, res) => {
  const sortedByDate = data.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
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
