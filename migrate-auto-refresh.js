#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'rsu_slideshow.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Adding auto-refresh functionality to database...\n');

db.serialize(() => {
    // Create change_tracker table
    db.run(`
        CREATE TABLE IF NOT EXISTS change_tracker (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            last_slideshow_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_settings_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating change_tracker table:', err.message);
        } else {
            console.log('✅ Change tracker table created');
        }
    });
    
    // Initialize change tracker
    db.run(`
        INSERT INTO change_tracker (id, last_slideshow_update, last_settings_update, updated_at)
        VALUES (1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO NOTHING
    `, (err) => {
        if (err) {
            console.error('❌ Error initializing change tracker:', err.message);
        } else {
            console.log('✅ Change tracker initialized');
        }
    });
    
    // Verify
    db.get('SELECT * FROM change_tracker WHERE id = 1', (err, row) => {
        if (err) {
            console.error('❌ Error verifying change tracker:', err.message);
        } else if (row) {
            console.log('\n📊 Change Tracker Status:');
            console.log(`   Last Slideshow Update: ${row.last_slideshow_update}`);
            console.log(`   Last Settings Update: ${row.last_settings_update}`);
            console.log(`   Last Update: ${row.updated_at}`);
        }
    });
});

db.close(() => {
    console.log('\n✅ Auto-refresh feature added successfully!\n');
    console.log('🎯 Next steps:');
    console.log('   1. Restart your server: docker-compose restart');
    console.log('   2. Open slideshow.html on any device');
    console.log('   3. Make changes in admin panel');
    console.log('   4. Watch slideshow auto-refresh! 🔄\n');
});
