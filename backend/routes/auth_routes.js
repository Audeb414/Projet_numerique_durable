const express = require("express");
const router = express.Router();
const { register, login, me, logout } = require("../controllers/auth_controllers");

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me
router.get("/me", me);

// POST /api/auth/logout
router.post("/logout", logout);

module.exports = router;
