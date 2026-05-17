import React, { useState, useEffect } from "react";

// 👦 남학생 캐릭터 아바타 리스트
const MALE_AVATARS = [
    { name: "스마트한 펠릭스", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" },
    { name: "유쾌한 잭", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack" },
    { name: "성실한 레오", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo" },
    { name: "호기심 올리버", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver" }
];

// 👧 여학생 캐릭터 아바타 리스트
const FEMALE_AVATARS = [
    { name: "러블리 릴리", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Lily" },
    { name: "우등생 벨라", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Bella" },
    { name: "쾌활한 클로이", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe" },
    { name: "상냥한 조이", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe" }
];

export default function AvatarModal({ isOpen, onClose, currentPhotoURL, onSelect }) {
    // 사용자가 임시로 선택 중인 아바타 URL 상태 관리
    const [selectedUrl, setSelectedUrl] = useState(currentPhotoURL || "");

    // 모달이 열릴 때마다 사용자의 현재 프사로 동기화
    useEffect(() => {
        if (isOpen) {
            setSelectedUrl(currentPhotoURL || "");
        }
    }, [isOpen, currentPhotoURL]);

    if (!isOpen) return null;

    // 아바타 변경 실행 핸들러
    const handleConfirm = () => {
        if (!selectedUrl) {
            alert("변경할 아바타를 선택해 주세요!");
            return;
        }
        onSelect(selectedUrl);
    };

    return (
        <div className={`modal active`} style={{ z-index: 2100 }}>
            <div className="modal-content" style={{ maxWidth: "520px" }}>
                {/* 1. 모달 상단 헤더 */}
                <div className="modal-header">
                    <h3>
                        <i className="fa-solid fa-wand-magic-sparkles" style={{ color: "var(--primary-color)" }}></i> 나만의 아바타 꾸미기
                    </h3>
                    <button className="btn-close" onClick={onClose}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* 2. 모달 몸통 (아바타 목록 그리드) */}
                <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto", padding: "20px 24px" }}>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px", textAlign: "center" }}>
                        친구들이 나를 알아볼 수 있는 가장 멋진 아바타를 골라보세요! 🎨
                    </p>

                    {/* 👦 남학생 아바타 영역 */}
                    <div style={{ marginBottom: "24px" }}>
                        <h4 style={{ fontSize: "0.9rem", fontWeight: "700", marginBottom: "12px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                            👦 멋쟁이 남학생 아바타
                        </h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                            {MALE_AVATARS.map((avatar) => {
                                const isSelected = selectedUrl === avatar.url;
                                return (
                                    <div 
                                        key={avatar.url}
                                        onClick={() => setSelectedUrl(avatar.url)}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <div style={{
                                            width: "70px",
                                            height: "70px",
                                            borderRadius: "50%",
                                            backgroundColor: isSelected ? "#e0e7ff" : "#f1f5f9",
                                            border: isSelected ? "3px solid var(--primary-color)" : "2px solid #cbd5e1",
                                            boxShadow: isSelected ? "0 4px 10px rgba(99, 102, 241, 0.3)" : "none",
                                            transform: isSelected ? "scale(1.08)" : "scale(1)",
                                            transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden"
                                        }}>
                                            <img src={avatar.url} alt={avatar.name} style={{ width: "90%", height: "90%", objectFit: "contain" }} />
                                        </div>
                                        <span style={{ fontSize: "0.7rem", marginTop: "8px", fontWeight: isSelected ? "700" : "500", color: isSelected ? "var(--primary-color)" : "var(--text-muted)" }}>
                                            {avatar.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 👧 여학생 아바타 영역 */}
                    <div>
                        <h4 style={{ fontSize: "0.9rem", fontWeight: "700", marginBottom: "12px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                            👧 이쁜 여학생 아바타
                        </h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                            {FEMALE_AVATARS.map((avatar) => {
                                const isSelected = selectedUrl === avatar.url;
                                return (
                                    <div 
                                        key={avatar.url}
                                        onClick={() => setSelectedUrl(avatar.url)}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <div style={{
                                            width: "70px",
                                            height: "70px",
                                            borderRadius: "50%",
                                            backgroundColor: isSelected ? "#eef2ff" : "#f1f5f9",
                                            border: isSelected ? "3px solid var(--primary-color)" : "2px solid #cbd5e1",
                                            boxShadow: isSelected ? "0 4px 10px rgba(99, 102, 241, 0.3)" : "none",
                                            transform: isSelected ? "scale(1.08)" : "scale(1)",
                                            transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden"
                                        }}>
                                            <img src={avatar.url} alt={avatar.name} style={{ width: "90%", height: "90%", objectFit: "contain" }} />
                                        </div>
                                        <span style={{ fontSize: "0.7rem", marginTop: "8px", fontWeight: isSelected ? "700" : "500", color: isSelected ? "var(--primary-color)" : "var(--text-muted)" }}>
                                            {avatar.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. 모달 하단 푸터 */}
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        취소
                    </button>
                    <button className="btn btn-primary" onClick={handleConfirm}>
                        <i className="fa-solid fa-circle-check"></i> 아바타로 변경하기
                    </button>
                </div>
            </div>
        </div>
    );
}
