CREATE TABLE test_table (
  id identity primary key,
  created_at timestamptz default now(),
  test_name text
);