# Docta Masterplan Overlay App 🗺️🚀

Aplicación web interactiva (Single Page Application) ultra liviana diseñada para el equipo de ventas inmobiliarias. Permite visualizar de forma interactiva el másterplan de la Urbanización Docta (Malagueño, Córdoba) superpuesto sobre la vista satelital híbrida de Google Maps, realizando un seguimiento GPS en tiempo real y permitiendo la consulta offline de disponibilidad y precios de lotes.

---

## 🛠️ Arquitectura Actual

La aplicación está construida bajo una filosofía **Vanilla JS (JavaScript Puro)** para garantizar el máximo rendimiento y velocidad de carga en dispositivos móviles en el campo de venta.

- **`index.html`**: Estructura limpia de la interfaz (sin scripts externos inyectados en el HTML).
- **`js/config.js`**: Configuraciones globales del mapa (coordenadas del centro de Docta, límites, niveles de zoom máximo bloqueados en **Zoom 19** para evitar pérdidas de imagen).
- **`js/map.js`**: Clase contenedora de la lógica de Google Maps API, configuración dinámica de estilos vectoriales e inicialización de capas de mosaicos (tiles) de S3.
- **`js/main.js`**: Controlador principal de la UI, eventos de los botones (Opacidad, Centrado GPS, Compartir WhatsApp) y gestión de ventanas de información dinámicas.
- **`js/docta.geojson`**: Base de datos geométrica e inmobiliaria local sincronizada directamente desde la API oficial, eliminando problemas de CORS y dependencias de red externas.

---

## 📋 Próximos Pasos & Backlog de Mejoras 
*(Organizado para próximas sesiones de desarrollo)*

### 🔍 1. Filtro Rápido de Disponibilidad ("Modo Escaneo")
- **Objetivo:** Permitir al vendedor limpiar visualmente el mapa para enfocarse solo en lo que puede vender.
- **Implementación:** Agregar dos botones flotantes o un interruptor (Toggle) en la interfaz para ocultar/mostrar dinámicamente los lotes con estado `"Vendido"` o `"Reservado"`. 
- **Técnica:** Utilizar la función nativa `this.map.data.filter()` de la API de Google Maps sobre la capa GeoJSON local.

### ⌨️ 2. Buscador Predictivo de Manzana y Lote
- **Objetivo:** Evitar que el vendedor tenga que buscar manualmente un lote arrastrando el dedo bajo el sol.
- **Implementación:** Añadir una barra de entrada de texto (Search Input) en la parte superior. Al ingresar una combinación como `"144 04"`, el sistema buscará en el array de propiedades del GeoJSON local.
- **Técnica:** Al encontrar coincidencia en los atributos `sector` (manzana) y `unit` (lote), aplicar un método `this.map.panTo()` hacia las coordenadas del polígono y disparar automáticamente el Popup informativo.

### 🚗 3. Navegación GPS Guiada ("Cómo Llegar")
- **Objetivo:** Guiar al vendedor y al cliente en vehículo desde cualquier punto de la ciudad hasta la parcela exacta dentro de Docta.
- **Implementación:** Agregar un botón de acción estético dentro del Popup (`InfoWindow`) que diga `"🚗 Cómo llegar"`.
- **Técnica:** Al hacer clic, disparar un enlace externo con el protocolo nativo de mapas del celular (`https://www.google.com/maps/dir/?api=1&destination=LAT,LNG`), abriendo automáticamente Google Maps, Apple Maps o Waze en modo navegación paso a paso.

### 📴 4. Soporte Offline Total (PWA - Progressive Web App)
- **Objetivo:** Garantizar que la aplicación funcione al 100% incluso en zonas profundas del loteo donde la señal de datos móviles (4G/5G) es débil o nula.
- **Implementación:** Transformar la web estática en una aplicación web progresiva instalable en el celular del vendedor.
- **Técnica:** 1. Crear un archivo `manifest.json` para configurar el icono de la app en la pantalla de inicio.
  2. Implementar un archivo `service-worker.js` básico para cachear en el almacenamiento físico del teléfono el `index.html`, los archivos `.js`, el archivo `.css` y el archivo crítico `js/docta.geojson`.

---

## 🚀 Comandos de Desarrollo Local (Docker Secreto)

Para levantar el entorno local de desarrollo de manera segura utilizando la inyección de la API Key mediante variables de entorno protegidas (`.env`), ejecutar el comando unificado en la terminal:

```bash
export DOCKER_BUILDKIT=1 && docker build --secret id=dot_env,src=.env -t mapa-overlay-app . && docker stop mi-mapa-contenedor 2>/dev/null && docker rm mi-mapa-contenedor 2>/dev/null && docker run -d -p 8081:80 --name mi-mapa-contenedor mapa-overlay-app
```


## Sobre la API de geoJSON

Caso A: Consumo Directo en Tiempo Real (Con tu Token Actual)
En este escenario, aprovechas el token que ya tienes para hacer que el celular de cada vendedor le consulte directamente a Proaco el estado de los lotes cada vez que abren el mapa.

Cómo funciona: Modificamos el código de la app para que el fetch() apunte a la URL con tu token. Como el navegador web va a bloquear la petición por seguridad (CORS), la solución es pedirle al área de sistemas de Proaco un único favor técnico: que habiliten tu dominio de producción (ej. el de GitHub Pages) en su servidor.

La solución técnica de Proaco: Ellos solo deben configurar el encabezado Access-Control-Allow-Origin: https://tu-dominio.github.io en su API para ese endpoint.

Lo bueno: Datos 100% en tiempo real. Si un lote se vende hace un segundo, el vendedor lo ve al instante en el mapa. Cero mantenimiento de archivos de tu lado.

Lo malo: Si los servidores de Proaco se caen o están lentos, la capa interactiva de tu app se resiente. Además, dependes de que el token que te dieron no tenga fecha de vencimiento.

Caso B: Automatización de Descarga (El plan de respaldo "Casi" en Tiempo Real)
Si el equipo de sistemas de Proaco tarda en habilitarte el CORS, o prefieres no depender de la estabilidad de su servidor en el medio del campo, usas el token para actualizar tu archivo local de forma automática.

Cómo funciona: Tu app sigue leyendo el archivo local js/docta.geojson (velocidad instantánea y cero problemas de CORS). Sin embargo, programamos un "robot" gratuito en GitHub Actions que, usando tu token, se descarga el JSON de Proaco cada 15 o 30 minutos, reemplaza el archivo viejo y actualiza la web de forma automática.

Lo bueno: Independencia total. Si el servidor de Proaco se cae o el token cambia sin aviso, tu app sigue funcionando perfectamente con la última captura guardada. Carga extremadamente rápido en zonas con poca señal (4G/5G).

Lo malo: Existe un pequeño desfase de datos de unos minutos (el tiempo que configures el temporizador del robot).

## Otras mejoras segun deepseek, pero no conoce todo el código:
# 🚀 Propuestas de Mejora para la App Docta Map

## 📊 Estado Actual
- ✅ Mapa interactivo con Google Maps
- ✅ Capa de tiles del masterplan de Docta
- ✅ Control de opacidad del plano
- ✅ Geolocalización con marcador de usuario
- ✅ Botón para centrar en ubicación actual
- ✅ Compartir ubicación por WhatsApp
- ✅ Botón de enlace al sitio web de Equipo Inmobiliario

---

## 🎯 Mejoras Prioritarias (Fáciles de implementar)

### 1. **Guardar preferencias del usuario**
- Guardar la opacidad seleccionada en `localStorage`
- Recordar el último zoom y posición del mapa
- Cargar preferencias al iniciar la app

### 2. **Indicador de carga**
- Mostrar un spinner mientras cargan los tiles
- Feedback visual cuando se obtiene la ubicación GPS
- Mensaje de "Buscando señal..." con timeout

### 3. **Botón de reset de vista**
- Botón para volver a la vista inicial (centro y zoom por defecto)
- Útil si el usuario se pierde navegando

### 4. **Mejorar el marcador GPS**
- Añadir un círculo de precisión (accuracy circle)
- Animación de pulso en el marcador
- Actualizar el círculo cuando cambia la precisión

### 5. **Selector rápido de opacidad**
- Botones predefinidos: 0%, 25%, 50%, 75%, 100%
- Slider + botones para mejor UX

---

## 🎨 Mejoras Visuales y UX

### 6. **Diseño más moderno**
- Modo oscuro/claro (toggle)
- Botones más estilizados con gradientes
- Animaciones más suaves (skeleton loaders)

### 7. **Panel de información expandible**
- Mostrar coordenadas actuales del cursor
- Información del lote al hacer clic (si hay datos)
- Capa de parcelas con colores según disponibilidad

### 8. **Mini-mapa o vista de contexto**
- Pequeño mapa en esquina mostrando ubicación relativa
- Útil para orientación general

### 9. **Zoom con botones + y -**
- Botón de zoom in/out para touch
- Indicador de nivel de zoom actual

### 10. **Leyenda del mapa**
- Pequeño panel explicativo de colores/capas
- Información de qué representa cada elemento

---

## 🛰️ Funcionalidades Avanzadas

### 11. **Búsqueda de lotes**
- Buscador por número de lote, manzana o calle
- Autocompletado de direcciones
- Centrar el mapa en el lote seleccionado

### 12. **Capas adicionales**
- Capa de lotes disponibles (verde)
- Capa de lotes vendidos (rojo)
- Capa de infraestructura (calles, luz, agua, gas)
- Toggle para activar/desactivar cada capa

### 13. **Medición de distancias**
- Herramienta para medir metros lineales
- Cálculo de superficie de lotes (polígono)
- Mostrar resultados en metros cuadrados

### 14. **Ruta hasta el lote**
- Calcular distancia desde ubicación actual
- Mostrar tiempo estimado (caminando/auto)
- Abrir en Google Maps para navegación

### 15. **Compartir más opciones**
- Compartir por email, SMS, Telegram
- Generar código QR con la ubicación
- Copiar coordenadas al portapapeles

### 16. **Favoritos**
- Guardar lotes favoritos
- Lista de lotes para visitar
- Sincronizar con cuenta (si hay login)

---

## 📱 Mejoras Mobile-First

### 17. **Gestos táctiles mejorados**
- Doble tap para zoom
- Pinch to zoom más suave
- Long press para acciones contextuales

### 18. **Modo offline básico**
- Cachear tiles recientemente visitados
- Funcionalidad básica sin internet
- Mensaje de "modo offline" cuando no hay conexión

### 19. **Uso de orientación**
- Detectar rotación de pantalla
- Ajustar UI para landscape/portrait

### 20. **Instalable como PWA**
- Manifest.json
- Service Worker para cache y offline
- Icono para pantalla de inicio

---

## 🔒 Seguridad y Rendimiento

### 21. **API Key protegida**
- Usar variables de entorno en producción
- Restringir por dominio en Google Cloud Console
- Proxy backend para ocultar la key

### 22. **Lazy loading**
- Cargar tiles solo cuando son visibles
- Limitar número de peticiones simultáneas

### 23. **Cache de tiles**
- Usar localStorage o IndexedDB para tiles
- Reducir ancho de banda y mejorar velocidad

### 24. **Compresión de imágenes**
- Optimizar el logo de Equipo Inmobiliario
- Usar WebP si el navegador lo soporta

### 25. **Analytics**
- Google Analytics para ver uso de la app
- Trackear qué botones se usan más
- Detectar errores y cuellos de botella

---

## 🌟 Mejoras "Nice to Have"

### 26. **Integración con CRM**
- Botón "Solicitar información" del lote
- Enviar lead a WhatsApp/email automáticamente
- Guardar historial de lotes consultados

### 27. **Realidad Aumentada**
- Ver el plano superpuesto en cámara (AR)
- Ayuda a visualizar lotes en terreno

### 28. **Tour virtual**
- Tours de 360° de lotes específicos
- Videos promocionales embebidos

### 29. **Chat en vivo**
- Integración con chatbot o WhatsApp Business
- Asistente virtual para preguntas frecuentes

### 30. **Notificaciones push**
- Alertas de nuevos lotes disponibles
- Recordatorio de visita a lotes favoritos

---

## 📊 Roadmap Sugerido

### Fase 1 (Inmediata - 1 semana)
- [ ] Guardar preferencias (opacidad, última posición)
- [ ] Indicador de carga y feedback GPS
- [ ] Botón reset vista
- [ ] Mejorar marcador con círculo de precisión

### Fase 2 (Corto plazo - 1 mes)
- [ ] Búsqueda de lotes por número
- [ ] Selector rápido de opacidad
- [ ] Panel de leyenda
- [ ] Compartir más opciones (email, QR)

### Fase 3 (Mediano plazo - 2-3 meses)
- [ ] Capas adicionales (disponibilidad, infraestructura)
- [ ] Herramienta de medición
- [ ] Modo offline básico
- [ ] PWA (instalable)

### Fase 4 (Largo plazo - 6 meses)
- [ ] Integración con CRM
- [ ] Rutas y navegación
- [ ] Realidad Aumentada
- [ ] Tour virtual

---

## 🛠️ Tecnologías Recomendadas

| Función | Tecnología |
|---------|------------|
| Estado y almacenamiento | LocalStorage, IndexedDB |
| PWA | Workbox, Service Workers |
| Animaciones | CSS Animations, GSAP |
| Mapas alternativos | Leaflet, MapLibre |
| Realidad Aumentada | Three.js, AR.js |
| Analytics | Google Analytics 4, Plausible |
| Rendimiento | Lighthouse, WebPageTest |

---

## 📈 Métricas para Medir Éxito

- **Tiempo de carga** - < 2 segundos
- **Tiles cargados** - > 95% éxito
- **GPS accuracy** - < 20 metros promedio
- **Retención de usuarios** - 30% regresan en 7 días
- **CTR botones** - WhatsApp > 20%, GPS > 50%


---

## 💡 Ideas Locales Específicas para Docta

### 30. **Información del barrio**
- Mostrar amenities cercanos (colegios, plazas, comercios)
- Distancia a accesos principales (ruta, autopista)
- Fotos del estado actual de la urbanización

### 31. **Etapas de construcción**
- Diferenciar por colores lotes en preventa, en construcción, entregados
- Mostrar fecha estimada de entrega
- Galería de fotos por etapa

### 32. **Contacto directo con vendedor**
- Botón "Llamar ahora" al vendedor asignado
- Horarios de atención en el mapa
- Agendar visita directamente
