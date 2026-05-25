// Configuración de la aplicación
const CONFIG = {    
    // Centro inicial del mapa
    center: {
        lat: -31.4422,
        lng: -64.2982
    },
    
    // Configuración de zoom general del mapa
    zoom: {
        default: 16,
        min: 10,
        max: 19,
        gps: 17
    },
    
    // URL base de los tiles
    tileUrl: "https://proaco-core.s3.us-east-2.amazonaws.com/docta-masterplan/masterplan-ventas/",
    
    // Configuración de opacidad
    opacity: {
        default: 0.8,
        min: 0,
        max: 1,
        step: 0.01
    },
    
    // Configuración del marcador GPS
    marker: {
        scale: 9,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2
    },
    
    // Configuración de geolocalización
    geolocation: {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
    },
    
    // Coordenadas límite reales de Docta (Malagueño)
    boundsDocta: {
        north: -31.4250, 
        south: -31.4650, 
        east: -64.2650,  
        west: -64.3250   
    }
};