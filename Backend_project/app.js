import express from "express"
import cors from "cors"
import ConnectDB from "./dbConnect.js"
import dotenv from "dotenv"
import AuthRoutes from "./routes/AuthRoutes.js";

dotenv.config();

const app = express();
ConnectDB();
app.use (cors())
app.use (express.json())

//Regisrer Routes

//1.Auth Route
app.use('/api/auth', AuthRoutes);


export default app;