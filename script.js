// Könyvtár — Admin + User


function bindUI(){
safeAdd('loginBtn','click', login)
safeAdd('logoutBtn','click', ()=>{ currentUser=null; renderStatus(); showCatalog() })
safeAdd('navCatalog','click', showCatalog)
safeAdd('navLoans','click', showLoans)
safeAdd('navManage','click', showManage)
safeAdd('navExport','click', showExport)
}


function safeAdd(id,evt,fn){ const n=el(id); if(n) n.addEventListener(evt,fn) }


function renderStatus(){
el('currentUser').textContent = currentUser ? `${currentUser.name} (${currentUser.id})` : 'nincs'
el('currentRole').textContent = currentUser ? currentUser.role : '-'
// show/hide admin menu
const adminBtn = el('navManage')
const logoutBtn = el('logoutBtn')
const loginBtn = el('loginBtn')
if(currentUser && currentUser.role==='admin'){
if(adminBtn) adminBtn.style.display = 'block'
} else { if(adminBtn) adminBtn.style.display = 'none' }
if(currentUser){ if(logoutBtn) logoutBtn.style.display='inline-block'; if(loginBtn) loginBtn.style.display='none' } else { if(logoutBtn) logoutBtn.style.display='none'; if(loginBtn) loginBtn.style.display='inline-block' }
}


function login(){
const id = el('loginId')?el('loginId').value.trim() : ''
const pw = el('loginPw')?el('loginPw').value : ''
const u = state.users.find(x=>x.id===id && x.password===pw)
if(!u){ alert('Hibás felhasználó vagy jelszó'); return }
currentUser = u
renderStatus()
showCatalog()
}


// CATALOG
function showCatalog(){
let html = '<h2>Katalógus</h2>'
html += '<div class="form-row"><input id="searchInput" placeholder="Keresés cím vagy szerző szerint"> <button class="btn" id="searchBtn">Keres</button>'
if(currentUser && currentUser.role==='admin') html += ' <button class="btn ghost" id="addBookBtn">Új könyv</button>'
html += '</div>'


html += '<div id="catalogList"></div>'
el('mainContent').innerHTML = html


safeAdd('searchBtn','click', ()=>{ const q=el('searchInput').value.trim().toLowerCase(); renderCatalogList(q) })
safeAdd('searchInput','keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); const q=el('searchInput').value.trim().toLowerCase(); renderCatalogList(q) }})
safeAdd('addBookBtn','click', addBookFlow)


renderCatalogList('')
}


function renderCatalogList(query){
const container = el('catalogList')
const books = state.books.filter(b=>{
if(!query) return true
return (b.title||'').toLowerCase().includes(query) || (b.author||'').toLowerCase().includes(query)
})
if(books.length===0){ container.innerHTML = '<div class="small">Nincs találat.</div>'; return }
let html = '<table><thead><tr><th>Cím</th><th>Szerző</th><th>Év</th><th>Állapot</th><th></th></tr></thead><tbody>'
for(const b of books){
const status = b.available ? 'Szabad' : `Kikölcsönözve: ${b.holder}`
html += `<tr><td>${escapeHtml(b.title)}</td><td>${escapeHtml(b.author)}</td><td>${b.year||''}</td><td>${status}</td><td>`
if(b.available && currentUser && currentUser.role!=='admin') html += `<button class="btn" data-id="${b.id}" data-action="borrow">Kölcsönöz</button>`
if(!b.available && currentUser && (currentUser.role==='admin' || b.holder===currentUser.id)) html += `<button class="btn ghost" data-id="${b.id}" data-action="return">Visszahoz</button>`
if(currentUser && currentUser.role==='admin') html += ` <button class="btn ghost" data-id="${b.id}" data-action="delete">Töröl</button>`
html += `</td></tr>`
}
html += '</tbody></table>'
container.innerHTML = html
// bind action buttons
container.querySelectorAll('button[data-action]').forEach(btn=>{
const id = btn.dataset.id; const action = btn.dataset.action
btn.addEventListener('click', ()=>{
if(action==='borrow') borrowBook(id)
if(action==='return') returnBook(id)
if(action==='delete') deleteBook(id)
})
})
}


function addBookFlow(){
const title = prompt('Könyv címe:')
if(!title) return
const author = prompt('Szerző:') || ''
const year = prompt('Megjelenés éve:') || ''
const id = uid('b')
state.books.push({id,title,author,year,available:true,holder:null})
saveState(); showCatalog()
}


function borrowBook(bookId){
if(!currentUser){ alert('Jelentkezz be!'); return }
const b = state.books.find(x=>x.id===bookId); if(!b || !b.available){ alert('A könyv nem elérhető'); return }
b.available = false; b.holder = currentUser.id
const loan = {id:uid('loan'), bookId, userId: currentUser.id, borrowedAt: fmtDate(), dueAt: dueDate(21), returnedAt: null}
state.loans.push(loan)
saveState(); showCatalog()
alert('Sikeres kölcsönzés — határidő: '+loan.dueAt)
}


function returnBook(bookId){
const b = state.books.find(x=
