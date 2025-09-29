const express = require('express');
const fs = require('fs'); // Módulo para interagir com arquivos
const app = express();
const PORT = 3000;

// Middlewares para o servidor entender JSON e servir arquivos estáticos
app.use(express.json());
app.use(express.static(__dirname)); // Serve os arquivos da pasta atual (html, css, js)

// Função para ler o banco de dados
function lerBancoDeDados() {
    const dados = fs.readFileSync('db.json');
    return JSON.parse(dados);
}

// Função para escrever no banco de dados
function escreverBancoDeDados(dados) {
    fs.writeFileSync('db.json', JSON.stringify(dados, null, 2));
}

// --- ROTAS DA API ---

// Rota de Login
app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    const db = lerBancoDeDados();
    
    const usuario = db.usuarios.find(u => u.email === email && u.senha === senha);

    if (usuario) {
        // Login bem-sucedido
        res.status(200).json({ message: "Login bem-sucedido!", user: { email: usuario.email, role: usuario.role } });
    } else {
        // Credenciais inválidas
        res.status(401).json({ message: "E-mail ou senha inválidos." });
    }
});

// Rota para registrar um novo usuário (cliente)
app.post('/usuarios', (req, res) => {
    const { nome, email, senha } = req.body;

    // Validação básica
    if (!nome || !email || !senha || senha.length < 8) {
        return res.status(400).json({ message: "Dados inválidos. Verifique o nome, e-mail e a senha (mínimo 8 caracteres)." });
    }

    const db = lerBancoDeDados();

    // VERIFICA SE O E-MAIL JÁ EXISTE NO BANCO DE DADOS
    const emailExistente = db.usuarios.find(u => u.email === email);
    if (emailExistente) {
        return res.status(409).json({ message: "Este e-mail já está em uso." }); // 409 Conflict
    }

    const novoUsuario = {
        id: db.usuarios.length > 0 ? Math.max(...db.usuarios.map(u => u.id)) + 1 : 1, // Gera um novo ID
        nome,
        email,
        senha, // Em um projeto real, você deveria criptografar a senha aqui!
        role: 'cliente' // Todo novo usuário é um cliente
    };

    db.usuarios.push(novoUsuario);
    escreverBancoDeDados(db);

    res.status(201).json({ message: "Usuário cadastrado com sucesso!", usuario: {id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email} });
});

// Rota para redefinir a senha
app.post('/redefinir-senha', (req, res) => {
    const { email, novaSenha } = req.body;

    // Validação básica no backend
    if (!email || !novaSenha || novaSenha.length < 8) {
        return res.status(400).json({ message: "Dados inválidos." });
    }

    const db = lerBancoDeDados();

    // Encontra o ÍNDICE do usuário no array
    const userIndex = db.usuarios.findIndex(u => u.email === email);

    // Verifica se o usuário foi encontrado
    if (userIndex === -1) {
        return res.status(404).json({ message: "E-mail não encontrado em nosso sistema." });
    }

    // Atualiza a senha do usuário encontrado
    db.usuarios[userIndex].senha = novaSenha;

    // Salva o banco de dados com a senha alterada
    escreverBancoDeDados(db);

    res.status(200).json({ message: "Senha atualizada com sucesso!" });
});

// Rota para obter todos os produtos
app.get('/api/produtos', (req, res) => {
    const db = lerBancoDeDados();
    res.json(db.produtos);
});

// Rota para adicionar um novo produto (apenas para admin)
app.post('/api/produtos', (req, res) => {
    const { nome, preco } = req.body;
    const db = lerBancoDeDados();
    
    const novoProduto = {
        id: db.produtos.length > 0 ? Math.max(...db.produtos.map(p => p.id)) + 1 : 1, // Gera um novo ID
        nome,
        preco: parseFloat(preco)
    };

    db.produtos.push(novoProduto);
    escreverBancoDeDados(db);
    res.status(201).json(novoProduto);
});

// Rota para excluir um produto (apenas para admin)
app.delete('/api/produtos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const db = lerBancoDeDados();
    
    const index = db.produtos.findIndex(p => p.id === id);
    if (index !== -1) {
        db.produtos.splice(index, 1);
        escreverBancoDeDados(db);
        res.status(200).json({ message: 'Produto excluído com sucesso.' });
    } else {
        res.status(404).json({ message: 'Produto não encontrado.' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Acesse a tela de login em http://localhost:${PORT}/login.html`);
});