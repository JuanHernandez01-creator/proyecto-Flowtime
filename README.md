# proyecto-Flowtime
desarrollar una app que ayude a los estidiantes a mejorar sus metodos de estudio
# 🌲 Flowtime

Sistema web de gestión del estudio basado en el **método Flowtime**: el estudiante trabaja mientras mantiene la concentración y descansa cuando la necesita, sin intervalos fijos como en Pomodoro. La aplicación registra sesiones, descansos y progreso, y muestra estadísticas de los hábitos de estudio.

> Proyecto académico de Ingeniería de Sistemas, Corporación Unificada de Educación Superior (Informática y Convergencia).
> **Autor:** Juan Diego Hernández · **Docente:** Faber Alemán

---

## Estado del proyecto

| Componente | Estado |
|---|---|
| Prototipo de la interfaz (HTML, un solo archivo) | ✅ Terminado |
| Cronómetro Flowtime y descanso sugerido | ✅ Terminado |
| Actividades, historial y estadísticas | ✅ Terminado |
| Voz e instrumental para la canción de repaso | ✅ Terminado (prototipo) |
| Módulo de backend `cancionRepaso.js` | 🟡 Escrito, sin probar ni integrar |
| Servidor, base de datos y autenticación reales | ⏳ Pendiente |
| Rol de administrador | ⏳ Pendiente |
| Despliegue | ⏳ Pendiente |

Hoy el prototipo **no tiene servidor**: el inicio de sesión es una simulación y los datos se guardan solo en el navegador (`localStorage`).

**Prototipo en línea:** https://claude.ai/artifact/QqxWx2YBs2oyLci1Fsa4G3

---

## Funcionalidades

- **Sesión Flowtime:** cronómetro sin límite sobre una actividad elegida.
- **Descanso sugerido:** el sistema propone una duración según el tiempo trabajado y registra el descanso real.
- **Actividades por asignatura:** crear, eliminar y actualizar el progreso (0 a 100 %), con un color por asignatura.
- **Historial:** sesiones con fecha, duración y descanso asociado.
- **Estadísticas:** tiempo total, promedio por sesión, número de sesiones y descansos, y tiempo por asignatura.
- **Canción de repaso (complementaria):** letra original basada en la asignatura y la actividad, con voz e instrumental, que puede reproducirse sola al iniciar el descanso.
- **Interfaz adaptable:** funciona en teléfono y computador, con modo oscuro y respeto a la preferencia de reducir movimiento.

### Regla del descanso sugerido

| Tiempo trabajado | Descanso sugerido |
|---|---|
| Menos de 25 min | 5 min |
| 25 a menos de 50 min | 10 min |
| 50 a menos de 90 min | 15 min |
| 90 min o más | 20 min |

### Medición exacta del tiempo

El cronómetro **no cuenta segundos en pantalla**. Guarda la hora de inicio y calcula `ahora − inicio`, por lo que la sesión sigue siendo correcta aunque la página se recargue o el navegador suspenda la pestaña.

---

## Estructura del repositorio

```
flowtime/
├── flowtime_prototipo.html   # Prototipo completo de la interfaz (autocontenido)
├── cancionRepaso.js          # Módulo Express para generar letras con la API de Claude
└── README.md
```

---

## Cómo probar el prototipo

No requiere instalación:

1. Abre `flowtime_prototipo.html` en un navegador moderno (Chrome o Edge recomendados).
2. Escribe un nombre y un correo cualquiera para entrar (es una demostración).
3. En **Sesión**, elige una actividad (hay datos de ejemplo), pulsa **Iniciar sesión**, espera unos segundos y pulsa **Finalizar sesión**.
4. Pulsa **Iniciar descanso** para ver la sugerencia y la tarjeta de **Canción de repaso**.
5. Revisa **Historial** y **Estadísticas**.

### Sobre la canción de repaso en el prototipo

- La **letra** sale de una plantilla; en el sistema real la genera Claude desde el servidor.
- La **voz** es la síntesis de voz de tu navegador (Web Speech API). La lista de voces y su calidad dependen del dispositivo. Se puede elegir la voz y ajustar la velocidad.
- El **instrumental** se sintetiza en el navegador (Web Audio API), con un ritmo distinto para cada estilo: rap, pop, balada, rock y reggaetón.
- No es una canción cantada: es una narración con ritmo de fondo.
- La reproducción automática arranca al pulsar **Iniciar descanso**, porque los navegadores bloquean el audio que empieza sin una acción del usuario.

---

## Backend (diseñado)

### Tecnologías previstas

- Node.js y Express
- PostgreSQL
- JWT y bcrypt para autenticación
- API de Anthropic (Claude) para las letras, **solo desde el servidor**

### Instalación del módulo de canciones

```bash
npm install express @anthropic-ai/sdk pg
```

Variable de entorno requerida:

```bash
export ANTHROPIC_API_KEY="tu_clave"
```

> ⚠️ La clave **nunca** debe ir en el frontend ni subirse al repositorio. Usa un archivo `.env` y agrégalo a `.gitignore`.

Uso en tu aplicación principal:

```js
const cancionRepaso = require('./cancionRepaso');
app.use('/api/canciones', autenticar, cancionRepaso(db));
```

Donde `autenticar` es tu middleware de login (debe definir `req.user.id`) y `db` es un `pg.Pool`.

Verifica el nombre del modelo vigente en la [documentación de Anthropic](https://docs.claude.com) y actualiza la constante `MODELO` de `cancionRepaso.js`.

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/canciones/generar` | Genera y guarda una canción de repaso para una actividad. |
| `GET` | `/api/canciones/actividad/:id` | Lista las canciones ya generadas de una actividad. |

**Ejemplo de petición:**

```js
const res = await fetch('/api/canciones/generar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ actividadId: 1, estilo: 'rap', palabrasClave: 'derivada, pendiente' }),
});
const cancion = await res.json(); // { id, titulo, letra, estilo, creada_en }
```

Estilos permitidos: `rap`, `pop`, `balada`, `rock`, `reggaeton`.

### Modelo de datos propuesto

```sql
CREATE TABLE usuario (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  correo          VARCHAR(150) UNIQUE NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol             VARCHAR(20) NOT NULL DEFAULT 'estudiante'
);

CREATE TABLE asignatura (
  id         SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  nombre     VARCHAR(100) NOT NULL,
  color      VARCHAR(20)
);

CREATE TABLE actividad (
  id            SERIAL PRIMARY KEY,
  asignatura_id INT NOT NULL REFERENCES asignatura(id) ON DELETE CASCADE,
  titulo        VARCHAR(150) NOT NULL,
  fecha_limite  DATE,
  progreso      INT NOT NULL DEFAULT 0 CHECK (progreso BETWEEN 0 AND 100),
  estado        VARCHAR(20) NOT NULL DEFAULT 'pendiente'
);

CREATE TABLE sesion (
  id           SERIAL PRIMARY KEY,
  actividad_id INT NOT NULL REFERENCES actividad(id) ON DELETE CASCADE,
  inicio       TIMESTAMP NOT NULL,
  fin          TIMESTAMP,
  duracion_seg INT
);

CREATE TABLE descanso (
  id           SERIAL PRIMARY KEY,
  sesion_id    INT NOT NULL UNIQUE REFERENCES sesion(id) ON DELETE CASCADE,
  inicio       TIMESTAMP NOT NULL,
  fin          TIMESTAMP,
  duracion_seg INT
);

CREATE TABLE cancion (
  id           SERIAL PRIMARY KEY,
  actividad_id INT NOT NULL REFERENCES actividad(id) ON DELETE CASCADE,
  titulo       VARCHAR(150) NOT NULL,
  letra        TEXT NOT NULL,
  estilo       VARCHAR(20) NOT NULL,
  creada_en    TIMESTAMP DEFAULT NOW()
);
```

Relaciones: un usuario tiene varias asignaturas; cada asignatura, varias actividades; cada actividad, varias sesiones y varias canciones; y cada sesión tiene como máximo un descanso.

---

## Consideraciones sobre la canción de repaso

- Se usa en el **descanso**, no durante el estudio: la música con letra puede interferir en tareas de lectura y razonamiento.
- Las letras deben ser **originales**; no se deben reproducir canciones existentes.
- El contenido generado por IA puede contener errores: **verifica siempre los conceptos**.
- Cada generación tiene un costo. Se recomienda limitar el uso por usuario (por ejemplo, con `express-rate-limit`).

---

## Pruebas

- Pruebas unitarias sobre la lógica de formato de tiempo, descanso sugerido y generación de letra: **13 verificaciones aprobadas**.
- Pruebas funcionales de interfaz y de usabilidad: **pendientes** de ejecución manual.

---

## Hoja de ruta

- [ ] Servidor Express con API REST y base de datos PostgreSQL
- [ ] Registro e inicio de sesión reales (JWT y bcrypt)
- [ ] Conectar el módulo `cancionRepaso.js` con la API de Claude
- [ ] Rol de administrador
- [ ] Pruebas funcionales y de usabilidad con estudiantes
- [ ] Despliegue
- [ ] Voz neuronal desde el servidor para mejorar la calidad del audio
- [ ] Recordatorios y exportación de datos (trabajo futuro)

---

## Referencias

- Holt, P. (2026). *The Flowtime study method: A complete guide.* E-Student.
- Moura, D. (2016). *The mantra of productivity.*
- Renacido, J. M. D., Mayordo, E. L., & Biray, E. T. (2025). A comparative study between Pomodoro and Flowtime techniques among college students. *International Journal of Multidisciplinary: Applied Business and Education Research, 6*(8).
