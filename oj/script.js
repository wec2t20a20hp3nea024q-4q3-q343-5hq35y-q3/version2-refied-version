const STORAGE_KEY = 'dse_quiz_state';
const FILTERS_STORAGE_KEY = 'dse_quiz_filters';

// Assign a stable unique ID to each question if not already present
if (typeof database !== 'undefined') {
    database.forEach((q, idx) => {
        if (!q.uid) {
            q.uid = 'q_' + idx; // stable ID based on index
        }
    });
}

// Global saved state from localStorage
let savedState = null;
let restoredFirstBatch = false;

function saveState() {
    const state = {
        answers: {},
        scores: {},
        totalScore: document.getElementById('totalScoreDisplay').innerText,
        showExplanations: document.getElementById('toggleExplanation')?.checked || true
    };
    currentQuestionItems.forEach(item => {
        const ans = item.getAnswer ? item.getAnswer() : '';
        if (ans) state.answers[item.data.uid] = ans;  // use UID as key
        if (item.pointsAdded) state.scores[item.data.uid] = true;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    savedState = state;
    return state;
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch (e) {
        console.error('Failed to parse saved state', e);
        return null;
    }
}

function saveFilters() {
    const filters = {
        subject: subjectSelect.value,
        topic: topicSelect.value,
        subtopic: subtopicSelect.value,
        type: typeSelect.value,
        search: document.getElementById('searchInput').value
    };
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
}

function loadFilters() {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch (e) {
        console.error('Failed to parse filters', e);
        return null;
    }
}

function applySavedStateToItem(item) {
    if (!savedState) return;
    const uid = item.data.uid;
    if (savedState.answers[uid]) {
        const answer = savedState.answers[uid];
        if (item.data.type === 'MC') {
            const radios = document.getElementsByName(item.radioGroupName);
            for (let radio of radios) {
                if (radio.value === answer) {
                    radio.checked = true;
                    break;
                }
            }
        } else if (item.resetElement && item.resetElement.tagName === 'TEXTAREA') {
            item.resetElement.value = answer;
        }
    }
    if (savedState.scores[uid]) {
        item.pointsAdded = true;
    }
}

function getUniqueValues(array, key) {
    const values = array.map(item => item[key]).filter(v => v);
    return [...new Set(values)].sort();
}

function searchQuestions(question, searchTerm) {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    if (question.text.toLowerCase().includes(term)) return true;
    if (question.options && Array.isArray(question.options)) {
        for (let option of question.options) {
            if (option.toLowerCase().includes(term)) return true;
        }
    }
    if (question.explain && question.explain.toLowerCase().includes(term)) return true;
    if (question.answer && question.answer.toLowerCase().includes(term)) return true;
    return false;
}

// Back to Top Button Logic
(function() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    backToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

// Global variables
let currentQuestions = [];
let currentQuestionItems = [];
let renderedCount = 0;
const BATCH_SIZE = 10;
let showExplanations = true;
let loadingMore = false;

// DOM elements
const subjectSelect = document.getElementById('subjectFilter');
const topicSelect = document.getElementById('topicFilter');
const subtopicSelect = document.getElementById('subtopicFilter');
const typeSelect = document.getElementById('typeFilter');
const questionsContainer = document.getElementById('questionsContainer');
const totalScoreSpan = document.getElementById('totalScoreDisplay');
const maxScoreSpan = document.getElementById('maxScoreDisplay');
const resetBtn = document.getElementById('resetBtn');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const questionCountDisplay = document.getElementById('questionCountDisplay');
const totalQuestionCountDisplay = document.getElementById('totalQuestionCountDisplay');

// LOAD ALL: reference to the button (create if not exists)
let loadAllBtn = document.getElementById('loadAllBtn');
if (!loadAllBtn) {
    const statsBar = document.querySelector('.stats-bar');
    if (statsBar) {
        loadAllBtn = document.createElement('button');
        loadAllBtn.id = 'loadAllBtn';
        loadAllBtn.className = 'load-all-btn';
        loadAllBtn.textContent = 'Load all questions';
        statsBar.appendChild(loadAllBtn);
    } else {
        console.warn('Stats bar not found, cannot create Load all button');
    }
}

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

function updateTopics(skipLoad = false) {
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
    updateSubtopics(skipLoad);
}

function updateSubtopics(skipLoad = false) {
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
    typeSelect.disabled = false;
    if (!skipLoad) {
        loadQuestions(); // no longer pass clearState
    }
}

function loadQuestions() {
    const subject = subjectSelect.value;
    const topic = topicSelect.value;
    const subtopic = subtopicSelect.value;
    const type = typeSelect.value;
    const searchTerm = document.getElementById('searchInput').value;

    let filtered = database;
    if (subject !== 'all') filtered = filtered.filter(q => q.subject === subject);
    if (topic !== 'all') filtered = filtered.filter(q => q.topic === topic);
    if (subtopic !== 'all') filtered = filtered.filter(q => q.subtopic === subtopic);
    if (type !== 'all') filtered = filtered.filter(q => q.type === type);
    if (searchTerm) filtered = filtered.filter(q => searchQuestions(q, searchTerm));

    currentQuestions = filtered;
    renderedCount = 0;
    currentQuestionItems = [];
    questionsContainer.innerHTML = '';
    loadMoreContainer.innerHTML = '';
    totalQuestionCountDisplay.textContent = currentQuestions.length;

    // DO NOT clear savedState – answers will be restored for questions that are present

    if (loadAllBtn) {
        loadAllBtn.disabled = false;
        loadAllBtn.style.display = '';
    }

    loadMore();
    updateScoreSummary();
}

function updateQuestionCount() {
    questionCountDisplay.textContent = renderedCount;
}

function renderBatch() {
    const start = renderedCount;
    const end = Math.min(start + BATCH_SIZE, currentQuestions.length);
    if (start >= end) return false;

    for (let idx = start; idx < end; idx++) {
        const q = currentQuestions[idx];
        const card = document.createElement('div');
        card.className = 'question-card';
        card.dataset.id = idx;

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

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'answer-input';
        let getAnswerFunc = null;
        let resetElement = null;
        let radioGroupName = null;

        if (q.type === 'MC') {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'options-area';
            const groupName = `q_${q.uid}_${Date.now()}_${Math.random()}`; // use uid in group name for uniqueness
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
            const textarea = document.createElement('textarea');
            textarea.placeholder = 'Enter your answer...';
            textarea.rows = 4;
            inputWrapper.appendChild(textarea);
            getAnswerFunc = () => textarea.value.trim();
            resetElement = textarea;
        }
        card.appendChild(inputWrapper);

        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback';
        feedbackDiv.id = `feedback_${q.uid}_${Date.now()}_${Math.random()}`;
        feedbackDiv.innerHTML = 'Click Check to grade.';
        card.appendChild(feedbackDiv);

        questionsContainer.appendChild(card);

        const item = {
            id: idx,
            data: q,
            getAnswer: getAnswerFunc,
            feedbackDiv: feedbackDiv,
            resetElement: resetElement,
            radioGroupName: radioGroupName,
            checkButton: checkBtn,
            pointsAdded: false
        };
        currentQuestionItems.push(item);
        applySavedStateToItem(item);

        checkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = currentQuestionItems.find(i => i.data.uid === q.uid);
            if (item) checkSingleQuestion(item);
        });
    }

    renderedCount = end;
    updateQuestionCount();

    if (!restoredFirstBatch && savedState) {
        totalScoreSpan.innerText = savedState.totalScore;
        const toggle = document.getElementById('toggleExplanation');
        if (toggle) {
            toggle.checked = savedState.showExplanations;
            showExplanations = savedState.showExplanations;
            toggleExplanationsVisibility();
        }
        restoredFirstBatch = true;
    }

    return true;
}

function loadMore() {
    if (loadingMore) return;
    if (renderedCount >= currentQuestions.length) {
        if (loadMoreContainer.innerHTML !== '') {
            loadMoreContainer.innerHTML = '<div style="text-align:center; padding:10px; color:#666;">✨ All questions loaded</div>';
        }
        if (loadAllBtn) loadAllBtn.disabled = true;
        return;
    }

    loadingMore = true;
    setTimeout(() => {
        const rendered = renderBatch();
        loadingMore = false;
        if (!rendered) {
            loadMoreContainer.innerHTML = '<div style="text-align:center; padding:10px; color:#666;">✨ All questions loaded</div>';
            if (loadAllBtn) loadAllBtn.disabled = true;
        } else {
            if (renderedCount < currentQuestions.length) {
                loadMoreContainer.innerHTML = '';
            } else {
                loadMoreContainer.innerHTML = '<div style="text-align:center; padding:10px; color:#666;">✨ All questions loaded</div>';
                if (loadAllBtn) loadAllBtn.disabled = true;
            }
        }
        toggleExplanationsVisibility();
        renderMath();
    }, 50);
}

function loadAllQuestions() {
    if (renderedCount >= currentQuestions.length) {
        if (loadAllBtn) loadAllBtn.disabled = true;
        return;
    }
    if (loadAllBtn) loadAllBtn.disabled = true;
    function loadNextBatch() {
        if (renderedCount >= currentQuestions.length) {
            loadMoreContainer.innerHTML = '<div style="text-align:center; padding:10px; color:#666;">✨ All questions loaded</div>';
            if (loadAllBtn) loadAllBtn.disabled = true;
            toggleExplanationsVisibility();
            renderMath();
            return;
        }
        const rendered = renderBatch();
        if (rendered) {
            setTimeout(loadNextBatch, 20);
        } else {
            if (loadAllBtn) loadAllBtn.disabled = true;
            toggleExplanationsVisibility();
            renderMath();
        }
    }
    loadNextBatch();
}

function handleScroll() {
    if (loadingMore) return;
    if (renderedCount >= currentQuestions.length) return;
    const scrollPosition = window.scrollY + window.innerHeight;
    const threshold = document.documentElement.scrollHeight - 200;
    if (scrollPosition >= threshold) {
        loadMore();
    }
}

function toggleExplanationsVisibility() {
    const explanationSpans = document.querySelectorAll('.explanation-text');
    explanationSpans.forEach(span => {
        span.style.display = showExplanations ? '' : 'none';
    });
}

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
        setTimeout(renderMath, 100);
    }
}

function checkSingleQuestion(item) {
    const q = item.data;
    const userAnswer = item.getAnswer();
    const fbDiv = item.feedbackDiv;

    if (q.type === 'MC') {
        const correctLetter = q.letter;
        const isCorrect = (userAnswer && userAnswer.toUpperCase() === correctLetter);
        const explanationHtml = q.explain ? `<span class="explanation-text" style="display: ${showExplanations ? '' : 'none'};">${escapeHtml(q.explain)}</span>` : '';
        
        if (isCorrect) {
            fbDiv.innerHTML = `<strong>Accepted</strong> ${explanationHtml}<br>Correct answer: ${correctLetter}`;
            fbDiv.className = 'feedback correct';
            if (!item.pointsAdded) {
                item.pointsAdded = true;
                addPoints(q.points);
            }
        } else {
            const userShow = userAnswer ? `Your answer: ${userAnswer}<br>` : '';
            fbDiv.innerHTML = `<strong>Wrong Answer</strong><br>${userShow}${explanationHtml}<br>Correct answer: ${correctLetter}`;
            fbDiv.className = 'feedback wrong';
            if (item.pointsAdded) {
                subtractPoints(q.points);
                item.pointsAdded = false;
            }
        }
        renderMath();
    } else if (q.type === 'LQ') {
        const reference = q.explain || 'No reference answer provided.';
        const userShow = userAnswer || '_user_input_is_null';
        const explanationDisplayStyle = showExplanations ? '' : 'none';
        
        fbDiv.innerHTML = `
            <div><strong>Your answer:</strong><br> ${escapeHtml(userShow)}</div>
            <div style="margin-top:6px;" class="explanation-text" style="display: ${explanationDisplayStyle};"><strong>Reference answer:</strong><br> ${escapeHtml(reference)}</div>
            <div class="lq-buttons">
                <button class="lq-btn correct" data-action="correct">✓ Correct</button>
                <button class="lq-btn wrong" data-action="wrong">✗ Wrong</button>
            </div>
        `;
        const explanationDiv = fbDiv.querySelector('.explanation-text');
        if (explanationDiv) explanationDiv.style.display = explanationDisplayStyle;
        
        fbDiv.className = 'feedback info';
        renderMath();
        
        const correctBtn = fbDiv.querySelector('.lq-btn.correct');
        const wrongBtn = fbDiv.querySelector('.lq-btn.wrong');
        const handleCorrect = () => {
            if (!item.pointsAdded) {
                item.pointsAdded = true;
                addPoints(q.points);
            }
            fbDiv.querySelector('.lq-buttons').innerHTML = '<span style="color:green;">✓ Marked as correct</span>';
            saveState();
        };
        const handleWrong = () => {
            if (item.pointsAdded) {
                subtractPoints(q.points);
                item.pointsAdded = false;
            }
            fbDiv.querySelector('.lq-buttons').innerHTML = '<span style="color:red;">✗ Marked as wrong</span>';
            saveState();
        };
        correctBtn.onclick = handleCorrect;
        wrongBtn.onclick = handleWrong;
    }
    
    saveState();
}

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
    saveState(); // this will overwrite saved state with empty answers
}

function updateScoreSummary() {
    const maxPossible = currentQuestions.reduce((sum, q) => sum + q.points, 0);
    maxScoreSpan.textContent = maxPossible;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function bindFilterEvents() {
    subjectSelect.addEventListener('change', () => {
        updateTopics(false);
        loadQuestions();
        saveFilters();
    });
    topicSelect.addEventListener('change', () => {
        updateSubtopics(false);
        loadQuestions();
        saveFilters();
    });
    subtopicSelect.addEventListener('change', () => {
        loadQuestions();
        saveFilters();
    });
    typeSelect.addEventListener('change', () => {
        loadQuestions();
        saveFilters();
    });
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            loadQuestions();
            saveFilters();
        });
    }
}

function init() {
    // Load saved filters first
    const savedFilters = loadFilters();
    if (savedFilters) {
        if (savedFilters.subject && savedFilters.subject !== 'all') {
            subjectSelect.value = savedFilters.subject;
        }
        if (savedFilters.topic && savedFilters.topic !== 'all') {
            topicSelect.value = savedFilters.topic;
        }
        if (savedFilters.subtopic && savedFilters.subtopic !== 'all') {
            subtopicSelect.value = savedFilters.subtopic;
        }
        if (savedFilters.type && savedFilters.type !== 'all') {
            typeSelect.value = savedFilters.type;
        }
        const searchInput = document.getElementById('searchInput');
        if (searchInput && savedFilters.search) {
            searchInput.value = savedFilters.search;
        }
    }

    // Build dropdowns without loading questions (skipLoad = true)
    populateSubjects();
    updateTopics(true);

    // Load saved question state
    savedState = loadState();
    loadQuestions(); // this will restore answers via applySavedStateToItem

    bindFilterEvents();
    resetBtn.addEventListener('click', resetAll);
    
    const toggleCheckbox = document.getElementById('toggleExplanation');
    if (toggleCheckbox) {
        if (savedState && savedState.showExplanations !== undefined) {
            toggleCheckbox.checked = savedState.showExplanations;
            showExplanations = savedState.showExplanations;
        } else {
            toggleCheckbox.checked = showExplanations;
        }
        toggleCheckbox.addEventListener('change', (e) => {
            showExplanations = e.target.checked;
            toggleExplanationsVisibility();
            saveState();
        });
    }
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    window.addEventListener('beforeunload', saveState);
    
    if (loadAllBtn) {
        loadAllBtn.addEventListener('click', loadAllQuestions);
    }
}

init();

// ====================== Login integration ======================
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
    for (let item of currentQuestionItems) {
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
