import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

interface AuthInfo {
  message?: string;
}

export function setupAuth(app: Express) {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          if (process.env.NODE_ENV === 'development') {
            console.debug("Login failed: User not found");
          }
          return done(null, false, { message: "Incorrect username or password" });
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          if (process.env.NODE_ENV === 'development') {
            console.debug("Login failed: Invalid password");
          }
          return done(null, false, { message: "Incorrect username or password" });
        }

        return done(null, user);
      } catch (error) {
        console.error("Login error:", error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    if (!user || typeof user.id !== 'number') {
      console.error("Failed to serialize user:", user);
      return done(new Error("Invalid user data for serialization"));
    }
    console.debug("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: unknown, done) => {
    try {
      if (typeof id !== 'number') {
        console.error("Invalid user ID in session:", id);
        return done(new Error("Invalid user ID type in session"));
      }

      const user = await storage.getUser(id);

      if (!user) {
        console.error("User not found during deserialization:", id);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Session deserialization error:", error);
      done(error);
    }
  });

  // Authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) {
          console.error("Login after registration failed:", err);
          return next(err);
        }
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: AuthInfo) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Login failed" });
      }
      req.login(user, (err) => {
        if (err) {
          console.error("Session creation error:", err);
          return next(err);
        }
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return next(err);
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}