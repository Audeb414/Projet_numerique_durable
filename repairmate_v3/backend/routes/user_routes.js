const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/users_controllers");
const { getNotationsUser } = require("../controllers/notation_controller");
const { requireAuth, requireAdmin } = require("../middleware/auth_middleware");

router.get("/",          requireAuth, requireAdmin, getAllUsers);
router.get("/:id",       getUserById);
router.put("/:id",       requireAuth, updateUser);
router.delete("/:id",    requireAuth, deleteUser);
router.get("/:id/notations", getNotationsUser);

module.exports = router;
