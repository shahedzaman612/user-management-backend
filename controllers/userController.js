const pool = require("../config/db");

const getUsers = async (req, res) => {
  try {
    // Note: We are explicitly selecting columns and NOT including 'password_hash' for security reasons.
    // Ensure you only fetch active/un-deleted users if that's your frontend requirement
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

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Security check: Ensure the current authenticated user isn't trying to block/delete themselves
    if (
      userIds.includes(req.user.id) &&
      (newStatus === "blocked" || newStatus === "deleted")
    ) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "You cannot block or delete your own account." });
    }

    let query;
    let queryParams;
    let successMessage;

    if (newStatus === "deleted") {
      // --- HARD DELETE IMPLEMENTATION ---
      query = `DELETE FROM users WHERE id = ANY($1::int[]) RETURNING id`;
      queryParams = [userIds];
      successMessage = 'Users successfully deleted (hard delete)';
    } else {
      // --- SOFT UPDATE FOR BLOCK/UNBLOCK ---
      query = `UPDATE users SET status = $1 WHERE id = ANY($2::int[]) RETURNING id, name, email, status`;
      queryParams = [newStatus, userIds];
      successMessage = `Users successfully ${
        newStatus === "blocked" ? "blocked" : "unblocked"
      }`;
    }

    const result = await client.query(query, queryParams);

    await client.query("COMMIT");
    res.status(200).json({
      message: successMessage,
      // For hard delete, updatedUsers will contain the IDs of deleted users
      // For soft update, it will contain full user objects
      processedUserIds: result.rows.map(row => row.id), // Return IDs for consistency
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error(`Error processing users to ${newStatus}:`, error.message);
    res
      .status(500)
      .json({ message: `Server error processing users to ${newStatus}` });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const blockUsers = (req, res) => updateUsersStatus(req, res, "blocked");
const unblockUsers = (req, res) => updateUsersStatus(req, res, "active");
const deleteUsers = (req, res) => updateUsersStatus(req, res, "deleted");

module.exports = {
  getUsers,
  blockUsers,
  unblockUsers,
  deleteUsers,
};