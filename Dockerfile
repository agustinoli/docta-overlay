# Usa una imagen ultraliviana de servidor web Nginx basado en Alpine Linux
FROM nginx:alpine

# Copia toda la estructura de archivos al contenedor
COPY . /usr/share/nginx/html/

# Elimina archivos innecesarios que no deberían estar en producción (opcional)
RUN rm -rf /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/.git*

# Expone el puerto 80
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]