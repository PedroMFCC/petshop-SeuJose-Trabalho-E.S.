async function fazerLogin() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, senha }),
        });

        if (response.ok) {
            const data = await response.json();
            // Guarda as informações do usuário no navegador para usar em outras páginas
            localStorage.setItem('usuarioLogado', JSON.stringify(data.user));
            
            alert('Login bem-sucedido!');
            
            // Redireciona para a página correta com base na função (role)
            if (data.user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            alert('E-mail ou senha inválidos.');
        }
    } catch (error) {
        console.error('Erro ao tentar fazer login:', error);
        alert('Ocorreu um erro. Tente novamente.');
    }
}