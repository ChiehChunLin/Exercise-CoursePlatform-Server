import { Router } from "express";
const router = Router();
import * as Models from "../models/index.js";
const Course = Models.default.courseModel;
import * as courseValid from "../validation.js";
const courseValidation = courseValid.default.courseValidation;

router.use((req, res, next) => {
  console.log("A request is coming into course-route.js (/api/courses)...");
  // res.send("Hello /api");
  next();
});

router.get("/", (req, res) => {
  //populate , 因為此項目是根據user不同而不同，有ref作用，需要將user資料抓回來搜尋課程資料
  Course.find({})
    .populate("instructor", ["username", "email"])
    .then((course) => {
      res.send(course);
    })
    .catch(() => {
      res.status(500).send("Error!! Cannot get course!!");
    });
});

router.get("/instructor/:_instructor_id", (req, res) => {
  let { _instructor_id } = req.params;
  Course.find({ instructor: _instructor_id })
    .populate("instructor", ["username", "email"])
    .then((data) => {
      console.log("server instructor data: " + data);
      res.status(200).send(data);
    })
    .catch(() => {
      res.status(500).send("Cannot get course data.");
    });
});

router.get("/findByName/:name", (req, res) => {
  let { name } = req.params;
  console.log("/findByName/" + name);
  Course.find({ title: name })
    .populate("instructor", ["username", "email"])
    .then((course) => {
      res.status(200).send(course);
    })
    .catch(() => {
      res.status(500).send("Cannot get course data.");
    });
});

router.get("/student/:_student_id", (req, res) => {
  let { _student_id } = req.params;
  Course.find({ student: _student_id })
    .populate("instructor", ["username", "email"])
    .then((courses) => {
      console.log("server student data: " + courses);
      res.status(200).send(courses);
    })
    .catch(() => {
      res.status(500).send("Cannot get course data.");
    });
});

router.get("/:_id", (req, res) => {
  console.log("comes to get /courses/:id");
  let { _id } = req.params;
  Course.findOne({ _id })
    .populate("instructor", ["email"])
    .then((course) => {
      res.send(course);
    })
    .catch((e) => {
      res.send(e);
    });
});

router.post("/enroll/:_id", async (req, res) => {
  let { _id } = req.params;
  let { user_id } = req.body;
  console.log("comes to post /enroll/:id");
  try {
    let course = await Course.findOne({ _id });
    console.log(course);
    if (course == null) throw "There is no course to enroll.";
    course.student.push(user_id);
    await course.save();
    res.status(200).send("Done Enrollment.");
  } catch (err) {
    res.send(err);
  }
});
router.post("/", async (req, res) => {
  //validaate the inputs before making a new course
  const { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let { title, description, price } = req.body;
  if (req.user.isStudent()) {
    return res.status(400).send("Only instructor can post a new course.");
  }
  let newCourse = new Course({
    title,
    description,
    price,
    instructor: req.user._id,
  });
  try {
    await newCourse.save();
    res.status(200).send("New course has been saved.");
  } catch (err) {
    res.status(400).send("New Couse is failed to save. Error: " + err);
  }
});

router.patch("/:_id", async (req, res) => {
  //validaate the inputs before making a new course
  const { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let { _id } = req.params;
  let course = await Course.findOne({ _id });
  if (!course) {
    res.status(404);
    return res.json({
      success: false,
      message: "Course not found.",
    });
  }

  if (course.instructor.equals(req.user._id) || req.user.isAdmin()) {
    Course.findOneAndUpdate({ _id }, req.body, {
      new: true,
      runValidators: true,
    })
      .then(() => {
        res.send("Course updated.");
      })
      .catch((e) => {
        res.send({
          success: false,
          message: e,
        });
      });
  } else {
    res.status(403);
    return res.json({
      success: false,
      message:
        "Only the instructor of this course or web admin can edit this course.",
    });
  }
});

router.delete("/:_id", async (req, res) => {
  let { _id } = req.params;
  let course = await Course.findOne({ _id });
  if (!course) {
    res.status(404);
    return res.json({
      success: false,
      message: "Course not found.",
    });
  }

  if (course.instructor.equals(req.user._id) || req.user.isAdmin()) {
    Course.deleteOne({ _id })
      .then(() => {
        res.send("Course deleted.");
      })
      .catch((e) => {
        res.send({
          success: false,
          message: e,
        });
      });
  } else {
    res.status(403);
    return res.json({
      success: false,
      message:
        "Only the instructor of this course or web admin can delete this course.",
    });
  }
});

export default router;
