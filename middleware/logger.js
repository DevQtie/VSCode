// // middleware
// const logger = (req, res, next) => {
//     console.log(`${req.method} ${req.url}`);
//     next(); // Call next() to pass control to the next middleware function
// };

// export default logger;

// middleware
const asyncLogger = async (req, res, next) => {
    try {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`${req.method} ${req.url}`);
        next();
    } catch (err) {
        next(err);
    }
};

export default asyncLogger;