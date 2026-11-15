
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config({ override: true });
console.log("Admin username loaded:", process.env.ADMIN_USERNAME);
console.log("Admin hash length:", process.env.ADMIN_PASSWORD_HASH?.length);

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.disable("x-powered-by");

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));

// --------------------------------------------------
// FOOD MENU
// --------------------------------------------------

const FOOD_MENU = [
  { foodId: "F001", name: "Veg Burger", category: "Fast Food", price: 80, emoji: "🍔", available: true },
  { foodId: "F002", name: "Margherita Pizza", category: "Pizza", price: 180, emoji: "🍕", available: true },
  { foodId: "F003", name: "Veg Fried Rice", category: "Rice", price: 120, emoji: "🍚", available: true },
  { foodId: "F004", name: "Masala Dosa", category: "South Indian", price: 70, emoji: "🥞", available: true },
  { foodId: "F005", name: "Paneer Wrap", category: "Wraps", price: 110, emoji: "🌯", available: true },
  { foodId: "F006", name: "Chocolate Cake", category: "Dessert", price: 90, emoji: "🍰", available: true }
];

// --------------------------------------------------
// DFA STATES AND TRANSITIONS
// --------------------------------------------------

const DFA_TRANSITIONS = {
  PLACED: {
    PREPARING: "PREPARING"
  },
  PREPARING: {
    READY_FOR_PICKUP: "READY_FOR_PICKUP"
  },
  READY_FOR_PICKUP: {
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY"
  },
  OUT_FOR_DELIVERY: {
    DELIVERED: "DELIVERED"
  },
  DELIVERED: {}
};

const ORDER_STATUSES = [
  "PLACED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED"
];

// --------------------------------------------------
// MONGODB SCHEMAS
// --------------------------------------------------

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  items: [{
    foodId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    subtotal: { type: Number, required: true, min: 0 }
  }],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ORDER_STATUSES,
    default: "PLACED",
    required: true
  },
  history: [{
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  versionKey: false
});

const foodSchema = new mongoose.Schema({
  foodId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  emoji: {
    type: String,
    default: "🍽️"
  },
  available: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

const Order = mongoose.model("Order", orderSchema);
const Food = mongoose.model("Food", foodSchema);

// --------------------------------------------------
// VALIDATION AND HELPER FUNCTIONS
// --------------------------------------------------

function validateTransition(currentStatus, nextStatus) {
  return Object.prototype.hasOwnProperty.call(
    DFA_TRANSITIONS[currentStatus] || {},
    nextStatus
  );
}

function generateOrderId() {
  return `ORD-${Date.now()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
}

function validateCustomer(body) {
  const { customerName, email, phone, address, items } = body;

  if (
    typeof customerName !== "string" ||
    customerName.trim().length < 2 ||
    customerName.trim().length > 100
  ) {
    return "Customer name must contain between 2 and 100 characters.";
  }

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return "Enter a valid email address.";
  }

  if (typeof phone !== "string" || !/^\d{10}$/.test(phone)) {
    return "Phone number must contain exactly 10 digits.";
  }

  if (
    typeof address !== "string" ||
    address.trim().length < 5 ||
    address.trim().length > 500
  ) {
    return "Address must contain between 5 and 500 characters.";
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return "Select at least one food item.";
  }

  return null;
}

// Public tracking responses must never expose customer contact details.
function publicOrder(order) {
  return {
    orderId: order.orderId,
    items: order.items,
    total: order.total,
    status: order.status,
    history: order.history,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

// --------------------------------------------------
// ADMIN AUTHENTICATION
// --------------------------------------------------

function requireAdmin(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Admin login required."
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "foodflow-api",
      audience: "foodflow-admin"
    });

    if (
      decoded.role !== "admin" ||
      decoded.username !== process.env.ADMIN_USERNAME
    ) {
      return res.status(403).json({
        message: "Admin access denied."
      });
    }

    req.admin = {
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired admin token. Please log in again."
    });
  }
}

// --------------------------------------------------
// GENERAL ENDPOINTS
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    name: "Online Food Ordering and Delivery Tracking System",
    status: "running",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    endpoints: [
      "GET /api/health",
      "GET /api/foods",
      "POST /api/admin/login",
      "POST /api/orders",
      "GET /api/orders (admin authentication required)",
      "GET /api/orders/:id",
      "GET /api/orders/:id/history",
      "PATCH /api/orders/:id/status (admin authentication required)"
    ]
  });
});

app.get("/api/health", (req, res) => {
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    server: "running",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// --------------------------------------------------
// ADMIN LOGIN
// --------------------------------------------------

app.post("/api/admin/login", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.length > 100 ||
      password.length > 200
    ) {
      return res.status(400).json({
        message: "Enter a valid admin username and password."
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      process.env.ADMIN_PASSWORD_HASH
    );

    const usernameMatches = username === process.env.ADMIN_USERNAME;

    console.log("Admin login diagnostic:", {
  usernameMatches,
  passwordMatches
});
    if (!usernameMatches || !passwordMatches) {
      return res.status(401).json({
        message: "Invalid admin username or password."
      });
    }

    const token = jwt.sign(
      {
        username: process.env.ADMIN_USERNAME,
        role: "admin"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
        issuer: "foodflow-api",
        audience: "foodflow-admin"
      }
    );

    res.set("Cache-Control", "no-store");

    res.json({
      message: "Admin login successful.",
      token,
      expiresIn: 7200,
      admin: {
        username: process.env.ADMIN_USERNAME,
        role: "admin"
      }
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// FOOD MENU API
// --------------------------------------------------

app.get("/api/foods", async (req, res, next) => {
  try {
    const foods = await Food.find({
      available: true
    }).sort({
      foodId: 1
    }).lean();

    res.json(foods);
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// PLACE ORDER
// --------------------------------------------------

app.post("/api/orders", async (req, res, next) => {
  try {
    const validationError = validateCustomer(req.body || {});

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const { customerName, email, phone, address, items } = req.body;
    const quantities = new Map();

    for (const item of items) {
      if (
        !item ||
        typeof item.foodId !== "string" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20
      ) {
        return res.status(400).json({
          message:
            "Each item must contain a valid foodId and a quantity between 1 and 20."
        });
      }

      quantities.set(
        item.foodId,
        (quantities.get(item.foodId) || 0) + item.quantity
      );

      if (quantities.get(item.foodId) > 20) {
        return res.status(400).json({
          message: "The total quantity for each food item cannot exceed 20."
        });
      }
    }

    const requestedFoodIds = [...quantities.keys()];

    const availableFoods = await Food.find({
      foodId: { $in: requestedFoodIds },
      available: true
    }).lean();

    if (availableFoods.length !== requestedFoodIds.length) {
      return res.status(400).json({
        message:
          "One or more selected food items do not exist or are unavailable."
      });
    }

    const validatedItems = availableFoods.map((food) => {
      const quantity = quantities.get(food.foodId);

      return {
        foodId: food.foodId,
        name: food.name,
        price: food.price,
        quantity,
        subtotal: food.price * quantity
      };
    });

    const total = validatedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const order = await Order.create({
      orderId: generateOrderId(),
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      phone,
      address: address.trim(),
      items: validatedItems,
      total,
      status: "PLACED",
      history: [{
        status: "PLACED",
        timestamp: new Date()
      }]
    });

    res.status(201).json({
      message: "Order placed successfully.",
      order: publicOrder(order.toObject())
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// ADMIN: VIEW ALL ORDERS
// --------------------------------------------------

app.get("/api/orders", requireAdmin, async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.set("Cache-Control", "no-store");

    res.json({
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// PUBLIC: TRACK ORDER HISTORY
// --------------------------------------------------

app.get("/api/orders/:id/history", async (req, res, next) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.id
    }).select("orderId status history createdAt updatedAt").lean();

    if (!order) {
      return res.status(404).json({
        message: "Order not found."
      });
    }

    res.set("Cache-Control", "no-store");
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// PUBLIC: TRACK ORDER
// --------------------------------------------------

app.get("/api/orders/:id", async (req, res, next) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.id
    }).lean();

    if (!order) {
      return res.status(404).json({
        message: "Order not found."
      });
    }

    res.set("Cache-Control", "no-store");
    res.json(publicOrder(order));
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// ADMIN: UPDATE DELIVERY STATUS USING DFA
// --------------------------------------------------

app.patch(
  "/api/orders/:id/status",
  requireAdmin,
  async (req, res, next) => {
    try {
      const { status: nextStatus } = req.body || {};

      if (
        typeof nextStatus !== "string" ||
        !Object.prototype.hasOwnProperty.call(DFA_TRANSITIONS, nextStatus)
      ) {
        return res.status(400).json({
          message: "Unknown order status.",
          allowedStatuses: ORDER_STATUSES
        });
      }

      const order = await Order.findOne({
        orderId: req.params.id
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found."
        });
      }

      if (!validateTransition(order.status, nextStatus)) {
        return res.status(400).json({
          message: `Invalid DFA transition: ${order.status} -> ${nextStatus}`,
          currentStatus: order.status,
          allowedNextStatuses: Object.keys(
            DFA_TRANSITIONS[order.status] || {}
          )
        });
      }

      order.status = nextStatus;

      order.history.push({
        status: nextStatus,
        timestamp: new Date()
      });

      await order.save();

      res.set("Cache-Control", "no-store");

      res.json({
        message: "Order status updated successfully.",
        order
      });
    } catch (error) {
      next(error);
    }
  }
);

// --------------------------------------------------
// 404 AND ERROR HANDLING
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found."
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed.",
      errors: Object.values(error.errors).map((item) => item.message)
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: "A duplicate record already exists."
    });
  }

  if (
    error.name === "MongoServerSelectionError" ||
    error.name === "MongoNetworkError"
  ) {
    return res.status(503).json({
      message: "Database is temporarily unavailable."
    });
  }

  res.status(500).json({
    message: "An unexpected server error occurred."
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from server/.env.");
    }

    if (!process.env.ADMIN_USERNAME) {
      throw new Error("ADMIN_USERNAME is missing from server/.env.");
    }

    if (
      !process.env.ADMIN_PASSWORD_HASH ||
      !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(
        process.env.ADMIN_PASSWORD_HASH
      )
    ) {
      throw new Error(
        "ADMIN_PASSWORD_HASH is missing or is not a valid bcrypt hash."
      );
    }

    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32 ||
      process.env.JWT_SECRET.includes("PASTE_YOUR")
    ) {
      throw new Error(
        "Set a private JWT_SECRET of at least 32 characters in server/.env."
      );
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("MongoDB connected successfully");

    for (const food of FOOD_MENU) {
      await Food.updateOne(
        { foodId: food.foodId },
        { $setOnInsert: food },
        { upsert: true }
      );
    }

    console.log("Food menu initialized");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Food ordering API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
