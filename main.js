const calendarioDiv = document.getElementById('calendario');
const form = document.getElementById('form-turno');
const fechaInput = document.getElementById('fecha');
const turnoInput = document.getElementById('turno');
const cancelarBtn = document.getElementById('cancelar');
const modal = document.getElementById('modal-turno');
const infoTurno = document.getElementById('info-turno');
const eliminarBtn = document.getElementById('eliminar-turno');
const resetBtn = document.getElementById('reset-semana');
const navAnterior = document.getElementById('semana-anterior');
const navSiguiente = document.getElementById('semana-siguiente');
const rangoSemana = document.getElementById('rango-semana');



let offsetSemana = 0; 

const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const horarios = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00'
];

let turnos = JSON.parse(localStorage.getItem('turnos')) || {};
let celdaSeleccionada = null;


// Detecta si es pantalla chica
function esPantallaChica() {
    return window.innerWidth <= 700;
}

// Calcula el lunes de la semana actual
function getLunesActual(offset = 0) {
    const hoy = new Date();
    const dia = hoy.getDay();
    // 0 (domingo) debe ser -6, 1 (lunes) debe ser 0, etc.
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1) + offset * 7;
    const lunes = new Date(hoy);
    lunes.setDate(diff);
    return new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate());
}

function formatoFecha(fecha) {
    return fecha.toISOString().split('T')[0];
}

function mostrarRangoSemana(lunes) {
    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);
    rangoSemana.textContent = `${lunes.getDate()}/${lunes.getMonth()+1} - ${viernes.getDate()}/${viernes.getMonth()+1}`;
}

function renderCalendario() {
    calendarioDiv.innerHTML = '';
    const lunes = getLunesActual(offsetSemana);
    mostrarRangoSemana(lunes);
    let diasSemana = [];
    for (let i = 0; i < 5; i++) {
        let dia = new Date(lunes);
        dia.setDate(lunes.getDate() + i);
        diasSemana.push(new Date(dia)); // Asegura copia real
    }
    let tabla = '<table><thead><tr><th>Horario</th>';
    diasSemana.forEach(dia => {
        const nombreDia = dias[dia.getDay() - 1];
        const nombreMostrar = esPantallaChica() ? nombreDia.slice(0,3).toUpperCase() : nombreDia;
        tabla += `<th>${nombreMostrar}<br>${dia.getDate()}</th>`;
    });
    tabla += '</tr></thead><tbody>';

    horarios.forEach((horario, idx) => {
        if (horario === '14:00-15:00') {
            tabla += `<tr class="separador"><td colspan="6">TARDE</td></tr>`;
        }
        tabla += `<tr><td>${horario}</td>`;
        diasSemana.forEach(dia => {
            const fecha = formatoFecha(dia);
            const key = `${fecha}_${horario}`;
            const turno = turnos[key] || '';
            const esManiana = idx < 4;
            const esJueves = dia.getDay() === 4; // 4 = jueves

            // Bloqueos personalizados
            const diaSemana = dia.getDay(); // 1=Lunes, 2=Martes, ..., 5=Viernes

            let bloquear = false;
            // Lunes (1), Miércoles (3), Viernes (5): 14-15 y 15-16
            if ((diaSemana === 1 || diaSemana === 3 || diaSemana === 5) && (horario === '14:00-15:00' || horario === '15:00-16:00')) {
                bloquear = true;
            }
            // Martes (2): 19-20
            if (diaSemana === 2 && horario === '19:00-20:00') {
                bloquear = true;
            }
            // Jueves (4): 18-19 y 19-20
            if (diaSemana === 4 && (horario === '18:00-19:00' || horario === '19:00-20:00')) {
                bloquear = true;
            }
            // Mañana que no sea jueves (ya estaba)
            if (esManiana && !esJueves) {
                bloquear = true;
            }

            if (bloquear) {
                tabla += `<td class="no-disponible"></td>`;
            } else {
                let tipoClase = '';
                let nombreMostrar = '';
                if (turno) {
                    const partes = turno.split('|');
                    if (partes.length === 2) {
                        tipoClase = partes[0];
                        nombreMostrar = partes[1];
                    } else {
                        nombreMostrar = turno;
                    }
                }
                const ocupado = turno ? 'ocupado' : '';
                tabla += `<td class="turno ${ocupado} ${tipoClase}" data-key="${key}">${nombreMostrar}</td>`;
            }
        });
        tabla += '</tr>';
    });

    tabla += '</tbody></table>';
    calendarioDiv.innerHTML = tabla;

    document.querySelectorAll('td.turno').forEach(td => {
        td.onclick = () => {
            celdaSeleccionada = td.dataset.key;
            const [fecha, horario] = celdaSeleccionada.split('_');
            const fechaObj = new Date(fecha);
            const diaNumero = fechaObj.getDate();
            infoTurno.textContent = `${diaNumero} - ${horario}`;
            fechaInput.value = fecha;
            if (turnos[celdaSeleccionada]) {
                const partes = turnos[celdaSeleccionada].split('|');
                if (partes.length === 2) {
                    document.getElementById('tipo-turno').value = partes[0];
                    turnoInput.value = partes[1];
                } else {
                    document.getElementById('tipo-turno').value = '';
                    turnoInput.value = turnos[celdaSeleccionada];
                }
            } else {
                document.getElementById('tipo-turno').value = '';
                turnoInput.value = '';
            }
            fechaInput.disabled = true;
            modal.classList.add('activo'); // Mostrar modal
            form.style.display = 'flex';
            if (turnos[celdaSeleccionada]) {
                eliminarBtn.style.display = 'block';
            } else {
                eliminarBtn.style.display = 'none';
            }    
        };
    });
}

eliminarBtn.onclick = () => {
    if (celdaSeleccionada && turnos[celdaSeleccionada]) {
        delete turnos[celdaSeleccionada];
        localStorage.setItem('turnos', JSON.stringify(turnos));
        form.style.display = 'none';
        modal.classList.remove('activo');
        renderCalendario();
    }
};
resetBtn.onclick = () => {
    if (confirm('¿Seguro que quieres borrar todos los turnos de la semana?')) {
        // Calcular fechas de la semana visible
        const lunes = getLunesActual(offsetSemana);
        let diasSemana = [];
        for (let i = 0; i < 5; i++) {
            let dia = new Date(lunes);
            dia.setDate(lunes.getDate() + i);
            diasSemana.push(formatoFecha(dia));
        }
        // Eliminar solo los turnos de la semana visible
        Object.keys(turnos).forEach(key => {
            const [fecha] = key.split('_');
            if (diasSemana.includes(fecha)) {
                delete turnos[key];
            }
        });
        localStorage.setItem('turnos', JSON.stringify(turnos));
        renderCalendario();
    }
};

form.onsubmit = e => {
    e.preventDefault();
    if (celdaSeleccionada) {
        const tipo = document.getElementById('tipo-turno').value;
        turnos[celdaSeleccionada] = tipo + '|' + turnoInput.value;
        localStorage.setItem('turnos', JSON.stringify(turnos));
        form.style.display = 'none';
        modal.classList.remove('activo'); // Oculta el modal al guardar
        renderCalendario();
    }
};

cancelarBtn.onclick = () => {
    form.style.display = 'none';
    modal.classList.remove('activo'); // Oculta el modal al cancelar
};

navAnterior.onclick = () => {
    offsetSemana--;
    renderCalendario();
};
navSiguiente.onclick = () => {
    offsetSemana++;
    renderCalendario();
};


renderCalendario();

// Redibujar tabla al cambiar tamaño de pantalla
window.addEventListener('resize', renderCalendario);