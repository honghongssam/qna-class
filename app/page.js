"use client";

import React, { useState, useEffect } from "react";
import { getDbService, getAuthService } from "@/lib/firebase";
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
    
    // 로그인된 사용자 정보 상태 관리
    const [user, setUser] = useState(null);
    
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

    // 2-2. 실시간 구글 로그인 상태 감지 리스너 구독
    useEffect(() => {
        const auth = getAuthService();
        const unsubscribe = auth.subscribeAuth((currentUser) => {
            setUser(currentUser);
        });
        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, []);

    // 구글 로그인 팝업 트리거
    const handleLogin = async () => {
        try {
            const auth = getAuthService();
            await auth.loginWithGoogle();
        } catch (error) {
            console.error("로그인 에러:", error);
            alert("로그인 도중 오류가 발생했습니다.\n구글 파이어베이스 콘솔의 [Authentication -> Sign-in method]에서 구글 로그인이 정상적으로 켜져 있는지 확인해 주세요!");
        }
    };

    // 로그아웃 트리거
    const handleLogout = async () => {
        try {
            const auth = getAuthService();
            await auth.logout();
        } catch (error) {
            console.error("로그아웃 에러:", error);
            alert("로그아웃 도중 오류가 발생했습니다: " + error.message);
        }
    };

    // 3. 질문 및 답변 등록 기능 핸들러
    const handleQuestionSubmit = async (title, content, tags) => {
        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }
        try {
            const db = getDbService();
            await db.addQuestion(title, content, tags, user.email, user.displayName);
            setIsWriteOpen(false);
        } catch (error) {
            alert("질문 등록 중 오류가 발생했습니다: " + error.message);
        }
    };

    const handleCommentSubmit = async (commentContent) => {
        if (!activeQuestionId) return;
        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }
        try {
            const db = getDbService();
            await db.addComment(activeQuestionId, commentContent, user.email, user.displayName);
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
                      {user ? (
                          <div className="user-profile" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {user.photoURL ? (
                                  <img 
                                      src={user.photoURL} 
                                      alt={user.displayName} 
                                      style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid #fff", objectFit: "cover" }} 
                                  />
                              ) : (
                                  <span className="user-status-dot"></span>
                              )}
                              <span className="user-name">
                                  학생: <strong>{user.displayName}</strong>
                              </span>
                              <button 
                                  onClick={handleLogout} 
                                  style={{
                                      padding: "4px 10px",
                                      background: "rgba(255,255,255,0.15)",
                                      color: "#fff",
                                      border: "1px solid rgba(255,255,255,0.3)",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      transition: "all 0.2s"
                                  }}
                                  onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.3)"}
                                  onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.15)"}
                              >
                                  <i className="fa-solid fa-right-from-bracket"></i> 로그아웃
                              </button>
                          </div>
                      ) : (
                          <button 
                              className="btn btn-primary" 
                              onClick={handleLogin}
                              style={{ display: "flex", alignItems: "center", gap: "6px" }}
                          >
                              <i className="fa-brands fa-google"></i> 구글 로그인
                          </button>
                      )}
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
                            onClick={() => {
                                if (!user) {
                                    alert("질문을 작성하려면 먼저 구글 로그인을 완료해 주세요! 🧑‍🎓");
                                    return;
                                }
                                setIsWriteOpen(true);
                            }}
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
                currentUser={user}
                onClose={() => {
                    setIsDetailOpen(false);
                    setActiveQuestionId(null);
                }} 
                onSubmitComment={handleCommentSubmit}
            />
        </div>
    );
}
