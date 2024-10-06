import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let clients = [];

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the frontend directory
const __dirname = path.resolve(); // Get the current directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Connect to MongoDB (replace with your connection string)
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB', err));

// Define User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(400).json({ error: 'Error registering user' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Logged in successfully' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Add the new client to the clients array
    clients.push(socket);

    // Handle user finding a partner
    socket.on('findPartner', () => {
        // Pair with another user if available
        const partner = clients.find(client => client.id !== socket.id);
        if (partner) {
            socket.emit('partnerFound', partner.id);
            partner.emit('partnerFound', socket.id);
        } else {
            socket.emit('noPartnerAvailable');
        }
    });

    // Handle signaling
    socket.on('signal', (data) => {
        const partnerSocket = clients.find(client => client.id === data.partnerId);
        if (partnerSocket) {
            partnerSocket.emit('signal', {
                signal: data.signal,
                from: socket.id
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        clients = clients.filter(client => client.id !== socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
