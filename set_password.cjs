const { connectDB, User } = require('./backend/db.cjs');
// const bcrypt = require('bcryptjs'); // Removed
require('dotenv').config();

const setPassword = async (username, plainPassword) => {
    try {
        await connectDB();
        const user = await User.findOne({ username });
        
        // Simple Base64 encoding as requested (NOT SECURE for production, but shorter string)
        const encodedPassword = Buffer.from(plainPassword).toString('base64');
        
        if (!user) {
            console.log(`User '${username}' not found. Creating...`);
            await User.create({ 
                username, 
                email: `${username}@example.com`,
                password: encodedPassword
            });
            console.log(`User '${username}' created with encoded password (Base64).`);
            return;
        }

        user.password = encodedPassword;
        await user.save();
        console.log(`Password for '${username}' updated successfully (Base64).`);
    } catch (error) {
        console.error("Error setting password:", error);
    } finally {
        process.exit();
    }
};

// Default logic if run directly
setPassword('admin', 'Admin@123');
