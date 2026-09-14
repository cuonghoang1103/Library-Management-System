-- V2__Seed_Data.sql
-- Seed data for testing

-- Insert Librarian (password: librarian123 - BCrypt encoded)
INSERT INTO users (username, password, full_name, email, phone_number, role, active)
VALUES (
  'librarian',
  '$2b$10$7vCMIOj7p81VmcJFjkm1I.jxvwgP6GWDZk/CWFM.syBY2htV6bp8W',
  'Nguyen Van Librarian',
  'librarian@library.com',
  '0901234567',
  'LIBRARIAN',
  TRUE
);

-- Insert Members (password: member123 - BCrypt encoded)
INSERT INTO users (username, password, full_name, email, phone_number, role, active)
VALUES
('john_doe', '$2b$10$870vrZBBVWmAWaXQmgLM8Ov3bhyWeW1bW/LzpGufp4O7mun7nsCa2', 'John Doe', 'john@example.com', '0901111111', 'MEMBER', TRUE),
('jane_smith', '$2b$10$870vrZBBVWmAWaXQmgLM8Ov3bhyWeW1bW/LzpGufp4O7mun7nsCa2', 'Jane Smith', 'jane@example.com', '0902222222', 'MEMBER', TRUE),
('bob_wilson', '$2b$10$870vrZBBVWmAWaXQmgLM8Ov3bhyWeW1bW/LzpGufp4O7mun7nsCa2', 'Bob Wilson', 'bob@example.com', '0903333333', 'MEMBER', TRUE);

-- Insert sample books
INSERT INTO books (title, description, author, isbn, publisher, published_date, genre, total_copies, available_copies)
VALUES
('Clean Code', 'A handbook of agile software craftsmanship', 'Robert C. Martin', '978-0132350884', 'Prentice Hall', '2008-08-01', 'Programming', 5, 5),
('Design Patterns', 'Elements of reusable object-oriented software', 'Erich Gamma', '978-0201633610', 'Addison-Wesley', '1994-10-31', 'Programming', 3, 3),
('The Pragmatic Programmer', 'Your journey to mastery', 'David Thomas, Andrew Hunt', '978-0135957059', 'Addison-Wesley', '2019-09-13', 'Programming', 4, 4),
('Introduction to Algorithms', 'Comprehensive textbook on algorithms', 'Thomas H. Cormen', '978-0262033848', 'MIT Press', '2009-07-31', 'Computer Science', 2, 2),
('Database System Concepts', 'Comprehensive database management', 'Abraham Silberschatz', '978-0078022159', 'McGraw-Hill', '2010-06-16', 'Database', 3, 3),
('Operating System Concepts', 'Modern operating systems fundamentals', 'Abraham Silberschatz', '978-1118063330', 'Wiley', '2012-07-10', 'Operating Systems', 2, 2),
('Computer Networks', 'Data communications and networking', 'Andrew S. Tanenbaum', '978-0132126953', 'Pearson', '2010-08-23', 'Networking', 3, 3),
('Artificial Intelligence', 'A modern approach to AI', 'Stuart Russell', '978-0136042594', 'Pearson', '2009-12-11', 'Artificial Intelligence', 4, 4);

-- Insert book copies
INSERT INTO book_copies (book_id, copy_number, status, location, notes)
SELECT b.id, 'BK-' || b.id || '-1', 'ON_SHELF', 'A-01-' || b.id, NULL FROM books b WHERE b.title = 'Clean Code';
INSERT INTO book_copies (book_id, copy_number, status, location, notes)
SELECT b.id, 'BK-' || b.id || '-1', 'ON_SHELF', 'A-02-' || b.id, NULL FROM books b WHERE b.title = 'Design Patterns';
INSERT INTO book_copies (book_id, copy_number, status, location, notes)
SELECT b.id, 'BK-' || b.id || '-1', 'ON_SHELF', 'A-03-' || b.id, NULL FROM books b WHERE b.title = 'The Pragmatic Programmer';
INSERT INTO book_copies (book_id, copy_number, status, location, notes)
SELECT b.id, 'BK-' || b.id || '-1', 'ON_SHELF', 'A-04-' || b.id, NULL FROM books b WHERE b.title = 'Introduction to Algorithms';
INSERT INTO book_copies (book_id, copy_number, status, location, notes)
SELECT b.id, 'BK-' || b.id || '-1', 'ON_SHELF', 'B-01-' || b.id, NULL FROM books b WHERE b.title = 'Database System Concepts';
INSERT INTO book_copies (book_id, copy_number, status, location, notes)
SELECT b.id, 'BK-' || b.id || '-1', 'ON_SHELF', 'B-02-' || b.id, NULL FROM books b WHERE b.title = 'Operating System Concepts';
INSERT INTO book_copies (book_id, copy_number, status, location, notes)
SELECT b.id, 'BK-' || b.id || '-1', 'ON_SHELF', 'B-03-' || b.id, NULL FROM books b WHERE b.title = 'Computer Networks';
INSERT INTO book_copies (book_id, copy_number, status, location, notes)
SELECT b.id, 'BK-' || b.id || '-1', 'ON_SHELF', 'C-01-' || b.id, NULL FROM books b WHERE b.title = 'Artificial Intelligence';
