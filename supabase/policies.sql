-- Rode no Supabase: SQL Editor > New query > Run
-- Tabela: public.products

-- 1) Ativar RLS
alter table public.products enable row level security;

-- 2) Policies (versão para a aula: qualquer pessoa com a anon key pode escrever)
drop policy if exists "products_select" on public.products;
drop policy if exists "products_insert" on public.products;
drop policy if exists "products_update" on public.products;
drop policy if exists "products_delete" on public.products;

create policy "products_select" on public.products for select to anon, authenticated using (true);
create policy "products_insert" on public.products for insert to anon, authenticated with check (true);
create policy "products_update" on public.products for update to anon, authenticated using (true) with check (true);
create policy "products_delete" on public.products for delete to anon, authenticated using (true);

-- 3) Realtime (para a tela atualizar sozinha)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
end $$;

-- Para o DELETE em tempo real trazer o id corretamente:
alter table public.products replica identity full;

-- ATENÇÃO: em produção, troque "to anon, authenticated" por "to authenticated"
-- nas policies de insert/update/delete e proteja o /admin com Supabase Auth.
