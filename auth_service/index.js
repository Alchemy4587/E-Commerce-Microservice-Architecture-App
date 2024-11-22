const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("./User");
const app = express();
const PORT = process.env.PORT_ONE || 7070;
const jwt = require("jsonwebtoken");

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost/auth-service", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Auth-Service DB Connected");
    } catch (error) {
        console.error("Error connecting to database:", error.message);
        process.exit(1); // Exit the process with a failure code
    }
};

connectDB(); // Call the async function to connect to MongoDB

// Middleware
app.use(express.json());

// Start the Server
app.listen(PORT, () => {
    console.log(`Auth Service Running at ${PORT}`);
});

//Login Route
app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.json({ message: "User doesn't exist" });
    } else {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.json({ message: "Password Incorrect" });
        }
        const payload = {
            email,
            name: user.name,
        };
        // jwt.sign(payload, "secret", { expiresIn: "1h" }, (err, token) => {
        //     if (err) {
        //         console.error(err);
        //         return res.status(500).json({ message: "Token generation failed" });
        //     }
        //     return res.json({ token: token });
        // });
        jwt.sign(payload, process.env.JWT_SECRET || "default_secret", { expiresIn: "1h" }, (err, token) => {
            if (err) {
                console.error("Error generating token:", err);
                return res.status(500).json({ message: "Token generation failed" });
            }
            console.log("Generated token:", token); // Debugging
            return res.json({ token: token });
        });
        
    }
});


// Register Route

app.post("/auth/register", async (req, res) => {
    const { email, password, name } = req.body;

    try {
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = new User({
            email,
            name,
            password: hashedPassword,
        });
        await newUser.save();

        // Generate a JWT token
        const payload = {
            email: newUser.email,
            name: newUser.name,
            id: newUser._id,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || "default_secret", { expiresIn: "1h" });

        // Respond with the user data (excluding password) and token
        return res.status(201).json({
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                created_at: newUser.created_at,
            },
            token,
        });
    } catch (err) {
        console.error("Error during registration:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

