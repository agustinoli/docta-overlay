FROM nginx:alpine

# Declaramos el argumento que recibirá la clave durante el build
ARG GOOGLE_MAPS_API_KEY

# Copiamos la configuración de Nginx y los archivos del proyecto
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html/

# Reemplazamos el placeholder __API_KEY__ por el valor real de la variable
RUN sed -i "s/__API_KEY__/${GOOGLE_MAPS_API_KEY}/g" /usr/share/nginx/html/index.html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]