import React, { useState } from "react";

export default function WriteModal({ isOpen, onClose, onSubmit }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tagsText, setTagsText] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // 태그 파싱 (쉼표 구분)
        let tags = [];
        if (tagsText.trim() !== "") {
            tags = tagsText
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0 && t !== "");
        }

        if (title.trim() && content.trim()) {
            onSubmit(title.trim(), content.trim(), tags);
            // 입력창 비우기
            setTitle("");
            setContent("");
            setTagsText("");
        }
    };

    return (
        <div className="modal active" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3>
                        <i className="fa-solid fa-pen-to-square"></i> 새로운 질문 올리기
                    </h3>
                    <button className="btn-close" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <form id="write-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="q-title">질문 제목</label>
                        <input
                            type="text"
                            id="q-title"
                            placeholder="무엇이 궁금한가요? 핵심 내용을 한 줄로 적어주세요."
                            required
                            maxLength={50}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="q-content">질문 내용</label>
                        <textarea
                            id="q-content"
                            rows="6"
                            placeholder="이해하기 어려운 문제나 개념을 자세히 적어주세요. 예) '수학 익힘책 14쪽 3번 문제 풀이 과정이 이해가 안 돼요 ㅜㅜ'"
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="q-tags">키워드 태그 (쉼표로 구분)</label>
                        <input
                            type="text"
                            id="q-tags"
                            placeholder="예) 수학, 어림하기, 1단원 (최대 3개 권장)"
                            value={tagsText}
                            onChange={(e) => setTagsText(e.target.value)}
                        />
                        <small className="form-help">쉼표(,)를 사용해서 여러 개의 태그를 넣을 수 있습니다.</small>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            취소
                        </button>
                        <button type="submit" className="btn btn-primary">
                            질문 등록하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
