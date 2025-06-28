// Variables globales
let datosEjercicios = [];
let resultadosActuales = null;
let myChart = null;
let tipoDatoGrafica = "calorias";

// Inicialización cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos
    document.getElementById('btnCalcular').addEventListener('click', calcularEjercicio);
    document.getElementById('btnGuardar').addEventListener('click', guardarEjercicio);
    document.getElementById('btnVer').addEventListener('click', mostrarGrafica);
    document.getElementById('btnCargar').addEventListener('click', () => {
        document.getElementById('cargarArchivo').click();
    });
    document.getElementById('btnCargarUltima').addEventListener('click', cargarUltimaSesion);
    document.getElementById('cargarArchivo').addEventListener('change', cargarDatosDesdeArchivo);
    document.getElementById('closeModal').addEventListener('click', cerrarModal);
    
    // Configurar selector de datos para gráfica
    const options = document.querySelectorAll('.data-option');
    options.forEach(option => {
        option.addEventListener('click', function() {
            options.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            tipoDatoGrafica = this.getAttribute('data-type');
            if (document.getElementById('modalGrafica').style.display === 'block') {
                actualizarGrafica();
            }
        });
    });
    
    // Cargar datos iniciales desde URL
    cargarDatosIniciales();
});

async function cargarDatosIniciales() {
    try {
        const response = await fetch('https://yagopc.github.io/Ejercicios/datosejercicios.json');
        if (!response.ok) throw new Error('Error al cargar datos iniciales');
        datosEjercicios = await response.json();
        actualizarTotales();
        mostrarNotificacion('Datos iniciales cargados correctamente');
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        mostrarNotificacion('Error al cargar datos iniciales');
    }
}

function cargarUltimaSesion() {
    if (datosEjercicios.length === 0) {
        mostrarNotificacion('No hay sesiones guardadas');
        return;
    }
    
    const ultimaSesion = datosEjercicios[datosEjercicios.length - 1];
    
    document.getElementById('tipoDeporte').value = ultimaSesion.tipo || 'bicicleta';
    document.getElementById('tiempo').value = ultimaSesion.tiempo || 30;
    document.getElementById('edad').value = ultimaSesion.edad || 35;
    document.getElementById('peso').value = ultimaSesion.peso || 70;
    document.getElementById('velocidad').value = ultimaSesion.velocidad || 17;
    
    mostrarNotificacion('Última sesión cargada');
}

function cargarDatosDesdeArchivo(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            datosEjercicios = JSON.parse(event.target.result);
            mostrarNotificacion('Datos cargados correctamente');
            actualizarTotales();
        } catch (error) {
            mostrarNotificacion('Error: Archivo JSON no válido');
            console.error("Error al leer el archivo:", error);
        }
    };
    reader.onerror = () => {
        mostrarNotificacion('Error al leer el archivo');
    };
    reader.readAsText(file);
}

function calcularEjercicio() {
    const tiempo = parseInt(document.getElementById('tiempo').value) || 30;
    const edad = parseInt(document.getElementById('edad').value) || 35;
    const peso = parseFloat(document.getElementById('peso').value) || 70;
    const velocidad = parseFloat(document.getElementById('velocidad').value) || 17;
    const tipoDeporte = document.getElementById('tipoDeporte').value;
    
    // Validar datos
    if (tiempo <= 0 || edad <= 0 || peso <= 0 || velocidad <= 0) {
        mostrarNotificacion('Por favor, introduce valores válidos');
        return;
    }
    
    // Calcular distancia
    const tiempoHoras = tiempo / 60;
    const distancia = (velocidad * tiempoHoras).toFixed(1);
    
    // Calcular calorías con ajuste según tipo de deporte
    let met = tipoDeporte === "andar" ? 3.5 : 7.5;
    
    let calorias = met * peso * tiempoHoras;
    
    // Ajuste por edad
    const factorEdad = 1 - ((edad - 30) * 0.005);
    calorias *= Math.max(factorEdad, 0.85);
    
    // Redondear calorías
    calorias = Math.round(calorias);
    
    // Guardar resultados actuales
    resultadosActuales = {
        fecha: new Date().toISOString(),
        tiempo: tiempo,
        edad: edad,
        peso: peso,
        calorias: calorias,
        distancia: parseFloat(distancia),
        velocidad: velocidad,
        tipo: tipoDeporte
    };
    
    // Mostrar resultados
    mostrarResultados();
}

function mostrarResultados() {
    if (!resultadosActuales) return;
    
    document.getElementById('calorias').textContent = resultadosActuales.calorias + ' kcal';
    document.getElementById('distancia').textContent = resultadosActuales.distancia + ' km';
    document.getElementById('velocidad-usada').textContent = resultadosActuales.velocidad + ' km/h';
    document.getElementById('tipo-deporte').textContent = resultadosActuales.tipo === "bicicleta" ? "Bicicleta" : "Andar";
    
    // Calcular equivalente en pasos (aprox 0.04 kcal/paso)
    const pasos = Math.round(resultadosActuales.calorias / 0.04);
    document.getElementById('pasos').textContent = pasos.toLocaleString() + ' pasos';
    
    document.getElementById('resultados').style.display = 'block';
}

function guardarEjercicio() {
    if (!resultadosActuales) {
        mostrarNotificacion('Primero debes calcular los resultados');
        return;
    }
    
    // Agregar a los datos existentes
    datosEjercicios.push(resultadosActuales);
    
    // Ordenar por fecha
    datosEjercicios.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // Crear y descargar el JSON
    const blob = new Blob([JSON.stringify(datosEjercicios, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'datosejercicios.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Actualizar totales
    actualizarTotales();
    
    mostrarNotificacion('¡Datos guardados en datosejercicios.json!');
}

function actualizarTotales() {
    if (datosEjercicios.length === 0) {
        document.getElementById('totales').style.display = 'none';
        return;
    }
    
    let totalCalorias = 0;
    let totalKm = 0;
    
    datosEjercicios.forEach(ej => {
        totalCalorias += ej.calorias || 0;
        totalKm += ej.distancia || 0;
    });
    
    document.getElementById('total-calorias').textContent = totalCalorias.toLocaleString() + ' kcal';
    document.getElementById('total-km').textContent = totalKm.toFixed(1) + ' km';
    document.getElementById('totales').style.display = 'block';
}

function mostrarGrafica() {
    if (datosEjercicios.length === 0) {
        mostrarNotificacion('No hay datos de ejercicios guardados');
        return;
    }
    
    document.getElementById('modalGrafica').style.display = 'block';
    actualizarGrafica();
}

function actualizarGrafica() {
    if (datosEjercicios.length === 0) return;
    
    // Ordenar ejercicios por fecha
    const ejerciciosOrdenados = [...datosEjercicios].sort((a, b) => 
        new Date(a.fecha) - new Date(b.fecha)
    );
    
    const fechas = ejerciciosOrdenados.map(ej => 
        new Date(ej.fecha).toLocaleDateString()
    );
    
    // Obtener datos según el tipo seleccionado
    const datos = ejerciciosOrdenados.map(ej => ej[tipoDatoGrafica]);
    
    // Configurar etiquetas y colores
    let label, color, unidad;
    switch(tipoDatoGrafica) {
        case 'calorias':
            label = 'Calorías Quemadas';
            color = '#FF6384';
            unidad = 'kcal';
            break;
        case 'distancia':
            label = 'Distancia Recorrida';
            color = '#36A2EB';
            unidad = 'km';
            break;
        case 'peso':
            label = 'Peso Corporal';
            color = '#FFCE56';
            unidad = 'kg';
            break;
        case 'velocidad':
            label = 'Velocidad Media';
            color = '#4BC0C0';
            unidad = 'km/h';
            break;
        case 'tiempo':
            label = 'Tiempo de Ejercicio';
            color = '#9966FF';
            unidad = 'min';
            break;
        default:
            label = 'Calorías Quemadas';
            color = '#FF6384';
            unidad = 'kcal';
    }
    
    const ctx = document.getElementById('grafica').getContext('2d');
    
    // Destruir gráfica anterior si existe
    if (myChart) {
        myChart.destroy();
    }
    
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [{
                label: label,
                data: datos,
                borderColor: color,
                backgroundColor: color + '33',
                borderWidth: 3,
                pointBackgroundColor: color,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#fff',
                        font: {
                            size: 14
                        }
                    }
                },
                title: {
                    display: true,
                    text: label,
                    color: '#feb47b',
                    font: {
                        size: 18
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 50, 0.9)',
                    titleColor: '#ff7e5f',
                    bodyColor: '#fff',
                    borderColor: '#444',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const ejercicio = ejerciciosOrdenados[index];
                            return [
                                `${label}: ${ejercicio[tipoDatoGrafica]} ${unidad}`,
                                `Tipo: ${ejercicio.tipo === "bicicleta" ? "Bicicleta" : "Andar"}`,
                                `Duración: ${ejercicio.tiempo} min`,
                                `Fecha: ${fechas[index]}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: tipoDatoGrafica !== 'peso',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#fff',
                        font: {
                            size: 12
                        }
                    },
                    title: {
                        display: true,
                        text: unidad,
                        color: '#fff',
                        font: {
                            size: 14
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#fff',
                        font: {
                            size: 12
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    title: {
                        display: true,
                        text: 'Fecha',
                        color: '#fff',
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

function cerrarModal() {
    document.getElementById('modalGrafica').style.display = 'none';
}

function mostrarNotificacion(mensaje) {
    const notification = document.getElementById('notification');
    notification.textContent = mensaje;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}