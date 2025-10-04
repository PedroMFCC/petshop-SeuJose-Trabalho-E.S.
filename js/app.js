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
    function getAgendamentos(){ return JSON.parse(localStorage.getItem('agendamentos')) || []; }
    function setAgendamentos(a){ localStorage.setItem('agendamentos', JSON.stringify(a)); }

    // Variável global para controlar o produto sendo editado
    let currentEditingProductId = null;

    // ===============================================
    // FUNÇÕES DE AUTENTICAÇÃO
    // ===============================================

    window.loginPage_login = function(){
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const msg = document.getElementById('loginMessage');
        msg.textContent = '';

        if (!username || !password) { 
            msg.textContent = 'Preencha todos os campos'; 
            msg.className = 'message message-error';
            return; 
        }

        const users = getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) { 
            msg.textContent = 'Usuário ou senha incorretos'; 
            msg.className = 'message message-error';
            return; 
        }

        setCurrentUser(user);
        updateMenu();
        
        if (user.isAdmin) window.location.href = '../Loja/estoque.html';
        else window.location.href = '../Loja/loja.html';
    };

    window.registerPage_register = function(){
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const msg = document.getElementById('registerMessage');
        msg.textContent = '';

        if (!username || !password) { 
            msg.textContent = 'Preencha todos os campos'; 
            msg.className = 'message message-error';
            return; 
        }

        let users = getUsers();
        if (users.find(u => u.username === username)) { 
            msg.textContent = 'Usuário já existe'; 
            msg.className = 'message message-error';
            return; 
        }

        const newUser = { username: username, password: password, isAdmin: false };
        users.push(newUser);
        setUsers(users);

    msg.textContent = 'Usuário cadastrado com sucesso! Redirecionando...';
    msg.className = 'message message-success';
        
        setCurrentUser(newUser);
        updateMenu();
        
        setTimeout(()=>{ window.location.href = 'login.html'; }, 1200);
    };

    window.logout = function(){ 
        clearCurrentUser(); 
        updateMenu();
        window.location.href = '../index.html'; 
    };
    // ===============================================
    // FUNÇÕES DA LOJA
    // ===============================================

    window.loja_init = function(){
        ensureAdmin();
        updateMenu();
        renderProductsList();
        renderCart();
    };

    function renderProductsList(){
        const productsList = document.getElementById('productsList');
    // render products list
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
            
            const productImage = p.image ? 
                `<img src="${p.image}" alt="${p.name}" class="product-image-real">` :
                `<div class="product-image-placeholder">📦</div>`;
            
            productCard.innerHTML = `
                <div class="product-image">
                    ${productImage}
                </div>
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
        for (const item of cart){
            const prod = products.find(p => p.id === item.id);
            if (!prod) { alert(`Produto ${item.name} não encontrado no estoque`); return; }
            if (item.quantity > prod.quantity) { alert(`Estoque insuficiente para ${item.name}`); return; }
        }
        
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

    // ===============================================
    // FUNÇÕES DO ESTOQUE (ADMIN)
    // ===============================================

    window.estoque_init = function(){
        ensureAdmin();
        const user = getCurrentUser();
        if (!user || !user.isAdmin) { 
            alert('Acesso restrito ao administrador'); 
            window.location.href = '../LoginCadastro/login.html'; 
            return; 
        }
        updateMenu();
        renderAdminProducts();
    };

    window.previewImage = function(input) {
        const preview = document.getElementById('imagePreview');
        const file = input.files[0];
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Pré-visualização" class="image-preview-img">
                    <button type="button" class="image-remove-btn" onclick="removeImage()">×</button>
                `;
            };
            reader.readAsDataURL(file);
        }
    };

    window.removeImage = function() {
        const input = document.getElementById('productImage');
        const preview = document.getElementById('imagePreview');
        input.value = '';
        preview.innerHTML = `
            <div class="image-preview-placeholder">
                <span class="placeholder-icon">📷</span>
                <p>Clique para adicionar uma imagem</p>
            </div>
        `;
    };

    function getImageBase64(callback) {
        const input = document.getElementById('productImage');
        const file = input.files[0];
        
        if (!file) {
            callback(null);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            callback(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    window.addProductFromEstoque = function(){
        const name = document.getElementById('productName').value.trim();
        const description = document.getElementById('productDescription').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const quantity = parseInt(document.getElementById('productQuantity').value);
        const msg = document.getElementById('productMessage'); 
        
        msg.textContent = '';
        msg.className = 'message message-error';

        if (!name || !description || !price || isNaN(quantity)) { 
            msg.textContent = 'Preencha todos os campos corretamente'; 
            return; 
        }
        if (isNaN(price) || price <= 0) { 
            msg.textContent = 'Preço inválido'; 
            return; 
        }
        if (isNaN(quantity) || quantity < 0) { 
            msg.textContent = 'Quantidade inválida'; 
            return; 
        }

        getImageBase64(function(imageBase64) {
            const products = getProducts();
            const newProduct = { 
                id: Date.now(), 
                name, 
                description, 
                price, 
                quantity,
                image: imageBase64
            };
            
            products.push(newProduct);
            setProducts(products);
            
            msg.textContent = 'Produto adicionado com sucesso!'; 
            msg.className = 'message message-success';
            
            document.getElementById('productName').value = '';
            document.getElementById('productDescription').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productQuantity').value = '';
            removeImage();
            
            renderAdminProducts();
            setTimeout(() => { 
                msg.textContent = ''; 
                msg.className = 'message message-error hidden'; 
            }, 2000);
        });
    };

    window.removeProduct = function(productId){
        if (!confirm('Tem certeza que deseja remover este produto?')) return;
        
        let products = getProducts();
        const numericProductId = Number(productId);
        const initialLength = products.length;
        
        products = products.filter(p => p.id !== numericProductId);
        
        if (products.length === initialLength) {
            products = products.filter(p => p.id != productId);
        }
        
        if (products.length === initialLength) {
            alert('Erro: Não foi possível encontrar o produto para remover.');
            return;
        }
        
        setProducts(products);
        renderAdminProducts();
        
        if (document.getElementById('productsList')) {
            renderProductsList();
        }
        
        alert('Produto removido com sucesso!');
    };

    window.editProduct = function(productId) {
        const products = getProducts();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            alert('Produto não encontrado!');
            return;
        }

        currentEditingProductId = productId;

        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductDescription').value = product.description;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductQuantity').value = product.quantity;

        const editPreview = document.getElementById('editImagePreview');
        if (product.image) {
            editPreview.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="image-preview-img">
                <button type="button" class="image-remove-btn" onclick="removeEditImage()">×</button>
            `;
        } else {
            editPreview.innerHTML = `
                <div class="image-preview-placeholder">
                    <span class="placeholder-icon">📷</span>
                    <p>Clique para alterar a imagem</p>
                </div>
            `;
        }

        document.getElementById('editProductModal').style.display = 'flex';
    };

    window.closeEditModal = function() {
        document.getElementById('editProductModal').style.display = 'none';
        currentEditingProductId = null;
        document.getElementById('editProductMessage').textContent = '';
        document.getElementById('editProductMessage').className = 'message message-error hidden';
    };

    window.previewEditImage = function(input) {
        const preview = document.getElementById('editImagePreview');
        const file = input.files[0];
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Pré-visualização" class="image-preview-img">
                    <button type="button" class="image-remove-btn" onclick="removeEditImage()">×</button>
                `;
            };
            reader.readAsDataURL(file);
        }
    };

    window.removeEditImage = function() {
        const input = document.getElementById('editProductImage');
        const preview = document.getElementById('editImagePreview');
        input.value = '';
        preview.innerHTML = `
            <div class="image-preview-placeholder">
                <span class="placeholder-icon">📷</span>
                <p>Clique para alterar a imagem</p>
            </div>
        `;
    };

    window.updateProduct = function() {
        if (!currentEditingProductId) return;

        const name = document.getElementById('editProductName').value.trim();
        const description = document.getElementById('editProductDescription').value.trim();
        const price = parseFloat(document.getElementById('editProductPrice').value);
        const quantity = parseInt(document.getElementById('editProductQuantity').value);
        const msg = document.getElementById('editProductMessage');
        
        msg.textContent = '';
        msg.className = 'message message-error';

        if (!name || !description || !price || isNaN(quantity)) { 
            msg.textContent = 'Preencha todos os campos corretamente'; 
            return; 
        }
        if (isNaN(price) || price <= 0) { 
            msg.textContent = 'Preço inválido'; 
            return; 
        }
        if (isNaN(quantity) || quantity < 0) { 
            msg.textContent = 'Quantidade inválida'; 
            return; 
        }

        const imageInput = document.getElementById('editProductImage');
        if (imageInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                saveUpdatedProduct(name, description, price, quantity, e.target.result);
            };
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            const products = getProducts();
            const currentProduct = products.find(p => p.id === currentEditingProductId);
            saveUpdatedProduct(name, description, price, quantity, currentProduct ? currentProduct.image : null);
        }
    };

    function saveUpdatedProduct(name, description, price, quantity, image) {
        let products = getProducts();
        const productIndex = products.findIndex(p => p.id === currentEditingProductId);
        
        if (productIndex === -1) {
            alert('Produto não encontrado!');
            return;
        }

        products[productIndex] = {
            ...products[productIndex],
            name,
            description,
            price,
            quantity,
            image: image || products[productIndex].image
        };

        setProducts(products);
        closeEditModal();
        renderAdminProducts();
        
        if (document.getElementById('productsList')) {
            renderProductsList();
        }
        
        alert('Produto atualizado com sucesso!');
    }

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
        
        const productsGrid = document.createElement('div');
        productsGrid.className = 'admin-products-grid';
        list.appendChild(productsGrid);
        
        products.forEach(p => {
            const productCard = document.createElement('div');
            productCard.className = 'admin-product-card';
            
            const quantityClass = p.quantity > 0 ? 'quantity-in-stock' : 'quantity-out-of-stock';
            const quantityText = p.quantity > 0 ? `Em estoque: ${p.quantity}` : 'Fora de estoque';
            
            const productImage = p.image ? 
                `<img src="${p.image}" alt="${p.name}" class="admin-product-image">` :
                `<div class="admin-product-image-placeholder">📦</div>`;
            
            productCard.innerHTML = `
                <div class="admin-product-image-container">
                    ${productImage}
                </div>
                <h4>${p.name}</h4>
                <p>${p.description}</p>
                <div class="admin-product-price">R$ ${Number(p.price).toFixed(2)}</div>
                <div class="admin-product-quantity ${quantityClass}">${quantityText}</div>
                <div class="admin-product-actions">
                    <button class="btn-edit" onclick="editProduct(${p.id})">Editar</button>
                    <button class="btn-remove" onclick="removeProduct(${p.id})">Remover</button>
                </div>
            `;
            productsGrid.appendChild(productCard);
        });
        
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
    };

    // ===============================================
    // FUNÇÕES DE AGENDAMENTO
    // ===============================================

    window.agendamento_init = function(){
        const user = getCurrentUser();
        if (!user) {
            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = '../LoginCadastro/login.html';
            return;
        }

        const hoje = new Date().toISOString().split('T')[0];
        const dataInput = document.getElementById('serviceDate');
        if (dataInput) {
            dataInput.min = hoje;
        }

        updateMenu();
        renderAgendamentos();

        const serviceSelect = document.getElementById('serviceType');
        const hotelNotice = document.getElementById('hotelNotice');
        const serviceTimeGroup = document.getElementById('serviceTimeGroup');
        const serviceTimeInput = document.getElementById('serviceTime');
        const hotelRow = document.getElementById('hotelTimeRow');

        function applyServiceVisibility(value) {
            const dateInput = document.getElementById('serviceDate');
            if (value === 'Hotel de Pet') {
                if (hotelNotice) hotelNotice.style.display = 'block';
                if (hotelRow) {
                    hotelRow.style.display = 'flex';
                    hotelRow.setAttribute('aria-hidden', 'false');
                }
                if (serviceTimeGroup) {
                    serviceTimeGroup.style.display = 'none';
                    if (serviceTimeInput) serviceTimeInput.required = false;
                }
                if (dateInput) {
                    const hoje = new Date();
                    const amanha = new Date(hoje.getTime() + 24*60*60*1000);
                    dateInput.min = hoje.toISOString().split('T')[0];
                    dateInput.max = amanha.toISOString().split('T')[0];
                }
            } else {
                if (hotelNotice) hotelNotice.style.display = 'none';
                if (hotelRow) {
                    hotelRow.style.display = 'none';
                    hotelRow.setAttribute('aria-hidden', 'true');
                }
                if (serviceTimeGroup) {
                    serviceTimeGroup.style.display = 'block';
                    if (serviceTimeInput) serviceTimeInput.required = true;
                }
                if (dateInput) {
                    dateInput.min = new Date().toISOString().split('T')[0];
                    dateInput.removeAttribute('max');
                }
            }
        }

        if (serviceSelect) {
            applyServiceVisibility(serviceSelect.value);
            serviceSelect.addEventListener('change', function(){
                applyServiceVisibility(this.value);
            });
        }
    };

    window.agendarServico = function(){
        const user = getCurrentUser();
        if (!user) return;

        const petName = document.getElementById('petName').value.trim();
        const serviceType = document.getElementById('serviceType').value;
        const serviceDate = document.getElementById('serviceDate').value;
    const serviceTimeEl = document.getElementById('serviceTime');
    const serviceTime = serviceTimeEl ? serviceTimeEl.value : '';
        const address = document.getElementById('address').value.trim();
        const observations = document.getElementById('observations').value.trim();
        
        const msg = document.getElementById('agendamentoMessage');
        msg.textContent = '';

        if (!petName || !serviceType || !serviceDate) {
            msg.textContent = 'Por favor, preencha os campos obrigatórios.';
            msg.className = 'message message-error';
            return;
        }

        const hoje = new Date().toISOString().split('T')[0];
        if (serviceDate < hoje) {
            msg.textContent = 'Não é possível agendar para datas passadas.';
            msg.className = 'message message-error';
            return;
        }

        const agendamentos = getAgendamentos();
        const entryTime = document.getElementById('entryTime') ? document.getElementById('entryTime').value : '';
        const exitTime = document.getElementById('exitTime') ? document.getElementById('exitTime').value : '';

        // For Hotel require entry and exit times
        if (serviceType === 'Hotel de Pet') {
            if (!entryTime || !exitTime) {
                msg.textContent = 'Informe horário de entrada e horário previsto de saída para o Hotel.';
                msg.className = 'message message-error';
                return;
            }
        } else {
            if (!serviceTime) {
                msg.textContent = 'Por favor, selecione o horário do serviço.';
                msg.className = 'message message-error';
                return;
            }
        }

        // Hotel: only today or tomorrow allowed
        if (serviceType === 'Hotel de Pet') {
            const hoje = new Date().toISOString().split('T')[0];
            const amanha = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
            if (serviceDate !== hoje && serviceDate !== amanha) {
                msg.textContent = 'Hotel permite agendamento apenas para hoje ou amanhã.';
                msg.className = 'message message-error';
                return;
            }
            // use date + entryTime as slot
            const slotKey = serviceDate + ' ' + entryTime;
            const sameSlot = agendamentos.filter(a => a.service === 'Hotel de Pet' && ((a.date + ' ' + (a.entryTime || a.time)) === slotKey) && a.status !== 'Cancelado');
            if (sameSlot.length >= 10) {
                msg.textContent = 'Desculpe, não há vagas no Hotel para este dia/horário de entrada.';
                msg.className = 'message message-error';
                return;
            }
        }

        const newAgendamento = {
            id: Date.now(),
            owner: user.username,
            petName,
            service: serviceType,
            date: serviceDate,
            time: serviceType === 'Hotel de Pet' ? '' : serviceTime,
            entryTime: serviceType === 'Hotel de Pet' ? entryTime : '',
            exitTime: serviceType === 'Hotel de Pet' ? exitTime : '',
            address,
            observations,
            status: 'Pendente'
        };

        agendamentos.push(newAgendamento);
        setAgendamentos(agendamentos);
        
        msg.textContent = 'Serviço agendado com sucesso!';
        msg.className = 'message message-success';
        
        document.getElementById('petName').value = '';
        document.getElementById('serviceType').value = '';
    document.getElementById('serviceDate').value = '';
    if (serviceTimeEl) serviceTimeEl.value = '';
    if (document.getElementById('entryTime')) document.getElementById('entryTime').value = '';
    if (document.getElementById('exitTime')) document.getElementById('exitTime').value = '';
        document.getElementById('address').value = '';
        document.getElementById('observations').value = '';
        
        renderAgendamentos();
        setTimeout(() => {
            msg.textContent = '';
            msg.className = 'message message-error hidden';
        }, 3000);
    };

    // ===============================================
    // HOTEL ADMIN VIEW
    // ===============================================

    window.hotelAdmin_init = function(){
        const user = getCurrentUser();
        if (!user || !user.isAdmin) {
            alert('Acesso restrito ao administrador.');
            window.location.href = '../index.html';
            return;
        }

        updateMenu();
        renderHotelPets();
    };

    function renderHotelPets(){
        const list = document.getElementById('hotelPetsList');
        if (!list) return;
        const all = getAgendamentos();
        const nowDate = new Date().toISOString().split('T')[0];
        // Considerar hoje e status não cancelado
        const petsToday = all.filter(a => a.service === 'Hotel de Pet' && a.date === nowDate && a.status !== 'Cancelado');
        list.innerHTML = '';
        if (petsToday.length === 0) {
            list.innerHTML = '<p class="text-center">Nenhum pet hospedado hoje.</p>';
            return;
        }

        petsToday.sort((a,b)=> new Date(a.date+'T'+(a.entryTime || a.time || '00:00')) - new Date(b.date+'T'+(b.entryTime || b.time || '00:00')));
    petsToday.forEach(p => {
            const div = document.createElement('div');
            div.className = 'agendamento-card';
            div.innerHTML = `
        <h4>${p.petName} <small>(${p.owner})</small></h4>
        <p><strong>Data:</strong> ${p.date}</p>
        <p><strong>Entrada:</strong> ${p.entryTime || p.time} &nbsp; <strong>Saída:</strong> ${p.exitTime || '—'}</p>
        <p><strong>Status:</strong> ${p.status}</p>
            `;
            list.appendChild(div);
        });
    }

    function renderAgendamentos(){
        const user = getCurrentUser();
        if (!user) return;

        const list = document.getElementById('agendamentosList');
    const allAgendamentos = getAgendamentos();
    // Exclude cancelled appointments from the user's view
    const userAgendamentos = allAgendamentos.filter(a => a.owner === user.username && a.status !== 'Cancelado');

        list.innerHTML = '';
        if (userAgendamentos.length === 0) {
            list.innerHTML = `
                <div class="empty-agendamentos">
                    <div class="icon">📅</div>
                    <h3>Nenhum agendamento</h3>
                    <p>Você ainda não possui agendamentos.</p>
                </div>
            `;
            return;
        }

        userAgendamentos.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));

        userAgendamentos.forEach(a => {
            const div = document.createElement('div');
            div.className = 'agendamento-card';
            if (a.service === 'Hotel de Pet') {
                const dateStr = new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                div.innerHTML = `
                <h4>
                    <span class="status status-${a.status.toLowerCase()}">${a.status}</span>
                    ${a.service}
                </h4>
                <p><strong>Pet:</strong> ${a.petName}</p>
                <p><strong>Data:</strong> ${dateStr}</p>
                <p><strong>Entrada:</strong> ${a.entryTime || '—'} &nbsp; <strong>Saída:</strong> ${a.exitTime || '—'}</p>
                <p><strong>Endereço:</strong> ${a.address || 'Não informado'}</p>
                <p><strong>Observações:</strong> ${a.observations || 'Nenhuma'}</p>
                <div class="admin-controls">
                    <button class="btn btn-outline btn-small" onclick="cancelarAgendamento(${a.id})">Cancelar</button>
                </div>
            `;
            } else {
                const dt = new Date(a.date + 'T' + (a.time || '00:00'));
                const dataFormatada = dt.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                div.innerHTML = `
                <h4>
                    <span class="status status-${a.status.toLowerCase()}">${a.status}</span>
                    ${a.service}
                </h4>
                <p><strong>Pet:</strong> ${a.petName}</p>
                <p><strong>Data:</strong> ${dataFormatada}</p>
                <p><strong>Endereço:</strong> ${a.address || 'Não informado'}</p>
                <p><strong>Observações:</strong> ${a.observations || 'Nenhuma'}</p>
                <div class="admin-controls">
                    <button class="btn btn-outline btn-small" onclick="cancelarAgendamento(${a.id})">Cancelar</button>
                </div>
            `;
            }
            list.appendChild(div);
        });
    }

    window.cancelarAgendamento = function(agendamentoId){
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

        let agendamentos = getAgendamentos();
        const agendamentoIndex = agendamentos.findIndex(a => a.id === agendamentoId);
        
        if (agendamentoIndex !== -1) {
            agendamentos[agendamentoIndex].status = 'Cancelado';
            setAgendamentos(agendamentos);
            renderAgendamentos();
        }
    };

    // ===============================================
    // FUNÇÕES DO PAINEL ADMIN DE AGENDAMENTOS
    // ===============================================

    window.agendamentosAdmin_init = function(){
        const user = getCurrentUser();
        if (!user || !user.isAdmin) {
            alert('Acesso restrito ao administrador.');
            window.location.href = '../index.html';
            return;
        }

        updateMenu();
        renderAdminAgendamentos();
    };

    function renderAdminAgendamentos(){
        const list = document.getElementById('adminAgendamentosList');
        if (!list) return;

        const allAgendamentos = getAgendamentos();
        list.innerHTML = '';

        if (allAgendamentos.length === 0) {
            list.innerHTML = `
                <div class="empty-agendamentos">
                    <div class="icon">📅</div>
                    <h3>Nenhum agendamento</h3>
                    <p>Nenhum agendamento foi realizado ainda.</p>
                </div>
            `;
            return;
        }

        allAgendamentos.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));

        allAgendamentos.forEach(a => {
            const dataFormatada = new Date(a.date + 'T' + a.time).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const div = document.createElement('div');
            div.className = 'agendamento-card';
            div.innerHTML = `
                <h4>
                    <span class="status status-${a.status.toLowerCase()}">${a.status}</span>
                    ${a.service}
                </h4>
                <p><strong>Cliente:</strong> ${a.owner}</p>
                <p><strong>Pet:</strong> ${a.petName}</p>
                <p><strong>Data:</strong> ${dataFormatada}</p>
                <p><strong>Endereço:</strong> ${a.address || 'Não informado'}</p>
                <p><strong>Observações:</strong> ${a.observations || 'Nenhuma'}</p>
                <div class="admin-controls">
                    <button class="btn btn-primary btn-small" onclick="toggleAgendamentoStatus(${a.id})">
                        ${a.status === 'Pendente' ? 'Marcar como Concluído' : 'Marcar como Pendente'}
                    </button>
                    <button class="btn btn-outline btn-small" onclick="cancelarAgendamentoAdmin(${a.id})">
                        ${a.status === 'Cancelado' ? 'Excluir' : 'Cancelar'}
                    </button>
                </div>
            `;
            list.appendChild(div);
        });
    }

    window.toggleAgendamentoStatus = function(agendamentoId){
        let agendamentos = getAgendamentos();
        const agendamentoIndex = agendamentos.findIndex(a => a.id === agendamentoId);
        
        if (agendamentoIndex !== -1) {
            agendamentos[agendamentoIndex].status = 
                agendamentos[agendamentoIndex].status === 'Pendente' ? 'Concluído' : 'Pendente';
            setAgendamentos(agendamentos);
            renderAdminAgendamentos();
        }
    };

    window.cancelarAgendamentoAdmin = function(agendamentoId){
        if (!confirm('Tem certeza que deseja cancelar/excluir este agendamento?')) return;

        let agendamentos = getAgendamentos();
        const agendamentoIndex = agendamentos.findIndex(a => a.id === agendamentoId);
        
        if (agendamentoIndex !== -1) {
            if (agendamentos[agendamentoIndex].status === 'Cancelado') {
                agendamentos.splice(agendamentoIndex, 1);
            } else {
                agendamentos[agendamentoIndex].status = 'Cancelado';
            }
            setAgendamentos(agendamentos);
            renderAdminAgendamentos();
        }
    };

    // ===============================================
    // FUNÇÃO DE ATUALIZAÇÃO DO MENU
    // ===============================================

    function updateMenu() {
        const user = getCurrentUser();
    const loginLinks = document.querySelectorAll('nav a[href*="login.html"]');
    const cadastroLinks = document.querySelectorAll('nav a[href*="cadastro.html"]');
    const userGreetings = document.querySelectorAll('.user-greeting');
    const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutBtnLoja, #logoutBtnEstoque, #logoutBtnAgendamento, #logoutBtnAdminAgendamentos');
    const stockLinks = document.querySelectorAll('#stockLink, #stockLinkLoja');
    const adminAgendamentosLinks = document.querySelectorAll('#adminAgendamentosLink');
    const lojaLinks = document.querySelectorAll('nav a[href*="loja.html"]');
    const agendamentoLinks = document.querySelectorAll('nav a[href*="agendamento.html"]');
    const hotelLinks = document.querySelectorAll('#hotelAdminLink');
    // Left dropdown elements
    const leftLoginDropdowns = document.querySelectorAll('[id^="leftLoginDropdown"]');
    const leftLoginButtons = document.querySelectorAll('[id^="leftLoginLink"]');

        if (user) {
            // hide top-level login/cadastro when logged in
            loginLinks.forEach(link => link.classList.add('hidden'));
            cadastroLinks.forEach(link => link.classList.add('hidden'));
            // hide left login button once logged in
            leftLoginButtons.forEach(btn => btn.classList.add('hidden'));
            userGreetings.forEach(greeting => {
                greeting.textContent = user.username + (user.isAdmin ? ' (admin)' : '');
            });

            logoutBtns.forEach(btn => btn.classList.remove('hidden'));

            if (user.isAdmin) {
                // Admin view: show admin links, hide public Loja/Agendamento
                stockLinks.forEach(link => link.classList.remove('hidden'));
                adminAgendamentosLinks.forEach(link => link.classList.remove('hidden'));
                hotelLinks.forEach(link => link.classList.remove('hidden'));
                lojaLinks.forEach(l => l.classList.add('hidden'));
                agendamentoLinks.forEach(l => l.classList.add('hidden'));
            } else {
                // Regular user: hide admin links, ensure public links visible
                stockLinks.forEach(link => link.classList.add('hidden'));
                adminAgendamentosLinks.forEach(link => link.classList.add('hidden'));
                hotelLinks.forEach(link => link.classList.add('hidden'));
                lojaLinks.forEach(l => l.classList.remove('hidden'));
                agendamentoLinks.forEach(l => l.classList.remove('hidden'));
            }
        } else {
            // guest
            loginLinks.forEach(link => link.classList.remove('hidden'));
            cadastroLinks.forEach(link => link.classList.remove('hidden'));
            leftLoginButtons.forEach(btn => btn.classList.remove('hidden'));
            userGreetings.forEach(greeting => {
                greeting.textContent = '';
            });

            logoutBtns.forEach(btn => btn.classList.add('hidden'));
            stockLinks.forEach(link => link.classList.add('hidden'));
            adminAgendamentosLinks.forEach(link => link.classList.add('hidden'));
            leftLoginDropdowns.forEach(d => d.classList.add('hidden'));
            // guest sees public nav
            lojaLinks.forEach(l => l.classList.remove('hidden'));
            agendamentoLinks.forEach(l => l.classList.remove('hidden'));
            hotelLinks.forEach(link => link.classList.add('hidden'));
        }
    }

    // Toggle left dropdown menus: clicking the left login button toggles its sibling dropdown
    document.addEventListener('click', function(e){
        const target = e.target;
        // if a left login button was clicked
        if (target && target.id && target.id.startsWith('leftLoginLink')) {
            const dropdownId = target.id.replace('leftLoginLink', 'leftLoginDropdown');
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.classList.toggle('hidden');
            }
            e.preventDefault();
            return;
        }

        // click outside: close all left dropdowns
        const isInsideLeft = target.closest && target.closest('.login-left');
        if (!isInsideLeft) {
            const leftLoginDropdowns = document.querySelectorAll('[id^="leftLoginDropdown"]');
            leftLoginDropdowns.forEach(d => d.classList.add('hidden'));
        }
    });

    // ===============================================
    // INICIALIZAÇÃO
    // ===============================================

    window.addEventListener('DOMContentLoaded', ()=>{
        ensureAdmin();
        updateMenu();
    });

})();