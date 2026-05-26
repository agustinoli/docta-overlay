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
        const urlParams = new URLSearchParams(window.location.search);
        const paramLat = parseFloat(urlParams.get('lat'));
        const paramLng = parseFloat(urlParams.get('lng'));
        const paramZoom = parseInt(urlParams.get('zoom'));

        const centroInicial = (!isNaN(paramLat) && !isNaN(paramLng)) ? { lat: paramLat, lng: paramLng } : CONFIG.center;
        const zoomInicial = !isNaN(paramZoom) ? paramZoom : CONFIG.zoom.default;
        this.lastClickedLoteLatLng = null;

        this.map = new google.maps.Map(document.getElementById(this.mapElementId), {
            zoom: zoomInicial,
            center: centroInicial,
            mapTypeId: 'hybrid',
            mapTypeControl: true,
            mapTypeControlOptions: { position: google.maps.ControlPosition.LEFT_BOTTOM },
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
    
    loadGeoJsonData(onLoteClickCallback) {
        this.infoWindow = new google.maps.InfoWindow();

        this.map.data.setStyle((feature) => {
            const statusObj = feature.getProperty('status') || {};
            const estadoNormalizado = (statusObj.name || '').toLowerCase();
            let colorRelleno = "#0F9CDA";
            let opacidadRelleno = 0.15;
            let colorBorde = "#0F9CDA";

            if (estadoNormalizado === "disponible") {
                colorRelleno = "#1e8e3e";
                opacidadRelleno = 0.35;
                colorBorde = "#137333";
            } else if (estadoNormalizado === "vendido" || estadoNormalizado === "reservado") {
                colorRelleno = "#d93025";
                opacidadRelleno = 0.25;
                colorBorde = "#b06000";
            }

            return {
                fillColor: colorRelleno,
                fillOpacity: opacidadRelleno,
                strokeColor: colorBorde,
                strokeWeight: 1.2,
                strokeOpacity: 0.6,
                clickable: true
            };
        });

        fetch(CONFIG.geoJsonUrl)
            .then(response => response.json())
            .then(geoJsonData => { this.map.data.addGeoJson(geoJsonData); })
            .catch(err => console.error("Error GeoJSON:", err));

        // ESCUCHA DEL CLIC ACTUALIZADA CON PRODUCT Y CITY
        this.map.data.addListener('click', (event) => {
            const statusObj = event.feature.getProperty('status') || {};
            const productObj = event.feature.getProperty('product') || {}; // Sub-objeto del producto
            
            const propiedades = {
                id: event.feature.getProperty('unit_id') || event.feature.id || 'N/A',
                etapa: event.feature.getProperty('stage') || 'N/A',
                manzana: event.feature.getProperty('sector') || 'N/A',
                lote: event.feature.getProperty('unit') || 'N/A',
                superficie: event.feature.getProperty('square_meters') || 'N/A',
                precio: event.feature.getProperty('formated_price') || 'Consultar',
                estado: statusObj.name || 'Desconocido',
                // NUEVOS CAMPOS:
                producto: productObj.name || 'N/A',
                ciudad: event.feature.getProperty('city') || 'MALAGUEÑO'
            };

            // Guardamos la coordenada exacta de este lote clicado para usarla en shareLocation()
            this.lastClickedLoteLatLng = event.latLng;

            const posicionPopup = event.latLng;

            if (onLoteClickCallback) {
                onLoteClickCallback(propiedades, posicionPopup, this.infoWindow, this.map);
            }
        });

        // Si el usuario cierra el Popup manualmente, limpiamos la selección del lote
        this.infoWindow.addListener('closeclick', () => {
            this.lastClickedLoteLatLng = null;
        });
    }

    // COMPARTIR UBICACIÓN INTELIGENTE (js/map.js)
    shareLocation() {
        // Prioridad 1: Coordenada del lote clickeado. Prioridad 2: Centro de la pantalla.
        const ubicacionDestino = this.lastClickedLoteLatLng || this.map.getCenter();
        const zoomActual = this.map.getZoom();

        if (ubicacionDestino) {
            // Soporta tanto objetos LatLng de Google (funciones .lat()) como objetos nativos si hiciera falta
            const lat = (typeof ubicacionDestino.lat === 'function') ? ubicacionDestino.lat().toFixed(6) : ubicacionDestino.lat;
            const lng = (typeof ubicacionDestino.lng === 'function') ? ubicacionDestino.lng().toFixed(6) : ubicacionDestino.lng;
            
            const baseAppUrl = window.location.origin + window.location.pathname;
            const miMapaLink = `${baseAppUrl}?lat=${lat}&lng=${lng}&zoom=${zoomActual}`;
            
            const textoMensaje = encodeURIComponent(`¡Hola! Te comparto la ubicación exacta de este lote en Docta: ${miMapaLink}`);
            window.open(`https://wa.me/?text=${textoMensaje}`, '_blank');
            return true;
        }
        return false;
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