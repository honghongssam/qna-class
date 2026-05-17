import React from "react";

export default function SidebarLeft({ tags, selectedTag, onSelectTag }) {
    return (
        <aside class="sidebar left-sidebar" id="keywords-panel">
            <div class="panel-header">
                <h2>
                    <i class="fa-solid fa-hashtag"></i> 키워드 태그
                </h2>
            </div>
            <div class="panel-content">
                {/* 전체보기 버튼 */}
                <button 
                    className={`tag-btn ${selectedTag === "all" ? "active" : ""}`}
                    onClick={() => onSelectTag("all")}
                >
                    <span class="tag-hash">#</span> 전체보기
                </button>

                {/* 동적 생성 태그 리스트 */}
                <div class="tag-list" style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                    {tags.length === 0 ? (
                        <div class="tag-loading">태그 없음</div>
                    ) : (
                        tags.map((tag) => (
                            <button
                                key={tag}
                                className={`tag-btn ${selectedTag === tag ? "active" : ""}`}
                                onClick={() => onSelectTag(tag)}
                            >
                                <span class="tag-hash">#</span> {tag}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
}
