# Usa una imagen ultraliviana de servidor web Nginx basado en Alpine Linux
FROM nginx:alpine

# Copia toda la estructura de archivos al contenedor
COPY . /usr/share/nginx/html/

# Elimina archivos innecesarios que no deberían estar en producción
RUN rm -rf /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/.git*

# SOLUCIÓN SECRETA: Montamos el archivo .env temporalmente para extraer la clave de forma invisible
# El archivo no se guarda en ninguna capa y desaparece al terminar este paso.
RUN --mount=type=secret,id=dot_env \
    GOOGLE_MAPS_API_KEY=$(awk -F= '/^GOOGLE_MAPS_API_KEY/{print $2}' /run/secrets/dot_env | tr -d '\r"') && \
    sed -i "s|__API_KEY__|${GOOGLE_MAPS_API_KEY}|g" /usr/share/nginx/html/index.html

# Expone el puerto 80
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]