import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  id: { type: String },
  title: { type: String, require: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  student: {
    type: [String],
    default: [],
  },
});

const Course = mongoose.model("Course", courseSchema);
export default Course;
