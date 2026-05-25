// Clase para manejar el mapa
class DoctaMap {
    constructor(mapElementId) {
        this.mapElementId = mapElementId;
        this.map = null;
        this.userMarker = null;
        this.currentPos = null;
        this.doctaTileLayer = null;
        this.watchId = null;
    }
    
    // Inicializar el mapa
    init() {
        this.map = new google.maps.Map(document.getElementById(this.mapElementId), {
            zoom: CONFIG.zoom.default,
            center: CONFIG.center,
            mapTypeId: 'hybrid',
            mapTypeControl: true,
            mapTypeControlOptions: { 
                position: google.maps.ControlPosition.LEFT_BOTTOM 
            },
            fullscreenControl: false,
            streetViewControl: false,
            minZoom: CONFIG.zoom.min,
            maxZoom: CONFIG.zoom.max
            // Se eliminó por completo el bloque 'restriction' para dar libre movimiento
        });
        
        this.initTileLayer();
        return this;
    }
    
    // Inicializar la capa de tiles filtrando por coordenadas geográficas de pantalla
    initTileLayer() {
        // 1. Creamos la "caja protectora" de Docta usando la API de Google
        const boundingBoxDocta = new google.maps.LatLngBounds(
            new google.maps.LatLng(CONFIG.boundsDocta.south, CONFIG.boundsDocta.west), // Suroeste
            new google.maps.LatLng(CONFIG.boundsDocta.north, CONFIG.boundsDocta.east)  // Noreste
        );

        this.doctaTileLayer = new google.maps.ImageMapType({
            getTileUrl: (coord, zoom) => {
                // 2. Si el mapa aún está cargando o no tiene coordenadas de pantalla, dejamos pasar
                if (!this.map.getBounds()) {
                    return `${CONFIG.tileUrl}${zoom}/${coord.x}/${coord.y}.png`;
                }

                // 3. Obtenemos el rectángulo de lo que el usuario ve actualmente en su pantalla
                const pantallaActual = this.map.getBounds();

                // 4. VALIDACIÓN CRUCIAL: ¿Lo que ve el usuario interseca con Docta?
                if (!boundingBoxDocta.intersects(pantallaActual)) {
                    // Si NO se tocan (ej. está mirando Nueva Córdoba), abortamos la petición.
                    // No se genera tráfico hacia el S3 de Proaco.
                    return null; 
                }

                // 5. Si está posicionado sobre Docta, la petición se realiza normalmente
                return `${CONFIG.tileUrl}${zoom}/${coord.x}/${coord.y}.png`;
            },
            tileSize: new google.maps.Size(256, 256),
            name: "DoctaPlan",
            maxZoom: CONFIG.zoom.max,
            minZoom: CONFIG.zoom.min,
            opacity: CONFIG.opacity.default,
            isPng: true
        });
        
        this.map.overlayMapTypes.insertAt(0, this.doctaTileLayer);
    }
    
    // Cambiar opacidad de la capa
    setOpacity(value) {
        if (this.doctaTileLayer) {
            const opacity = Math.min(Math.max(value, CONFIG.opacity.min), CONFIG.opacity.max);
            this.doctaTileLayer.setOpacity(opacity);
            return opacity;
        }
        return null;
    }
    
    // Centrar mapa en posición del usuario
    centerOnUser() {
        if (this.currentPos) {
            this.map.setCenter(this.currentPos);
            this.map.setZoom(CONFIG.zoom.gps);
            return true;
        }
        return false;
    }
    
    // Obtener ubicación actual
    getCurrentLocation() {
        return this.currentPos;
    }
    
    // Iniciar seguimiento de ubicación
    startTracking(onLocationUpdate, onError) {
        if (!navigator.geolocation) {
            if (onError) onError("Geolocalización no soportada");
            return null;
        }
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentPos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                
                this.updateUserMarker();
                
                if (onLocationUpdate) {
                    onLocationUpdate(this.currentPos);
                }
            },
            (error) => {
                if (onError) onError(this.getGeolocationErrorMessage(error));
            },
            CONFIG.geolocation
        );
        
        return this.watchId;
    }
    
    // Actualizar o crear marcador de usuario
    updateUserMarker() {
        if (this.userMarker) {
            this.userMarker.setPosition(this.currentPos);
        } else {
            this.userMarker = new google.maps.Marker({
                position: this.currentPos,
                map: this.map,
                title: "Estás aquí",
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: CONFIG.marker.scale,
                    fillColor: CONFIG.marker.fillColor,
                    fillOpacity: CONFIG.marker.fillOpacity,
                    strokeColor: CONFIG.marker.strokeColor,
                    strokeWeight: CONFIG.marker.strokeWeight,
                },
                zIndex: 1000
            });
        }
    }
    
    // Obtener mensaje de error de geolocalización
    getGeolocationErrorMessage(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                return "Permiso de ubicación denegado";
            case error.POSITION_UNAVAILABLE:
                return "Información de ubicación no disponible";
            case error.TIMEOUT:
                return "Tiempo de espera agotado";
            default:
                return "Error desconocido al obtener ubicación";
        }
    }
    
    // Detener seguimiento
    stopTracking() {
        if (this.watchId && navigator.geolocation) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }
    
    // Compartir ubicación por WhatsApp
    shareLocation() {
        if (this.currentPos) {
            const mapaLink = `https://www.google.com/maps?q=${this.currentPos.lat},${this.currentPos.lng}`;
            const textoMensaje = encodeURIComponent(`¡Hola! Te comparto la ubicación exacta del lote en Docta: ${mapaLink}`);
            window.open(`https://wa.me/?text=${textoMensaje}`, '_blank');
            return true;
        }
        return false;
    }
    
    // Destruir mapa y limpiar recursos
    destroy() {
        this.stopTracking();
        if (this.userMarker) {
            this.userMarker.setMap(null);
        }
        if (this.doctaTileLayer) {
            // Limpiar la capa de tiles si es necesario
        }
        if (this.map) {
            google.maps.event.clearInstanceListeners(this.map);
        }
    }
}