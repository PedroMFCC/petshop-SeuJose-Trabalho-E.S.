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
    renderCart();
    };

    function renderProductsList(){
        const productsList = document.getElementById('productsList');
        if (!productsList) return;
        const products = getProducts();
        productsList.innerHTML = '';
        if (products.length === 0) { 
            productsList.innerHTML = '<p class="text-center">Nenhum produto disponível no momento.</p>'; 
            return; 
        }
        products.forEach(p => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            const buyDisabled = (p.quantity === 0) ? 'disabled' : '';
            const qtyInfo = p.quantity > 0 ? 
                `<div class="product-quantity">Disponível: ${p.quantity}</div>` : 
                `<div class="product-quantity" style="color: var(--error);">Fora de estoque</div>`;
            
            productCard.innerHTML = `
                <div class="product-image">📦</div>
                <div class="product-info">
                    <h3 class="product-name">${p.name}</h3>
                    <p class="product-description">${p.description}</p>
                    <div class="product-price">R$ ${Number(p.price).toFixed(2)}</div>
                    ${qtyInfo}
                    <div class="product-actions">
                        <input type="number" class="quantity-input" id="qtyInput-${p.id}" min="1" max="${p.quantity}" value="1" ${p.quantity===0? 'disabled':''}>
                        <button class="btn btn-primary btn-small" id="btn-${p.id}" onclick="addToCart(${p.id})" ${buyDisabled}>Adicionar</button>
                    </div>
                </div>
            `;
            productsList.appendChild(productCard);
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
    if (cart.length === 0) { 
        cartList.innerHTML = '<p class="text-center">Seu carrinho está vazio.</p>'; 
        cartTotal.textContent = ''; 
        return; 
    }
    let total = 0;
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        const subtotal = Number(item.price) * item.quantity;
        total += subtotal;
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-details">
                    Quantidade: ${item.quantity} | Preço unitário: R$ ${Number(item.price).toFixed(2)}
                </div>
            </div>
            <div class="cart-item-actions">
                <div>Subtotal: R$ ${subtotal.toFixed(2)}</div>
                <button class="btn btn-outline btn-small" onclick="removeFromCart(${item.id})">Remover</button>
            </div>
        `;
        cartList.appendChild(cartItem);
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
        
        if (products.length === 0) { 
            list.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📦</div>
                    <h3>Nenhum produto cadastrado</h3>
                    <p>Adicione produtos usando o formulário ao lado</p>
                </div>
            `; 
            return; 
        }
        
        // Criar container grid para os produtos
        const productsGrid = document.createElement('div');
        productsGrid.className = 'admin-products-grid';
        list.appendChild(productsGrid);
        
        products.forEach(p => {
            const productCard = document.createElement('div');
            productCard.className = 'admin-product-card';
            
            const quantityClass = p.quantity > 0 ? 'quantity-in-stock' : 'quantity-out-of-stock';
            const quantityText = p.quantity > 0 ? `Em estoque: ${p.quantity}` : 'Fora de estoque';
            
            productCard.innerHTML = `
                <h4>${p.name}</h4>
                <p>${p.description}</p>
                <div class="admin-product-price">R$ ${Number(p.price).toFixed(2)}</div>
                <div class="admin-product-quantity ${quantityClass}">${quantityText}</div>
                <div class="admin-product-actions">
                    <button class="btn-remove" onclick="removeProduct(${p.id})">Remover</button>
                </div>
            `;
            productsGrid.appendChild(productCard);
        });
        
        // Adicionar alertas se houver produtos com estoque baixo ou zerado
        const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= 5);
        const outOfStockProducts = products.filter(p => p.quantity === 0);
        
        if (outOfStockProducts.length > 0) {
            const alert = document.createElement('div');
            alert.className = 'stock-alert out';
            alert.innerHTML = `⚠️ <strong>${outOfStockProducts.length}</strong> produto(s) fora de estoque`;
            list.insertBefore(alert, productsGrid);
        }
        
        if (lowStockProducts.length > 0) {
            const alert = document.createElement('div');
            alert.className = 'stock-alert low';
            alert.innerHTML = `⚠️ <strong>${lowStockProducts.length}</strong> produto(s) com estoque baixo`;
            list.insertBefore(alert, productsGrid);
        }
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
