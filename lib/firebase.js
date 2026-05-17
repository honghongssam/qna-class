import { initializeApp, getApps, getApp } from "firebase/app";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    arrayUnion, 
    onSnapshot, 
    query, 
    orderBy 
} from "firebase/firestore";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "firebase/auth";

// ==========================================================================
// 1. 파이어베이스(Firebase) 설정 정보
// --------------------------------------------------------------------------
// 구글 파이어베이스 콘솔에서 프로젝트를 추가하고 발급받은 웹 설정값으로 교체하세요.
// 빈 상태(YOUR_API_KEY)로 두면 브라우저의 '로컬 스토리지' 모드로 안전하게 자동 자동합니다.
// ==========================================================================
export const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// --------------------------------------------------------------------------
// 2. 테스트 사용자 정보 (임시 로그인 가상 데이터)
// --------------------------------------------------------------------------
export const CURRENT_USER = {
    id: "user_01",
    name: "user_01"
};

// 브라우저 환경 및 파이어베이스 설정 체크
const isClient = typeof window !== "undefined";
const isFirebaseConfigured = 
    isClient && 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "YOUR_API_KEY" && 
    firebaseConfig.apiKey !== "";

// --------------------------------------------------------------------------
// 3. 로컬 스토리지 데이터 어댑터 (오프라인/무료 모드)
// --------------------------------------------------------------------------
class LocalStorageAdapter {
    constructor() {
        this.listeners = [];
        this.authListeners = []; // 가상 로그인 상태 변경 감지 리스너 배열
        if (isClient && !localStorage.getItem("study_questions")) {
            const dummyData = [
                {
                    id: "dummy-1",
                    title: "수학 1단원 올림과 버림이 헷갈려요!",
                    content: "올림은 올릴 수가 없어도 올리는 거고, 버림은 남는 수가 있어도 버리는 것 같은데... 일상생활에서 어떤 상황에 쓰이는지 예시로 설명해 주실 분 있나요?",
                    tags: ["수학", "1단원", "올림버림"],
                    authorId: "student_03",
                    createdAt: Date.now() - 3600000 * 2,
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
                    createdAt: Date.now() - 3600000 * 5,
                    comments: []
                }
            ];
            localStorage.setItem("study_questions", JSON.stringify(dummyData));
        }
    }

    _getData() {
        if (!isClient) return [];
        return JSON.parse(localStorage.getItem("study_questions")) || [];
    }

    _setData(data) {
        if (!isClient) return;
        localStorage.setItem("study_questions", JSON.stringify(data));
        this.listeners.forEach(callback => callback(data));
    }

    async getQuestions() {
        return this._getData();
    }

    async addQuestion(title, content, tags, authorId = "unknown", authorName = "익명") {
        const data = this._getData();
        const newQuestion = {
            id: "local_" + Math.random().toString(36).substr(2, 9),
            title,
            content,
            tags,
            authorId,
            authorName,
            createdAt: Date.now(),
            comments: []
        };
        data.unshift(newQuestion);
        this._setData(data);
        return newQuestion;
    }

    async addComment(questionId, commentContent, authorId = "unknown", authorName = "익명") {
        const data = this._getData();
        const question = data.find(q => q.id === questionId);
        if (question) {
            const newComment = {
                id: "comment_" + Math.random().toString(36).substr(2, 9),
                authorId,
                authorName,
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
        callback(this._getData());
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    // [로컬 모드] 구글 로그인 시뮬레이션
    async loginWithGoogle() {
        if (!isClient) return null;

        // 실명 확인을 위한 정중한 한글 대화창 제공
        const realName = prompt("구글 가상 로그인에 사용할 '실명(이름)'을 입력해 주세요! 🧑‍🎓\n(실제 파이어베이스 연동 시에는 자신의 구글 실명이 자동으로 표기됩니다.)", "홍길동");
        if (!realName || !realName.trim()) {
            return null; // 취소 버튼을 누르면 로그인 취소 처리
        }

        const dummyUser = {
            uid: "local_user_99",
            email: "student_qna@school.com",
            displayName: realName.trim(),
            photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(realName.trim())}` // 이름 기반 맞춤형 랜덤 캐릭터 프사 매핑
        };

        localStorage.setItem("auth_user", JSON.stringify(dummyUser));
        this.authListeners.forEach(callback => callback(dummyUser));
        return dummyUser;
    }

    // [로컬 모드] 로그아웃 시뮬레이션
    async logout() {
        if (isClient) {
            localStorage.removeItem("auth_user");
            this.authListeners.forEach(callback => callback(null));
        }
    }

    // [로컬 모드] 실시간 로그인 감지
    subscribeAuth(callback) {
        this.authListeners.push(callback);
        if (isClient) {
            const savedUser = JSON.parse(localStorage.getItem("auth_user")) || null;
            callback(savedUser);
        } else {
            callback(null);
        }
        return () => {
            this.authListeners = this.authListeners.filter(cb => cb !== callback);
        };
    }

    // [로컬 모드] 가상 회원 DB 획득 헬퍼
    _getLocalUsers() {
        if (!isClient) return [];
        return JSON.parse(localStorage.getItem("local_users")) || [];
    }

    // [로컬 모드] 가상 이메일 회원가입 시뮬레이션
    async registerWithEmail(email, password, displayName) {
        if (!isClient) return null;
        const users = this._getLocalUsers();

        // 이메일 중복 체크
        const exists = users.some(u => u.email === email);
        if (exists) {
            throw new Error("이미 등록된 이메일 주소입니다.");
        }

        const newUser = {
            uid: "local_u_" + Math.random().toString(36).substr(2, 9),
            email,
            password, // 시뮬레이터용 텍스트 보관
            displayName,
            photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}` // 닉네임 기반 개성 있는 캐릭터 자동 매핑
        };

        users.push(newUser);
        localStorage.setItem("local_users", JSON.stringify(users));

        // 가입 성공 즉시 로그인 완료 처리
        const authUser = {
            uid: newUser.uid,
            email: newUser.email,
            displayName: newUser.displayName,
            photoURL: newUser.photoURL
        };
        localStorage.setItem("auth_user", JSON.stringify(authUser));
        this.authListeners.forEach(cb => cb(authUser));
        return authUser;
    }

    // [로컬 모드] 가상 이메일 로그인 시뮬레이션
    async loginWithEmail(email, password) {
        if (!isClient) return null;
        const users = this._getLocalUsers();

        const found = users.find(u => u.email === email);
        if (!found) {
            throw new Error("가입되지 않은 이메일 주소입니다.");
        }

        if (found.password !== password) {
            throw new Error("비밀번호가 일치하지 않습니다.");
        }

        const authUser = {
            uid: found.uid,
            email: found.email,
            displayName: found.displayName,
            photoURL: found.photoURL
        };
        localStorage.setItem("auth_user", JSON.stringify(authUser));
        this.authListeners.forEach(cb => cb(authUser));
        return authUser;
    }
}

// --------------------------------------------------------------------------
// 4. 파이어베이스 Firestore 데이터 어댑터 (실시간 클라우드 모드)
// --------------------------------------------------------------------------
class FirebaseAdapter {
    constructor() {
        // 이미 초기화된 앱이 있으면 그것을 쓰고, 없으면 새로 초기화
        this.app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        this.db = getFirestore(this.app);
        this.auth = getAuth(this.app); // 실제 파이어베이스 인증 서비스 활성화
        this.provider = new GoogleAuthProvider(); // 구글 로그인 프로바이더 활성화
    }

    async getQuestions() {
        // subscribeQuestions 실시간 리스너를 주로 활용하므로 빈 구현 또는 기본 구현
        return [];
    }

    async addQuestion(title, content, tags, authorId = "unknown", authorName = "익명") {
        const newQuestion = {
            title,
            content,
            tags,
            authorId,
            authorName,
            createdAt: Date.now(),
            comments: []
        };
        const docRef = await addDoc(collection(this.db, "questions"), newQuestion);
        return { id: docRef.id, ...newQuestion };
    }

    async addComment(questionId, commentContent, authorId = "unknown", authorName = "익명") {
        const newComment = {
            id: "comment_" + Math.random().toString(36).substr(2, 9),
            authorId,
            authorName,
            content: commentContent,
            createdAt: Date.now()
        };

        const docRef = doc(this.db, "questions", questionId);
        await updateDoc(docRef, {
            comments: arrayUnion(newComment)
        });
        return newComment;
    }

    subscribeQuestions(callback) {
        const q = query(collection(this.db, "questions"), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snapshot) => {
            const questions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(questions);
        }, (error) => {
            console.error("Firestore 실시간 리스너 오류:", error);
        });
    }

    // [실제 모드] 구글 팝업 로그인 실행
    async loginWithGoogle() {
        const result = await signInWithPopup(this.auth, this.provider);
        return result.user;
    }

    // [실제 모드] 로그아웃 실행
    async logout() {
        await signOut(this.auth);
    }

    // [실제 모드] 실시간 구글 로그인 변화 감지
    subscribeAuth(callback) {
        return onAuthStateChanged(this.auth, (user) => {
            if (user) {
                callback({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                });
            } else {
                callback(null);
            }
        });
    }

    // [실제 모드] 실제 이메일 회원가입
    async registerWithEmail(email, password, displayName) {
        const result = await createUserWithEmailAndPassword(this.auth, email, password);
        // 가입 완료 후 닉네임과 아바타 정보 적용
        await updateProfile(result.user, {
            displayName: displayName,
            photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`
        });
        return result.user;
    }

    // [실제 모드] 실제 이메일 로그인
    async loginWithEmail(email, password) {
        const result = await signInWithEmailAndPassword(this.auth, email, password);
        return result.user;
    }
}

// --------------------------------------------------------------------------
// 5. 알맞은 어댑터 인스턴스 생성 및 배출
// --------------------------------------------------------------------------
let dbInstance = null;
let authInstance = null; // 인증용 서비스 인스턴스 캐싱

export const getDbService = () => {
    if (!isClient) return new LocalStorageAdapter(); // SSR 서버 환경 대응용

    if (!dbInstance) {
        if (isFirebaseConfigured) {
            try {
                dbInstance = new FirebaseAdapter();
                console.log("☁️ Next.js - 파이어베이스 Firestore 데이터베이스 활성화");
            } catch (e) {
                console.error("파이어베이스 초기화 실패, 로컬 스토리지 모드로 자동 폴백:", e);
                dbInstance = new LocalStorageAdapter();
            }
        } else {
            dbInstance = new LocalStorageAdapter();
            console.log("💾 Next.js - 로컬 스토리지 모드 활성화 (파이어베이스 설정값 없음)");
        }
    }
    return dbInstance;
};

// --------------------------------------------------------------------------
// 6. 알맞은 인증 서비스 인스턴스 생성 및 배출 
// --------------------------------------------------------------------------
export const getAuthService = () => {
    if (!isClient) {
        return {
            loginWithGoogle: async () => null,
            logout: async () => {},
            subscribeAuth: (callback) => () => {},
            registerWithEmail: async () => null,
            loginWithEmail: async () => null
        };
    }

    if (!authInstance) {
        if (isFirebaseConfigured) {
            try {
                authInstance = new FirebaseAdapter();
            } catch (e) {
                console.error("파이어베이스 인증 초기화 실패, 로컬 폴백 활성화:", e);
                authInstance = new LocalStorageAdapter();
            }
        } else {
            authInstance = new LocalStorageAdapter();
        }
    }
    return authInstance;
};
