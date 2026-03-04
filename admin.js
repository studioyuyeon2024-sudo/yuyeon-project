import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const auth = getAuth(app);
let currentData = [];

// [핵심] 데이터 내보내기용 2차 비밀번호 (우철님 원하는 대로 수정하세요)
const EXPORT_PASSWORD = "2024"; 

// 특정 이메일 권한 체크 (원할 경우 아래 이메일만 다운로드 가능하게 설정 가능)
const ADMIN_EMAIL_OWNER = "studioyuyeon2024@naver.com"; 

window.checkAdmin = async function() {
    const email = document.getElementById('admin-email').value;
    const pw = document.getElementById('admin-password').value;
    try { await signInWithEmailAndPassword(auth, email, pw); } 
    catch (err) { alert("로그인 실패"); }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('report-section').style.display = 'block';
        updateDashboard();
    }
});

async function updateDashboard() {
    const snap = await getDocs(collection(db, "participants"));
    const all = []; snap.forEach(d => all.push({ id: d.id, ...d.data() }));
    currentData = all;
    
    const listBody = document.getElementById('participant-list');
    listBody.innerHTML = "";
    all.sort((a,b) => a.myId - b.myId).forEach(p => {
        listBody.innerHTML += `<tr><td>${p.myId}</td><td>${p.gender === 'male'?'남':'여'}</td><td>${p.realName}</td><td>${p.phone}</td><td>${p.pickId1||'-'}</td><td>${p.pickId2||'-'}</td></tr>`;
    });

    const males = all.filter(p => p.gender === 'male');
    const females = all.filter(p => p.gender === 'female');
    const matchArea = document.getElementById('final-matches-admin');
    matchArea.innerHTML = "<h3 style='color:#1A237E;'>💖 매칭 커플</h3>";
    
    let coupleCount = 0; let matchedIds = new Set();
    males.forEach(man => {
        const manPicks = [man.pickId1, man.pickId2];
        females.forEach(woman => {
            const womanPicks = [woman.pickId1, woman.pickId2];
            if (manPicks.includes(woman.myId) && womanPicks.includes(man.myId)) {
                coupleCount++; matchedIds.add(man.myId); matchedIds.add(woman.myId);
                matchArea.innerHTML += `<div style='background:#f0f4ff; padding:10px; border-radius:10px; margin-bottom:5px;'>${man.myId}번(${man.realName}) ❤️ ${woman.myId}번(${woman.realName})</div>`;
            }
        });
    });

    document.getElementById('stat-total').innerText = `${all.length}명`;
    document.getElementById('stat-gender').innerText = `${males.length} / ${females.length}`;
    document.getElementById('stat-couples').innerText = `${coupleCount}쌍`;
    document.getElementById('stat-rate').innerText = `${all.length > 0 ? Math.round((matchedIds.size / all.length) * 100) : 0}%`;
}

// 보안 검증 함수
function verifyExport() {
    const input = prompt("🔐 보안 인증: 데이터 내보내기를 위한 2차 비밀번호를 입력하세요.");
    if (input === EXPORT_PASSWORD) return true;
    alert("❌ 비밀번호가 틀렸습니다. 접근 권한이 없습니다.");
    return false;
}

// [1] 현재 명단 저장 (2차 비번 적용)
document.getElementById('download-btn').onclick = () => {
    if (!verifyExport()) return; // 비번 체크

    let csv = "\uFEFF번호,성별,이름,연락처,픽1,픽2\n";
    currentData.forEach(p => csv += `${p.myId},${p.gender === 'male'?'남':'여'},${p.realName},${p.phone},${p.pickId1},${p.pickId2}\n`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = "유연_현재명단.csv"; link.click();
};

// [2] 백업 데이터 다운로드 (2차 비번 적용)
document.getElementById('download-archive-btn').onclick = async () => {
    if (!verifyExport()) return; // 비번 체크

    try {
        const snap = await getDocs(collection(db, "archive"));
        const archiveData = []; snap.forEach(d => archiveData.push(d.data()));
        archiveData.sort((a,b) => (a.batchName > b.batchName ? 1 : -1));
        let csv = "\uFEFF기수,번호,성별,이름,연락처,픽1,픽2,후기\n";
        archiveData.forEach(p => csv += `${p.batchName},${p.myId},${p.gender},${p.realName},${p.phone},${p.pickId1},${p.pickId2},"${p.review||''}"\n`);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        link.download = "유연_전체백업.csv"; link.click();
    } catch (e) { alert("오류: " + e.message); }
};

// [3] 결과 공개 확인
document.getElementById('open-btn').onclick = async () => {
    if (!confirm("정말로 매칭 결과를 공개하시겠습니까?")) return;
    await setDoc(doc(db, "settings", "matching_status"), { is_open: true });
    alert("공개 완료");
};

document.getElementById('close-btn').onclick = async () => {
    if (!confirm("결과 공개를 차단하시겠습니까?")) return;
    await setDoc(doc(db, "settings", "matching_status"), { is_open: false });
    alert("공개 차단 완료");
};

// 기수 백업 및 초기화
document.getElementById('delete-btn').onclick = async () => {
    const batchName = prompt("백업할 기수 이름을 입력하세요", "유연 132기");
    if (!batchName) return;
    if (confirm(`[${batchName}]로 백업 후 초기화하시겠습니까?`)) {
        try {
            const backupPromises = currentData.map(p => {
                const { id, ...pureData } = p;
                return setDoc(doc(db, "archive", `${batchName}_${p.phone}`), { ...pureData, batchName, archivedAt: new Date() });
            });
            await Promise.all(backupPromises);
            const snap = await getDocs(collection(db, "participants"));
            await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "participants", d.id))));
            alert("백업 및 초기화 완료!"); location.reload();
        } catch (e) { alert("오류: " + e.message); }
    }
};

document.getElementById('refresh-btn').onclick = updateDashboard;
