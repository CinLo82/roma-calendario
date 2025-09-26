const calendarioDiv = document.getElementById('calendario');
const form = document.getElementById('form-turno');
const fechaInput = document.getElementById('fecha');
const turnoInput = document.getElementById('turno');
const cancelarBtn = document.getElementById('cancelar');
const modal = document.getElementById('modal-turno');
const infoTurno = document.getElementById('info-turno');
const eliminarBtn = document.getElementById('eliminar-turno');
const resetBtn = document.getElementById('reset-semana');

let offsetSemana = 0; // 0 = semana actual, -1 = anterior, +1 = siguiente
const navAnterior = document.getElementById('semana-anterior');
const navSiguiente = document.getElementById('semana-siguiente');
const rangoSemana = document.getElementById('rango-semana');

const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const horarios = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00'
];

let turnos = JSON.parse(localStorage.getItem('turnos')) || {};
let celdaSeleccionada = null;

// Calcula el lunes de la semana actual
function getLunesActual(offset = 0) {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1) + offset * 7;
    return new Date(hoy.setDate(diff));
}

function formatoFecha(fecha) {
    return fecha.toISOString().split('T')[0];
}


function renderCalendario() {
    calendarioDiv.innerHTML = '';
    const lunes = getLunesActual(offsetSemana);
    mostrarRangoSemana(lunes);
    let diasSemana = [];
    for (let i = 0; i < 5; i++) {
        let dia = new Date(lunes);
        dia.setDate(lunes.getDate() + i);
        diasSemana.push(dia);
    }

    let tabla = '<table><thead><tr><th>Horario</th>';
    diasSemana.forEach(dia => {
        tabla += `<th>${dias[dia.getDay() - 1]}<br>${dia.getDate()}</th>`;
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
        tabla += `<td class="turno" data-key="${key}">${turno}</td>`;
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
            turnoInput.value = turnos[celdaSeleccionada] || '';
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

function mostrarRangoSemana(lunes) {
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 4);
    rangoSemana.textContent = `${lunes.getDate()}/${lunes.getMonth()+1} - ${domingo.getDate()}/${domingo.getMonth()+1}`;
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
        turnos[celdaSeleccionada] = turnoInput.value;
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