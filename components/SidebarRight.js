import React from "react";

export default function SidebarRight() {
    return (
        <aside class="sidebar right-sidebar" id="announcements-panel">
            <div class="panel-header">
                <h2>
                    <i class="fa-solid fa-bullhorn"></i> 공지사항
                </h2>
            </div>
            <div class="panel-content">
                <div class="notice-card highlight">
                    <div class="notice-meta">
                        <span class="notice-badge">필독</span>
                        <span class="notice-date">오늘</span>
                    </div>
                    <h3>서로 가르쳐주며 함께 성장해요!</h3>
                    <p>모르는 문제는 언제든 물어보고, 아는 문제는 댓글로 친구에게 친절하게 설명해 주세요. 가르쳐주면서 나의 복습도 완벽해집니다!</p>
                </div>

                <div class="notice-card">
                    <div class="notice-meta">
                        <span class="notice-date">2026.05.17</span>
                    </div>
                    <h3>바르고 고운 말을 사용합시다</h3>
                    <p>서로 존중하며 따뜻한 배움의 공간을 만들어요. 비방이나 장난 섞인 글은 삼가해 주세요.</p>
                </div>

                <div class="notice-card">
                    <div class="notice-meta">
                        <span class="notice-date">2026.05.15</span>
                    </div>
                    <h3>이번 주 수학 1단원 퀴즈 대비</h3>
                    <p>수학 1단원 '수의 범위와 어림하기'에 대해 헷갈리는 문제는 여기에 질문 카드를 올려 친구들과 토론해 보세요.</p>
                </div>
            </div>
        </aside>
    );
}
