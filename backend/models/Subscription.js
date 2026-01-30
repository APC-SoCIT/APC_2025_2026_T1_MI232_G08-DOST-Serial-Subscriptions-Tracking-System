const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  serialNumber: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "active",
  },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
