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
    
// Inicializar el mapa (js/map.js)
    init() {
        // 1. LEER QUERY PARAMS: Extraemos lat, lng y zoom de la URL si existen
        const urlParams = new URLSearchParams(window.location.search);
        const paramLat = parseFloat(urlParams.get('lat'));
        const paramLng = parseFloat(urlParams.get('lng'));
        const paramZoom = parseInt(urlParams.get('zoom'));

        // 2. DETERMINAR CENTRO Y ZOOM: Si vienen en la URL usamos esos, si no, el CONFIG por defecto
        const centroInicial = (!isNaN(paramLat) && !isNaN(paramLng)) 
            ? { lat: paramLat, lng: paramLng } 
            : CONFIG.center;

        const zoomInicial = !isNaN(paramZoom) 
            ? paramZoom 
            : CONFIG.zoom.default;

        // 3. INICIALIZAR GOOGLE MAPS
        this.map = new google.maps.Map(document.getElementById(this.mapElementId), {
            zoom: zoomInicial,
            center: centroInicial,
            mapTypeId: 'hybrid',
            mapTypeControl: true,
            mapTypeControlOptions: { 
                position: google.maps.ControlPosition.LEFT_BOTTOM 
            },
            fullscreenControl: false,
            streetViewControl: false,
            minZoom: CONFIG.zoom.min,
            maxZoom: CONFIG.zoom.max
        });
        
        this.initTileLayer();
        return this;
    }
    
    // Inicializar la capa de tiles (js/map.js)
    initTileLayer() {
        this.doctaTileLayer = new google.maps.ImageMapType({
            getTileUrl: (coord, zoom) => {
                // Doble check de seguridad por si el GPS o un método fuerza un zoom mayor
                if (zoom < 14 || zoom > 19) {
                    return null;
                }
                return `${CONFIG.tileUrl}${zoom}/${coord.x}/${coord.y}.png`;
            },
            tileSize: new google.maps.Size(256, 256),
            name: "DoctaPlan",
            maxZoom: 19, // Clavado en 19
            minZoom: 14,
            opacity: CONFIG.opacity.default
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
    
    // Actualizar o crear marcador de usuario (Versión Moderna Avanzada)
    updateUserMarker() {
        if (this.userMarker) {
            this.userMarker.position = this.currentPos;
        } else {
            // Creamos un punto azul HTML nativo para el GPS
            const pinGps = document.createElement("div");
            pinGps.style.width = "16px";
            pinGps.style.height = "16px";
            pinGps.style.backgroundColor = CONFIG.marker.fillColor;
            pinGps.style.borderRadius = "50%";
            pinGps.style.border = `${CONFIG.marker.strokeWeight}px solid ${CONFIG.marker.strokeColor}`;
            pinGps.style.boxShadow = "0 0 6px rgba(0,0,0,0.4)";

            // Instanciamos el marcador moderno de Google sin deprecated
            this.userMarker = new google.maps.marker.AdvancedMarkerElement({
                position: this.currentPos,
                map: this.map,
                content: pinGps,
                title: "Estás aquí"
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
    
    // Compartir ubicación por WhatsApp apuntando a tu propia app (js/map.js)
    shareLocation() {
        // Usamos la posición del centro actual del mapa o la del GPS del usuario. 
        // Para vendedores, es mejor usar el centro de la pantalla actual para que apunten al lote exacto.
        const centroActual = this.map.getCenter();
        const zoomActual = this.map.getZoom();

        if (centroActual) {
            const lat = centroActual.lat().toFixed(6);
            const lng = centroActual.lng().toFixed(6);
            
            // Construimos el enlace dinámico apuntando al dominio actual de tu web
            const baseAppUrl = window.location.origin + window.location.pathname;
            const miMapaLink = `${baseAppUrl}?lat=${lat}&lng=${lng}&zoom=${zoomActual}`;
            
            const textoMensaje = encodeURIComponent(`¡Hola! Te comparto la ubicación exacta del lote en Docta: ${miMapaLink}`);
            window.open(`https://wa.me/?text=${textoMensaje}`, '_blank');
            return true;
        }
        return false;
    }
    
    // Destruir mapa y limpiar recursos
    destroy() {
        this.stopTracking();
        if (this.userMarker) {
            this.userMarker.map = null;
        }
        if (this.map) {
            google.maps.event.clearInstanceListeners(this.map);
        }
    }
}