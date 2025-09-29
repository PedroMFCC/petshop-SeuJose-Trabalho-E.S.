document.getElementById('cadastro-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await fetch('/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome, email, senha }),
        });

        if (response.status === 201) { // 201 Created = Sucesso
            alert('Cadastro realizado com sucesso! Você será redirecionado para a tela de login.');
            window.location.href = 'login.html';
        } else {
            // Se o servidor retornar outro status, lemos a mensagem de erro
            const data = await response.json();
            alert(`Erro no cadastro: ${data.message}`);
        }
    } catch (error) {
        console.error('Erro ao tentar cadastrar:', error);
        alert('Ocorreu um erro de comunicação com o servidor. Tente novamente.');
    }
});