const express = require("express");
const router = express.Router();
const { getDashboard, getStats } = require("../controllers/dashboard_controller");
const { requireAuth } = require("../middleware/auth_middleware");
const { getUnreadCount } = require("../controllers/message_controller");

router.get("/",       requireAuth, getDashboard);
router.get("/stats",  getStats);
router.get("/unread", requireAuth, getUnreadCount);

module.exports = router;
