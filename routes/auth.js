import { Router } from "express";
const router = Router();
import jwt from "jsonwebtoken";
import * as Validation from "../validation.js";
const registerValidation = Validation.default.registerValidation;
const loginValidation = Validation.default.loginValidation;
import * as Models from "../models/index.js";
const User = Models.default.userModel;
const courseModel = Models.default.courseModel;

//middleware
router.use((req, res, next) => {
  console.log("A request is coming in to auth.js (/api/user)");
  next();
});

router.get("/testAPI", (req, res) => {
  const msgObj = {
    message: "Heart beating! testAPI is working.",
  };
  return res.json(msgObj);
});

router.post("/register", async (req, res) => {
  //   console.log(registerValidation(req.body));
  //   Joi return JSON object as bellow
  //   {
  //     value: {
  //       username: 'hahaha',
  //       email: 'sda@gmail.com',
  //       password: '123456',
  //       role: 'bbbbbb'
  //     },
  //     error: [Error [ValidationError]: "role" must be one of [student, instructor]] {
  //       _original: {
  //         username: 'hahaha',
  //         email: 'sda@gmail.com',
  //         password: '123456',
  //         role: 'bbbbbb'
  //       },
  //       details: [ [Object] ]
  //     }
  //   }
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //check if the user exists
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist)
    return res.status(400).send("Email has already been register.");

  // register the user
  const newUser = new User({
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    role: req.body.role,
  });
  try {
    const savedUser = await newUser.save();
    res.status(200).send({
      message: "success",
      savedObject: savedUser,
    });
  } catch (err) {
    res.status(400).send("User not saved");
  }
});

router.post("/login", async (req, res) => {
  // check the validation of data
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(401).send("User not found.");
    } else {
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (err) return res.status(400).send(err);
        if (isMatch) {
          const tokenObject = { _id: user._id, email: user.email };
          const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
          res.send({ success: true, token: "JWT " + token, user });
        } else {
          res.status(401).send("Wrong Username or Passeord ");
        }
      });
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

export default router;
