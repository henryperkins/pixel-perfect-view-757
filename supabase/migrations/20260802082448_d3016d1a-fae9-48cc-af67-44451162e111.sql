DELETE FROM public.content_releases WHERE version = '1.0.1';

UPDATE public.content_releases SET is_active = true WHERE version = 'editorial-1.0.0';