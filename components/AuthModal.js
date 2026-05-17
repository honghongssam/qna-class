"use client";

import React, { useState } from "react";
import { getAuthService } from "@/lib/firebase";

export default function AuthModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState("login"); // "login" 또는 "signup" 탭 상태
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    // 이메일 로그인 서브밋 핸들러
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;

        setIsLoading(true);
        try {
            const auth = getAuthService();
            await auth.loginWithEmail(email.trim(), password.trim());
            setIsLoading(false);
            onClose(); // 성공 시 모달 닫기 (onAuthStateChanged 실시간 리스너가 자동으로 감지해 UI를 업데이트합니다!)
        } catch (error) {
            setIsLoading(false);
            // 사용자용 친절한 예외 얼럿 메시지
            alert("로그인에 실패했습니다:\n" + error.message);
        }
    };

    // 이메일 회원가입 서브밋 핸들러
    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim() || !displayName.trim()) return;

        if (password.length < 6) {
            alert("비밀번호는 최소 6글자 이상이어야 안전합니다! 🔐");
            return;
        }

        setIsLoading(true);
        try {
            const auth = getAuthService();
            await auth.registerWithEmail(email.trim(), password.trim(), displayName.trim());
            setIsLoading(false);
            onClose(); // 성공 시 모달 닫기
        } catch (error) {
            setIsLoading(false);
            alert("회원가입에 실패했습니다:\n" + error.message);
        }
    };

    // 구글 소셜 로그인 편의 핸들러
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const auth = getAuthService();
            await auth.loginWithGoogle();
            setIsLoading(false);
            onClose();
        } catch (error) {
            setIsLoading(false);
            console.error("구글 로그인 실패:", error);
            alert("구글 로그인에 실패했습니다. 파이어베이스 콘솔 설정을 확인해 주세요.");
        }
    };

    // 활성화 탭 하단 보더 디자인 헬퍼 함수
    const getTabStyle = (tabName) => ({
        flex: 1,
        padding: "14px",
        textAlign: "center",
        fontWeight: "bold",
        fontSize: "15px",
        cursor: "pointer",
        transition: "all 0.2s",
        borderBottom: activeTab === tabName ? "3px solid #4f46e5" : "3px solid transparent",
        color: activeTab === tabName ? "#4f46e5" : "#6b7280",
        background: activeTab === tabName ? "#fff" : "#f9fafb"
    });

    return (
        <div className="modal active" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: "420px", borderRadius: "16px", padding: "0", overflow: "hidden", border: "none", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
                {/* 상단 탭 네비게이터 */}
                <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
                    <div 
                        style={getTabStyle("login")} 
                        onClick={() => { setActiveTab("login"); }}
                    >
                        <i className="fa-solid fa-right-to-bracket" style={{ marginRight: "6px" }}></i> 로그인
                    </div>
                    <div 
                        style={getTabStyle("signup")} 
                        onClick={() => { setActiveTab("signup"); }}
                    >
                        <i className="fa-solid fa-user-plus" style={{ marginRight: "6px" }}></i> 회원가입
                    </div>
                </div>

                <div style={{ padding: "28px 24px" }}>
                    {activeTab === "login" ? (
                        /* ================= 이메일 로그인 폼 ================= */
                        <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ textAlign: "center", marginBottom: "8px" }}>
                                <h3 style={{ margin: "0 0 6px 0", color: "#111827", fontSize: "20px", fontWeight: "800" }}>우리반 질문 광장</h3>
                                <p style={{ margin: "0", color: "#6b7280", fontSize: "13px" }}>이메일 계정으로 안전하게 로그인하세요.</p>
                            </div>

                            <div className="form-group" style={{ margin: "0" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>이메일 주소</label>
                                <input
                                    type="email"
                                    placeholder="example@school.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" }}
                                />
                            </div>

                            <div className="form-group" style={{ margin: "0" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>비밀번호</label>
                                <input
                                    type="password"
                                    placeholder="비밀번호 입력"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" }}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={isLoading}
                                style={{ width: "100%", padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", background: "#4f46e5", color: "#fff", border: "none", cursor: isLoading ? "not-allowed" : "pointer" }}
                            >
                                {isLoading ? "로그인 중..." : "로그인하기"}
                            </button>
                        </form>
                    ) : (
                        /* ================= 이메일 회원가입 폼 ================= */
                        <form onSubmit={handleSignupSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ textAlign: "center", marginBottom: "8px" }}>
                                <h3 style={{ margin: "0 0 6px 0", color: "#111827", fontSize: "20px", fontWeight: "800" }}>배움터 회원가입</h3>
                                <p style={{ margin: "0", color: "#6b7280", fontSize: "13px" }}>우리반 질문 광장의 새 친구가 되어주세요!</p>
                            </div>

                            <div className="form-group" style={{ margin: "0" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>닉네임 (이름)</label>
                                <input
                                    type="text"
                                    placeholder="예: 홍길동"
                                    required
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" }}
                                />
                            </div>

                            <div className="form-group" style={{ margin: "0" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>이메일 주소</label>
                                <input
                                    type="email"
                                    placeholder="example@school.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" }}
                                />
                            </div>

                            <div className="form-group" style={{ margin: "0" }}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>비밀번호 (6글자 이상)</label>
                                <input
                                    type="password"
                                    placeholder="비밀번호 6글자 이상 입력"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" }}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={isLoading}
                                style={{ width: "100%", padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", background: "#4f46e5", color: "#fff", border: "none", cursor: isLoading ? "not-allowed" : "pointer" }}
                            >
                                {isLoading ? "회원가입 진행 중..." : "회원가입하고 시작하기"}
                            </button>
                        </form>
                    )}

                    {/* ================= 구글 소셜 로그인 연동 분할선 ================= */}
                    <div style={{ display: "flex", alignItems: "center", margin: "24px 0 16px 0" }}>
                        <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }}></div>
                        <span style={{ padding: "0 10px", color: "#9ca3af", fontSize: "12px" }}>또는</span>
                        <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }}></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        style={{
                            width: "100%",
                            padding: "11px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            background: "#fff",
                            color: "#374151",
                            fontWeight: "600",
                            fontSize: "14px",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "background 0.2s"
                        }}
                        onMouseOver={(e) => e.target.style.background = "#f9fafb"}
                        onMouseOut={(e) => e.target.style.background = "#fff"}
                    >
                        <i className="fa-brands fa-google" style={{ color: "#ea4335" }}></i> Google 계정으로 계속하기
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            width: "100%",
                            marginTop: "16px",
                            padding: "8px",
                            border: "none",
                            background: "transparent",
                            color: "#9ca3af",
                            fontSize: "12px",
                            cursor: "pointer",
                            textDecoration: "underline"
                        }}
                    >
                        창 닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
