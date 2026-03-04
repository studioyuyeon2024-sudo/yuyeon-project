import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// 파이어베이스 인증 도구 추가
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const auth = getAuth(app); // 인증 비서 소환

let currentData = [];

// [1] 로그인 처리 함수
window.checkAdmin = async function() {
    const email = document.getElementById('admin-email').value;
    const pw = document.getElementById('admin-password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, pw);
        alert("성공적으로 인증되었습니다.");
    } catch (err) {
        alert("인증 실패: 이메일이나 비밀번호를 확인해 주세요.");
    }
}

// [2] 로그아웃 처리 함수
window.handleLogout = async function() {
    await signOut(auth);
    alert("로그아웃 되었습니다.");
    location.reload();
}

// [3] 로그인 상태 감시 (가장 중요!)
onAuthStateChanged(auth, (user) => {
    const authSection = document.getElementById('auth-section');
    const reportSection = document.getElementById('report-section');
    
    if (user) {
        // 로그인 상태면 리포트 보여주기
        authSection.style.display = 'none';
        reportSection.style.display = 'block';
        updateDashboard(); 
    } else {
        // 로그아웃 상태면 로그인창 보여주기
        authSection.style.display = 'block';
        reportSection.style.display = 'none';
    }
});

// [4] 통계 및 데이터 갱신 함수 (새로고침 기능)
async function updateDashboard() {
    try {
        const querySnapshot = await getDocs(collection(db, "participants"));
        const all = [];
        querySnapshot.forEach(d => all.push({ id: d.id, ...d.data() }));
        currentData = all;

        // 테이블 업데이트
        const listBody = document.getElementById('participant-list');
        listBody.innerHTML = "";
        all.sort((a,b) => a.myId - b.myId).forEach(p => {
            listBody.innerHTML += `<tr><td>${p.myId}</td><td>${p.gender === 'male'?'남':'여'}</td><td>${p.realName}</td><td>${p.phone}</td><td>${p.pickId1||'-'}</td><td>${p.pickId2||'-'}</td><td style="font-size:11px;">${p.review||'-'}</td></tr>`;
        });

        // 매칭 분석
        const males = all.filter(p => p.gender === 'male');
        const females = all.filter(p => p.gender === 'female');
        const matchArea = document.getElementById('final-matches-admin');
        matchArea.innerHTML = "";
        
        let coupleCount = 0;
        const matchedIds = new Set();

        males.forEach(man => {
            const manPicks = [man.pickId1, man.pickId2].filter(id => id);
            females.forEach(woman => {
                const womanPicks = [woman.pickId1, woman.pickId2].filter(id => id);
                if (manPicks.includes(woman.myId) && womanPicks.includes(man.myId)) {
                    coupleCount++;
                    matchedIds.add(man.myId); matchedIds.add(woman.myId);
                    const div = document.createElement('div');
                    div.className = "match-card-admin";
                    div.innerHTML = `<strong>커플 ${coupleCount}</strong>: ${man.myId}번(${man.realName}) ❤️ ${woman.myId}번(${woman.realName}) <br> <small>연락처: ${man.phone} / ${woman.phone}</small>`;
                    matchArea.appendChild(div);
                }
            });
        });

        if(coupleCount === 0) matchArea.innerHTML = "<p style='color:#999;'>매칭된 커플이 없습니다.</p>";

        // 대시보드 수치 갱신
        document.getElementById('stat-total').innerText = `${all.length}명`;
        document.getElementById('stat-gender').innerText = `${males.length} / ${females.length}`;
        document.getElementById('stat-couples').innerText = `${coupleCount}쌍`;
        const rate = all.length > 0 ? Math.round((matchedIds.size / all.length) * 100) : 0;
        document.getElementById('stat-rate').innerText = `${rate}%`;

    } catch (err) { console.error(err); }
}

// [5] 버튼 이벤트 연결
document.getElementById('refresh-btn').onclick = updateDashboard;

document.getElementById('open-btn').onclick = async () => {
    await setDoc(doc(db, "settings", "matching_status"), { is_open: true });
    alert("결과 공개를 승인했습니다!");
};

document.getElementById('close-btn').onclick = async () => {
    await setDoc(doc(db, "settings", "matching_status"), { is_open: false });
    alert("결과 공개를 차단했습니다.");
};

document.getElementById('download-btn').onclick = () => {
    let csv = "\uFEFF번호,성별,이름,연락처,픽1,픽2,후기\n";
    currentData.forEach(p => {
        csv += `${p.myId},${p.gender==='male'?'남':'여'},${p.realName},${p.phone},${p.pickId1||''},${p.pickId2||''},"${(p.review||'').replace(/"/g,'""')}"\n`;
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = "유연_명단.csv"; link.click();
};

document.getElementById('delete-btn').onclick = async () => {
    if(!confirm("모든 데이터를 삭제하시겠습니까?")) return;
    const querySnapshot = await getDocs(collection(db, "participants"));
    await Promise.all(querySnapshot.docs.map(d => deleteDoc(doc(db, "participants", d.id))));
    alert("초기화 완료"); location.reload();
};
