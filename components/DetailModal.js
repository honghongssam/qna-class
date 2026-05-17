import React, { useState } from "react";

// 시간 변환 함수
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
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export default function DetailModal({ isOpen, question, onClose, onSubmitComment, currentUser }) {
    const [commentContent, setCommentContent] = useState("");

    if (!isOpen || !question) return null;

    const timeAgo = formatTime(question.createdAt);
    const commentCount = question.comments ? question.comments.length : 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (commentContent.trim()) {
            onSubmitComment(commentContent.trim());
            setCommentContent("");
        }
    };

    return (
        <div className="modal active" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content detail-modal-content">
                <div className="modal-header">
                    <h3>
                        <i className="fa-solid fa-file-invoice"></i> 질문 상세보기
                    </h3>
                    <button className="btn-close" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    <div className="detail-view">
                        {/* 질문 상단 정보 */}
                        <div className="detail-header">
                            <h2 className="detail-title">{question.title}</h2>
                            <div className="detail-meta-row">
                                <div className="q-card-author">
                                    <i className="fa-solid fa-circle-user"></i>
                                    <span>질문자: <strong>{question.authorId}</strong></span>
                                </div>
                                <div className="q-card-date">{timeAgo} 작성</div>
                            </div>
                        </div>

                        {/* 질문 본문 */}
                        <div className="detail-body">{question.content}</div>

                        {/* 태그 목록 */}
                        <div className="q-card-tags">
                            {question.tags && Array.isArray(question.tags) &&
                                question.tags.map((tag) => (
                                    <span key={tag} className="badge-tag">
                                        #{tag}
                                    </span>
                                ))
                            }
                        </div>

                        {/* 답변 리스트 영역 */}
                        <div className="comments-section">
                            <h3 className="comments-title">
                                <i className="fa-regular fa-comments"></i> 친구들의 답변 ({commentCount})
                            </h3>

                            <div className="comments-list">
                                {question.comments && question.comments.length > 0 ? (
                                    question.comments.map((comment) => {
                                        const commentTime = formatTime(comment.createdAt);
                                        const isMyComment = comment.authorId === currentUser.id ? "my-comment" : "";
                                        return (
                                            <div key={comment.id} className={`comment-card ${isMyComment}`}>
                                                <div className="comment-header">
                                                    <span className="comment-author">
                                                        <i className="fa-solid fa-user-pen"></i> {comment.authorId}
                                                    </span>
                                                    <span className="comment-date">{commentTime}</span>
                                                </div>
                                                <div className="comment-body">{comment.content}</div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="empty-state" style={{ padding: "30px 0" }}>
                                        <i className="fa-solid fa-pencil-alt" style={{ fontSize: "2rem" }}></i>
                                        <p>아직 답변이 없습니다. 첫 답변을 작성해 보세요!</p>
                                    </div>
                                )}
                            </div>

                            {/* 답변 작성 폼 */}
                            <div className="comment-form-container">
                                <form className="comment-form" onSubmit={handleSubmit}>
                                    <textarea
                                        rows="3"
                                        placeholder="답변을 작성하여 친구의 공부를 도와주세요! (친절하고 정중한 표현을 사용합시다.)"
                                        required
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                    ></textarea>
                                    <div className="comment-form-footer">
                                        <button type="submit" className="btn btn-primary">
                                            <i className="fa-regular fa-paper-plane"></i> 답변 등록
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
