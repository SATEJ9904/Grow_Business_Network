const express = require('express');
const router = express.Router();

const Chapter = require('../models/Chapter');


// GET ALL CITIES
router.get('/cities', async (req, res) => {
  try {
    const cities = await Chapter.distinct(
      'city',
      { isActive: true }
    );

    res.json({
      success: true,
      data: cities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// GET CHAPTERS BY CITY
router.get(
  '/chapters-by-city/:city',
  async (req, res) => {
    try {
      const chapters = await Chapter.find({
        city: req.params.city,
        isActive: true,
      });

      res.json({
        success: true,
        data: chapters,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

module.exports = router;