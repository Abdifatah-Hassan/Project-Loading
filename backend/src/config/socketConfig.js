import { Server as SocketIOServer } from 'socket.io';
import GameBoard from '../models/gameBoard.js';
import User from '../models/user.js';

let io;  // Declare io at the module level

// Section: Setup Socket
/**
 * Function to setup Socket.IO server
 * @param {Object} server - The HTTP server object
 * @returns {Object} - The initialized Socket.IO server instance
 */
function setupSocket(server) {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Section: Connection Event
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Section: Join GameBoard Event
        /**
         * Event for a user to join a gameBoard
         * @param {Object} data - The data object containing pinCode and username
         */
        socket.on('joinGameBoard', async ({ pinCode, username }) => {
            try {
                const gameBoard = await GameBoard.findOne({ pinCode }).populate('players');
                if (!gameBoard) {
                    socket.emit('error', { message: 'Invalid pin code' });
                    return;
                }

                // Check if username is unique within the gameBoard
                const existingUser = gameBoard.players.find(player => player.username === username);
                if (existingUser) {
                    socket.emit('error', { message: 'Username already taken' });
                    return;
                }

                // Create new user
                const newUser = new User({ username });
                await newUser.save();

                // Add user to gameBoard
                gameBoard.players.push(newUser._id);
                await gameBoard.save();

                socket.join(gameBoard._id.toString());
                socket.emit('joinedGameBoard', { gameBoardId: gameBoard._id, userId: newUser._id });

                io.to(gameBoard._id.toString()).emit('newPlayer', { message: `New player joined: ${username}` });
            } catch (error) {
                socket.emit('error', { message: 'Error joining gameBoard' });
            }
        });

        // Section: Leave GameBoard Event
        /**
         * Event for a user to leave a gameBoard
         * @param {Object} data - The data object containing gameBoardId and userId
         */
        socket.on('leaveGameBoard', async ({ gameBoardId, userId }) => {
            try {
                const gameBoard = await GameBoard.findById(gameBoardId);
                if (!gameBoard) {
                    socket.emit('error', { message: 'GameBoard not found' });
                    return;
                }

                const userIndex = gameBoard.players.indexOf(userId);
                if (userIndex !== -1) {
                    gameBoard.players.splice(userIndex, 1);
                    await gameBoard.save();
                    await User.findByIdAndDelete(userId);

                    socket.leave(gameBoardId);
                    socket.emit('leftGameBoard', { message: 'User left the gameBoard' });

                    io.to(gameBoardId).emit('playerLeft', { message: `Player left: ${userId}` });
                } else {
                    socket.emit('error', { message: 'User not found in GameBoard' });
                }
            } catch (error) {
                socket.emit('error', { message: 'Error leaving gameBoard' });
            }
        });

        // Section: Disconnect Event
        /**
         * Event when a user disconnects
         */
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });

        // Section: Additional Real-Time Events
        /**
         * Event to handle real-time actions
         * @param {Object} data - The data object containing the action information
         */
        socket.on('sendAction', (data) => {
            console.log('Action received:', data);
            socket.broadcast.emit('actionReceived', data);
        });
    });

    return io;
}

// Export the io and setupSocket function
export { io, setupSocket };