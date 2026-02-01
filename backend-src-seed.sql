-- Sample data for testing RSU Islam Group Slideshow

-- Insert sample slideshows
INSERT INTO slideshows (title, description, folder_name, is_active, display_order, created_by)
VALUES 
  ('Laser Hemorrhidoplasty Services', 'Advanced laser treatment for hemorrhoids with minimal recovery time', 'laser-hemorrhidoplasty', true, 1, 1),
  ('Emergency Services', '24/7 emergency care with state-of-the-art facilities', 'emergency-services', true, 2, 1),
  ('General Health Checkup', 'Comprehensive health screening packages', 'health-checkup', true, 3, 1)
ON CONFLICT (folder_name) DO NOTHING;

-- Insert sample slides for Laser Hemorrhidoplasty
INSERT INTO slides (slideshow_id, title, description, file_path, is_active, display_order)
SELECT 
  id,
  'Advanced Laser Technology',
  'State-of-the-art laser equipment for precise and painless treatment',
  '/assets/sample/laser-hemorrhidoplasty/lh1.jpg',
  true,
  1
FROM slideshows WHERE folder_name = 'laser-hemorrhidoplasty'
ON CONFLICT DO NOTHING;

INSERT INTO slides (slideshow_id, title, description, file_path, is_active, display_order)
SELECT 
  id,
  'Experienced Medical Team',
  'Our skilled doctors provide expert care and consultation',
  '/assets/sample/laser-hemorrhidoplasty/lh2.jpg',
  true,
  2
FROM slideshows WHERE folder_name = 'laser-hemorrhidoplasty'
ON CONFLICT DO NOTHING;

INSERT INTO slides (slideshow_id, title, description, file_path, is_active, display_order)
SELECT 
  id,
  'Quick Recovery',
  'Minimal downtime - most patients return to normal activities within days',
  '/assets/sample/laser-hemorrhidoplasty/lh3.jpg',
  true,
  3
FROM slideshows WHERE folder_name = 'laser-hemorrhidoplasty'
ON CONFLICT DO NOTHING;

-- Insert sample slides for Emergency Services
INSERT INTO slides (slideshow_id, title, description, file_path, is_active, display_order)
SELECT 
  id,
  '24/7 Emergency Care',
  'Always ready to serve you with immediate medical attention',
  '/assets/sample/emergency-services/er1.jpg',
  true,
  1
FROM slideshows WHERE folder_name = 'emergency-services'
ON CONFLICT DO NOTHING;

INSERT INTO slides (slideshow_id, title, description, file_path, is_active, display_order)
SELECT 
  id,
  'Modern Emergency Facility',
  'Equipped with the latest medical technology and equipment',
  '/assets/sample/emergency-services/er2.jpg',
  true,
  2
FROM slideshows WHERE folder_name = 'emergency-services'
ON CONFLICT DO NOTHING;

INSERT INTO slides (slideshow_id, title, description, file_path, is_active, display_order)
SELECT 
  id,
  'Rapid Response Team',
  'Our emergency team is trained for quick and efficient care',
  '/assets/sample/emergency-services/er3.jpg',
  true,
  3
FROM slideshows WHERE folder_name = 'emergency-services'
ON CONFLICT DO NOTHING;

-- Initialize slide stats
INSERT INTO slide_stats (slide_id, display_count)
SELECT id, 0 FROM slides
ON CONFLICT (slide_id) DO NOTHING;

-- Insert default settings (if not already set)
INSERT INTO settings (key, value, description)
VALUES 
  ('font_family', 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif', 'Font family for slideshow text'),
  ('title_font_size', '48', 'Title font size in pixels'),
  ('desc_font_size', '24', 'Description font size in pixels'),
  ('slide_interval_ms', '8000', 'Slide transition interval in milliseconds'),
  ('logo_url', '/assets/logo-sample.png', 'Company logo URL'),
  ('show_logo', 'true', 'Show company logo on slideshow'),
  ('logo_position', 'top-right', 'Logo position on slideshow (top-left, top-right, bottom-left, bottom-right)'),
  ('logo_size', '80', 'Logo size in pixels')
ON CONFLICT (key) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Sample data inserted successfully';
END $$;
