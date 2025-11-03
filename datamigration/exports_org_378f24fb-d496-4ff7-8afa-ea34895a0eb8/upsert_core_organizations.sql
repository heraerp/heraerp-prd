BEGIN;
CREATE TEMP TABLE t_core_organizations AS TABLE public.core_organizations WITH NO DATA;
\COPY t_core_organizations FROM 'public__core_organizations.csv' WITH CSV HEADER
INSERT INTO public.core_organizations SELECT * FROM t_core_organizations
ON CONFLICT (id) DO NOTHING;
COMMIT;
