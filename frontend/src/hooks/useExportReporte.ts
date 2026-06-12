// ============================================================
// useExportReporte.ts
// Exportación de reportes a PDF y Excel/XLSX.
// Dependencias: jspdf@^4.2.1  jspdf-autotable@^5.0.8  xlsx@^0.18.5
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import * as XLSX from 'xlsx'

import type { ReporteCitas, ReporteDoctor, ReporteEdad, ReporteEspecialidad } from '../types'

// ─── Tipos internos ──────────────────────────────────────────

type TipoReporte =
  | 'citas' | 'doctores' | 'especialidades' | 'edades'
  | 'listado_doctores' | 'listado_horarios' | 'listado_citas'

interface ExportBase { desde: string; hasta: string }

// ── Tipos para Reportes ───────────────────────────────────────
interface ExportCitas          extends ExportBase { tipo: 'citas';          datos: ReporteCitas }
interface ExportDoctores       extends ExportBase { tipo: 'doctores';       datos: { doctores: ReporteDoctor[]; totales: any } }
interface ExportEspecialidades extends ExportBase { tipo: 'especialidades'; datos: { especialidades: ReporteEspecialidad[]; total: number } }
interface ExportEdades         extends ExportBase { tipo: 'edades';         datos: { rangos: ReporteEdad[]; total: number } }

// ── Tipos para Listados ───────────────────────────────────────
interface ExportListadoDoctores extends ExportBase { tipo: 'listado_doctores'; datos: any[]; filtroEstado?: string }
interface ExportListadoHorarios extends ExportBase { tipo: 'listado_horarios'; datos: any[] }
interface ExportListadoCitas    extends ExportBase { tipo: 'listado_citas';    datos: any[]; filtroEstado?: string }

export type ExportPayload =
  | ExportCitas
  | ExportDoctores
  | ExportEspecialidades
  | ExportEdades
  | ExportListadoDoctores
  | ExportListadoHorarios
  | ExportListadoCitas

// ─── Helpers ─────────────────────────────────────────────────

const formatFechaLabel = (iso: string): string => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const nombreArchivo = (tipo: TipoReporte, desde: string, hasta: string): string => {
  const labels: Record<TipoReporte, string> = {
    citas:            'Reporte_Citas',
    doctores:         'Reporte_Doctores',
    especialidades:   'Reporte_Especialidades',
    edades:           'Reporte_Edades',
    listado_doctores: 'Listado_Doctores',
    listado_horarios: 'Listado_Horarios',
    listado_citas:    'Listado_Citas',
  }
  const d = desde.replace(/-/g, '')
  const h = hasta.replace(/-/g, '')
  const sufijo = d && h ? `_${d}_${h}` : d ? `_${d}` : ''
  return `${labels[tipo]}${sufijo}`
}

const tituloReporte = (tipo: TipoReporte): string => {
  const labels: Record<TipoReporte, string> = {
    citas:            'Reporte de Citas Médicas',
    doctores:         'Reporte de Rendimiento de Doctores',
    especialidades:   'Reporte de Especialidades',
    edades:           'Reporte de Distribución por Edades',
    listado_doctores: 'Listado de Doctores',
    listado_horarios: 'Listado de Horarios',
    listado_citas:    'Listado de Citas',
  }
  return labels[tipo]
}

const fechaHoraActual = (): string =>
  new Date().toLocaleDateString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const formatFechaUTC = (fecha: string): string =>
  new Date(fecha).toLocaleDateString('es-BO', {
    timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric',
  })

// ─── EXPORTACIÓN PDF ─────────────────────────────────────────

export const exportarPDF = (payload: ExportPayload): void => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const titulo  = tituloReporte(payload.tipo)
  const periodo = `Período: ${formatFechaLabel(payload.desde)} — ${formatFechaLabel(payload.hasta)}`

  // ── Banda de encabezado ───────────────────────────────────
  doc.setFillColor(26, 35, 50)   // #1a2332 — color corporativo del sidebar
  doc.rect(0, 0, 297, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('CENTROSOFT', 14, 10)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Gestión Médica', 14, 16)
  doc.text(`Generado: ${fechaHoraActual()}`, 283, 16, { align: 'right' })

  // ── Título del reporte ────────────────────────────────────
  doc.setTextColor(26, 35, 50)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, 14, 32)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(periodo, 14, 38)
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 41, 283, 41)

  const startY = 47

  const estilosBase = {
    styles:             { fontSize: 8, cellPadding: 2.5 },
    headStyles:         { fillColor: [26, 35, 50] as [number, number, number], textColor: 255 as number, fontStyle: 'bold' as const },
    alternateRowStyles: { fillColor: [245, 247, 250] as [number, number, number] },
    margin:             { left: 14, right: 14 },
  }

  // ── Tabla según tipo ──────────────────────────────────────

  if (payload.tipo === 'citas') {
    const { datos } = payload as ExportCitas
    const t = datos.totales

    // Resumen compacto sobre la tabla
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 35, 50)
    doc.text('Resumen del período:', 14, startY - 4)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text(
      `Total: ${t.total}   Atendidas: ${t.atendidas}   Canceladas: ${t.canceladas}   ` +
      `Inasistentes: ${t.inasistentes}   Programadas: ${t.programadas}   En espera: ${t.en_espera}`,
      14, startY + 1
    )

    autoTable(doc, {
      ...estilosBase,
      startY: startY + 8,
      head: [['Fecha', 'Hora', 'Paciente', 'Doctor', 'Especialidad', 'Estado']],
      body: datos.detalle.map((c: any) => [
        formatFechaUTC(c.fecha),
        String(c.hora).substring(0, 5),
        c.paciente,
        c.medico,
        c.especialidad,
        c.estado,
      ]),
      columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 16 }, 5: { cellWidth: 26 } },
    })

  } else if (payload.tipo === 'doctores') {
    const { datos } = payload as ExportDoctores

    autoTable(doc, {
      ...estilosBase,
      startY,
      head: [['Doctor', 'Total', 'Atendidas', 'Inasistentes', 'Canceladas', '% Rendimiento', '% Inasistencia']],
      body: [
        ...datos.doctores.map((d: any) => [
          d.nombre, d.total_citas, d.atendidas, d.inasistentes, d.canceladas,
          `${d.porcentaje_rendimiento}%`, `${d.porcentaje_inasistencia}%`,
        ]),
        ['TOTALES', datos.totales.total_citas, datos.totales.atendidas,
         datos.totales.inasistentes, datos.totales.canceladas ?? '—',
         `${datos.totales.porcentaje_rendimiento}%`, '—'],
      ],
      didParseCell: (data) => {
        if (data.row.index === datos.doctores.length) {
          data.cell.styles.fillColor  = [26, 35, 50]
          data.cell.styles.textColor  = 255
          data.cell.styles.fontStyle  = 'bold'
        }
      },
    })

  } else if (payload.tipo === 'especialidades') {
    const { datos } = payload as ExportEspecialidades

    autoTable(doc, {
      ...estilosBase,
      startY,
      head: [['Especialidad', 'Cantidad de Citas', 'Porcentaje (%)', 'Doctores Activos']],
      body: [
        ...datos.especialidades.map((e: any) => [
          e.especialidad, e.cantidad, `${e.porcentaje}%`, e.doctores_activos,
        ]),
        ['TOTAL', String(datos.total), '100%', '—'],
      ],
      didParseCell: (data) => {
        if (data.row.index === datos.especialidades.length) {
          data.cell.styles.fillColor = [26, 35, 50]
          data.cell.styles.textColor = 255
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })

  } else if (payload.tipo === 'edades') {
    const { datos } = payload as ExportEdades

    autoTable(doc, {
      ...estilosBase,
      startY,
      head: [['Rango de Edad', 'Categoría', 'Cantidad', 'Porcentaje (%)']],
      body: [
        ...datos.rangos.map((r: any) => [r.rango, r.categoria, r.cantidad, `${r.porcentaje}%`]),
        ['TOTAL', '—', String(datos.total), '100%'],
      ],
      didParseCell: (data) => {
        if (data.row.index === datos.rangos.length) {
          data.cell.styles.fillColor = [26, 35, 50]
          data.cell.styles.textColor = 255
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })

  // ── Listado de Doctores ───────────────────────────────────
  } else if (payload.tipo === 'listado_doctores') {
    const p = payload as ExportListadoDoctores
    if (p.filtroEstado) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Filtro aplicado — Estado: ${p.filtroEstado}`, 14, startY - 2)
    }
    autoTable(doc, {
      ...estilosBase,
      startY: p.filtroEstado ? startY + 4 : startY,
      head: [['Nombre', 'Especialidades', 'Email', 'Teléfono', 'Estado']],
      body: p.datos.map((d: any) => [
        d.nombre,
        d.especialidades || '—',
        d.email || '—',
        d.telefono || '—',
        d.estado,
      ]),
    })

  // ── Listado de Horarios ───────────────────────────────────
  } else if (payload.tipo === 'listado_horarios') {
    const p = payload as ExportListadoHorarios
    autoTable(doc, {
      ...estilosBase,
      startY,
      head: [['Médico', 'Especialidad', 'Días', 'Turno Mañana', 'Turno Tarde', 'Duración']],
      body: p.datos.map((h: any) => [
        h.medico,
        h.especialidad,
        h.dias,
        h.hora_inicio_manana && h.hora_fin_manana
          ? `${h.hora_inicio_manana.substring(0,5)} - ${h.hora_fin_manana.substring(0,5)}`
          : '—',
        h.hora_inicio_tarde && h.hora_fin_tarde
          ? `${h.hora_inicio_tarde.substring(0,5)} - ${h.hora_fin_tarde.substring(0,5)}`
          : '—',
        `${h.duracion_cita_min} min`,
      ]),
    })

  // ── Listado de Citas ──────────────────────────────────────
  } else if (payload.tipo === 'listado_citas') {
    const p = payload as ExportListadoCitas
    const filtros: string[] = []
    if (p.desde)        filtros.push(`Desde: ${formatFechaLabel(p.desde)}`)
    if (p.hasta)        filtros.push(`Hasta: ${formatFechaLabel(p.hasta)}`)
    if (p.filtroEstado) filtros.push(`Estado: ${p.filtroEstado}`)
    if (filtros.length) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Filtros aplicados — ${filtros.join('   ')}`, 14, startY - 2)
    }
    autoTable(doc, {
      ...estilosBase,
      startY: filtros.length ? startY + 4 : startY,
      head: [['Fecha', 'Hora', 'Paciente', 'Doctor', 'Especialidad', 'Estado']],
      body: p.datos.map((c: any) => [
        formatFechaUTC(c.fecha),
        String(c.hora).substring(0, 5),
        c.paciente,
        c.medico,
        c.especialidad,
        c.estado,
      ]),
      columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 16 }, 5: { cellWidth: 26 } },
    })
  }

  // ── Pie de página en cada hoja ────────────────────────────
  const totalPaginas: number = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(160, 160, 160)
    doc.text(
      `Página ${i} de ${totalPaginas}  —  CENTROSOFT © ${new Date().getFullYear()}`,
      148.5, 207, { align: 'center' }
    )
  }

  doc.save(`${nombreArchivo(payload.tipo, payload.desde, payload.hasta)}.pdf`)
}

// ─── EXPORTACIÓN EXCEL / XLSX ────────────────────────────────

export const exportarExcel = (payload: ExportPayload): void => {
  const titulo  = tituloReporte(payload.tipo)
  const periodo = `Período: ${formatFechaLabel(payload.desde)} — ${formatFechaLabel(payload.hasta)}`

  const encabezado: any[][] = [
    ['CENTROSOFT — Sistema de Gestión Médica'],
    [titulo],
    [periodo],
    [`Generado: ${fechaHoraActual()}`],
    [],
  ]

  let filas: any[][] = []

  if (payload.tipo === 'citas') {
    const { datos } = payload as ExportCitas
    const t = datos.totales
    filas = [
      ...encabezado,
      ['RESUMEN'],
      ['Total', 'Atendidas', 'Canceladas', 'Inasistentes', 'Programadas', 'En espera'],
      [t.total, t.atendidas, t.canceladas, t.inasistentes, t.programadas, t.en_espera],
      [],
      ['DETALLE DE CITAS'],
      ['Fecha', 'Hora', 'Paciente', 'Doctor', 'Especialidad', 'Estado'],
      ...datos.detalle.map((c: any) => [
        formatFechaUTC(c.fecha),
        String(c.hora).substring(0, 5),
        c.paciente, c.medico, c.especialidad, c.estado,
      ]),
    ]

  } else if (payload.tipo === 'doctores') {
    const { datos } = payload as ExportDoctores
    filas = [
      ...encabezado,
      ['Doctor', 'Total Citas', 'Atendidas', 'Inasistentes', 'Canceladas', '% Rendimiento', '% Inasistencia'],
      ...datos.doctores.map((d: any) => [
        d.nombre, Number(d.total_citas), Number(d.atendidas),
        Number(d.inasistentes), Number(d.canceladas),
        `${d.porcentaje_rendimiento}%`, `${d.porcentaje_inasistencia}%`,
      ]),
      ['TOTALES', Number(datos.totales.total_citas), Number(datos.totales.atendidas),
       Number(datos.totales.inasistentes), datos.totales.canceladas ?? '—',
       `${datos.totales.porcentaje_rendimiento}%`, '—'],
    ]

  } else if (payload.tipo === 'especialidades') {
    const { datos } = payload as ExportEspecialidades
    filas = [
      ...encabezado,
      ['Especialidad', 'Cantidad de Citas', 'Porcentaje (%)', 'Doctores Activos'],
      ...datos.especialidades.map((e: any) => [
        e.especialidad, Number(e.cantidad), `${e.porcentaje}%`, Number(e.doctores_activos),
      ]),
      ['TOTAL', datos.total, '100%', '—'],
    ]

  } else if (payload.tipo === 'edades') {
    const { datos } = payload as ExportEdades
    filas = [
      ...encabezado,
      ['Rango de Edad', 'Categoría', 'Cantidad', 'Porcentaje (%)'],
      ...datos.rangos.map((r: any) => [r.rango, r.categoria, Number(r.cantidad), `${r.porcentaje}%`]),
      ['TOTAL', '—', datos.total, '100%'],
    ]

  // ── Listados ──────────────────────────────────────────────
  } else if (payload.tipo === 'listado_doctores') {
    const p = payload as ExportListadoDoctores
    const filtroInfo = p.filtroEstado ? [`Filtro — Estado: ${p.filtroEstado}`] : []
    filas = [
      ...encabezado,
      ...filtroInfo.map(f => [f]),
      ...(filtroInfo.length ? [[]] : []),
      ['Nombre', 'Especialidades', 'Email', 'Teléfono', 'Estado'],
      ...p.datos.map((d: any) => [
        d.nombre, d.especialidades || '—', d.email || '—', d.telefono || '—', d.estado,
      ]),
    ]

  } else if (payload.tipo === 'listado_horarios') {
    const p = payload as ExportListadoHorarios
    filas = [
      ...encabezado,
      ['Médico', 'Especialidad', 'Días', 'Turno Mañana', 'Turno Tarde', 'Duración (min)'],
      ...p.datos.map((h: any) => [
        h.medico,
        h.especialidad,
        h.dias,
        h.hora_inicio_manana && h.hora_fin_manana
          ? `${h.hora_inicio_manana.substring(0,5)} - ${h.hora_fin_manana.substring(0,5)}`
          : '—',
        h.hora_inicio_tarde && h.hora_fin_tarde
          ? `${h.hora_inicio_tarde.substring(0,5)} - ${h.hora_fin_tarde.substring(0,5)}`
          : '—',
        Number(h.duracion_cita_min),
      ]),
    ]

  } else if (payload.tipo === 'listado_citas') {
    const p = payload as ExportListadoCitas
    const filtros: string[] = []
    if (p.desde)        filtros.push(`Desde: ${formatFechaLabel(p.desde)}`)
    if (p.hasta)        filtros.push(`Hasta: ${formatFechaLabel(p.hasta)}`)
    if (p.filtroEstado) filtros.push(`Estado: ${p.filtroEstado}`)
    filas = [
      ...encabezado,
      ...(filtros.length ? [[`Filtros aplicados — ${filtros.join('   ')}`], []] : []),
      ['Fecha', 'Hora', 'Paciente', 'Doctor', 'Especialidad', 'Estado'],
      ...p.datos.map((c: any) => [
        formatFechaUTC(c.fecha),
        String(c.hora).substring(0, 5),
        c.paciente, c.medico, c.especialidad, c.estado,
      ]),
    ]
  }

  // Ancho automático de columnas
  const anchos = filas.reduce((acc: number[], fila) => {
    fila.forEach((celda, idx) => {
      const len = String(celda ?? '').length
      acc[idx] = Math.max(acc[idx] || 10, len + 4)
    })
    return acc
  }, [])

  const ws = XLSX.utils.aoa_to_sheet(filas)
  ws['!cols'] = anchos.map((w: number) => ({ wch: Math.min(w, 50) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, titulo.substring(0, 31))
  XLSX.writeFile(wb, `${nombreArchivo(payload.tipo, payload.desde, payload.hasta)}.xlsx`)
}