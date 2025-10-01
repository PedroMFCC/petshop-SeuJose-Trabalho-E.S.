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
    window.logout = function(){ clearCurrentUser(); window.location.href = '/index.html'; };

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
    };

    function renderProductsList(){
        const productsList = document.getElementById('productsList');
        if (!productsList) return;
        const products = getProducts();
        productsList.innerHTML = '';
        if (products.length === 0) { productsList.innerHTML = '<p>Nenhum produto disponível no momento.</p>'; return; }
        products.forEach(p => {
            const d = document.createElement('div'); d.className='product';
            d.innerHTML = `<h4>${p.name}</h4><p>${p.description}</p><p><strong>Preço: R$ ${Number(p.price).toFixed(2)}</strong></p>`;
            productsList.appendChild(d);
        });
    }

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
        const msg = document.getElementById('productMessage'); msg.textContent = '';
        if (!name || !description || !price) { msg.textContent = 'Preencha todos os campos corretamente'; return; }
        if (isNaN(price) || price <= 0) { msg.textContent = 'Preço inválido'; return; }

        const products = getProducts();
        const newProduct = { id: Date.now(), name, description, price };
        products.push(newProduct); setProducts(products);
        msg.textContent = 'Produto adicionado com sucesso!'; msg.className='success';
        document.getElementById('productName').value=''; document.getElementById('productDescription').value=''; document.getElementById('productPrice').value='';
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
            d.innerHTML = `<h4>${p.name}</h4><p>${p.description}</p><p><strong>Preço: R$ ${Number(p.price).toFixed(2)}</strong></p><button onclick="removeProduct(${p.id})">Remover</button>`;
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

})();
