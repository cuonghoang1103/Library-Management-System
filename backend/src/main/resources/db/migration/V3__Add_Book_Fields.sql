-- V3__Add_Book_Fields.sql
-- Add new fields for book metadata and cover images

ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500);
ALTER TABLE books ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English';
ALTER TABLE books ADD COLUMN IF NOT EXISTS pages INTEGER;

-- Update seed data with book cover images (using Open Library covers)
UPDATE books SET cover_image = 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg' WHERE isbn = '978-0132350884';
UPDATE books SET cover_image = 'https://covers.openlibrary.org/b/isbn/9780201633610-L.jpg' WHERE isbn = '978-0201633610';
UPDATE books SET cover_image = 'https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg' WHERE isbn = '978-0135957059';
UPDATE books SET cover_image = 'https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg' WHERE isbn = '978-0262033848';
UPDATE books SET cover_image = 'https://covers.openlibrary.org/b/isbn/9780078022159-L.jpg' WHERE isbn = '978-0078022159';
UPDATE books SET cover_image = 'https://covers.openlibrary.org/b/isbn/9781118063330-L.jpg' WHERE isbn = '978-1118063330';
UPDATE books SET cover_image = 'https://covers.openlibrary.org/b/isbn/9780132126953-L.jpg' WHERE isbn = '978-0132126953';
UPDATE books SET cover_image = 'https://covers.openlibrary.org/b/isbn/9780136042594-L.jpg' WHERE isbn = '978-0136042594';

-- Set language and pages for sample books
UPDATE books SET language = 'English', pages = 464 WHERE isbn = '978-0132350884';
UPDATE books SET language = 'English', pages = 416 WHERE isbn = '978-0201633610';
UPDATE books SET language = 'English', pages = 352 WHERE isbn = '978-0135957059';
UPDATE books SET language = 'English', pages = 1312 WHERE isbn = '978-0262033848';
UPDATE books SET language = 'English', pages = 1376 WHERE isbn = '978-0078022159';
UPDATE books SET language = 'English', pages = 976 WHERE isbn = '978-1118063330';
UPDATE books SET language = 'English', pages = 960 WHERE isbn = '978-0132126953';
UPDATE books SET language = 'English', pages = 1152 WHERE isbn = '978-0136042594';
