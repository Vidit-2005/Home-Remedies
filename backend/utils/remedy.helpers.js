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
    const remedyObject = remedy.toObject ? remedy.toObject() : { ...remedy };
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

module.exports = { enrichRemedies };