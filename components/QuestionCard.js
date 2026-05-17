import React from "react";

// 작성 시간을 친숙한 한글 텍스트로 바꾸는 도우미 함수
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

export default function QuestionCard({ question, onClick }) {
    const timeAgo = formatTime(question.createdAt);
    const commentCount = question.comments ? question.comments.length : 0;

    return (
        <div className="q-card" onClick={onClick}>
            <div className="q-card-header">
                <div className="q-card-author">
                    <i className="fa-solid fa-circle-user"></i>
                    <span>{question.authorName || question.authorId}</span>
                </div>
                <div className="q-card-date">{timeAgo}</div>
            </div>
            
            <h3>{question.title}</h3>
            <p className="q-card-snippet">{question.content}</p>
            
            <div className="q-card-footer">
                <div className="q-card-tags">
                    {question.tags && Array.isArray(question.tags) && 
                        question.tags.map((tag) => (
                            <span key={tag} className="badge-tag">
                                #{tag}
                            </span>
                        ))
                    }
                </div>
                <div className={`q-card-comments ${commentCount > 0 ? "has-comments" : ""}`}>
                    <i className="fa-regular fa-comment-dots"></i>
                    <span>답변 {commentCount}</span>
                </div>
            </div>
        </div>
    );
}
