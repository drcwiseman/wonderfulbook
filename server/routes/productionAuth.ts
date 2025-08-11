import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { body, validationResult } from "express-validator";
import { db } from "../db.js";
import { users } from "@shared/schema";
import { newRegisterSchema, newLoginSchema, adminResetPasswordSchema } from "@shared/schema";
import { storage } from "../storage.js";
import { 
  registerRateLimit, 
  loginRateLimit, 
  verifyCaptcha, 
  verifyAdminToken,
  requireProductionAuth,
  features 
} from "../middleware/productionAuth.js";

const router = Router();

// Registration endpoint
router.post("/register", 
  registerRateLimit,
  verifyCaptcha,
  // Express-validator rules
  body("name")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .trim()
    .escape(),
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("phone")
    .isLength({ min: 7 })
    .withMessage("Phone must be at least 7 characters")
    .trim(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  
  async (req: any, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          ok: false,
          error: "Validation failed",
          details: errors.array()
        });
      }

      // Validate with Zod schema
      const validation = newRegisterSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          ok: false,
          error: "Invalid input",
          details: validation.error.issues
        });
      }

      const { name, email, phone, password } = validation.data;

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({
          ok: false,
          error: "Email already registered"
        });
      }

      // Hash password with bcrypt (cost 12 for production security)
      const saltRounds = process.env.NODE_ENV === "production" ? 12 : 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await db
        .insert(users)
        .values({
          name,
          email,
          phone,
          passwordHash,
          authProvider: "local",
          registrationIp: req.ip || req.connection?.remoteAddress,
          deviceFingerprint: req.headers["x-device-fingerprint"] || null
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt
        });

      const user = newUser[0];

      // Create session
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        authProvider: "local"
      };

      console.log("✅ User registered successfully:", user.email);

      res.status(201).json({
        ok: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive
        },
        message: features.EMAIL_VERIFICATION ? 
          "Registration successful. Please check your email for verification." :
          "Registration successful. Welcome!"
      });

    } catch (error) {
      console.error("❌ Registration error:", error);
      res.status(500).json({
        ok: false,
        error: "Registration failed",
        message: "An error occurred during registration"
      });
    }
  }
);

// Login endpoint
router.post("/login",
  loginRateLimit,
  verifyCaptcha,
  // Express-validator rules
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),

  async (req: any, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          ok: false,
          error: "Validation failed",
          details: errors.array()
        });
      }

      // Validate with Zod schema
      const validation = newLoginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          ok: false,
          error: "Invalid input",
          details: validation.error.issues
        });
      }

      const { email, password } = validation.data;

      // Find user by email
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (userResult.length === 0) {
        return res.status(401).json({
          ok: false,
          error: "Invalid email or password"
        });
      }

      const user = userResult[0];

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          ok: false,
          error: "Account is deactivated. Please contact support."
        });
      }

      // Verify password
      if (!user.passwordHash) {
        return res.status(401).json({
          ok: false,
          error: "Invalid email or password"
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          ok: false,
          error: "Invalid email or password"
        });
      }

      // Update last login
      await db
        .update(users)
        .set({ 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      // Create session
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        authProvider: user.authProvider || "local"
      };

      console.log("✅ User logged in successfully:", user.email);

      res.json({
        ok: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive
        },
        message: "Login successful"
      });

    } catch (error) {
      console.error("❌ Login error:", error);
      res.status(500).json({
        ok: false,
        error: "Login failed",
        message: "An error occurred during login"
      });
    }
  }
);

// Logout endpoint
router.post("/logout", (req: any, res) => {
  try {
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("❌ Session destruction error:", err);
          return res.status(500).json({
            ok: false,
            error: "Logout failed"
          });
        }

        res.clearCookie("connect.sid"); // Clear session cookie
        console.log("✅ User logged out successfully");
        
        res.json({
          ok: true,
          message: "Logout successful"
        });
      });
    } else {
      res.json({
        ok: true,
        message: "Already logged out"
      });
    }
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({
      ok: false,
      error: "Logout failed"
    });
  }
});

// Get current user endpoint
router.get("/me", requireProductionAuth, (req: any, res) => {
  try {
    const user = req.session.user;
    
    res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        authProvider: user.authProvider
      }
    });
  } catch (error) {
    console.error("❌ Get user error:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to get user information"
    });
  }
});

// Support placeholder endpoint
router.post("/support/request-reset", (req, res) => {
  // Placeholder endpoint - no actual email sent
  console.log("📧 Password reset support request received");
  
  res.json({
    ok: true,
    message: "A team member will contact you to assist with your password reset."
  });
});

// Admin password reset endpoint
router.post("/admin/users/:id/reset-password",
  verifyAdminToken,
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          ok: false,
          error: "Validation failed",
          details: errors.array()
        });
      }

      // Validate with Zod schema
      const validation = adminResetPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          ok: false,
          error: "Invalid input",
          details: validation.error.issues
        });
      }

      const { newPassword } = validation.data;
      const userId = req.params.id;

      // Check if user exists
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        return res.status(404).json({
          ok: false,
          error: "User not found"
        });
      }

      // Hash new password
      const saltRounds = process.env.NODE_ENV === "production" ? 12 : 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await db
        .update(users)
        .set({ 
          passwordHash,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      console.log(`✅ Admin password reset successful for user: ${userId}`);

      res.json({
        ok: true,
        message: "Password reset successful"
      });

    } catch (error) {
      console.error("❌ Admin password reset error:", error);
      res.status(500).json({
        ok: false,
        error: "Password reset failed"
      });
    }
  }
);

export default router;