import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCy0qWrPE_aQGaKjJXIM_vgU8oO5Wq9mOI",
  authDomain: "my-dating-service.firebaseapp.com",
  projectId: "my-dating-service",
  storageBucket: "my-dating-service.firebasestorage.app",
  messagingSenderId: "231488184905",
  appId: "1:231488184905:web:d49b3e4f0ef35e524e5598"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let currentData = [];

// [로그인 체크]
window.checkAdmin = function() {
    const pw = document.getElementById('admin-password').value;
    if(pw === "dbdus2024") {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('report-section').style.display = 'block';
        updateDashboard(); // 로그인 성공 시 대시보드 업데이트
    } else {
        alert("비밀번호가 틀렸습니다.");
    }
}

// [핵심 기능: 모든 데이터 불러오기 및 대시보드 갱신]
async function updateDashboard() {
    try {
        const querySnapshot = await getDocs(collection(db, "participants"));
        const all = [];
        querySnapshot.forEach(d => all.push({ id: d.id, ...d.data() }));
        currentData = all;

        // 1. 명단 테이블 업데이트
        const listBody = document.getElementById('participant-list');
        listBody.innerHTML = "";
        all.sort((a,b) => a.myId - b.myId).forEach(p => {
            const tr = `<tr>
                <td>${p.myId}</td>
                <td>${p.gender === 'male' ? '남' : '여'}</td>
                <td>${p.realName}</td>
                <td>${p.phone}</td>
                <td>${p.pickId1 || '-'}</td>
                <td>${p.pickId2 || '-'}</td>
                <td style="font-size: 11px;">${p.review || '-'}</td>
            </tr>`;
            listBody.innerHTML += tr;
        });

        // 2. 매칭 분석 및 통계 계산
        const males = all.filter(p => p.gender === 'male');
        const females = all.filter(p => p.gender === 'female');
        const matchArea = document.getElementById('final-matches-admin');
        matchArea.innerHTML = "";
        
        let coupleCount = 0;
        const matchedPeopleIds = new Set();

        males.forEach(man => {
            const manPicks = [man.pickId1, man.pickId2].filter(id => id);
            females.forEach(woman => {
                const womanPicks = [woman.pickId1, woman.pickId2].filter(id => id);
                
                // 서로 선택했는지 확인
                if (manPicks.includes(woman.myId) && womanPicks.includes(man.myId)) {
                    coupleCount++;
                    matchedPeopleIds.add(man.myId);
                    matchedPeopleIds.add(woman.myId);
                    
                    const div = document.createElement('div');
                    div.className = "match-card-admin";
                    div.innerHTML = `<strong>커플 ${coupleCount}</strong>: ${man.myId}번(${man.realName}) ❤️ ${woman.myId}번(${woman.realName}) <br> <small>연락처: ${man.phone} / ${woman.phone}</small>`;
                    matchArea.appendChild(div);
                }
            });
        });

        if(coupleCount === 0) matchArea.innerHTML = "<p style='color:#999;'>아직 매칭된 커플이 없습니다.</p>";

        // 3. 상단 통계 수치 업데이트
        document.getElementById('stat-total').innerText = `${all.length}명`;
        document.getElementById('stat-gender').innerText = `${males.length} / ${females.length}`;
        document.getElementById('stat-couples').innerText = `${coupleCount}쌍`;
        
        const rate = all.length > 0 ? Math.round((matchedPeopleIds.size / all.length) * 100) : 0;
        document.getElementById('stat-rate').innerText = `${rate}%`;

    } catch (err) {
        alert("데이터 갱신 중 오류: " + err.message);
    }
}

// [버튼 이벤트 연결]
document.getElementById('refresh-btn').onclick = updateDashboard; // 새로고침 버튼 작동

document.getElementById('open-btn').onclick = async () => {
    await setDoc(doc(db, "settings", "matching_status"), { is_open: true });
    alert("결과 공개를 승인했습니다!");
};

document.getElementById('close-btn').onclick = async () => {
    await setDoc(doc(db, "settings", "matching_status"), { is_open: false });
    alert("결과 공개를 차단했습니다.");
};

document.getElementById('download-btn').onclick = () => {
    if(currentData.length === 0) return alert("데이터가 없습니다.");
    let csv = "\uFEFF번호,성별,이름,연락처,픽1,픽2,후기\n";
    currentData.forEach(p => {
        csv += `${p.myId},${p.gender === 'male' ? '남' : '여'},${p.realName},${p.phone},${p.pickId1 || ''},${p.pickId2 || ''},"${(p.review || '').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `스튜디오유연_명단_${new Date().toLocaleDateString()}.csv`;
    link.click();
};

document.getElementById('delete-btn').onclick = async () => {
    if(!confirm("정말로 모든 데이터를 삭제하시겠습니까? (복구 불가)")) return;
    const querySnapshot = await getDocs(collection(db, "participants"));
    await Promise.all(querySnapshot.docs.map(d => deleteDoc(doc(db, "participants", d.id))));
    alert("전체 데이터가 초기화되었습니다.");
    location.reload();
};
