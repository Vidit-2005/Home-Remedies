const Remedy = require("../models/remedy.model");
const SavedRemedy = require("../models/saved-remedy.model");
const { enrichRemedies } = require("../utils/remedy.helpers");

const getSavedRemedies = async (req, res) => {
  try {
    const savedEntries = await SavedRemedy.find({ user_id: req.user._id })
      .sort({ saved_at: -1 })
      .populate("remedy_id");

    const remedies = savedEntries.map((entry) => entry.remedy_id).filter(Boolean);
    const enriched = remedies.length ? await enrichRemedies(remedies) : [];

    const savedRemedies = enriched.map((remedy, index) => ({
      ...remedy,
      saved_at: savedEntries[index]?.saved_at,
    }));

    return res.status(200).json({
      count: savedRemedies.length,
      saved_remedies: savedRemedies,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch saved remedies.", error: error.message });
  }
};

const saveRemedy = async (req, res) => {
  try {
    const { remedy_id } = req.body;

    if (!remedy_id) {
      return res.status(400).json({ message: "remedy_id is required." });
    }

    const remedy = await Remedy.findById(remedy_id);
    if (!remedy) {
      return res.status(404).json({ message: "Remedy not found." });
    }

    const existing = await SavedRemedy.findOne({ user_id: req.user._id, remedy_id });
    if (existing) {
      return res.status(200).json({ message: "Remedy already saved." });
    }

    const saved = await SavedRemedy.create({ user_id: req.user._id, remedy_id });

    return res.status(201).json({
      message: "Remedy saved successfully.",
      saved,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save remedy.", error: error.message });
  }
};

const unsaveRemedy = async (req, res) => {
  try {
    const { remedyId } = req.params;

    const deleted = await SavedRemedy.findOneAndDelete({
      user_id: req.user._id,
      remedy_id: remedyId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Saved remedy not found." });
    }

    return res.status(200).json({ message: "Remedy removed from saved list." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove saved remedy.", error: error.message });
  }
};

module.exports = {
  getSavedRemedies,
  saveRemedy,
  unsaveRemedy,
};