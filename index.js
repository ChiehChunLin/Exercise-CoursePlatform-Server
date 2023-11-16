import cors from "cors";
import express from "express";
const app = express();
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import * as routeModule from "./routes/index.js";
const authRoute = routeModule.default.auth;
const courseRoute = routeModule.default.course;
import passport from "passport";
import passportConfig from "./config/passport.js";
passportConfig(passport);

// connect to DB
mongoose
  .connect(process.env.DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connect to Mongo Altas.");
  })
  .catch((e) => {
    console.log(e);
  });

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/user", authRoute);
app.use(
  "/api/courses",
  passport.authenticate("jwt", { session: false }),
  courseRoute
);

//React client 預設 port為3000, 因此server不能和client port衝到
app.listen(8080, () => {
  console.log("Sever is running on port 8080.");
});
