# Usa una imagen ultraliviana de servidor web Nginx basado en Alpine Linux
FROM nginx:alpine

# Copia el archivo index.html al directorio raíz de publicación por defecto de Nginx
COPY index.html /usr/share/nginx/html/index.html

# COPIA LA IMAGEN al contenedor en la misma ruta que el index
COPY hayequipo.png /usr/share/nginx/html/hayequipo.png

# Informa a Docker que el contenedor escuchará en el puerto 80 en tiempo de ejecución
EXPOSE 80

# Comando por defecto para iniciar Nginx en primer plano y mantener el proceso vivo
CMD ["nginx", "-g", "daemon off;"]