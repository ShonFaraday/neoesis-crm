# Neoesis CRM

Sistema de prospección de Neoesis DEVS®: captura negocios sin web desde Google Maps, registra cada contacto, agenda los seguimientos solos (días 3, 6 y 10) y envía un resumen diario por correo.

**Secciones:** Hoy · Captura · Prospectos (ficha + historial) · Embudo · Calendario · Métricas · Plantillas.

Tecnología: Next.js 16 + Tailwind 4 (igual que la web de Neoesis), base de datos Supabase (plan gratuito), despliegue en Vercel.

---

## 1. Base de datos (Supabase, ~10 min)

1. Entra a https://supabase.com, crea una cuenta y un proyecto nuevo (región: **São Paulo**, la más cercana a Lima).
2. Ve a **SQL Editor → New query**, pega todo el contenido de `supabase/schema.sql` y pulsa **Run**.
3. Ve a **Project Settings → API** y copia:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`. Nunca la compartas ni la subas a GitHub.

> El plan gratuito de Supabase pausa el proyecto tras 7 días sin uso; con uso diario no pasa.

## 2. Google Places API (para la sección Captura)

1. Entra a https://console.cloud.google.com y crea un proyecto “Neoesis CRM”.
2. **Facturación:** vincula una cuenta de facturación (Google la exige aunque uses el cupo gratis).
3. **APIs y servicios → Biblioteca →** habilita **Places API (New)**.
4. **APIs y servicios → Credenciales → Crear credencial → Clave de API.** Restríngela a “Places API (New)”. Esa es `GOOGLE_PLACES_API_KEY`.
5. **Muy recomendado:** en **Facturación → Presupuestos y alertas** crea un presupuesto de US$ 5 con alertas al 50 % y 100 %.

### Costo cero garantizado

- Google regala 1.000 consultas al mes de “Text Search Enterprise”. El CRM **nunca pasa de 950 al mes ni de 30 al día** (`PLACES_MAX_BUSQUEDAS_MES`, `PLACES_MAX_BUSQUEDAS_DIA`); aunque subas esos números, el código no permite más de 950/mes.
- Cada consulta se anota **antes** de llamar a Google, así el contador nunca se queda corto.
- **Segundo candado en Google (obligatorio):** APIs y servicios → Places API (New) → **Cuotas** → “SearchTextRequest per day” (o “Text Search requests per day”) → Editar → **30**. Con eso Google mismo rechaza la consulta 31 del día: 30 × 31 días = 930 < 1.000.
- Supabase, Resend y Vercel se usan en sus planes gratuitos, sin tarjeta.

## 3. Probar en tu computadora

```bash
cp .env.example .env.local     # en Windows: copy .env.example .env.local
# edita .env.local con tus claves
npm install
npm run dev
```
Abre http://localhost:3000 y entra con un usuario de `TEAM_USERS`.

## 4. Publicar en Vercel

1. Crea un repositorio **privado** en GitHub llamado `neoesis-crm` y sube esta carpeta:
   ```bash
   git init && git add . && git commit -m "Neoesis CRM"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/neoesis-crm.git
   git push -u origin main
   ```
2. En Vercel: **Add New → Project →** importa `neoesis-crm`.
3. En **Environment Variables** agrega todas las de `.env.example` con tus valores (sin comillas).
4. **Deploy.** Opcional: asígnale un subdominio, p. ej. `crm.neoesis.pe`.

## 5. Recordatorio diario por correo (opcional)

1. Crea cuenta en https://resend.com y una API key → `RESEND_API_KEY`.
2. `RECORDATORIO_EMAIL_PARA` = tu correo (con `onboarding@resend.dev` solo puedes enviarte a ti mismo hasta verificar tu dominio).
3. `CRON_SECRET` = cualquier texto largo; `APP_URL` = la URL de Vercel.
4. `vercel.json` ya programa el envío de lunes a sábado a las 7:00 a. m. de Lima.

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Base de datos |
| `TEAM_USERS` | Usuarios y claves: `Angel:clave1;José:clave2` |
| `AUTH_SECRET` | Texto largo y aleatorio para firmar la sesión |
| `GOOGLE_PLACES_API_KEY` | Captura desde Google Maps |
| `PLACES_MAX_BUSQUEDAS_MES`, `PLACES_MAX_BUSQUEDAS_DIA` | Topes de consultas a Google (máx. 950/mes) |
| `META_DIARIA` | Meta de contactos nuevos por día (50) |
| `RESEND_API_KEY`, `RECORDATORIO_EMAIL_PARA`, `RECORDATORIO_EMAIL_DE`, `CRON_SECRET`, `APP_URL` | Correo diario |

## Flujo diario

1. **Captura:** elige rubro + distrito → Buscar → quedan marcados los sin web → **Agregar**.
2. **Hoy:** pulsa **WhatsApp A** en cada negocio nuevo: se abre WhatsApp con el mensaje personalizado y se registra el toque.
3. El sistema agenda solo el siguiente mensaje (B día 3, C día 6, D día 10) y lo muestra en **Hoy** y en el **Calendario**.
4. Cuando alguien responde, cambia su etapa en la ficha o arrastra la tarjeta en **Embudo**.
5. Revisa **Métricas** cada viernes para ver qué rubros y distritos responden mejor.
