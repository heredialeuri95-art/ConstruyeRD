# ConstruyeRD — Sistema Completo

## Archivos del proyecto

```
construyerd/
├── server.js              ← Servidor backend (Node.js + Express)
├── package.json           ← Dependencias
├── data/
│   └── registros.json     ← Base de datos (auto-creada)
└── public/
    ├── index.html         ← Página waitlist (pública)
    └── admin.html         ← Panel de administración
```

---

## INICIO RÁPIDO (local)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar servidor
```bash
npm start
```

### 3. Abrir en el navegador
- **Página pública:** http://localhost:3001
- **Panel admin:**   http://localhost:3001/admin.html

### 4. Credenciales por defecto
- **Usuario:** `admin`
- **Contraseña:** `construyerd2025`

---

## CAMBIAR CREDENCIALES

Editar `server.js` líneas:
```js
const ADMIN_USER = 'tu_usuario';
const ADMIN_PASS = 'tu_contraseña_segura';
```

O usar variables de entorno (recomendado en producción):
```bash
ADMIN_USER=miusuario ADMIN_PASS=mipassword node server.js
```

---

## DEPLOY EN RENDER.COM (gratis)

1. Crear cuenta en https://render.com
2. New → Web Service
3. Conectar tu repositorio de GitHub
4. Configuración:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
5. Variables de entorno (Environment Variables):
   - `ADMIN_USER` = tu usuario
   - `ADMIN_PASS` = tu contraseña
6. Deploy → tu URL será algo como `https://construyerd.onrender.com`

---

## DEPLOY EN RAILWAY.APP (gratis)

1. https://railway.app → New Project → Deploy from GitHub
2. Agregar variables de entorno en Settings → Variables
3. Listo — Railway detecta Node.js automáticamente

---

## DEPLOY EN VPS / SERVIDOR PROPIO

```bash
# 1. Subir archivos al servidor
scp -r construyerd/ usuario@tu-servidor:/var/www/

# 2. Instalar Node.js (si no está)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install nodejs

# 3. Instalar dependencias
cd /var/www/construyerd && npm install

# 4. Instalar PM2 (proceso persistente)
npm install -g pm2

# 5. Iniciar con PM2
pm2 start server.js --name construyerd
pm2 save
pm2 startup

# 6. Ver logs en tiempo real
pm2 logs construyerd
```

---

## GITHUB PAGES (solo frontend, sin servidor)

Si solo quieres subir el `index.html` a GitHub Pages sin servidor:
1. Editar `index.html`: el formulario guardará en localStorage temporalmente
2. Subir solo `public/index.html` como `index.html` en tu repo
3. Activar GitHub Pages en Settings → Pages

**Nota:** Sin servidor no tendrás base de datos ni panel admin.

---

## API ENDPOINTS

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/health` | No | Estado del servidor |
| GET | `/api/count` | No | Total de registros |
| POST | `/api/register` | No | Registrar usuario |
| POST | `/api/login` | No | Login admin |
| GET | `/api/registros` | Sí | Todos los registros |
| DELETE | `/api/registro/:id` | Sí | Eliminar registro |
| GET | `/api/stats` | Sí | Estadísticas |
| GET | `/api/export/csv` | Sí | Exportar CSV |

---

## DATOS

Los registros se guardan en `data/registros.json`. Para backup:
```bash
cp data/registros.json backup_$(date +%Y%m%d).json
```

---

© 2025 ConstruyeRD — República Dominicana
