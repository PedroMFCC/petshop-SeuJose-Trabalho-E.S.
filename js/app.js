// Funções compartilhadas para autenticação e produtos
(function(){
    // Inicialização: garantir usuário admin
    function ensureAdmin() {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        if (!users.find(u => u.username === 'admin')) {
            users.push({ username: 'admin', password: 'admin123', isAdmin: true });
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    function getUsers(){ return JSON.parse(localStorage.getItem('users')) || []; }
    function setUsers(u){ localStorage.setItem('users', JSON.stringify(u)); }
    function getProducts(){ return JSON.parse(localStorage.getItem('products')) || []; }
    function setProducts(p){ localStorage.setItem('products', JSON.stringify(p)); }
    function getCart(){ return JSON.parse(localStorage.getItem('cart')) || []; }
    function setCart(c){ localStorage.setItem('cart', JSON.stringify(c)); }
    function getCurrentUser(){ return JSON.parse(localStorage.getItem('currentUser')) || null; }
    function setCurrentUser(u){ localStorage.setItem('currentUser', JSON.stringify(u)); }
    function clearCurrentUser(){ localStorage.removeItem('currentUser'); }

    // Arquivo: LoginCadastro/login.html chama
    window.loginPage_login = function(){
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const msg = document.getElementById('loginMessage');
        msg.textContent = '';

        if (!username || !password) { msg.textContent = 'Preencha todos os campos'; return; }

        const users = getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) { msg.textContent = 'Usuário ou senha incorretos'; return; }

        setCurrentUser(user);
        // redireciona conforme tipo
        if (user.isAdmin) window.location.href = '../Loja/estoque.html';
        else window.location.href = '../Loja/loja.html';
    };

    // Arquivo: LoginCadastro/cadastro.html chama
    window.registerPage_register = function(){
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const msg = document.getElementById('registerMessage');
        msg.textContent = '';

        if (!username || !password) { msg.textContent = 'Preencha todos os campos'; return; }

        let users = getUsers();
        if (users.find(u => u.username === username)) { msg.textContent = 'Usuário já existe'; return; }

        const newUser = { username: username, password: password, isAdmin: false };
        users.push(newUser);
        setUsers(users);

        msg.textContent = 'Usuário cadastrado com sucesso! Redirecionando...';
        msg.className = 'success';
        setTimeout(()=>{ window.location.href = 'login.html'; }, 1200);
    };

    // Logout global
    window.logout = function(){ clearCurrentUser(); window.location.href = '../index.html'; };

    // Loja page
    window.loja_init = function(){
        ensureAdmin();
        const user = getCurrentUser();
        if (!user) {
            // permitir acesso público? requisito: vista do cliente na loja — se não logado, pode ver.
            // apenas esconder opções de usuário
            document.getElementById('userGreetingLoja').textContent = '';
            document.getElementById('logoutBtnLoja').classList.add('hidden');
        } else {
            document.getElementById('userGreetingLoja').textContent = user.username + (user.isAdmin? ' (admin)':'');
            document.getElementById('logoutBtnLoja').classList.remove('hidden');
            if (user.isAdmin) document.getElementById('stockLinkLoja').classList.remove('hidden');
        }
    renderProductsList();
    renderCart();
    };

    function renderProductsList(){
        const productsList = document.getElementById('productsList');
        if (!productsList) return;
        const products = getProducts();
        productsList.innerHTML = '';
        if (products.length === 0) { productsList.innerHTML = '<p>Nenhum produto disponível no momento.</p>'; return; }
        products.forEach(p => {
            const d = document.createElement('div'); d.className='product';
            const buyDisabled = (p.quantity === 0) ? 'disabled' : '';
            const qtyInfo = `<p><strong>Disponível: ${p.quantity}</strong></p>`;
            d.innerHTML = `
                <h4>${p.name}</h4>
                <p>${p.description}</p>
                <p><strong>Preço: R$ ${Number(p.price).toFixed(2)}</strong></p>
                ${qtyInfo}
                <div class="buy-controls">
                    <input type="number" id="qtyInput-${p.id}" min="1" max="${p.quantity}" value="1" ${p.quantity===0? 'disabled':''}>
                    <button id="btn-${p.id}" onclick="addToCart(${p.id})" ${buyDisabled}>Adicionar ao carrinho</button>
                </div>
            `;
            productsList.appendChild(d);
        });
    }

    // Carrinho
    window.addToCart = function(productId){
        const input = document.getElementById('qtyInput-' + productId);
        if (!input) return;
        const qty = parseInt(input.value) || 0;
        if (qty <= 0) { alert('Quantidade inválida'); return; }
        const products = getProducts();
        const prod = products.find(p => p.id === productId);
        if (!prod) { alert('Produto não encontrado'); return; }
        if (qty > prod.quantity) { alert('Quantidade solicitada maior que a disponível'); return; }

        let cart = getCart();
        const existing = cart.find(i => i.id === productId);
        if (existing) {
            if (existing.quantity + qty > prod.quantity) { alert('Carrinho excede estoque disponível'); return; }
            existing.quantity += qty;
        } else {
            cart.push({ id: prod.id, name: prod.name, price: prod.price, quantity: qty });
        }
        setCart(cart);
        renderCart();
        alert('Adicionado ao carrinho');
    };

    function renderCart(){
        const cartList = document.getElementById('cartList');
        const cartTotal = document.getElementById('cartTotal');
        if (!cartList || !cartTotal) return;
        const cart = getCart();
        cartList.innerHTML = '';
        if (cart.length === 0) { cartList.innerHTML = '<p>Seu carrinho está vazio.</p>'; cartTotal.textContent = ''; return; }
        let total = 0;
        cart.forEach(item => {
            const div = document.createElement('div'); div.className = 'product';
            const subtotal = Number(item.price) * item.quantity;
            total += subtotal;
            div.innerHTML = `<h4>${item.name}</h4><p>Quantidade: ${item.quantity}</p><p>Subtotal: R$ ${subtotal.toFixed(2)}</p><button onclick="removeFromCart(${item.id})">Remover</button>`;
            cartList.appendChild(div);
        });
        cartTotal.textContent = 'Total: R$ ' + total.toFixed(2);
    }

    window.removeFromCart = function(productId){
        let cart = getCart();
        cart = cart.filter(i => i.id !== productId);
        setCart(cart);
        renderCart();
    };

    window.checkout = function(){
        const cart = getCart();
        if (cart.length === 0) { alert('Carrinho vazio'); return; }
        let products = getProducts();
        // Verificar disponibilidade
        for (const item of cart){
            const prod = products.find(p => p.id === item.id);
            if (!prod) { alert(`Produto ${item.name} não encontrado no estoque`); return; }
            if (item.quantity > prod.quantity) { alert(`Estoque insuficiente para ${item.name}`); return; }
        }
        // Deduzir quantidades
        for (const item of cart){
            const prod = products.find(p => p.id === item.id);
            prod.quantity -= item.quantity;
        }
        setProducts(products);
        setCart([]);
        renderProductsList();
        renderCart();
        alert('Compra finalizada com sucesso!');
    };

    // Estoque (admin)
    window.estoque_init = function(){
        ensureAdmin();
        const user = getCurrentUser();
        if (!user || !user.isAdmin) { alert('Acesso restrito ao administrador'); window.location.href = '../LoginCadastro/login.html'; return; }

        document.getElementById('userGreetingEstoque').textContent = user.username + ' (admin)';
        document.getElementById('logoutBtnEstoque').classList.remove('hidden');

        renderAdminProducts();
    };

    window.addProductFromEstoque = function(){
    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const quantity = parseInt(document.getElementById('productQuantity') ? document.getElementById('productQuantity').value : 0);
        const msg = document.getElementById('productMessage'); msg.textContent = '';
    if (!name || !description || !price || isNaN(quantity)) { msg.textContent = 'Preencha todos os campos corretamente'; return; }
    if (isNaN(price) || price <= 0) { msg.textContent = 'Preço inválido'; return; }
    if (isNaN(quantity) || quantity < 0) { msg.textContent = 'Quantidade inválida'; return; }

    const products = getProducts();
    const newProduct = { id: Date.now(), name, description, price, quantity };
        products.push(newProduct); setProducts(products);
        msg.textContent = 'Produto adicionado com sucesso!'; msg.className='success';
        document.getElementById('productName').value=''; document.getElementById('productDescription').value=''; document.getElementById('productPrice').value='';
    if (document.getElementById('productQuantity')) document.getElementById('productQuantity').value='';
        renderAdminProducts();
        setTimeout(()=>{ msg.textContent=''; msg.className='error'; }, 1500);
    };

    window.removeProduct = function(productId){
        if (!confirm('Tem certeza que deseja remover este produto?')) return;
        let products = getProducts();
        products = products.filter(p=>p.id !== productId);
        setProducts(products);
        renderAdminProducts();
    };

    function renderAdminProducts(){
        const list = document.getElementById('adminProductsList');
        if (!list) return;
        const products = getProducts();
        list.innerHTML = '';
        if (products.length === 0) { list.innerHTML = '<p>Nenhum produto cadastrado.</p>'; return; }
        products.forEach(p=>{
            const d = document.createElement('div'); d.className='product';
            d.innerHTML = `<h4>${p.name}</h4><p>${p.description}</p><p><strong>Preço: R$ ${Number(p.price).toFixed(2)}</strong></p><p><strong>Quantidade: ${p.quantity || 0}</strong></p><button onclick="removeProduct(${p.id})">Remover</button>`;
            list.appendChild(d);
        });
    }

    // Script para index e exibição condicional do link de estoque
    window.addEventListener('DOMContentLoaded', ()=>{
        ensureAdmin();
        const user = getCurrentUser();
        const stockLink = document.getElementById('stockLink');
        const userGreeting = document.getElementById('userGreeting');
        const logoutBtn = document.getElementById('logoutBtn');
        if (stockLink) stockLink.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (user) {
            if (userGreeting) userGreeting.textContent = user.username + (user.isAdmin? ' (admin)':'');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            if (user.isAdmin && stockLink) stockLink.classList.remove('hidden');
        }
    });

    // ===============================================
    // Funções para Agendamento de Serviços (VERSÃO ATUALIZADA)
    // ===============================================

    function getAgendamentos(){ return JSON.parse(localStorage.getItem('agendamentos')) || []; }
    function setAgendamentos(a){ localStorage.setItem('agendamentos', JSON.stringify(a)); }

    window.agendamento_init = function(){
        const user = getCurrentUser();
        // Restrição: Redireciona se não houver login
        if (!user) {
            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = '../LoginCadastro/login.html';
            return;
        }

        document.getElementById('userGreetingAgendamento').textContent = user.username;
        document.getElementById('logoutBtnAgendamento').classList.remove('hidden');
        renderAgendamentos();
    };

    // DENTRO DE app.js, MODIFIQUE A FUNÇÃO agendarServico

window.agendarServico = function(){
    const user = getCurrentUser();
    if (!user) return;

    const petName = document.getElementById('petName').value.trim();
    const serviceType = document.getElementById('serviceType').value;
    const serviceDate = document.getElementById('serviceDate').value;
    const serviceTime = document.getElementById('serviceTime').value;
    const address = document.getElementById('address').value.trim();
    const observations = document.getElementById('observations').value.trim();
    
    const msg = document.getElementById('agendamentoMessage');
    msg.textContent = '';

    if (!petName || !serviceType || !serviceDate || !serviceTime) {
        msg.textContent = 'Por favor, preencha os campos de nome do pet, serviço, data e horário.';
        return;
    }

    const agendamentos = getAgendamentos();
    const newAgendamento = {
        id: Date.now(),
        owner: user.username,
        petName,
        service: serviceType,
        date: serviceDate,
        time: serviceTime,
        address,
        observations,
        status: 'Pendente' // <-- NOVO CAMPO DE STATUS ADICIONADO
    };

    agendamentos.push(newAgendamento);
    setAgendamentos(agendamentos);
    
    // O restante da função permanece igual...
    msg.textContent = 'Serviço agendado com sucesso!';
    msg.className = 'success';
    document.getElementById('petName').value = '';
    document.getElementById('serviceType').value = '';
    document.getElementById('serviceDate').value = '';
    document.getElementById('serviceTime').value = '';
    document.getElementById('address').value = '';
    document.getElementById('observations').value = '';
    renderAgendamentos();
    setTimeout(() => {
        msg.textContent = '';
        msg.className = 'error';
    }, 2500);
};

    function renderAgendamentos(){
        const user = getCurrentUser();
        if (!user) return;

        const list = document.getElementById('agendamentosList');
        const allAgendamentos = getAgendamentos();
        const userAgendamentos = allAgendamentos.filter(a => a.owner === user.username);

        list.innerHTML = '';
        if (userAgendamentos.length === 0) {
            list.innerHTML = '<p>Você ainda não possui agendamentos.</p>';
            return;
        }

        userAgendamentos.forEach(a => {
            const dataFormatada = new Date(`${a.date}T${a.time}`).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });

            // Formatação destacando os campos solicitados
            const div = document.createElement('div');
            div.className = 'product'; // Reutilizando estilo
            div.innerHTML = `
                <h4>Serviço Agendado: ${dataFormatada} às ${a.time}</h4>
                <p><strong>Dono:</strong> ${a.owner}</p>
                <p><strong>Pet:</strong> ${a.petName}</p>
                <p><strong>Serviço:</strong> ${a.service}</p>
                <p><strong>Endereço:</strong> ${a.address || 'Não informado'}</p>
                <p><strong>Observações:</strong> ${a.observations || 'Nenhuma'}</p>
                <button onclick="cancelarAgendamento(${a.id})" style="margin-top: 10px;">Cancelar</button>
            `;
            list.appendChild(div);
        });
    }

    window.cancelarAgendamento = function(agendamentoId){
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

        let agendamentos = getAgendamentos();
        agendamentos = agendamentos.filter(a => a.id !== agendamentoId);
        setAgendamentos(agendamentos);
        renderAgendamentos();
    };

    // ===============================================
// Funções do Painel de Agendamentos (Admin)
// ===============================================

// Chamado pelo body da página agendamentos-admin.html
window.agendamentosAdmin_init = function(){
    ensureAdmin();
    const user = getCurrentUser();
    // Proteção: Apenas admins podem ver esta página
    if (!user || !user.isAdmin) {
        alert('Acesso restrito ao administrador.');
        window.location.href = '/index.html';
        return;
    }

    document.getElementById('userGreetingAdminAgendamentos').textContent = user.username + ' (admin)';
    document.getElementById('logoutBtnAdminAgendamentos').classList.remove('hidden');
    
    renderAdminAgendamentos();
};

function renderAdminAgendamentos(){
    const list = document.getElementById('adminAgendamentosList');
    if (!list) return;

    const allAgendamentos = getAgendamentos();
    list.innerHTML = '';

    if (allAgendamentos.length === 0) {
        list.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
        return;
    }

    // Ordena para mostrar os pendentes primeiro
    allAgendamentos.sort((a, b) => (a.status === 'Pendente' ? -1 : 1));

    allAgendamentos.forEach(a => {
        const dataFormatada = new Date(`${a.date}T${a.time}`).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        
        const isPendente = a.status === 'Pendente';
        const statusClass = isPendente ? 'status-pendente' : 'status-concluido';
        const statusButtonText = isPendente ? 'Marcar como Concluído' : 'Marcar como Pendente';

        const div = document.createElement('div');
        div.className = 'product'; // Reutilizando estilo
        div.innerHTML = `
            <h4><span class="status ${statusClass}">${a.status}</span> Serviço: ${a.service}</h4>
            <p><strong>Dono:</strong> ${a.owner}</p>
            <p><strong>Pet:</strong> ${a.petName}</p>
            <p><strong>Data:</strong> ${dataFormatada} às ${a.time}</p>
            <p><strong>Endereço:</strong> ${a.address || 'Não informado'}</p>
            <p><strong>Observações:</strong> ${a.observations || 'Nenhuma'}</p>
            <div class="admin-controls" style="margin-top: 10px;">
                <button onclick="toggleAgendamentoStatus(${a.id})">${statusButtonText}</button>
                <button onclick="cancelarAgendamento(${a.id}, true)">Excluir Agendamento</button>
            </div>
        `;
        list.appendChild(div);
    });
}

// Nova função para alterar o status
window.toggleAgendamentoStatus = function(agendamentoId) {
    let agendamentos = getAgendamentos();
    const agendamento = agendamentos.find(a => a.id === agendamentoId);
    if (agendamento) {
        agendamento.status = agendamento.status === 'Pendente' ? 'Concluído' : 'Pendente';
        setAgendamentos(agendamentos);
        renderAdminAgendamentos(); // Re-renderiza a lista do admin
    }
};

// Modifique a função 'cancelarAgendamento' para aceitar um parâmetro de admin
window.cancelarAgendamento = function(agendamentoId, isAdminAction = false){
    if (!confirm('Tem certeza que deseja remover este agendamento?')) return;

    let agendamentos = getAgendamentos();
    agendamentos = agendamentos.filter(a => a.id !== agendamentoId);
    setAgendamentos(agendamentos);

    // Se a ação veio do painel do admin, recarrega a lista do admin.
    // Senão, recarrega a lista do cliente.
    if (isAdminAction) {
        renderAdminAgendamentos();
    } else {
        renderAgendamentos();
    }
};

// Finalmente, atualize o listener que mostra os links de admin
window.addEventListener('DOMContentLoaded', ()=>{
    ensureAdmin();
    const user = getCurrentUser();
    const stockLink = document.getElementById('stockLink');
    const adminAgendamentosLink = document.getElementById('adminAgendamentosLink'); // <-- NOVO
    const userGreeting = document.getElementById('userGreeting');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (stockLink) stockLink.classList.add('hidden');
    if (adminAgendamentosLink) adminAgendamentosLink.classList.add('hidden'); // <-- NOVO
    if (logoutBtn) logoutBtn.classList.add('hidden');

    if (user) {
        if (userGreeting) userGreeting.textContent = user.username + (user.isAdmin? ' (admin)':'');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (user.isAdmin) {
            if (stockLink) stockLink.classList.remove('hidden');
            if (adminAgendamentosLink) adminAgendamentosLink.classList.remove('hidden'); // <-- NOVO
        }
    }
});

})();
