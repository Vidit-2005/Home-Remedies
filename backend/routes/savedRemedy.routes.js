const express = require("express");
const {
  getSavedRemedies,
  saveRemedy,
  unsaveRemedy,
} = require("../controllers/savedRemedy.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", protect, getSavedRemedies);
router.post("/", protect, saveRemedy);
router.delete("/:remedyId", protect, unsaveRemedy);

module.exports = router;