
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();

// Enable CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    console.warn("Rejected file:", file.originalname, "| MIME type:", file.mimetype);
    cb(null, false);
  }
};

const upload = multer({ storage, fileFilter });

// POST route for form submission
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
      console.log("Request received at /api/submitDelivery");

      const fields = req.body;
      const files = req.files || {};
      console.log("Fields:", fields);
      console.log("File keys:", Object.keys(files));

      const photos = ["photo1", "photo2", "photo3"]
        .map(key => files[key]?.[0])
        .filter(Boolean);

      const signature = files.signature ? files.signature[0] : null;

      console.log("Photos received:", photos.map(f => f.originalname));
      if (signature) {
        console.log("Signature received:", signature.originalname);
      }

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
      console.error("Upload error:", err);
      res.status(500).json({ error: "Server error: " + err.message });
    }
  }
);

// Health check route
app.get("/", (req, res) => {
  res.send("API is running.");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
