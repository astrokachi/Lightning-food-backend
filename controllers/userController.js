/* eslint-disable camelcase */
const bcrypt = require('bcrypt'); // import bcrypt to hash password
const User = require('../models/user.model'); //import user model
const { createCustomError } = require('../errors/custom-errors');
const Invite = require('../models/organisation_invite.model');

async function getMe(req, res) {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });

    res.status(200).json({
      success: true,
      message: 'User found',
      data: {
        user: user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      data: null,
    });
  }
}

async function getUserById(req, res) {
  try {
    const userId = req.params.id;
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      throw createCustomError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'User found',
      data: {
        user: user,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Controllers Function to register new user
async function createUser(req, res) {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      password,
      is_admin,
      profile_pic,
      org_id,
      launch_credit_balance,
      refresh_token,
      bank_code,
      bank_name,
      bank_number,
      token,
    } = req.body;

    // Validate input data

    if (!first_name || !last_name || !email || !password || !token) {
      // TODO: truly validate data
      throw createCustomError('Missing required fields', 400);
    }

    // Check if the token is valid and retrieve org_id
    const invite = await Invite.findOne({ where: { token } });

    if (!invite || new Date() > invite.ttl) {
      throw createCustomError('Invalid or expired invitation token', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      first_name,
      last_name,
      email,
      phone,
      password_hash: hashedPassword,
      is_admin,
      profile_pic,
      org_id,
      launch_credit_balance,
      refresh_token,
      bank_code,
      bank_name,
      bank_number,
    };

    const newUser = await User.create(user);
    delete newUser.password_hash;

    const userWithoutPassword = Object.assign(newUser.toJSON);
    delete userWithoutPassword.password_hash;
    console.log(userWithoutPassword);

    return res.status(200).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('error', error.errors[0].message); // Logging the error for debugging purposes

    if (error.name === 'SequelizeUniqueConstraintError') {
      // Unique constraint violation (duplicate email)
      let errorMessage = error.errors[0].message;
      errorMessage = errorMessage[0].toUpperCase() + errorMessage.slice(1);
      next(createCustomError(errorMessage, 400));
    }
    next(error.message);
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await User.findAll({
      where: { org_id: req.user.org_id },
    });

    res.status(200).json({
      success: true,
      message: 'List of all users',
      data: {
        users: users,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      data: null,
    });
  }
}
async function deleteUser(req, res) {
  try {
    const userId = req.params.id;

    // Check if the user exists
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    // Delete the user
    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      data: null,
    });
  }
}

async function updateUser(req, res) {
  try {
    const userId = req.params.id;
    const {
      first_name,
      last_name,
      email,
      profile_pic,
      bank_name,
      bank_code,
      bank_number,
    } = req.body;

    // Check if the user exists
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    // Update user's information
    user.first_name = first_name || user.first_name;
    user.last_name = last_name || user.last_name;
    user.email = email || user.email;
    user.profile_pic = profile_pic || user.profile_pic;
    user.bank_name = bank_name || user.bank_name;
    user.bank_code = bank_code || user.bank_code;
    user.bank_number = bank_number || user.bank_number;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      data: null,
    });
  }
}

module.exports = {
  getMe,
  getUserById,
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
};
