-- Patch to align webhooks table with current implementation
-- Adds 'config' and 'source' columns if they don't exist

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'config') THEN
        ALTER TABLE webhooks ADD COLUMN config JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'source') THEN
        ALTER TABLE webhooks ADD COLUMN source TEXT DEFAULT 'generic';
    END IF;

    -- Also check for 'secret' vs 'secret_key' mismatch
    -- My code uses 'secret', existing uses 'secret_key'.
    -- I will add 'secret' as an alias or new column to avoid breaking existing?
    -- Better: Update my code to use 'secret_key' if present? 
    -- No, easier to add 'secret' column for now to match my code, or rename. 
    -- Let's add 'secret' column to be safe and simple for my generated code.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'secret') THEN
        ALTER TABLE webhooks ADD COLUMN secret TEXT;
    END IF;

END $$;
