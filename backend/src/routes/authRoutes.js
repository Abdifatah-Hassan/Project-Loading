import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import GameBoard from '../models/gameBoard.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and user management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - pinCode
 *             properties:
 *               username:
 *                 type: string
 *               pinCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid pin code or username already taken
 *       500:
 *         description: Error registering user
 */
router.post('/register', async (req, res) => {
  console.log('Register request body:', req.body);
  const { username, pinCode } = req.body;

  if (!username || !pinCode) {
    return res.status(400).json({ message: 'Username and pin code are required' });
  }

  try {
    const gameBoard = await GameBoard.findOne({ pinCode });
    if (!gameBoard) {
      return res.status(400).json({ message: 'Invalid pin code' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const newUser = new User({ username });
    await newUser.save();

    gameBoard.players.push(newUser._id);
    await gameBoard.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', user: newUser, token });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user', error });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - pinCode
 *             properties:
 *               username:
 *                 type: string
 *               pinCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid pin code
 *       500:
 *         description: Error logging in
 */
router.post('/login', async (req, res) => {
  const { username, pinCode } = req.body;

  try {
    const gameBoard = await GameBoard.findOne({ pinCode });
    if (!gameBoard) {
      return res.status(400).json({ message: 'Invalid pin code' });
    }

    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or pin code' });
    }

    // Ensure the user is part of the gameBoard
    if (!gameBoard.players.includes(user._id)) {
      return res.status(400).json({ message: 'User not found in this gameboard' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token, user });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     summary: Login an admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin login successful
 *       401:
 *         description: Invalid admin credentials
 *       500:
 *         description: Server error
 */
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    try {
      let user = await User.findOne({ username });
      if (!user) {
        user = new User({ username, role: 'admin' });
        await user.save();
      }
      
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.status(200).json({ message: 'Admin login successful', token });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  } else {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout a user or admin
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Server error
 */
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Server error', err });
    }
    res.status(200).json({ message: 'Logout successful' });
  });
});

export default router;
