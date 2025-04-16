// server.js

const express = require("express");
const multer  = require("multer");
const path = require("path");
const fs = require("fs");

// Initialize the Express app
const app = express();

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
  // Use multer.fields to handle multiple file fields
  upload.fields([
    { name: "photo1", maxCount: 1 },
    { name: "photo2", maxCount: 1 },
    { name: "photo3", maxCount: 1 },
    { name: "signature", maxCount: 1 }
  ]),
  (req, res) => {
    try {
      // Extract non-file form fields
      const fields = req.body;
      // Extract the files (if present)
      const files = req.files;
      let photos = [];
      if (files) {
        if (files.photo1) photos.push(files.photo1[0]);
        if (files.photo2) photos.push(files.photo2[0]);
        if (files.photo3) photos.push(files.photo3[0]);
      }
      const signature = files && files.signature ? files.signature[0] : null;

      // Log the submission data to the console
      console.log("Delivery submission received:");
      console.log("Fields:", fields);
      console.log("Photos:", photos);
      console.log("Signature:", signature);

      // Return a JSON response showing what was received
      res.json({
        message: "Delivery submission received successfully.",
        data: {
          fields,
          photos: photos.map(file => ({
            originalName: file.originalname,
            storedPath: file.path
          })),
          signature: signature
            ? { originalName: signature.originalname, storedPath: signature.path }
            : null
        }
      });
    } catch (err) {
      console.error("Error processing submission:", err);
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
