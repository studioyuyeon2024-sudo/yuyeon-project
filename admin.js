<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yuyeon Admin | 🔐</title>
    <link rel="stylesheet" href="./style.css">
</head>
<body>
    <div class="admin-container">
        <h1 class="serif-title">Admin Dashboard</h1>
        <div id="auth-section" class="card" style="max-width:380px; margin:20px auto;">
            <input type="email" id="admin-email" placeholder="관리자 이메일" style="margin-bottom:10px; width:100%;"><input type="password" id="admin-password" placeholder="비밀번호" style="margin-bottom:15px; width:100%;"><button onclick="checkAdmin()" style="width:100%; padding:15px; background:#1A237E; color:white; border-radius:10px; cursor:pointer;">로그인</button>
        </div>
        <div id="report-section" style="display: none;">
            <div class="bento-grid">
                <div class="bento-card card-large">
                    <div><h4>매칭 성공 커플 💖</h4><p id="stat-couples" style="color:#FF5252; font-size: 42px;">0쌍</p></div>
                    <div id="final-matches-mini" style="margin-top:20px; font-size: 13px; color:#555; text-align: left;"></div>
                </div>
                <div class="bento-card card-medium"><h4>종합 매칭률 📊</h4><p id="stat-rate">0%</p></div>
                <div class="bento-card card-small"><h4>총 참가자 👥</h4><p id="stat-total">0명</p></div>
                <div class="bento-card card-small"><h4>남성 / 여성 ⚖️</h4><p id="stat-gender" style="font-size: 20px;">0 / 0</p></div>
            </div>
            <div class="control-panel">
                <button id="open-btn" style="background:#9b59b6;">🔓 결과 공개</button>
                <button id="close-btn" style="background:#34495e;">🔒 공개 차단</button>
                <button id="download-btn" style="background:#f39c12;">📥 현재 명단</button>
                <button id="download-archive-btn" style="background:#8e44ad;">📂 전체 백업</button>
                <button id="refresh-btn" style="background:#27ae60; grid-column: span 2;">🔄 데이터 새로고침</button>
                <button id="delete-btn" style="background:#e74c3c; grid-column: span 2;">⚠️ 기수 백업 및 초기화</button>
            </div>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr><th>#</th><th>성별</th><th>이름</th><th>연락처</th><th>선택</th><th style="color:#FF5252;">득표 🔥</th><th>참여 후기 📝</th></tr>
                    </thead>
                    <tbody id="participant-list"></tbody>
                </table>
            </div>
        </div>
    </div>
    <script type="module" src="./admin.js"></script>
</body>
</html>
