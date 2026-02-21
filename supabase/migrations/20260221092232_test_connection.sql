CREATE TABLE test_table (
  id idenitity primary key,
  created_at timestamptz default now(),
  test_name text
);