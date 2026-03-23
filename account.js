// account.js
const users = [
    { username: "root", password: "114514" },
    { username: "Jonah", password: "4y27" },
    { username: "user", password: "abcd" },
    {username: "account",password:"dddd"}
];

function authenticate(username, password) {
    return users.find(user => user.username === username && user.password === password);
}

let currentUser = null;

function loadCurrentUser() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        currentUser = JSON.parse(stored);
    } else {
        currentUser = null;
    }
}

function saveCurrentUser(user) {
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        currentUser = user;
    } else {
        localStorage.removeItem('currentUser');
        currentUser = null;
    }
}

function isLoggedIn() {
    return currentUser !== null;
}

function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'javascript:history.back()';
    }
}

loadCurrentUser();
