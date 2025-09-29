#  PetShop do Seu José 🐾

Este é um projeto acadêmico desenvolvido para a disciplina de Engenharia de Software. O objetivo é simular um sistema web simples para um Pet Shop, implementando funcionalidades essenciais como cadastro, login de usuários e um painel de gerenciamento de produtos para administradores.

## ✨ Funcionalidades

O sistema atualmente conta com:

* **Autenticação de Usuários:**
    * Tela de Login para clientes e administradores.
    * Tela de Cadastro para novos clientes.
    * Tela de Recuperação de Senha simplificada.
* **Visualização de Produtos:**
    * Página inicial onde todos os visitantes podem ver os produtos cadastrados.
* **Painel do Administrador:**
    * O usuário `admin` tem acesso a uma página exclusiva.
    * Adicionar novos produtos à loja.
    * Excluir produtos existentes.

## ⚙️ Tecnologias Utilizadas

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
* **Backend:** Node.js, Express.js
* **Banco de Dados:** Arquivo `db.json` (Flat-file database) para simular persistência de dados.

---

## 🚀 Instalação e Execução do Projeto

Para rodar este projeto em sua máquina local, siga os passos abaixo.

### Pré-requisitos

Antes de começar, você vai precisar ter as seguintes ferramentas instaladas em seu computador:
* [Node.js](https://nodejs.org/en/) (que já vem com o npm)
* [Git](https://git-scm.com/)

### Passo a Passo

1.  **Clone o repositório**
    Abra seu terminal e clone este repositório para a sua máquina:
    ```bash
    git clone [URL_DO_SEU_REPOSITÓRIO_AQUI]
    ```

2.  **Acesse a pasta do projeto**
    ```bash
    cd nome-do-repositorio
    ```

3.  **Instale as dependências**
    Este comando irá ler o arquivo `package.json` e instalará todas as bibliotecas necessárias (como o Express) na pasta `node_modules`.
    ```bash
    npm install
    ```

4.  **Inicie o servidor**
    Com as dependências instaladas, inicie o servidor local:
    ```bash
    node server.js
    ```

5.  **Acesse no navegador**
    Se tudo correu bem, você verá uma mensagem no terminal indicando que o servidor está rodando. Agora, abra seu navegador e acesse:
    [http://localhost:3000/login.html](http://localhost:3000/login.html)

---

## 👨‍💻 Membros do Grupo

* PedroMFCC
* Dak0el
* Lucio
* Heitor
