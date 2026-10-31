-- Cierra los avisos del linter de seguridad de Supabase.
--
-- 1. `tocar_actualizado_en` no fijaba search_path: un search_path manipulable en
--    una función de trigger es una vía para ejecutar código ajeno.
-- 2. Las funciones de apoyo de la RLS quedaban expuestas como endpoints RPC a
--    cualquiera, incluso sin iniciar sesión. Nadie debe poder preguntarle a la
--    API si es socio; eso lo decide la base por dentro.
--
-- Nota de lo aprendido al aplicarla: revocar de `anon` no bastó. El EXECUTE no
-- venía del rol, venía de PUBLIC, que Postgres concede por omisión a toda
-- función nueva. Por eso se revoca de PUBLIC y se concede solo a quien lo usa.

create or replace function tocar_actualizado_en()
returns trigger language plpgsql set search_path = '' as $$
begin new.actualizado_en = now(); return new; end $$;

revoke execute on function public.crear_perfil_al_registrar() from public;
revoke execute on function public.usuario_activo() from public;
revoke execute on function public.es_socio() from public;
revoke execute on function public.es_del_equipo() from public;
revoke execute on function public.mis_clientes() from public;
revoke execute on function public.mis_asuntos_como_cliente() from public;
revoke execute on function public.tocar_actualizado_en() from public;

-- La RLS evalúa estas funciones en nombre del usuario autenticado.
grant execute on function public.usuario_activo() to authenticated;
grant execute on function public.es_socio() to authenticated;
grant execute on function public.es_del_equipo() to authenticated;
grant execute on function public.mis_clientes() to authenticated;
grant execute on function public.mis_asuntos_como_cliente() to authenticated;

-- El trigger de alta de perfil corre como supabase_auth_admin al insertar en
-- auth.users: no necesita EXECUTE de anon ni de authenticated.
grant execute on function public.crear_perfil_al_registrar() to supabase_auth_admin;
