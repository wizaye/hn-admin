const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DATABASE_ID = process.env.D1_DATABASE_ID;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !D1_DATABASE_ID) {
    console.error('Missing required environment variables for D1 database connection');
}

const D1_API_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`;

interface D1Response<T = any> {
    success: boolean;
    errors: any[];
    messages: any[];
    result: Array<{
        results: T[];
        success: boolean;
        meta: {
            changed_db: boolean;
            changes: number;
            duration: number;
            last_row_id: number;
            rows_read: number;
            rows_written: number;
        };
    }>;
}

/**
 * Execute a SQL query against the D1 database
 */
export async function queryD1<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
        const response = await fetch(D1_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql, params }),
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`D1 API Error: ${response.status} - ${errorText}`);
        }

        const data: D1Response<T> = await response.json();

        if (!data.success || data.errors.length > 0) {
            throw new Error(`D1 Query Error: ${JSON.stringify(data.errors)}`);
        }

        return data.result[0]?.results || [];
    } catch (error) {
        console.error('Error querying D1 database:', error);
        throw error;
    }
}

/**
 * Get all categories from the products table
 */
export async function getCategories(): Promise<Array<{ category: string }>> {
    return queryD1<{ category: string }>('SELECT category FROM products');
}

/**
 * Get products from a specific category table
 */
export async function getProductsByCategory(categoryName: string) {
    const tableName = categoryName.toLowerCase().replace(/\s+/g, '_');

    try {
        const products = await queryD1(`SELECT * FROM ${tableName}`);

        return products.map((product: any) => {
            const model = product.model || product.id;
            const color = product.color || '';
            const uniqueId = color ? `${model}-${color.replace(/\s+/g, '-')}` : model;

            return {
                ...product,
                image: product.image_url || (product.image_path
                    ? `${R2_PUBLIC_URL}/${product.image_path}`
                    : null),
                category: categoryName,
                id: uniqueId,
                model: model,
            };
        });
    } catch (error) {
        console.error(`Error fetching products from category ${categoryName}:`, error);
        throw error;
    }
}

// ── Admin Users ──

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    created_at: string;
}

/**
 * Create the admin_users table if it doesn't exist
 */
export async function createAdminUsersTable(): Promise<void> {
    await queryD1(`
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);
}

/**
 * Get an admin user by email
 */
export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
    const results = await queryD1<AdminUser>(
        'SELECT * FROM admin_users WHERE email = ? LIMIT 1',
        [email]
    );
    return results[0] || null;
}

/**
 * Create a new admin user
 */
export async function createAdminUser(name: string, email: string, passwordHash: string): Promise<void> {
    await queryD1(
        'INSERT INTO admin_users (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash]
    );
}

/**
 * Get the total count of admin users
 */
export async function getAdminCount(): Promise<number> {
    const results = await queryD1<{ count: number }>(
        'SELECT COUNT(*) as count FROM admin_users'
    );
    return results[0]?.count || 0;
}
