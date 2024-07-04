import express from 'express';
import routes from './routes/index.js';

const app = express();
const port = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(express.json());

// Load routes
app.use('/', routes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;
