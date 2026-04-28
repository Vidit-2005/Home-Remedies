const Category = require("../models/category.model");
const Remedy = require("../models/remedy.model");
const Ingredient = require("../models/ingredient.model");
const Rating = require("../models/rating.model");

const enrichRemedies = async (remedies) => {
  const remedyIds = remedies.map((remedy) => remedy._id);

  const [ingredients, ratings] = await Promise.all([
    Ingredient.find({ remedy_id: { $in: remedyIds } }),
    Rating.find({ remedy_id: { $in: remedyIds } }).populate("user_id", "username email role"),
  ]);

  const ingredientsMap = ingredients.reduce((acc, ingredient) => {
    const key = String(ingredient.remedy_id);
    if (!acc[key]) acc[key] = [];
    acc[key].push(ingredient);
    return acc;
  }, {});

  const ratingsMap = ratings.reduce((acc, rating) => {
    const key = String(rating.remedy_id);
    if (!acc[key]) acc[key] = [];
    acc[key].push(rating);
    return acc;
  }, {});

  return remedies.map((remedy) => {
    const remedyObject = remedy.toObject();
    const remedyRatings = ratingsMap[String(remedy._id)] || [];
    const avgRating = remedyRatings.length
      ? remedyRatings.reduce((sum, rating) => sum + rating.score, 0) / remedyRatings.length
      : 0;

    return {
      ...remedyObject,
      ingredients: ingredientsMap[String(remedy._id)] || [],
      ratings: remedyRatings,
      rating_summary: {
        average: Number(avgRating.toFixed(1)),
        total_reviews: remedyRatings.length,
      },
    };
  });
};

const getRemedies = async (req, res) => {
  try {
    const { search = "", health_problem = "", ingredient = "", category_id = "" } = req.query;
    const searchTerm = search || health_problem || ingredient || "";

    const query = {};
    if (category_id) {
      query.category_id = category_id;
    }

    let remedyIdsFromIngredient = [];
    if (ingredient || searchTerm) {
      const ingredientRegex = new RegExp(ingredient || searchTerm, "i");
      remedyIdsFromIngredient = await Ingredient.distinct("remedy_id", {
        ingredient_name: ingredientRegex,
      });
    }

    let remedies = [];

    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i");
      const textRemedies = await Remedy.find({
        ...query,
        $or: [
          { title: regex },
          { description: regex },
          { health_problem: regex },
        ],
      });

      const ingredientRemedies = remedyIdsFromIngredient.length
        ? await Remedy.find({ ...query, _id: { $in: remedyIdsFromIngredient } })
        : [];

      const remedyMap = new Map();
      [...textRemedies, ...ingredientRemedies].forEach((remedy) => {
        remedyMap.set(String(remedy._id), remedy);
      });
      remedies = [...remedyMap.values()];
    } else {
      remedies = await Remedy.find(query);
    }

    remedies = await Remedy.populate(remedies, [
      { path: "category_id", select: "category_name description" },
      { path: "user_id", select: "username email role created_at" },
    ]);

    const enriched = await enrichRemedies(remedies);

    return res.status(200).json({
      count: enriched.length,
      remedies: enriched,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch remedies.", error: error.message });
  }
};

const getRemedyById = async (req, res) => {
  try {
    const remedy = await Remedy.findById(req.params.id).populate([
      { path: "category_id", select: "category_name description" },
      { path: "user_id", select: "username email role created_at" },
    ]);

    if (!remedy) {
      return res.status(404).json({ message: "Remedy not found." });
    }

    const enriched = await enrichRemedies([remedy]);
    return res.status(200).json({ remedy: enriched[0] });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch remedy.", error: error.message });
  }
};

const getRemedyIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ remedy_id: req.params.id });
    return res.status(200).json({ ingredients });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch ingredients.", error: error.message });
  }
};

const addRemedy = async (req, res) => {
  try {
    const {
      title,
      description,
      health_problem,
      image = "",
      preparation_steps,
      category_id,
      category_name,
      ingredients = [],
    } = req.body;

    if (!title || !description || !health_problem || !preparation_steps) {
      return res.status(400).json({
        message: "title, description, health_problem, and preparation_steps are required.",
      });
    }

    let finalCategoryId = category_id || null;

    if (!finalCategoryId && category_name) {
      let category = await Category.findOne({ category_name });
      if (!category) {
        category = await Category.create({ category_name });
      }
      finalCategoryId = category._id;
    }

    if (!finalCategoryId) {
      return res.status(400).json({ message: "category_id or category_name is required." });
    }

    const stepsArray = Array.isArray(preparation_steps)
      ? preparation_steps
      : String(preparation_steps)
          .split("\n")
          .map((step) => step.trim())
          .filter(Boolean);

    const remedy = await Remedy.create({
      title,
      description,
      health_problem,
      image,
      preparation_steps: stepsArray,
      category_id: finalCategoryId,
      user_id: req.user._id,
    });

    const ingredientDocs = Array.isArray(ingredients)
      ? ingredients
          .filter((item) => item && item.ingredient_name)
          .map((item) => ({
            ingredient_name: item.ingredient_name,
            quantity: Number(item.quantity) || 0,
            unit: item.unit || "",
            remedy_id: remedy._id,
          }))
      : [];

    if (ingredientDocs.length) {
      await Ingredient.insertMany(ingredientDocs);
    }

    const created = await Remedy.findById(remedy._id).populate([
      { path: "category_id", select: "category_name description" },
      { path: "user_id", select: "username email role created_at" },
    ]);

    const enriched = await enrichRemedies([created]);

    return res.status(201).json({
      message: "Remedy added successfully.",
      remedy: enriched[0],
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add remedy.", error: error.message });
  }
};

module.exports = {
  getRemedies,
  getRemedyById,
  getRemedyIngredients,
  addRemedy,
};
