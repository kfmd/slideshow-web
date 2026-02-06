-- Sample Data for RSU Islam Group Digital Signage
-- Run this AFTER the database is initialized

-- Insert sample slideshow 1 (Circumcision Services)
INSERT INTO slideshows (title, description, status, created_by, display_count) 
VALUES (
    'Sirkumsisi (Khitan)',
    'Layanan Sirkumsisi (Khitan) RSU Islam Klaten dengan berbagai pilihan metode: Dokter Umum, Dokter Spesialis, Modern, dan ODC',
    'active',
    'admin',
    0
);

-- Insert sample slideshow 2 (Homecare Services)
INSERT INTO slideshows (title, description, status, created_by, display_count) 
VALUES (
    'Layanan Homecare',
    'Nikmati layanan Homecare kesehatan langsung di rumah Anda dengan tim profesional RSU Islam Klaten',
    'active',
    'admin',
    0
);

-- Add images for Circumcision slideshow (ID 1)
INSERT INTO images (slideshow_id, filename, caption, file_path, file_size, mime_type, display_order)
VALUES 
(1, 'circ-1.jpg', 'Sirkumsisi (Khitan) - Services Overview', 'assets/images/uploads/circ-1.jpg', 284534, 'image/jpeg', 0),
(1, 'circ-2.jpg', 'Khitan Modern dengan Lem', 'assets/images/uploads/circ-2.jpg', 337238, 'image/jpeg', 1);

-- Add images for Homecare slideshow (ID 2)
INSERT INTO images (slideshow_id, filename, caption, file_path, file_size, mime_type, display_order)
VALUES 
(2, 'hc-1.jpg', '#DiRumahAja - Biar Kami Yang Ke Rumah', 'assets/images/uploads/hc-1.jpg', 174578, 'image/jpeg', 0),
(2, 'hc-2.jpg', 'Layanan Homecare - Professional Care', 'assets/images/uploads/hc-2.jpg', 167148, 'image/jpeg', 1);

-- Verify sample data
SELECT 'Sample slideshows created:' as message;
SELECT id, title, status FROM slideshows;

SELECT 'Sample images added:' as message;
SELECT id, slideshow_id, filename FROM images ORDER BY slideshow_id, display_order;
