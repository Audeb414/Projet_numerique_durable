const express = require("express");
const session = require("express-session");
const cors    = require("cors");
const path    = require("path");
const db      = require("./db");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "repairmate_secret_key_change_in_prod",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
}));

app.use(express.static(path.join(__dirname, "..", "frontend", "public")));

app.use("/api/auth",      require("./routes/auth_routes"));
app.use("/api/users",     require("./routes/user_routes"));
app.use("/api/repairs",   require("./routes/repair_routes"));
app.use("/api/admin",    require("./routes/admin_routes"));
app.use("/api/dashboard", require("./routes/dashboard_routes"));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "public", "index.html"));
});

db.init().then(() => {
  app.listen(PORT, () => {
    console.log("RepairMate demarre sur http://localhost:" + PORT);
  });
}).catch(err => {
  console.error("Erreur init DB:", err);
  process.exit(1);
});
