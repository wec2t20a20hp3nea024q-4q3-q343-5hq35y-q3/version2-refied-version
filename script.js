const loginButton = document.getElementById('loginButton');
        const dropdownMenu = document.getElementById('dropdownMenu');
        const loginModal = document.getElementById('loginModal');
        const usernameInput = document.getElementById('usernameInput');
        const passwordInput = document.getElementById('passwordInput');
        const loginSubmit = document.getElementById('loginSubmit');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const logoutLink = document.getElementById('logoutLink');

        // Update UI based on currentUser
        function updateUI() {
            if (currentUser) {
                loginButton.textContent = `👤 ${currentUser.username}`;
                dropdownMenu.style.display = 'none'; // hide dropdown initially
            } else {
                loginButton.textContent = `🔒 Login`;
                dropdownMenu.style.display = 'none';
            }
        }

        // Show dropdown on click (only if logged in)
        loginButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentUser) {
                // Toggle dropdown
                dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
            } else {
                // Show login modal
                loginModal.style.display = 'flex';
            }
        });

        // Hide dropdown when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!loginArea.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });

        // Login submission
        loginSubmit.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            const user = authenticate(username, password);
            if (user) {
                saveCurrentUser(user);
                updateUI();
                loginModal.style.display = 'none';
                usernameInput.value = '';
                passwordInput.value = '';
            } else {
                alert('Invalid username or password');
            }
        });

        // Close modal
        function closeModal() {
            loginModal.style.display = 'none';
        }
        closeModalBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) closeModal();
        });

        // Logout
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            saveCurrentUser(null);
            updateUI();
            dropdownMenu.style.display = 'none';
        });

        // Initial update
        updateUI();
