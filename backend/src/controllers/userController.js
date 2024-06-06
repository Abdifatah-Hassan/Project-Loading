import User from '../models/user.js';
import GameBoard from '../models/gameBoard.js';
import { io } from '../config/socketConfig.js';

// Section: Fetch User Data
/**
 * Fetch user data by ID
 * @route GET /users/:userId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving user data', error });
    }
};

// Section: Update User Score
/**
 * Update user score
 * @route PUT /users/:userId/score
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateUserScore = async (req, res) => {
    try {
        const { score } = req.body;
        const user = await User.findByIdAndUpdate(req.params.userId, { score }, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user score', error });
    }
};

// Section: Remove Inactive User
/**
 * Remove inactive user
 * @route DELETE /users/:userId/gameboards/:gameBoardId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const removeInactiveUser = async (req, res) => {
    try {
        const { userId, gameBoardId } = req.params;
        const gameBoard = await GameBoard.findById(gameBoardId);
        if (!gameBoard) {
            return res.status(404).json({ message: 'GameBoard not found' });
        }

        const userIndex = gameBoard.players.indexOf(userId);
        if (userIndex !== -1) {
            gameBoard.players.splice(userIndex, 1);
            await gameBoard.save();
            await User.findByIdAndDelete(userId);
            res.json({ message: 'Inactive user removed' });
            // Emit event to notify clients about user removal
            io.to(gameBoardId).emit('userRemoved', { userId });
        } else {
            res.status(404).json({ message: 'User not found in GameBoard' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error removing inactive user', error });
    }
};

// Section: username filtering 
/**
 * Filtering and blacklisting usernames
 * @route POST /users/:userId/gameboards/:gameBoardId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const filterUsername = async (req, res, next) => {
    try {
        const { username } = req.body;
        const blacklisted = await Blacklist.findOne({ username });
        if (blacklisted) {
            return res.status(400).json({ message: 'Username is not allowed' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking username', error });
    }
};
