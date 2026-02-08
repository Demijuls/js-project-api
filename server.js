import cors from "cors";
import express from "express";
import data from "./data.json";
import listEndpoints from "express-list-endpoints";
import mongoose, { Model, set } from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt-nodejs";

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
    unique: true,
    required: true,
    minLength: 4,
    maxLength: 32,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex"),
  },

  registerDate: {
    type: Date,
    default: () => new Date(),
  },
});
// ---- / Models ----

// ---- Authentication function: only authorised users can add or like thoughts

const authenticateUser = async (req, res, next) => {
  const user = await User.findOne;
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ message: "User is logged out" });
  }

  if (user) {
    req.user = user;
    next();
  } else {
    //user is matched and not authorized to do smth
    res.status(401).json({ loggedOut: true });
  }
};
// ---- // Authentication function

// ---- List all endpoints ----
app.get("/", (req, res) => {
  const endpoints = listEndpoints(app);

  res.json({ endpoints: endpoints });
});

// ---- ALL USER AUTHORISATION ROUTES

// ----Creating new user, route: /register----

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required to register a user",
      });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    const salt = bcrypt.genSaltSync();
    const hashedPass = bcrypt.hashSync(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPass,
    });

    await user.save();

    res.status(201).json({
      id: user._id,
      accessToken: user.accessToken,
    }); //encrypting passwords
  } catch (err) {
    //User with this name already exists
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "User with this name or email alredy exists" });
    }
    //Bad request
    res
      .status(400)
      .json({ message: "Couldn't create a user", error: err.errors });
  }
});

// ---- Access with existing user, route: /login ----
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required to login",
      });
    }

    const user = await User.findOne({ email }); //retrieving username from database, lookig for match by email that should be unique (1 email=1 user)

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ userId: user._id, accessToken: user.accessToken });
  } catch (err) {
    //Bad request:
    // 1. Email is incorrect
    // 2. password doesn't match
    res.status(500).json({
      message: "Something went wrong, please try agan",
      error: err.errors,
    });
  }
});

// ---- Endpoints POST ----
// ---- Post a thought:
app.post("/thoughts", authenticateUser, async (req, res) => {
  //This will only work if next() function is called from the authenticateUser
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

// ---- Like a thought
app.post("/thoughts/:id/like", async (req, res) => {
  const { id } = req.params;

  //Storing operator in variable and options in variables
  const update = { $inc: { hearts: 1 } };
  const options = { new: true, runValidators: true };

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: `Oops, this id ${id} is invalid` });
  }

  try {
    const addLike = await Thought.findByIdAndUpdate(id, update, options);

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

// --- All messages with filter: query param, that have N or more hearts, url ex.: http://localhost:8080/thoughts/hearts?hearts=N&sort=desc

// ---- / Endpoints GET ----

// ---- Endpoints PUT ----

//Edit a thought
app.put("/thoughts/:id", authenticateUser, async (req, res) => {
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
app.delete("/thoughts/:id", authenticateUser, async (req, res) => {
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
  const sortedByDate = await new Thought.sort(
    // TODO still data
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
