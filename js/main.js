// Inicialización de la aplicación
let doctaMapInstance = null;

// Función de callback para Google Maps
function initMap() {
    try {
        // Crear instancia del mapa
        doctaMapInstance = new DoctaMap('map_canvas');
        doctaMapInstance.init();
        
        // Configurar controles de UI
        setupUIControls();
        
        // Iniciar seguimiento de ubicación
        doctaMapInstance.startTracking(
            (position) => {
                // Actualización exitosa
                console.log("Ubicación actualizada:", position);
            },
            (error) => {
                console.warn("Error de geolocalización:", error);
                showNotification("Error de ubicación: " + error, "error");
            }
        );
        
    } catch (error) {
        console.error("Error al inicializar el mapa:", error);
        showNotification("Error al cargar el mapa. Por favor, recarga la página.", "error");
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