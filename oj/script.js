        function getUniqueValues(array, key) {
            const values = array.map(item => item[key]).filter(v => v);
            return [...new Set(values)].sort();
        }
        function searchQuestions(question, searchTerm) {
            if (!searchTerm) return true;
            
            const term = searchTerm.toLowerCase().trim();
            
            // Search in question text
            if (question.text.toLowerCase().includes(term)) return true;
            
            // Search in options (for MC questions)
            if (question.options && Array.isArray(question.options)) {
                for (let option of question.options) {
                    if (option.toLowerCase().includes(term)) return true;
                }
            }
            
            // Search in explanation/answer (optional)
            if (question.explain && question.explain.toLowerCase().includes(term)) return true;
            if (question.answer && question.answer.toLowerCase().includes(term)) return true;
            
            return false;
        }
        // Back to Top Button Logic
        (function() {
            const backToTopBtn = document.getElementById('backToTopBtn');
            
            // Show/hide button based on scroll position
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) {
                    backToTopBtn.classList.add('show');
                } else {
                    backToTopBtn.classList.remove('show');
                }
            });
            
            // Scroll to top when clicked
            backToTopBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        })();
        // Global variables
        let currentQuestions = [];
        let currentQuestionItems = [];

        // DOM elements
        const subjectSelect = document.getElementById('subjectFilter');
        const topicSelect = document.getElementById('topicFilter');
        const subtopicSelect = document.getElementById('subtopicFilter');
        const typeSelect = document.getElementById('typeFilter');
        const questionsContainer = document.getElementById('questionsContainer');
        const totalScoreSpan = document.getElementById('totalScoreDisplay');
        const maxScoreSpan = document.getElementById('maxScoreDisplay');
        const resetBtn = document.getElementById('resetBtn');

        // Populate subject dropdown
        function populateSubjects() {
            const subjects = getUniqueValues(database, 'subject');
            subjectSelect.innerHTML = '<option value="all">All Subjects</option>';
            subjects.forEach(s => {
                const option = document.createElement('option');
                option.value = s;
                option.textContent = s;
                subjectSelect.appendChild(option);
            });
        }

        // Update topic dropdown based on selected subject
        function updateTopics() {
            const selectedSubject = subjectSelect.value;
            let topics;
            if (selectedSubject === 'all') {
                topics = getUniqueValues(database, 'topic');
            } else {
                topics = database.filter(q => q.subject === selectedSubject)
                    .map(q => q.topic)
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .sort();
            }
            topicSelect.innerHTML = '<option value="all">All Topics</option>';
            topics.forEach(t => {
                const option = document.createElement('option');
                option.value = t;
                option.textContent = t;
                topicSelect.appendChild(option);
            });
            topicSelect.disabled = false;
            // Reset subtopic and type
            updateSubtopics();
        }

        // Update subtopic dropdown based on subject and topic
        function updateSubtopics() {
            const selectedSubject = subjectSelect.value;
            const selectedTopic = topicSelect.value;
            let subtopics;
            if (selectedSubject === 'all' && selectedTopic === 'all') {
                subtopics = getUniqueValues(database, 'subtopic');
            } else {
                let filtered = database;
                if (selectedSubject !== 'all') filtered = filtered.filter(q => q.subject === selectedSubject);
                if (selectedTopic !== 'all') filtered = filtered.filter(q => q.topic === selectedTopic);
                subtopics = filtered.map(q => q.subtopic).filter((v, i, a) => a.indexOf(v) === i).sort();
            }
            subtopicSelect.innerHTML = '<option value="all">All Subtopics</option>';
            subtopics.forEach(st => {
                const option = document.createElement('option');
                option.value = st;
                option.textContent = st;
                subtopicSelect.appendChild(option);
            });
            subtopicSelect.disabled = false;
            // Enable type select
            typeSelect.disabled = false;
            // After updating, load questions
            loadQuestions();
        }

        // Load questions based on current filters
        function loadQuestions() {
            const subject = subjectSelect.value;
            const topic = topicSelect.value;
            const subtopic = subtopicSelect.value;
            const type = typeSelect.value;
            const searchTerm = document.getElementById('searchInput').value;

            let filtered = database;
            
            // Apply filters
            if (subject !== 'all') filtered = filtered.filter(q => q.subject === subject);
            if (topic !== 'all') filtered = filtered.filter(q => q.topic === topic);
            if (subtopic !== 'all') filtered = filtered.filter(q => q.subtopic === subtopic);
            if (type !== 'all') filtered = filtered.filter(q => q.type === type);
            
            // Apply search
            if (searchTerm) {
                filtered = filtered.filter(q => searchQuestions(q, searchTerm));
            }

            currentQuestions = filtered;
            renderQuestions();
        }

        // Render math with KaTeX after DOM updates
        function renderMath() {
            if (typeof renderMathInElement === 'function') {
                renderMathInElement(document.body, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false}
                    ],
                    throwOnError: false
                });
            } else {
                // Wait 100ms and try again (library not loaded yet)
                setTimeout(renderMath, 100);
            }
        }

        // Render questions
        function renderQuestions() {
            questionsContainer.innerHTML = '';
            currentQuestionItems = [];

            if (currentQuestions.length === 0) {
                questionsContainer.innerHTML = '<div style="text-align:center; padding:3rem;">📭 No questions match your selection.</div>';
                updateScoreSummary();
                renderMath();
                return;
            }

            for (let idx = 0; idx < currentQuestions.length; idx++) {
                const q = currentQuestions[idx];
                const card = document.createElement('div');
                card.className = 'question-card';
                card.dataset.id = idx;

                // Title row
                const titleRow = document.createElement('div');
                titleRow.className = 'question-title-row';

                const checkBtn = document.createElement('button');
                checkBtn.className = 'check-btn';
                checkBtn.innerHTML = 'Submit';
                checkBtn.setAttribute('data-qid', idx);

                const typeLabel = q.type === 'MC' ? 'MC' : 'LQ';
                const typeClass = q.type === 'MC' ? 'choice' : 'long';
                const typeSpan = document.createElement('span');
                typeSpan.className = `q-type-badge ${typeClass}`;
                typeSpan.innerText = typeLabel;

                const questionSpan = document.createElement('span');
                questionSpan.className = 'question-text';
                questionSpan.innerHTML = q.text;

                const pointsSpan = document.createElement('span');
                pointsSpan.className = 'points-badge';
                pointsSpan.innerText = `${q.points} marks`;

                titleRow.appendChild(checkBtn);
                titleRow.appendChild(typeSpan);
                titleRow.appendChild(questionSpan);
                titleRow.appendChild(pointsSpan);
                card.appendChild(titleRow);

                // Input area
                const inputWrapper = document.createElement('div');
                inputWrapper.className = 'answer-input';
                let getAnswerFunc = null;
                let resetElement = null;
                let radioGroupName = null;

                if (q.type === 'MC') {
                    const optionsDiv = document.createElement('div');
                    optionsDiv.className = 'options-area';
                    const groupName = `q_${idx}_${Date.now()}`;
                    radioGroupName = groupName;
                    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                    q.options.forEach((opt, optIdx) => {
                        const letter = letters[optIdx];
                        const optionDiv = document.createElement('div');
                        optionDiv.className = 'option-item';
                        const radio = document.createElement('input');
                        radio.type = 'radio';
                        radio.name = groupName;
                        radio.value = letter;
                        const label = document.createElement('label');
                        label.textContent = `${letter}. ${opt}`;
                        optionDiv.appendChild(radio);
                        optionDiv.appendChild(label);
                        optionsDiv.appendChild(optionDiv);
                    });
                    inputWrapper.appendChild(optionsDiv);
                    getAnswerFunc = () => {
                        const radios = document.getElementsByName(groupName);
                        for (let r of radios) if (r.checked) return r.value;
                        return '';
                    };
                    resetElement = { type: 'radio', name: groupName };
                } else {
                    // LQ: textarea
                    const textarea = document.createElement('textarea');
                    textarea.placeholder = 'Enter your answer...';
                    textarea.rows = 4;
                    inputWrapper.appendChild(textarea);
                    getAnswerFunc = () => textarea.value.trim();
                    resetElement = textarea;
                }
                card.appendChild(inputWrapper);

                // Feedback area
                const feedbackDiv = document.createElement('div');
                feedbackDiv.className = 'feedback';
                feedbackDiv.id = `feedback_${idx}`;
                feedbackDiv.innerHTML = 'Click Check to grade.';
                card.appendChild(feedbackDiv);

                questionsContainer.appendChild(card);

                currentQuestionItems.push({
                    id: idx,
                    data: q,
                    getAnswer: getAnswerFunc,
                    feedbackDiv: feedbackDiv,
                    resetElement: resetElement,
                    radioGroupName: radioGroupName,
                    checkButton: checkBtn
                });
            }

            // Bind check button events
            for (let item of currentQuestionItems) {
                item.checkButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    checkSingleQuestion(item);
                });
            }

            updateScoreSummary();
            renderMath();
        }

        // Check a single question (MC or LQ)
        function checkSingleQuestion(item) {
            const q = item.data;
            const userAnswer = item.getAnswer();
            const fbDiv = item.feedbackDiv;

            if (q.type === 'MC') {
                const correctLetter = q.letter;
                const isCorrect = (userAnswer && userAnswer.toUpperCase() === correctLetter);
                if (isCorrect) {
                    fbDiv.innerHTML = `<strong>Accepted</strong> ${q.explain || ''}<br>Correct answer: ${correctLetter}`;
                    fbDiv.className = 'feedback correct';
                    if (!item.pointsAdded) {
                        item.pointsAdded = true;
                        addPoints(q.points);
                    }
                } else {
                    const userShow = userAnswer ? `` : ': user_input_is_null';
                    fbDiv.innerHTML = `<strong>Wrong Answer</strong> ${userShow}<br>Correct answer: ${correctLetter}<br>${q.explain || ''}`;
                    fbDiv.className = 'feedback wrong';
                    if (item.pointsAdded) {
                        subtractPoints(q.points);
                        item.pointsAdded = false;
                    }
                }
                renderMath(); // re-render math in case explain contains LaTeX
            } else if(q.type=='LQ'){ // LQ
                const reference = q.explain || 'No reference answer provided.';
                const userShow = userAnswer || '_user_input_is_null';
                fbDiv.innerHTML = `
                    <div><strong>Your answer:</strong><br> ${escapeHtml(userShow)}</div>
                    <div style="margin-top:6px;"><strong>Reference answer:</strong><br> ${escapeHtml(reference)}</div>
                    <div class="lq-buttons">
                        <button class="lq-btn correct" data-action="correct">✓ Correct</button>
                        <button class="lq-btn wrong" data-action="wrong">✗ Wrong</button>
                    </div>
                `;
                fbDiv.className = 'feedback info';
                // Render math inside the new content
                renderMath();
                // Attach event listeners to the buttons
                const correctBtn = fbDiv.querySelector('.lq-btn.correct');
                const wrongBtn = fbDiv.querySelector('.lq-btn.wrong');
                const handleCorrect = () => {
                    if (!item.pointsAdded) {
                        item.pointsAdded = true;
                        addPoints(q.points);
                    }
                    fbDiv.querySelector('.lq-buttons').innerHTML = '<span style="color:green;">✓ Marked as correct</span>';
                };
                const handleWrong = () => {
                    if (item.pointsAdded) {
                        subtractPoints(q.points);
                        item.pointsAdded = false;
                    }
                    fbDiv.querySelector('.lq-buttons').innerHTML = '<span style="color:red;">✗ Marked as wrong</span>';
                };
                correctBtn.onclick = handleCorrect;
                wrongBtn.onclick = handleWrong;
            }
        }

        // Add points to total score and update display
        function addPoints(points) {
            let current = parseInt(totalScoreSpan.textContent) || 0;
            current += points;
            totalScoreSpan.textContent = current;
        }

        function subtractPoints(points) {
            let current = parseInt(totalScoreSpan.textContent) || 0;
            current = Math.max(0, current - points);
            totalScoreSpan.textContent = current;
        }

        // Reset all answers and scores
        function resetAll() {
            for (let item of currentQuestionItems) {
                item.feedbackDiv.innerHTML = 'Click Check to grade.';
                item.feedbackDiv.className = 'feedback';
                if (item.data.type === 'MC' && item.radioGroupName) {
                    const radios = document.getElementsByName(item.radioGroupName);
                    radios.forEach(r => r.checked = false);
                } else if (item.resetElement) {
                    if (item.resetElement.tagName === 'TEXTAREA') {
                        item.resetElement.value = '';
                    }
                }
                if (item.pointsAdded) {
                    subtractPoints(item.data.points);
                    item.pointsAdded = false;
                }
            }
            totalScoreSpan.textContent = '0';
            updateScoreSummary();
        }

        // Update max possible score based on displayed questions
        function updateScoreSummary() {
            const maxPossible = currentQuestions.reduce((sum, q) => sum + q.points, 0);
            maxScoreSpan.textContent = maxPossible;
        }

        // Helper to escape HTML
        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        }

        // Event listeners for filters
        function bindFilterEvents() {
            subjectSelect.addEventListener('change', () => {
                updateTopics();
            });
            topicSelect.addEventListener('change', () => {
                updateSubtopics();
            });
            subtopicSelect.addEventListener('change', () => {
                loadQuestions();
            });
            typeSelect.addEventListener('change', () => {
                loadQuestions();
            });
            const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    // Search as you type
                    searchInput.addEventListener('input', () => {
                        loadQuestions();
                    });
                }
        }

        // Initialization
        function init() {
            populateSubjects();
            updateTopics();   // This also loads questions after building subtopics
            bindFilterEvents();
            resetBtn.addEventListener('click', resetAll);
        }

        init();

        // ====================== Login integration (from account.js) ======================
        // (Assume account.js is loaded and provides authenticate, saveCurrentUser, currentUser)
        const loginButton = document.getElementById('loginButton');
        const dropdownMenu = document.getElementById('dropdownMenu');
        const loginModal = document.getElementById('loginModal');
        const usernameInput = document.getElementById('usernameInput');
        const passwordInput = document.getElementById('passwordInput');
        const loginSubmit = document.getElementById('loginSubmit');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const logoutLink = document.getElementById('logoutLink');

        function updateLoginUI() {
            if (typeof currentUser !== 'undefined' && currentUser) {
                loginButton.textContent = `👤 ${currentUser.username}`;
                dropdownMenu.style.display = 'none';
            } else {
                loginButton.textContent = `🔒 Login`;
                dropdownMenu.style.display = 'none';
            }
        }

        loginButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof currentUser !== 'undefined' && currentUser) {
                dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
            } else {
                loginModal.style.display = 'flex';
            }
        });

        document.addEventListener('click', (e) => {
            if (!document.getElementById('loginArea').contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });

        loginSubmit.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            if (typeof authenticate !== 'undefined') {
                const user = authenticate(username, password);
                if (user) {
                    if (typeof saveCurrentUser !== 'undefined') saveCurrentUser(user);
                    updateLoginUI();
                    loginModal.style.display = 'none';
                    usernameInput.value = '';
                    passwordInput.value = '';
                } else {
                    alert('Invalid username or password');
                }
            } else {
                alert('Authentication not available. Please check account.js.');
            }
        });
        document.getElementById('submitAllBtn').addEventListener('click', () => {
            // Loop through all currently displayed questions
            for (let item of currentQuestionItems) {
                // This will trigger the same grading logic as clicking the individual Check button
                checkSingleQuestion(item);
            }
        });
        function closeModal() {
            loginModal.style.display = 'none';
        }
        closeModalBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) closeModal();
        });

        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof saveCurrentUser !== 'undefined') saveCurrentUser(null);
            updateLoginUI();
            dropdownMenu.style.display = 'none';
        });
