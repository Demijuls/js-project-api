import cors from "cors";
import express from "express";
import data from "./data.json";
import listEndpoints from "express-list-endpoints";

/* console.log("Tweets here: ", data.length) */

const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

//List all enpoints
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);

  res.json({ endpoints: endpoints });
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

//Endpoint to find all messages filtered by a year
/* app.get("/messages/year/:year", (req, res) => {
  const createdAtDate = data.map((item) => item.createdAt); */
/*   res.json(createdAtYear);
}); */

//Endpoint to find all messages filtered by month
/* app.get("/messages/month/:month"); */

//Endpoint to sort all messages by date from old to new
/* app.get("/messages/?sort-by=date/old:-new:"); */

//Endpoint to filter all messages that have N hearts
app.get("/messages", (req, res) => {
  const { hearts } = req.query;

  const heartsNumber = Number(hearts);

  console.log("hearts", heartsNumber); //http://localhost:8080/messages/?hearts=23

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

//Find messages with specific number of hearts, same as previous one, temporary?
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

//Endpoint to filter all messages that have N or more hearts
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
