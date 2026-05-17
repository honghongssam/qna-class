"use client";

import React, { useState, useEffect } from "react";
import { getDbService, CURRENT_USER } from "@/lib/firebase";
import SidebarLeft from "@/components/SidebarLeft";
import SidebarRight from "@/components/SidebarRight";
import QuestionCard from "@/components/QuestionCard";
import WriteModal from "@/components/WriteModal";
import DetailModal from "@/components/DetailModal";

export default function Home() {
    // 1. 상태(States) 관리 정의
    const [questions, setQuestions] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState("all");
    
    // 모달 및 인트로 상태 제어
    const [isWriteOpen, setIsWriteOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [activeQuestionId, setActiveQuestionId] = useState(null);
    const [hasEntered, setHasEntered] = useState(false); // 웰컴 커버 입장 여부
    const [fadeWelcome, setFadeWelcome] = useState(false); // 페이드아웃 연출용

    // 2. 실시간 데이터 구독 처리 (구글 Firebase Firestore & 로컬 스토리지 연동)
    useEffect(() => {
        const db = getDbService();
        const unsubscribe = db.subscribeQuestions((updatedQuestions) => {
            setQuestions(updatedQuestions);
            
            // 모든 질문들로부터 중복 없는 동적 해시태그 목록 추출
            const tagSet = new Set();
            updatedQuestions.forEach(q => {
                if (q.tags && Array.isArray(q.tags)) {
                    q.tags.forEach(tag => {
                        if (tag.trim() !== "") tagSet.add(tag.trim());
                    });
                }
            });
            setTags(Array.from(tagSet));
        });

        // 컴포넌트 언마운트 시 구독 취소 (메모리 누수 방지)
        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, []);

    // 3. 질문 및 답변 등록 기능 핸들러
    const handleQuestionSubmit = async (title, content, tags) => {
        try {
            const db = getDbService();
            await db.addQuestion(title, content, tags);
            setIsWriteOpen(false);
        } catch (error) {
            alert("질문 등록 중 오류가 발생했습니다: " + error.message);
        }
    };

    const handleCommentSubmit = async (commentContent) => {
        if (!activeQuestionId) return;
        try {
            const db = getDbService();
            await db.addComment(activeQuestionId, commentContent);
            // 실시간 리스너에 의해 자동으로 상세 정보가 갱신됩니다.
        } catch (error) {
            alert("답변 등록 중 오류가 발생했습니다: " + error.message);
        }
    };

    // 4. 필터링된 질문 카드 추출
    const filteredQuestions = selectedTag === "all"
        ? questions
        : questions.filter(q => q.tags && q.tags.includes(selectedTag));

    // 상세 보기 모달에 보낼 활성화된 질문 데이터 찾기
    const activeQuestion = questions.find(q => q.id === activeQuestionId);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            {/* 3D 원형 학생 이미지 및 오버레이 인트로 커버 */}
            {!hasEntered && (
                <div className={`welcome-screen ${fadeWelcome ? "fade-out" : ""}`}>
                    <div className="welcome-container">
                        <img 
                            src="/students_study_circle.png" 
                            alt="열심히 질문하고 공부하는 우리반 친구들" 
                            className="welcome-bg-image"
                        />
                        <div className="welcome-overlay">
                            <span className="welcome-title-tag">
                                <i className="fa-solid fa-sparkles"></i> 우리반 공부방
                            </span>
                            <h1 className="welcome-title">우리반<br />질문 광장</h1>
                            <p className="welcome-description">
                                모르는 것은 물어보고,<br />아는 것은 알려주며 함께 성장해요!
                            </p>
                            <button 
                                className="welcome-enter-btn"
                                onClick={() => {
                                    setFadeWelcome(true);
                                    setTimeout(() => {
                                        setHasEntered(true);
                                    }, 600); // 0.6초 뒤 돔에서 완전히 제거
                                }}
                            >
                                <i className="fa-solid fa-arrow-right-to-bracket"></i> 배움터 입장하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 앱 공통 헤더 */}
            <header className="app-header">
                <div className="header-left">
                    <div className="logo-icon">
                        <i className="fa-solid fa-graduation-cap"></i>
                    </div>
                    <h1>
                        우리반 질문 광장 <span className="badge">Next.js App</span>
                    </h1>
                </div>
                <div className="header-right">
                    <div className="user-profile">
                        <span className="user-status-dot"></span>
                        <span className="user-name">
                            학생: <strong>{CURRENT_USER.id}</strong>
                        </span>
                    </div>
                </div>
            </header>

            {/* 3단 메인 그리드 */}
            <main className="app-container">
                {/* 1단: 왼쪽 키워드 태그 필터 영역 */}
                <SidebarLeft 
                    tags={tags} 
                    selectedTag={selectedTag} 
                    onSelectTag={setSelectedTag} 
                />

                {/* 2단: 가운데 메인 질문 보드 피드 */}
                <section className="main-board" id="board-panel">
                    <div className="panel-header">
                        <div className="board-title-area">
                            <h2>
                                <i className="fa-solid fa-list-check"></i> 질문 게시판
                            </h2>
                            <span className="q-count">질문 {filteredQuestions.length}개</span>
                        </div>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setIsWriteOpen(true)}
                        >
                            <i className="fa-solid fa-pen"></i> 질문하기
                        </button>
                    </div>

                    <div className="panel-content board-content" id="question-list">
                        {filteredQuestions.length === 0 ? (
                            <div className="empty-state">
                                <i className="fa-solid fa-comments"></i>
                                <p>
                                    {selectedTag === "all" 
                                        ? "등록된 질문이 없습니다. 첫 질문 카드를 등록해보세요!" 
                                        : `#${selectedTag} 관련 질문이 아직 없네요. 질문을 등록해보세요!`
                                    }
                                </p>
                            </div>
                        ) : (
                            filteredQuestions.map((q) => (
                                <QuestionCard 
                                    key={q.id} 
                                    question={q} 
                                    onClick={() => {
                                        setActiveQuestionId(q.id);
                                        setIsDetailOpen(true);
                                    }}
                                />
                            ))
                        )}
                    </div>
                </section>

                {/* 3단: 오른쪽 고정 공지사항 패널 */}
                <SidebarRight />
            </main>

            {/* 질문 생성 팝업 모달 */}
            <WriteModal 
                isOpen={isWriteOpen} 
                onClose={() => setIsWriteOpen(false)} 
                onSubmit={handleQuestionSubmit}
            />

            {/* 질문 상세 및 댓글(답변) 입력 모달 */}
            <DetailModal 
                isOpen={isDetailOpen} 
                question={activeQuestion} 
                currentUser={CURRENT_USER}
                onClose={() => {
                    setIsDetailOpen(false);
                    setActiveQuestionId(null);
                }} 
                onSubmitComment={handleCommentSubmit}
            />
        </div>
    );
}
