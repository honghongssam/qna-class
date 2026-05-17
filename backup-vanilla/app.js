// ==========================================================================
// 1. 파이어베이스(Firebase) 설정 정보
// --------------------------------------------------------------------------
// [클라우드 연동 방법]
// 구글 파이어베이스 콘솔(https://console.firebase.google.com/)에서 프로젝트를 만드신 후,
// '웹(Web)' 앱을 추가하여 발급받은 설정값을 아래에 붙여넣어 주세요!
// 설정값을 붙여넣기 전까지는 자동으로 '로컬 브라우저 저장(무료)' 모드로 작동합니다.
// ==========================================================================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// --------------------------------------------------------------------------
// 2. 테스트 사용자 정보 (요청에 따라 user_01 계정으로 임시 로그인 가정)
// --------------------------------------------------------------------------
const CURRENT_USER = {
    id: "user_01",
    name: "user_01" // 학생 이름
};

// --------------------------------------------------------------------------
// 3. 파이어베이스 설정 여부 확인 및 데이터베이스 모드 결정
// --------------------------------------------------------------------------
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";
let dbService = null;

// 공통 데이터베이스 인터페이스 정의 (추상화)
class DatabaseAdapter {
    async getQuestions() {}
    async addQuestion(title, content, tags) {}
    async addComment(questionId, commentContent) {}
    subscribeQuestions(callback) {} // 실시간 감지용 함수
}

// --------------------------------------------------------------------------
// 4. 로컬 스토리지 모드 구현 (Firebase 연결 전 임시/무료 오프라인 모드)
// --------------------------------------------------------------------------
class LocalStorageAdapter extends DatabaseAdapter {
    constructor() {
        super();
        this.listeners = [];
        // 기본 더미 데이터 탑재
        if (!localStorage.getItem("study_questions")) {
            const dummyData = [
                {
                    id: "dummy-1",
                    title: "수학 1단원 올림과 버림이 헷갈려요!",
                    content: "올림은 올릴 수가 없어도 올리는 거고, 버림은 남는 수가 있어도 버리는 것 같은데... 일상생활에서 어떤 상황에 쓰이는지 예시로 설명해 주실 분 있나요?",
                    tags: ["수학", "1단원", "올림버림"],
                    authorId: "student_03",
                    createdAt: Date.now() - 3600000 * 2, // 2시간 전
                    comments: [
                        {
                            id: "comment-1",
                            authorId: "student_05",
                            content: "올림은 '버스 승차 인원 계산'할 때 좋아요! 예로 11명이 버스를 타야 하는데 버스 한 대에 10명만 탈 수 있다면, 2대가 필요하잖아요. 이때 올림을 씁니다!",
                            createdAt: Date.now() - 3600000
                        }
                    ]
                },
                {
                    id: "dummy-2",
                    title: "영어 지문에서 'enable' 동사 용법 질문",
                    content: "enable은 뒤에 목적어 오고 to 부정사가 오나요? 예문이랑 같이 알려주시면 감사하겠습니다!",
                    tags: ["영어", "문법", "enable"],
                    authorId: "student_02",
                    createdAt: Date.now() - 3600000 * 5, // 5시간 전
                    comments: []
                }
            ];
            localStorage.setItem("study_questions", JSON.stringify(dummyData));
        }
    }

    _getData() {
        return JSON.parse(localStorage.getItem("study_questions")) || [];
    }

    _setData(data) {
        localStorage.setItem("study_questions", JSON.stringify(data));
        // 실시간 변경 리스너들에게 데이터 전송
        this.listeners.forEach(callback => callback(data));
    }

    async getQuestions() {
        return this._getData();
    }

    async addQuestion(title, content, tags) {
        const data = this._getData();
        const newQuestion = {
            id: "local_" + Math.random().toString(36).substr(2, 9),
            title: title,
            content: content,
            tags: tags,
            authorId: CURRENT_USER.id,
            createdAt: Date.now(),
            comments: []
        };
        data.unshift(newQuestion); // 최신 글이 맨 위로 가도록 추가
        this._setData(data);
        return newQuestion;
    }

    async addComment(questionId, commentContent) {
        const data = this._getData();
        const question = data.find(q => q.id === questionId);
        if (question) {
            const newComment = {
                id: "comment_" + Math.random().toString(36).substr(2, 9),
                authorId: CURRENT_USER.id,
                content: commentContent,
                createdAt: Date.now()
            };
            question.comments.push(newComment);
            this._setData(data);
            return newComment;
        }
        throw new Error("질문을 찾을 수 없습니다.");
    }

    subscribeQuestions(callback) {
        this.listeners.push(callback);
        // 등록 즉시 현재 데이터 한번 보내주기
        callback(this._getData());
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
}

// --------------------------------------------------------------------------
// 5. 파이어베이스(Firebase Firestore) 클라우드 데이터베이스 모드 구현
// --------------------------------------------------------------------------
class FirebaseAdapter extends DatabaseAdapter {
    constructor() {
        super();
        // 파이어베이스 초기화
        firebase.initializeApp(firebaseConfig);
        this.db = firebase.firestore();
    }

    async getQuestions() {
        const snapshot = await this.db.collection("questions").orderBy("createdAt", "desc").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addQuestion(title, content, tags) {
        const newQuestion = {
            title: title,
            content: content,
            tags: tags,
            authorId: CURRENT_USER.id,
            createdAt: Date.now(),
            comments: []
        };
        const docRef = await this.db.collection("questions").add(newQuestion);
        return { id: docRef.id, ...newQuestion };
    }

    async addComment(questionId, commentContent) {
        const newComment = {
            id: "comment_" + Math.random().toString(36).substr(2, 9),
            authorId: CURRENT_USER.id,
            content: commentContent,
            createdAt: Date.now()
        };
        
        await this.db.collection("questions").doc(questionId).update({
            comments: firebase.firestore.FieldValue.arrayUnion(newComment)
        });
        return newComment;
    }

    subscribeQuestions(callback) {
        // Firestore 실시간 스냅샷 리스너
        return this.db.collection("questions")
            .orderBy("createdAt", "desc")
            .onSnapshot(snapshot => {
                const questions = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(questions);
            }, error => {
                console.error("Firestore 실시간 수신 오류:", error);
            });
    }
}

// --------------------------------------------------------------------------
// 6. 데이터베이스 어댑터 생성 및 초기화
// --------------------------------------------------------------------------
if (isFirebaseConfigured) {
    try {
        dbService = new FirebaseAdapter();
        console.log("☁️ 파이어베이스 클라우드 데이터베이스 모드로 작동 중입니다.");
    } catch (e) {
        console.error("파이어베이스 초기화 실패, 로컬 스토리지 모드로 전환합니다:", e);
        dbService = new LocalStorageAdapter();
    }
} else {
    dbService = new LocalStorageAdapter();
    console.log("💾 로컬 브라우저 저장 모드로 작동 중입니다. (Firebase 설정 미완료)");
}

// ==========================================================================
// 7. 웹 앱 UI 구동 및 상호작용 로직
// ==========================================================================
let allQuestions = [];       // 전체 질문 저장용 배열
let selectedTag = "all";     // 현재 선택된 필터 태그
let activeQuestionId = null; // 상세 보기 중인 질문 ID

// DOM 요소 캐싱
const questionListContainer = document.getElementById("question-list");
const dynamicTagsContainer = document.getElementById("dynamic-tags");
const questionCountLabel = document.getElementById("question-count");
const btnTagAll = document.getElementById("btn-tag-all");

// 모달 요소 캐싱
const writeModal = document.getElementById("write-modal");
const detailModal = document.getElementById("detail-modal");
const btnOpenWriteModal = document.getElementById("btn-open-write-modal");
const btnCloseWriteModal = document.getElementById("btn-close-write-modal");
const btnCancelWrite = document.getElementById("btn-cancel-write");
const btnCloseDetailModal = document.getElementById("btn-close-detail-modal");

// 폼 요소 캐싱
const writeForm = document.getElementById("write-form");
const detailModalBody = document.getElementById("detail-modal-body");

// --- 앱 초기 실행 및 데이터 구독 ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. 실시간 데이터 구독 신청
    dbService.subscribeQuestions((questions) => {
        allQuestions = questions;
        renderApp();
    });

    // 2. 전체보기 태그 버튼 이벤트 설정
    btnTagAll.addEventListener("click", () => {
        selectedTag = "all";
        updateActiveTagButton(btnTagAll);
        renderQuestions();
    });

    // 3. 모달 제어 이벤트 설정
    btnOpenWriteModal.addEventListener("click", openWriteModal);
    btnCloseWriteModal.addEventListener("click", closeWriteModal);
    btnCancelWrite.addEventListener("click", closeWriteModal);
    btnCloseDetailModal.addEventListener("click", closeDetailModal);

    // 모달 배경 클릭 시 닫기
    window.addEventListener("click", (e) => {
        if (e.target === writeModal) closeWriteModal();
        if (e.target === detailModal) closeDetailModal();
    });

    // 4. 질문 작성 제출 처리
    writeForm.addEventListener("submit", handleQuestionSubmit);
});

// --- UI 렌더링 총괄 ---
function renderApp() {
    renderTags();
    renderQuestions();
    // 상세 보기 모달이 켜져있다면, 내용 실시간 업데이트 (새 답변 등)
    if (activeQuestionId && detailModal.classList.contains("active")) {
        renderDetailModalContent(activeQuestionId);
    }
}

// --- 1. 키워드 태그 목록 렌더링 ---
function renderTags() {
    // 모든 질문에서 중복 없는 태그 수집
    const tagSet = new Set();
    allQuestions.forEach(q => {
        if (q.tags && Array.isArray(q.tags)) {
            q.tags.forEach(tag => {
                if (tag.trim() !== "") tagSet.add(tag.trim());
            });
        }
    });

    dynamicTagsContainer.innerHTML = "";
    
    if (tagSet.size === 0) {
        dynamicTagsContainer.innerHTML = `<div class="tag-loading">태그 없음</div>`;
        return;
    }

    tagSet.forEach(tag => {
        const btn = document.createElement("button");
        btn.className = `tag-btn ${selectedTag === tag ? 'active' : ''}`;
        btn.innerHTML = `<span class="tag-hash">#</span> ${tag}`;
        
        btn.addEventListener("click", () => {
            selectedTag = tag;
            updateActiveTagButton(btn);
            renderQuestions();
        });
        
        dynamicTagsContainer.appendChild(btn);
    });
}

function updateActiveTagButton(activeBtn) {
    document.querySelectorAll(".tag-btn").forEach(btn => btn.classList.remove("active"));
    activeBtn.classList.add("active");
}

// --- 2. 질문 카드 목록 렌더링 ---
function renderQuestions() {
    // 필터링 적용
    const filtered = selectedTag === "all" 
        ? allQuestions 
        : allQuestions.filter(q => q.tags && q.tags.includes(selectedTag));

    questionCountLabel.textContent = `질문 ${filtered.length}개`;
    questionListContainer.innerHTML = "";

    if (filtered.length === 0) {
        questionListContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-comments"></i>
                <p>${selectedTag === "all" ? "등록된 질문이 없습니다. 첫 번째 질문을 올려보세요!" : `#${selectedTag} 태그에 해당하는 질문이 없습니다.`}</p>
            </div>
        `;
        return;
    }

    filtered.forEach(q => {
        const card = document.createElement("div");
        card.className = "q-card";
        
        // 작성 시간 보기 편하게 포맷팅
        const timeAgo = formatTime(q.createdAt);
        const commentCount = q.comments ? q.comments.length : 0;
        
        // 카드 내부에 태그 뱃지 생성
        let tagsHtml = "";
        if (q.tags && Array.isArray(q.tags)) {
            q.tags.forEach(tag => {
                tagsHtml += `<span class="badge-tag">#${tag}</span>`;
            });
        }

        card.innerHTML = `
            <div class="q-card-header">
                <div class="q-card-author">
                    <i class="fa-solid fa-circle-user"></i>
                    <span>${q.authorId}</span>
                </div>
                <div class="q-card-date">${timeAgo}</div>
            </div>
            <h3>${escapeHtml(q.title)}</h3>
            <p class="q-card-snippet">${escapeHtml(q.content)}</p>
            <div class="q-card-footer">
                <div class="q-card-tags">
                    ${tagsHtml}
                </div>
                <div class="q-card-comments ${commentCount > 0 ? 'has-comments' : ''}">
                    <i class="fa-regular fa-comment-dots"></i>
                    <span>답변 ${commentCount}</span>
                </div>
            </div>
        `;

        // 카드 클릭 시 상세 보기 열기
        card.addEventListener("click", () => {
            openDetailModal(q.id);
        });

        questionListContainer.appendChild(card);
    });
}

// --- 3. 모달 제어 함수 ---
function openWriteModal() {
    writeForm.reset();
    writeModal.classList.add("active");
}

function closeWriteModal() {
    writeModal.classList.remove("active");
}

function openDetailModal(questionId) {
    activeQuestionId = questionId;
    renderDetailModalContent(questionId);
    detailModal.classList.add("active");
}

function closeDetailModal() {
    detailModal.classList.remove("active");
    activeQuestionId = null;
}

// --- 4. 질문 상세 페이지 내용 동적 생성 ---
function renderDetailModalContent(questionId) {
    const q = allQuestions.find(item => item.id === questionId);
    if (!q) {
        detailModalBody.innerHTML = `<p>해당 질문을 찾을 수 없거나 삭제되었습니다.</p>`;
        return;
    }

    const timeAgo = formatTime(q.createdAt);
    const commentCount = q.comments ? q.comments.length : 0;

    let tagsHtml = "";
    if (q.tags && Array.isArray(q.tags)) {
        q.tags.forEach(tag => {
            tagsHtml += `<span class="badge-tag">#${tag}</span>`;
        });
    }

    // 답변(댓글) 리스트 생성
    let commentsHtml = "";
    if (q.comments && q.comments.length > 0) {
        q.comments.forEach(comment => {
            const commentTime = formatTime(comment.createdAt);
            const isMyComment = comment.authorId === CURRENT_USER.id ? "my-comment" : "";
            
            commentsHtml += `
                <div class="comment-card ${isMyComment}">
                    <div class="comment-header">
                        <span class="comment-author"><i class="fa-solid fa-user-pen"></i> ${comment.authorId}</span>
                        <span class="comment-date">${commentTime}</span>
                    </div>
                    <div class="comment-body">${escapeHtml(comment.content)}</div>
                </div>
            `;
        });
    } else {
        commentsHtml = `
            <div class="empty-state" style="padding: 30px 0;">
                <i class="fa-solid fa-pencil-alt" style="font-size: 2rem;"></i>
                <p>아직 답변이 없습니다. 첫 답변을 작성해 보세요!</p>
            </div>
        `;
    }

    detailModalBody.innerHTML = `
        <div class="detail-view">
            <!-- 질문 정보 -->
            <div class="detail-header">
                <h2 class="detail-title">${escapeHtml(q.title)}</h2>
                <div class="detail-meta-row">
                    <div class="q-card-author">
                        <i class="fa-solid fa-circle-user"></i>
                        <span>질문자: <strong>${q.authorId}</strong></span>
                    </div>
                    <div class="q-card-date">${timeAgo} 작성</div>
                </div>
            </div>
            
            <!-- 질문 내용 -->
            <div class="detail-body">${escapeHtml(q.content)}</div>
            
            <div class="q-card-tags">
                ${tagsHtml}
            </div>

            <!-- 답변(댓글) 영역 -->
            <div class="comments-section">
                <h3 class="comments-title">
                    <i class="fa-regular fa-comments"></i> 친구들의 답변 (${commentCount})
                </h3>
                
                <div class="comments-list">
                    ${commentsHtml}
                </div>

                <!-- 답변 작성 Form -->
                <div class="comment-form-container">
                    <form class="comment-form" id="comment-form">
                        <textarea id="comment-input" rows="3" placeholder="답변을 작성하여 친구의 공부를 도와주세요! (친절하고 정중한 표현을 사용합시다.)" required></textarea>
                        <div class="comment-form-footer">
                            <button type="submit" class="btn btn-primary"><i class="fa-regular fa-paper-plane"></i> 답변 등록</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // 생성된 답변 작성 폼에 이벤트 바인딩
    const commentForm = document.getElementById("comment-form");
    commentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleCommentSubmit(q.id);
    });
}

// --- 5. 질문 등록 제출 핸들러 ---
async function handleQuestionSubmit(e) {
    e.preventDefault();
    
    const titleInput = document.getElementById("q-title");
    const contentInput = document.getElementById("q-content");
    const tagsInput = document.getElementById("q-tags");

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    // 태그 분리 및 가공 (쉼표로 구분하여 배열화)
    let tags = [];
    if (tagsInput.value.trim() !== "") {
        tags = tagsInput.value.split(",")
            .map(t => t.trim())
            .filter(t => t.length > 0 && t !== "");
    }

    if (title && content) {
        try {
            await dbService.addQuestion(title, content, tags);
            closeWriteModal();
            // 입력 창 비우기
            titleInput.value = "";
            contentInput.value = "";
            tagsInput.value = "";
        } catch (error) {
            alert("질문 등록에 실패했습니다: " + error.message);
        }
    }
}

// --- 6. 답변 등록 제출 핸들러 ---
async function handleCommentSubmit(questionId) {
    const commentInput = document.getElementById("comment-input");
    const content = commentInput.value.trim();

    if (content) {
        try {
            await dbService.addComment(questionId, content);
            commentInput.value = "";
            // UI 실시간 업데이트는 subscribe에서 데이터가 오면서 자동으로 처리됨
        } catch (error) {
            alert("답변 등록에 실패했습니다: " + error.message);
        }
    }
}

// --- 7. 유틸리티 함수 ---
// XSS 해킹 방지를 위한 HTML 문자열 이스케이프
function escapeHtml(text) {
    if (!text) return "";
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
}

// 작성 시간 예쁜 텍스트로 가공
function formatTime(timestamp) {
    if (!timestamp) return "방금 전";
    const diff = Date.now() - timestamp;
    
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hour = Math.floor(min / 60);
    const day = Math.floor(hour / 24);

    if (sec < 60) return "방금 전";
    if (min < 60) return `${min}분 전`;
    if (hour < 24) return `${hour}시간 전`;
    if (day === 1) return "어제";
    
    const date = new Date(timestamp);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}
