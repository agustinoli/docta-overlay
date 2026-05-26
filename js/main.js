// Inicialización de la aplicación
let doctaMapInstance = null;

// Función de callback para Google Maps
// js/main.js

function initMap() {
    try {
        // Instanciar e inicializar mapa base e imágenes S3
        doctaMapInstance = new DoctaMap('map_canvas');
        doctaMapInstance.init();
        
        // Configurar los botones de la interfaz
        setupUIControls();
        
        // js/main.js -> Dentro de initMap()

        // ACTIVACIÓN DEL MAPA VECTORIAL CON POPUP INTERACTIVO
        doctaMapInstance.loadGeoJsonData((datosLote, posicion, infoWindow, mapaNativo) => {
            console.log("Lote seleccionado para Popup con metadata extendida:", datosLote);
            
            let colorEstado = "#4285F4";
            const estadoNormalizado = datosLote.estado.toLowerCase();
            if (estadoNormalizado === "vendido" || estadoNormalizado === "reservado") {
                colorEstado = "#d93025";
            } else if (estadoNormalizado === "disponible") {
                colorEstado = "#1e8e3e";
            }

            // DISEÑO DEL POPUP ACTUALIZADO CON PRODUCTO Y CIUDAD
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; padding: 5px; min-width: 200px; color: #333; line-height: 1.4;">
                    <h4 style="margin: 0 0 8px 0; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 4px; color: #1a73e8; font-weight: bold;">
                        Mz: ${datosLote.manzana} — Lote: ${datosLote.lote}
                    </h4>
                    <p style="margin: 3px 0; font-size: 12px;"><strong>Desarrollo:</strong> ${datosLote.producto}</p>
                    <p style="margin: 3px 0; font-size: 12px;"><strong>Etapa:</strong> ${datosLote.etapa}</p>
                    <p style="margin: 3px 0; font-size: 12px;"><strong>Superficie:</strong> ${datosLote.superficie} m²</p>
                    <p style="margin: 3px 0; font-size: 12px;"><strong>Ubicación:</strong> ${datosLote.ciudad}</p>
                    <p style="margin: 5px 0 3px 0; font-size: 13px;"><strong>Precio:</strong> <span style="color: #202124; font-weight: bold;">${datosLote.precio}</span></p>
                    <div style="margin-top: 8px; display: inline-block; padding: 3px 8px; border-radius: 4px; color: white; font-size: 10px; font-weight: bold; background-color: ${colorEstado}; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${datosLote.estado}
                    </div>
                </div>
            `;

            infoWindow.setContent(htmlContent);
            infoWindow.setPosition(posicion);
            infoWindow.open(mapaNativo);
        });
        
    } catch (error) {
        console.error("Error al inicializar el mapa:", error);
        showNotification("Error al cargar el mapa.", "error");
    }
}
// Configurar controles de interfaz de usuario
function setupUIControls() {
    // Control de opacidad
    const opacitySlider = document.getElementById("fader");
    const opacityValue = document.getElementById("opacityValue");
    
    if (opacitySlider) {
        opacitySlider.addEventListener("input", (e) => {
            const valorOpacidad = parseFloat(e.target.value);
            const newOpacity = doctaMapInstance.setOpacity(valorOpacidad);
            if (opacityValue && newOpacity !== null) {
                opacityValue.textContent = `${Math.round(newOpacity * 100)}%`;
            }
        });
    }
    
    // Botón centrar GPS
    const centerBtn = document.getElementById("btnCentrar");
    if (centerBtn) {
        centerBtn.addEventListener("click", () => {
            const success = doctaMapInstance.centerOnUser();
            if (!success) {
                showNotification("Obteniendo ubicación... Por favor espera.", "info");
            }
        });
    }
    
    // Botón compartir WhatsApp
    const shareBtn = document.getElementById("btnCompartir");
    if (shareBtn) {
        shareBtn.addEventListener("click", () => {
            const success = doctaMapInstance.shareLocation();
            if (!success) {
                showNotification("Esperando señal de GPS activa...", "warning");
            }
        });
    }
    
    // Botón información
    const infoBtn = document.getElementById("btnInfo");
    if (infoBtn) {
        infoBtn.addEventListener("click", showInfoModal);
    }
}

// Mostrar modal de información
function showInfoModal() {
    // Crear modal dinámicamente si no existe
    let modal = document.getElementById("infoModal");
    
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "infoModal";
        modal.className = "modal";
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h3>Docta Masterplan</h3>
                <p><strong>Urbanización Docta</strong></p>
                <p>📍 Ubicación: Malagueño, Córdoba</p>
                <p>🗺️ Lotes y parcelas disponibles</p>
                <p>📐 Vista híbrida con plano superpuesto</p>
                <p>🔍 Ajusta la opacidad del plano</p>
                <hr>
                <p style="font-size: 12px; color: #666;">
                    Para más información, contacta con ventas
                </p>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Configurar cierre del modal
        const closeBtn = modal.querySelector(".close-btn");
        closeBtn.onclick = () => modal.style.display = "none";
        
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };
    }
    
    modal.style.display = "block";
}

// Mostrar notificaciones temporales
function showNotification(message, type = "info") {
    // Crear elemento de notificación
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#4caf50'};
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Limpiar recursos al cerrar página
window.addEventListener('beforeunload', () => {
    if (doctaMapInstance) {
        doctaMapInstance.destroy();
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('PWA: Service Worker registrado con éxito en el alcance:', registration.scope);
            })
            .catch((error) => {
                console.error('PWA: Falló el registro del Service Worker:', error);
            });
    });
}