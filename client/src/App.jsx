import DFAPage from "./DFAPage.jsx";
import { useCallback, useEffect, useState } from "react";
import {
  UtensilsCrossed,
  ShoppingCart,
  MapPin,
  ClipboardList,
  RefreshCw,
  CheckCircle2,
  Clock3,
  Truck,
  PackageCheck,
  ChefHat,
  Plus,
  Minus,
  Trash2,
  Search,
  AlertCircle,
  LayoutDashboard,
  ArrowRight,
  X,
  LogOut,
  LockKeyhole,
} from "lucide-react";
import "./App.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "") + "/api";

const ADMIN_TOKEN_KEY = "foodflowAdminToken";

const FOOD_MENU = [
  {
    foodId: "F001",
    name: "Veg Burger",
    category: "Snacks",
    description: "Fresh vegetables with a crispy patty.",
    price: 80,
    emoji: "🍔",
  },
  {
    foodId: "F002",
    name: "Margherita Pizza",
    category: "Pizza",
    description: "Classic pizza with tomato and cheese.",
    price: 180,
    emoji: "🍕",
  },
  {
    foodId: "F003",
    name: "Veg Fried Rice",
    category: "Rice",
    description: "Flavorful rice tossed with fresh vegetables.",
    price: 120,
    emoji: "🍚",
  },
  {
    foodId: "F004",
    name: "Masala Dosa",
    category: "South Indian",
    description: "Crispy dosa served with potato masala.",
    price: 70,
    emoji: "🥞",
  },
  {
    foodId: "F005",
    name: "Paneer Wrap",
    category: "Snacks",
    description: "Soft wrap filled with spiced paneer.",
    price: 110,
    emoji: "🌯",
  },
  {
    foodId: "F006",
    name: "Chocolate Cake",
    category: "Desserts",
    description: "Rich and delicious chocolate cake.",
    price: 90,
    emoji: "🍰",
  },
];

const STATUS_STEPS = [
  { value: "PLACED", label: "Order Placed", icon: ClipboardList },
  { value: "PREPARING", label: "Preparing", icon: ChefHat },
  {
    value: "READY_FOR_PICKUP",
    label: "Ready for Pickup",
    icon: PackageCheck,
  },
  {
    value: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    icon: Truck,
  },
  { value: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

const CATEGORIES = [
  "All",
  "Snacks",
  "Pizza",
  "Rice",
  "South Indian",
  "Desserts",
];

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || data.error || `Request failed (${response.status})`
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getOrderId(order) {
  return order?.orderId || order?._id || order?.id || "";
}

function getCustomer(order) {
  if (typeof order?.customer === "object" && order.customer) {
    return order.customer;
  }

  return {
    name:
      order?.customerName ||
      order?.name ||
      (typeof order?.customer === "string" ? order.customer : "") ||
      "Customer",
    email: order?.email || "",
    phone: order?.phone || "",
    address: order?.address || "",
  };
}

function getCustomerName(order) {
  const customer = getCustomer(order);
  return customer.name || order?.customerName || "Customer";
}

function getOrderItems(order) {
  return Array.isArray(order?.items) ? order.items : [];
}

function getItemName(item) {
  return item?.name || item?.foodName || item?.foodId || "Food item";
}

function getItemQuantity(item) {
  return Number(item?.quantity) || 1;
}

function getItemPrice(item) {
  return Number(item?.price ?? item?.unitPrice) || 0;
}

function getOrderTotal(order) {
  if (Number.isFinite(Number(order?.total))) {
    return Number(order.total);
  }

  if (Number.isFinite(Number(order?.totalAmount))) {
    return Number(order.totalAmount);
  }

  return getOrderItems(order).reduce(
    (sum, item) => sum + getItemPrice(item) * getItemQuantity(item),
    0
  );
}

function getStatusIndex(status) {
  return STATUS_STEPS.findIndex((step) => step.value === status);
}

function getNextStatus(status) {
  const index = getStatusIndex(status);

  if (index < 0 || index >= STATUS_STEPS.length - 1) {
    return null;
  }

  return STATUS_STEPS[index + 1].value;
}

function formatStatus(status) {
  return String(status || "PLACED")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function App() {
  const [activeTab, setActiveTab] = useState("menu");

  const [foods, setFoods] = useState(FOOD_MENU);
  const [foodLoading, setFoodLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("All");

  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [trackingId, setTrackingId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [adminToken, setAdminToken] = useState(
    () => sessionStorage.getItem(ADMIN_TOKEN_KEY) || ""
  );
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  const [adminOrders, setAdminOrders] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  const [notice, setNotice] = useState(null);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function showNotice(type, message) {
    setNotice({ type, message });
  }

  function clearNotice() {
    setNotice(null);
  }

  const loadFoods = useCallback(async () => {
    setFoodLoading(true);

    try {
      const data = await apiRequest(`${API_URL}/foods`);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.foods)
          ? data.foods
          : [];

      if (list.length > 0) {
        setFoods(
          list.map((food, index) => ({
            ...food,
            foodId: food.foodId || food._id || `FOOD-${index + 1}`,
            name: food.name || food.title || "Food item",
            category: food.category || "Other",
            description: food.description || "",
            price: Number(food.price) || 0,
            emoji:
              FOOD_MENU.find((item) => item.foodId === food.foodId)?.emoji ||
              "🍽️",
          }))
        );
      }
    } catch (error) {
      console.error("Could not load foods:", error);
    } finally {
      setFoodLoading(false);
    }
  }, []);

  const loadAdminOrders = useCallback(async () => {
    if (!adminToken) {
      setAdminOrders([]);
      setAdminError("");
      return;
    }

    setAdminLoading(true);
    setAdminError("");

    try {
      const data = await apiRequest(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const orders = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
          ? data.orders
          : [];

      setAdminOrders(orders);
    } catch (error) {
      setAdminError(error.message || "Could not load orders.");

      if (error.status === 401 || error.status === 403) {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        setAdminToken("");
        setAdminOrders([]);
      }
    } finally {
      setAdminLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  useEffect(() => {
    if (activeTab === "admin" && adminToken) {
      loadAdminOrders();
    }
  }, [activeTab, adminToken, loadAdminOrders]);

  async function loginAdmin(event) {
    event.preventDefault();
    setAdminError("");
    setAdminLoginLoading(true);

    try {
      const data = await apiRequest(`${API_URL}/admin/login`, {
        method: "POST",
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword,
        }),
      });

      if (!data.token) {
        throw new Error("Login succeeded but no token was returned.");
      }

      sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setAdminToken(data.token);
      setAdminPassword("");

      showNotice("success", "Admin login successful.");
    } catch (error) {
      setAdminError(error.message || "Admin login failed.");
    } finally {
      setAdminLoginLoading(false);
    }
  }

  function logoutAdmin() {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken("");
    setAdminOrders([]);
    setAdminPassword("");
    setAdminError("");
    showNotice("success", "Admin logged out.");
  }

  function addToCart(food) {
    setCart((previous) => {
      const existing = previous.find(
        (item) => item.foodId === food.foodId
      );

      if (existing) {
        return previous.map((item) =>
          item.foodId === food.foodId
            ? { ...item, quantity: Math.min(item.quantity + 1, 20) }
            : item
        );
      }

      return [
        ...previous,
        {
          foodId: food.foodId,
          name: food.name,
          price: Number(food.price) || 0,
          emoji: food.emoji || "🍽️",
          quantity: 1,
        },
      ];
    });

    showNotice("success", `${food.name} added to your cart.`);
  }

  function changeQuantity(foodId, amount) {
    setCart((previous) =>
      previous
        .map((item) =>
          item.foodId === foodId
            ? {
                ...item,
                quantity: Math.max(
                  0,
                  Math.min(20, item.quantity + amount)
                ),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(foodId) {
    setCart((previous) =>
      previous.filter((item) => item.foodId !== foodId)
    );
  }

  function updateCustomer(event) {
    const { name, value } = event.target;

    setCustomer((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function placeOrder(event) {
    event.preventDefault();

    if (cart.length === 0) {
      showNotice("error", "Please add food items to your cart.");
      return;
    }

    const cleanCustomer = {
      name: customer.name.trim(),
      email: customer.email.trim(),
      phone: customer.phone.trim(),
      address: customer.address.trim(),
    };

    if (cleanCustomer.name.length < 2) {
      showNotice("error", "Name must contain at least 2 characters.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanCustomer.email)
    ) {
      showNotice("error", "Enter a valid email address.");
      return;
    }

    if (!/^\d{10}$/.test(cleanCustomer.phone)) {
      showNotice("error", "Enter a valid 10-digit phone number.");
      return;
    }

    if (cleanCustomer.address.length < 5) {
      showNotice("error", "Address must contain at least 5 characters.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const items = cart.map((item) => ({
        foodId: item.foodId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const data = await apiRequest(`${API_URL}/orders`, {
        method: "POST",
        body: JSON.stringify({
          ...cleanCustomer,
          customer: cleanCustomer,
          customerName: cleanCustomer.name,
          items,
          total: cartTotal,
        }),
      });

      const order = data.order || data;
      const newOrderId = getOrderId(order);

      if (!newOrderId) {
        throw new Error(
          "Order response did not contain an order ID. Check the backend response."
        );
      }

      setTrackingId(newOrderId);
      setTrackedOrder(order);
      setCart([]);
      setCustomer({
        name: "",
        email: "",
        phone: "",
        address: "",
      });
      setActiveTab("tracking");

      showNotice(
        "success",
        `Order placed successfully! Your order ID is ${newOrderId}.`
      );

      if (adminToken) {
        loadAdminOrders();
      }
    } catch (error) {
      showNotice("error", error.message || "Could not place your order.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function trackOrder(event) {
    event.preventDefault();

    const id = trackingId.trim();

    if (!id) {
      showNotice("error", "Please enter your order ID.");
      return;
    }

    setTrackingLoading(true);
    setTrackedOrder(null);

    try {
      const data = await apiRequest(
        `${API_URL}/orders/${encodeURIComponent(id)}`
      );

      const order = data.order || data;
      setTrackedOrder(order);
      showNotice("success", "Order details loaded successfully.");
    } catch (error) {
      showNotice("error", error.message || "Order not found.");
    } finally {
      setTrackingLoading(false);
    }
  }

  async function updateAdminOrderStatus(order, nextStatus) {
    const orderId = getOrderId(order);

    if (!orderId || !nextStatus || !adminToken) return;

    const expectedStatus = getNextStatus(order.status || "PLACED");

    if (nextStatus !== expectedStatus) {
      setAdminError(
        "Invalid DFA transition. Orders must follow the defined status sequence."
      );
      return;
    }

    setUpdatingOrderId(orderId);
    setAdminError("");

    try {
      await apiRequest(
        `${API_URL}/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      await loadAdminOrders();

      if (getOrderId(trackedOrder) === orderId) {
        try {
          const data = await apiRequest(
            `${API_URL}/orders/${encodeURIComponent(orderId)}`
          );
          setTrackedOrder(data.order || data);
        } catch (error) {
          console.error("Could not refresh tracking details:", error);
        }
      }

      showNotice("success", `Order updated to ${formatStatus(nextStatus)}.`);
    } catch (error) {
      setAdminError(error.message || "Could not update order status.");

      if (error.status === 401 || error.status === 403) {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        setAdminToken("");
        setAdminOrders([]);
      }
    } finally {
      setUpdatingOrderId("");
    }
  }

  const visibleFoods = foods.filter((food) => {
    const matchesCategory =
      category === "All" || food.category === category;

    const text = `${food.name} ${food.description} ${food.category}`.toLowerCase();
    const matchesSearch = text.includes(searchText.toLowerCase().trim());

    return matchesCategory && matchesSearch;
  });

  const placedCount = adminOrders.filter(
    (order) => order.status === "PLACED"
  ).length;

  const activeCount = adminOrders.filter(
    (order) =>
      order.status &&
      order.status !== "DELIVERED"
  ).length;

  const deliveredCount = adminOrders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  return (
    <div className="app-shell">
      <header className="site-header">
        <a
          className="brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            setActiveTab("menu");
          }}
        >
          <span className="brand-icon">
            <UtensilsCrossed size={23} />
          </span>
          <span>
            <strong>FoodFlow</strong>
            <small>Fresh food, fast delivery</small>
          </span>
        </a>

        <nav className="main-nav">
          <button
  className={`nav-link ${activeTab === "dfa" ? "active" : ""}`}
  onClick={() => setActiveTab("dfa")}
  type="button"
>
  DFA Diagram
</button>
          <button
            className={`nav-link ${activeTab === "menu" ? "active" : ""}`}
            onClick={() => setActiveTab("menu")}
            type="button"
          >
            Menu
          </button>

          <button
            className={`nav-link ${activeTab === "tracking" ? "active" : ""}`}
            onClick={() => setActiveTab("tracking")}
            type="button"
          >
            <MapPin size={16} />
            Track Order
          </button>

          <button
            className={`nav-link ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
            type="button"
          >
            <LayoutDashboard size={16} />
            Admin Dashboard
          </button>

          <button
            className="cart-nav"
            type="button"
            onClick={() => {
              setActiveTab("menu");
              document
                .getElementById("checkout")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <ShoppingCart size={18} />
            Cart
            <span className="cart-count">{cartCount}</span>
          </button>
        </nav>
      </header>

      {notice && (
        <div className={`notice ${notice.type}`} role="status">
          {notice.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{notice.message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={clearNotice}
          >
            <X size={17} />
          </button>
        </div>
      )}

      {activeTab === "menu" && (
        <>
          <section className="hero" id="home">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="eyebrow-dot" />
                Deliciousness delivered
              </span>

              <h1>
                Good food.
                <br />
                <span>Good mood.</span>
              </h1>

              <p>
                Discover your favourites, order in a few clicks, and follow
                every step of your delivery with FoodFlow.
              </p>

              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  document
                    .getElementById("menu")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore Menu <ArrowRight size={18} />
              </button>

              <div className="hero-highlights">
                <div>
                  <strong>6+</strong>
                  <span>Food choices</span>
                </div>
                <div>
                  <strong>Live</strong>
                  <span>Order tracking</span>
                </div>
                <div>
                  <strong>Secure</strong>
                  <span>Order records</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-orbit" />
              <div className="hero-food hero-food-main">🍕</div>
              <div className="hero-food hero-food-small food-burger">🍔</div>
              <div className="hero-food hero-food-small food-cake">🍰</div>

              <div className="floating-card">
                <span className="floating-card-icon">
                  <Truck size={19} />
                </span>
                <span>
                  <strong>Track every step</strong>
                  <small>From kitchen to doorstep</small>
                </span>
              </div>
            </div>
          </section>

          <section className="section-block" id="menu">
            <div className="section-heading">
              <div>
                <span className="section-kicker">MADE FRESH FOR YOU</span>
                <h2>Explore our menu</h2>
                <p>Find something delicious for every craving.</p>
              </div>

              <label className="search-box">
                <Search size={18} />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search food..."
                  aria-label="Search food"
                />
                {searchText && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchText("")}
                  >
                    <X size={16} />
                  </button>
                )}
              </label>
            </div>

            <div className="category-list">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`category-chip ${category === item ? "selected" : ""}`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {foodLoading && <p>Refreshing menu...</p>}

            <div className="food-grid">
              {visibleFoods.map((food) => (
                <article className="food-card" key={food.foodId}>
                  <div className="food-art">
                    <span className="food-emoji">{food.emoji}</span>
                    <span className="food-category">{food.category}</span>
                  </div>

                  <div className="food-info">
                    <div className="food-title-row">
                      <h3 className="food-title">{food.name}</h3>
                      <strong className="food-price">
                        {formatPrice(food.price)}
                      </strong>
                    </div>

                    <p>{food.description}</p>

                    <button
                      className="add-button"
                      type="button"
                      onClick={() => addToCart(food)}
                    >
                      <Plus size={17} /> Add to Cart
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {visibleFoods.length === 0 && (
              <div className="empty-state">
                <Search size={28} />
                <h3>No matching food found</h3>
                <p>Try a different search or category.</p>
              </div>
            )}
          </section>

          <section className="section-block checkout-layout" id="checkout">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">YOUR SELECTION</span>
                  <h2>Your cart</h2>
                </div>
                <div className="panel-icon">
                  <ShoppingCart size={21} />
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="cart-empty">
                  <span>🛒</span>
                  <h3>Your cart is waiting</h3>
                  <p>Add food from the menu to get started.</p>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      document
                        .getElementById("menu")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Browse menu <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map((item) => (
                      <div className="cart-item" key={item.foodId}>
                        <span className="cart-item-emoji">{item.emoji}</span>
                        <div className="cart-item-detail">
                          <strong>{item.name}</strong>
                          <span>{formatPrice(item.price)} each</span>
                          <div className="quantity-control">
                            <button
                              type="button"
                              aria-label={`Decrease ${item.name}`}
                              onClick={() => changeQuantity(item.foodId, -1)}
                            >
                              <Minus size={14} />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              aria-label={`Increase ${item.name}`}
                              disabled={item.quantity >= 20}
                              onClick={() => changeQuantity(item.foodId, 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="cart-item-actions">
                          <strong>
                            {formatPrice(item.price * item.quantity)}
                          </strong>
                          <button
                            className="remove-button"
                            type="button"
                            aria-label={`Remove ${item.name}`}
                            onClick={() => removeFromCart(item.foodId)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cart-total">
                    <span>Total</span>
                    <strong>{formatPrice(cartTotal)}</strong>
                  </div>
                </>
              )}
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">DELIVERY DETAILS</span>
                  <h2>Checkout</h2>
                  <p>Enter your details to place an order.</p>
                </div>
                <div className="panel-icon">
                  <MapPin size={21} />
                </div>
              </div>

              <form className="form-grid" onSubmit={placeOrder}>
                <label className="form-field">
                  <span>Full Name</span>
                  <input
                    name="name"
                    value={customer.name}
                    onChange={updateCustomer}
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Your name"
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Email Address</span>
                  <input
                    name="email"
                    type="email"
                    value={customer.email}
                    onChange={updateCustomer}
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Phone Number</span>
                  <input
                    name="phone"
                    type="tel"
                    value={customer.phone}
                    onChange={updateCustomer}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    autoComplete="tel"
                    placeholder="10-digit phone number"
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Delivery Address</span>
                  <textarea
                    name="address"
                    value={customer.address}
                    onChange={updateCustomer}
                    minLength={5}
                    maxLength={500}
                    autoComplete="street-address"
                    placeholder="Enter your full delivery address"
                    rows={3}
                    required
                  />
                </label>

                <div className="checkout-summary">
                  <span>
                    {cartCount} item{cartCount !== 1 ? "s" : ""}
                  </span>
                  <strong>{formatPrice(cartTotal)}</strong>
                </div>

                <button
                  className="primary-button place-order-button"
                  type="submit"
                  disabled={checkoutLoading || cart.length === 0}
                >
                  {checkoutLoading ? (
                    <>
                      <RefreshCw size={17} className="spin" />
                      Placing order...
                    </>
                  ) : (
                    <>
                      Place Order <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="secure-note">
                  <LockKeyhole size={15} />
                  Your order is saved to the database.
                </p>
              </form>
            </div>
          </section>
        </>
      )}

      {activeTab === "tracking" && (
        <section className="section-block tracking-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">YOUR ORDER, YOUR WAY</span>
              <h2>Track your order</h2>
              <p>Enter your order ID to check the latest delivery status.</p>
            </div>
          </div>

          <div className="panel">
            <form className="tracking-form" onSubmit={trackOrder}>
              <label className="form-field">
                <span>Order ID</span>
                <input
                  value={trackingId}
                  onChange={(event) => setTrackingId(event.target.value)}
                  placeholder="Example: ORD-..."
                  required
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={trackingLoading}
              >
                {trackingLoading ? "Searching..." : "Track Order"}
                <ArrowRight size={17} />
              </button>
            </form>

            {trackedOrder && (
              <div className="tracking-result">
                <div className="tracking-result-heading">
                  <div>
                    <span className="section-kicker">ORDER DETAILS</span>
                    <h3>{getOrderId(trackedOrder)}</h3>
                    <p>Placed {formatDate(trackedOrder.createdAt)}</p>
                  </div>

                  <span className="status-pill">
                    {formatStatus(trackedOrder.status)}
                  </span>
                </div>

                <div className="tracking-progress">
                  {STATUS_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const currentIndex = getStatusIndex(
                      trackedOrder.status || "PLACED"
                    );
                    const done = currentIndex >= index;

                    return (
                      <div
                        className={`progress-step ${done ? "done" : ""}`}
                        key={step.value}
                      >
                        <span className="progress-icon">
                          <Icon size={19} />
                        </span>
                        <strong>{step.label}</strong>
                      </div>
                    );
                  })}
                </div>

                <div className="tracking-order-info">
                  <div>
                    <span>Customer</span>
                    <strong>{getCustomerName(trackedOrder)}</strong>
                  </div>
                  <div>
                    <span>Total amount</span>
                    <strong>{formatPrice(getOrderTotal(trackedOrder))}</strong>
                  </div>
                  <div>
                    <span>Delivery address</span>
                    <strong>{getCustomer(trackedOrder).address || "Not provided"}</strong>
                  </div>
                </div>

                <div className="tracking-items">
                  <h4>Items in this order</h4>
                  {getOrderItems(trackedOrder).map((item, index) => (
                    <div className="tracking-item" key={item.foodId || index}>
                      <span>{getItemName(item)}</span>
                      <span>
                        {getItemQuantity(item)} × {formatPrice(getItemPrice(item))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="dfa-note">
            <span className="dfa-note-icon">
              <CheckCircle2 size={21} />
            </span>
            <div>
              <strong>DFA-based delivery validation</strong>
              <p>
                Orders progress through PLACED → PREPARING → READY FOR PICKUP
                → OUT FOR DELIVERY → DELIVERED. Invalid transitions are
                rejected by the backend.
              </p>
            </div>
          </div>
        </section>
      )}

      {activeTab === "admin" && (
        <section className="section-block admin-section">
          {!adminToken ? (
            <div className="panel admin-login-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">RESTRICTED ACCESS</span>
                  <h2>Admin Login</h2>
                  <p>Sign in to view and manage placed orders.</p>
                </div>
                <div className="panel-icon">
                  <LockKeyhole size={22} />
                </div>
              </div>

              <form className="form-grid" onSubmit={loginAdmin}>
                <label className="form-field">
                  <span>Admin Username</span>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(event) => setAdminUsername(event.target.value)}
                    autoComplete="username"
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Admin Password</span>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>

                {adminError && (
                  <p className="notice error" role="alert">
                    <AlertCircle size={17} /> {adminError}
                  </p>
                )}

                <button
                  className="primary-button place-order-button"
                  type="submit"
                  disabled={adminLoginLoading}
                >
                  {adminLoginLoading ? "Signing in..." : "Login as Admin"}
                  <ArrowRight size={17} />
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="section-heading">
                <div>
                  <span className="section-kicker">FOODFLOW MANAGEMENT</span>
                  <h2>Admin Dashboard</h2>
                  <p>Review orders and advance them through the DFA states.</p>
                </div>

                <div className="admin-header-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={loadAdminOrders}
                    disabled={adminLoading}
                  >
                    <RefreshCw
                      size={17}
                      className={adminLoading ? "spin" : ""}
                    />
                    Refresh
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={logoutAdmin}
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              </div>

              {adminError && (
                <div className="notice error" role="alert">
                  <AlertCircle size={18} />
                  <span>{adminError}</span>
                </div>
              )}

              <div className="admin-stats">
                <div className="stat-card">
                  <span className="stat-icon">
                    <ClipboardList size={22} />
                  </span>
                  <div>
                    <span>Total Orders</span>
                    <strong>{adminOrders.length}</strong>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">
                    <Clock3 size={22} />
                  </span>
                  <div>
                    <span>New Orders</span>
                    <strong>{placedCount}</strong>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">
                    <Truck size={22} />
                  </span>
                  <div>
                    <span>In Progress</span>
                    <strong>{activeCount}</strong>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">
                    <CheckCircle2 size={22} />
                  </span>
                  <div>
                    <span>Delivered</span>
                    <strong>{deliveredCount}</strong>
                  </div>
                </div>
              </div>

              <div className="admin-orders-heading">
                <div>
                  <h3>Placed Orders</h3>
                  <p>Orders are retrieved from MongoDB.</p>
                </div>
                <span>{adminOrders.length} total</span>
              </div>

              {adminLoading && adminOrders.length === 0 ? (
                <div className="empty-state">
                  <RefreshCw size={25} className="spin" />
                  <h3>Loading orders...</h3>
                </div>
              ) : adminOrders.length === 0 ? (
                <div className="empty-state">
                  <ClipboardList size={30} />
                  <h3>No orders found</h3>
                  <p>
                    Once a customer places an order, it should appear here.
                    Refresh to check again.
                  </p>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={loadAdminOrders}
                  >
                    <RefreshCw size={16} /> Refresh Orders
                  </button>
                </div>
              ) : (
                <div className="admin-orders-list">
                  {adminOrders.map((order) => {
                    const orderId = getOrderId(order);
                    const status = order.status || "PLACED";
                    const nextStatus = getNextStatus(status);
                    const isUpdating = updatingOrderId === orderId;

                    return (
                      <article
                        className="admin-order-card"
                        key={orderId || order._id}
                      >
                        <div className="admin-card-top">
                          <span className="admin-order-icon">
                            <ClipboardList size={21} />
                          </span>

                          <div className="admin-order-title">
                            <h3>{orderId || "Order"}</h3>
                            <p>{formatDate(order.createdAt)}</p>
                          </div>

                          <span className="status-pill">
                            {formatStatus(status)}
                          </span>
                        </div>

                        <div className="admin-order-details">
                          <div>
                            <span>Customer</span>
                            <strong>{getCustomerName(order)}</strong>
                          </div>
                          <div>
                            <span>Phone</span>
                            <strong>{getCustomer(order).phone || "—"}</strong>
                          </div>
                          <div>
                            <span>Total</span>
                            <strong>{formatPrice(getOrderTotal(order))}</strong>
                          </div>
                          <div>
                            <span>Address</span>
                            <strong>{getCustomer(order).address || "—"}</strong>
                          </div>
                        </div>

                        <div className="admin-items-detail">
                          <strong>Order items</strong>
                          {getOrderItems(order).map((item, index) => (
                            <div key={item.foodId || index}>
                              <span>
                                {getItemName(item)} × {getItemQuantity(item)}
                              </span>
                              <span>
                                {formatPrice(
                                  getItemPrice(item) * getItemQuantity(item)
                                )}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="admin-mini-progress">
                          {STATUS_STEPS.map((step, index) => {
                            const done = getStatusIndex(status) >= index;

                            return (
                              <span
                                className={`mini-step ${done ? "done" : ""}`}
                                key={step.value}
                                title={step.label}
                              >
                                {done ? <CheckCircle2 size={15} /> : index + 1}
                                <small>{step.label}</small>
                              </span>
                            );
                          })}
                        </div>

                        <div className="admin-card-footer">
                          {nextStatus ? (
                            <>
                              <span className="next-status-label">
                                Next: {formatStatus(nextStatus)}
                              </span>
                              <button
                                className="primary-button"
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateAdminOrderStatus(order, nextStatus)
                                }
                              >
                                {isUpdating ? (
                                  <>
                                    <RefreshCw size={16} className="spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    Advance Status <ArrowRight size={16} />
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="delivered-label">
                              <CheckCircle2 size={17} />
                              Order delivered
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="dfa-note">
                <span className="dfa-note-icon">
                  <CheckCircle2 size={21} />
                </span>
                <div>
                  <strong>Finite Automaton transition rules</strong>
                  <p>
                    PLACED → PREPARING → READY FOR PICKUP → OUT FOR DELIVERY
                    → DELIVERED. Each update is sent to the backend, which
                    must validate and persist the transition.
                  </p>
                </div>
              </div>
            </>
          )}
        </section>
      )}
      {activeTab === "dfa" && (
  <section className="section-block">
    <DFAPage />
  </section>
)}
      <footer className="site-footer">
        <div className="footer-brand">
          <UtensilsCrossed size={19} />
          <strong>FoodFlow</strong>
        </div>
        <p>Fresh food, simple ordering, reliable tracking.</p>
        <span>Online Food Ordering &amp; Delivery Tracking System</span>
      </footer>
    </div>
  );
}

export default App;
