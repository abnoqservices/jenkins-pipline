import pool from "./db";
//import bcrypt from "bcrypt";

export interface DBConnectionResult {
  connected: boolean;
  message: string;
  timestamp?: string;
  error?: unknown;
}

export async function checkDatabaseConnection(): Promise<DBConnectionResult> {
  try {
    const result = await pool.query("SELECT NOW()");
    return {
      connected: true,
      message: "Database connected successfully",
      timestamp: result.rows[0].now,
    };
  } catch (error: any) {
    return {
      connected: false,
      message: error.message,
      error: error,
    };
  }
}

export interface UserExistsResult {
  exists: boolean;
  user: any | null;
}

export async function checkUserExists(userId: number): Promise<UserExistsResult> {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rows.length > 0) {
      return {
        exists: true,
        user: result.rows[0],
      };
    }

    return {
      exists: false,
      user: null,
    };
  } catch (error) {
    console.error("Error checking user:", error);
    throw error;
  }
}

export interface AuthResult {
  authenticated: boolean;
  message: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export async function checkUserAuthenticated(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return {
        authenticated: false,
        message: "User not found",
      };
    }

    const user = result.rows[0];

    // Password check (hashed)
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return {
        authenticated: false,
        message: "Invalid password",
      };
    }

    return {
      authenticated: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    console.error("Error during authentication:", error);
    throw error;
  }
}

export interface CreateUserResult {
  success: boolean;
  message: string;
  user?: any;
}

export async function createUser(
  fullName: string,
  email: string,
  password: string,
  companyName: string
): Promise<CreateUserResult> {
  try {
    // Check existing user
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return {
        success: false,
        message: "Email already registered",
      };
    }

   // const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (name, email, password, company_name, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, email, company_name;
    `;

    const result = await pool.query(insertQuery, [
      fullName,
      email,
      password,
      companyName,
    ]);

    return {
      success: true,
      user: result.rows[0],
      message: "User registered successfully",
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      message: "Something went wrong. Try again.",
    };
  }
}

export async function createProduct(product: any) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Insert product into main table
    const insertProductQuery = `
      INSERT INTO products 
      (id, formdata, images, pdfs, gallery, tags, custom_fields, custom_fields_meta, version, landing_page_id)
      VALUES 
      ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10)
      RETURNING *;
    `;

    const productResult = await client.query(insertProductQuery, [
      product.id,
      JSON.stringify(product.formData),                 // $2
      JSON.stringify(product.images),                   // $3
      JSON.stringify(product.pdfs),                     // $4
      JSON.stringify(product.gallery),                  // $5
      JSON.stringify(product.tags),                     // $6
      JSON.stringify(product.custom_fields || {}),      // $7
      JSON.stringify(product.custom_fields_meta || []), // FIXED: must be array // $8
      product.version,                                  // $9
      product.landing_page_id                           // $10
    ]);

    // 2️⃣ Insert custom fields in separate table
    if (Array.isArray(product.custom_fields_meta) && product.custom_fields_meta.length > 0) {
      const insertFieldQuery = `
        INSERT INTO product_custom_fields 
        (id, product_id, name, type, required, value)
        VALUES ($1, $2, $3, $4, $5, $6);
      `;

      for (const field of product.custom_fields_meta) {
        await client.query(insertFieldQuery, [
          field.id.toString(),     // field id
          product.id,              // product id
          field.name,              // field name
          field.type,              // field type
          field.required || false, // required flag
          field.value || null      // stored value
        ]);
      }
    }

    await client.query("COMMIT");

    return {
      success: true,
      product: productResult.rows[0],
      message: "Product & custom fields saved successfully",
    };

  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("❌ Error inserting product or custom fields:", error);

    return {
      success: false,
      message: error.message || "Failed to insert product or custom fields",
    };

  } finally {
    client.release();
  }
}

export async function getProductById(productId: string) {
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      productId,
    ]);

    if (result.rows.length === 0) {
      return {
        found: false,
        message: "Product not found",
      };
    }

    return {
      found: true,
      product: result.rows[0],
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
}
export async function getAllProducts() {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
    return {
      success: true,
      products: result.rows,
    };
  } catch (error) {
    console.error("Error fetching all products:", error);
    return {
      success: false,
      message: "Failed to fetch products",
    };
  }
}
export async function getAllCustomFields() {
  try {
    const result = await pool.query(
      "SELECT * FROM custom_fields ORDER BY id ASC"
    );

    return {
      success: true,
      fields: result.rows,
    };
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    return {
      success: false,
      message: "Failed to fetch custom fields",
    };
  }
}
export async function saveCustomFields(fields) {
  try {
    // Delete existing fields
    await pool.query("DELETE FROM custom_fields");

    // Insert new fields
    const insertQuery =
      "INSERT INTO custom_fields (name, type, required) VALUES ($1, $2, $3)";

    for (const field of fields) {
      await pool.query(insertQuery, [
        field.name,
        field.type,
        field.required ?? false,
      ]);
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving custom fields:", error);
    return {
      success: false,
      message: "Failed to save custom fields",
    };
  }
}

