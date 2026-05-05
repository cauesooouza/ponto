(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`ponto-digital.entries.v1`,t=document.querySelector(`#app`);if(!t)throw Error(`Aplicativo não inicializado.`);var n=t,r=c(),i=u(r),a=0,o=!1,s=null;n.setAttribute(`aria-live`,`polite`),F(),window.setInterval(P,1e3);function c(){try{let t=window.localStorage.getItem(e);return t?JSON.parse(t).filter(e=>typeof e?.id==`string`&&typeof e?.startedAt==`string`).map(e=>({id:e.id,startedAt:e.startedAt,stoppedAt:typeof e.stoppedAt==`string`?e.stoppedAt:null})).sort((e,t)=>e.startedAt.localeCompare(t.startedAt)):[]}catch{return[]}}function l(){window.localStorage.setItem(e,JSON.stringify(r))}function u(e){return d(e)[0]??f(new Date)}function d(e){let t=new Set(e.map(e=>f(e.startedAt)));return t.add(f(new Date)),Array.from(t).sort((e,t)=>t.localeCompare(e))}function f(e){let t=typeof e==`string`?new Date(e):e;return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}`}function p(e){let[t,n]=e.split(`-`).map(Number),r=new Date(t,n-1,1),i=new Intl.DateTimeFormat(`pt-BR`,{month:`long`,year:`numeric`}).format(r);return i.charAt(0).toUpperCase()+i.slice(1)}function m(e){return new Intl.DateTimeFormat(`pt-BR`,{dateStyle:`medium`,timeStyle:`short`}).format(new Date(e))}function h(e){return new Intl.DateTimeFormat(`pt-BR`,{day:`2-digit`,month:`short`,year:`numeric`}).format(new Date(e))}function g(e){return new Intl.DateTimeFormat(`pt-BR`,{hour:`2-digit`,minute:`2-digit`}).format(new Date(e))}function _(e){let t=Math.max(0,Math.floor(e/1e3)),n=Math.floor(t/3600),r=Math.floor(t%3600/60),i=t%60;return`${String(n).padStart(2,`0`)}h ${String(r).padStart(2,`0`)}m ${String(i).padStart(2,`0`)}s`}function v(){for(let e=r.length-1;e>=0;--e)if(!r[e]?.stoppedAt)return r[e];return null}function y(e){return r.filter(t=>f(t.startedAt)===e)}function b(e){let t=new Date(e.startedAt).getTime(),n=e.stoppedAt?new Date(e.stoppedAt).getTime():Date.now();return Math.max(0,n-t)}function x(e){let t=y(e),n=t.reduce((e,t)=>e+b(t),0);return{entries:t,totalMilliseconds:n,daysWorked:new Set(t.map(e=>h(e.startedAt))).size,averageMilliseconds:t.length?n/t.length:0}}function S(){l(),F()}function C(){if(v()){N(`Já existe um registro em andamento.`);return}r=[...r,{id:crypto.randomUUID(),startedAt:new Date().toISOString(),stoppedAt:null}],N(`Entrada registrada com sucesso.`),S()}function w(){let e=v();if(!e){N(`Nenhum expediente em andamento no momento.`);return}let t=new Date().toISOString();r=r.map(n=>n.id===e.id?{...n,stoppedAt:t}:n),N(`Saída registrada com sucesso.`),S()}function T(){o=!0,F()}function E(){o=!1,F()}function D(e){s=e,F()}function O(){s=null,F()}function k(){if(!s){N(`Nenhum registro selecionado para edição.`);return}let e=document.querySelector(`[data-edit-date]`),t=document.querySelector(`[data-edit-start-time]`),n=document.querySelector(`[data-edit-end-time]`);if(!e?.value||!t?.value){N(`Data e hora de entrada são obrigatórias.`);return}let i=e.value,a=t.value,o=n?.value??null,c=new Date(`${i}T${a}:00`).toISOString(),l=o?new Date(`${i}T${o}:00`).toISOString():null;if(new Date(c)>(l?new Date(l):new Date)){N(`A hora de entrada não pode ser posterior à saída.`);return}r=r.map(e=>e.id===s?{...e,startedAt:c,stoppedAt:l}:e),N(`Registro atualizado com sucesso.`),O(),S()}function A(){let e=document.querySelector(`[data-manual-date]`),t=document.querySelector(`[data-manual-start-time]`),n=document.querySelector(`[data-manual-end-time]`);if(!e?.value||!t?.value){N(`Data e hora de entrada são obrigatórias.`);return}let i=e.value,a=t.value,o=n?.value??null,s=new Date(`${i}T${a}:00`).toISOString(),c=o?new Date(`${i}T${o}:00`).toISOString():null;if(new Date(s)>(c?new Date(c):new Date)){N(`A hora de entrada não pode ser posterior à saída.`);return}r=[...r,{id:crypto.randomUUID(),startedAt:s,stoppedAt:c}].sort((e,t)=>e.startedAt.localeCompare(t.startedAt)),N(`Registro manual adicionado com sucesso.`),E(),S()}function j(){let e=x(i).entries;if(!e.length){N(`Não há registros neste mês para exportar.`);return}let t=e.reduce((e,t)=>e+b(t),0),n=`\ufeff${[[`Data`,`Entrada`,`Saída`,`Duração`,`Status`],...e.map(e=>{let t=e.stoppedAt?g(e.stoppedAt):`Em andamento`;return[h(e.startedAt),g(e.startedAt),t,_(b(e)),e.stoppedAt?`Finalizado`:`Aberto`]}),[``,``,``,_(t),`TOTAL`]].map(e=>e.map(M).join(`;`)).join(`
`)}`,r=`ponto-${i}.csv`,a=new Blob([n],{type:`text/csv;charset=utf-8;`}),o=URL.createObjectURL(a),s=document.createElement(`a`);s.href=o,s.download=r,s.click(),URL.revokeObjectURL(o),N(`Planilha exportada: ${r}`)}function M(e){let t=e.replaceAll(`"`,`""`);return/[";\n]/.test(t)?`"${t}"`:t}function N(e){window.clearTimeout(a);let t=document.querySelector(`[data-feedback]`);t&&(t.textContent=e,t.classList.add(`is-visible`)),a=window.setTimeout(()=>{let t=document.querySelector(`[data-feedback]`);t&&t.textContent===e&&(t.textContent=``,t.classList.remove(`is-visible`))},3500)}function P(){let e=document.querySelector(`[data-live-duration]`),t=document.querySelector(`[data-live-status]`),n=document.querySelector(`[data-live-started-at]`),r=v();e&&(e.textContent=r?_(b(r)):`00h 00m`),t&&(t.textContent=r?`Em expediente`:`Sem registro em andamento`),n&&(n.textContent=r?m(r.startedAt):`Nenhuma entrada ativa`);let i=document.querySelector(`[data-clock]`);i&&(i.textContent=new Intl.DateTimeFormat(`pt-BR`,{dateStyle:`full`,timeStyle:`short`}).format(new Date))}function F(){let e=d(r);e.includes(i)||(i=e[0]);let t=v(),a=x(i),c=r.filter(e=>h(e.startedAt)===h(new Date().toISOString())),l=e.length;if(n.innerHTML=`
    <div class="page-shell">
      <header class="hero-panel">
        <div class="hero-copy">
          <h1>Registro de jornada</h1>
          <p class="lead">
            Registre entrada e saída, navegue pelos meses, mantenha tudo salvo e exporte a planilha do período selecionado.
          </p>

          <div class="hero-actions">
            <div class="hero-actions-primary">
              <button class="shift-toggle ${t?`shift-toggle--stop`:`shift-toggle--start`}" type="button" data-action="toggle-shift" title="${t?`Clique para registrar saída`:`Clique para registrar entrada`}">
                <span class="shift-toggle-text">${t?`⏹`:`▶`}</span>
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
            <strong data-live-status>${t?`Em expediente`:`Sem registro em andamento`}</strong>
            <span data-live-started-at>${t?m(t.startedAt):`Nenhuma entrada ativa`}</span>
          </div>

          <div class="status-card-grid">
            <div class="status-card">
              <span class="status-label">Tempo ativo</span>
              <strong data-live-duration>${t?_(b(t)):`00h 00m`}</strong>
            </div>
            <div class="status-card">
              <span class="status-label">Registros Hoje</span>
              <strong>${c.length}</strong>
            </div>
            <div class="status-card">
              <span class="status-label">Meses registrados</span>
              <strong>${l}</strong>
            </div>
            <div class="status-card">
              <span class="status-label">Data e hora</span>
              <strong data-clock>${new Intl.DateTimeFormat(`pt-BR`,{dateStyle:`full`,timeStyle:`short`}).format(new Date)}</strong>
            </div>
          </div>
        </aside>
      </header>

      <main class="dashboard">
        <section class="summary-grid" aria-label="Resumo do mês selecionado">
          <article class="metric-card metric-card--accent">
            <span class="metric-label">Tempo total</span>
            <strong>${_(a.totalMilliseconds)}</strong>
            <span>Total acumulado no mês selecionado</span>
          </article>
          <article class="metric-card">
            <span class="metric-label">Registros</span>
            <strong>${a.entries.length}</strong>
            <span>Entradas lançadas no período</span>
          </article>
          <article class="metric-card">
            <span class="metric-label">Dias trabalhados</span>
            <strong>${a.daysWorked}</strong>
            <span>Dias com pelo menos um registro</span>
          </article>
          <article class="metric-card">
            <span class="metric-label">Média por registro</span>
            <strong>${_(a.averageMilliseconds)}</strong>
            <span>Média calculada por intervalo</span>
          </article>
        </section>

        <section class="section-card records-card">
          <div class="section-heading">
            <div>
              <span class="section-kicker">Histórico mensal</span>
              <h2>${p(i)}</h2>
            </div>
            <p>
              <button class="secondary-action" type="button" data-action="export-month" ${a.entries.length?``:`disabled`} title="${a.entries.length?`Exportar os registros do mês selecionado`:`Sem registros para exportar`}">
                Exportar
              </button>
            </p>
          </div>

          ${a.entries.length?`
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
                      ${a.entries.map(e=>`
                            <tr>
                              <td>${h(e.startedAt)}</td>
                              <td>${g(e.startedAt)}</td>
                              <td>${e.stoppedAt?g(e.stoppedAt):`Em andamento`}</td>
                              <td>${_(b(e))}</td>
                              <td><span class="badge ${e.stoppedAt?`badge--closed`:`badge--open`}">${e.stoppedAt?`Finalizado`:`Aberto`}</span></td>
                              <td><button class="action-btn" type="button" data-action="edit-entry" data-entry-id="${e.id}" title="Editar registro">✏️</button></td>
                            </tr>
                          `).join(``)}
                    </tbody>
                  </table>
                </div>
              `:`
                <div class="empty-state">
                  <strong>Nenhum registro neste mês.</strong>
                  <p>Use o botão de entrada para começar o primeiro lançamento ou selecione outro mês com dados.</p>
                </div>
              `}
        </section>

        <section class="section-card months-card">
          <div class="section-heading">
            <div>
              <span class="section-kicker">Todos os registros </span>
              <h2>Meses</h2>
            </div>
          </div>

          <div class="month-tabs" role="tablist" aria-label="Meses cadastrados">
            ${e.map(e=>`
                  <button
                    class="month-tab ${e===i?`is-active`:``}"
                    type="button"
                    role="tab"
                    aria-selected="${e===i}"
                    data-month="${e}"
                  >
                    ${p(e)}
                  </button>
                `).join(``)}
          </div>
        </section>
      </main>

      ${o?`
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
                      value="${new Date().toISOString().split(`T`)[0]}"
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
          `:``}

      ${s?(()=>{let e=r.find(e=>e.id===s);return e?`
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
                          value="${e.startedAt.split(`T`)[0]}"
                          required
                        />
                      </div>

                      <div class="form-group">
                        <label for="edit-start-time">Hora de entrada</label>
                        <input
                          id="edit-start-time"
                          type="time"
                          data-edit-start-time
                          value="${e.startedAt.split(`T`)[1]?.slice(0,5)??`00:00`}"
                          required
                        />
                      </div>

                      <div class="form-group">
                        <label for="edit-end-time">Hora de saída (opcional)</label>
                        <input
                          id="edit-end-time"
                          type="time"
                          data-edit-end-time
                          value="${e.stoppedAt?e.stoppedAt.split(`T`)[1]?.slice(0,5)??``:``}"
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
              `:``})():``}
    </div>
  `,n.querySelectorAll(`[data-action="toggle-shift"]`).forEach(e=>{e.addEventListener(`click`,()=>{v()?w():C()})}),n.querySelectorAll(`[data-action="export-month"]`).forEach(e=>{e.addEventListener(`click`,j)}),n.querySelectorAll(`[data-action="open-manual"]`).forEach(e=>{e.addEventListener(`click`,T)}),n.querySelectorAll(`[data-action="close-manual"]`).forEach(e=>{e.addEventListener(`click`,E)}),n.querySelectorAll(`[data-action="save-manual"]`).forEach(e=>{e.addEventListener(`click`,A)}),n.querySelectorAll(`[data-action="edit-entry"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.entryId;t&&D(t)})}),n.querySelectorAll(`[data-action="close-edit"]`).forEach(e=>{e.addEventListener(`click`,O)}),n.querySelectorAll(`[data-action="save-edit"]`).forEach(e=>{e.addEventListener(`click`,k)}),n.querySelectorAll(`[data-month]`).forEach(e=>{e.addEventListener(`click`,()=>{i=e.dataset.month??i,F()})}),o){let e=n.querySelector(`[data-modal-overlay]`),t=n.querySelector(`[data-manual-date]`);e&&e.addEventListener(`click`,t=>{t.target===e&&E()}),t?.focus()}if(s){let e=n.querySelectorAll(`[data-modal-overlay]`),t=e[e.length-1];t&&t.addEventListener(`click`,e=>{e.target===t&&O()}),n.querySelector(`[data-edit-date]`)?.focus()}P()}