const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applySchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("Connected to database. Reading schema.sql...");
    
    const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Read the actual schema.sql which has the correct BIGSERIAL types
    const newSchema = schemaSql + `
      -- Notify PostgREST to reload schema
      NOTIFY pgrst, 'reload schema';
    `;
    
    await client.query(newSchema);
    console.log("Analytics and Audit Logging tables created successfully!");
    
  } catch (error) {
    console.error("Error applying schema:", error);
  } finally {
    await client.end();
  }
}

applySchema();
