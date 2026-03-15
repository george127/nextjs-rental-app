// import express from "express";
// import cors from "cors";
// import registerRoute from "./routes/register.ts";
// import loginRoute from "./routes/login.ts";
// import logoutRoute from "./routes/logout.ts";
// import propertyRoutes from "./routes/propertyRoute.ts";
// import publicPropertiesRoute from "./routes/publicProperties.ts";
// import propertyByIdRoute from "./routes/propertyById.ts";
// import propertyApplyRoute from "./routes/propertyApply.ts";
// import applicationRoutes from "./routes/applicationRoute.ts";
// import managerApplicationRoutes from "./routes/managerApplicationRoutes.ts";
// import TenantPropertyRoute from "./routes/TenantPropertyRoute.ts";



// const app = express();

// app.use(cors({
//   origin: "http://localhost:3000",
//   credentials: true
// }));

// app.use(express.json({
//   limit: "50mb"
// }));

// app.use(express.urlencoded({
//   limit: "50mb",
//   extended: true
// }));

// // Authenticated routes
// app.use("/api/register", registerRoute);
// app.use("/api/login", loginRoute);
// app.use("/api/logout", logoutRoute);

// // Property management routes
// app.use("/api/properties", propertyRoutes);
// // Public property listing route
// app.use("/api/properties/public", publicPropertiesRoute);
// // Get property by ID route
// app.use("/api/properties", propertyByIdRoute);
// // Property application route
// app.use("/api/apply", propertyApplyRoute);
// // Application management routes
// app.use("/api/manager/applications", applicationRoutes);
// app.use("/api/manager/applications", managerApplicationRoutes);

// // Tenant-specific property route
// app.use("/api/tenant/property", TenantPropertyRoute);



// app.listen(5000, () => {
//   console.log("Server running on http://localhost:5000");
// });


import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import routes
import registerRoute from "./routes/register.ts";
import loginRoute from "./routes/login.ts";
import logoutRoute from "./routes/logout.ts";
import propertyRoutes from "./routes/propertyRoute.ts";  
import publicPropertiesRoute from "./routes/publicProperties.ts";
import propertyByIdRoute from "./routes/propertyById.ts";
import propertyApplyRoute from "./routes/propertyApply.ts";
import applicationRoutes from "./routes/applicationRoute.ts";
import managerApplicationRoutes from "./routes/managerApplicationRoutes.ts";
import TenantPropertyRoute from "./routes/TenantPropertyRoute.ts";

dotenv.config();

const app = express();

// CORS setup
const allowedOrigins: (string | boolean | RegExp)[] = [
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, 
  })
);

app.get("/", (req, res) => {
  res.send("Welcome to the Rental App API");
});

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Auth routes
app.use("/api/register", registerRoute);
app.use("/api/login", loginRoute);
app.use("/api/logout", logoutRoute);

// Property management
app.use("/api/properties", propertyRoutes);
app.use("/api/properties/public", publicPropertiesRoute);
app.use("/api/properties", propertyByIdRoute);
app.use("/api/apply", propertyApplyRoute);

// Application routes
app.use("/api/manager/applications", applicationRoutes);
app.use("/api/manager/applications", managerApplicationRoutes);

// Tenant-specific routes
app.use("/api/tenant/property", TenantPropertyRoute);

// PORT
const PORT = Number(process.env.PORT) || 5000;

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});