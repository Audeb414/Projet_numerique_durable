const express = require("express");
const router  = express.Router();
const {
  getAdminStats,
  getUsers, changeRole, deleteUser,
  getRepairs, changeStatut, deleteRepair,
} = require("../controllers/admin_controller");
const { requireAuth, requireAdmin } = require("../middleware/auth_middleware");

// Toutes les routes admin nécessitent d'être connecté ET admin
router.use(requireAuth, requireAdmin);

router.get("/stats",              getAdminStats);
router.get("/users",              getUsers);
router.put("/users/:id/role",     changeRole);
router.delete("/users/:id",       deleteUser);
router.get("/repairs",            getRepairs);
router.put("/repairs/:id/statut", changeStatut);
router.delete("/repairs/:id",     deleteRepair);

module.exports = router;
