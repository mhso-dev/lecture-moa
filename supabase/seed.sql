-- Seed data for local development
-- Fixed UUIDs for reproducibility

-- ============================================================
-- Auth users (local Supabase format)
-- ============================================================

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'instructor@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Kim Instructor"}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    ''
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'student1@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Lee Student"}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    ''
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'student2@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Park Student"}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    ''
  );

-- ============================================================
-- Profiles
-- ============================================================

INSERT INTO public.profiles (id, role, display_name, avatar_url, bio)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'instructor', 'Kim Instructor', NULL, 'Experienced software engineering instructor'),
  ('22222222-2222-2222-2222-222222222222', 'student', 'Lee Student', NULL, 'Computer science student'),
  ('33333333-3333-3333-3333-333333333333', 'student', 'Park Student', NULL, 'Design student');

-- ============================================================
-- Courses
-- ============================================================

INSERT INTO public.courses (id, instructor_id, title, description, category, status, visibility)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Introduction to Web Development',
    'Learn HTML, CSS, JavaScript and modern web frameworks',
    'programming',
    'published',
    'public'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'Advanced React Patterns',
    'Deep dive into React Server Components, Suspense, and optimization',
    'programming',
    'draft',
    'public'
  );

-- ============================================================
-- Course Enrollments (both students enrolled in published course)
-- ============================================================

INSERT INTO public.course_enrollments (id, course_id, student_id, status, progress_percent)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-cccccccccc01',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'active',
    30
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccc02',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-3333-3333-3333-333333333333',
    'active',
    15
  );

-- ============================================================
-- Materials (3 materials in published course: 2 published, 1 draft)
-- ============================================================

INSERT INTO public.materials (id, course_id, title, content, excerpt, status, position, tags, read_time_minutes, version)
VALUES
  (
    'dddddddd-dddd-dddd-dddd-dddddddddd01',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'HTML Fundamentals',
    '# HTML Fundamentals\n\nHTML is the backbone of the web.\n\n## Elements\n\nHTML elements are the building blocks of web pages.\n\n## Attributes\n\nAttributes provide additional information about elements.',
    'Learn the basics of HTML elements and attributes',
    'published',
    0,
    ARRAY['html', 'basics', 'web'],
    10,
    1
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddd02',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'CSS Layout Techniques',
    '# CSS Layout Techniques\n\nModern CSS provides powerful layout tools.\n\n## Flexbox\n\nFlexbox is great for one-dimensional layouts.\n\n## Grid\n\nCSS Grid excels at two-dimensional layouts.',
    'Master Flexbox and Grid layout systems',
    'published',
    1,
    ARRAY['css', 'layout', 'flexbox', 'grid'],
    15,
    1
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddd03',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'JavaScript Basics',
    '# JavaScript Basics\n\nJavaScript brings interactivity to the web.\n\n## Variables\n\nUse const and let for variable declarations.',
    'Introduction to JavaScript fundamentals',
    'draft',
    2,
    ARRAY['javascript', 'basics'],
    20,
    1
  );

-- ============================================================
-- Questions (2 questions on published materials)
-- ============================================================

INSERT INTO public.questions (id, material_id, course_id, author_id, title, content, heading_id, selected_text, status, upvote_count, answer_count)
VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
    'dddddddd-dddd-dddd-dddd-dddddddddd01',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'What is the difference between div and span?',
    'I understand that div is a block element and span is inline, but when should I use each one?',
    'elements',
    'HTML elements are the building blocks',
    'OPEN',
    2,
    2
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02',
    'dddddddd-dddd-dddd-dddd-dddddddddd02',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-3333-3333-3333-333333333333',
    'When to use Flexbox vs Grid?',
    'Both seem to do similar things. How do I decide which one to use for my layout?',
    'flexbox',
    NULL,
    'RESOLVED',
    3,
    1
  );

-- ============================================================
-- Answers (3 answers)
-- ============================================================

INSERT INTO public.answers (id, question_id, author_id, content, is_accepted, is_ai_generated, upvote_count)
VALUES
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
    '11111111-1111-1111-1111-111111111111',
    'Great question! Use div for grouping block-level content and span for inline content within text. Think of div as a container for sections and span for highlighting or styling specific words.',
    false,
    false,
    1
  ),
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff2',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
    '33333333-3333-3333-3333-333333333333',
    'Adding to the instructor''s answer: div creates a new line before and after, while span stays in the flow of text. The semantic HTML5 elements like header, nav, main are even better than div when they apply.',
    false,
    false,
    0
  ),
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff3',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02',
    '11111111-1111-1111-1111-111111111111',
    'Use Flexbox for one-dimensional layouts (rows OR columns) and Grid for two-dimensional layouts (rows AND columns). Flexbox is great for navigation bars and card rows. Grid is ideal for page layouts and dashboards.',
    true,
    false,
    3
  );

-- ============================================================
-- Team + Members
-- ============================================================

INSERT INTO public.teams (id, course_id, name, description, created_by, max_members)
VALUES
  (
    'aabbccdd-aabb-ccdd-eeff-aabbccddeeff',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Web Dev Study Group',
    'Study group for web development course',
    '22222222-2222-2222-2222-222222222222',
    5
  );

INSERT INTO public.team_members (id, team_id, user_id, role)
VALUES
  (
    'aabbccdd-aabb-ccdd-eeff-001100110011',
    'aabbccdd-aabb-ccdd-eeff-aabbccddeeff',
    '22222222-2222-2222-2222-222222222222',
    'leader'
  ),
  (
    'aabbccdd-aabb-ccdd-eeff-002200220022',
    'aabbccdd-aabb-ccdd-eeff-aabbccddeeff',
    '33333333-3333-3333-3333-333333333333',
    'member'
  );

-- ============================================================
-- Memos (1 personal, 1 team)
-- ============================================================

INSERT INTO public.memos (id, author_id, material_id, team_id, title, content, anchor_id, tags, visibility, is_draft)
VALUES
  (
    '11223344-1122-3344-5566-778899aabbcc',
    '22222222-2222-2222-2222-222222222222',
    'dddddddd-dddd-dddd-dddd-dddddddddd01',
    NULL,
    'HTML Study Notes',
    'Key takeaways from HTML fundamentals:\n- Semantic elements improve accessibility\n- Always use alt attributes on images\n- Structure content logically',
    'elements',
    ARRAY['html', 'study-notes'],
    'personal',
    false
  ),
  (
    '11223344-1122-3344-5566-778899aabbdd',
    '22222222-2222-2222-2222-222222222222',
    'dddddddd-dddd-dddd-dddd-dddddddddd02',
    'aabbccdd-aabb-ccdd-eeff-aabbccddeeff',
    'CSS Layout Cheat Sheet',
    'Shared notes on CSS layout:\n- Flexbox: justify-content, align-items\n- Grid: grid-template-columns, grid-gap\n- Both support responsive design',
    'flexbox',
    ARRAY['css', 'layout', 'cheat-sheet'],
    'team',
    false
  );

-- ============================================================
-- Quiz + Questions + Attempt
-- ============================================================

INSERT INTO public.quizzes (id, course_id, created_by, title, description, time_limit_minutes, passing_score, status, is_ai_generated, source_material_id)
VALUES
  (
    '99887766-9988-7766-5544-332211009988',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'HTML Fundamentals Quiz',
    'Test your knowledge of HTML basics',
    15,
    70,
    'published',
    false,
    'dddddddd-dddd-dddd-dddd-dddddddddd01'
  );

INSERT INTO public.quiz_questions (id, quiz_id, question_type, content, options, correct_answer, explanation, points, order_index)
VALUES
  (
    '99887766-9988-7766-5544-000000000001',
    '99887766-9988-7766-5544-332211009988',
    'multiple_choice',
    'Which HTML element is used for the largest heading?',
    '["h1", "h6", "header", "title"]',
    'h1',
    'h1 is the largest heading element, while h6 is the smallest.',
    1,
    0
  ),
  (
    '99887766-9988-7766-5544-000000000002',
    '99887766-9988-7766-5544-332211009988',
    'true_false',
    'The <div> element is an inline element.',
    '["True", "False"]',
    'False',
    'div is a block-level element. span is the inline equivalent.',
    1,
    1
  ),
  (
    '99887766-9988-7766-5544-000000000003',
    '99887766-9988-7766-5544-332211009988',
    'short_answer',
    'What attribute is used to provide alternative text for images?',
    NULL,
    'alt',
    'The alt attribute provides alternative text for screen readers and when images cannot be displayed.',
    2,
    2
  );

INSERT INTO public.quiz_attempts (id, quiz_id, student_id, status, score, total_points, started_at, submitted_at)
VALUES
  (
    '55443322-5544-3322-1100-998877665544',
    '99887766-9988-7766-5544-332211009988',
    '22222222-2222-2222-2222-222222222222',
    'submitted',
    3,
    4,
    now() - interval '30 minutes',
    now() - interval '20 minutes'
  );
