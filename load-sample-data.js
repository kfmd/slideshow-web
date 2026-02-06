#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'rsu_slideshow.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Loading sample data...\n');

// Sample slideshows
const slideshows = [
    {
        title: 'Sirkumsisi (Khitan)',
        description: 'Layanan Sirkumsisi (Khitan) RSU Islam Klaten dengan berbagai pilihan metode: Dokter Umum, Dokter Spesialis, Modern, dan ODC',
        status: 'active',
        created_by: 'admin'
    },
    {
        title: 'Layanan Homecare',
        description: 'Nikmati layanan Homecare kesehatan langsung di rumah Anda dengan tim profesional RSU Islam Klaten',
        status: 'active',
        created_by: 'admin'
    }
];

// Sample images
const images = [
    // Circumcision slideshow (slideshow_id: 1)
    {
        slideshow_id: 1,
        filename: 'circ-1.jpg',
        caption: 'Sirkumsisi (Khitan) - Services Overview',
        file_path: 'assets/images/uploads/circ-1.jpg',
        file_size: 284534,
        mime_type: 'image/jpeg',
        display_order: 0
    },
    {
        slideshow_id: 1,
        filename: 'circ-2.jpg',
        caption: 'Khitan Modern dengan Lem',
        file_path: 'assets/images/uploads/circ-2.jpg',
        file_size: 337238,
        mime_type: 'image/jpeg',
        display_order: 1
    },
    // Homecare slideshow (slideshow_id: 2)
    {
        slideshow_id: 2,
        filename: 'hc-1.jpg',
        caption: '#DiRumahAja - Biar Kami Yang Ke Rumah',
        file_path: 'assets/images/uploads/hc-1.jpg',
        file_size: 174578,
        mime_type: 'image/jpeg',
        display_order: 0
    },
    {
        slideshow_id: 2,
        filename: 'hc-2.jpg',
        caption: 'Layanan Homecare - Professional Care',
        file_path: 'assets/images/uploads/hc-2.jpg',
        file_size: 167148,
        mime_type: 'image/jpeg',
        display_order: 1
    }
];

// Run in series
db.serialize(() => {
    // Insert slideshows
    const insertSlideshow = db.prepare(`
        INSERT INTO slideshows (title, description, status, created_by, display_count) 
        VALUES (?, ?, ?, ?, 0)
    `);

    slideshows.forEach((slideshow, index) => {
        insertSlideshow.run(
            slideshow.title,
            slideshow.description,
            slideshow.status,
            slideshow.created_by,
            function(err) {
                if (err) {
                    console.error(`❌ Error inserting slideshow ${index + 1}:`, err.message);
                } else {
                    console.log(`✅ Slideshow ${index + 1} created: ${slideshow.title}`);
                }
            }
        );
    });

    insertSlideshow.finalize();

    // Insert images
    const insertImage = db.prepare(`
        INSERT INTO images (slideshow_id, filename, caption, file_path, file_size, mime_type, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    images.forEach((image, index) => {
        insertImage.run(
            image.slideshow_id,
            image.filename,
            image.caption,
            image.file_path,
            image.file_size,
            image.mime_type,
            image.display_order,
            function(err) {
                if (err) {
                    console.error(`❌ Error inserting image ${index + 1}:`, err.message);
                } else {
                    console.log(`✅ Image ${index + 1} added: ${image.filename}`);
                }
            }
        );
    });

    insertImage.finalize();

    // Verify
    db.all('SELECT COUNT(*) as count FROM slideshows', (err, rows) => {
        if (!err) {
            console.log(`\n📊 Total slideshows: ${rows[0].count}`);
        }
    });

    db.all('SELECT COUNT(*) as count FROM images', (err, rows) => {
        if (!err) {
            console.log(`📊 Total images: ${rows[0].count}`);
        }
    });
});

db.close(() => {
    console.log('\n✅ Sample data loaded successfully!\n');
    console.log('🚀 You can now:');
    console.log('   1. Visit http://localhost:3000/index.html');
    console.log('   2. Login with: admin / admin123');
    console.log('   3. View the 2 sample slideshows\n');
});
