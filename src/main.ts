import './style.css'

type TimeEntry = {
  id: string
  startedAt: string
  stoppedAt: string | null
}

const STORAGE_KEY = 'ponto-digital.entries.v1'

const appRootCandidate = document.querySelector<HTMLDivElement>('#app')

if (!appRootCandidate) {
  throw new Error('Aplicativo não inicializado.')
}

const appRoot = appRootCandidate

let entries = loadEntries()
let selectedMonth = resolveInitialMonth(entries)
let feedbackTimer = 0
let showManualEntryModal = false
let editingEntryId: string | null = null

appRoot.setAttribute('aria-live', 'polite')
render()
window.setInterval(updateLiveMetrics, 1000)

function loadEntries(): TimeEntry[] {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue) as Partial<TimeEntry>[]

    return parsedValue
      .filter((entry) => typeof entry?.id === 'string' && typeof entry?.startedAt === 'string')
      .map((entry) => ({
        id: entry.id!,
        startedAt: entry.startedAt!,
        stoppedAt: typeof entry.stoppedAt === 'string' ? entry.stoppedAt : null,
      }))
      .sort((left, right) => left.startedAt.localeCompare(right.startedAt))
  } catch {
    return []
  }
}

function saveEntries() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function resolveInitialMonth(currentEntries: TimeEntry[]) {
  const months = collectMonthKeys(currentEntries)

  return months[0] ?? monthKey(new Date())
}

function collectMonthKeys(currentEntries: TimeEntry[]) {
  const keys = new Set<string>(currentEntries.map((entry) => monthKey(entry.startedAt)))
  keys.add(monthKey(new Date()))

  return Array.from(keys).sort((left, right) => right.localeCompare(left))
}

function monthKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(year, monthNumber - 1, 1)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)

  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value),
  )
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
}

function getActiveEntry() {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (!entries[index]?.stoppedAt) {
      return entries[index]
    }
  }

  return null
}

function getMonthEntries(month: string) {
  return entries.filter((entry) => monthKey(entry.startedAt) === month)
}

function getWorkedMilliseconds(entry: TimeEntry) {
  const start = new Date(entry.startedAt).getTime()
  const end = entry.stoppedAt ? new Date(entry.stoppedAt).getTime() : Date.now()

  return Math.max(0, end - start)
}

function getMonthTotals(month: string) {
  const monthEntries = getMonthEntries(month)
  const totalMilliseconds = monthEntries.reduce((sum, entry) => sum + getWorkedMilliseconds(entry), 0)
  const daysWorked = new Set(monthEntries.map((entry) => formatDate(entry.startedAt))).size
  const averageMilliseconds = monthEntries.length ? totalMilliseconds / monthEntries.length : 0

  return {
    entries: monthEntries,
    totalMilliseconds,
    daysWorked,
    averageMilliseconds,
  }
}

function persistAndRender() {
  saveEntries()
  render()
}

function startShift() {
  if (getActiveEntry()) {
    setFeedback('Já existe um registro em andamento.')
    return
  }

  entries = [
    ...entries,
    {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      stoppedAt: null,
    },
  ]

  setFeedback('Entrada registrada com sucesso.')
  persistAndRender()
}

function stopShift() {
  const activeEntry = getActiveEntry()

  if (!activeEntry) {
    setFeedback('Nenhum expediente em andamento no momento.')
    return
  }

  const stoppedAt = new Date().toISOString()

  entries = entries.map((entry) => (entry.id === activeEntry.id ? { ...entry, stoppedAt } : entry))

  setFeedback('Saída registrada com sucesso.')
  persistAndRender()
}

function openManualEntryModal() {
  showManualEntryModal = true
  render()
}

function closeManualEntryModal() {
  showManualEntryModal = false
  render()
}

function openEditEntryModal(entryId: string) {
  editingEntryId = entryId
  render()
}

function closeEditEntryModal() {
  editingEntryId = null
  render()
}

function saveEditedEntry() {
  if (!editingEntryId) {
    setFeedback('Nenhum registro selecionado para edição.')
    return
  }

  const dateInput = document.querySelector<HTMLInputElement>('[data-edit-date]')
  const startTimeInput = document.querySelector<HTMLInputElement>('[data-edit-start-time]')
  const endTimeInput = document.querySelector<HTMLInputElement>('[data-edit-end-time]')

  if (!dateInput?.value || !startTimeInput?.value) {
    setFeedback('Data e hora de entrada são obrigatórias.')
    return
  }

  const date = dateInput.value
  const startTime = startTimeInput.value
  const endTime = endTimeInput?.value ?? null

  const startedAt = new Date(`${date}T${startTime}:00`).toISOString()
  const stoppedAt = endTime ? new Date(`${date}T${endTime}:00`).toISOString() : null

  if (new Date(startedAt) > (stoppedAt ? new Date(stoppedAt) : new Date())) {
    setFeedback('A hora de entrada não pode ser posterior à saída.')
    return
  }

  entries = entries.map((entry) =>
    entry.id === editingEntryId
      ? { ...entry, startedAt, stoppedAt }
      : entry,
  )

  setFeedback('Registro atualizado com sucesso.')
  closeEditEntryModal()
  persistAndRender()
}

function saveManualEntry() {
  const dateInput = document.querySelector<HTMLInputElement>('[data-manual-date]')
  const startTimeInput = document.querySelector<HTMLInputElement>('[data-manual-start-time]')
  const endTimeInput = document.querySelector<HTMLInputElement>('[data-manual-end-time]')

  if (!dateInput?.value || !startTimeInput?.value) {
    setFeedback('Data e hora de entrada são obrigatórias.')
    return
  }

  const date = dateInput.value
  const startTime = startTimeInput.value
  const endTime = endTimeInput?.value ?? null

  const startedAt = new Date(`${date}T${startTime}:00`).toISOString()
  const stoppedAt = endTime ? new Date(`${date}T${endTime}:00`).toISOString() : null

  if (new Date(startedAt) > (stoppedAt ? new Date(stoppedAt) : new Date())) {
    setFeedback('A hora de entrada não pode ser posterior à saída.')
    return
  }

  entries = [
    ...entries,
    {
      id: crypto.randomUUID(),
      startedAt,
      stoppedAt,
    },
  ].sort((left, right) => left.startedAt.localeCompare(right.startedAt))

  setFeedback('Registro manual adicionado com sucesso.')
  closeManualEntryModal()
  persistAndRender()
}

function exportSelectedMonth() {
  const monthEntries = getMonthTotals(selectedMonth).entries

  if (!monthEntries.length) {
    setFeedback('Não há registros neste mês para exportar.')
    return
  }

  const totalMilliseconds = monthEntries.reduce((sum, entry) => sum + getWorkedMilliseconds(entry), 0)

  const rows = [
    ['Data', 'Entrada', 'Saída', 'Duração', 'Status'],
    ...monthEntries.map((entry) => {
      const stoppedAt = entry.stoppedAt ? formatTime(entry.stoppedAt) : 'Em andamento'
      return [
        formatDate(entry.startedAt),
        formatTime(entry.startedAt),
        stoppedAt,
        formatDuration(getWorkedMilliseconds(entry)),
        entry.stoppedAt ? 'Finalizado' : 'Aberto',
      ]
    }),
    ['', '', '', formatDuration(totalMilliseconds), 'TOTAL'],
  ]

  const csv = `\ufeff${rows.map((row) => row.map(escapeCsvCell).join(';')).join('\n')}`
  const fileName = `ponto-${selectedMonth}.csv`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = downloadUrl
  link.download = fileName
  link.click()
  URL.revokeObjectURL(downloadUrl)

  setFeedback(`Planilha exportada: ${fileName}`)
}

function escapeCsvCell(value: string) {
  const safeValue = value.replaceAll('"', '""')
  return /[";\n]/.test(safeValue) ? `"${safeValue}"` : safeValue
}

function setFeedback(message: string) {
  window.clearTimeout(feedbackTimer)
  const feedback = document.querySelector<HTMLElement>('[data-feedback]')

  if (feedback) {
    feedback.textContent = message
    feedback.classList.add('is-visible')
  }

  feedbackTimer = window.setTimeout(() => {
    const node = document.querySelector<HTMLElement>('[data-feedback]')
    if (node && node.textContent === message) {
      node.textContent = ''
      node.classList.remove('is-visible')
    }
  }, 3500)
}

function updateLiveMetrics() {
  const liveDuration = document.querySelector<HTMLElement>('[data-live-duration]')
  const liveStatus = document.querySelector<HTMLElement>('[data-live-status]')
  const liveStartedAt = document.querySelector<HTMLElement>('[data-live-started-at]')
  const activeEntry = getActiveEntry()

  if (liveDuration) {
    liveDuration.textContent = activeEntry ? formatDuration(getWorkedMilliseconds(activeEntry)) : '00h 00m'
  }

  if (liveStatus) {
    liveStatus.textContent = activeEntry ? 'Em expediente' : 'Sem registro em andamento'
  }

  if (liveStartedAt) {
    liveStartedAt.textContent = activeEntry ? formatDateTime(activeEntry.startedAt) : 'Nenhuma entrada ativa'
  }

  const clock = document.querySelector<HTMLElement>('[data-clock]')

  if (clock) {
    clock.textContent = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date())
  }
}

function render() {
  const months = collectMonthKeys(entries)

  if (!months.includes(selectedMonth)) {
    selectedMonth = months[0]
  }

  const activeEntry = getActiveEntry()
  const monthData = getMonthTotals(selectedMonth)
  const currentDayEntries = entries.filter((entry) => formatDate(entry.startedAt) === formatDate(new Date().toISOString()))
  const totalMonths = months.length

  appRoot.innerHTML = `
    <div class="page-shell">
      <header class="hero-panel">
        <div class="hero-copy">
          <h1>Registro de jornada</h1>
          <p class="lead">
            Registre entrada e saída, navegue pelos meses, mantenha tudo salvo e exporte a planilha do período selecionado.
          </p>

          <div class="hero-actions">
            <div class="hero-actions-primary">
              <button class="shift-toggle ${activeEntry ? 'shift-toggle--stop' : 'shift-toggle--start'}" type="button" data-action="toggle-shift" title="${activeEntry ? 'Clique para registrar saída' : 'Clique para registrar entrada'}">
                <span class="shift-toggle-text">${activeEntry ? '⏹' : '▶'}</span>
              </button>
            </div>

            <button class="manual-entry-btn" type="button" data-action="open-manual" title="Adicionar registro manual">
              <span class="manual-entry-btn__icon">+</span>
              <span class="manual-entry-btn__text">
                <strong>Manual</strong>
                <small>Adicionar registro</small>
              </span>
            </button>
          </div>
        </div>

        <aside class="status-panel">
          <div class="status-card status-card--highlight">
            <span class="status-label">Situação atual</span>
            <strong data-live-status>${activeEntry ? 'Em expediente' : 'Sem registro em andamento'}</strong>
            <span data-live-started-at>${activeEntry ? formatDateTime(activeEntry.startedAt) : 'Nenhuma entrada ativa'}</span>
          </div>

          <div class="status-card-grid">
            <div class="status-card">
              <span class="status-label">Tempo ativo</span>
              <strong data-live-duration>${activeEntry ? formatDuration(getWorkedMilliseconds(activeEntry)) : '00h 00m'}</strong>
            </div>
            <div class="status-card">
              <span class="status-label">Registros Hoje</span>
              <strong>${currentDayEntries.length}</strong>
            </div>
            <div class="status-card">
              <span class="status-label">Meses registrados</span>
              <strong>${totalMonths}</strong>
            </div>
            <div class="status-card">
              <span class="status-label">Data e hora</span>
              <strong data-clock>${new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'full',
                timeStyle: 'short',
              }).format(new Date())}</strong>
            </div>
          </div>
        </aside>
      </header>

      <main class="dashboard">
        <section class="summary-grid" aria-label="Resumo do mês selecionado">
          <article class="metric-card metric-card--accent">
            <span class="metric-label">Tempo total</span>
            <strong>${formatDuration(monthData.totalMilliseconds)}</strong>
            <span>Total acumulado no mês selecionado</span>
          </article>
          <article class="metric-card">
            <span class="metric-label">Registros</span>
            <strong>${monthData.entries.length}</strong>
            <span>Entradas lançadas no período</span>
          </article>
          <article class="metric-card">
            <span class="metric-label">Dias trabalhados</span>
            <strong>${monthData.daysWorked}</strong>
            <span>Dias com pelo menos um registro</span>
          </article>
          <article class="metric-card">
            <span class="metric-label">Média por registro</span>
            <strong>${formatDuration(monthData.averageMilliseconds)}</strong>
            <span>Média calculada por intervalo</span>
          </article>
        </section>

        <section class="section-card records-card">
          <div class="section-heading">
            <div>
              <span class="section-kicker">Histórico mensal</span>
              <h2>${monthLabel(selectedMonth)}</h2>
            </div>
            <p>
              <button class="secondary-action" type="button" data-action="export-month" ${monthData.entries.length ? '' : 'disabled'} title="${monthData.entries.length ? 'Exportar os registros do mês selecionado' : 'Sem registros para exportar'}">
                Exportar
              </button>
            </p>
          </div>

          ${
            monthData.entries.length
              ? `
                <div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Entrada</th>
                        <th>Saída</th>
                        <th>Duração</th>
                        <th>Status</th>
                        <th style="width: 80px; text-align: center;">Editar</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${monthData.entries
                        .map(
                          (entry) => `
                            <tr>
                              <td>${formatDate(entry.startedAt)}</td>
                              <td>${formatTime(entry.startedAt)}</td>
                              <td>${entry.stoppedAt ? formatTime(entry.stoppedAt) : 'Em andamento'}</td>
                              <td>${formatDuration(getWorkedMilliseconds(entry))}</td>
                              <td><span class="badge ${entry.stoppedAt ? 'badge--closed' : 'badge--open'}">${entry.stoppedAt ? 'Finalizado' : 'Aberto'}</span></td>
                              <td><button class="action-btn" type="button" data-action="edit-entry" data-entry-id="${entry.id}" title="Editar registro">✏️</button></td>
                            </tr>
                          `,
                        )
                        .join('')}
                    </tbody>
                  </table>
                </div>
              `
              : `
                <div class="empty-state">
                  <strong>Nenhum registro neste mês.</strong>
                  <p>Use o botão de entrada para começar o primeiro lançamento ou selecione outro mês com dados.</p>
                </div>
              `
          }
        </section>

        <section class="section-card months-card">
          <div class="section-heading">
            <div>
              <span class="section-kicker">Todos os registros </span>
              <h2>Meses</h2>
            </div>
          </div>

          <div class="month-tabs" role="tablist" aria-label="Meses cadastrados">
            ${months
              .map(
                (month) => `
                  <button
                    class="month-tab ${month === selectedMonth ? 'is-active' : ''}"
                    type="button"
                    role="tab"
                    aria-selected="${month === selectedMonth}"
                    data-month="${month}"
                  >
                    ${monthLabel(month)}
                  </button>
                `,
              )
              .join('')}
          </div>
        </section>
      </main>

      ${
        showManualEntryModal
          ? `
            <div class="modal-overlay" data-modal-overlay>
              <div class="modal-content">
                <div class="modal-header">
                  <h2>Adicionar registro manual</h2>
                  <button class="modal-close" type="button" data-action="close-manual" title="Fechar">✕</button>
                </div>
                <form class="modal-form">
                  <div class="form-group">
                    <label for="manual-date">Data</label>
                    <input
                      id="manual-date"
                      type="date"
                      data-manual-date
                      value="${new Date().toISOString().split('T')[0]}"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="manual-start-time">Hora de entrada</label>
                    <input
                      id="manual-start-time"
                      type="time"
                      data-manual-start-time
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="manual-end-time">Hora de saída (opcional)</label>
                    <input
                      id="manual-end-time"
                      type="time"
                      data-manual-end-time
                    />
                  </div>

                  <div class="modal-actions">
                    <button class="modal-cancel" type="button" data-action="close-manual">
                      Cancelar
                    </button>
                    <button class="modal-submit" type="button" data-action="save-manual">
                      Adicionar registro
                    </button>
                  </div>
                  <div class="feedback-toast" role="alert" aria-live="assertive" aria-atomic="true" data-feedback></div>
                </form>
              </div>
            </div>
          `
          : ''
      }

      ${
        editingEntryId
          ? (() => {
              const entryToEdit = entries.find((e) => e.id === editingEntryId)
              if (!entryToEdit) return ''
              const dateValue = entryToEdit.startedAt.split('T')[0]
              const startTimeValue = entryToEdit.startedAt.split('T')[1]?.slice(0, 5) ?? '00:00'
              const endTimeValue = entryToEdit.stoppedAt ? entryToEdit.stoppedAt.split('T')[1]?.slice(0, 5) ?? '' : ''
              return `
                <div class="modal-overlay" data-modal-overlay>
                  <div class="modal-content">
                    <div class="modal-header">
                      <h2>Editar registro</h2>
                      <button class="modal-close" type="button" data-action="close-edit" title="Fechar">✕</button>
                    </div>
                    <form class="modal-form">
                      <div class="form-group">
                        <label for="edit-date">Data</label>
                        <input
                          id="edit-date"
                          type="date"
                          data-edit-date
                          value="${dateValue}"
                          required
                        />
                      </div>

                      <div class="form-group">
                        <label for="edit-start-time">Hora de entrada</label>
                        <input
                          id="edit-start-time"
                          type="time"
                          data-edit-start-time
                          value="${startTimeValue}"
                          required
                        />
                      </div>

                      <div class="form-group">
                        <label for="edit-end-time">Hora de saída (opcional)</label>
                        <input
                          id="edit-end-time"
                          type="time"
                          data-edit-end-time
                          value="${endTimeValue}"
                        />
                      </div>

                      <div class="modal-actions">
                        <button class="modal-cancel" type="button" data-action="close-edit">
                          Cancelar
                        </button>
                        <button class="modal-submit" type="button" data-action="save-edit">
                          Atualizar registro
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              `
            })()
          : ''
      }
    </div>
  `

  appRoot.querySelectorAll<HTMLButtonElement>('[data-action="toggle-shift"]').forEach((button) => {
    button.addEventListener('click', () => {
      if (getActiveEntry()) {
        stopShift()
      } else {
        startShift()
      }
    })
  })

  appRoot.querySelectorAll<HTMLButtonElement>('[data-action="export-month"]').forEach((button) => {
    button.addEventListener('click', exportSelectedMonth)
  })

  appRoot.querySelectorAll<HTMLButtonElement>('[data-action="open-manual"]').forEach((button) => {
    button.addEventListener('click', openManualEntryModal)
  })

  appRoot.querySelectorAll<HTMLButtonElement>('[data-action="close-manual"]').forEach((button) => {
    button.addEventListener('click', closeManualEntryModal)
  })

  appRoot.querySelectorAll<HTMLButtonElement>('[data-action="save-manual"]').forEach((button) => {
    button.addEventListener('click', saveManualEntry)
  })

  appRoot.querySelectorAll<HTMLButtonElement>('[data-action="edit-entry"]').forEach((button) => {
    button.addEventListener('click', () => {
      const entryId = button.dataset.entryId
      if (entryId) openEditEntryModal(entryId)
    })
  })

  appRoot.querySelectorAll<HTMLButtonElement>('[data-action="close-edit"]').forEach((button) => {
    button.addEventListener('click', closeEditEntryModal)
  })

  appRoot.querySelectorAll<HTMLButtonElement>('[data-action="save-edit"]').forEach((button) => {
    button.addEventListener('click', saveEditedEntry)
  })

  appRoot.querySelectorAll<HTMLButtonElement>('[data-month]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedMonth = button.dataset.month ?? selectedMonth
      render()
    })
  })

  if (showManualEntryModal) {
    const modalOverlay = appRoot.querySelector('[data-modal-overlay]')
    const dateInput = appRoot.querySelector<HTMLInputElement>('[data-manual-date]')
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeManualEntryModal()
      })
    }
    dateInput?.focus()
  }

  if (editingEntryId) {
    const modals = appRoot.querySelectorAll('[data-modal-overlay]')
    const lastModal = modals[modals.length - 1]
    if (lastModal) {
      lastModal.addEventListener('click', (e) => {
        if (e.target === lastModal) closeEditEntryModal()
      })
    }
    const dateInput = appRoot.querySelector<HTMLInputElement>('[data-edit-date]')
    dateInput?.focus()
  }

  updateLiveMetrics()
}
