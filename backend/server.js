import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import apiRoutes from './routes/apiRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
    try {
        // Try to connect to local DB with 2s timeout
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
        console.log('Connected to Local MongoDB');
    } catch (err) {
        console.log('Local MongoDB not found. Spinning up in-memory fallback...');
        const mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log('Connected to In-Memory MongoDB');
    }
};

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(console.error);

// Trigger restart
