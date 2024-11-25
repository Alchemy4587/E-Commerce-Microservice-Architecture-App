const express = require("express");
const mongoose = require("mongoose");

// const User = require("./User");
const app = express();
const PORT = process.env.PORT_ONE || 8080;
const jwt = require("jsonwebtoken");
const amqp = require("amqplib");
const Product = require("./Product");
const isAuthenticated = require("../isAuthenticated");
 
var channel, connection;

// Middleware
app.use(express.json());

// Root Route
app.get("/", (req, res) => {
    res.send("Welcome to the Product Service!");
});

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost/product-service", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Product-Service DB Connected");
    } catch (error) {
        console.error("Error connecting to database:", error.message);
        process.exit(1); // Exit the process with a failure code
    }
};

connectDB(); 

async function connect() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT");
}
connect();

// Create a new product
app.post("/product/create", isAuthenticated, async (req, res) => {
    const { name, description, price } = req.body;
    const newProduct = new Product({
        name,
        description,
        price,
    });
    newProduct.save();
    return res.json(newProduct);
});
//User sends a list of product ID'sto buy
//Creating an order with those products and a total value of sum of product's prices
app.post("/product/buy", isAuthenticated, async (req, res) => {
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids } });
    channel.sendToQueue(
        "ORDER",
        Buffer.from(
            JSON.stringify({
                products,
                userEmail: req.user.email,
            })
        )
    );
    channel.consume("PRODUCT", (data) => {
        order = JSON.parse(data.content);
    });
    return res.json(order);
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Product Service Running at ${PORT}`);
});
