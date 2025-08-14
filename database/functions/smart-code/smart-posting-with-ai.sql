
  CREATE OR REPLACE FUNCTION smart_posting_with_ai()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Step 1: PostgreSQL deterministic rules (fast, reliable)
    IF NEW.smart_code ~ '\.RECEIPT\.' THEN
      NEW.metadata = jsonb_set(NEW.metadata, '{gl_posting_required}', 'true');
    END IF;

    -- Step 2: AI enhancement (if confidence low)
    IF NEW.ai_confidence < 0.8 THEN
      -- Flag for human review
      NEW.metadata = jsonb_set(NEW.metadata, '{needs_review}', 'true');
      NEW.metadata = jsonb_set(NEW.metadata, '{review_reason}',
        '"AI confidence below threshold"');
    END IF;

    -- Step 3: Use AI suggestions if available
    IF NEW.ai_suggested_accounts IS NOT NULL THEN
      NEW.metadata = jsonb_set(NEW.metadata, '{suggested_gl_accounts}',
        NEW.ai_suggested_accounts);
    END IF;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;