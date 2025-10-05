const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection (Atlas)
const mongoURI =
  process.env.MONGO_URI ||
  "mongodb+srv://admin:admin123@cluster0.tt5iuo1.mongodb.net/helpdesk?retryWrites=true&w=majority";

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// =======================
// Models
// =======================

// Ticket model
const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Ticket = mongoose.model("Ticket", ticketSchema);

// Comment model
const commentSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
  body: { type: String, required: true },
  author: { type: String }, // optional: can be user's email or ID
  createdAt: { type: Date, default: Date.now },
});

const Comment = mongoose.model("Comment", commentSchema);

// =======================
// Routes
// =======================

// Create a ticket
app.post("/api/tickets", async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    const savedTicket = await ticket.save();
    res.status(201).json(savedTicket);
  } catch (error) {
    res.status(500).json({ message: "Error creating ticket", error });
  }
});

// Get all tickets
app.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tickets", error });
  }
});

// Get single ticket + comments
app.get("/api/tickets/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ticket ID" });
  }

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const comments = await Comment.find({ ticketId: ticket._id }).sort({ createdAt: 1 });
    res.json({ ticket, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update ticket
app.put("/api/tickets/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ticket ID" });
  }

  try {
    const updatedTicket = await Ticket.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedTicket) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: "Error updating ticket", error });
  }
});

// Add comment to ticket
app.post("/api/tickets/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { body, author } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ticket ID" });
  }

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const comment = new Comment({ ticketId: ticket._id, body, author });
    const savedComment = await comment.save();

    res.status(201).json(savedComment);
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error });
  }
});

// =======================
// Start server
// =======================
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

