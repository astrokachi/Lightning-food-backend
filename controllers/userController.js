const User = require('../models/user.model'); //import user model

// Controller function to get user/staff details by UUID
async function getUserById(req, res) {
  try {
    const userId = req.params.id;
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

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

module.exports = {
  getUserById,
};
