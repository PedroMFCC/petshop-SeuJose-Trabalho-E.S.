document.getElementById('recuperar-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    // Validação no frontend: verifica se as senhas são iguais
    if (novaSenha !== confirmarSenha) {
        alert('As senhas não coincidem. Por favor, tente novamente.');
        return; // Interrompe a execução
    }

    try {
        const response = await fetch('/redefinir-senha', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, novaSenha }),
        });

        const data = await response.json();

        if (response.ok) { // Status 200-299
            alert(data.message);
            window.location.href = 'login.html';
        } else {
            // Mostra a mensagem de erro vinda do servidor (ex: "E-mail não encontrado")
            alert(`Erro: ${data.message}`);
        }

    } catch (error) {
        console.error('Erro ao tentar redefinir a senha:', error);
        alert('Ocorreu um erro de comunicação com o servidor.');
    }
});