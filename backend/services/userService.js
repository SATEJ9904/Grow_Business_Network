/**
 * User Service
 * Handles business logic for user operations
 */

const User = require('../models/User');
const Chapter = require('../models/Chapter');

/**
 * Find user by username
 * @param {string} username - Username
 * @returns {Promise<Object>} User document
 */
const findUserByUsername = async (username) => {
  return await User.findOne({ username: username.toLowerCase() });
};

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object>} User document
 */
const findUserByEmail = async (email) => {
  return await User.findOne({ email: email.toLowerCase() });
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user document
 */
const createUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Verify chapter exists
    const chapter = await Chapter.findById(userData.chapterId);
    if (!chapter) {
      throw new Error('Invalid chapter selected');
    }

    // Create new user
    const newUser = new User({
      ...userData,
      email: userData.email.toLowerCase(),
      isEmailVerified: true, // Set to true after OTP verification
    });

    await newUser.save();

    // Update chapter statistics
    await Chapter.findByIdAndUpdate(
      userData.chapterId,
      {
        $inc: {
          totalMembers: 1,
          pendingMembers: 1,
        },
      },
      { new: true }
    );

    return newUser.toJSON();
  } catch (error) {
    throw new Error(`User creation failed: ${error.message}`);
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user document
 */
const updateUserProfile = async (
  userId,
  updateData,
) => {

  const updatedUser =
    await User.findByIdAndUpdate(
      userId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

  return updatedUser;
};

/**
 * Get user by ID with populated chapter
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User document with chapter info
 */
const getUserById = async (userId) => {
  try {
    return await User.findById(userId).populate('chapterId');
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

/**
 * Get all members with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} filters - Filter conditions
 * @returns {Promise<Object>} Paginated members list
 */
const getAllMembers = async (page = 1, limit = 10, filters = {}) => {
  try {
    const skip = (page - 1) * limit;

    const query = { role: 'member', ...filters };
    
    console.log('🔍 Database query:', JSON.stringify(query));

    const members = await User.find(query)
      .populate('chapterId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);
    
    console.log(`✅ Query returned ${members.length} members out of ${total} total`);

    return {
      data: members.map((member) => member.toJSON()),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('❌ Error in getAllMembers:', error.message);
    throw new Error(`Failed to fetch members: ${error.message}`);
  }
};

/**
 * Approve user account
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
const approveUser = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'approved' },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Update chapter statistics
    await Chapter.findByIdAndUpdate(
      user.chapterId,
      {
        $inc: {
          pendingMembers: -1,
          approvedMembers: 1,
        },
      },
      { new: true }
    );

    return user.toJSON();
  } catch (error) {
    throw new Error(`User approval failed: ${error.message}`);
  }
};

/**
 * Reject user account
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
const rejectUser = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'rejected' },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Update chapter statistics
    await Chapter.findByIdAndUpdate(
      user.chapterId,
      {
        $inc: {
          pendingMembers: -1,
        },
      },
      { new: true }
    );

    return user.toJSON();
  } catch (error) {
    throw new Error(`User rejection failed: ${error.message}`);
  }
};

/**
 * Move a member to a different chapter, keeping both the old and new
 * chapter's member-count statistics in sync.
 * @param {string} userId
 * @param {string} chapterId - destination chapter
 * @returns {Promise<Object>} Updated user
 */
const changeMemberChapter = async (userId, chapterId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const newChapter = await Chapter.findById(chapterId);
    if (!newChapter) {
      throw new Error('Chapter not found');
    }

    const previousChapterId = user.chapterId;

    if (previousChapterId && previousChapterId.toString() === chapterId.toString()) {
      return user.toJSON();
    }

    // Only pending/approved members are tracked in the chapter's count
    // buckets today - a rejected member still moves chapters, they just
    // don't count toward either bucket.
    const countField =
      user.status === 'approved'
        ? 'approvedMembers'
        : user.status === 'pending'
        ? 'pendingMembers'
        : null;

    if (previousChapterId) {
      const decrement = { totalMembers: -1 };
      if (countField) decrement[countField] = -1;
      await Chapter.findByIdAndUpdate(previousChapterId, { $inc: decrement });
    }

    const increment = { totalMembers: 1 };
    if (countField) increment[countField] = 1;
    await Chapter.findByIdAndUpdate(chapterId, { $inc: increment });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { chapterId: newChapter._id, city: newChapter.city },
      { new: true }
    );

    return updatedUser.toJSON();
  } catch (error) {
    throw new Error(`Chapter change failed: ${error.message}`);
  }
};

/**
 * Get pending members
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated pending members
 */
const getPendingMembers = async (page = 1, limit = 10) => {
  return await getAllMembers(page, limit, { status: 'pending', role: 'member' });
};

/**
 * Get approved members
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated approved members
 */
const getApprovedMembers = async (page = 1, limit = 10) => {
  return await getAllMembers(page, limit, { status: 'approved', role: 'member' });
};

/**
 * Get all approved members' contact info, excluding one member
 * Used for broadcasting activity notifications (new joiner, profile update)
 * @param {string} excludeUserId - User ID to exclude (the member who triggered the event)
 * @returns {Promise<Array<{ _id: string, name: string, email: string }>>}
 */
const getOtherApprovedMembers = async (excludeUserId) => {
  return await User.find({
    role: 'member',
    status: 'approved',
    _id: { $ne: excludeUserId },
    email: { $exists: true, $ne: '' }, // only members who can actually receive an email
  }).select('name email');
};

/**
 * Create a bare-bones member account directly by an admin.
 * The member logs in with the given username and/or email + password, and
 * fills in the rest of their profile (company, mobile, bio, etc.) later from
 * the app. At least one of username/email must be provided.
 * @param {Object} data - { username, email, password, chapterId, city }
 * @returns {Promise<Object>} Created user document
 */
const createMemberByAdmin = async (data) => {
  const { username, email, password, chapterId, city } = data;

  if (email) {
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      throw new Error('Email already registered');
    }
  }

  if (username) {
    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }
  }

  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
    throw new Error('Invalid chapter selected');
  }

  const newUser = new User({
    ...(username ? { username: username.toLowerCase() } : {}),
    ...(email ? { email: email.toLowerCase() } : {}),
    password,
    name: username || email.split('@')[0],
    chapterId,
    city,
    role: 'member',
    status: 'approved',
    isEmailVerified: Boolean(email),
  });

  await newUser.save();

  await Chapter.findByIdAndUpdate(
    chapterId,
    {
      $inc: {
        totalMembers: 1,
        approvedMembers: 1,
      },
    },
    { new: true }
  );

  return newUser.toJSON();
};

module.exports = {
  findUserByEmail,
  findUserByUsername,
  createUser,
  createMemberByAdmin,
  updateUserProfile,
  getUserById,
  getAllMembers,
  approveUser,
  rejectUser,
  changeMemberChapter,
  getPendingMembers,
  getApprovedMembers,
  getOtherApprovedMembers,
};
