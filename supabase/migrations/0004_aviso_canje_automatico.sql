-- Aviso automático al canjear: un trigger sobre canjes envía un correo HTML
-- desde el servidor (pg_net → Resend). La clave de Resend y el correo de
-- destino viven en la tabla privada `ajustes` (claves 'resend_api_key' y
-- 'aviso_email'), que se rellena a mano en el proyecto: el repo es público.
create extension if not exists pg_net with schema extensions;

create table ajustes (
  clave text primary key,
  valor text not null
);
alter table ajustes enable row level security; -- sin policies ni grants: solo el servidor

create or replace function avisar_canje() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_key    text;
  v_email  text;
  v_nombre text;
  v_premio text := case new.recompensa when 'cine' then 'Ir al cine'
                                       when 'comida' then 'Comida fuera, la que él elija'
                                       else new.recompensa end;
  v_emoji  text := case new.recompensa when 'cine' then '🎬' when 'comida' then '🍕' else '🎁' end;
  v_fecha  text := to_char(now() at time zone 'Europe/Madrid', 'DD/MM/YYYY "a las" HH24:MI');
  v_html   text;
begin
  select valor into v_key from ajustes where clave = 'resend_api_key';
  select valor into v_email from ajustes where clave = 'aviso_email';
  if v_key is null or v_email is null then return new; end if;
  select initcap(nombre) into v_nombre from profiles where id = new.user_id;

  v_html := format($html$<div style="margin:0;padding:32px 16px;background:#eef0f7;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
  <div style="max-width:460px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(30,40,80,.12);">
    <div style="background:#8b5cf6;background:linear-gradient(135deg,#84a7ff 0%%,#8b5cf6 55%%,#e879b9 100%%);padding:24px;text-align:center;">
      <div style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Reto Diario · Recompensa canjeada</div>
    </div>
    <div style="padding:30px 28px;text-align:center;">
      <div style="font-size:54px;line-height:1;">%s</div>
      <div style="font-size:24px;font-weight:800;color:#101323;margin-top:12px;">%s</div>
      <p style="font-size:16px;color:#535a72;margin:16px 0 0;line-height:1.5;"><b style="color:#101323;">%s</b> ha llegado a <b style="color:#101323;">%s puntos</b> y ha canjeado esta recompensa.</p>
      <p style="font-size:13px;color:#8b91a7;margin:10px 0 0;">%s</p>
      <a href="https://renzoramosdev.github.io/Matematicas-Gamificadas/" style="display:inline-block;margin-top:22px;background:#101323;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 26px;border-radius:14px;">Abrir Reto Diario</a>
    </div>
    <div style="padding:14px;text-align:center;background:#f5f6fa;color:#8b91a7;font-size:12px;">Aviso automático del juego · ¡Toca cumplirlo! 🎯</div>
  </div>
</div>$html$, v_emoji, v_premio, v_nombre, new.puntos, v_fecha);

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', 'Reto Diario <onboarding@resend.dev>',
      'to', jsonb_build_array(v_email),
      'subject', 'Reto Diario: ' || v_nombre || ' ha canjeado ' || v_emoji || ' ' || v_premio,
      'html', v_html
    )
  );
  return new;
exception when others then
  return new; -- el aviso nunca tumba un canje
end $$;

revoke execute on function avisar_canje() from public, anon, authenticated;
create trigger canje_avisa after insert on canjes
  for each row execute function avisar_canje();
