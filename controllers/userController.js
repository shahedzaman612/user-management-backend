const pool = require("../config/db");

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, last_login, created_at, status FROM users ORDER BY last_login DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get users error:", error.message);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    console.log(
      "[userController] Validation failed: userIds is empty or invalid."
    );
    return res.status(400).json({ message: "Please provide user IDs" });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const query = `UPDATE users SET status = $1 WHERE id = ANY($2::int[]) RETURNING id, name, email, status`;
    console.log(
      "[userController] Executing SQL Query for status update:",
      query
    );
    console.log("[userController] With parameters:", [newStatus, userIds]);

    const result = await client.query(query, [newStatus, userIds]);

    console.log(
      "[userController] SQL Query Result Rows for status update:",
      result.rows
    );

    await client.query("COMMIT");
    res.status(200).json({
      message: `Users successfully ${
        newStatus === "blocked" ? "blocked" : "unblocked"
      }`,
      updatedUsers: result.rows,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error(
      `[userController] ERROR: Server error updating user status to ${newStatus}:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: `Server error updating users to ${newStatus}` });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const hardDeleteUsers = async (req, res) => {
  const { userIds } = req.body;

  console.log(`[userController] Attempting to hard delete users`);
  console.log("[userController] Received userIds for deletion:", userIds);
  console.log(
    "[userController] Authenticated user ID (making this request):",
    req.user ? req.user.id : "N/A"
  );

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    console.log(
      "[userController] Validation failed: userIds is empty or invalid."
    );
    return res.status(400).json({ message: "Please provide user IDs" });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const query = `DELETE FROM users WHERE id = ANY($1::int[]) RETURNING id, name, email`;
    console.log("[userController] Executing SQL Query for deletion:", query);
    console.log("[userController] With parameters:", [userIds]);

    const result = await client.query(query, [userIds]);

    console.log(
      "[userController] SQL Query Result Rows for deletion:",
      result.rows
    );

    await client.query("COMMIT");
    res.status(200).json({
      message: "Users deleted permanently!",
      deletedUsers: result.rows,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error(
      `[userController] ERROR: Server error deleting users:`,
      error.message,
      error.stack
    );
    res.status(500).json({ message: `Server error deleting users` });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const blockUsers = (req, res) => updateUsersStatus(req, res, "blocked");
const unblockUsers = (req, res) => updateUsersStatus(req, res, "active");
// Map deleteUsers to the new hardDeleteUsers function
const deleteUsers = hardDeleteUsers;

module.exports = {
  getUsers,
  blockUsers,
  unblockUsers,
  deleteUsers, // Exporting hardDeleteUsers as deleteUsers
};
