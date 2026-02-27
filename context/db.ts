import * as SQLite from 'expo-sqlite';

// Open or create the database
export const db = SQLite.openDatabaseSync('habitmarket.db');

// Initialize the database schema
export const initDB = () => {
  try {
    // Enable Write-Ahead Logging for better concurrent performance
    db.execSync('PRAGMA journal_mode = WAL;');
    
    // Create tables
    db.execSync(`
      -- Settings (Key-Value store)
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      -- Habits
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        icon TEXT,
        completed INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        streak INTEGER DEFAULT 0,
        createdAt TEXT
      );

      -- Habit History
      CREATE TABLE IF NOT EXISTS habit_history (
        dateKey TEXT PRIMARY KEY,
        payload TEXT -- JSON string of { habitId: boolean, __total: number }
      );

      -- Chart Data (Market Candles)
      CREATE TABLE IF NOT EXISTS chart_data (
        timestamp INTEGER PRIMARY KEY,
        actualRate REAL,
        open REAL,
        high REAL,
        low REAL,
        close REAL
      );

      -- Folders (Library & Assign)
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        icon TEXT,
        type TEXT,
        section TEXT,
        assignedTo TEXT,
        createdBy TEXT
      );

      -- Notes
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        type TEXT, -- foreign key to folderId
        date TEXT,
        media TEXT -- JSON array string
      );

      -- Client Projects
      CREATE TABLE IF NOT EXISTS client_projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        folderId TEXT,
        content TEXT,
        checklist TEXT, -- JSON array string
        media TEXT, -- JSON array string
        lastEditedBy TEXT,
        lastEditedAt TEXT,
        assignedTo TEXT,
        createdBy TEXT
      );

      -- Sync Queue (Outbox Pattern)
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY, -- auto-generated uuid
        operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
        tableName TEXT NOT NULL,
        recordId TEXT NOT NULL,
        payload TEXT, -- JSON string of the record data
        timestamp TEXT NOT NULL,
        status TEXT DEFAULT 'pending' -- 'pending', 'processing', 'failed'
      );
    `);
    
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
};
