-- Preserve existing preferences; the new optional focus has no automatic consent.
ALTER TABLE profiles ADD COLUMN domain_pref TEXT;
