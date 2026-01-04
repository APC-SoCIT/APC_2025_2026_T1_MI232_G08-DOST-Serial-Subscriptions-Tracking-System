// Mock data (no DB yet)
let subscriptions = [
  {
    id: 1,
    name: "Printer Subscription",
    serialNumber: "SN-001",
    price: 1200,
    status: "active",
  },
];

// GET all subscriptions
exports.getSubscriptions = (req, res) => {
  res.json(subscriptions);
};

// POST new subscription
exports.createSubscription = (req, res) => {
  const newSubscription = {
    id: subscriptions.length + 1,
    ...req.body,
  };

  subscriptions.push(newSubscription);
  res.status(201).json(newSubscription);
};
