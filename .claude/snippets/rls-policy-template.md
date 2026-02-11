# RLS Policy Template

## Standard User Data Policy

```sql
-- Enable RLS on table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- User can only see their own data
CREATE POLICY "Users can only access their own data"
  ON table_name FOR ALL
  USING (auth.uid() = user_id);
```

## Shared Data Policy (e.g., Sponsor Sharing)

```sql
-- User can see their own data OR data explicitly shared with them
CREATE POLICY "Users can access shared data"
  ON table_name FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT shared_with_id FROM sharing_table
      WHERE resource_id = table_name.id
    )
  );
```

## Policy Validation Checklist

- [ ] RLS is enabled on the table
- [ ] Policy uses `auth.uid()` to identify current user
- [ ] Policy filters by `user_id` column
- [ ] All user data operations (SELECT, INSERT, UPDATE, DELETE) are covered
- [ ] Test policy with multiple users to prevent privilege escalation
- [ ] Foreign key relationships don't create unintended access paths
