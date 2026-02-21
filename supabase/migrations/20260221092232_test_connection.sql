CREATE TABLE test_table (
  id bigint primary key generated always as identity,
  created_at timestamptz default now(),
  test_name text
);