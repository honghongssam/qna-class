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

    async addQuestion(title, content, tags) {
        const data = this._getData();
        const newQuestion = {
            id: "local_" + Math.random().toString(36).substr(2, 9),
            title,
            content,
            tags,
            authorId: CURRENT_USER.id,
            createdAt: Date.now(),
            comments: []
        };
        data.unshift(newQuestion);
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
        callback(this._getData());
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
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
    }

    async getQuestions() {
        // subscribeQuestions 실시간 리스너를 주로 활용하므로 빈 구현 또는 기본 구현
        return [];
    }

    async addQuestion(title, content, tags) {
        const newQuestion = {
            title,
            content,
            tags,
            authorId: CURRENT_USER.id,
            createdAt: Date.now(),
            comments: []
        };
        const docRef = await addDoc(collection(this.db, "questions"), newQuestion);
        return { id: docRef.id, ...newQuestion };
    }

    async addComment(questionId, commentContent) {
        const newComment = {
            id: "comment_" + Math.random().toString(36).substr(2, 9),
            authorId: CURRENT_USER.id,
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
}

// --------------------------------------------------------------------------
// 5. 알맞은 어댑터 인스턴스 생성 및 배출
// --------------------------------------------------------------------------
let dbInstance = null;

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
