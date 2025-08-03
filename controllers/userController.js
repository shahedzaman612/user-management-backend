const pool = require("../config/db");

const getUsers = async (req, res) => {
  try {
    // Note: We are explicitly selecting columns and NOT including 'password_hash' for security reasons.
    const result = await pool.query(
      "SELECT id, name, email, last_login, created_at, status FROM users ORDER BY last_login DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get users error:", error.message);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

const updateUsersStatus = async (req, res, newStatus) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: "Please provide user IDs" });
  }

  // Ensure client is acquired before use in try-catch-finally block
  let client;
  try {
    client = await pool.connect(); // Acquire client connection
    await client.query("BEGIN"); // Start transaction

    // Ensure the current authenticated user isn't trying to block/delete themselves
    // This is a crucial security check
    if (
      userIds.includes(req.user.id) &&
      (newStatus === "blocked" || newStatus === "deleted")
    ) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "You cannot block or delete your own account." });
    }

    const query = `UPDATE users SET status = $1 WHERE id = ANY($2::int[]) RETURNING id, name, email, status`;
    const result = await client.query(query, [newStatus, userIds]);

    await client.query("COMMIT"); // Commit transaction
    res.status(200).json({
      message: `Users successfully ${
        newStatus === "blocked"
          ? "blocked"
          : newStatus === "deleted"
          ? "deleted"
          : "unblocked"
      }`,
      updatedUsers: result.rows,
    });
  } catch (error) {
    if (client) {
      // Only rollback if client was successfully acquired
      await client.query("ROLLBACK"); // Rollback on error
    }
    console.error(`Error updating user status to ${newStatus}:`, error.message);
    res
      .status(500)
      .json({ message: `Server error updating users to ${newStatus}` });
  } finally {
    if (client) {
      // Always release the client
      client.release();
    }
  }
};

const blockUsers = (req, res) => updateUsersStatus(req, res, "blocked");
const unblockUsers = (req, res) => updateUsersStatus(req, res, "active");
const deleteUsers = (req, res) => updateUsersStatus(req, res, "deleted"); // Consider actual deletion or 'deleted' status based on requirements

module.exports = {
  getUsers,
  blockUsers,
  unblockUsers,
  deleteUsers,
};
