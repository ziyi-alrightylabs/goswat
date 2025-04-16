// server.js

const express = require("express");
const multer  = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();

// Enable CORS for all origins (or restrict later if needed)
app.use(cors());

// Set up the uploads directory (creates 'uploads' if it doesn't exist)
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer storage to save files to disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Prepend a timestamp to avoid name collisions
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Optionally, you can filter by file type (only images allowed)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Create an instance of multer with the defined storage and filter
const upload = multer({
  storage,
  fileFilter
});

// Our endpoint to handle the POST submission
// We expect fields: photo1, photo2, photo3 for photos and signature for signature.
// Additionally, other non-file fields (like latitude, longitude, mobile, project, stop) can be passed.
app.post(
  "/api/submitDelivery",
  upload.fields([
    { name: "photo1", maxCount: 1 },
    { name: "photo2", maxCount: 1 },
    { name: "photo3", maxCount: 1 },
    { name: "signature", maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const fields = req.body;
      const files = req.files || {};

      // Safely access photos if they exist
      const photos = ["photo1", "photo2", "photo3"]
        .filter((key) => files[key])
        .map((key) => files[key][0]); // Each is an array of 1 file

      // Safely access signature
      const signature = files.signature ? files.signature[0] : null;

      console.log("Received fields:", fields);
      console.log("Received photos:", photos.map(f => f.originalname));
      if (signature) console.log("Received signature:", signature.originalname);

      res.json({
  message: "Delivery submission received successfully.",
  data: {
    fields,
    photos: photos.map(file => ({
      originalName: file.originalname,
      storedPath: file.path
    })),
    signature: signature ? {
      originalName: signature.originalname,
      storedPath: signature.path
    } : null
  }
});
    } catch (err) {
      console.error("Error handling upload:", err);
      res.status(500).json({ error: "Server error: " + err.message });
    }
  }
);

// A simple endpoint for health checking the service
app.get("/", (req, res) => {
  res.send("API is running.");
});

// Render requires that the app listens on process.env.PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
