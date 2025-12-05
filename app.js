const fmtDate = (d=new Date()) => {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const KEY = 'parqueadero_registros_v1';
const loadAll = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const saveAll = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));
const onlyToday = (arr) => arr.filter(r => r.fecha.slice(0,10) === todayISO());

function render() {
  const tbody = document.querySelector('#tabla tbody');
  tbody.innerHTML = '';
  const data = onlyToday(loadAll());
  data.forEach((r, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.fecha}</td>
      <td>${r.accion}</td>
      <td>${r.placa}</td>
      <td>${r.grupo || ''}</td>
      <td>${r.monto ?? ''}</td>
      <td>${r.obs || ''}</td>
      <td class="table-actions"><button data-i="${idx}">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button[data-i]').forEach(btn => {
    btn.addEventListener('click', () => {
      const all = loadAll();
      const day = onlyToday(all);
      const item = day[btn.dataset.i];
      const pos = all.findIndex(r => r.id === item.id);
      all.splice(pos, 1);
      saveAll(all);
      render();
    });
  });
}

document.getElementById('regForm').addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const registro = {
    id: crypto.randomUUID(),
    fecha: fmtDate(new Date()),
    accion: fd.get('accion'),
    placa: fd.get('placa').trim().toUpperCase(),
    grupo: fd.get('grupo')?.trim(),
    monto: fd.get('monto') ? Number(fd.get('monto')) : null,
    obs: fd.get('obs')?.trim(),
    synced: false
  };
  const all = loadAll();
  all.unshift(registro);
  saveAll(all);
  e.target.reset();
  render();
});

document.getElementById('exportCsv').addEventListener('click', () => {
  const rows = onlyToday(loadAll());
  const headers = ['Fecha/Hora','Acción','Placa','Grupo','Monto','Observaciones'];
  const csv = [headers.join(',')].concat(
    rows.map(r => [
      r.fecha, r.accion, r.placa, r.grupo || '', r.monto ?? '', (r.obs || '').replace(/,/g,';')
    ].join(','))
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `parqueadero_${todayISO()}.csv`; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('printBtn').addEventListener('click', () => {
  window.print();
});

const syncStatus = document.getElementById('syncStatus');
document.getElementById('