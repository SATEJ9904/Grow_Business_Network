const express = require("express");
const router = express.Router();

const User = require("../models/User");

// GET SINGLE USER
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET USERS BY CHAPTER ID
router.get("/chapter/:chapterId", async (req, res) => {
  try {
    const users = await User.find({
      chapterId: req.params.chapterId,
      status: "approved",
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// UPDATE BUSINESS INFO
router.put("/:userId/business-info", async (req, res) => {
  try {

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        ...req.body,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Business info updated successfully",
      data: user,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});

module.exports = router;
