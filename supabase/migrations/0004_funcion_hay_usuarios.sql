-- La pantalla de ingreso necesita saber si el despacho ya tiene usuarios, para
-- mostrar el alta solo la primera vez. Después, las cuentas las crea el socio:
-- el registro abierto en un sistema con secreto profesional no tiene sentido.
--
-- Devuelve un booleano y nada más: no revela cuántos usuarios hay ni quiénes son.
create or replace function hay_usuarios()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfil);
$$;

revoke execute on function public.hay_usuarios() from public;
grant execute on function public.hay_usuarios() to anon, authenticated;
