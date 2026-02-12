#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'rsu_slideshow.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Migrating database to add settings table...\n');

db.serialize(() => {
    // Create settings table
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating settings table:', err.message);
        } else {
            console.log('✅ Settings table created');
        }
    });
    
    // Insert default settings
    const defaultSettings = [
        ['slideshow_timing', '5'],
        ['hospital_name', 'RSU Islam Group'],
        ['hospital_tagline', 'Ramah, Amanah, Profesional, Islami (RAPI)'],
        ['site_logo', null],
        ['rounded_image_edges', 'true'],
        ['colored_blur_background', 'true'],
        ['title_font_size', '40'],
        ['subtitle_font_size', '20'],
        ['show_pagination_dots', 'true'],
        ['show_hospital_badge', 'true']
    ];
    
    const insertStmt = db.prepare(`
        INSERT INTO settings (setting_key, setting_value) 
        VALUES (?, ?)
        ON CONFLICT(setting_key) DO NOTHING
    `);
    
    let inserted = 0;
    defaultSettings.forEach(([key, value]) => {
        insertStmt.run(key, value, function(err) {
            if (err) {
                console.error(`❌ Error inserting ${key}:`, err.message);
            } else if (this.changes > 0) {
                inserted++;
                console.log(`✅ Setting added: ${key} = ${value}`);
            }
        });
    });
    
    insertStmt.finalize(() => {
        console.log(`\n📊 Migration complete: ${inserted} settings added\n`);
        
        // Verify
        db.all('SELECT COUNT(*) as count FROM settings', (err, rows) => {
            if (!err) {
                console.log(`✅ Total settings in database: ${rows[0].count}\n`);
            }
        });
    });
});

db.close(() => {
    console.log('✅ Database migration finished!\n');
});
