const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
let db = null;
const bcrypt = require("bcrypt");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("The Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 12);
  const getUserCheckQuary = `
    SELECT * FROM user
    WHERE username='${username}'
    `;
  const dbUser = await db.get(getUserCheckQuary);
  if (dbUser === undefined) {
    if (password.length >= 5) {
      const dbUserRegQuary = `
                INSERT INTO user
                (username, name, password, gender, location)
                VALUES
                (
                    '${username}',
                    '${name}',
                    '${hashedPassword}',
                    '${gender}',
                    '${location}'
                )
                `;
      await db.run(dbUserRegQuary);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUser = `SELECT * FROM user WHERE username = '${username}' ;`;
  const dbUser = await db.get(checkUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPosswordCorrect = await bcrypt.compare(password, dbUser.password);
    if (isPosswordCorrect === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUser = `SELECT * FROM user WHERE username='${username}' ;`;
  const dbUser = await db.get(checkUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordCorrect === true) {
      if (newPassword.length >= 5) {
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        const updateQuary = `
                UPDATE user
                SET
                password='${hashedNewPassword}'
                WHERE username='${username}'
                `;
        await db.run(updateQuary);
        response.status(200);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
