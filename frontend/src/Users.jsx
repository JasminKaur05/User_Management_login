import { useEffect, useState } from "react";

function Users() {
  const [users, setUsers] = useState([]);

  // CREATE form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UPDATE form
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Loading states
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // =========================
  // READ - GET /users
  // =========================
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/users");

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Unable to load users");
    }
  };

  // =========================
  // CREATE - POST /register
  // =========================
  const handleAddUser = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add user");
      }

      setMessage("User added successfully!");

      setName("");
      setEmail("");
      setPassword("");

      await fetchUsers();
    } catch (err) {
      console.error("Error adding user:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // OPEN UPDATE FORM
  // =========================
  const handleEdit = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);

    setMessage("");
    setError("");
  };

  // =========================
  // UPDATE - PUT /users/{id}
  // =========================
  const handleUpdateUser = async (e) => {
    e.preventDefault();

    if (!editingUser) return;

    setMessage("");
    setError("");
    setUpdating(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName,
            email: editEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update user");
      }

      setMessage("User updated successfully!");

      setEditingUser(null);
      setEditName("");
      setEditEmail("");

      await fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // =========================
  // CANCEL UPDATE
  // =========================
  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setError("");
  };

  // =========================
  // SOFT DELETE
  // DELETE /users/{id}
  // =========================
  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    setDeletingId(user.id);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/users/${user.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete user");
      }

      setMessage(`${user.name} was soft deleted successfully!`);

      // If the user being edited was deleted, close edit form
      if (editingUser && editingUser.id === user.id) {
        handleCancelEdit();
      }

      // Refresh active users
      await fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>User Management</h1>

      {/* =========================
          CREATE USER
         ========================= */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <h2>Add New User</h2>

        <form onSubmit={handleAddUser}>
          <div style={{ marginBottom: "15px" }}>
            <label>
              <strong>Name</strong>
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              <strong>Email</strong>
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              <strong>Password</strong>
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add User"}
          </button>
        </form>
      </div>

      {/* =========================
          UPDATE USER
         ========================= */}
      {editingUser && (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2>Edit User</h2>

          <p>
            Editing User ID: <strong>{editingUser.id}</strong>
          </p>

          <form onSubmit={handleUpdateUser}>
            <div style={{ marginBottom: "15px" }}>
              <label>
                <strong>Name</strong>
              </label>

              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label>
                <strong>Email</strong>
              </label>

              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              style={{ marginRight: "10px" }}
            >
              {updating ? "Updating..." : "Update User"}
            </button>

            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Messages */}
      {message && <p>{message}</p>}

      {error && <p>{error}</p>}

      {/* =========================
          USERS TABLE
         ========================= */}
      <h2>Active Users</h2>

      {users.length === 0 ? (
        <p>No active users found.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr>
              <th style={tableHeaderStyle}>ID</th>
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>Email</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={tableCellStyle}>{user.id}</td>
                <td style={tableCellStyle}>{user.name}</td>
                <td style={tableCellStyle}>{user.email}</td>

                <td style={tableCellStyle}>
                  <button
                    onClick={() => handleEdit(user)}
                    disabled={deletingId === user.id}
                    style={{ marginRight: "10px" }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(user)}
                    disabled={deletingId === user.id}
                  >
                    {deletingId === user.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  boxSizing: "border-box",
};

const tableHeaderStyle = {
  border: "1px solid #ccc",
  padding: "12px",
  textAlign: "left",
};

const tableCellStyle = {
  border: "1px solid #ccc",
  padding: "12px",
};

export default Users;