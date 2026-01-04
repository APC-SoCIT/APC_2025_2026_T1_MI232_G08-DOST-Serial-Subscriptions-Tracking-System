const express = require("express");
const router = express.Router();

const {
  getSubscriptions,
  createSubscription,
} = require("../controllers/subscriptionController");

router.get("/", getSubscriptions);
router.post("/", createSubscription);

module.exports = router;
